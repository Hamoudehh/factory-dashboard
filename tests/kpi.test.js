const test = require('node:test');
const assert = require('node:assert/strict');
const KPI = require('../js/kpi.js');
const Seed = require('../js/seed.js');
const Store = require('../js/store.js');

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('OEE of a single shift', () => {
  const log = {
    machineId: 'rondo', plannedMinutes: 480, plannedUnits: 4000, goodUnits: 3800, scrapUnits: 100,
    downtimes: [{ reason: 'breakdown', minutes: 40 }, { reason: 'cleaning', minutes: 20 }],
  };
  const s = KPI.productionSummary([log], { rondo: 600 });
  close(s.A, 420 / 480);
  close(s.P, 3900 / (600 * 7));
  close(s.Q, 3800 / 3900);
  close(s.oee, 0.875 * (3900 / 4200) * (3800 / 3900));
  close(s.oee, 0.7917);
  close(s.scrapRate, 100 / 3900);
  close(s.adherence, 0.95);
  assert.equal(s.breakdowns, 1);
  close(s.mttr, 40);
  close(s.mtbfHours, 7);
  assert.deepEqual(s.downByReason, { breakdown: 40, cleaning: 20 });
});

test('performance is capped at 100%', () => {
  const s = KPI.productionSummary([{ machineId: 'm', plannedMinutes: 60, goodUnits: 200, scrapUnits: 0, downtimes: [] }], { m: 100 });
  assert.equal(s.P, 1);
});

test('plant OEE uses each machine ideal rate, not an average of percentages', () => {
  const logs = [
    { machineId: 'a', plannedMinutes: 60, goodUnits: 100, scrapUnits: 0, downtimes: [] },
    { machineId: 'b', plannedMinutes: 60, goodUnits: 500, scrapUnits: 0, downtimes: [] },
  ];
  const s = KPI.productionSummary(logs, { a: 100, b: 1000 });
  close(s.P, 600 / 1100);
});

test('empty input returns null ratios', () => {
  const s = KPI.productionSummary([], {});
  assert.equal(s.oee, null);
  assert.equal(s.A, null);
});

test('labor cost counts overtime at 125%', () => {
  const row = { status: 'present', hours: 8, overtimeHours: 2 };
  assert.equal(KPI.laborCost(row, 50, 1.25), 8 * 50 + 2 * 50 * 1.25);
  assert.equal(KPI.laborCost({ status: 'sick', hours: 8, overtimeHours: 0 }, 50, 1.25), 0);
});

test('attendance rate excludes vacation', () => {
  const rows = ['present', 'present', 'present', 'sick', 'vacation'].map((status) => ({ status, hours: 8, overtimeHours: 0 }));
  close(KPI.attendanceSummary(rows).rate, 3 / 4);
});

test('worker output is split evenly between workers on a log', () => {
  const workers = [{ id: 'x', name: 'X', hourlyCost: 40 }, { id: 'y', name: 'Y', hourlyCost: 40 }];
  const att = [
    { workerId: 'x', status: 'present', hours: 8, overtimeHours: 0 },
    { workerId: 'y', status: 'present', hours: 8, overtimeHours: 0 },
  ];
  const logs = [{ goodUnits: 1000, workerIds: ['x', 'y'] }];
  const w = KPI.workerSummary(att, logs, workers, 1.25);
  assert.equal(w.rows[0].units, 500);
  close(w.rows[0].unitsPerHour, 62.5);
  close(w.costPerUnit, 640 / 1000);
});

test('stock: last count + movements, count is end-of-day, production feeds finished goods', () => {
  const item = { id: 'f1', productId: 'p1' };
  const moves = [
    { itemId: 'f1', date: '2026-09-01', type: 'count', qty: 100 },
    { itemId: 'f1', date: '2026-09-02', type: 'out', qty: 30 },
    { itemId: 'f1', date: '2026-09-02', type: 'scrap', qty: 5 },
    { itemId: 'f1', date: '2026-09-03', type: 'count', qty: 50 },
    { itemId: 'f1', date: '2026-09-03', type: 'in', qty: 999 },
    { itemId: 'other', date: '2026-09-03', type: 'in', qty: 7 },
  ];
  const logs = [
    { productId: 'p1', date: '2026-09-02', goodUnits: 40 },
    { productId: 'p2', date: '2026-09-02', goodUnits: 1000 },
  ];
  assert.equal(KPI.itemStock(item, moves, logs, '2026-09-02'), 105);
  assert.equal(KPI.itemStock(item, moves, logs, '2026-09-03'), 50);
});

