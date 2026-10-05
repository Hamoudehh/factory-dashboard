const test = require('node:test');
const assert = require('node:assert/strict');
const Airtable = require('../js/airtable.js');
const Seed = require('../js/seed.js');

// In-memory stand-in for the claude.ai Airtable connector, shaped like the real responses:
// records keyed by field id, singleSelect values returned as {id, name, color}, nextCursor paging.
function fakeConnector() {
  const tables = {};
  let seq = 0;
  const calls = [];
  const selects = new Set();
  for (const t of Object.values(Airtable.TABLES)) {
    for (const [fid, kind] of Object.values(t.fields)) if (kind === 'enum') selects.add(fid);
  }
  const rows = (tableId) => (tables[tableId] = tables[tableId] || []);
  const view = (r) => {
    const cells = {};
    for (const [k, v] of Object.entries(r.cells)) {
      if (v == null || v === '' || v === false) continue; // Airtable omits empty cells
      cells[k] = selects.has(k) ? { id: 'sel' + v, name: v, color: 'blueLight2' } : v;
    }
    return { id: r.id, createdTime: '2026-09-26T00:00:00.000Z', cellValuesByFieldId: cells };
  };
  const matches = (r, f) => {
    if (!f) return true;
    const test1 = (o) => r.cells[o.operands[0]] === o.operands[1];
    return f.operator === 'or' ? f.operands.some(test1) : f.operands.every(test1);
  };
  return {
    calls,
    tables,
    async callTool(server, tool, input) {
      assert.equal(server, 'Airtable');
      calls.push(tool);
      const list = rows(input.tableId);
      if (tool === 'list_records_for_table') {
        const all = list.filter((r) => matches(r, input.filters));
        const start = input.cursor ? Number(input.cursor) : 0;
        const size = Math.min(input.pageSize || 100, 40); // force paging in tests
        const page = all.slice(start, start + size).map(view);
        const next = start + size < all.length ? String(start + size) : undefined;
        return { payload: Object.assign({ records: page, metadata: { totalRecordCount: all.length } }, next ? { nextCursor: next } : {}) };
      }
      if (tool === 'update_records_for_table') {
        assert.ok(input.records.length <= 50, 'batch size');
        const key = input.performUpsert.fieldIdsToMergeOn[0];
        const out = input.records.map((rec) => {
          let row = list.find((r) => r.cells[key] === rec.fields[key]);
          if (!row) { row = { id: 'rec' + String(++seq).padStart(14, '0'), cells: {} }; list.push(row); }
          Object.assign(row.cells, rec.fields);
          return view(row);
        });
        return { payload: { records: out } };
      }
      if (tool === 'delete_records_for_table') {
        tables[input.tableId] = list.filter((r) => !input.recordIds.includes(r.id));
        return { payload: { records: input.recordIds.map((id) => ({ id, deleted: true })) } };
      }
      throw Object.assign(new Error('unknown tool'), { code: 'bad_request' });
    },
  };
}

test('record conversion round-trips through Airtable field ids', () => {
  const s = Seed.demoState('2026-09-25');
  for (const coll of Airtable.COLLECTIONS) {
    const rec = s[coll].find((r) => coll !== 'items' || r.productId) || s[coll][0];
    const fields = Airtable.toFields(coll, rec);
    const back = Airtable.fromFields(coll, fields);
    for (const [k, v] of Object.entries(rec)) {
      if (v == null || v === '') continue;
      assert.deepEqual(back[k], v, `${coll}.${k}`);
    }
  }
  // selects come back as objects from Airtable
  const move = Airtable.fromFields('stockMoves', { fldsn2buc3wE6JhJX: { id: 'selx', name: 'ספירה' } });
  assert.equal(move.type, 'count');
});

test('diff finds new, changed and deleted rows, and settings changes', () => {
  const a = Seed.demoState('2026-09-25');
  const b = JSON.parse(JSON.stringify(a));
  b.productionLogs.push({ id: 'l-new', date: '2026-09-25', machineId: 'rondo', productId: 'p-croissant-choc', goodUnits: 10, downtimes: [], workerIds: [] });
  b.workers[0].name = 'שם חדש';
  b.stockMoves.splice(0, 1);
  b.settings.plantName = 'אחר';
  const ops = Airtable.diff(a, b);
  const by = Object.fromEntries(ops.map((o) => [o.coll, o]));
  assert.equal(by.productionLogs.up.length, 1);
  assert.equal(by.workers.up.length, 1);
  assert.equal(by.stockMoves.del.length, 1);
  assert.equal(by.settings.up.length, 1);
  assert.equal(Airtable.diff(a, a).length, 0);
});

