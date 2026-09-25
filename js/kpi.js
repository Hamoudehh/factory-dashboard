/* KPI calculations. Pure functions: no DOM, no storage. */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.KPI = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ---------- dates ----------
  function toISO(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function parseISO(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(s, n) {
    const d = parseISO(s);
    d.setDate(d.getDate() + n);
    return toISO(d);
  }

  function dateList(from, to) {
    const out = [];
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
    return out;
  }

  function periodRange(key, today, custom) {
    if (key === 'custom' && custom && custom.from && custom.to) {
      return custom.from <= custom.to ? { from: custom.from, to: custom.to } : { from: custom.to, to: custom.from };
    }
    const days = key === '1' ? 1 : key === '30' ? 30 : 7;
    return { from: addDays(today, -(days - 1)), to: today };
  }

  function previousRange(r) {
    const len = dateList(r.from, r.to).length;
    return { from: addDays(r.from, -len), to: addDays(r.from, -1) };
  }

  function inRange(date, r) {
    return date >= r.from && date <= r.to;
  }

  // ---------- shift / work days ----------
  function timeToMinutes(hhmm) {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function isWorkDay(date, workDays) {
    return (workDays || [0, 1, 2, 3, 4, 5]).includes(parseISO(date).getDay());
  }

  // Planned production minutes on a date. shift: { start, end, extendedEnd, fridayEnd }.
  function dayMinutes(shift, date, opts) {
    opts = opts || {};
    if (!isWorkDay(date, opts.workDays)) return 0;
    const start = timeToMinutes(shift.start);
    const short = parseISO(date).getDay() === (opts.shortDay == null ? 5 : opts.shortDay);
    const end = short ? timeToMinutes(shift.fridayEnd || shift.end) : timeToMinutes(opts.extended ? shift.extendedEnd : shift.end);
    return Math.max(0, end - start);
  }

  function workDaysBetween(from, to, workDays) {
    return dateList(from, to).filter((d) => isWorkDay(d, workDays)).length;
  }

  // ---------- helpers ----------
  const sum = (arr, fn) => arr.reduce((acc, x) => acc + (fn ? fn(x) : x), 0);
  const ratio = (a, b) => (b > 0 ? a / b : null);

  function statusHigh(v, good, warn) {
    if (v == null || Number.isNaN(v)) return 'none';
    if (v >= good) return 'good';
    if (v >= warn) return 'warn';
    return 'crit';
  }

  function statusLow(v, good, warn) {
    if (v == null || Number.isNaN(v)) return 'none';
    if (v <= good) return 'good';
    if (v <= warn) return 'warn';
    return 'crit';
  }

  // ---------- production / machines ----------
  function logDowntime(log) {
    return sum(log.downtimes || [], (d) => Number(d.minutes) || 0);
  }

  function sumProduction(logs, rateById) {
    const t = {
      logs: logs.length, plannedMinutes: 0, downMinutes: 0, runMinutes: 0,
      plannedUnits: 0, good: 0, scrap: 0, ideal: 0,
      breakdowns: 0, breakdownMinutes: 0, downByReason: {},
    };
    for (const log of logs) {
      const planned = Number(log.plannedMinutes) || 0;
      const down = Math.min(planned, logDowntime(log));
      const run = planned - down;
      t.plannedMinutes += planned;
      t.downMinutes += down;
      t.runMinutes += run;
      t.plannedUnits += Number(log.plannedUnits) || 0;
      t.good += Number(log.goodUnits) || 0;
      t.scrap += Number(log.scrapUnits) || 0;
      t.ideal += ((rateById[log.machineId] || 0) * run) / 60;
      for (const d of log.downtimes || []) {
        const m = Number(d.minutes) || 0;
        if (m <= 0) continue;
        t.downByReason[d.reason] = (t.downByReason[d.reason] || 0) + m;
        if (d.reason === 'breakdown') {
          t.breakdowns += 1;
          t.breakdownMinutes += m;
        }
      }
    }
    return t;
  }

  function productionRatios(t) {
    const total = t.good + t.scrap;
    const A = ratio(t.runMinutes, t.plannedMinutes);
    const Praw = ratio(total, t.ideal);
    const P = Praw == null ? null : Math.min(1, Praw);
    const Q = ratio(t.good, total);
    const oee = A == null || P == null || Q == null ? null : A * P * Q;
    return {
      A, P, Q, oee,
      scrapRate: ratio(t.scrap, total),
      unitsPerHour: ratio(t.good, t.runMinutes / 60),
      adherence: ratio(t.good, t.plannedUnits),
      mttr: t.breakdowns > 0 ? t.breakdownMinutes / t.breakdowns : null,
      mtbfHours: t.breakdowns > 0 ? t.runMinutes / 60 / t.breakdowns : null,
    };
  }

  function productionSummary(logs, rateById) {
    const t = sumProduction(logs, rateById);
    return Object.assign(t, productionRatios(t));
  }

  function groupBy(arr, keyFn) {
    const m = new Map();
    for (const x of arr) {
      const k = keyFn(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  }

  const cartonsOf = (log, perCarton) => (Number(log.goodUnits) || 0) / ((perCarton && perCarton[log.productId]) || 1);

  // Per-day series for each machine: { oee, good, cartons } each { id: [..] }
  function dailyByMachine(logs, dates, rateById, machineIds, perCarton) {
    const byKey = groupBy(logs, (l) => `${l.machineId}|${l.date}`);
    const oee = {};
    const good = {};
    const cartons = {};
    for (const id of machineIds) {
      const rowsFor = (d) => byKey.get(`${id}|${d}`);
      oee[id] = dates.map((d) => (rowsFor(d) ? productionSummary(rowsFor(d), rateById).oee : null));
      good[id] = dates.map((d) => (rowsFor(d) ? sum(rowsFor(d), (r) => Number(r.goodUnits) || 0) : 0));
      cartons[id] = dates.map((d) => (rowsFor(d) ? sum(rowsFor(d), (r) => cartonsOf(r, perCarton)) : 0));
    }
    return { oee, good, cartons };
  }

  // ---------- workers ----------
  function laborCost(row, hourlyCost, factor) {
    if (row.status !== 'present') return 0;
    const h = Number(row.hours) || 0;
    const ot = Number(row.overtimeHours) || 0;
    return h * hourlyCost + ot * hourlyCost * factor;
  }

  function attendanceSummary(rows) {
    const c = { present: 0, absent: 0, sick: 0, vacation: 0 };
    let hours = 0;
    let overtime = 0;
    for (const r of rows) {
      if (c[r.status] != null) c[r.status] += 1;
      if (r.status === 'present') {
        hours += Number(r.hours) || 0;
        overtime += Number(r.overtimeHours) || 0;
      }
    }
    const totalHours = hours + overtime;
    return {
      counts: c,
      rate: ratio(c.present, c.present + c.absent + c.sick),
      hours, overtime, totalHours,
      overtimeShare: ratio(overtime, totalHours),
    };
  }

  function workerSummary(attendance, logs, workers, factor) {
    const attByWorker = groupBy(attendance, (a) => a.workerId);
    const units = {};
    for (const log of logs) {
      const ids = log.workerIds || [];
      if (!ids.length) continue;
      const share = (Number(log.goodUnits) || 0) / ids.length;
      for (const id of ids) units[id] = (units[id] || 0) + share;
    }
    const rows = workers.map((w) => {
      const att = attByWorker.get(w.id) || [];
      const s = attendanceSummary(att);
      const cost = sum(att, (r) => laborCost(r, Number(w.hourlyCost) || 0, factor));
      const u = units[w.id] || 0;
      return {
        id: w.id, name: w.name, role: w.role, active: w.active !== false,
        shifts: s.counts.present, absences: s.counts.absent + s.counts.sick,
        attendance: s.rate, hours: s.hours, overtime: s.overtime,
        units: u, unitsPerHour: ratio(u, s.totalHours), cost,
      };
    });
    const totalCost = sum(rows, (r) => r.cost);
    const totalGood = sum(logs, (l) => Number(l.goodUnits) || 0);
    const att = attendanceSummary(attendance);
    return {
      rows, totalCost, attendance: att,
      unitsPerLaborHour: ratio(totalGood, att.totalHours),
      costPerUnit: ratio(totalCost, totalGood),
    };
  }

  // ---------- products ----------
  function productSummary(logs, products) {
    const byProduct = groupBy(logs, (l) => l.productId);
    return products.map((p) => {
      const rows = byProduct.get(p.id) || [];
      const planned = sum(rows, (r) => Number(r.plannedUnits) || 0);
      const good = sum(rows, (r) => Number(r.goodUnits) || 0);
      const scrap = sum(rows, (r) => Number(r.scrapUnits) || 0);
      return {
        id: p.id, name: p.name, machineId: p.machineId, active: p.active !== false,
        planned, good, scrap,
        adherence: ratio(good, planned),
        scrapRate: ratio(scrap, good + scrap),
        value: good * (Number(p.price) || 0),
        scrapCost: scrap * (Number(p.cost) || 0),
      };
    });
  }

  // ---------- inventory ----------
  const ORDER = { count: 1 };

  // Events that change an item's quantity, up to and including asOf.
  // Finished goods are kept in cartons: production adds goodUnits / unitsPerCarton.
  function itemEvents(item, moves, prodLogs, asOf, unitsPerCarton) {
    const ev = [];
    for (const m of moves) {
      if (m.itemId !== item.id || (asOf && m.date > asOf)) continue;
      ev.push({ date: m.date, type: m.type, qty: Number(m.qty) || 0, at: m.createdAt || '' });
    }
    if (item.productId) {
      const per = Number(unitsPerCarton) || 1;
      for (const l of prodLogs) {
        if (l.productId !== item.productId || (asOf && l.date > asOf)) continue;
        ev.push({ date: l.date, type: 'in', qty: (Number(l.goodUnits) || 0) / per, at: l.createdAt || '' });
      }
    }
    // Same date: movements first, count last (count = end-of-day stock).
    ev.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (ORDER[a.type] || 0) - (ORDER[b.type] || 0) || (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)));
    return ev;
  }

  function applyEvents(ev) {
    let q = 0;
    for (const e of ev) {
      if (e.type === 'count') q = e.qty;
      else if (e.type === 'in') q += e.qty;
      else if (e.type === 'out' || e.type === 'scrap') q -= e.qty;
    }
    return q;
  }

  function itemStock(item, moves, prodLogs, asOf, unitsPerCarton) {
    return applyEvents(itemEvents(item, moves, prodLogs, asOf, unitsPerCarton));
  }

  // Average daily outflow (out + scrap). With workDays, divides by working days only.
  function avgDailyUsage(moves, asOf, lookbackDays, workDays) {
    const from = addDays(asOf, -(lookbackDays - 1));
    const used = sum(moves.filter((m) => (m.type === 'out' || m.type === 'scrap') && m.date >= from && m.date <= asOf), (m) => Number(m.qty) || 0);
    const days = workDays ? workDaysBetween(from, asOf, workDays) : lookbackDays;
    return days > 0 ? used / days : 0;
  }

  // opts: { perCarton: {productId: units}, workDays: [dow] }
  function inventorySummary(items, moves, logs, asOf, lookbackDays, opts) {
    opts = opts || {};
    const movesByItem = groupBy(moves, (m) => m.itemId);
    const logsByProduct = groupBy(logs, (l) => l.productId);
    const rows = items.map((it) => {
      const im = movesByItem.get(it.id) || [];
      const pl = it.productId ? logsByProduct.get(it.productId) || [] : [];
      const qty = itemStock(it, im, pl, asOf, it.productId && opts.perCarton ? opts.perCarton[it.productId] : 1);
      const avg = avgDailyUsage(im, asOf, lookbackDays, opts.workDays);
      const min = Number(it.minQty) || 0;
      return {
        id: it.id, name: it.name, category: it.category, unit: it.unit, active: it.active !== false,
        qty, minQty: min,
        value: qty * (Number(it.unitCost) || 0),
        pctOfMin: min > 0 ? qty / min : null,
        belowMin: min > 0 && qty < min,
        avgDaily: avg,
        daysCover: avg > 0 ? qty / avg : null,
      };
    });
    return {
      rows,
      totalValue: sum(rows, (r) => r.value),
      belowMin: rows.filter((r) => r.belowMin && r.active),
    };
  }

  function countAccuracy(moves) {
    const counts = moves.filter((m) => m.type === 'count' && m.expectedQty != null);
    if (!counts.length) return null;
    const scores = counts.map((m) => {
      const exp = Number(m.expectedQty);
      const got = Number(m.qty);
      if (exp <= 0) return got === exp ? 1 : 0;
      return Math.max(0, 1 - Math.abs(got - exp) / exp);
    });
    return sum(scores) / scores.length;
  }

  function moveTotals(moves) {
    const t = { in: 0, out: 0, scrap: 0, count: 0 };
    for (const m of moves) if (t[m.type] != null) t[m.type] += m.type === 'count' ? 1 : Number(m.qty) || 0;
    return t;
  }

  return {
    toISO, parseISO, addDays, dateList, periodRange, previousRange, inRange,
    timeToMinutes, isWorkDay, dayMinutes, workDaysBetween,
    statusHigh, statusLow, groupBy,
    logDowntime, sumProduction, productionRatios, productionSummary, dailyByMachine, cartonsOf,
    laborCost, attendanceSummary, workerSummary,
    productSummary,
    itemStock, avgDailyUsage, inventorySummary, countAccuracy, moveTotals,
  };
});
