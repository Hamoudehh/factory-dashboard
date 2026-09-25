/* Weekly production plan: each machine-day goes to the products with the fewest days of stock. */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? { CONFIG: require('./config.js'), KPI: require('./kpi.js') }
    : { CONFIG: root.CONFIG, KPI: root.KPI };
  const mod = factory(deps.CONFIG, deps.KPI);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.Plan = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONFIG, KPI) {
  const perCartonMap = (products) => Object.fromEntries(products.map((p) => [p.id, Number(p.unitsPerCarton) || 1]));

  // Days of stock → status. Below 1 day is critical, below the target is a warning.
  function coverStatus(cover, targetDays) {
    if (cover == null || !Number.isFinite(cover)) return 'none';
    if (cover < 1) return 'crit';
    if (cover < targetDays) return 'warn';
    return 'good';
  }

  // One machine, one day. proj: { productId: cartons in stock }. Does not mutate proj.
  // products: [{ id, unitsPerCarton, dailyDemand }] of this machine only.
  function planDay(o) {
    const proj = o.proj;
    const cover = (p) => proj[p.id] / p.dailyDemand;
    const unitsPerMin = ((Number(o.ratePerHour) || 0) * o.oee) / 60;
    const cands = o.products
      .filter((p) => p.dailyDemand > 0 && p.unitsPerCarton > 0)
      .sort((a, b) => cover(a) - cover(b));
    let avail = o.minutes;
    const items = [];
    for (const p of cands) {
      if (items.length >= o.maxProducts) break;
      const c = cover(p);
      if (c >= o.targetDays) break; // sorted: everyone after this is covered too
      const run = avail - o.changeover;
      if (run < 30 || unitsPerMin <= 0) break;
      const cartonsPerMin = unitsPerMin / p.unitsPerCarton;
      const need = o.targetDays * p.dailyDemand + p.dailyDemand - proj[p.id];
      const cartons = Math.floor(Math.min(run, need / cartonsPerMin) * cartonsPerMin);
      if (cartons <= 0) continue;
      const minutes = Math.ceil(cartons / cartonsPerMin) + o.changeover;
      items.push({ productId: p.id, cartons, units: cartons * p.unitsPerCarton, minutes, coverBefore: c });
      avail -= minutes;
    }
    return { items, usedMinutes: o.minutes - avail };
  }

  // Finished-goods stock (cartons) and actual shipments per working day, per product.
  function finishedStock(state, asOf) {
    const items = state.items.filter((i) => i.category === 'finished' && i.productId);
    const inv = KPI.inventorySummary(items, state.stockMoves, state.productionLogs, asOf, CONFIG.coverLookbackDays, {
      perCarton: perCartonMap(state.products), workDays: CONFIG.workDays,
    });
    const stock = {};
    const actualDaily = {};
    inv.rows.forEach((r, i) => {
      stock[items[i].productId] = r.qty;
      actualDaily[items[i].productId] = r.avgDaily;
    });
    return { stock, actualDaily };
  }

  // Recent OEE drives the planned speed; clamped so one bad day does not distort the week.
  function machineOee(state, machine, asOf) {
    const from = KPI.addDays(asOf, -13);
    const logs = state.productionLogs.filter((l) => l.machineId === machine.id && l.date >= from && l.date <= asOf);
    const s = KPI.productionSummary(logs, { [machine.id]: Number(machine.ratePerHour) || 0 });
    return s.oee == null ? 0.8 : Math.min(0.95, Math.max(0.5, s.oee));
  }

  function nextWorkDays(asOf, count) {
    const out = [];
    let d = asOf;
    for (let i = 0; i < 60 && out.length < count; i++) {
      d = KPI.addDays(d, 1);
      if (KPI.isWorkDay(d, CONFIG.workDays)) out.push(d);
    }
    return out;
  }

  // Plan the next horizonDays working days after asOf.
  function build(state, asOf) {
    const P = Object.assign({}, CONFIG.defaultSettings.planning, state.settings.planning);
    const shift = Object.assign({}, CONFIG.defaultSettings.shift, state.settings.shift);
    const machines = state.machines.filter((m) => m.active !== false);
    const products = state.products
      .filter((p) => p.active !== false && Number(p.dailyDemand) > 0 && Number(p.unitsPerCarton) > 0 && machines.some((m) => m.id === p.machineId))
      .map((p) => Object.assign({}, p, { dailyDemand: Number(p.dailyDemand), unitsPerCarton: Number(p.unitsPerCarton) }));
    const { stock, actualDaily } = finishedStock(state, asOf);
    const proj = {};
    const planned = {};
    for (const p of products) {
      proj[p.id] = stock[p.id] || 0;
      planned[p.id] = 0;
    }
    const start = Object.assign({}, proj);
    const oee = Object.fromEntries(machines.map((m) => [m.id, machineOee(state, m, asOf)]));
    const dates = nextWorkDays(asOf, P.horizonDays);

    const dayOpts = { workDays: CONFIG.workDays, shortDay: CONFIG.shortDay };
    const days = dates.map((date) => {
      const minutes = KPI.dayMinutes(shift, date, dayOpts);
      const extMinutes = KPI.dayMinutes(shift, date, Object.assign({ extended: true }, dayOpts));
      const perMachine = {};
      for (const m of machines) {
        const own = products.filter((p) => p.machineId === m.id);
        const run = (mins) => planDay({
          products: own, proj, minutes: mins,
          ratePerHour: m.ratePerHour, oee: oee[m.id],
          targetDays: P.targetDays, maxProducts: P.maxProductsPerDay, changeover: P.changeoverMinutes,
        });
        let r = run(minutes);
        let capacity = minutes;
        // Still under one day of stock after today's customers? Run to the extension end (overtime).
        const madeOf = (res, id) => res.items.filter((i) => i.productId === id).reduce((a, i) => a + i.cartons, 0);
        const shortAfter = (res) => own.some((p) => (proj[p.id] + madeOf(res, p.id) - p.dailyDemand) / p.dailyDemand < 1);
        let extended = false;
        if (extMinutes > minutes && shortAfter(r)) {
          const longer = run(extMinutes);
          if (longer.usedMinutes > minutes) { // only pay overtime when the extra time is used
            r = longer;
            capacity = extMinutes;
            extended = true;
          }
        }
        for (const it of r.items) {
          proj[it.productId] += it.cartons;
          planned[it.productId] += it.cartons;
        }
        perMachine[m.id] = { items: r.items, capacity, used: r.usedMinutes, load: capacity ? r.usedMinutes / capacity : 0, extended };
      }
      for (const p of products) proj[p.id] -= p.dailyDemand; // customers take their daily cartons
      return { date, minutes, machines: perMachine };
    });

    const rows = products
      .map((p) => ({
        productId: p.id, name: p.name, machineId: p.machineId, unitsPerCarton: p.unitsPerCarton,
        stock: start[p.id], demand: p.dailyDemand, actualDaily: actualDaily[p.id] || 0,
        coverNow: start[p.id] / p.dailyDemand,
        planned: planned[p.id], endStock: proj[p.id], coverEnd: proj[p.id] / p.dailyDemand,
      }))
      .sort((a, b) => a.coverNow - b.coverNow)
      .map((r, i) => Object.assign(r, { rank: i + 1 }));

    return {
      asOf, dates, days, rows, oee, settings: P,
      totalCartons: rows.reduce((a, r) => a + r.planned, 0),
      skipped: state.products.filter((p) => p.active !== false && !(Number(p.dailyDemand) > 0 && Number(p.unitsPerCarton) > 0)).map((p) => p.name),
    };
  }

  return { planDay, build, finishedStock, machineOee, nextWorkDays, coverStatus, perCartonMap };
});
