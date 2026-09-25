/* Deterministic demo data: 30 days of a bakery with 4 machines, ending today. */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? { CONFIG: require('./config.js'), KPI: require('./kpi.js') }
    : { CONFIG: root.CONFIG, KPI: root.KPI };
  const mod = factory(deps.CONFIG, deps.KPI);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.Seed = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONFIG, KPI) {
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));

  function baseState(source) {
    return {
      version: CONFIG.schemaVersion,
      meta: { createdAt: new Date().toISOString(), source },
      settings: clone(CONFIG.defaultSettings),
      machines: CONFIG.machines.map((m) => Object.assign({}, m, { active: true })),
      products: [],
      workers: [],
      items: [],
      productionLogs: [],
      attendance: [],
      stockMoves: [],
    };
  }

  const PRODUCTS = [
    { id: 'p-croissant-butter', name: 'קרואסון חמאה', machineId: 'rondo', price: 3.2, cost: 1.4, minQty: 4000 },
    { id: 'p-croissant-choc', name: 'קרואסון שוקולד', machineId: 'rondo', price: 3.6, cost: 1.7, minQty: 4000 },
    { id: 'p-cheese-pastry', name: 'מאפה גבינה', machineId: 'rondo', price: 4.0, cost: 1.9, minQty: 4000 },
    { id: 'p-borekas-cheese', name: 'בורקס גבינה', machineId: 'krumster', price: 2.8, cost: 1.2, minQty: 4000 },
    { id: 'p-borekas-potato', name: 'בורקס תפוחי אדמה', machineId: 'krumster', price: 2.5, cost: 1.0, minQty: 4000 },
    { id: 'p-filo-spinach', name: 'מאפה פילו תרד', machineId: 'filo', price: 4.5, cost: 2.1, minQty: 2000 },
    { id: 'p-filo-sheets', name: 'עלי פילו 500 גרם', machineId: 'filo', price: 9.0, cost: 4.2, minQty: 2000 },
    { id: 'p-rugelach', name: 'רוגלך שוקולד', machineId: 'kanol', price: 1.2, cost: 0.5, minQty: 6000 },
    { id: 'p-strudel', name: 'שטרודל תפוחים', machineId: 'kanol', price: 6.0, cost: 2.8, minQty: 6000 },
  ];

  // team: machine|shift the worker belongs to
  const WORKERS = [
    { id: 'w01', name: 'אחמד עודה', role: 'מפעיל', hourlyCost: 58, team: 'rondo|morning' },
    { id: 'w02', name: 'יוסי כהן', role: 'עוזר ייצור', hourlyCost: 46, team: 'rondo|morning' },
    { id: 'w03', name: 'נאדיה סלאמה', role: 'אורזת', hourlyCost: 42, team: 'rondo|morning' },
    { id: 'w04', name: 'אורי מזרחי', role: 'מפעיל', hourlyCost: 56, team: 'rondo|evening' },
    { id: 'w05', name: 'סמיר בדראן', role: 'עוזר ייצור', hourlyCost: 45, team: 'rondo|evening' },
    { id: 'w06', name: 'מוחמד חטיב', role: 'מפעיל', hourlyCost: 57, team: 'krumster|morning' },
    { id: 'w07', name: 'דנה לוי', role: 'אורזת', hourlyCost: 43, team: 'krumster|morning' },
    { id: 'w08', name: 'איגור פטרוב', role: 'מפעיל', hourlyCost: 55, team: 'krumster|evening' },
    { id: 'w09', name: 'מרים אבו רמילה', role: 'עוזרת ייצור', hourlyCost: 44, team: 'krumster|evening' },
    { id: 'w10', name: 'ראמי דאוד', role: 'מפעיל', hourlyCost: 58, team: 'filo|morning' },
    { id: 'w11', name: 'טל רוזן', role: 'בצקאי', hourlyCost: 52, team: 'filo|morning' },
    { id: 'w12', name: 'חוסאם ג\'אבר', role: 'מפעיל', hourlyCost: 56, team: 'kanol|morning' },
    { id: 'w13', name: 'אלנה ברקוביץ', role: 'אורזת', hourlyCost: 42, team: 'kanol|morning' },
    { id: 'w14', name: 'וליד קאסם', role: 'מפעיל', hourlyCost: 55, team: 'kanol|evening' },
  ];

  // dailyUse: typical consumption on a full production day
  const RAW_ITEMS = [
    { id: 'i-flour', name: 'קמח לבן', category: 'raw', unit: 'ק"ג', unitCost: 2.4, minQty: 1500, dailyUse: 520 },
    { id: 'i-butter', name: 'חמאה', category: 'raw', unit: 'ק"ג', unitCost: 38, minQty: 160, dailyUse: 55 },
    { id: 'i-margarine', name: 'מרגרינה', category: 'raw', unit: 'ק"ג', unitCost: 12, minQty: 200, dailyUse: 70 },
    { id: 'i-sugar', name: 'סוכר', category: 'raw', unit: 'ק"ג', unitCost: 3.5, minQty: 180, dailyUse: 60 },
    { id: 'i-yeast', name: 'שמרים', category: 'raw', unit: 'ק"ג', unitCost: 9, minQty: 40, dailyUse: 14 },
    { id: 'i-eggs', name: 'ביצים', category: 'raw', unit: 'יח\'', unitCost: 0.6, minQty: 2000, dailyUse: 700 },
    { id: 'i-cheese', name: 'גבינה בולגרית', category: 'raw', unit: 'ק"ג', unitCost: 28, minQty: 100, dailyUse: 35 },
    { id: 'i-chocolate', name: 'שוקולד', category: 'raw', unit: 'ק"ג', unitCost: 45, minQty: 80, dailyUse: 26 },
    { id: 'i-potato', name: 'תפוחי אדמה', category: 'raw', unit: 'ק"ג', unitCost: 3, minQty: 140, dailyUse: 45 },
    { id: 'i-spinach', name: 'תרד קפוא', category: 'raw', unit: 'ק"ג', unitCost: 14, minQty: 55, dailyUse: 18 },
    { id: 'i-carton', name: 'קרטון משלוח', category: 'packaging', unit: 'יח\'', unitCost: 2.2, minQty: 550, dailyUse: 180 },
    { id: 'i-bags', name: 'שקית אריזה', category: 'packaging', unit: 'יח\'', unitCost: 0.15, minQty: 6500, dailyUse: 2200 },
  ];
  const LOW_STOCK_STORY = ['i-chocolate', 'i-yeast'];

  const SCHEDULE = {
    rondo: ['morning', 'evening'],
    krumster: ['morning', 'evening'],
    filo: ['morning'],
    kanol: ['morning', 'evening'],
  };

  function demoState(today, days) {
    days = days || 30;
    today = today || KPI.toISO(new Date());
    const rnd = mulberry32(20260925);
    const r = (a, b) => a + (b - a) * rnd();
    const ri = (a, b) => Math.round(r(a, b));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

    const s = baseState('demo');
    s.products = PRODUCTS.map(({ minQty, ...p }) => Object.assign({ active: true }, p));
    s.workers = WORKERS.map(({ team, ...w }) => Object.assign({ active: true }, w));
    s.items = RAW_ITEMS.map(({ dailyUse, ...it }) => Object.assign({ active: true }, it)).concat(
      PRODUCTS.map((p) => ({
        id: 'f-' + p.id.slice(2), name: p.name, category: 'finished', unit: 'יח\'',
        unitCost: p.cost, minQty: p.minQty, productId: p.id, active: true,
      }))
    );
    const rate = Object.fromEntries(s.machines.map((m) => [m.id, m.ratePerHour]));
    const teams = {};
    for (const w of WORKERS) (teams[w.team] = teams[w.team] || []).push(w.id);
    const productsByMachine = {};
    for (const p of PRODUCTS) (productsByMachine[p.machineId] = productsByMachine[p.machineId] || []).push(p.id);

    let seq = 0;
    const id = (prefix) => `${prefix}-${(++seq).toString(36)}`;
    // Today's demo rows get early timestamps so real entries always sort as newest.
    const at = (date, hour) => `${date}T${String(date === today ? 0 : hour).padStart(2, '0')}:00:00`;

    const from = KPI.addDays(today, -(days - 1));
    const stock = {};
    const pending = {};

    // Opening stock: counted the day before the period starts.
    const opening = KPI.addDays(from, -1);
    for (const it of s.items) {
      const qty = it.category === 'finished' ? Math.round(it.minQty * r(1.2, 1.8)) : Math.round(it.minQty * r(2, 3));
      stock[it.id] = qty;
      s.stockMoves.push({ id: id('m'), date: opening, itemId: it.id, type: 'count', qty, expectedQty: null, note: 'ספירת פתיחה', createdAt: at(opening, 20) });
    }

    const dates = KPI.dateList(from, today);
    let lastWorkDay = null;
    dates.forEach((date, dayIdx) => {
      const dow = KPI.parseISO(date).getDay();
      if (dow === 6) return; // Saturday
      const shortDay = dow === 5 || date === today;
      const recent = dayIdx >= dates.length - 10;
      lastWorkDay = date;

      // Receipts that arrive today
      for (const it of RAW_ITEMS) {
        if (pending[it.id] && pending[it.id] <= date) {
          const qty = Math.round((it.minQty * 2.2) / 10) * 10;
          stock[it.id] += qty;
          s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'in', qty, note: 'קבלה מספק', createdAt: at(date, 7) });
          delete pending[it.id];
        }
      }

      const producedToday = {};
      s.machines.forEach((m) => {
        SCHEDULE[m.id].forEach((shift, shiftIdx) => {
          if (shortDay && shift !== 'morning') return;
          const team = teams[`${m.id}|${shift}`] || [];
          const present = [];
          for (const wid of team) {
            const x = rnd();
            const status = x < 0.025 ? 'sick' : x < 0.04 ? 'absent' : x < 0.07 ? 'vacation' : 'present';
            const ot = status === 'present' && rnd() < 0.15 ? pick([1, 1.5, 2]) : 0;
            s.attendance.push({
              id: id('a'), date, shift, workerId: wid, status,
              hours: status === 'present' ? (shortDay ? 6 : 8) : 0, overtimeHours: ot,
              machineId: m.id, createdAt: at(date, 15),
            });
            if (status === 'present') present.push(wid);
          }

          const plist = productsByMachine[m.id];
          const productId = plist[(dayIdx + shiftIdx) % plist.length];
          const plannedMinutes = shortDay ? 360 : 480;
          const downtimes = [
            { reason: 'changeover', minutes: ri(8, 22) },
            { reason: 'cleaning', minutes: ri(10, 20) },
          ];
          const breakdownProb = m.id === 'kanol' && recent ? 0.55 : 0.15;
          if (rnd() < breakdownProb) downtimes.push({ reason: 'breakdown', minutes: ri(20, m.id === 'kanol' && recent ? 120 : 75) });
          if (rnd() < 0.08) downtimes.push({ reason: 'material', minutes: ri(10, 40) });
          if (present.length < team.length && rnd() < 0.6) downtimes.push({ reason: 'staff', minutes: ri(20, 60) });

          const down = Math.min(plannedMinutes - 60, downtimes.reduce((a, d) => a + d.minutes, 0));
          const run = plannedMinutes - down;
          let perf = m.id === 'kanol' && recent ? r(0.8, 0.9) : r(0.9, 0.99);
          if (present.length < team.length) perf *= 0.9;
          const total = Math.round(((rate[m.id] * run) / 60) * perf);
          const scrapRate = m.id === 'filo' ? r(0.03, 0.06) : r(0.012, 0.042);
          const scrapUnits = Math.round(total * scrapRate);
          const goodUnits = total - scrapUnits;
          const plannedUnits = Math.round((rate[m.id] * (plannedMinutes / 60) * 0.82) / 100) * 100;

          s.productionLogs.push({
            id: id('l'), date, shift, machineId: m.id, productId,
            plannedUnits, goodUnits, scrapUnits, plannedMinutes, downtimes,
            workerIds: present, note: '', createdAt: at(date, shift === 'morning' ? 14 : 22),
          });
          producedToday[productId] = (producedToday[productId] || 0) + goodUnits;
        });
      });

      // Raw material and packaging consumption
      for (const it of RAW_ITEMS) {
        const qty = Math.min(stock[it.id], Math.max(1, Math.round(it.dailyUse * r(0.85, 1.15) * (shortDay ? 0.6 : 1))));
        if (qty <= 0) continue;
        stock[it.id] -= qty;
        s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'out', qty, note: 'הוצאה לייצור', createdAt: at(date, 8) });
        const noMoreOrders = LOW_STOCK_STORY.includes(it.id) && dayIdx >= dates.length - 4;
        if (!pending[it.id] && !noMoreOrders && stock[it.id] < it.minQty * 1.7) pending[it.id] = KPI.addDays(date, 1);
      }

      // Finished goods: production in, shipments out, occasional scrap
      for (const it of s.items.filter((x) => x.category === 'finished')) {
        const made = producedToday[it.productId] || 0;
        stock[it.id] += made;
        const shipped = Math.round(Math.min(stock[it.id] - it.minQty * 0.5, made * r(0.92, 1.06)));
        if (shipped > 0) {
          stock[it.id] -= shipped;
          s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'out', qty: shipped, note: 'משלוח לסניפים', createdAt: at(date, 23) });
        }
        if (rnd() < 0.08) {
          const q = ri(20, 80);
          stock[it.id] -= q;
          s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'scrap', qty: q, note: 'פג תוקף', createdAt: at(date, 23) });
        }
      }

      // Weekly count on Sunday (end of day)
      if (dow === 0) {
        for (let k = 0; k < 4; k++) {
          const it = s.items[(dayIdx + k * 5) % s.items.length];
          if (LOW_STOCK_STORY.includes(it.id)) continue;
          const expected = stock[it.id];
          const counted = Math.max(0, Math.round(expected * r(0.975, 1.015)));
          stock[it.id] = counted;
          s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'count', qty: counted, expectedQty: expected, note: 'ספירה שבועית', createdAt: at(date, 23) });
        }
      }
    });

    // Make sure the low-stock story shows up as an alert.
    if (lastWorkDay) {
      for (const itemId of LOW_STOCK_STORY) {
        const it = RAW_ITEMS.find((x) => x.id === itemId);
        const target = Math.round(it.minQty * 0.6);
        const diff = stock[itemId] - target;
        if (diff !== 0) {
          stock[itemId] = target;
          s.stockMoves.push({
            id: id('m'), date: lastWorkDay, itemId, type: diff > 0 ? 'out' : 'in', qty: Math.abs(diff),
            note: diff > 0 ? 'הזמנה מיוחדת' : 'קבלה חלקית', createdAt: at(lastWorkDay, 12),
          });
        }
      }
    }

    return s;
  }

  function emptyState() {
    return baseState('empty');
  }

  return { demoState, emptyState, baseState, mulberry32 };
});
