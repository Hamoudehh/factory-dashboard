/* App shell: header, filters, routing and the dashboard views. */
(function () {
  const C = window.CONFIG;
  const K = window.KPI;
  const Plan = window.Plan;

  // ---------- icons ----------
  const ICONS = {
    owner: '<path d="M3.3 17a9 9 0 1 1 17.4 0"/><path d="M12 14l4.5-4.5"/><circle cx="12" cy="14" r="1.2"/>',
    machines: '<path d="M2 21h20"/><path d="M4 21V9l5 3V9l5 3V4h5v17"/><path d="M8 17h2M13 17h2"/>',
    workers: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    products: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    inventory: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8"/><path d="M7 17h10"/>',
    plan: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 14h3M13.5 14h3M7.5 17.5h3"/>',
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
    suppliers: '<path d="M2 6h11v10H2z"/><path d="M13 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  };
  const icon = (name, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // ---------- formatting ----------
  const nfCache = {};
  const nf = (min, max) => (nfCache[min + '-' + max] = nfCache[min + '-' + max] || new Intl.NumberFormat('he-IL', { minimumFractionDigits: min, maximumFractionDigits: max }));
  const moneyFmt = (d) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: d, maximumFractionDigits: d });
  const bad = (v) => v == null || Number.isNaN(v) || !Number.isFinite(v);
  const fmt = {
    int: (v) => (bad(v) ? '—' : nf(0, 0).format(Math.round(v))),
    dec: (v, d = 1) => (bad(v) ? '—' : nf(d, d).format(v)),
    pct: (v, d = 1) => (bad(v) ? '—' : `${(v * 100).toFixed(d)}%`),
    money: (v, d = 0) => (bad(v) ? '—' : moneyFmt(d).format(v)),
    days: (v) => (bad(v) ? '—' : `${nf(1, 1).format(v)} ימים`),
    date: (iso) => { const p = iso.split('-'); return `${p[2]}/${p[1]}`; },
    dateLong: (iso) => { const p = iso.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; },
    weekday: (iso) => new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(K.parseISO(iso)),
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
    // Airtable sync. mode: local | connecting | empty | synced | saving | error
    cloud: { mode: 'local', message: '', pending: 0, lastSync: null, base: null },
    // Suppliers: read-only copy of the Airtable "ספקים" table, cached for the next open.
    suppliers: { list: [], at: null, error: '' },
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
    afterChange();
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
          afterChange();
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
    afterChange();
    render();
    if (message) toast(message, action);
  }

  // ---------- Airtable sync ----------
  // Airtable is the shared copy; localStorage keeps working when the connector is missing or fails.
  // cloud.base holds the state Airtable is known to have, so each sync sends only the difference.
  // Changes Airtable has not confirmed are also kept in localStorage, to be replayed after a reload.
  const PENDING_KEY = 'fd.v1.pending';
  function savePending(ops) {
    try {
      if (ops.length) localStorage.setItem(PENDING_KEY, JSON.stringify(ops));
      else localStorage.removeItem(PENDING_KEY);
    } catch (e) { /* storage full or blocked: the in-memory sync still runs */ }
  }
  function loadPending() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch (e) { return []; }
  }
  const cloudLinked = () => App.cloud.base != null && ['synced', 'saving', 'error'].includes(App.cloud.mode);
  let syncTimer = null;
  let errorShown = false;

  function setCloud(mode, message) {
    App.cloud.mode = mode;
    App.cloud.message = message || '';
    updateCloudChip();
  }

  function updateCloudChip() {
    const el = document.getElementById('cloud-chip');
    if (!el) return;
    const c = App.cloud;
    const text = {
      connecting: 'Airtable: טוען…',
      empty: 'Airtable: ממתין להעלאה',
      synced: 'Airtable: מסונכרן',
      saving: c.pending ? `Airtable: שומר ${fmt.int(c.pending)}…` : 'Airtable: שומר…',
      error: 'Airtable: לא נשמר',
    }[c.mode];
    el.hidden = !text;
    el.textContent = text || '';
    el.dataset.state = c.mode;
    el.title = c.message || (c.lastSync ? `סונכרן לאחרונה ב-${new Date(c.lastSync).toLocaleTimeString('he-IL')}` : '');
  }

  function onCloudError(e) {
    const d = Airtable.describeError(e);
    if (Airtable.OFFLINE_CODES.includes(d.code)) {
      App.cloud.base = null;
      setCloud('local');
    } else {
      const message = `${d.message} השינויים שמורים במכשיר ויישלחו כשהחיבור יחזור.`;
      setCloud('error', message);
      if (!errorShown) { errorShown = true; toast(message); }
    }
    if (App.ui.view === 'settings') render();
  }

  function afterChange() {
    if (!cloudLinked()) return;
    savePending(Airtable.diff(JSON.parse(App.cloud.base), App.state));
    clearTimeout(syncTimer);
    setCloud('saving');
    syncTimer = setTimeout(runSync, 600);
  }

  function runSync() {
    return Airtable.enqueue(async () => {
      const target = JSON.stringify(App.state);
      const ops = Airtable.diff(JSON.parse(App.cloud.base), JSON.parse(target));
      App.cloud.pending = Airtable.countOps(ops);
      updateCloudChip();
      if (ops.length) {
        await Airtable.apply(ops, (k) => { App.cloud.pending = Math.max(0, App.cloud.pending - k); updateCloudChip(); });
      }
      App.cloud.base = target;
      App.cloud.lastSync = Date.now();
      App.cloud.pending = 0;
      errorShown = false;
      if (JSON.stringify(App.state) !== target) return afterChange(); // edited while sending
      savePending([]);
      setCloud('synced');
      if (App.ui.view === 'settings') render();
    }).catch(onCloudError);
  }

  async function pullCloud(quiet) {
    if (!quiet) setCloud('connecting');
    const startVersion = App.version;
    const startState = JSON.stringify(App.state);
    try {
      const remote = await Airtable.pull();
      if (remote.empty) {
        App.cloud.base = null;
        setCloud('empty');
        render();
        return;
      }
      const pulled = Store.normalize(Object.assign(
        { version: C.schemaVersion, meta: { createdAt: new Date().toISOString(), source: 'airtable' }, settings: remote.settings || App.state.settings },
        remote.state,
      ));
      App.cloud.base = JSON.stringify(pulled);
      App.cloud.lastSync = Date.now();
      refreshSuppliers();
      // Changes that never reached Airtable (a failed save, or made during this load) go on top and are sent now.
      let unsent = loadPending();
      if (App.version !== startVersion) unsent = unsent.concat(Airtable.diff(JSON.parse(startState), App.state));
      if (unsent.length) {
        App.state = Airtable.overlay(pulled, unsent);
        App.version += 1;
        Store.save(App.state);
        setCloud('saving');
        render();
        afterChange();
        return;
      }
      const changed = JSON.stringify(App.state) !== App.cloud.base;
      App.state = pulled;
      App.version += 1;
      Store.save(App.state);
      setCloud('synced');
      if (changed || !quiet) render();
    } catch (e) {
      onCloudError(e);
    }
  }

  const SUP_KEY = 'fd.v1.suppliers';
  function loadSuppliers() {
    try {
      const saved = JSON.parse(localStorage.getItem(SUP_KEY));
      if (saved && Array.isArray(saved.list)) App.suppliers = Object.assign({ error: '' }, saved);
    } catch (e) { /* no cache */ }
  }

  // The suppliers table is optional: a failure keeps the last list and is shown on the screen.
  function refreshSuppliers() {
    return Airtable.pullSuppliers().then((list) => {
      App.suppliers = { list, at: Date.now(), error: '' };
      try { localStorage.setItem(SUP_KEY, JSON.stringify(App.suppliers)); } catch (e) { /* storage full */ }
      if (App.ui.view === 'suppliers') render();
    }).catch((e) => {
      App.suppliers.error = Airtable.describeError(e).message;
      if (App.ui.view === 'suppliers') render();
    });
  }

  async function connectCloud() {
    if (!window.Airtable) return;
    let ok = false;
    try { ok = await Airtable.init(); } catch (e) { ok = false; }
    if (!ok) return setCloud('local');
    await pullCloud(false);
  }

  // First connection to an empty base: upload everything, or only the lists and start clean.
  function uploadInitial(kind) {
    if (App.cloud.mode !== 'empty') return;
    if (kind === 'lists') {
      Store.saveBackup(App.state);
      App.state = Store.resetState(App.state, 'transactions');
    }
    App.state.meta = Object.assign({}, App.state.meta, { source: 'airtable' });
    App.version += 1;
    Store.save(App.state);
    App.cloud.base = JSON.stringify({ settings: null });
    savePending(Airtable.diff(JSON.parse(App.cloud.base), App.state));
    setCloud('saving');
    render();
    runSync().then(() => { if (App.cloud.mode === 'synced') toast('הנתונים הועלו ל-Airtable'); });
  }

  function cloudBanner() {
    if (App.cloud.mode !== 'empty') return '';
    return `<section class="cloud-banner" aria-labelledby="cloud-banner-title">
      <div>
        <h2 id="cloud-banner-title">Airtable מחובר. הבסיס עדיין ריק</h2>
        <p>בחר מה להעלות. מרגע ההעלאה כל שינוי בדשבורד נשמר גם ב-Airtable, וכל מי שפותח את הקישור רואה את אותם נתונים.</p>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" data-cloud-upload="all">העלה את כל הנתונים</button>
        <button type="button" class="btn" data-cloud-upload="lists">התחל נקי: רק רשימות</button>
      </div>
      <p class="hint">"התחל נקי" מעלה מכונות, מוצרים, עובדים ופריטי מלאי, ומוחק את דיווחי הדמו, הנוכחות ותנועות המלאי. לפני כן נשמר גיבוי.</p>
    </section>`;
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
    const P = s.settings.planning;
    const range = K.periodRange(App.ui.period, today(), App.ui.custom);
    const prev = K.previousRange(range);
    const len = K.dateList(range.from, range.to).length;
    const trend = len < 7 ? { from: K.addDays(range.to, -13), to: range.to } : range;
    const mf = App.ui.machine;
    const rate = Object.fromEntries(s.machines.map((m) => [m.id, Number(m.ratePerHour) || 0]));
    const perCarton = Plan.perCartonMap(s.products);
    const okMachine = (id) => mf === 'all' || id === mf;
    const logsIn = (r) => s.productionLogs.filter((l) => K.inRange(l.date, r) && okMachine(l.machineId));
    const attIn = (r) => s.attendance.filter((a) => K.inRange(a.date, r) && (mf === 'all' || a.machineId === mf));
    const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
    return {
      s, t, P, range, prev, trend, len, mf, rate, perCarton,
      logs: logsIn(range), prevLogs: logsIn(prev), trendLogs: logsIn(trend),
      att: attIn(range), prevAtt: attIn(prev),
      machines: byId(s.machines), products: byId(s.products), workers: byId(s.workers), items: byId(s.items),
      visibleMachines: s.machines.filter((m) => okMachine(m.id)),
    };
  }

  const machineColor = (id) => Charts.theme().machine(id);
  const statusColor = (st) => { const th = Charts.theme(); return { good: th.good, warn: th.warn, crit: th.crit, none: th.none }[st]; };
  const productionValue = (logs, products) => logs.reduce((a, l) => a + (Number(l.goodUnits) || 0) * (Number((products[l.productId] || {}).price) || 0), 0);
  const cartonsTotal = (logs, perCarton) => logs.reduce((a, l) => a + K.cartonsOf(l, perCarton), 0);
  const periodLabel = (c) => (c.len === 1 ? fmt.dateLong(c.range.to) : `${fmt.date(c.range.from)}–${fmt.date(c.range.to)}`);
  const trendLabel = (c) => (c.trend === c.range ? periodLabel(c) : '14 ימים אחרונים');
  const activeItems = (c) => c.s.items.filter((i) => i.active !== false);
  const invOpts = (c) => ({ perCarton: c.perCarton, workDays: C.workDays });

  // Finished goods: stock in cartons against customer demand per day.
  function finishedRows(c, asOf) {
    const fs = Plan.finishedStock(c.s, asOf);
    return c.s.products.filter((p) => p.active !== false).map((p) => {
      const demand = Number(p.dailyDemand) || 0;
      const actual = fs.actualDaily[p.id] || 0;
      const use = demand > 0 ? demand : actual;
      const stock = fs.stock[p.id] || 0;
      const cover = use > 0 ? stock / use : null;
      return {
        id: p.id, name: p.name, machineId: p.machineId, stock, demand, actual, perCarton: Number(p.unitsPerCarton) || 1,
        cover, status: Plan.coverStatus(cover, c.P.targetDays),
      };
    });
  }

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

  // Chart card: title, optional headline number, chart, and the same data as a table.
  function panel(id, title, sub, opts) {
    opts = opts || {};
    return `<section class="panel${opts.wide ? ' wide' : ''}" aria-labelledby="${id}-t">
      <div class="panel-head">
        <div><h3 id="${id}-t">${esc(title)}</h3>${sub ? `<p class="panel-sub">${sub}</p>` : ''}</div>
        ${opts.stat ? `<div class="panel-stat"><b>${opts.stat.value}</b><small>${esc(opts.stat.label)}</small></div>` : ''}
      </div>
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
  const statusLegend = (labels) => legendHtml([
    { label: labels ? labels[0] : 'תקין', color: 'var(--good)' },
    { label: labels ? labels[1] : 'אזהרה', color: 'var(--warn)' },
    { label: labels ? labels[2] : 'חריגה', color: 'var(--crit)' },
  ]);

  function sectionHead(title, sub) {
    return `<div class="section-head"><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
  }

  // ---------- alerts ----------
  function buildAlerts(c, inv, fin) {
    const out = [];
    const t = c.t;
    for (const m of c.visibleMachines) {
      const ms = K.productionSummary(c.logs.filter((l) => l.machineId === m.id), c.rate);
      if (ms.oee == null) continue;
      const st = K.statusHigh(ms.oee, t.oee, t.oeeWarn);
      if (st !== 'good') out.push({ status: st, text: `OEE ${m.name}: ${fmt.pct(ms.oee)}`, sub: `יעד ${fmt.pct(t.oee, 0)} · זמינות ${fmt.pct(ms.A, 0)} · ביצועים ${fmt.pct(ms.P, 0)}` });
    }
    for (const r of fin) {
      if (r.status === 'crit' && (c.mf === 'all' || r.machineId === c.mf)) {
        out.push({ status: 'crit', text: `${r.name}: מלאי ל-${fmt.days(r.cover)}`, sub: `${fmt.int(r.stock)} קרטונים · צריכה ${fmt.int(r.demand)} ליום · ${(c.machines[r.machineId] || {}).name || ''}` });
      }
    }
    for (const p of K.productSummary(c.logs, c.s.products)) {
      const st = K.statusLow(p.scrapRate, t.scrapMax, t.scrapWarn);
      if (st === 'crit') out.push({ status: st, text: `פחת ייצור גבוה ב${p.name}: ${fmt.pct(p.scrapRate)}`, sub: `יעד עד ${fmt.pct(t.scrapMax, 0)}` });
    }
    for (const r of inv.belowMin) {
      if (r.category === 'finished') continue;
      out.push({ status: 'crit', text: `${r.name} מתחת למינימום: ${fmt.int(r.qty)} ${r.unit}`, sub: `מינימום ${fmt.int(r.minQty)} ${r.unit}` });
    }
    for (const r of inv.rows) {
      if (r.active && !r.belowMin && r.category !== 'finished' && r.daysCover != null && r.daysCover < 3) {
        out.push({ status: 'warn', text: `${r.name}: נשארו ${fmt.days(r.daysCover)} כיסוי`, sub: `צריכה ממוצעת ${fmt.int(r.avgDaily)} ${r.unit} ליום` });
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

  // ---------- shared charts ----------
  function oeeByMachineChart(c, id, logs) {
    const ms = c.visibleMachines;
    const vals = ms.map((m) => K.productionSummary(logs.filter((l) => l.machineId === m.id), c.rate).oee);
    drawChart(id, 'bar', ms.map((m) => m.name), [{
      label: 'OEE', colors: ms.map((m) => machineColor(m.id)), data: vals.map((v) => (v == null ? null : Math.round(v * 1000) / 10)),
    }], { legend: false, fmt: (v) => `${fmt.dec(v)}%`, max: 100, target: c.t.oee * 100, targetLabel: `יעד ${fmt.pct(c.t.oee, 0)}` });
  }

  function dailyOeeChart(c, id, machineId) {
    const dates = K.dateList(c.trend.from, c.trend.to).filter((d) => K.isWorkDay(d, C.workDays));
    const logs = c.s.productionLogs.filter((l) => l.machineId === machineId && K.inRange(l.date, c.trend));
    const d = K.dailyByMachine(logs, dates, c.rate, [machineId], c.perCarton);
    const vals = d.oee[machineId];
    drawChart(id, 'bar', dates.map(fmt.date), [{
      label: 'OEE', colors: vals.map((v) => statusColor(K.statusHigh(v, c.t.oee, c.t.oeeWarn))), data: vals.map((v) => (v == null ? null : Math.round(v * 1000) / 10)),
    }], { legend: false, fmt: (v) => `${fmt.dec(v)}%`, valueFmt: (v) => `${Math.round(v)}%`, max: 100, target: c.t.oee * 100, targetLabel: `יעד ${fmt.pct(c.t.oee, 0)}` });
  }

  function cartonsChart(c, id, machineIds, logs) {
    const dates = K.dateList(c.trend.from, c.trend.to).filter((d) => K.isWorkDay(d, C.workDays));
    const d = K.dailyByMachine(logs, dates, c.rate, machineIds, c.perCarton);
    drawChart(id, 'bar', dates.map(fmt.date), machineIds.map((mid) => ({
      label: c.machines[mid].name, color: machineColor(mid), data: d.cartons[mid].map((v) => Math.round(v)),
    })), { stacked: machineIds.length > 1, legend: machineIds.length > 1, fmt: (v) => `${fmt.int(v)} קר'`, valueFmt: (v) => fmt.int(v) });
  }

  function downtimeChart(c, id, logs) {
    const sum = K.sumProduction(logs, c.rate);
    const th = Charts.theme();
    const reasons = C.downtimeReasons;
    drawChart(id, 'bar', reasons.map((r) => r.name), [{
      label: 'דקות השבתה', colors: reasons.map((r) => th.reason(r.id)), data: reasons.map((r) => sum.downByReason[r.id] || 0),
    }], { legend: false, fmt: (v) => `${fmt.int(v)} דק'`, valueFmt: (v) => fmt.int(v) });
    return sum.downMinutes;
  }

  function coverChart(c, id, rows) {
    drawChart(id, 'bar', rows.map((r) => r.name), [{
      label: 'ימי מלאי', colors: rows.map((r) => statusColor(r.status)), data: rows.map((r) => (r.cover == null ? null : Math.round(r.cover * 10) / 10)),
    }], { horizontal: true, legend: false, zero: true, fmt: (v) => fmt.days(v), valueFmt: (v) => fmt.dec(v), target: c.P.targetDays, targetLabel: `יעד ${c.P.targetDays} ימים` });
  }

  // ---------- views ----------
  function viewOwner(c) {
    const t = c.t;
    const p = K.productionSummary(c.logs, c.rate);
    const pp = K.productionSummary(c.prevLogs, c.rate);
    const cartons = cartonsTotal(c.logs, c.perCarton);
    const prevCartons = cartonsTotal(c.prevLogs, c.perCarton);
    const value = productionValue(c.logs, c.products);
    const prevValue = productionValue(c.prevLogs, c.products);
    const w = K.workerSummary(c.att, c.logs, c.s.workers, C.overtimeFactor);
    const pw = K.workerSummary(c.prevAtt, c.prevLogs, c.s.workers, C.overtimeFactor);
    const inv = K.inventorySummary(activeItems(c), c.s.stockMoves, c.s.productionLogs, c.range.to, C.coverLookbackDays, invOpts(c));
    const invPrev = K.inventorySummary(activeItems(c), c.s.stockMoves, c.s.productionLogs, c.prev.to, C.coverLookbackDays, invOpts(c));
    const fin = finishedRows(c, c.range.to);
    const rawBelow = inv.belowMin.filter((r) => r.category !== 'finished');

    const tiles = [
      tile({ label: 'OEE כולל', value: fmt.pct(p.oee), sub: `יעד ${fmt.pct(t.oee, 0)}`, status: K.statusHigh(p.oee, t.oee, t.oeeWarn), delta: delta(p.oee, pp.oee, 'pp', true) }),
      tile({ label: 'קרטונים תקינים', value: fmt.int(cartons), sub: `${fmt.int(p.good)} יח' · ${fmt.pct(p.adherence, 0)} מהתכנון`, status: K.statusHigh(p.adherence, t.planAdherence, t.planAdherenceWarn), delta: delta(cartons, prevCartons, 'rel', true) }),
      tile({ label: 'פחת ייצור', value: fmt.pct(p.scrapRate), sub: `${fmt.int(p.scrap)} יח' · יעד עד ${fmt.pct(t.scrapMax, 0)}`, status: K.statusLow(p.scrapRate, t.scrapMax, t.scrapWarn), delta: delta(p.scrapRate, pp.scrapRate, 'pp', false) }),
      tile({ label: 'ערך ייצור', value: fmt.money(value), sub: 'לפי מחיר מכירה', delta: delta(value, prevValue, 'rel', true) }),
      tile({ label: 'עלות עבודה ליחידה', value: fmt.money(w.costPerUnit, 2), sub: `סה"כ ${fmt.money(w.totalCost)}`, delta: delta(w.costPerUnit, pw.costPerUnit, 'rel', false) }),
      tile({ label: 'ערך מלאי', value: fmt.money(inv.totalValue), sub: rawBelow.length ? `${rawBelow.length} חומרי גלם מתחת למינימום` : 'כל חומרי הגלם מעל המינימום', status: rawBelow.length ? 'crit' : 'good', delta: delta(inv.totalValue, invPrev.totalValue, 'rel', true) }),
    ];

    const cards = c.s.machines.map((m) => {
      const logs = c.s.productionLogs.filter((l) => l.machineId === m.id && K.inRange(l.date, c.range));
      const ms = K.productionSummary(logs, c.rate);
      const st = K.statusHigh(ms.oee, t.oee, t.oeeWarn);
      const meter = (label, v) => `<div class="meter"><span>${label}</span><div class="meter-track"><div class="meter-fill" style="width:${v == null ? 0 : Math.round(v * 100)}%"></div></div><b>${fmt.pct(v, 0)}</b></div>`;
      return `<a class="mcard" href="#machines" style="--mc:var(--m-${m.id})" data-goto-machine="${m.id}">
        <div class="mcard-head"><h3>${esc(m.name)}</h3>${pill(st)}</div>
        <div class="mcard-oee"><strong>${fmt.pct(ms.oee, 0)}</strong><span>OEE</span></div>
        <div class="meters">${meter('זמינות', ms.A)}${meter('ביצועים', ms.P)}${meter('איכות', ms.Q)}</div>
        <div class="mcard-stats"><span>קרטונים <b>${fmt.int(cartonsTotal(logs, c.perCarton))}</b></span><span>השבתה <b>${fmt.int(ms.downMinutes)}</b> דק'</span><span>פחת <b>${fmt.pct(ms.scrapRate)}</b></span></div>
      </a>`;
    }).join('');

    const alerts = buildAlerts(c, inv, fin);
    const urgent = fin.filter((r) => r.cover != null && (c.mf === 'all' || r.machineId === c.mf)).sort((a, b) => a.cover - b.cover).slice(0, 8);
    const workDaysInTrend = K.workDaysBetween(c.trend.from, c.trend.to, C.workDays) || 1;
    const trendCartons = cartonsTotal(c.trendLogs, c.perCarton);
    const html = `
      <section class="section" aria-label="מדדים ראשיים">${sectionHead('תמונת מצב', periodLabel(c) + (c.mf !== 'all' ? ` · ${esc(c.machines[c.mf].name)}` : ''))}<div class="grid-kpi">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('מכונות', 'לחיצה על מכונה פותחת את הפירוט שלה')}<div class="machine-cards">${cards}</div></section>
      <section class="section">${sectionHead('התראות', alerts.length ? `${alerts.length} פתוחות` : '')}${alertsHtml(alerts)}</section>
      <section class="section">${sectionHead('גרפים', '')}
        <div class="charts">
          ${panel('ch-oee', 'OEE לפי מכונה', `${periodLabel(c)} · הקו המקווקו הוא היעד`, { stat: { value: fmt.pct(p.oee), label: 'OEE כולל' } })}
          ${panel('ch-cartons', 'קרטונים ליום לפי מכונה', trendLabel(c), { stat: { value: fmt.int(trendCartons / workDaysInTrend), label: 'ממוצע ליום עבודה' } })}
          ${panel('ch-down', 'דקות השבתה לפי סיבה', periodLabel(c), { stat: { value: fmt.int(p.downMinutes), label: 'דקות השבתה' } })}
          ${panel('ch-urgent', 'ימי מלאי – המוצרים הדחופים', `צריכת לקוחות מול מלאי מוגמר · יעד ${c.P.targetDays} ימים`, { stat: { value: fmt.int(fin.filter((r) => r.status === 'crit').length), label: 'מתחת ליום מלאי' } })}
        </div>
      </section>`;
    return {
      html,
      after() {
        oeeByMachineChart(c, 'ch-oee', c.logs);
        cartonsChart(c, 'ch-cartons', c.visibleMachines.map((m) => m.id), c.trendLogs);
        downtimeChart(c, 'ch-down', c.logs);
        coverChart(c, 'ch-urgent', urgent);
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
    const cartons = cartonsTotal(logs, c.perCarton);

    const picker = c.s.machines.map((x) => `<button type="button" class="mpick" style="--mc:var(--m-${x.id})" data-pick-machine="${x.id}" aria-pressed="${x.id === m.id}"><i></i>${esc(x.name)}</button>`).join('');
    const tiles = [
      tile({ label: 'OEE', value: fmt.pct(s.oee), sub: `יעד ${fmt.pct(t.oee, 0)}`, status: K.statusHigh(s.oee, t.oee, t.oeeWarn), delta: delta(s.oee, ps.oee, 'pp', true) }),
      tile({ label: 'זמינות', value: fmt.pct(s.A), sub: `${fmt.int(s.runMinutes)} מתוך ${fmt.int(s.plannedMinutes)} דק'`, status: K.statusHigh(s.A, 0.9, 0.8), delta: delta(s.A, ps.A, 'pp', true) }),
      tile({ label: 'ביצועים', value: fmt.pct(s.P), sub: `קצב אידיאלי ${fmt.int(m.ratePerHour)}/שעה`, status: K.statusHigh(s.P, 0.95, 0.85), delta: delta(s.P, ps.P, 'pp', true) }),
      tile({ label: 'איכות', value: fmt.pct(s.Q), sub: `${fmt.int(s.scrap)} יח' פחת ייצור`, status: K.statusHigh(s.Q, 0.97, 0.95), delta: delta(s.Q, ps.Q, 'pp', true) }),
      tile({ label: 'קרטונים תקינים', value: fmt.int(cartons), sub: `${fmt.int(s.good)} יח' · ${fmt.int(s.unitsPerHour)} יח'/שעה`, delta: delta(cartons, cartonsTotal(prevLogs, c.perCarton), 'rel', true) }),
      tile({ label: 'פחת ייצור', value: fmt.pct(s.scrapRate), sub: `יעד עד ${fmt.pct(t.scrapMax, 0)}`, status: K.statusLow(s.scrapRate, t.scrapMax, t.scrapWarn), delta: delta(s.scrapRate, ps.scrapRate, 'pp', false) }),
      tile({ label: 'דקות השבתה', value: fmt.int(s.downMinutes), sub: `${fmt.pct(1 - (s.A == null ? 1 : s.A))} מהזמן המתוכנן`, delta: delta(s.downMinutes, ps.downMinutes, 'rel', false) }),
      tile({ label: 'תקלות', value: fmt.int(s.breakdowns), sub: `${fmt.int(s.breakdownMinutes)} דק' תקלה`, delta: delta(s.breakdowns, ps.breakdowns, 'rel', false) }),
      tile({ label: 'MTTR', value: s.mttr == null ? '—' : `${fmt.int(s.mttr)} דק'`, sub: 'זמן ממוצע לתיקון', delta: delta(s.mttr, ps.mttr, 'rel', false) }),
      tile({ label: 'MTBF', value: s.mtbfHours == null ? '—' : `${fmt.dec(s.mtbfHours)} ש'`, sub: 'שעות ריצה בין תקלות', delta: delta(s.mtbfHours, ps.mtbfHours, 'rel', true) }),
    ];

    const rows = logs.map((l) => {
      const one = K.productionSummary([l], c.rate);
      return {
        date: l.date, product: (c.products[l.productId] || {}).name || '—', minutes: l.plannedMinutes,
        planned: l.plannedUnits, good: l.goodUnits, cartons: K.cartonsOf(l, c.perCarton), scrap: l.scrapUnits, down: K.logDowntime(l), oee: one.oee,
        reasons: (l.downtimes || []).filter((d) => d.minutes > 0).map((d) => `${reasonName(d.reason)} ${d.minutes}`).join(', '),
      };
    }).sort((a, b) => (a.date < b.date ? 1 : -1));

    const byProduct = K.productSummary(logs, c.s.products.filter((p) => p.machineId === m.id)).map((r) => Object.assign(r, { cartons: r.good / (c.perCarton[r.id] || 1) }));
    const html = `
      <section class="section">${sectionHead('בחר מכונה', '')}<div class="machine-picker" role="group" aria-label="בחירת מכונה">${picker}</div></section>
      <section class="section">${sectionHead(m.name, periodLabel(c))}<div class="grid-kpi cols-5">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('גרפים', '')}
        <div class="charts">
          ${panel('ch-m-oee', `OEE יומי – ${m.name}`, `${trendLabel(c)} · צבע לפי מצב מול היעד`, { stat: { value: fmt.pct(s.oee), label: 'OEE בתקופה' }, legend: statusLegend([`מעל ${fmt.pct(t.oee, 0)}`, `${fmt.pct(t.oeeWarn, 0)}–${fmt.pct(t.oee, 0)}`, `מתחת ל-${fmt.pct(t.oeeWarn, 0)}`]) })}
          ${panel('ch-m-cartons', `קרטונים ליום – ${m.name}`, trendLabel(c), { stat: { value: fmt.int(cartons), label: 'קרטונים בתקופה' } })}
          ${panel('ch-m-products', 'קרטונים לפי מוצר', periodLabel(c), { tall: byProduct.length > 6 })}
          ${panel('ch-m-down', 'דקות השבתה לפי סיבה', periodLabel(c), { stat: { value: fmt.int(s.downMinutes), label: 'דקות השבתה' } })}
        </div>
      </section>
      <section class="section">${sectionHead('דיווחי ייצור', `${rows.length} דיווחים`)}
        ${tableHtml('t-machine', [
          { key: 'date', label: 'תאריך', fmt: (v) => fmt.date(v) },
          { key: 'product', label: 'מוצר' },
          { key: 'minutes', label: 'דקות', num: true, fmt: (v) => fmt.int(v) },
          { key: 'planned', label: 'מתוכנן', num: true, fmt: (v) => fmt.int(v) },
          { key: 'good', label: 'תקין', num: true, fmt: (v) => fmt.int(v) },
          { key: 'cartons', label: 'קרטונים', num: true, fmt: (v) => fmt.dec(v) },
          { key: 'scrap', label: 'פחת ייצור', num: true, fmt: (v) => fmt.int(v) },
          { key: 'down', label: 'השבתה (דק\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'oee', label: 'OEE', num: true, fmt: (v) => `${fmt.pct(v)} ${pillIcon(K.statusHigh(v, t.oee, t.oeeWarn))}` },
          { key: 'reasons', label: 'סיבות השבתה' },
        ], rows, 'אין דיווחים למכונה בתקופה הזו')}
      </section>`;
    return {
      html,
      after() {
        dailyOeeChart(c, 'ch-m-oee', m.id);
        cartonsChart(c, 'ch-m-cartons', [m.id], c.s.productionLogs.filter((l) => l.machineId === m.id && K.inRange(l.date, c.trend)));
        const bp = byProduct.filter((r) => r.good > 0).sort((a, b) => b.cartons - a.cartons);
        drawChart('ch-m-products', 'bar', bp.map((r) => r.name), [{ label: 'קרטונים', color: machineColor(m.id), data: bp.map((r) => Math.round(r.cartons)) }], { horizontal: true, legend: false, fmt: (v) => `${fmt.int(v)} קר'`, valueFmt: (v) => fmt.int(v) });
        downtimeChart(c, 'ch-m-down', logs);
      },
    };
  }

  function viewWorkers(c) {
    const t = c.t;
    const w = K.workerSummary(c.att, c.logs, c.s.workers, C.overtimeFactor);
    const pw = K.workerSummary(c.prevAtt, c.prevLogs, c.s.workers, C.overtimeFactor);
    const a = w.attendance;
    const home = {};
    for (const r of c.s.attendance) if (r.machineId) home[r.workerId] = r.machineId; // latest machine per worker
    const tiles = [
      tile({ label: 'נוכחות', value: fmt.pct(a.rate), sub: `${a.counts.present} ימי עבודה · יעד ${fmt.pct(t.attendance, 0)}`, status: K.statusHigh(a.rate, t.attendance, t.attendanceWarn), delta: delta(a.rate, pw.attendance.rate, 'pp', true) }),
      tile({ label: 'שעות עבודה', value: fmt.int(a.totalHours), sub: `${fmt.int(a.hours)} רגילות + ${fmt.int(a.overtime)} נוספות`, delta: delta(a.totalHours, pw.attendance.totalHours, 'rel', true) }),
      tile({ label: 'שעות נוספות', value: fmt.pct(a.overtimeShare), sub: `המשך עד ${esc(c.s.settings.shift.extendedEnd)} · יעד עד 10%`, status: K.statusLow(a.overtimeShare, 0.1, 0.15), delta: delta(a.overtimeShare, pw.attendance.overtimeShare, 'pp', false) }),
      tile({ label: 'יחידות לשעת עבודה', value: fmt.int(w.unitsPerLaborHour), sub: 'תקין ÷ שעות עבודה', delta: delta(w.unitsPerLaborHour, pw.unitsPerLaborHour, 'rel', true) }),
      tile({ label: 'עלות עבודה ליחידה', value: fmt.money(w.costPerUnit, 2), sub: `נוספות ×${C.overtimeFactor}`, delta: delta(w.costPerUnit, pw.costPerUnit, 'rel', false) }),
      tile({ label: 'עלות עבודה', value: fmt.money(w.totalCost), sub: periodLabel(c), delta: delta(w.totalCost, pw.totalCost, 'rel', false) }),
    ];
    const rows = w.rows.filter((r) => r.active || r.shifts > 0).map((r) => Object.assign(r, { machineId: home[r.id] || '' }));
    const byUnits = rows.filter((r) => r.unitsPerHour != null).sort((x, y) => y.unitsPerHour - x.unitsPerHour);
    const machinesShown = [...new Set(byUnits.map((r) => r.machineId).filter(Boolean))];
    const html = `
      <section class="section">${sectionHead('עובדים', periodLabel(c) + (c.mf !== 'all' ? ` · ${esc(c.machines[c.mf].name)}` : ''))}<div class="grid-kpi">${tiles.join('')}</div></section>
      <section class="section"><div class="charts">
        ${panel('ch-att', 'התפלגות נוכחות', 'ימי עבודה לפי סטטוס', { stat: { value: fmt.pct(a.rate), label: 'נוכחות' } })}
        ${panel('ch-uph', 'יחידות לשעת עבודה לפי עובד', 'צבע לפי המכונה של העובד. התפוקה מתחלקת שווה בין העובדים שבדיווח', { tall: byUnits.length > 10, legend: legendHtml(machinesShown.map((id) => ({ label: c.machines[id].name, color: `var(--m-${id})` }))) })}
      </div></section>
      <section class="section">${sectionHead('טבלת עובדים', 'לחיצה על כותרת ממיינת')}
        ${tableHtml('t-workers', [
          { key: 'name', label: 'עובד' },
          { key: 'role', label: 'תפקיד' },
          { key: 'machineId', label: 'מכונה', fmt: (v) => (v ? machineLabel(c, v) : '—') },
          { key: 'shifts', label: 'ימי עבודה', num: true, fmt: (v) => fmt.int(v) },
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
          label: 'ימים', data: C.attendanceStatus.map((s) => a.counts[s.id]), colors: [th.good, th.crit, th.warn, th.none],
        }], { centerText: fmt.pct(a.rate, 0), centerSub: 'נוכחות' });
        drawChart('ch-uph', 'bar', byUnits.map((r) => r.name), [{
          label: 'יח\' לשעה', colors: byUnits.map((r) => (r.machineId ? machineColor(r.machineId) : th.bar)), data: byUnits.map((r) => Math.round(r.unitsPerHour)),
        }], { horizontal: true, legend: false });
      },
    };
  }

  function viewProducts(c) {
    const t = c.t;
    const list = c.s.products.filter((p) => c.mf === 'all' || p.machineId === c.mf);
    const withCartons = (rows) => rows.map((r) => Object.assign(r, { cartons: r.good / (c.perCarton[r.id] || 1), plannedCartons: r.planned / (c.perCarton[r.id] || 1), perCarton: c.perCarton[r.id] || 1 }));
    const ps = withCartons(K.productSummary(c.logs, list));
    const prev = withCartons(K.productSummary(c.prevLogs, list));
    const tot = (arr, k) => arr.reduce((a, r) => a + r[k], 0);
    const good = tot(ps, 'good');
    const planned = tot(ps, 'planned');
    const scrap = tot(ps, 'scrap');
    const pGood = tot(prev, 'good');
    const pPlanned = tot(prev, 'planned');
    const pScrap = tot(prev, 'scrap');
    const ratio = (x, y) => (y > 0 ? x / y : null);
    const tiles = [
      tile({ label: 'קרטונים תקינים', value: fmt.int(tot(ps, 'cartons')), sub: `${fmt.int(good)} יח' · ${list.length} מוצרים`, delta: delta(tot(ps, 'cartons'), tot(prev, 'cartons'), 'rel', true) }),
      tile({ label: 'עמידה בתכנון', value: fmt.pct(ratio(good, planned)), sub: `מתוכנן ${fmt.int(tot(ps, 'plannedCartons'))} קרטונים`, status: K.statusHigh(ratio(good, planned), t.planAdherence, t.planAdherenceWarn), delta: delta(ratio(good, planned), ratio(pGood, pPlanned), 'pp', true) }),
      tile({ label: 'פחת ייצור', value: fmt.pct(ratio(scrap, good + scrap)), sub: `${fmt.int(scrap)} יח'`, status: K.statusLow(ratio(scrap, good + scrap), t.scrapMax, t.scrapWarn), delta: delta(ratio(scrap, good + scrap), ratio(pScrap, pGood + pScrap), 'pp', false) }),
      tile({ label: 'ערך ייצור', value: fmt.money(tot(ps, 'value')), sub: 'לפי מחיר מכירה', delta: delta(tot(ps, 'value'), tot(prev, 'value'), 'rel', true) }),
      tile({ label: 'עלות פחת ייצור', value: fmt.money(tot(ps, 'scrapCost')), sub: 'לפי עלות ליחידה', delta: delta(tot(ps, 'scrapCost'), tot(prev, 'scrapCost'), 'rel', false) }),
    ];
    const active = ps.filter((p) => p.planned > 0 || p.good > 0).sort((a, b) => b.cartons - a.cartons);
    const top = active.slice(0, 5).map((p, i) => `<li class="alert" style="--pill:var(--m-${p.machineId})"><b class="num">${i + 1}</b><div><p>${esc(p.name)} · ${fmt.int(p.cartons)} קרטונים</p><small>${esc((c.machines[p.machineId] || {}).name || '')} · ${fmt.money(p.value)}</small></div></li>`).join('');
    const machinesShown = [...new Set(active.map((p) => p.machineId))];
    const html = `
      <section class="section">${sectionHead('מוצרים', periodLabel(c) + (c.mf !== 'all' ? ` · ${esc(c.machines[c.mf].name)}` : ''))}<div class="grid-kpi cols-5">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('Top 5 לפי קרטונים', '')}${top ? `<ol class="alerts">${top}</ol>` : '<div class="empty">אין ייצור בתקופה הזו</div>'}</section>
      <section class="section"><div class="charts">
        ${panel('ch-plan', 'מתוכנן מול תקין לפי מוצר (קרטונים)', 'תקין בצבע המכונה', { tall: active.length > 6, legend: legendHtml([{ label: 'מתוכנן', color: 'var(--bar-muted)' }].concat(machinesShown.map((id) => ({ label: `תקין – ${c.machines[id].name}`, color: `var(--m-${id})` })))) })}
        ${panel('ch-scrap', 'פחת ייצור % לפי מוצר', `הקו המקווקו הוא היעד (${fmt.pct(t.scrapMax, 0)})`, { tall: active.length > 6, legend: statusLegend() })}
      </div></section>
      <section class="section">${sectionHead('טבלת מוצרים', '')}
        ${tableHtml('t-products', [
          { key: 'name', label: 'מוצר' },
          { key: 'machineId', label: 'מכונה', fmt: (v) => machineLabel(c, v) },
          { key: 'perCarton', label: 'יח\' בקרטון', num: true, fmt: (v) => fmt.int(v) },
          { key: 'plannedCartons', label: 'מתוכנן (קר\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'cartons', label: 'תקין (קר\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'adherence', label: 'עמידה', num: true, fmt: (v) => fmt.pct(v, 0) },
          { key: 'scrap', label: 'פחת ייצור (יח\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'scrapRate', label: 'פחת ייצור %', num: true, fmt: (v) => `${fmt.pct(v)} ${pillIcon(K.statusLow(v, t.scrapMax, t.scrapWarn))}` },
          { key: 'value', label: 'ערך', num: true, fmt: (v) => fmt.money(v) },
          { key: 'scrapCost', label: 'עלות פחת ייצור', num: true, fmt: (v) => fmt.money(v) },
        ], ps, 'אין מוצרים. הוסף מוצרים במסך ההגדרות.')}
      </section>`;
    return {
      html,
      after() {
        const th = Charts.theme();
        drawChart('ch-plan', 'bar', active.map((p) => p.name), [
          { label: 'מתוכנן', color: th.barMuted, data: active.map((p) => Math.round(p.plannedCartons)) },
          { label: 'תקין', colors: active.map((p) => machineColor(p.machineId)), data: active.map((p) => Math.round(p.cartons)) },
        ], { horizontal: true, legend: false, fmt: (v) => `${fmt.int(v)} קר'`, valueFmt: (v) => fmt.int(v) });
        drawChart('ch-scrap', 'bar', active.map((p) => p.name), [{
          label: 'פחת ייצור %', colors: active.map((p) => statusColor(K.statusLow(p.scrapRate, t.scrapMax, t.scrapWarn))), data: active.map((p) => (p.scrapRate == null ? null : Math.round(p.scrapRate * 1000) / 10)),
        }], { horizontal: true, legend: false, fmt: (v) => `${fmt.dec(v)}%`, target: t.scrapMax * 100, targetLabel: `יעד ${fmt.pct(t.scrapMax, 0)}` });
      },
    };
  }

  function viewInventory(c) {
    const items = activeItems(c);
    const inv = K.inventorySummary(items, c.s.stockMoves, c.s.productionLogs, c.range.to, C.coverLookbackDays, invOpts(c));
    const movesIn = c.s.stockMoves.filter((m) => K.inRange(m.date, c.range));
    const totals = K.moveTotals(movesIn);
    const acc = K.countAccuracy(movesIn);
    const count = (type) => movesIn.filter((m) => m.type === type).length;
    const catName = (id) => (C.itemCategories.find((x) => x.id === id) || {}).name || id;
    const minStatus = (r) => (r.pctOfMin == null ? 'none' : r.pctOfMin < 1 ? 'crit' : r.pctOfMin < 1.3 ? 'warn' : 'good');
    const coverStatus = (r) => (r.daysCover == null ? 'none' : r.daysCover < 3 ? 'crit' : r.daysCover <= 7 ? 'warn' : 'good');
    const rawRows = inv.rows.filter((r) => r.category !== 'finished');
    const rawBelow = inv.belowMin.filter((r) => r.category !== 'finished');
    const fin = finishedRows(c, c.range.to).filter((r) => c.mf === 'all' || r.machineId === c.mf).sort((a, b) => (a.cover == null ? 1 : b.cover == null ? -1 : a.cover - b.cover));
    const finValue = inv.rows.filter((r) => r.category === 'finished').reduce((a, r) => a + r.value, 0);

    const tiles = [
      tile({ label: 'ערך מלאי', value: fmt.money(inv.totalValue), sub: `מתוכו ${fmt.money(finValue)} מוצר מוגמר` }),
      tile({ label: 'מוצרים מתחת ליום מלאי', value: fmt.int(fin.filter((r) => r.status === 'crit').length), sub: `ועוד ${fin.filter((r) => r.status === 'warn').length} מתחת ליעד (${c.P.targetDays} ימים)`, status: fin.some((r) => r.status === 'crit') ? 'crit' : fin.some((r) => r.status === 'warn') ? 'warn' : 'good' }),
      tile({ label: 'חומרי גלם מתחת למינימום', value: fmt.int(rawBelow.length), sub: rawBelow.slice(0, 3).map((r) => r.name).join(', ') || 'אין', status: rawBelow.length ? 'crit' : 'good' }),
      tile({ label: 'דיוק ספירה', value: fmt.pct(acc), sub: `${totals.count} ספירות בתקופה`, status: K.statusHigh(acc, 0.98, 0.95) }),
      tile({ label: 'תנועות מלאי', value: fmt.int(count('in') + count('out')), sub: `${count('in')} כניסות · ${count('out')} יציאות · ${count('scrap')} פחת` }),
    ];
    const rawCols = [
      { key: 'name', label: 'פריט' },
      { key: 'category', label: 'סוג', fmt: (v) => esc(catName(v)) },
      { key: 'qty', label: 'כמות', num: true, fmt: (v, r) => `${fmt.int(v)} ${esc(r.unit)}` },
      { key: 'minQty', label: 'מינימום', num: true, fmt: (v) => fmt.int(v) },
      { key: 'pctOfMin', label: '% מהמינימום', num: true, fmt: (v, r) => `${fmt.pct(v, 0)} ${pillIcon(minStatus(r))}` },
      { key: 'avgDaily', label: 'צריכה ליום', num: true, fmt: (v) => fmt.int(v) },
      { key: 'daysCover', label: 'ימי כיסוי', num: true, fmt: (v, r) => `${fmt.dec(v)} ${pillIcon(coverStatus(r))}` },
      { key: 'value', label: 'ערך', num: true, fmt: (v) => fmt.money(v) },
    ];
    const html = `
      <section class="section">${sectionHead('מחסן ומלאי', `נכון ל-${fmt.dateLong(c.range.to)}`)}<div class="grid-kpi cols-5">${tiles.join('')}</div></section>
      <section class="section">${sectionHead('מלאי מוצרים מוגמרים וצריכת לקוחות', `ימי מלאי = מלאי בקרטונים ÷ צריכת לקוחות ליום · יעד ${c.P.targetDays} ימים`)}
        ${tableHtml('t-fin', [
          { key: 'name', label: 'מוצר' },
          { key: 'machineId', label: 'מכונה', fmt: (v) => machineLabel(c, v) },
          { key: 'stock', label: 'מלאי (קרטונים)', num: true, fmt: (v) => fmt.int(v) },
          { key: 'demand', label: 'צריכת לקוחות ליום (קרטונים)', num: true, fmt: (v) => (v ? fmt.int(v) : '<span class="muted">לא הוגדר</span>') },
          { key: 'cover', label: 'ימי מלאי', num: true, fmt: (v, r) => `<b>${fmt.dec(v)}</b> ${pillIcon(r.status)}` },
          { key: 'actual', label: 'יציאות בפועל ליום', num: true, fmt: (v) => fmt.dec(v) },
          { key: 'perCarton', label: 'יח\' בקרטון', num: true, fmt: (v) => fmt.int(v) },
        ], fin, 'אין מוצרים. הוסף מוצרים במסך ההגדרות.')}
      </section>
      <section class="section"><div class="charts">
        ${panel('ch-fin', 'ימי מלאי לכל מוצר', `הקו המקווקו = יעד ${c.P.targetDays} ימים`, { wide: true, tall: fin.length > 8, legend: statusLegend(['מעל היעד', 'מתחת ליעד', 'פחות מיום']) })}
        ${panel('ch-min', 'חומרי גלם: מלאי כאחוז מהמינימום', 'הקו המקווקו = 100%', { tall: rawRows.length > 8, legend: statusLegend() })}
        ${panel('ch-cover', 'חומרי גלם: ימי כיסוי', `לפי צריכה ממוצעת ב-${C.coverLookbackDays} הימים האחרונים`, { tall: rawRows.length > 8, legend: statusLegend(['מעל 7 ימים', '3–7 ימים', 'פחות מ-3']) })}
      </div></section>
      <section class="section">${sectionHead('חומרי גלם ואריזה', '')}${tableHtml('t-raw', rawCols, rawRows, 'אין פריטים. הוסף פריטים במסך ההגדרות.')}</section>`;
    return {
      html,
      after() {
        coverChart(c, 'ch-fin', fin.filter((r) => r.cover != null));
        const r1 = rawRows.filter((r) => r.pctOfMin != null);
        drawChart('ch-min', 'bar', r1.map((r) => r.name), [{
          label: '% מהמינימום', colors: r1.map((r) => statusColor(minStatus(r))), data: r1.map((r) => Math.round(r.pctOfMin * 100)),
        }], { horizontal: true, legend: false, fmt: (v) => `${fmt.int(v)}%`, target: 100, targetLabel: 'מינימום' });
        const r2 = rawRows.filter((r) => r.daysCover != null);
        drawChart('ch-cover', 'bar', r2.map((r) => r.name), [{
          label: 'ימי כיסוי', colors: r2.map((r) => statusColor(coverStatus(r))), data: r2.map((r) => Math.round(r.daysCover * 10) / 10),
        }], { horizontal: true, legend: false, fmt: (v) => fmt.days(v), valueFmt: (v) => fmt.dec(v), target: 7, targetLabel: '7 ימים' });
      },
    };
  }

  function viewPlan(c) {
    const asOf = today();
    const plan = Plan.build(c.s, asOf);
    const P = plan.settings;
    const shift = c.s.settings.shift;
    const st = (cover) => Plan.coverStatus(cover, P.targetDays);
    const crit = plan.rows.filter((r) => st(r.coverNow) === 'crit').length;
    const warn = plan.rows.filter((r) => st(r.coverNow) === 'warn').length;
    const extDays = plan.days.reduce((a, d) => a + Object.values(d.machines).filter((m) => m.extended).length, 0);
    const loads = plan.days.flatMap((d) => Object.values(d.machines).map((m) => m.load));
    const avgLoad = loads.length ? loads.reduce((a, b) => a + b, 0) / loads.length : null;
    const range = plan.dates.length ? `${fmt.date(plan.dates[0])}–${fmt.date(plan.dates[plan.dates.length - 1])}` : '';
    const name = (id) => (c.products[id] || {}).name || id;

    const tiles = [
      tile({ label: 'מוצרים מתחת ליום מלאי', value: fmt.int(crit), sub: 'בעדיפות ראשונה בתוכנית', status: crit ? 'crit' : 'good' }),
      tile({ label: 'מוצרים מתחת ליעד', value: fmt.int(warn), sub: `יעד ${P.targetDays} ימי מלאי`, status: warn ? 'warn' : 'good' }),
      tile({ label: 'קרטונים מתוכננים', value: fmt.int(plan.totalCartons), sub: `${plan.dates.length} ימי עבודה` }),
      tile({ label: 'ניצולת מכונות', value: fmt.pct(avgLoad, 0), sub: 'ממוצע זמן מתוכנן מהמשמרת' }),
      tile({ label: `הארכות עד ${shift.extendedEnd}`, value: fmt.int(extDays), sub: 'ימי מכונה שצריכים שעות נוספות', status: extDays ? 'warn' : 'good' }),
    ];

    const board = plan.days.map((d) => {
      const short = K.parseISO(d.date).getDay() === C.shortDay;
      const machinesHtml = c.s.machines.filter((m) => d.machines[m.id]).map((m) => {
        const pm = d.machines[m.id];
        const items = pm.items.length
          ? `<ul class="plan-items">${pm.items.map((it) => `<li><span class="dot dot-${st(it.coverBefore)}" title="${STATUS_TEXT[st(it.coverBefore)]}"></span><span class="grow" title="${esc(name(it.productId))}">${esc(name(it.productId))}</span><b class="num">${fmt.int(it.cartons)}</b><small>קר'</small></li>`).join('')}</ul>`
          : '<p class="muted plan-idle">אין צורך בייצור</p>';
        return `<div class="plan-machine" style="--mc:var(--m-${m.id})">
          <div class="plan-mhead"><span>${esc(m.name)}</span>${pm.extended ? `<span class="tag">עד ${esc(shift.extendedEnd)}</span>` : ''}<span class="plan-load num">${fmt.pct(pm.load, 0)}</span></div>
          <div class="meter-track"><div class="meter-fill" style="width:${Math.min(100, Math.round(pm.load * 100))}%"></div></div>
          ${items}
        </div>`;
      }).join('');
      return `<article class="plan-day">
        <header><h3>${fmt.weekday(d.date)}</h3><span class="muted">${fmt.date(d.date)} · ${esc(shift.start)}–${esc(short ? shift.fridayEnd : shift.end)}</span></header>
        ${machinesHtml}
      </article>`;
    }).join('');

    const html = `
      <section class="section">${sectionHead('תוכנית ייצור שבועית', `${range} · נבנית אוטומטית: קודם המוצרים עם הכי מעט ימי מלאי`)}<div class="grid-kpi cols-5">${tiles.join('')}</div>
        ${plan.skipped.length ? `<div class="banner" style="margin:0">לא נכנסים לתוכנית (חסרה צריכה ליום או יח' בקרטון): ${esc(plan.skipped.join(', '))}. <a href="#settings">עדכן בהגדרות</a>.</div>` : ''}
      </section>
      <section class="section"><div class="section-head"><h2>לוח שבועי</h2>${legendHtml([{ label: 'פחות מיום מלאי', color: 'var(--crit)' }, { label: 'מתחת ליעד', color: 'var(--warn)' }, { label: 'מעל היעד', color: 'var(--good)' }])}</div>
        <div class="plan-board">${board || '<div class="empty">אין ימי עבודה בטווח</div>'}</div>
      </section>
      <section class="section">${sectionHead('סדר עדיפויות', 'ממוין לפי ימי מלאי, מהנמוך לגבוה')}
        ${tableHtml('t-plan', [
          { key: 'rank', label: 'עדיפות', num: true, fmt: (v) => `<b>${v}</b>` },
          { key: 'name', label: 'מוצר' },
          { key: 'machineId', label: 'מכונה', fmt: (v) => machineLabel(c, v) },
          { key: 'stock', label: 'מלאי (קר\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'demand', label: 'צריכה ליום (קר\')', num: true, fmt: (v) => fmt.int(v) },
          { key: 'coverNow', label: 'ימי מלאי היום', num: true, fmt: (v) => `<b>${fmt.dec(v)}</b> ${pillIcon(st(v))}` },
          { key: 'planned', label: 'לייצר השבוע (קר\')', num: true, fmt: (v) => `<b>${fmt.int(v)}</b>` },
          { key: 'coverEnd', label: 'ימי מלאי בסוף', num: true, fmt: (v) => `${fmt.dec(v)} ${pillIcon(st(v))}` },
        ], plan.rows, 'אין מוצרים עם צריכה יומית. הגדר צריכה ליום בהגדרות.')}
      </section>
      <section class="section"><div class="charts">
        ${panel('ch-plan-cover', 'ימי מלאי: היום מול סוף השבוע', `הקו המקווקו = יעד ${P.targetDays} ימים`, { wide: true, tall: plan.rows.length > 8, legend: legendHtml([{ label: 'היום', color: 'var(--bar-muted)' }, { label: 'סוף השבוע, לפי התוכנית', color: 'var(--bar)' }]) })}
      </div></section>`;
    return {
      html,
      after() {
        const th = Charts.theme();
        drawChart('ch-plan-cover', 'bar', plan.rows.map((r) => r.name), [
          { label: 'היום', color: th.barMuted, data: plan.rows.map((r) => Math.max(0, Math.round(r.coverNow * 10) / 10)) },
          { label: 'סוף השבוע', color: th.bar, data: plan.rows.map((r) => Math.max(0, Math.round(r.coverEnd * 10) / 10)) },
        ], { horizontal: true, legend: false, zero: true, fmt: (v) => fmt.days(v), valueFmt: (v) => fmt.dec(v), target: P.targetDays, targetLabel: `יעד ${P.targetDays}` });
      },
    };
  }

  // ---------- suppliers ----------
  const SUP_STATUS = [['מתאים', 'good'], ['נוצר קשר', 'warn'], ['לבדיקה', 'none'], ['לא מתאים', 'crit']];
  const SUP_TYPES = ['יצרן / יבואן מוצרי חלב', 'סיטונאי / מפיץ', 'חומרי גלם לאפייה'];
  const DASHBOARD_URL = 'https://claude.ai/artifact/AHrtoHwzctBvzLKnjWC4Ut';

  function supplierCard(s) {
    const tone = (SUP_STATUS.find(([x]) => x === s.status) || [])[1] || 'none';
    const tel = (s.phone || '').replace(/[^\d+]/g, '');
    const site = /^https?:\/\//i.test(s.website || '') ? s.website : '';
    const meta = [s.city, s.rating != null ? `★ ${fmt.dec(s.rating)}${s.reviews ? ` (${fmt.int(s.reviews)} ביקורות)` : ''}` : ''].filter(Boolean).join(' · ');
    const deal = [s.pricePerKg != null ? `${fmt.money(s.pricePerKg, 2)} לק"ג` : '', s.minOrder ? `מינימום: ${s.minOrder}` : ''].filter(Boolean).join(' · ');
    return `<article class="sup-card">
      <header><h4>${esc(s.name)}</h4>${pill(tone, s.status)}</header>
      ${s.type ? `<p class="sup-type">${esc(s.type)}</p>` : ''}
      ${meta ? `<p class="sup-meta">${esc(meta)}</p>` : ''}
      ${deal ? `<p class="sup-deal">${esc(deal)}</p>` : ''}
      ${s.sheets ? `<p class="sup-badge">${icon('check')}פלטות חמאה לבצק עלים</p>` : ''}
      ${s.notes ? `<p class="sup-notes">${esc(s.notes)}</p>` : ''}
      <div class="sup-actions">
        ${tel ? `<a class="btn btn-primary" href="tel:${tel}" aria-label="התקשר ל${esc(s.name)}">${icon('phone')}<span dir="ltr">${esc(s.phone)}</span></a>` : ''}
        ${site ? `<a class="btn" href="${esc(site)}" target="_blank" rel="noopener">אתר</a>` : ''}
      </div>
    </article>`;
  }

  function viewSuppliers(c) {
    const sup = App.suppliers;
    const cl = App.cloud;
    const tableUrl = window.Airtable ? `${Airtable.baseUrl}/${Airtable.SUPPLIERS.table}` : '';
    const when = sup.at ? new Date(sup.at).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const head = sectionHead('ספקים', `מטבלת הספקים ב-Airtable${when ? ` · עודכן ${when}` : ''}`);
    const links = `<div class="btn-row">
      ${cl.mode === 'synced' ? '<button type="button" class="btn" data-sup-reload>טען מחדש</button>' : ''}
      ${tableUrl ? `<a class="btn" href="${tableUrl}" target="_blank" rel="noopener">פתח את טבלת הספקים ב-Airtable</a>` : ''}
    </div>`;

    if (!sup.list.length) {
      const msg = cl.mode === 'connecting' ? 'טוען את רשימת הספקים מ-Airtable…'
        : cl.mode === 'local' ? 'רשימת הספקים נשמרת ב-Airtable, והיא מוצגת כשהדשבורד מחובר ל-Airtable: בקישור של claude.ai, בחשבון שמחובר אליו Airtable.'
          : sup.error || 'עדיין אין ספקים בטבלת הספקים ב-Airtable.';
      const open = cl.mode === 'local' && !window.claude ? `<a class="btn btn-primary" href="${DASHBOARD_URL}" target="_blank" rel="noopener">פתח את הדשבורד המחובר</a>` : '';
      return { html: `<section class="section">${head}<div class="sup-empty"><p>${esc(msg)}</p><div class="btn-row">${open}</div>${links}</div></section>` };
    }

    const filter = App.ui.supStatus || 'all';
    const count = (st) => sup.list.filter((x) => x.status === st).length;
    const tiles = [
      tile({ label: 'ספקים', value: fmt.int(sup.list.length), sub: `${new Set(sup.list.flatMap((x) => x.itemIds)).size} פריטי מלאי מקושרים` }),
      tile({ label: 'מתאימים', value: fmt.int(count('מתאים')), sub: 'אפשר להזמין מהם' }),
      tile({ label: 'נוצר קשר', value: fmt.int(count('נוצר קשר')), sub: 'ממתינים לתשובה' }),
      tile({ label: 'לבדיקה', value: fmt.int(count('לבדיקה')), sub: 'עוד לא דיברו איתם' }),
    ];
    const segs = [['all', 'הכל', sup.list.length]].concat(SUP_STATUS.map(([st]) => [st, st, count(st)]));
    const seg = `<div class="seg sup-filter" role="group" aria-label="סינון לפי סטטוס">${segs.map(([v, l, n]) => `<button type="button" data-sup-status="${esc(v)}" aria-pressed="${filter === v}">${esc(l)} (${n})</button>`).join('')}</div>`;

    const rank = (x) => [SUP_STATUS.findIndex(([st]) => st === x.status), SUP_TYPES.indexOf(x.type) < 0 ? 9 : SUP_TYPES.indexOf(x.type), -(x.rating || 0)];
    const byRank = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return a.name.localeCompare(b.name, 'he'); };
    const shown = sup.list.filter((x) => filter === 'all' || x.status === filter).sort(byRank);

    // One group per stock item, with the item's stock today next to its suppliers.
    const inv = K.inventorySummary(activeItems(c), c.s.stockMoves, c.s.productionLogs, today(), C.coverLookbackDays, invOpts(c));
    const stock = Object.fromEntries(inv.rows.map((r) => [r.id, r]));
    const groups = new Map();
    for (const x of shown) for (const id of (x.itemIds.length ? x.itemIds : [''])) {
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(x);
    }
    const groupHtml = [...groups.entries()].map(([id, list]) => {
      const item = c.s.items.find((i) => i.id === id);
      const r = stock[id];
      const cover = r && r.daysCover != null ? (r.daysCover < 3 ? 'crit' : r.daysCover <= 7 ? 'warn' : 'good') : 'none';
      const stockText = r ? `במלאי ${fmt.int(r.qty)} ${r.unit}${r.daysCover != null ? ` · ${fmt.dec(r.daysCover)} ימי כיסוי` : ''}` : '';
      return `<div class="sup-group">
        <div class="sup-group-head"><h3>${esc(item ? item.name : 'ספקים בלי פריט מלאי')} <span class="muted">(${list.length})</span></h3>${r ? pill(cover, stockText) : ''}${r && r.pctOfMin != null && r.pctOfMin < 1 ? pill('crit', 'מתחת למינימום') : ''}</div>
        <div class="sup-grid">${list.map(supplierCard).join('')}</div>
      </div>`;
    }).join('') || '<p class="muted">אין ספקים בסטטוס הזה.</p>';

    return {
      html: `
        <section class="section">${head}<div class="grid-kpi cols-4">${tiles.join('')}</div></section>
        <section class="section">${seg}${groupHtml}</section>
        <section class="section"><p class="hint">מעדכנים סטטוס, מחיר לק"ג, הזמנת מינימום והערות בטבלת הספקים ב-Airtable. הרשימה כאן מתעדכנת לבד כל ${C.cloudRefreshMinutes} דקות.</p>${links}</section>`,
    };
  }

  const VIEWS = {
    owner: { label: 'הנהלה', icon: 'owner', render: viewOwner, filters: true },
    machines: { label: 'מכונות', icon: 'machines', render: viewMachines, filters: true },
    workers: { label: 'עובדים', icon: 'workers', render: viewWorkers, filters: true },
    products: { label: 'מוצרים', icon: 'products', render: viewProducts, filters: true },
    inventory: { label: 'מלאי', icon: 'inventory', render: viewInventory, filters: true },
    suppliers: { label: 'ספקים', icon: 'suppliers', render: viewSuppliers, filters: false },
    plan: { label: 'תוכנית', icon: 'plan', render: viewPlan, filters: false },
    entry: { label: 'הזנה', icon: 'entry', render: (c) => Forms.entry(c, api), filters: false },
    settings: { label: 'הגדרות', icon: 'settings', render: (c) => Forms.settings(c, api), filters: false, hiddenTab: true },
  };

  // ---------- header ----------
  function buildShell() {
    document.getElementById('brand-mark').innerHTML = C.machines.slice(0, 4).map((m) => `<span style="background:var(--m-${m.id})"></span>`).join('');
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
    const date = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date());
    document.getElementById('today-label').innerHTML = `${esc(date)}${s.meta && s.meta.source === 'demo' ? ' <span class="demo-tag">נתוני דמו</span>' : ''} <span class="cloud-chip" id="cloud-chip" hidden></span>`;
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
    updateCloudChip();
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
    main.innerHTML = cloudBanner() + out.html;
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
      const supStatus = e.target.closest('[data-sup-status]');
      if (supStatus) {
        App.ui.supStatus = supStatus.dataset.supStatus;
        render();
        return;
      }
      if (e.target.closest('[data-sup-reload]')) {
        pullCloud(false);
        return;
      }
      const up = e.target.closest('[data-cloud-upload]');
      if (up) {
        uploadInitial(up.dataset.cloudUpload);
        return;
      }
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
    // Pick up what other devices or Airtable itself changed: on return to the page after a minute,
    // and every few minutes while it is open. Skipped while someone is typing, so a refresh never wipes a form.
    const cloudIdle = () => {
      const a = document.activeElement;
      return App.cloud.mode === 'synced' && !App.ui.entryForm && !document.querySelector('.modal-backdrop')
        && !(a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName));
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && cloudIdle() && Date.now() - (App.cloud.lastSync || 0) > 60000) pullCloud(true);
    });
    setInterval(() => {
      if (document.visibilityState === 'visible' && cloudIdle()) pullCloud(true);
    }, C.cloudRefreshMinutes * 60000);
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
    get cloud() { return App.cloud; },
    cloudReload: () => pullCloud(false),
    cloudRetry: () => { if (App.cloud.base == null) return pullCloud(false); setCloud('saving'); return runSync(); },
  };

  function init() {
    document.documentElement.lang = 'he';
    document.documentElement.dir = 'rtl';
    loadUi();
    applyTheme(true);
    const loaded = Store.load();
    App.state = loaded.state;
    App.persisted = loaded.persisted;
    loadSuppliers();
    Charts.setup();
    downloadsApi();
    buildShell();
    bindEvents();
    const id = location.hash.replace('#', '');
    App.ui.view = VIEWS[id] ? id : 'owner';
    render();
    connectCloud();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
