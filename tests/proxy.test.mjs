// The GitHub Pages path: dashboard -> Cloudflare Worker (worker/airtable-proxy.mjs) -> Airtable REST API.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import worker from '../worker/airtable-proxy.mjs';

const require = createRequire(import.meta.url);
const Airtable = require('../js/airtable.js');
const Seed = require('../js/seed.js');

const ORIGIN = 'https://hamoudehh.github.io';
const ENV = { AIRTABLE_TOKEN: 'test-token', DASHBOARD_PASSWORD: 'test-pass', ALLOWED_ORIGIN: ORIGIN };

// In-memory Airtable REST API with its real limits: 100 records per page, 10 per write,
// fields keyed by field id, select values as plain strings, empty cells omitted.
function fakeRest() {
  const tables = {};
  const seen = { auth: [], writes: 0 };
  let seq = 0;
  const rows = (t) => (tables[t] = tables[t] || []);
  const clean = (fields) => Object.fromEntries(Object.entries(fields).filter(([, v]) => v != null && v !== '' && v !== false));
  const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  async function handle(request) {
    seen.auth.push(request.headers.get('Authorization'));
    if (request.headers.get('Authorization') !== 'Bearer test-token') return reply(401, { error: { type: 'AUTHENTICATION_REQUIRED' } });
    const url = new URL(request.url);
    const [, , , tableId] = url.pathname.split('/');
    const list = rows(tableId);
    if (request.method === 'GET') {
      const size = Number(url.searchParams.get('pageSize') || 100);
      if (size > 100) return reply(422, { error: { type: 'INVALID_REQUEST', message: 'pageSize' } });
      const start = Number(url.searchParams.get('offset') || 0);
      const only = url.searchParams.getAll('fields[]');
      const page = list.slice(start, start + size).map((r) => ({
        id: r.id, createdTime: r.createdTime,
        fields: only.length ? Object.fromEntries(Object.entries(r.fields).filter(([k]) => only.includes(k))) : r.fields,
      }));
      return reply(200, Object.assign({ records: page }, start + size < list.length ? { offset: String(start + size) } : {}));
    }
    if (request.method === 'PATCH') {
      const body = await request.json();
      if (body.records.length > 10) return reply(422, { error: { type: 'INVALID_RECORDS', message: 'max 10' } });
      seen.writes += 1;
      const key = body.performUpsert.fieldsToMergeOn[0];
      const out = body.records.map((rec) => {
        let row = list.find((r) => r.fields[key] === rec.fields[key]);
        if (!row) { row = { id: `rec${String(++seq).padStart(14, '0')}`, createdTime: '2026-10-07T00:00:00.000Z', fields: {} }; list.push(row); }
        row.fields = clean(Object.assign({}, row.fields, rec.fields));
        return row;
      });
      return reply(200, { records: out });
    }
    if (request.method === 'DELETE') {
      const ids = url.searchParams.getAll('records[]');
      if (ids.length > 10) return reply(422, { error: { type: 'INVALID_REQUEST', message: 'max 10' } });
      tables[tableId] = list.filter((r) => !ids.includes(r.id));
      return reply(200, { records: ids.map((id) => ({ id, deleted: true })) });
    }
    return reply(405, {});
  }
  return { tables, seen, handle };
}

// The browser sends Origin on its own; here the test adds it.
function viaWorker(env = ENV, origin = ORIGIN) {
  return (url, opts) => worker.fetch(new Request(url, Object.assign({}, opts, { headers: Object.assign({ Origin: origin }, opts.headers) })), env);
}

function withAirtable(fake, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = (url, init) => fake.handle(new Request(url, init));
  return Promise.resolve(fn()).finally(() => { globalThis.fetch = real; });
}

const tableUrl = (table) => `https://proxy.example/v0/appa0VSn54qgGlUkF/${table}`;

test('worker: password, origin, base and table checks', async () => {
  const fake = fakeRest();
  await withAirtable(fake, async () => {
    const call = (opts, env, origin) => viaWorker(env, origin)(opts.url || tableUrl(Airtable.TABLES.items.table), Object.assign({ method: 'GET', headers: { 'X-Dashboard-Key': 'test-pass' } }, opts));

    const pre = await worker.fetch(new Request(tableUrl(Airtable.TABLES.items.table), { method: 'OPTIONS', headers: { Origin: ORIGIN } }), ENV);
    assert.equal(pre.status, 204);
    assert.equal(pre.headers.get('Access-Control-Allow-Origin'), ORIGIN);

    assert.equal((await call({}, ENV, 'https://evil.example')).status, 403);
    assert.equal((await call({ headers: {} })).status, 401);
    assert.equal((await call({ headers: { 'X-Dashboard-Key': 'wrong' } })).status, 401);
    assert.equal((await call({ url: 'https://proxy.example/v0/appOtherBase000000/tblzU7fKHuvpMdeRl' })).status, 404);
    assert.equal((await call({ url: 'https://proxy.example/v0/appa0VSn54qgGlUkF/tblNotOurTable0000' })).status, 404);
    assert.equal((await call({ url: tableUrl(Airtable.SUPPLIERS.table) })).status, 200, 'suppliers can be read');
    assert.equal((await call({ url: tableUrl(Airtable.SUPPLIERS.table), method: 'PATCH', body: '{}' })).status, 404, 'but not written');
    assert.equal((await call({}, { DASHBOARD_PASSWORD: 'x', ALLOWED_ORIGIN: ORIGIN })).status, 500);

    const ok = await call({});
    assert.equal(ok.status, 200);
    assert.ok(fake.seen.auth.every((h) => h === 'Bearer test-token'), 'the token only travels from the Worker to Airtable');
  });
});