test('days of cover and below-min flag', () => {
  const items = [{ id: 'r', category: 'raw', minQty: 100, unitCost: 2 }];
  const moves = [{ itemId: 'r', date: '2026-09-01', type: 'count', qty: 200 }];
  for (let i = 0; i < 14; i++) moves.push({ itemId: 'r', date: KPI.addDays('2026-09-02', i), type: 'out', qty: 10 });
  const inv = KPI.inventorySummary(items, moves, [], '2026-09-15', 14);
  const row = inv.rows[0];
  assert.equal(row.qty, 60);
  close(row.avgDaily, 10);
  close(row.daysCover, 6);
  assert.equal(row.belowMin, true);
  assert.equal(inv.totalValue, 120);
});

test('count accuracy', () => {
  const moves = [
    { type: 'count', qty: 98, expectedQty: 100 },
    { type: 'count', qty: 100, expectedQty: 100 },
    { type: 'count', qty: 5, expectedQty: null },
  ];
  close(KPI.countAccuracy(moves), 0.99);
  assert.equal(KPI.countAccuracy([]), null);
});

test('periods and previous period', () => {
  assert.deepEqual(KPI.periodRange('7', '2026-09-25'), { from: '2026-09-19', to: '2026-09-25' });
  assert.deepEqual(KPI.periodRange('1', '2026-09-25'), { from: '2026-09-25', to: '2026-09-25' });
  assert.deepEqual(KPI.previousRange({ from: '2026-09-19', to: '2026-09-25' }), { from: '2026-09-12', to: '2026-09-18' });
  assert.deepEqual(KPI.periodRange('custom', 'x', { from: '2026-09-10', to: '2026-09-01' }), { from: '2026-09-01', to: '2026-09-10' });
  assert.equal(KPI.dateList('2026-02-27', '2026-03-02').length, 4);
});

test('status thresholds', () => {
  assert.equal(KPI.statusHigh(0.9, 0.85, 0.65), 'good');
  assert.equal(KPI.statusHigh(0.7, 0.85, 0.65), 'warn');
  assert.equal(KPI.statusHigh(0.5, 0.85, 0.65), 'crit');
  assert.equal(KPI.statusLow(0.02, 0.03, 0.05), 'good');
  assert.equal(KPI.statusLow(0.06, 0.03, 0.05), 'crit');
  assert.equal(KPI.statusHigh(null, 1, 0), 'none');
});

test('demo data is deterministic, consistent and realistic', () => {
  const a = Seed.demoState('2026-09-25');
  const b = Seed.demoState('2026-09-25');
  assert.deepEqual(a.productionLogs, b.productionLogs);
  const ids = (arr) => new Set(arr.map((x) => x.id));
  const machines = ids(a.machines);
  const products = ids(a.products);
  const workers = ids(a.workers);
  const items = ids(a.items);
  assert.equal(machines.size, 4);
  for (const l of a.productionLogs) {
    assert.ok(machines.has(l.machineId));
    assert.ok(products.has(l.productId));
    l.workerIds.forEach((w) => assert.ok(workers.has(w)));
    assert.ok(l.date <= '2026-09-25');
    assert.notEqual(KPI.parseISO(l.date).getDay(), 6, 'no production on Saturday');
  }
  a.stockMoves.forEach((m) => assert.ok(items.has(m.itemId)));
  const rate = Object.fromEntries(a.machines.map((m) => [m.id, m.ratePerHour]));
  for (const m of a.machines) {
    const s = KPI.productionSummary(a.productionLogs.filter((l) => l.machineId === m.id), rate);
    assert.ok(s.oee > 0.5 && s.oee < 0.95, `${m.id} OEE ${s.oee}`);
  }
  const inv = KPI.inventorySummary(a.items, a.stockMoves, a.productionLogs, '2026-09-25', 14);
  inv.rows.forEach((r) => assert.ok(r.qty >= 0, `${r.name} negative stock`));
  assert.ok(inv.belowMin.some((r) => r.id === 'i-chocolate'), 'demo shows a low-stock alert');
});

test('reset modes', () => {
  const demo = Seed.demoState('2026-09-25');
  const tx = Store.resetState(demo, 'transactions');
  assert.equal(tx.productionLogs.length, 0);
  assert.equal(tx.stockMoves.length, 0);
  assert.equal(tx.products.length, demo.products.length);
  assert.ok(demo.productionLogs.length > 0, 'original not mutated');
  const empty = Store.resetState(demo, 'empty');
  assert.equal(empty.machines.length, 4);
  assert.equal(empty.products.length, 0);
  const again = Store.resetState(empty, 'demo', '2026-09-25');
  assert.ok(again.productionLogs.length > 100);
});

test('import validation', () => {
  assert.equal(Store.parseImport('not json').ok, false);
  assert.equal(Store.parseImport('{"a":1}').ok, false);
  const r = Store.parseImport(JSON.stringify({ machines: [] }));
  assert.equal(r.ok, true);
  assert.equal(r.state.machines.length, 4);
  assert.deepEqual(r.state.productionLogs, []);
});
