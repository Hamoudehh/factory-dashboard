/* Deterministic demo data: 30 days of a bakery with 5 machines, ending today.
   Production each day follows the same planner the dashboard uses (lowest days of stock first). */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? { CONFIG: require('./config.js'), KPI: require('./kpi.js'), Plan: require('./plan.js') }
    : { CONFIG: root.CONFIG, KPI: root.KPI, Plan: root.Plan };
  const mod = factory(deps.CONFIG, deps.KPI, deps.Plan);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.Seed = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONFIG, KPI, Plan) {
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

  // price / cost per unit (₪), unitsPerCarton, dailyDemand in cartons per working day
  const PRODUCTS = [
    { id: 'p-croissant-choc', name: 'קרואסון שוקולד', machineId: 'rondo', price: 3.6, cost: 1.7, unitsPerCarton: 60, dailyDemand: 70 },
    { id: 'p-danish-cinnamon', name: 'דייניש קינמון', machineId: 'rondo', price: 4.2, cost: 1.9, unitsPerCarton: 48, dailyDemand: 45 },
    { id: 'p-danish-poppy', name: 'דייניש פרג', machineId: 'rondo', price: 4.2, cost: 2.0, unitsPerCarton: 48, dailyDemand: 35 },
    { id: 'p-yeast-cheese', name: 'שמרים גבינה', machineId: 'rondo', price: 4.5, cost: 2.1, unitsPerCarton: 40, dailyDemand: 40 },
    { id: 'p-croissant-butter', name: 'קרואסון חמאה', machineId: 'krumster', price: 3.4, cost: 1.5, unitsPerCarton: 60, dailyDemand: 80 },
    { id: 'p-rugelach', name: 'רוגלך', machineId: 'krumster', price: 1.2, cost: 0.5, unitsPerCarton: 150, dailyDemand: 30 },
    { id: 'p-filo-cheese', name: 'פילו גבינה', machineId: 'filo', price: 5.5, cost: 2.5, unitsPerCarton: 36, dailyDemand: 80 },
    { id: 'p-filo-apple', name: 'פילו תפוחים', machineId: 'filo', price: 5.0, cost: 2.2, unitsPerCarton: 36, dailyDemand: 65 },
    { id: 'p-borekas-cheese', name: 'בורקס גבינה', machineId: 'kanol', price: 2.8, cost: 1.2, unitsPerCarton: 80, dailyDemand: 35 },
    { id: 'p-borekas-potato', name: 'בורקס תפוח אדמה', machineId: 'kanol', price: 2.5, cost: 1.0, unitsPerCarton: 80, dailyDemand: 30 },
    { id: 'p-bulgarian', name: 'מאפה בולגרית', machineId: 'kanol', price: 4.0, cost: 1.8, unitsPerCarton: 60, dailyDemand: 20 },
    { id: 'p-gviniyot', name: 'גביניות', machineId: 'kanol', price: 1.8, cost: 0.8, unitsPerCarton: 100, dailyDemand: 15 },
    { id: 'p-cookies-dates', name: 'עוגיות תמרים', machineId: 'kanol', price: 0.8, cost: 0.3, unitsPerCarton: 200, dailyDemand: 5 },
    { id: 'p-cookies-poppy', name: 'עוגיות פרג', machineId: 'kanol', price: 0.8, cost: 0.3, unitsPerCarton: 200, dailyDemand: 5 },
    { id: 'p-cookies-halva', name: 'עוגיות חלבה', machineId: 'kanol', price: 0.9, cost: 0.35, unitsPerCarton: 200, dailyDemand: 6 },
    { id: 'p-strudel', name: 'שטרודל תפוחים', machineId: 'kanol', price: 18, cost: 7.5, unitsPerCarton: 12, dailyDemand: 40 },
    { id: 'p-bread-white', name: 'לחם לבן', machineId: 'bread', price: 7, cost: 2.5, unitsPerCarton: 12, dailyDemand: 220 },
    { id: 'p-bread-whole', name: 'לחם מלא', machineId: 'bread', price: 9, cost: 3.2, unitsPerCarton: 12, dailyDemand: 160 },
    { id: 'p-rolls', name: 'לחמניות', machineId: 'bread', price: 1.5, cost: 0.5, unitsPerCarton: 60, dailyDemand: 50 },
  ];

  const WORKERS = [
    { id: 'w01', name: 'אחמד עודה', role: 'מפעיל', hourlyCost: 58, machineId: 'rondo' },
    { id: 'w02', name: 'יוסי כהן', role: 'עוזר ייצור', hourlyCost: 46, machineId: 'rondo' },
    { id: 'w03', name: 'נאדיה סלאמה', role: 'אורזת', hourlyCost: 42, machineId: 'rondo' },
    { id: 'w04', name: 'אורי מזרחי', role: 'בצקאי', hourlyCost: 52, machineId: 'rondo' },
    { id: 'w05', name: 'סמיר בדראן', role: 'מפעיל', hourlyCost: 55, machineId: 'krumster' },
    { id: 'w06', name: 'מוחמד חטיב', role: 'עוזר ייצור', hourlyCost: 47, machineId: 'krumster' },
    { id: 'w07', name: 'דנה לוי', role: 'אורזת', hourlyCost: 43, machineId: 'krumster' },
    { id: 'w08', name: 'ראמי דאוד', role: 'מפעיל', hourlyCost: 58, machineId: 'filo' },
    { id: 'w09', name: 'טל רוזן', role: 'בצקאי', hourlyCost: 52, machineId: 'filo' },
    { id: 'w10', name: 'מרים אבו רמילה', role: 'אורזת', hourlyCost: 43, machineId: 'filo' },
    { id: 'w11', name: 'חוסאם ג\'אבר', role: 'מפעיל', hourlyCost: 56, machineId: 'kanol' },
    { id: 'w12', name: 'אלנה ברקוביץ', role: 'אורזת', hourlyCost: 42, machineId: 'kanol' },
    { id: 'w13', name: 'איגור פטרוב', role: 'עוזר ייצור', hourlyCost: 46, machineId: 'kanol' },
    { id: 'w14', name: 'וליד קאסם', role: 'מפעיל', hourlyCost: 55, machineId: 'bread' },
    { id: 'w15', name: 'ג\'מאל נסאר', role: 'אופה', hourlyCost: 54, machineId: 'bread' },
    { id: 'w16', name: 'רונית אזולאי', role: 'אורזת', hourlyCost: 42, machineId: 'bread' },
  ];

  // dailyUse: typical consumption on a full production day
  const RAW_ITEMS = [
    { id: 'i-flour', name: 'קמח לבן', category: 'raw', unit: 'ק"ג', unitCost: 2.4, minQty: 1500, dailyUse: 480 },
    { id: 'i-flour-whole', name: 'קמח מלא', category: 'raw', unit: 'ק"ג', unitCost: 3.1, minQty: 400, dailyUse: 140 },
    { id: 'i-butter', name: 'חמאה', category: 'raw', unit: 'ק"ג', unitCost: 38, minQty: 160, dailyUse: 55 },
    { id: 'i-margarine', name: 'מרגרינה', category: 'raw', unit: 'ק"ג', unitCost: 12, minQty: 200, dailyUse: 70 },
    { id: 'i-sugar', name: 'סוכר', category: 'raw', unit: 'ק"ג', unitCost: 3.5, minQty: 180, dailyUse: 60 },
    { id: 'i-yeast', name: 'שמרים', category: 'raw', unit: 'ק"ג', unitCost: 9, minQty: 40, dailyUse: 14 },
    { id: 'i-eggs', name: 'ביצים', category: 'raw', unit: 'יח\'', unitCost: 0.6, minQty: 2000, dailyUse: 700 },
    { id: 'i-cheese', name: 'גבינה בולגרית', category: 'raw', unit: 'ק"ג', unitCost: 28, minQty: 100, dailyUse: 35 },
    { id: 'i-chocolate', name: 'שוקולד', category: 'raw', unit: 'ק"ג', unitCost: 45, minQty: 80, dailyUse: 26 },
    { id: 'i-potato', name: 'תפוחי אדמה', category: 'raw', unit: 'ק"ג', unitCost: 3, minQty: 140, dailyUse: 45 },
    { id: 'i-apples', name: 'תפוחים', category: 'raw', unit: 'ק"ג', unitCost: 6, minQty: 150, dailyUse: 50 },
    { id: 'i-dates', name: 'ממרח תמרים', category: 'raw', unit: 'ק"ג', unitCost: 16, minQty: 40, dailyUse: 12 },
    { id: 'i-poppy', name: 'פרג', category: 'raw', unit: 'ק"ג', unitCost: 22, minQty: 30, dailyUse: 10 },
    { id: 'i-halva', name: 'חלבה', category: 'raw', unit: 'ק"ג', unitCost: 26, minQty: 25, dailyUse: 8 },
    { id: 'i-cinnamon', name: 'קינמון', category: 'raw', unit: 'ק"ג', unitCost: 40, minQty: 10, dailyUse: 3 },
    { id: 'i-carton', name: 'קרטון משלוח', category: 'packaging', unit: 'יח\'', unitCost: 2.2, minQty: 3000, dailyUse: 1050 },
    { id: 'i-bags', name: 'שקית אריזה', category: 'packaging', unit: 'יח\'', unitCost: 0.15, minQty: 20000, dailyUse: 7000 },
  ];
  const LOW_STOCK_STORY = ['i-chocolate', 'i-yeast'];
  const EXTENDS = ['krumster', 'kanol', 'bread']; // machines that often run to 18:00

  function demoState(today, days) {
    days = days || 30;
    today = today || KPI.toISO(new Date());
    const rnd = mulberry32(20260925);
    const r = (a, b) => a + (b - a) * rnd();
    const ri = (a, b) => Math.round(r(a, b));

    const s = baseState('demo');
    const shift = s.settings.shift;
    const P = s.settings.planning;
    s.products = PRODUCTS.map((p) => Object.assign({ active: true }, p));
    s.workers = WORKERS.map(({ machineId, ...w }) => Object.assign({ active: true }, w));
    s.items = RAW_ITEMS.map(({ dailyUse, ...it }) => Object.assign({ active: true }, it)).concat(
      PRODUCTS.map((p) => ({
        id: 'f-' + p.id.slice(2), name: p.name, category: 'finished', unit: CONFIG.cartonUnit,
        unitCost: Math.round(p.cost * p.unitsPerCarton * 100) / 100, minQty: Math.round(p.dailyDemand * 1.5),
        productId: p.id, active: true,
      }))
    );
    const fin = Object.fromEntries(s.items.filter((i) => i.productId).map((i) => [i.productId, i.id]));
    const machines = Object.fromEntries(s.machines.map((m) => [m.id, m]));

    let seq = 0;
    const id = (prefix) => `${prefix}-${(++seq).toString(36)}`;
    // Today's demo rows get early timestamps so real entries always sort as newest.
    const at = (date, hour) => `${date}T${String(date === today ? 0 : hour).padStart(2, '0')}:00:00`;

    const from = KPI.addDays(today, -(days - 1));
    const stock = {}; // raw: item units, finished: cartons by productId
    const pending = {};

    // Opening stock: counted the day before the period starts.
    const opening = KPI.addDays(from, -1);
    for (const it of RAW_ITEMS) {
      stock[it.id] = Math.round(it.minQty * r(2, 3));
      s.stockMoves.push({ id: id('m'), date: opening, itemId: it.id, type: 'count', qty: stock[it.id], expectedQty: null, note: 'ספירת פתיחה', createdAt: at(opening, 20) });
    }
    for (const p of PRODUCTS) {
      stock[p.id] = Math.round(p.dailyDemand * r(2, 3.5));
      s.stockMoves.push({ id: id('m'), date: opening, itemId: fin[p.id], type: 'count', qty: stock[p.id], expectedQty: null, note: 'ספירת פתיחה', createdAt: at(opening, 20) });
    }

    const dates = KPI.dateList(from, today);
    let lastWorkDay = null;
    dates.forEach((date, dayIdx) => {
      if (!KPI.isWorkDay(date, CONFIG.workDays)) return;
      const dow = KPI.parseISO(date).getDay();
      const short = dow === CONFIG.shortDay;
      const recent = dayIdx >= dates.length - 8;
      lastWorkDay = date;
      const baseMinutes = KPI.dayMinutes(shift, date, { workDays: CONFIG.workDays, shortDay: CONFIG.shortDay });

      // Raw material receipts that arrive today
      for (const it of RAW_ITEMS) {
        if (pending[it.id] && pending[it.id] <= date) {
          const qty = Math.round((it.minQty * 2.2) / 10) * 10;
          stock[it.id] += qty;
          s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'in', qty, note: 'קבלה מספק', createdAt: at(date, 7) });
          delete pending[it.id];
        }
      }

      for (const m of s.machines) {
        const extended = !short && EXTENDS.includes(m.id) && rnd() < 0.35;
        const minutes = extended ? KPI.dayMinutes(shift, date, { extended: true, workDays: CONFIG.workDays, shortDay: CONFIG.shortDay }) : baseMinutes;
        const kanolTrouble = m.id === 'kanol' && recent;

        // Attendance: the machine's team, one shift. Overtime when the machine runs to 18:00.
        const present = [];
        for (const w of WORKERS.filter((x) => x.machineId === m.id)) {
          const x = rnd();
          const status = x < 0.025 ? 'sick' : x < 0.04 ? 'absent' : x < 0.065 ? 'vacation' : 'present';
          const isIn = status === 'present';
          s.attendance.push({
            id: id('a'), date, shift: 'morning', workerId: w.id, status,
            hours: isIn ? baseMinutes / 60 : 0, overtimeHours: isIn && extended ? (minutes - baseMinutes) / 60 : 0,
            machineId: m.id, createdAt: at(date, 16),
          });
          if (isIn) present.push(w.id);
        }
        const shortStaffed = present.length < WORKERS.filter((x) => x.machineId === m.id).length;

        const plan = Plan.planDay({
          products: s.products.filter((p) => p.machineId === m.id), proj: stock, minutes,
          ratePerHour: m.ratePerHour, oee: 0.8, targetDays: P.targetDays, maxProducts: P.maxProductsPerDay, changeover: P.changeoverMinutes,
        });
        plan.items.forEach((it, idx) => {
          const last = idx === plan.items.length - 1;
          const downtimes = [{ reason: 'changeover', minutes: ri(10, 22) }];
          if (last) downtimes.push({ reason: 'cleaning', minutes: ri(15, 25) });
          if (rnd() < (kanolTrouble ? 0.3 : 0.1)) downtimes.push({ reason: 'breakdown', minutes: ri(20, kanolTrouble ? 80 : 70) });
          if (rnd() < 0.05) downtimes.push({ reason: 'material', minutes: ri(10, 30) });
          if (shortStaffed && rnd() < 0.5) downtimes.push({ reason: 'staff', minutes: ri(15, 45) });
          const down = Math.min(it.minutes - 20, downtimes.reduce((a, d) => a + d.minutes, 0));
          const run = it.minutes - down;
          let perf = kanolTrouble ? r(0.84, 0.93) : r(0.9, 0.99);
          if (shortStaffed) perf *= 0.92;
          const total = Math.round(((machines[m.id].ratePerHour * run) / 60) * perf);
          const scrapUnits = Math.round(total * (m.id === 'filo' ? r(0.03, 0.055) : r(0.012, 0.04)));
          const goodUnits = total - scrapUnits;
          const p = s.products.find((x) => x.id === it.productId);
          stock[p.id] += goodUnits / p.unitsPerCarton;
          s.productionLogs.push({
            id: id('l'), date, shift: 'morning', machineId: m.id, productId: p.id,
            plannedUnits: it.units, goodUnits, scrapUnits, plannedMinutes: it.minutes, downtimes,
            workerIds: present.slice(), note: '', createdAt: at(date, extended ? 18 : 16),
          });
        });
      }

      // Customers take their daily cartons (a demand spike on gviniyot in the last days)
      for (const p of PRODUCTS) {
        const spike = p.id === 'p-gviniyot' && dayIdx >= dates.length - 5 ? 1.7 : 1;
        const shipped = Math.min(Math.floor(stock[p.id]), Math.round(p.dailyDemand * r(0.88, 1.12) * spike));
        if (shipped > 0) {
          stock[p.id] -= shipped;
          s.stockMoves.push({ id: id('m'), date, itemId: fin[p.id], type: 'out', qty: shipped, note: 'משלוח לסניפים', createdAt: at(date, 17) });
        }
        if (rnd() < 0.04) {
          const q = Math.min(Math.floor(stock[p.id]), ri(1, 4));
          if (q > 0) {
            stock[p.id] -= q;
            s.stockMoves.push({ id: id('m'), date, itemId: fin[p.id], type: 'scrap', qty: q, note: 'פג תוקף', createdAt: at(date, 17) });
          }
        }
      }

      // Raw material and packaging consumption
      for (const it of RAW_ITEMS) {
        const qty = Math.min(stock[it.id], Math.max(1, Math.round(it.dailyUse * r(0.85, 1.15) * (short ? 0.6 : 1))));
        if (qty <= 0) continue;
        stock[it.id] -= qty;
        s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'out', qty, note: 'הוצאה לייצור', createdAt: at(date, 8) });
        const noMoreOrders = LOW_STOCK_STORY.includes(it.id) && dayIdx >= dates.length - 4;
        if (!pending[it.id] && !noMoreOrders && stock[it.id] < it.minQty * 1.7) pending[it.id] = KPI.addDays(date, 1);
      }

      // Weekly count on Sunday (end of day), raw materials only
      if (dow === 0) {
        for (let k = 0; k < 4; k++) {
          const it = RAW_ITEMS[(dayIdx + k * 4) % RAW_ITEMS.length];
          if (LOW_STOCK_STORY.includes(it.id)) continue;
          const expected = stock[it.id];
          const counted = Math.max(0, Math.round(expected * r(0.975, 1.015)));
          stock[it.id] = counted;
          s.stockMoves.push({ id: id('m'), date, itemId: it.id, type: 'count', qty: counted, expectedQty: expected, note: 'ספירה שבועית', createdAt: at(date, 20) });
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

  return { demoState, emptyState, baseState, mulberry32, PRODUCTS };
});
