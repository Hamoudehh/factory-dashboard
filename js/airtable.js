/* Airtable sync through the viewer's claude.ai Airtable connector (artifact `mcp` capability).
   No token lives in this page: calls run with the viewer's own connector credentials.
   Local copies of the page (file:// or localhost) have no connector and keep working from localStorage. */
(function (root, factory) {
  const mod = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.Airtable = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  const SERVER = 'Airtable';
  const BASE_ID = 'appa0VSn54qgGlUkF';
  const BATCH = 50; // connector limit per write call
  const PAUSE_MS = typeof process === 'object' && process.env && process.env.NODE_TEST_CONTEXT ? 0 : 220; // stay under Airtable's 5 requests/second per base

  // kind: text (default) | num | bool | json | list | date | enum
  const TABLES = {
    machines: {
      table: 'tbloLMxVGxiga2Na2',
      fields: {
        id: ['fldfEKT4Tk47uMcCV'], name: ['fldTcix65YT1xvCWl'], ratePerHour: ['fldblQ2tho9BzsUJm', 'num'], active: ['fldXkZWcfXNIgShr3', 'bool'],
      },
    },
    products: {
      table: 'tblmlNfsHT9hHziI6',
      fields: {
        id: ['fldZFPLCKwCPgVrfX'], name: ['fldCnErycmX66eE3J'], machineId: ['flduuWy0z4CcHOOno'],
        unitsPerCarton: ['fldgEbGS8LsfkCEkC', 'num'], dailyDemand: ['fldnkFZkvwg3uKR7w', 'num'],
        price: ['fldEA8oSGquSbxYI2', 'num'], cost: ['fldbnposMPzCVypoO', 'num'], active: ['fldxSNRZyar5Owp7g', 'bool'],
      },
    },
    workers: {
      table: 'tblPwjjPlnvXAVxaj',
      fields: {
        id: ['fldb4AbZezCDGGTLT'], name: ['fldxAM3co2NFMXD3q'], role: ['fld43VtuDabc7QkRU'],
        hourlyCost: ['fldjmtkf3vODKDI7Y', 'num'], active: ['fldMC1soEfvGoTbJ6', 'bool'],
      },
    },
    items: {
      table: 'tblzU7fKHuvpMdeRl',
      fields: {
        id: ['fldhuaXnErw3UsGwH'], name: ['fldPH533Ovs6KTmwm'],
        category: ['fldEYA8l9qSzBxQH4', 'enum', { raw: 'חומר גלם', packaging: 'אריזה', finished: 'מוצר מוגמר' }],
        unit: ['fldokqGIoWg0yCvYs'], unitCost: ['fldtpfMXhMhWduBpr', 'num'], minQty: ['fldW5d4GQo5Ig8LBg', 'num'],
        productId: ['fldt8RLCDijdsCGbN'], active: ['fldG1baqVRSNEXoXz', 'bool'],
      },
    },
    productionLogs: {
      table: 'tbl68KtijRuaMwHy9',
      fields: {
        id: ['fld4mzeogxOHt9XYZ'], date: ['fldHMLRpTwxO1KpRA', 'date'], shift: ['fld2H6tSJ5qhzNSRG'],
        machineId: ['fld9yZaJkt2aVSly3'], productId: ['fldQY6ENmF2b6ipuA'],
        plannedUnits: ['fldgL3v2KTltXtuGh', 'num'], goodUnits: ['fldmsvr9TRw3WoDGh', 'num'], scrapUnits: ['fld2cwpZ4QhnkcrPb', 'num'],
        plannedMinutes: ['fld55TwAwCimyTCmZ', 'num'], downtimes: ['flddvV0MhWb0j2auG', 'json'], workerIds: ['fldbwQfK1f2Yx6tpU', 'list'],
        note: ['fldkVx84l8Yq3zY5n'], createdAt: ['fld5Qt0vpbwLSts4J'],
      },
    },
    attendance: {
      table: 'tblpzJ8W6AUqnSUcy',
      fields: {
        id: ['fldpk1daLlsCQQ7Eo'], batchId: ['flddJE55NrlL0nckL'], date: ['fldJz7GNOB0H2wfWh', 'date'], shift: ['fld67TAjKylH4Nj42'],
        workerId: ['fldEU2Y8LRP5RY7kN'],
        status: ['fld7DZU0KLvccgDYu', 'enum', { present: 'נוכח', absent: 'נעדר', sick: 'מחלה', vacation: 'חופש' }],
        hours: ['fldmMst2iCrn3Ex3k', 'num'], overtimeHours: ['fldN6BjOStvoQHumi', 'num'], machineId: ['fldsOiFs2WdnMp2qm'], createdAt: ['fldG3HGgcoWs2veXz'],
      },
    },
    stockMoves: {
      table: 'tblvBn164sbepEiTs',
      fields: {
        id: ['fldRfqZzo0YXydkZq'], date: ['fldm0Qq3kGqnytlxX', 'date'], itemId: ['fldm5RZun0b6O0PGJ'],
        type: ['fldsn2buc3wE6JhJX', 'enum', { in: 'כניסה', out: 'יציאה', scrap: 'פחת', count: 'ספירה' }],
        qty: ['fld65qGn4mTFa0qHK', 'num'], expectedQty: ['fldqxhXK3dwBqGp1y', 'num'], note: ['fldefxyJTJP9quvi2'], createdAt: ['fldVl5hHjvt3mLBiw'],
      },
    },
    settings: { table: 'tbloqzWgTgW0wnDF9', fields: { id: ['fldZbv9a8TNqWM2Xk'], value: ['fldYrI9koiKOEFAwF'] } },
  };
  const COLLECTIONS = ['machines', 'products', 'workers', 'items', 'productionLogs', 'attendance', 'stockMoves'];
  const MASTER = ['machines', 'products', 'workers', 'items'];

  // ---------- record conversion ----------
  function toFields(coll, rec) {
    const out = {};
    for (const [key, [fid, kind, map]] of Object.entries(TABLES[coll].fields)) {
      const v = rec[key];
      if (kind === 'num') out[fid] = v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v);
      else if (kind === 'bool') out[fid] = v !== false;
      else if (kind === 'json') out[fid] = JSON.stringify(v || []);
      else if (kind === 'list') out[fid] = (v || []).join(',');
      else if (kind === 'enum') out[fid] = (map[v] != null ? map[v] : null);
      else if (kind === 'date') out[fid] = v ? String(v) : null;
      else out[fid] = v == null ? '' : String(v);
    }
    return out;
  }

  function fromFields(coll, cells) {
    const rec = {};
    for (const [key, [fid, kind, map]] of Object.entries(TABLES[coll].fields)) {
      const v = cells[fid];
      if (kind === 'num') rec[key] = v == null || v === '' ? null : Number(v);
      else if (kind === 'bool') rec[key] = v === true;
      else if (kind === 'json') {
        try { rec[key] = v ? JSON.parse(v) : []; } catch (e) { rec[key] = []; }
      } else if (kind === 'list') rec[key] = v ? String(v).split(',').map((x) => x.trim()).filter(Boolean) : [];
      else if (kind === 'enum') {
        const name = v && typeof v === 'object' ? v.name : v;
        rec[key] = Object.keys(map).find((k) => map[k] === name) || null;
      } else if (kind === 'date') rec[key] = v ? String(v).slice(0, 10) : '';
      else rec[key] = v == null ? '' : String(v);
    }
    if (coll === 'items' && !rec.productId) delete rec.productId;
    if (coll === 'stockMoves' && rec.note === '') rec.note = '';
    return rec;
  }

  // ---------- connector plumbing ----------
  let mcp = null;
  const recIds = {}; // coll -> { modelId: airtableRecordId }
  for (const c of COLLECTIONS.concat('settings')) recIds[c] = {};

  const MESSAGES = {
    server_not_connected: 'Airtable לא מחובר לחשבון שלך. הוסף אותו ב-claude.ai ← Settings ← Connectors, ואז רענן את הדף.',
    needs_reauth: 'החיבור ל-Airtable פג. חבר אותו מחדש ב-claude.ai ← Settings ← Connectors, ואז רענן את הדף.',
    not_in_manifest: 'הדף לא קיבל אישור לגשת ל-Airtable. אשר את הגישה כשהדף מבקש, או הפעל אותה בהגדרות ה-Artifact.',
    selection_required: 'יש יותר מחיבור Airtable אחד בחשבון. בחר אחד בחלון שנפתח.',
    blocked_by_policy: 'מדיניות הארגון חוסמת את הגישה ל-Airtable מהדף.',
    approval_required: 'מדיניות הארגון דורשת אישור לכל פעולה ב-Airtable, וזה עדיין לא נתמך בדף.',
    server_unavailable: 'Airtable לא זמין כרגע.',
    consent_required: 'לא אושרה גישה ל-Airtable בדף הזה. בהגדרות לחץ "טען מחדש מ-Airtable" ואשר את הגישה.',
  };
  const OFFLINE_CODES = ['not_granted', 'capability_disabled', 'capability_removed'];

  function describeError(e) {
    const code = (e && e.code) || 'upstream_error';
    if (MESSAGES[code]) return { code, message: MESSAGES[code] };
    if (code === 'tool_error') return { code, message: `Airtable החזיר שגיאה: ${e.message || ''}` };
    return { code, message: `שגיאה בחיבור ל-Airtable: ${(e && e.message) || code}` };
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function call(tool, input, isRead) {
    try {
      const res = await mcp.callTool(SERVER, tool, input, isRead ? undefined : { cache: false });
      if (res && res.payload != null) return res.payload;
      const text = res && res.content && res.content[0] && res.content[0].text;
      return text ? JSON.parse(text) : res;
    } catch (e) {
      // One retry for reads the runtime marks retryable. Writes never retry on their own.
      if (isRead && e && e.retryable) {
        await sleep((e.retryAfterMs || 1500) + Math.random() * 500);
        const res = await mcp.callTool(SERVER, tool, input);
        return res.payload != null ? res.payload : res;
      }
      throw e;
    }
  }

  // Resolves true when this view can reach connectors (the claude.ai artifact viewer).
  async function init() {
    if (!root.claude || typeof root.claude.use !== 'function') return false;
    try {
      mcp = await root.claude.use('mcp');
    } catch (e) {
      mcp = null;
    }
    return !!mcp;
  }

  function setClient(client) { mcp = client; } // tests inject a fake connector
  function forget() { for (const c of Object.keys(recIds)) recIds[c] = {}; } // as after a fresh page load

  async function listAll(coll) {
    const out = [];
    let cursor;
    for (let page = 0; page < 200; page++) {
      const input = { baseId: BASE_ID, tableId: TABLES[coll].table, pageSize: 1000 };
      if (cursor) input.cursor = cursor;
      const p = await call('list_records_for_table', input, true);
      for (const r of p.records || []) out.push(r);
      cursor = p.nextCursor || (p.metadata && p.metadata.nextCursor);
      if (!cursor) break;
    }
    return out;
  }

  // Everything in the base, as dashboard collections.
  async function pull() {
    const state = {};
    let total = 0;
    for (const coll of COLLECTIONS) {
      const rows = await listAll(coll);
      recIds[coll] = {};
      const seen = new Map();
      for (const r of rows) {
        const rec = fromFields(coll, r.cellValuesByFieldId || r.fields || {});
        if (!rec.id) continue;
        recIds[coll][rec.id] = r.id;
        seen.set(rec.id, rec);
      }
      state[coll] = [...seen.values()];
      total += state[coll].length;
    }
    const settingsRows = await listAll('settings');
    let settings = null;
    for (const r of settingsRows) {
      const rec = fromFields('settings', r.cellValuesByFieldId || r.fields || {});
      recIds.settings[rec.id] = r.id;
      if (rec.id === 'settings') {
        try { settings = JSON.parse(rec.value); } catch (e) { settings = null; }
      }
    }
    return { state, settings, empty: total === 0 && !settings };
  }

  async function upsert(coll, records, onProgress) {
    const idField = TABLES[coll].fields.id[0];
    for (let i = 0; i < records.length; i += BATCH) {
      const chunk = records.slice(i, i + BATCH);
      const p = await call('update_records_for_table', {
        baseId: BASE_ID,
        tableId: TABLES[coll].table,
        records: chunk.map((r) => ({ fields: toFields(coll, r) })),
        performUpsert: { fieldIdsToMergeOn: [idField] },
        typecast: true,
      });
      for (const row of (p && p.records) || []) {
        const cells = row.cellValuesByFieldId || row.fields || {};
        if (cells[idField]) recIds[coll][cells[idField]] = row.id;
      }
      if (onProgress) onProgress(chunk.length);
      await sleep(PAUSE_MS);
    }
  }

  // Record ids we never saw (made on another device) are looked up by the dashboard id first.
  async function findRecIds(coll, ids) {
    const idField = TABLES[coll].fields.id[0];
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      const p = await call('list_records_for_table', {
        baseId: BASE_ID,
        tableId: TABLES[coll].table,
        fieldIds: [idField],
        filters: { operator: 'or', operands: chunk.map((id) => ({ operator: '=', operands: [idField, id] })) },
      }, true);
      for (const row of (p && p.records) || []) {
        const cells = row.cellValuesByFieldId || row.fields || {};
        if (cells[idField]) recIds[coll][cells[idField]] = row.id;
      }
    }
  }

  async function remove(coll, ids, onProgress) {
    const missing = ids.filter((id) => !recIds[coll][id]);
    if (missing.length) await findRecIds(coll, missing);
    const rids = ids.map((id) => recIds[coll][id]).filter(Boolean);
    for (let i = 0; i < rids.length; i += BATCH) {
      const chunk = rids.slice(i, i + BATCH);
      await call('delete_records_for_table', { baseId: BASE_ID, tableId: TABLES[coll].table, recordIds: chunk });
      for (const id of ids) if (chunk.includes(recIds[coll][id])) delete recIds[coll][id];
      if (onProgress) onProgress(chunk.length);
      await sleep(PAUSE_MS);
    }
  }

  // What changed between two dashboard states, per table.
  function diff(before, after) {
    const ops = [];
    for (const coll of COLLECTIONS) {
      const b = new Map(((before && before[coll]) || []).map((r) => [r.id, JSON.stringify(r)]));
      const a = new Set(((after && after[coll]) || []).map((r) => r.id));
      const up = ((after && after[coll]) || []).filter((r) => b.get(r.id) !== JSON.stringify(r));
      const del = [...b.keys()].filter((id) => !a.has(id));
      if (up.length || del.length) ops.push({ coll, up, del });
    }
    const sb = JSON.stringify((before && before.settings) || null);
    const sa = JSON.stringify((after && after.settings) || null);
    if (after && after.settings && sb !== sa) ops.push({ coll: 'settings', up: [{ id: 'settings', value: sa }], del: [] });
    return ops;
  }

  const countOps = (ops) => ops.reduce((n, o) => n + o.up.length + o.del.length, 0);

  // Replays unsent changes on top of what Airtable holds, leaving every other record as Airtable has it.
  function overlay(state, ops) {
    const next = JSON.parse(JSON.stringify(state));
    for (const op of ops) {
      if (op.coll === 'settings') {
        for (const r of op.up) {
          try { if (r.id === 'settings') next.settings = JSON.parse(r.value); } catch (e) { /* keep Airtable's */ }
        }
        continue;
      }
      const byId = new Map((next[op.coll] || []).map((r) => [r.id, r]));
      for (const r of op.up) byId.set(r.id, r);
      for (const id of op.del) byId.delete(id);
      next[op.coll] = [...byId.values()];
    }
    return next;
  }

  // Master lists first, so a report never lands in Airtable before its product.
  const ORDER = ['settings'].concat(MASTER, ['productionLogs', 'attendance', 'stockMoves']);

  async function apply(ops, onProgress) {
    const sorted = ops.slice().sort((x, y) => ORDER.indexOf(x.coll) - ORDER.indexOf(y.coll));
    for (const op of sorted) if (op.up.length) await upsert(op.coll, op.up, onProgress);
    for (const op of sorted.slice().reverse()) if (op.del.length) await remove(op.coll, op.del, onProgress);
  }

  // Writes run one at a time, in order.
  let chain = Promise.resolve();
  function enqueue(job) {
    const run = chain.then(job, job);
    chain = run.catch(() => {});
    return run;
  }

  return {
    SERVER, BASE_ID, TABLES, COLLECTIONS, MASTER,
    init, setClient, forget, pull, diff, countOps, overlay, apply, enqueue, describeError, OFFLINE_CODES,
    toFields, fromFields,
    baseUrl: `https://airtable.com/${BASE_ID}`,
  };
});
