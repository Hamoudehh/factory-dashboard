/* App shell: header, filters, routing and the five dashboard views. */
(function () {
  const C = window.CONFIG;
  const K = window.KPI;

  // ---------- icons ----------
  const ICONS = {
    owner: '<path d="M3.3 17a9 9 0 1 1 17.4 0"/><path d="M12 14l4.5-4.5"/><circle cx="12" cy="14" r="1.2"/>',
    machines: '<path d="M2 21h20"/><path d="M4 21V9l5 3V9l5 3V4h5v17"/><path d="M8 17h2M13 17h2"/>',
    workers: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    products: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    inventory: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8"/><path d="M7 17h10"/>',
    entry: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    warn: '<path d="M12 3.5l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    crit: '<path d="M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8z"/><path d="M9 9l6 6M15 9l-6 6"/>',
    minus: '<path d="M6 12h12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    back: '<path d="M9 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    count: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    swap: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  };
  const icon = (name, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // ---------- formatting ----------
  const nfCache = {};
  const nf = (min, max) => (nfCache[min + '-' + max] = nfCache[min + '-' + max] || new Intl.NumberFormat('he-IL', { minimumFractionDigits: min, maximumFractionDigits: max }));
  const moneyFmt = (d) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: d, maximumFractionDigits: d });
  const fmt = {
    int: (v) => (v == null || Number.isNaN(v) ? '—' : nf(0, 0).format(Math.round(v))),
    dec: (v, d = 1) => (v == null || Number.isNaN(v) ? '—' : nf(d, d).format(v)),
    pct: (v, d = 1) => (v == null || Number.isNaN(v) ? '—' : `${(v * 100).toFixed(d)}%`),
    money: (v, d = 0) => (v == null || Number.isNaN(v) ? '—' : moneyFmt(d).format(v)),
    date: (iso) => { const p = iso.split('-'); return `${p[2]}/${p[1]}`; },
    dateLong: (iso) => { const p = iso.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; },
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STATUS_TEXT = { good: 'תקין', warn: 'אזהרה', crit: 'חריגה', none: 'אין נתונים' };
  const STATUS_ICON = { good: 'check', warn: 'warn', crit: 'crit', none: 'minus' };
  const pillIcon = (status) => `<span class="pill pill-${status}" title="${STATUS_TEXT[status]}">${icon(STATUS_ICON[status])}<span class="sr-only">${STATUS_TEXT[status]}</span></span>`;
  const pill = (status, text) => `<span class="pill pill-${status}">${icon(STATUS_ICON[status])}${esc(text || STATUS_TEXT[status])}</span>`;

  const today = () => K.toISO(new Date());
  const shiftName = (id) => (C.shifts.find((s) => s.id === id) || {}).name || id;
  const reasonName = (id) => (C.downtimeReasons.find((r) => r.id === id) || {}).name || id;

  // ---------- state ----------
  const App = {
    state: null,
    persisted: true,
    version: 0,
    ui: { view: 'owner', period: '7', custom: { from: '', to: '' }, machine: 'all', selectedMachine: 'rondo', entryForm: null, theme: 'system' },
    tables: {},
    sort: {},
  };

  function loadUi() {
    try {
      const raw = localStorage.getItem(C.uiKey);
      if (raw) Object.assign(App.ui, JSON.parse(raw), { entryForm: null });
    } catch (e) { /* storage blocked */ }
  }

  function saveUi() {
    try {
      const { period, custom, machine, selectedMachine, theme } = App.ui;
      localStorage.setItem(C.uiKey, JSON.stringify({ period, custom, machine, selectedMachine, theme }));
    } catch (e) { /* storage blocked */ }
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(message, action) {
    const el = document.getElementById('toast');
    clearTimeout(toastTimer);
    el.innerHTML = `<p>${esc(message)}</p>${action ? `<button type="button" class="btn btn-sm" id="toast-action">${esc(action.label)}</button>` : ''}`;
    el.hidden = false;
    if (action) {
      document.getElementById('toast-action').addEventListener('click', () => {
        el.hidden = true;
        action.run();
      });
    }
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 8000 : 3500);
  }

  // Apply a change to state, persist it, and offer undo.
  function commit(mutate, opts) {
    opts = opts || {};
    const before = JSON.stringify(App.state);
    mutate(App.state);
    App.version += 1;
    const v = App.version;
    const saved = Store.save(App.state);
    if (opts.render !== false) render();
    if (!saved && App.persisted) {
      toast('השמירה נכשלה. ייתכן שהזיכרון בדפדפן מלא. הורד גיבוי מההגדרות.');
    } else if (opts.toast) {
      toast(opts.toast, opts.undo === false ? null : {
        label: 'בטל',
        run() {
          if (App.version !== v) return toast('אי אפשר לבטל: בוצע שינוי נוסף מאז');
          App.state = JSON.parse(before);
          App.version += 1;
          Store.save(App.state);
          render();
          toast('ההזנה בוטלה');
        },
      });
    }
  }

  function replaceState(next, message, action) {
    App.state = next;
    App.version += 1;
    Store.save(App.state);
    render();
    if (message) toast(message, action);
  }

  // ---------- modal ----------
  function openModal(html, onMount) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-backdrop" id="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    const backdrop = document.getElementById('modal-backdrop');
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', escClose);
    if (onMount) onMount(root.querySelector('.modal'));
    const first = root.querySelector('input, button, select');
    if (first) first.focus();
  }
  function escClose(e) { if (e.key === 'Escape') closeModal(); }
  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
    document.removeEventListener('keydown', escClose);
  }

  // In the claude.ai viewer, files are saved through the downloads capability; elsewhere through a blob link.
  let downloadsPromise = null;
  function downloadsApi() {
    if (!downloadsPromise) {
      downloadsPromise = window.claude && typeof window.claude.use === 'function'
        ? window.claude.use('downloads').catch(() => null)
        : Promise.resolve(null);
    }
    return downloadsPromise;
  }

  // Resolves 'saved' | 'started' | 'declined' | 'failed'.
  async function download(filename, text) {
    const dl = await downloadsApi();
    if (dl) {
      try {
        await dl.save({ filename, data: text });
        return 'saved';
      } catch (e) {
        return e && e.code === 'declined' ? 'declined' : 'failed';
      }
    }
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return 'started';
    } catch (e) {
      return 'failed';
    }
  }

  // ---------- context for the current filters ----------
  function ctx() {
    const s = App.state;
    const t = s.settings.targets;
    const range = K.periodRange(App.ui.period, today(), App.ui.custom);
    const prev = K.previousRange(range);
    const len = K.dateList(range.from, range.to).length;
    const trend = len < 7 ? { from: K.addDays(range.to, -13), to: range.to } : range;
    const mf = App.ui.machine;
    const rate = Object.fromEntries(s.machines.map((m) => [m.id, Number(m.ratePerHour) || 0]));
    const okMachine = (id) => mf === 'all' || id === mf;
    const logsIn = (r) => s.productionLogs.filter((l) => K.inRange(l.date, r) && okMachine(l.machineId));
    const attIn = (r) => s.attendance.filter((a) => K.inRange(a.date, r) && (mf === 'all' || a.machineId === mf));
    const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
    return {
      s, t, range, prev, trend, len, mf, rate,
      logs: logsIn(range), prevLogs: logsIn(prev), trendLogs: logsIn(trend),
      att: attIn(range), prevAtt: attIn(prev),
      machines: byId(s.machines), products: byId(s.products), workers: byId(s.workers), items: byId(s.items),
      visibleMachines: s.machines.filter((m) => okMachine(m.id)),
    };
  }

  const machineColor = (id) => Charts.theme().machine(id);
  const productionValue = (logs, products) => logs.reduce((a, l) => a + (Number(l.goodUnits) || 0) * (Number((products[l.productId] || {}).price) || 0), 0);
  const periodLabel = (c) => (c.len === 1 ? fmt.dateLong(c.range.to) : `${fmt.date(c.range.from)}–${fmt.date(c.range.to)}`);
  const trendLabel = (c) => (c.trend === c.range ? periodLabel(c) : '14 ימים אחרונים');

  // ---------- building blocks ----------
  function delta(cur, prev, kind, higherIsBetter) {
    if (cur == null || prev == null) return '';
    let diff;
    let text;
    if (kind === 'pp') {
      diff = (cur - prev) * 100;
      text = `${Math.abs(diff).toFixed(1)} נק'`;
    } else {
      if (!prev) return '';
      diff = (cur - prev) / Math.abs(prev);
      text = `${Math.abs(diff * 100).toFixed(1)}%`;
    }
    if (Math.abs(diff) < (kind === 'pp' ? 0.05 : 0.0005)) return '<span class="delta">ללא שינוי מול התקופה הקודמת</span>';
    const good = higherIsBetter ? diff > 0 : diff < 0;
    return `<span class="delta"><b class="${good ? 'arrow-good' : 'arrow-bad'}" aria-hidden="true">${diff > 0 ? '▲' : '▼'}</b>${diff > 0 ? '+' : '−'}${text} מול התקופה הקודמת</span>`;
  }

  function tile(o) {
    const status = o.status || 'none';
    return `<div class="kpi" data-status="${status}">
      <div class="kpi-label">${esc(o.label)}</div>
      <div class="kpi-value${String(o.value).replace(/<[^>]*>/g, '').length > 8 ? ' long' : ''}">${o.value}</div>
      ${o.sub ? `<div class="kpi-sub">${o.sub}</div>` : ''}
      <div class="kpi-foot">${o.status && o.status !== 'none' ? pill(status) : ''}${o.delta || ''}</div>
    </div>`;
  }

  function panel(id, title, sub, opts) {
    opts = opts || {};
    return `<section class="panel" aria-labelledby="${id}-t">
      <h3 id="${id}-t">${esc(title)}</h3>
      ${sub ? `<p class="panel-sub">${sub}</p>` : ''}
      ${opts.legend || ''}
      <div class="chart-box${opts.tall ? ' tall' : ''}" id="${id}-box"><canvas id="${id}" role="img" aria-label="${esc(title)}"></canvas></div>
      <details class="table-toggle"><summary>הצג כטבלה</summary><div class="table-wrap" id="${id}-table"></div></details>
    </section>`;
  }

  // Draws a chart into a panel and mirrors its data as a table.
  function drawChart(id, kind, labels, datasets, opts) {
    opts = opts || {};
    const box = document.getElementById(id + '-box');
    const tableEl = document.getElementById(id + '-table');
    if (!box) return;
    const f = opts.fmt || ((v) => fmt.int(v));
    const hasData = labels.length && datasets.some((d) => d.data.some((v) => v != null && v !== 0));
    if (tableEl) {
      const head = `<tr><th></th>${datasets.map((d) => `<th class="n">${esc(d.label || 'ערך')}</th>`).join('')}</tr>`;
      const body = labels.map((l, i) => `<tr><td>${esc(l)}</td>${datasets.map((d) => `<td class="n">${d.data[i] == null ? '—' : f(d.data[i])}</td>`).join('')}</tr>`).join('');
      tableEl.innerHTML = `<table class="data"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    }
    if (!hasData) {
      box.innerHTML = '<div class="chart-empty">אין נתונים בתקופה הזו</div>';
      return;
    }
    if (!Charts.available()) {
      box.innerHTML = '<div class="chart-empty">הגרפים לא נטענו. בדוק חיבור לאינטרנט ורענן את הדף. הנתונים זמינים ב"הצג כטבלה".</div>';
      return;
    }
    const canvas = document.getElementById(id);
    const o = Object.assign({}, opts, { fmt: f });
    if (kind === 'line') Charts.line(canvas, labels, datasets, o);
    else if (kind === 'doughnut') Charts.doughnut(canvas, labels, datasets[0].data, datasets[0].colors, o);
    else Charts.bar(canvas, labels, datasets, o);
  }

  // Sortable table. columns: [{ key, label, num, fmt(v,row) }]
  function tableHtml(id, columns, rows, empty) {
    App.tables[id] = { columns, rows, empty };
    return `<div class="table-wrap" data-table="${id}">${tableInner(id)}</div>`;
  }

  function tableInner(id) {
    const { columns, rows, empty } = App.tables[id];
    if (!rows.length) return `<div class="empty">${esc(empty || 'אין נתונים')}</div>`;
    const sort = App.sort[id];
    let sorted = rows;
    if (sort) {
      sorted = rows.slice().sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'he');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    const head = columns.map((col) => {
      const arrow = sort && sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
      const aria = sort && sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th class="${col.num ? 'n' : ''}" aria-sort="${aria}"><button type="button" data-sort="${id}|${col.key}">${esc(col.label)}${arrow}</button></th>`;
    }).join('');
    const body = sorted.map((r) => `<tr>${columns.map((col) => `<td class="${col.num ? 'n' : ''}">${col.fmt ? col.fmt(r[col.key], r) : esc(r[col.key])}</td>`).join('')}</tr>`).join('');
    return `<table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  const swatch = (id) => `<i class="swatch" style="background:var(--m-${id})"></i>`;
  const machineLabel = (c, id) => `${swatch(id)}${esc((c.machines[id] || {}).name || id)}`;
  const legendHtml = (entries) => `<div class="legend-html">${entries.map((e) => `<span><i style="background:${e.color}"></i>${esc(e.label)}</span>`).join('')}</div>`;

  function sectionHead(title, sub) {
    return `<div class="section-head"><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
  }

  // ---------- alerts ----------
  function buildAlerts(c, inv) {
    const out = [];
    const t = c.t;
    for (const m of c.visibleMachines) {
      const ms = K.productionSummary(c.logs.filter((l) => l.machineId === m.id), c.rate);
      if (ms.oee == null) continue;
      const st = K.statusHigh(ms.oee, t.oee, t.oeeWarn);
      if (st !== 'good') out.push({ status: st, text: `OEE ${m.name}: ${fmt.pct(ms.oee)}`, sub: `יעד ${fmt.pct(t.oee, 0)} · זמינות ${fmt.pct(ms.A, 0)} · ביצועים ${fmt.pct(ms.P, 0)}` });
    }
    for (const p of K.productSummary(c.logs, c.s.products)) {
      const st = K.statusLow(p.scrapRate, t.scrapMax, t.scrapWarn);
      if (st === 'crit') out.push({ status: st, text: `פסולת גבוהה ב${p.name}: ${fmt.pct(p.scrapRate)}`, sub: `יעד עד ${fmt.pct(t.scrapMax, 0)}` });
    }
    for (const r of inv.belowMin) {
      out.push({ status: 'crit', text: `${r.name} מתחת למינימום: ${fmt.int(r.qty)} ${r.unit}`, sub: `מינימום ${fmt.int(r.minQty)} ${r.unit}` });
    }
    for (const r of inv.rows) {
      if (r.active && !r.belowMin && r.category !== 'finished' && r.daysCover != null && r.daysCover < 3) {
        out.push({ status: 'warn', text: `${r.name}: נשארו ${fmt.dec(r.daysCover)} ימי כיסוי`, sub: `צריכה ממוצעת ${fmt.int(r.avgDaily)} ${r.unit} ליום` });
      }
    }
    const att = K.attendanceSummary(c.att);
    const ast = K.statusHigh(att.rate, t.attendance, t.attendanceWarn);
    if (ast === 'warn' || ast === 'crit') out.push({ status: ast, text: `נוכחות ${fmt.pct(att.rate)}`, sub: `יעד ${fmt.pct(t.attendance, 0)}` });
    const rank = { crit: 0, warn: 1 };
    return out.sort((a, b) => rank[a.status] - rank[b.status]);
  }

  function alertsHtml(list) {
    if (!list.length) return `<div class="empty">${icon('check')} אין התראות בתקופה הזו</div>`;
    const shown = list.slice(0, 8);
    return `<ul class="alerts">${shown.map((a) => `<li class="alert pill-${a.status}">${icon(STATUS_ICON[a.status])}<div><p><span class="sr-only">${STATUS_TEXT[a.status]}: </span>${esc(a.text)}</p><small>${esc(a.sub || '')}</small></div></li>`).join('')}</ul>
      ${list.length > shown.length ? `<p class="muted">ועוד ${list.length - shown.length} התראות</p>` : ''}`;
  }

  // ---------- shared chart builders ----------
  function oeeTrend(c, id, machineIds) {
    const dates = K.dateList(c.trend.from, c.trend.to);
    const d = K.dailyByMachine(c.trendLogs, dates, c.rate, machineIds);
    drawChart(id, 'line', dates.map(fmt.date), machineIds.map((mid) => ({
      label: c.machines[mid].name, color: machineColor(mid), data: d.oee[mid].map((v) => (v == null ? null : Math.round(v * 1000) / 10)),
    })), { fmt: (v) => `${fmt.dec(v)}%`, suggestedMax: 100, target: c.t.oee * 100, targetLabel: `יעד ${fmt.pct(c.t.oee, 0)}` });
  }

  function unitsTrend(c, id, machineIds) {
    const dates = K.dateList(c.trend.from, c.trend.to);
    const d = K.dailyByMachine(c.trendLogs, dates, c.rate, machineIds);
    drawChart(id, 'bar', dates.map(fmt.date), machineIds.map((mid) => ({
      label: c.machines[mid].name, color: machineColor(mid), data: d.good[mid],
    })), { stacked: true });
  }

  function downtimeChart(c, id, logs) {
    const sum = K.sumProduction(logs, c.rate);
    const rows = C.downtimeReasons.map((r) => ({ label: r.name, v: sum.downByReason[r.id] || 0 })).sort((a, b) => b.v - a.v);
    drawChart(id, 'bar', rows.map((r) => r.label), [{ label: 'דקות השבתה', color: Charts.theme().bar, data: rows.map((r) => r.v) }], {
      horizontal: true, legend: false, fmt: (v) => `${fmt.int(v)} דק'`,
    });
  }

  // ---------- views ----------
  function viewOwner(c) {
    const t = c.t;
    const p = K.productionSummary(c.logs, c.rate);
    const pp = K.productionSummary(c.prevLogs, c.rate);
    const value = productionValue(c.logs, c.products);
    const prevValue = productionValue(c.prevLogs, c.products);
    const w = K.workerSummary(c.att, c.logs, c.s.workers, C.overtimeFactor);
    const pw = K.workerSummary(c.prevAtt, c.prevLogs, c.s.workers, C.overtimeFactor);
    const inv = K.inventorySummary(c.s.items.filter((i) => i.active !== false), c.s.stockMoves, c.s.productionLogs, c.range.to, C.coverLookbackDays);
    const invPrev = K.inventorySummary(c.s.items.filter((i) => i.active !== false), c.s.stockMoves, c.s.productionLogs, c.prev.to, C.coverLookbackDays);

    const tiles = [
      tile({ label: 'OEE כולל', value: fmt.pct(p.oee), sub: `יעד ${fmt.pct(t.oee, 0)}`, status: K.statusHigh(p.oee, t.oee, t.oeeWarn), delta: delta(p.oee, pp.oee, 'pp', true) }),
      tile({ label: 'יחידות תקינות', value: fmt.int(p.good), sub: `מתוך ${fmt.int(p.plannedUnits)} מתוכנן · ${fmt.pct(p.adherence, 0)}`, status: K.statusHigh(p.adherence, t.planAdherence, t.planAdherenceWarn), delta: delta(p.good, pp.good, 'rel', true) }),
      tile({ label: 'פסולת', value: fmt.pct(p.scrapRate), sub: `${fmt.int(p.scrap)} יח' · יעד עד ${fmt.pct(t.scrapMax, 0)}`, status: K.statusLow(p.scrapRate, t.scrapMax, t.scrapWarn), delta: delta(p.scrapRate, pp.scrapRate, 'pp', false) }),
      tile({ label: 'ערך ייצור', value: fmt.money(value), sub: 'לפי מחיר מכירה', delta: delta(value, prevValue, 'rel', true) }),
      tile({ label: 'עלות עבודה ליחידה', value: fmt.money(w.costPerUnit, 2), sub: `סה"כ ${fmt.money(w.totalCost)}`, delta: delta(w.costPerUnit, pw.costPerUnit, 'rel', false) }),
      tile({ label: 'ערך מלאי', value: fmt.money(inv.totalValue), sub: inv.belowMin.length ? `${inv.belowMin.length} פריטים מתחת למינימום` : 'כל הפריטים מעל המינימום', status: inv.belowMin.length ? 'crit' : 'good', delta: delta(inv.totalValue, invPrev.totalValue, 'rel', true) }),
    ];

    const cards = c.s.machines.map((m) => {
      const ms = K.productionSummary(c.s.productionLogs.filter((l) => l.machineId === m.id && K.inRange(l.date, c.range)), c.rate);
      const st = K.statusHigh(ms.oee, t.oee, t.oeeWarn);
      const meter = (label, v) => `<div class="meter"><span>${label}</span><div class="meter-track"><div class="meter-fill" style="width:${v == null ? 0 : Math.round(v * 100)}%"></div></div><b>${fmt.pct(v, 0)}</b></div>`;
      return `<a class="mcard" href="#machines" style="--mc:var(--m-${m.id})" data-goto-machine="${m.id}">
        <div class="mcard-head"><h3>${esc(m.name)}</h3>${pill(st)}</div>
        <div class="mcard-oee"><strong>${fmt.pct(ms.oee, 0)}</strong><span>OEE</span></div>
        <div class="meters">${meter('זמינות', ms.A)}${meter('ביצועים', ms.P)}${meter('איכות', ms.Q)}</div>
        <div class="mcard-stats"><span>תקין <b>${fmt.int(ms.good)}</b></span><span>השבתה <b>${fmt.int(ms.downMinutes)}</b> דק'</span><span>פסולת <b>${fmt.pct(ms.scrapRate)}</b></span></div>
      </a>`;
    }).join('');

    const alerts = buildAlerts(c, inv);
    const html = `
      <section class="section" aria-label="מדדים ראשיים">${sectionHead('תמונת מצב', periodLabel(c) + (c.mf !== 'all' ? ` · ${esc(c.machines[c.mf].name)}` : ''))}<div class="grid-kpi">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('מכונות', 'לחיצה על מכונה פותחת את הפירוט שלה')}<div class="machine-cards">${cards}</div></section>
      <section class="section">${sectionHead('התראות', alerts.length ? `${alerts.length} פתוחות` : '')}${alertsHtml(alerts)}</section>
      <section class="section">${sectionHead('מגמות', trendLabel(c))}
        <div class="charts">
          ${panel('ch-oee', 'OEE יומי לפי מכונה', 'הקו המקווקו הוא היעד. שבת בלי ייצור.')}
          ${panel('ch-units', 'יחידות תקינות ליום לפי מכונה', '')}
          ${panel('ch-down', 'דקות השבתה לפי סיבה', periodLabel(c))}
        </div>
      </section>`;
    return {
      html,
      after() {
        const ids = c.visibleMachines.map((m) => m.id);
        oeeTrend(c, 'ch-oee', ids);
        unitsTrend(c, 'ch-units', ids);
        downtimeChart(c, 'ch-down', c.logs);
      },
    };
  }

  function viewMachines(c) {
    const t = c.t;
    const id = c.mf !== 'all' ? c.mf : App.ui.selectedMachine;
    const m = c.machines[id] || c.s.machines[0];
    const logs = c.s.productionLogs.filter((l) => l.machineId === m.id && K.inRange(l.date, c.range));
    const prevLogs = c.s.productionLogs.filter((l) => l.machineId === m.id && K.inRange(l.date, c.prev));
    const s = K.productionSummary(logs, c.rate);
    const ps = K.productionSummary(prevLogs, c.rate);

    const picker = c.s.machines.map((x) => `<button type="button" class="mpick" style="--mc:var(--m-${x.id})" data-pick-machine="${x.id}" aria-pressed="${x.id === m.id}"><i></i>${esc(x.name)}</button>`).join('');
    const tiles = [
      tile({ label: 'OEE', value: fmt.pct(s.oee), sub: `יעד ${fmt.pct(t.oee, 0)}`, status: K.statusHigh(s.oee, t.oee, t.oeeWarn), delta: delta(s.oee, ps.oee, 'pp', true) }),
      tile({ label: 'זמינות', value: fmt.pct(s.A), sub: `${fmt.int(s.runMinutes)} מתוך ${fmt.int(s.plannedMinutes)} דק'`, status: K.statusHigh(s.A, 0.9, 0.8), delta: delta(s.A, ps.A, 'pp', true) }),
      tile({ label: 'ביצועים', value: fmt.pct(s.P), sub: `קצב אידיאלי ${fmt.int(m.ratePerHour)}/שעה`, status: K.statusHigh(s.P, 0.95, 0.85), delta: delta(s.P, ps.P, 'pp', true) }),
      tile({ label: 'איכות', value: fmt.pct(s.Q), sub: `${fmt.int(s.scrap)} יח' פסולת`, status: K.statusHigh(s.Q, 0.97, 0.95), delta: delta(s.Q, ps.Q, 'pp', true) }),
      tile({ label: 'תפוקה לשעה', value: fmt.int(s.unitsPerHour), sub: 'יחידות תקינות לשעת ריצה', delta: delta(s.unitsPerHour, ps.unitsPerHour, 'rel', true) }),
      tile({ label: 'פסולת', value: fmt.pct(s.scrapRate), sub: `יעד עד ${fmt.pct(t.scrapMax, 0)}`, status: K.statusLow(s.scrapRate, t.scrapMax, t.scrapWarn), delta: delta(s.scrapRate, ps.scrapRate, 'pp', false) }),
      tile({ label: 'דקות השבתה', value: fmt.int(s.downMinutes), sub: `${fmt.pct(1 - (s.A == null ? 1 : s.A))} מהזמן המתוכנן`, delta: delta(s.downMinutes, ps.downMinutes, 'rel', false) }),
      tile({ label: 'תקלות', value: fmt.int(s.breakdowns), sub: `${fmt.int(s.breakdownMinutes)} דק' תקלה`, delta: delta(s.breakdowns, ps.breakdowns, 'rel', false) }),
      tile({ label: 'MTTR', value: s.mttr == null ? '—' : `${fmt.int(s.mttr)} דק'`, sub: 'זמן ממוצע לתיקון', delta: delta(s.mttr, ps.mttr, 'rel', false) }),
      tile({ label: 'MTBF', value: s.mtbfHours == null ? '—' : `${fmt.dec(s.mtbfHours)} ש'`, sub: 'שעות ריצה בין תקלות', delta: delta(s.mtbfHours, ps.mtbfHours, 'rel', true) }),
    ];

    const rows = logs.map((l) => {
      const one = K.productionSummary([l], c.rate);
      return {
        date: l.date, shift: shiftName(l.shift), product: (c.products[l.productId] || {}).name || '—',
        planned: l.plannedUnits, good: l.goodUnits, scrap: l.scrapUnits, down: K.logDowntime(l), oee: one.oee,
        reasons: (l.downtimes || []).filter((d) => d.minutes > 0).map((d) => `${reasonName(d.reason)} ${d.minutes}`).join(', '),
      };
    }).sort((a, b) => (a.date < b.date ? 1 : -1));

    const trendC = Object.assign({}, c, { trendLogs: c.s.productionLogs.filter((l) => l.machineId === m.id && K.inRange(l.date, c.trend)) });
    const html = `
      <section class="section">${sectionHead('בחר מכונה', '')}<div class="machine-picker" role="group" aria-label="בחירת מכונה">${picker}</div></section>
      <section class="section">${sectionHead(m.name, periodLabel(c))}<div class="grid-kpi cols-5">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('גרפים', trendLabel(c))}
        <div class="charts">
          ${panel('ch-m-oee', `OEE יומי – ${m.name}`, '')}
          ${panel('ch-m-units', `יחידות תקינות ליום – ${m.name}`, '')}
          ${panel('ch-m-down', 'דקות השבתה לפי סיבה', periodLabel(c))}
        </div>
      </section>
      <section class="section">${sectionHead('דיווחי ייצור', `${rows.length} דיווחים`)}
        ${tableHtml('t-machine', [
          { key: 'date', label: 'תאריך', fmt: (v) => fmt.date(v) },
          { key: 'shift', label: 'משמרת' },
          { key: 'product', label: 'מוצר' },
          { key: 'planned', label: 'מתוכנן', num: true, fmt: (v) => fmt.int(v) },
          { key: 'good', label: 'תקין', num: true, fmt: (v) => fmt.int(v) },
          { key: 'scrap', label: 'פסולת', num: true, fmt: (v) => fmt.int(v) },
          { key: 'down', label: 'השבתה (דק\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'oee', label: 'OEE', num: true, fmt: (v) => `${fmt.pct(v)} ${pillIcon(K.statusHigh(v, t.oee, t.oeeWarn))}` },
          { key: 'reasons', label: 'סיבות השבתה' },
        ], rows, 'אין דיווחים למכונה בתקופה הזו')}
      </section>`;
    return {
      html,
      after() {
        oeeTrend(trendC, 'ch-m-oee', [m.id]);
        unitsTrend(trendC, 'ch-m-units', [m.id]);
        downtimeChart(c, 'ch-m-down', logs);
      },
    };
  }

  function viewWorkers(c) {
    const t = c.t;
    const w = K.workerSummary(c.att, c.logs, c.s.workers, C.overtimeFactor);
    const pw = K.workerSummary(c.prevAtt, c.prevLogs, c.s.workers, C.overtimeFactor);
    const a = w.attendance;
    const tiles = [
      tile({ label: 'נוכחות', value: fmt.pct(a.rate), sub: `${a.counts.present} משמרות · יעד ${fmt.pct(t.attendance, 0)}`, status: K.statusHigh(a.rate, t.attendance, t.attendanceWarn), delta: delta(a.rate, pw.attendance.rate, 'pp', true) }),
      tile({ label: 'שעות עבודה', value: fmt.int(a.totalHours), sub: `${fmt.int(a.hours)} רגילות + ${fmt.int(a.overtime)} נוספות`, delta: delta(a.totalHours, pw.attendance.totalHours, 'rel', true) }),
      tile({ label: 'שעות נוספות', value: fmt.pct(a.overtimeShare), sub: 'מסך שעות העבודה · יעד עד 10%', status: K.statusLow(a.overtimeShare, 0.1, 0.15), delta: delta(a.overtimeShare, pw.attendance.overtimeShare, 'pp', false) }),
      tile({ label: 'יחידות לשעת עבודה', value: fmt.int(w.unitsPerLaborHour), sub: 'תקין ÷ שעות עבודה', delta: delta(w.unitsPerLaborHour, pw.unitsPerLaborHour, 'rel', true) }),
      tile({ label: 'עלות עבודה ליחידה', value: fmt.money(w.costPerUnit, 2), sub: `נוספות ×${C.overtimeFactor}`, delta: delta(w.costPerUnit, pw.costPerUnit, 'rel', false) }),
      tile({ label: 'עלות עבודה', value: fmt.money(w.totalCost), sub: periodLabel(c), delta: delta(w.totalCost, pw.totalCost, 'rel', false) }),
    ];
    const rows = w.rows.filter((r) => r.active || r.shifts > 0);
    const byUnits = rows.filter((r) => r.unitsPerHour != null).sort((x, y) => y.unitsPerHour - x.unitsPerHour);
    const html = `
      <section class="section">${sectionHead('עובדים', periodLabel(c) + (c.mf !== 'all' ? ` · ${esc(c.machines[c.mf].name)}` : ''))}<div class="grid-kpi">${tiles.join('')}</div></section>
      <section class="section"><div class="charts">
        ${panel('ch-att', 'התפלגות נוכחות', 'מספר רשומות משמרת לפי סטטוס')}
        ${panel('ch-uph', 'יחידות לשעת עבודה לפי עובד', 'התפוקה מתחלקת שווה בין העובדים שבדיווח (קירוב)', { tall: byUnits.length > 10 })}
      </div></section>
      <section class="section">${sectionHead('טבלת עובדים', 'לחיצה על כותרת ממיינת')}
        ${tableHtml('t-workers', [
          { key: 'name', label: 'עובד' },
          { key: 'role', label: 'תפקיד' },
          { key: 'shifts', label: 'משמרות', num: true, fmt: (v) => fmt.int(v) },
          { key: 'absences', label: 'היעדרויות', num: true, fmt: (v) => fmt.int(v) },
          { key: 'attendance', label: 'נוכחות', num: true, fmt: (v) => fmt.pct(v, 0) },
          { key: 'hours', label: 'שעות', num: true, fmt: (v) => fmt.int(v) },
          { key: 'overtime', label: 'נוספות', num: true, fmt: (v) => fmt.dec(v) },
          { key: 'units', label: 'תפוקה', num: true, fmt: (v) => fmt.int(v) },
          { key: 'unitsPerHour', label: 'יח\'/שעה', num: true, fmt: (v) => fmt.int(v) },
          { key: 'cost', label: 'עלות', num: true, fmt: (v) => fmt.money(v) },
        ], rows, 'אין עובדים. הוסף עובדים במסך ההגדרות.')}
      </section>`;
    return {
      html,
      after() {
        const th = Charts.theme();
        drawChart('ch-att', 'doughnut', C.attendanceStatus.map((s) => s.name), [{
          label: 'רשומות', data: C.attendanceStatus.map((s) => a.counts[s.id]), colors: [th.good, th.crit, th.warn, th.none],
        }]);
        drawChart('ch-uph', 'bar', byUnits.map((r) => r.name), [{ label: 'יח\' לשעה', color: th.bar, data: byUnits.map((r) => Math.round(r.unitsPerHour)) }], { horizontal: true, legend: false });
      },
    };
  }

  function viewProducts(c) {
    const t = c.t;
    const list = c.s.products.filter((p) => c.mf === 'all' || p.machineId === c.mf);
    const ps = K.productSummary(c.logs, list);
    const prev = K.productSummary(c.prevLogs, list);
    const tot = (arr, k) => arr.reduce((a, r) => a + r[k], 0);
    const good = tot(ps, 'good');
    const planned = tot(ps, 'planned');
    const scrap = tot(ps, 'scrap');
    const pGood = tot(prev, 'good');
    const pPlanned = tot(prev, 'planned');
    const pScrap = tot(prev, 'scrap');
    const ratio = (x, y) => (y > 0 ? x / y : null);
    const tiles = [
      tile({ label: 'יחידות תקינות', value: fmt.int(good), sub: `${list.length} מוצרים`, delta: delta(good, pGood, 'rel', true) }),
      tile({ label: 'עמידה בתכנון', value: fmt.pct(ratio(good, planned)), sub: `מתוכנן ${fmt.int(planned)}`, status: K.statusHigh(ratio(good, planned), t.planAdherence, t.planAdherenceWarn), delta: delta(ratio(good, planned), ratio(pGood, pPlanned), 'pp', true) }),
      tile({ label: 'פסולת', value: fmt.pct(ratio(scrap, good + scrap)), sub: `${fmt.int(scrap)} יח'`, status: K.statusLow(ratio(scrap, good + scrap), t.scrapMax, t.scrapWarn), delta: delta(ratio(scrap, good + scrap), ratio(pScrap, pGood + pScrap), 'pp', false) }),
      tile({ label: 'ערך ייצור', value: fmt.money(tot(ps, 'value')), sub: 'לפי מחיר מכירה', delta: delta(tot(ps, 'value'), tot(prev, 'value'), 'rel', true) }),
      tile({ label: 'עלות פסולת', value: fmt.money(tot(ps, 'scrapCost')), sub: 'לפי עלות ליחידה', delta: delta(tot(ps, 'scrapCost'), tot(prev, 'scrapCost'), 'rel', false) }),
    ];
    const active = ps.filter((p) => p.planned > 0 || p.good > 0).sort((a, b) => b.good - a.good);
    const top = active.slice(0, 5).map((p, i) => `<li class="alert" style="--pill:var(--m-${p.machineId})"><b class="num">${i + 1}</b><div><p>${esc(p.name)} · ${fmt.int(p.good)} יח'</p><small>${esc((c.machines[p.machineId] || {}).name || '')} · ${fmt.money(p.value)}</small></div></li>`).join('');
    const th = Charts.theme();
    const scrapColor = (v) => ({ good: th.good, warn: th.warn, crit: th.crit, none: th.none }[K.statusLow(v, t.scrapMax, t.scrapWarn)]);
    const machinesShown = [...new Set(active.map((p) => p.machineId))];
    const html = `
      <section class="section">${sectionHead('מוצרים', periodLabel(c) + (c.mf !== 'all' ? ` · ${esc(c.machines[c.mf].name)}` : ''))}<div class="grid-kpi cols-5">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('Top 5 לפי יחידות תקינות', '')}${top ? `<ol class="alerts">${top}</ol>` : '<div class="empty">אין ייצור בתקופה הזו</div>'}</section>
      <section class="section"><div class="charts">
        ${panel('ch-plan', 'מתוכנן מול תקין לפי מוצר', 'עמודת התקין בצבע המכונה', { tall: active.length > 6, legend: legendHtml([{ label: 'מתוכנן', color: 'var(--bar-muted)' }].concat(machinesShown.map((id) => ({ label: `תקין – ${c.machines[id].name}`, color: `var(--m-${id})` })))) })}
        ${panel('ch-scrap', 'פסולת % לפי מוצר', `הקו המקווקו הוא היעד (${fmt.pct(t.scrapMax, 0)})`, { tall: active.length > 6, legend: legendHtml([{ label: 'תקין', color: 'var(--good)' }, { label: 'אזהרה', color: 'var(--warn)' }, { label: 'חריגה', color: 'var(--crit)' }]) })}
      </div></section>
      <section class="section">${sectionHead('טבלת מוצרים', '')}
        ${tableHtml('t-products', [
          { key: 'name', label: 'מוצר' },
          { key: 'machineId', label: 'מכונה', fmt: (v) => machineLabel(c, v) },
          { key: 'planned', label: 'מתוכנן', num: true, fmt: (v) => fmt.int(v) },
          { key: 'good', label: 'תקין', num: true, fmt: (v) => fmt.int(v) },
          { key: 'adherence', label: 'עמידה', num: true, fmt: (v) => fmt.pct(v, 0) },
          { key: 'scrap', label: 'פסולת', num: true, fmt: (v) => fmt.int(v) },
          { key: 'scrapRate', label: 'פסולת %', num: true, fmt: (v) => `${fmt.pct(v)} ${pillIcon(K.statusLow(v, t.scrapMax, t.scrapWarn))}` },
          { key: 'value', label: 'ערך', num: true, fmt: (v) => fmt.money(v) },
          { key: 'scrapCost', label: 'עלות פסולת', num: true, fmt: (v) => fmt.money(v) },
        ], ps, 'אין מוצרים. הוסף מוצרים במסך ההגדרות.')}
      </section>`;
    return {
      html,
      after() {
        drawChart('ch-plan', 'bar', active.map((p) => p.name), [
          { label: 'מתוכנן', color: th.barMuted, data: active.map((p) => p.planned) },
          { label: 'תקין', colors: active.map((p) => machineColor(p.machineId)), data: active.map((p) => p.good) },
        ], { horizontal: true, legend: false });
        drawChart('ch-scrap', 'bar', active.map((p) => p.name), [{
          label: 'פסולת %', colors: active.map((p) => scrapColor(p.scrapRate)), data: active.map((p) => (p.scrapRate == null ? null : Math.round(p.scrapRate * 1000) / 10)),
        }], { horizontal: true, legend: false, fmt: (v) => `${fmt.dec(v)}%`, target: t.scrapMax * 100 });
      },
    };
  }

  function viewInventory(c) {
    const items = c.s.items.filter((i) => i.active !== false);
    const inv = K.inventorySummary(items, c.s.stockMoves, c.s.productionLogs, c.range.to, C.coverLookbackDays);
    const movesIn = c.s.stockMoves.filter((m) => K.inRange(m.date, c.range));
    const totals = K.moveTotals(movesIn);
    const acc = K.countAccuracy(movesIn);
    const count = (type) => movesIn.filter((m) => m.type === type).length;
    const th = Charts.theme();
    const catName = (id) => (C.itemCategories.find((x) => x.id === id) || {}).name || id;
    const minStatus = (r) => (r.pctOfMin == null ? 'none' : r.pctOfMin < 1 ? 'crit' : r.pctOfMin < 1.3 ? 'warn' : 'good');
    const coverStatus = (r) => (r.daysCover == null ? 'none' : r.daysCover < 3 ? 'crit' : r.daysCover <= 7 ? 'warn' : 'good');
    const colorOf = (st) => ({ good: th.good, warn: th.warn, crit: th.crit, none: th.none }[st]);
    const rawRows = inv.rows.filter((r) => r.category !== 'finished');
    const finRows = inv.rows.filter((r) => r.category === 'finished');

    const tiles = [
      tile({ label: 'ערך מלאי', value: fmt.money(inv.totalValue), sub: `נכון ל-${fmt.dateLong(c.range.to)}` }),
      tile({ label: 'מתחת למינימום', value: fmt.int(inv.belowMin.length), sub: inv.belowMin.slice(0, 3).map((r) => r.name).join(', ') || 'אין', status: inv.belowMin.length ? 'crit' : 'good' }),
      tile({ label: 'דיוק ספירה', value: fmt.pct(acc), sub: `${totals.count} ספירות בתקופה`, status: K.statusHigh(acc, 0.98, 0.95) }),
      tile({ label: 'תנועות כניסה', value: fmt.int(count('in')), sub: 'קבלות בתקופה' }),
      tile({ label: 'תנועות יציאה', value: fmt.int(count('out')), sub: `ועוד ${count('scrap')} רישומי פחת` }),
    ];
    const cols = [
      { key: 'name', label: 'פריט' },
      { key: 'category', label: 'סוג', fmt: (v) => esc(catName(v)) },
      { key: 'qty', label: 'כמות', num: true, fmt: (v, r) => `${fmt.int(v)} ${esc(r.unit)}` },
      { key: 'minQty', label: 'מינימום', num: true, fmt: (v) => fmt.int(v) },
      { key: 'pctOfMin', label: '% מהמינימום', num: true, fmt: (v, r) => `${fmt.pct(v, 0)} ${pillIcon(minStatus(r))}` },
      { key: 'avgDaily', label: 'צריכה ליום', num: true, fmt: (v) => fmt.int(v) },
      { key: 'daysCover', label: 'ימי כיסוי', num: true, fmt: (v, r) => (r.category === 'finished' ? fmt.dec(v) : `${fmt.dec(v)} ${pillIcon(coverStatus(r))}`) },
      { key: 'value', label: 'ערך', num: true, fmt: (v) => fmt.money(v) },
    ];
    const statusLegend = legendHtml([{ label: 'תקין', color: 'var(--good)' }, { label: 'אזהרה', color: 'var(--warn)' }, { label: 'חריגה', color: 'var(--crit)' }]);
    const html = `
      <section class="section">${sectionHead('מחסן ומלאי', periodLabel(c))}<div class="grid-kpi cols-5">${tiles.join('')}</div></section>
      <section class="section"><div class="charts">
        ${panel('ch-min', 'מלאי כאחוז מהמינימום', 'חומרי גלם ואריזה. הקו המקווקו = 100%', { tall: rawRows.length > 8, legend: statusLegend })}
        ${panel('ch-cover', 'ימי כיסוי', `לפי צריכה ממוצעת ב-${C.coverLookbackDays} הימים האחרונים. מתחת ל-3 ימים = חריגה`, { tall: rawRows.length > 8, legend: statusLegend })}
      </div></section>
      <section class="section">${sectionHead('חומרי גלם ואריזה', '')}${tableHtml('t-raw', cols, rawRows, 'אין פריטים. הוסף פריטים במסך ההגדרות.')}</section>
      <section class="section">${sectionHead('מוצר מוגמר', 'ייצור תקין נכנס למלאי אוטומטית')}${tableHtml('t-fin', cols.filter((x) => x.key !== 'category'), finRows, 'אין פריטי מוצר מוגמר')}</section>`;
    return {
      html,
      after() {
        const r1 = rawRows.filter((r) => r.pctOfMin != null);
        drawChart('ch-min', 'bar', r1.map((r) => r.name), [{
          label: '% מהמינימום', colors: r1.map((r) => colorOf(minStatus(r))), data: r1.map((r) => Math.round(r.pctOfMin * 100)),
        }], { horizontal: true, legend: false, fmt: (v) => `${fmt.int(v)}%`, target: 100 });
        const r2 = rawRows.filter((r) => r.daysCover != null);
        drawChart('ch-cover', 'bar', r2.map((r) => r.name), [{
          label: 'ימי כיסוי', colors: r2.map((r) => colorOf(coverStatus(r))), data: r2.map((r) => Math.round(r.daysCover * 10) / 10),
        }], { horizontal: true, legend: false, fmt: (v) => `${fmt.dec(v)} ימים`, target: 7 });
      },
    };
  }

  const VIEWS = {
    owner: { label: 'בעלים', icon: 'owner', render: viewOwner, filters: true },
    machines: { label: 'מכונות', icon: 'machines', render: viewMachines, filters: true },
    workers: { label: 'עובדים', icon: 'workers', render: viewWorkers, filters: true },
    products: { label: 'מוצרים', icon: 'products', render: viewProducts, filters: true },
    inventory: { label: 'מלאי', icon: 'inventory', render: viewInventory, filters: true },
    entry: { label: 'הזנה', icon: 'entry', render: (c) => Forms.entry(c, api), filters: false },
    settings: { label: 'הגדרות', icon: 'settings', render: (c) => Forms.settings(c, api), filters: false, hiddenTab: true },
  };

  // ---------- header ----------
  function buildShell() {
    document.getElementById('brand-mark').innerHTML = C.machines.map((m) => `<span style="background:var(--m-${m.id})"></span>`).join('');
    document.getElementById('tabs-inner').innerHTML = Object.entries(VIEWS)
      .filter(([, v]) => !v.hiddenTab)
      .map(([id, v]) => `<a class="tab" href="#${id}" data-view="${id}">${icon(v.icon)}<span>${v.label}</span></a>`).join('');
    document.getElementById('settings-link').innerHTML = icon('settings');
    const periods = [['1', 'היום'], ['7', '7 ימים'], ['30', '30 יום'], ['custom', 'טווח']];
    document.getElementById('period-seg').innerHTML = periods.map(([v, l]) => `<button type="button" data-period="${v}">${l}</button>`).join('');
  }

  function updateHeader() {
    const s = App.state;
    document.getElementById('plant-name').textContent = s.settings.plantName || 'מאפייה';
    document.getElementById('today-label').textContent = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date());
    document.querySelectorAll('[data-period]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === App.ui.period)));
    const cr = document.getElementById('custom-range');
    cr.hidden = App.ui.period !== 'custom';
    const r = K.periodRange(App.ui.period, today(), App.ui.custom);
    document.getElementById('from-date').value = App.ui.custom.from || r.from;
    document.getElementById('to-date').value = App.ui.custom.to || r.to;
    const sel = document.getElementById('machine-filter');
    sel.innerHTML = `<option value="all">כל המכונות</option>${s.machines.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}`;
    sel.value = App.ui.machine;
    document.getElementById('filters').hidden = !VIEWS[App.ui.view].filters;
    document.querySelectorAll('[data-view]').forEach((a) => {
      if (a.dataset.view === App.ui.view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const sl = document.getElementById('settings-link');
    if (App.ui.view === 'settings') sl.setAttribute('aria-current', 'page');
    else sl.removeAttribute('aria-current');
    const themeIcon = { system: 'auto', light: 'sun', dark: 'moon' }[App.ui.theme];
    const themeText = { system: 'מצב תצוגה: לפי המכשיר', light: 'מצב תצוגה: בהיר', dark: 'מצב תצוגה: כהה' }[App.ui.theme];
    const tb = document.getElementById('theme-btn');
    tb.innerHTML = icon(themeIcon);
    tb.setAttribute('aria-label', themeText);
    tb.title = themeText;
    document.getElementById('storage-banner').hidden = App.persisted;
  }

  // On load, "system" leaves any theme the host page already stamped.
  function applyTheme(initial) {
    const root = document.documentElement;
    if (App.ui.theme !== 'system') root.setAttribute('data-theme', App.ui.theme);
    else if (!initial) root.removeAttribute('data-theme');
  }

  function setTheme(theme) {
    App.ui.theme = theme;
    saveUi();
    applyTheme(); // the data-theme observer re-renders
  }

  // ---------- render ----------
  function render() {
    Charts.destroyAll();
    App.tables = {};
    updateHeader();
    const c = ctx();
    const view = VIEWS[App.ui.view] || VIEWS.owner;
    const out = view.render(c);
    const main = document.getElementById('view');
    main.innerHTML = out.html;
    if (out.after) out.after();
  }

  function route() {
    const id = location.hash.replace('#', '');
    const next = VIEWS[id] ? id : 'owner';
    if (next !== App.ui.view) {
      if (App.ui.view === 'entry') App.ui.entryForm = null;
      App.ui.view = next;
      window.scrollTo(0, 0);
    }
    render();
  }

  function bindEvents() {
    window.addEventListener('hashchange', route);
    document.getElementById('period-seg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-period]');
      if (!b) return;
      App.ui.period = b.dataset.period;
      if (App.ui.period === 'custom' && !App.ui.custom.from) {
        const r = K.periodRange('30', today());
        App.ui.custom = { from: r.from, to: r.to };
      }
      saveUi();
      render();
    });
    ['from-date', 'to-date'].forEach((id) => document.getElementById(id).addEventListener('change', () => {
      App.ui.custom = { from: document.getElementById('from-date').value, to: document.getElementById('to-date').value };
      saveUi();
      render();
    }));
    document.getElementById('machine-filter').addEventListener('change', (e) => {
      App.ui.machine = e.target.value;
      if (e.target.value !== 'all') App.ui.selectedMachine = e.target.value;
      saveUi();
      render();
    });
    document.getElementById('theme-btn').addEventListener('click', () => {
      const order = ['system', 'light', 'dark'];
      setTheme(order[(order.indexOf(App.ui.theme) + 1) % order.length]);
    });
    document.getElementById('view').addEventListener('click', (e) => {
      const sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        const [id, key] = sortBtn.dataset.sort.split('|');
        const cur = App.sort[id];
        App.sort[id] = { key, dir: cur && cur.key === key && cur.dir === 'desc' ? 'asc' : 'desc' };
        const wrap = document.querySelector(`[data-table="${id}"]`);
        if (wrap && App.tables[id]) wrap.innerHTML = tableInner(id);
        const again = document.querySelector(`[data-sort="${id}|${key}"]`);
        if (again) again.focus();
        return;
      }
      const card = e.target.closest('[data-goto-machine]');
      if (card) {
        e.preventDefault();
        App.ui.selectedMachine = card.dataset.gotoMachine;
        if (App.ui.machine !== 'all') App.ui.machine = card.dataset.gotoMachine;
        saveUi();
        location.hash = '#machines';
        return;
      }
      const pick = e.target.closest('[data-pick-machine]');
      if (pick) {
        App.ui.selectedMachine = pick.dataset.pickMachine;
        if (App.ui.machine !== 'all') App.ui.machine = pick.dataset.pickMachine;
        saveUi();
        render();
      }
    });
    // Re-draw charts when the color scheme changes (OS setting or host toggle).
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => { if (App.ui.theme === 'system') render(); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
    let themeTimer = null;
    new MutationObserver(() => {
      clearTimeout(themeTimer);
      themeTimer = setTimeout(render, 50);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // API handed to the forms module.
  const api = {
    get state() { return App.state; },
    ui: App.ui,
    commit, replaceState, render, toast, openModal, closeModal, download, setTheme,
    fmt, esc, icon, pill, today, shiftName, reasonName, sectionHead, tableHtml,
    get persisted() { return App.persisted; },
  };

  function init() {
    document.documentElement.lang = 'he';
    document.documentElement.dir = 'rtl';
    loadUi();
    applyTheme(true);
    const loaded = Store.load();
    App.state = loaded.state;
    App.persisted = loaded.persisted;
    Charts.setup();
    downloadsApi();
    buildShell();
    bindEvents();
    const id = location.hash.replace('#', '');
    App.ui.view = VIEWS[id] ? id : 'owner';
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