test('dashboard through the worker: full upload, pull, change and delete', async () => {
  const fake = fakeRest();
  await withAirtable(fake, async () => {
    assert.equal(await Airtable.init({ proxyUrl: 'https://proxy.example/', proxyKey: 'test-pass', fetch: viaWorker() }), true);
    assert.equal(Airtable.transport, 'proxy');
    Airtable.forget();

    const s = Seed.demoState('2026-10-07');
    await Airtable.apply(Airtable.diff({ settings: null }, s));
    const total = Airtable.COLLECTIONS.reduce((n, c) => n + s[c].length, 0) + 1;
    assert.equal(Object.values(fake.tables).reduce((n, t) => n + t.length, 0), total);
    assert.ok(fake.seen.writes >= Math.ceil(total / 10), 'writes go in batches of up to 10');

    const pulled = await Airtable.pull();
    for (const c of Airtable.COLLECTIONS) assert.equal(pulled.state[c].length, s[c].length, c);
    assert.deepEqual(pulled.settings, s.settings);
    assert.deepEqual(pulled.state.productionLogs.find((l) => l.id === s.productionLogs[7].id), s.productionLogs[7]);
    assert.deepEqual(pulled.state.stockMoves.find((m) => m.type === 'count'), s.stockMoves.find((m) => m.type === 'count'));

    const next = JSON.parse(JSON.stringify(s));
    next.workers[0].name = 'שם חדש';
    const gone = next.stockMoves.splice(0, 12); // more than one delete request
    Airtable.forget(); // record ids unknown, as on another device: found by lookup
    await Airtable.apply(Airtable.diff(s, next));
    const again = await Airtable.pull();
    assert.equal(again.state.workers.find((w) => w.id === next.workers[0].id).name, 'שם חדש');
    assert.equal(again.state.stockMoves.length, s.stockMoves.length - 12);
    assert.ok(!again.state.stockMoves.some((m) => gone.some((g) => g.id === m.id)));
  });
});

test('wrong password is reported as such', async () => {
  const fake = fakeRest();
  await withAirtable(fake, async () => {
    await Airtable.init({ proxyUrl: 'https://proxy.example', proxyKey: 'wrong', fetch: viaWorker() });
    await assert.rejects(Airtable.pull(), (e) => e.code === 'proxy_auth' && /שגויה/.test(Airtable.describeError(e).message));
  });
});

test('a bad token in Cloudflare is reported as a token problem, not a password problem', async () => {
  const fake = fakeRest();
  await withAirtable(fake, async () => {
    await Airtable.init({ proxyUrl: 'https://proxy.example', proxyKey: 'test-pass', fetch: viaWorker(Object.assign({}, ENV, { AIRTABLE_TOKEN: 'old' })) });
    await assert.rejects(Airtable.pull(), (e) => e.code === 'proxy_token');
  });
});

test('suppliers through the worker: select values as text, links as record ids', async () => {
  const fake = fakeRest();
  await withAirtable(fake, async () => {
    await Airtable.init({ proxyUrl: 'https://proxy.example', proxyKey: 'test-pass', fetch: viaWorker() });
    Airtable.forget();
    await Airtable.apply([{ coll: 'items', up: [{ id: 'i-butter', name: 'חמאה', category: 'raw', unit: 'ק"ג', unitCost: 38, minQty: 160, active: true }], del: [] }]);
    const butterRec = fake.tables[Airtable.TABLES.items.table][0].id;
    const F = Airtable.SUPPLIERS.fields;
    fake.tables[Airtable.SUPPLIERS.table] = [{ id: 'recSup00000000001', createdTime: '', fields: { [F.name]: 'מחלבה', [F.status]: 'מתאים', [F.type]: 'סיטונאי / מפיץ', [F.items]: [butterRec], [F.sheets]: true } }];
    await Airtable.pull();
    const [sup] = await Airtable.pullSuppliers();
    assert.equal(sup.status, 'מתאים');
    assert.deepEqual(sup.itemIds, ['i-butter']);
    assert.equal(sup.sheets, true);
  });
});

test('outside claude.ai, no proxy settings means no connection', async () => {
  assert.equal(await Airtable.init({}), false);
  assert.equal(await Airtable.init({ proxyUrl: 'https://proxy.example' }), false, 'a password is required');
  assert.equal(Airtable.transport, null);
});