test('full upload, pull back, then incremental changes and deletes', async () => {
  const fake = fakeConnector();
  Airtable.setClient(fake);
  const s = Seed.demoState('2026-09-25');
  const empty = { settings: null };
  let sent = 0;
  await Airtable.apply(Airtable.diff(empty, s), (n) => { sent += n; });
  const total = Airtable.COLLECTIONS.reduce((n, c) => n + s[c].length, 0) + 1;
  assert.equal(sent, total);

  const pulled = await Airtable.pull();
  assert.equal(pulled.empty, false);
  for (const c of Airtable.COLLECTIONS) assert.equal(pulled.state[c].length, s[c].length, c);
  assert.deepEqual(pulled.settings, s.settings);
  const log = s.productionLogs[5];
  assert.deepEqual(pulled.state.productionLogs.find((l) => l.id === log.id), log);

  // A second upload of the same rows updates in place, no duplicates.
  const before = fake.tables[Airtable.TABLES.stockMoves.table].length;
  await Airtable.apply([{ coll: 'stockMoves', up: s.stockMoves.slice(0, 60), del: [] }]);
  assert.equal(fake.tables[Airtable.TABLES.stockMoves.table].length, before);

  // Change one report, delete another.
  const next = JSON.parse(JSON.stringify(s));
  next.productionLogs[0].goodUnits = 1;
  const gone = next.productionLogs.pop();
  await Airtable.apply(Airtable.diff(s, next));
  const again = await Airtable.pull();
  assert.equal(again.state.productionLogs.length, s.productionLogs.length - 1);
  assert.equal(again.state.productionLogs.find((l) => l.id === next.productionLogs[0].id).goodUnits, 1);
  assert.ok(!again.state.productionLogs.some((l) => l.id === gone.id));
});

test('delete of a row created on another device looks up its record id first', async () => {
  const fake = fakeConnector();
  Airtable.setClient(fake);
  const row = { id: 'w-remote', name: 'עובד', role: '', hourlyCost: 40, active: true };
  await Airtable.apply([{ coll: 'workers', up: [row], del: [] }]);
  // forget the mapping, as a fresh page load that never pulled would
  Airtable.forget();
  const listsBefore = fake.calls.filter((c) => c === 'list_records_for_table').length;
  const table = fake.tables[Airtable.TABLES.workers.table];
  assert.equal(table.length, 1);
  await Airtable.apply([{ coll: 'workers', up: [], del: ['w-remote'] }]);
  assert.equal(fake.tables[Airtable.TABLES.workers.table].length, 0);
  assert.ok(fake.calls.filter((c) => c === 'list_records_for_table').length > listsBefore, 'looked the record up');
});

test('unsent changes replay on top of Airtable without undoing edits from other devices', () => {
  const base = Seed.demoState('2026-09-25');
  const local = JSON.parse(JSON.stringify(base));
  local.workers[1].name = 'שינוי מקומי';
  local.stockMoves.splice(0, 1);
  local.settings.plantName = 'מקומי';
  const unsent = Airtable.diff(base, local);

  const remote = JSON.parse(JSON.stringify(base));
  remote.workers[0].name = 'שינוי ממכשיר אחר';
  const merged = Airtable.overlay(remote, unsent);
  assert.equal(merged.workers[0].name, 'שינוי ממכשיר אחר');
  assert.equal(merged.workers[1].name, 'שינוי מקומי');
  assert.equal(merged.stockMoves.length, base.stockMoves.length - 1);
  assert.equal(merged.settings.plantName, 'מקומי');
  // only the local changes are sent again
  assert.equal(Airtable.countOps(Airtable.diff(remote, merged)), 3);
});

test('fields added in Airtable itself (like the suppliers link on items) survive a dashboard sync', async () => {
  const fake = fakeConnector();
  Airtable.setClient(fake);
  Airtable.forget();
  const butter = { id: 'i-butter', name: 'חמאה', category: 'raw', unit: 'ק"ג', unitCost: 38, minQty: 160, active: true };
  await Airtable.apply([{ coll: 'items', up: [butter], del: [] }]);
  const row = fake.tables[Airtable.TABLES.items.table][0];
  row.cells.fldSuppliersLink = ['recSupplier1', 'recSupplier2']; // a link field the dashboard does not know

  await Airtable.apply([{ coll: 'items', up: [Object.assign({}, butter, { minQty: 200 })], del: [] }]);
  assert.deepEqual(row.cells.fldSuppliersLink, ['recSupplier1', 'recSupplier2']);
  const pulled = await Airtable.pull();
  assert.equal(pulled.state.items[0].minQty, 200);
  assert.ok(!('fldSuppliersLink' in pulled.state.items[0]));
});

test('init connects through the page runtime, and stays local without it', async () => {
  delete globalThis.claude;
  assert.equal(await Airtable.init(), false);
  const fake = fakeConnector();
  globalThis.claude = { use: async (name) => (name === 'mcp' ? fake : null) };
  try {
    assert.equal(await Airtable.init(), true);
    const pulled = await Airtable.pull();
    assert.equal(pulled.empty, true);
    assert.ok(fake.calls.includes('list_records_for_table'));
  } finally {
    delete globalThis.claude;
  }
});

test('connector errors map to messages the viewer can act on', () => {
  assert.match(Airtable.describeError({ code: 'server_not_connected' }).message, /Connectors/);
  assert.match(Airtable.describeError({ code: 'needs_reauth' }).message, /מחדש/);
  assert.match(Airtable.describeError({ code: 'tool_error', message: 'bad' }).message, /bad/);
  assert.equal(Airtable.describeError({}).code, 'upstream_error');
});
