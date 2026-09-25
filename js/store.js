/* Persistence: localStorage load/save, backup, import/export, reset. */
(function (root, factory) {
  const deps = typeof module === 'object' && module.exports
    ? { CONFIG: require('./config.js'), Seed: require('./seed.js') }
    : { CONFIG: root.CONFIG, Seed: root.Seed };
  const mod = factory(deps.CONFIG, deps.Seed, root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.Store = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CONFIG, Seed, root) {
  const COLLECTIONS = ['machines', 'products', 'workers', 'items', 'productionLogs', 'attendance', 'stockMoves'];
  const TRANSACTIONS = ['productionLogs', 'attendance', 'stockMoves'];

  function storage() {
    try {
      const ls = root.localStorage;
      const probe = '__fd_probe__';
      ls.setItem(probe, '1');
      ls.removeItem(probe);
      return ls;
    } catch (e) {
      return null;
    }
  }

  // Fill gaps so older or hand-edited files still load.
  function normalize(s) {
    if (!s || typeof s !== 'object') throw new Error('הקובץ לא מכיל נתוני דשבורד');
    if (!Array.isArray(s.machines)) throw new Error('חסרה רשימת מכונות בקובץ');
    for (const c of COLLECTIONS) if (!Array.isArray(s[c])) s[c] = [];
    s.version = s.version || CONFIG.schemaVersion;
    s.meta = s.meta || { createdAt: new Date().toISOString(), source: 'import' };
    const d = CONFIG.defaultSettings;
    s.settings = Object.assign({}, d, s.settings || {});
    s.settings.targets = Object.assign({}, d.targets, (s.settings && s.settings.targets) || {});
    // The 4 machines always exist.
    for (const m of CONFIG.machines) {
      if (!s.machines.find((x) => x.id === m.id)) s.machines.push(Object.assign({}, m, { active: true }));
    }
    return s;
  }

  function load() {
    const ls = storage();
    if (ls) {
      try {
        const raw = ls.getItem(CONFIG.storageKey);
        if (raw) return { state: normalize(JSON.parse(raw)), persisted: true };
      } catch (e) {
        /* corrupted data: fall through to demo */
      }
    }
    const state = Seed.demoState();
    if (ls) save(state);
    return { state, persisted: !!ls };
  }

  function save(state) {
    const ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(CONFIG.storageKey, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveBackup(state) {
    const ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(CONFIG.backupKey, JSON.stringify({ savedAt: new Date().toISOString(), state }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadBackup() {
    const ls = storage();
    if (!ls) return null;
    try {
      const raw = ls.getItem(CONFIG.backupKey);
      if (!raw) return null;
      const b = JSON.parse(raw);
      return { savedAt: b.savedAt, state: normalize(b.state) };
    } catch (e) {
      return null;
    }
  }

  // mode: 'transactions' | 'demo' | 'empty'
  function resetState(state, mode, today) {
    if (mode === 'transactions') {
      const next = JSON.parse(JSON.stringify(state));
      for (const c of TRANSACTIONS) next[c] = [];
      next.meta = Object.assign({}, next.meta, { resetAt: new Date().toISOString() });
      return next;
    }
    if (mode === 'demo') return Seed.demoState(today);
    if (mode === 'empty') return Seed.emptyState();
    throw new Error('סוג איפוס לא מוכר: ' + mode);
  }

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function parseImport(text) {
    try {
      return { ok: true, state: normalize(JSON.parse(text)) };
    } catch (e) {
      return { ok: false, error: e instanceof SyntaxError ? 'הטקסט אינו JSON תקין' : e.message };
    }
  }

  let counter = 0;
  function newId(prefix) {
    counter += 1;
    return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
  }

  return { load, save, saveBackup, loadBackup, resetState, exportJSON, parseImport, normalize, newId, COLLECTIONS, TRANSACTIONS };
});
