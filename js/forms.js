/* Data entry forms, recent entries, settings, backup and reset. */
(function () {
  const C = window.CONFIG;
  const K = window.KPI;
  let api = null;

  // Drafts survive re-renders while a form is open.
  const S = { production: null, attendance: null, move: null, count: null, lastMachine: 'rondo', armed: null, armTimer: null };

  const num = (v) => (v === '' || v == null ? null : Number(v));
  const isWhole = (x) => x != null && Number.isInteger(x) && x >= 0;
  const nowStamp = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${K.toISO(d)}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const guessShift = () => {
    const h = new Date().getHours();
    if (h >= 7 && h < 15) return 'morning';
    if (h >= 15 && h < 23) return 'evening';
    return 'night';
  };
  const byId = (arr, id) => arr.find((x) => x.id === id);
  const activeOnly = (arr) => arr.filter((x) => x.active !== false);
  const err = (errors, key) => (errors && errors[key] ? `<p class="field-error" id="err-${key}">${api.esc(errors[key])}</p>` : '');
  const inv = (errors, key) => (errors && errors[key] ? ' invalid' : '');
  const described = (errors, key) => (errors && errors[key] ? ` aria-invalid="true" aria-describedby="err-${key}"` : '');

  function numField(id, label, value, errors, opts) {
    opts = opts || {};
    return `<div class="field${inv(errors, id)}"><label for="f-${id}">${label}</label>
      <input type="number" id="f-${id}" data-f="${id}" inputmode="${opts.decimal ? 'decimal' : 'numeric'}" min="0" step="${opts.step || 1}" value="${value == null ? '' : api.esc(value)}"${opts.placeholder ? ` placeholder="${opts.placeholder}"` : ''}${described(errors, id)}>
      ${opts.hint ? `<p class="hint">${opts.hint}</p>` : ''}${err(errors, id)}</div>`;
  }

  function formHead(title) {
    return `<div class="form-head"><button type="button" class="btn btn-sm" data-back>${api.icon('back')} חזרה</button><h2>${title}</h2></div>`;
  }

  function focusFirstError() {
    const el = document.querySelector('.field.invalid input, .field.invalid select, .field-error');
    if (el) {
      el.scrollIntoView({ block: 'center' });
      if (el.focus) el.focus();
    }
  }

  function armDelete(btn, key, run) {
    if (S.armed === key) {
      clearTimeout(S.armTimer);
      S.armed = null;
      run();
      return;
    }
    document.querySelectorAll('.btn-del.armed').forEach((b) => { b.classList.remove('armed'); b.textContent = 'מחק'; });
    S.armed = key;
    btn.classList.add('armed');
    btn.textContent = 'בטוח? מחק';
    clearTimeout(S.armTimer);
    S.armTimer = setTimeout(() => {
      S.armed = null;
      btn.classList.remove('armed');
      btn.textContent = 'מחק';
    }, 4000);
  }

  // =====================================================================
  // Entry home
  // =====================================================================
  function entry(c, a) {
    api = a;
    const f = api.ui.entryForm;
    if (f === 'production') return productionForm(c);
    if (f === 'attendance') return attendanceForm(c);
    if (f === 'move') return moveForm(c);
    if (f === 'count') return countForm(c);
    return entryHome(c);
  }

  function openForm(name) {
    const s = api.state;
    const today = api.today();
    if (name === 'production') {
      const m = S.lastMachine;
      S.production = { date: today, shift: guessShift(), machineId: m, productId: firstProduct(s, m), plannedUnits: '', goodUnits: '', scrapUnits: '', plannedMinutes: 480, downtimes: [], workerIds: [], note: '', errors: {} };
      S.production.workerIds = suggestWorkers(s, S.production);
    }
    if (name === 'attendance') S.attendance = newAttendanceDraft(s, today, guessShift());
    if (name === 'move') S.move = { date: today, itemId: (activeOnly(s.items)[0] || {}).id || '', type: 'in', qty: '', note: '', errors: {} };
    if (name === 'count') S.count = { date: today, itemId: (activeOnly(s.items)[0] || {}).id || '', qty: '', errors: {} };
    api.ui.entryForm = name;
    api.render();
    window.scrollTo(0, 0);
  }

  function closeForm() {
    api.ui.entryForm = null;
    api.render();
    window.scrollTo(0, 0);
  }

  function recentEntries(s) {
    const { fmt, shiftName } = api;
    const out = [];
    for (const l of s.productionLogs) {
      const m = byId(s.machines, l.machineId) || {};
      const p = byId(s.products, l.productId) || {};
      out.push({
        kind: 'production', id: l.id, at: l.createdAt || l.date,
        text: `דיווח ייצור · ${m.name || ''} · ${p.name || ''}`,
        sub: `${fmt.dateLong(l.date)} · ${shiftName(l.shift)} · ${fmt.int(l.goodUnits)} תקין, ${fmt.int(l.scrapUnits)} פסולת`,
      });
    }
    for (const mv of s.stockMoves) {
      const it = byId(s.items, mv.itemId) || {};
      const type = (C.moveTypes.find((t) => t.id === mv.type) || {}).name || mv.type;
      out.push({
        kind: 'move', id: mv.id, at: mv.createdAt || mv.date,
        text: `${type} · ${it.name || ''} · ${fmt.int(mv.qty)} ${it.unit || ''}`,
        sub: `${fmt.dateLong(mv.date)}${mv.note ? ' · ' + mv.note : ''}`,
      });
    }
    const batches = new Map();
    for (const r of s.attendance) {
      const key = r.batchId || `${r.date}|${r.shift}`;
      const b = batches.get(key) || { kind: 'attendance', id: key, at: '', date: r.date, shift: r.shift, n: 0, present: 0 };
      b.n += 1;
      if (r.status === 'present') b.present += 1;
      if ((r.createdAt || r.date) > b.at) b.at = r.createdAt || r.date;
      batches.set(key, b);
    }
    for (const b of batches.values()) {
      out.push({ kind: 'attendance', id: b.id, at: b.at, text: `נוכחות · משמרת ${shiftName(b.shift)}`, sub: `${fmt.dateLong(b.date)} · ${b.present} נוכחים מתוך ${b.n}` });
    }
    return out.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0)).slice(0, 10);
  }

  function entryHome(c) {
    const s = c.s;
    const noProducts = !activeOnly(s.products).length;
    const noWorkers = !activeOnly(s.workers).length;
    const noItems = !activeOnly(s.items).length;
    const btn = (form, ic, title, sub, disabled) => `<button type="button" class="entry-btn" data-open-form="${form}"${disabled ? ' disabled aria-disabled="true"' : ''}>${api.icon(ic)}<span>${title}</span><small>${sub}</small></button>`;
    const recent = recentEntries(s);
    const recentHtml = recent.length
      ? `<ul class="recent">${recent.map((r) => `<li><div class="grow"><p>${api.esc(r.text)}</p><small>${api.esc(r.sub)}</small></div><button type="button" class="btn btn-sm btn-del" data-del-entry="${r.kind}|${api.esc(r.id)}">מחק</button></li>`).join('')}</ul>`
      : '<div class="empty">עוד לא הוזנו נתונים</div>';
    const missing = [noProducts && 'מוצרים', noWorkers && 'עובדים', noItems && 'פריטי מלאי'].filter(Boolean);
    const html = `
      <section class="section">${api.sectionHead('הזנת נתונים', 'בחר מה לדווח')}
        ${missing.length ? `<div class="banner" style="margin:0">חסרים ${missing.join(', ')}. <a href="#settings">הוסף אותם בהגדרות</a> כדי להתחיל להזין.</div>` : ''}
        <div class="entry-grid">
          ${btn('production', 'machines', 'דיווח ייצור', 'סוף משמרת, לכל מכונה', noProducts)}
          ${btn('attendance', 'workers', 'נוכחות משמרת', 'כל העובדים בבת אחת', noWorkers)}
          ${btn('move', 'swap', 'תנועת מלאי', 'כניסה, יציאה או פחת', noItems)}
          ${btn('count', 'count', 'ספירת מלאי', 'השוואה לכמות במערכת', noItems)}
        </div>
      </section>
      <section class="section">${api.sectionHead('רשומות אחרונות', 'מחיקה בשתי לחיצות')}${recentHtml}</section>`;
    return {
      html,
      after() {
        const root = document.getElementById('view');
        root.querySelectorAll('[data-open-form]').forEach((b) => b.addEventListener('click', () => openForm(b.dataset.openForm)));
        root.querySelectorAll('[data-del-entry]').forEach((b) => b.addEventListener('click', () => {
          const [kind, id] = b.dataset.delEntry.split('|');
          armDelete(b, b.dataset.delEntry, () => deleteEntry(kind, id));
        }));
      },
    };
  }

  function deleteEntry(kind, id) {
    api.commit((s) => {
      if (kind === 'production') s.productionLogs = s.productionLogs.filter((l) => l.id !== id);
      if (kind === 'move') s.stockMoves = s.stockMoves.filter((m) => m.id !== id);
      if (kind === 'attendance') s.attendance = s.attendance.filter((r) => (r.batchId || `${r.date}|${r.shift}`) !== id);
    }, { toast: 'הרשומה נמחקה' });
  }

  // =====================================================================
  // Production report
  // =====================================================================
  function firstProduct(s, machineId) {
    const p = activeOnly(s.products).find((x) => x.machineId === machineId);
    return p ? p.id : '';
  }

  // Workers marked present for this date/shift/machine, else the last team on this machine and shift.
  function suggestWorkers(s, d) {
    const present = s.attendance.filter((a) => a.date === d.date && a.shift === d.shift && a.machineId === d.machineId && a.status === 'present').map((a) => a.workerId);
    if (present.length) return present;
    const last = s.productionLogs.filter((l) => l.machineId === d.machineId && l.shift === d.shift).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const active = new Set(activeOnly(s.workers).map((w) => w.id));
    return last ? last.workerIds.filter((w) => active.has(w)) : [];
  }

  function productionForm(c) {
    const s = c.s;
    const d = S.production;
    const e = d.errors;
    const products = activeOnly(s.products).filter((p) => p.machineId === d.machineId);
    const reasons = C.downtimeReasons;
    const dtRows = d.downtimes.map((dt, i) => `
      <div class="dt-row">
        <select class="cell-input" data-dt-reason="${i}" aria-label="סיבת השבתה ${i + 1}">${reasons.map((r) => `<option value="${r.id}"${r.id === dt.reason ? ' selected' : ''}>${r.name}</option>`).join('')}</select>
        <input class="cell-input" type="number" inputmode="numeric" min="1" step="1" data-dt-min="${i}" value="${api.esc(dt.minutes)}" placeholder="דקות" aria-label="דקות השבתה ${i + 1}">
        <button type="button" class="btn icon-only" data-dt-rm="${i}" aria-label="הסר השבתה ${i + 1}">${api.icon('trash')}</button>
      </div>`).join('');
    const workers = activeOnly(s.workers);
    const html = `
      <section class="form" aria-labelledby="prod-title">
        ${formHead('<span id="prod-title">דיווח ייצור</span>')}
        <div class="field${inv(e, 'machineId')}"><span class="label">מכונה</span>
          <div class="machine-picker" role="group" aria-label="מכונה">${s.machines.map((m) => `<button type="button" class="mpick" style="--mc:var(--m-${m.id})" data-f-machine="${m.id}" aria-pressed="${m.id === d.machineId}"><i></i>${api.esc(m.name)}</button>`).join('')}</div>${err(e, 'machineId')}
        </div>
        <div class="fields">
          <div class="field${inv(e, 'date')}"><label for="f-date">תאריך</label><input type="date" id="f-date" data-f="date" max="${api.today()}" value="${d.date}"${described(e, 'date')}>${err(e, 'date')}</div>
          <div class="field"><span class="label">משמרת</span><div class="seg" role="group" aria-label="משמרת">${C.shifts.map((sh) => `<button type="button" data-f-shift="${sh.id}" aria-pressed="${sh.id === d.shift}">${sh.name}</button>`).join('')}</div></div>
          <div class="field${inv(e, 'productId')}"><label for="f-productId">מוצר</label>
            ${products.length ? `<select id="f-productId" data-f="productId"${described(e, 'productId')}>${products.map((p) => `<option value="${p.id}"${p.id === d.productId ? ' selected' : ''}>${api.esc(p.name)}</option>`).join('')}</select>` : '<p class="hint">אין מוצרים למכונה הזו. <a href="#settings">הוסף מוצר בהגדרות</a>.</p>'}
            ${err(e, 'productId')}
          </div>
        </div>
        <div class="fields">
          ${numField('plannedUnits', 'יחידות מתוכננות', d.plannedUnits, e)}
          ${numField('goodUnits', 'יחידות תקינות', d.goodUnits, e)}
          ${numField('scrapUnits', 'פסולת (יחידות)', d.scrapUnits, e, { placeholder: '0' })}
          ${numField('plannedMinutes', 'דקות עבודה מתוכננות', d.plannedMinutes, e, { hint: 'משמרת מלאה = 480' })}
        </div>
        <div class="field${inv(e, 'downtimes')}"><span class="label">השבתות</span>
          ${dtRows || '<p class="hint">אין השבתות. אם המכונה עמדה, הוסף שורה לכל סיבה.</p>'}
          <div><button type="button" class="btn btn-sm" data-dt-add>${api.icon('plus')} הוסף השבתה</button></div>
          ${err(e, 'downtimes')}
        </div>
        <div class="field"><span class="label">עובדים במשמרת</span>
          ${workers.length ? `<div class="chips" role="group" aria-label="עובדים">${workers.map((w) => `<button type="button" class="chip" data-f-worker="${w.id}" aria-pressed="${d.workerIds.includes(w.id)}">${api.esc(w.name)}</button>`).join('')}</div>` : '<p class="hint">אין עובדים פעילים.</p>'}
        </div>
        <div class="field"><label for="f-note">הערה</label><textarea id="f-note" data-f="note" maxlength="200">${api.esc(d.note)}</textarea></div>
        <div class="live-kpi" id="live-kpi" aria-live="polite"></div>
        <div class="btn-row"><button type="button" class="btn btn-primary" data-save>שמור דיווח</button><button type="button" class="btn" data-back>ביטול</button></div>
      </section>`;
    return {
      html,
      after() {
        const root = document.getElementById('view');
        const live = () => {
          const rate = Object.fromEntries(s.machines.map((m) => [m.id, Number(m.ratePerHour) || 0]));
          const log = toLog(d);
          const el = document.getElementById('live-kpi');
          if (log.goodUnits == null || !log.plannedMinutes) {
            el.innerHTML = '<span class="muted">מלא כמויות ודקות כדי לראות את ה-OEE של הדיווח</span>';
            return;
          }
          const r = K.productionSummary([Object.assign({}, log, { scrapUnits: log.scrapUnits || 0 })], rate);
          const st = K.statusHigh(r.oee, s.settings.targets.oee, s.settings.targets.oeeWarn);
          el.innerHTML = `<span>OEE <b>${api.fmt.pct(r.oee)}</b></span>${api.pill(st)}<span>זמינות ${api.fmt.pct(r.A, 0)}</span><span>ביצועים ${api.fmt.pct(r.P, 0)}</span><span>איכות ${api.fmt.pct(r.Q, 0)}</span>`;
        };
        live();
        root.querySelectorAll('[data-f]').forEach((el) => el.addEventListener('input', () => { d[el.dataset.f] = el.value; live(); }));
        root.querySelectorAll('[data-f]').forEach((el) => el.addEventListener('change', () => {
          d[el.dataset.f] = el.value;
          if (el.dataset.f === 'date' && !d.workerIds.length) { d.workerIds = suggestWorkers(s, d); api.render(); }
        }));
        root.querySelectorAll('[data-f-machine]').forEach((b) => b.addEventListener('click', () => {
          d.machineId = b.dataset.fMachine;
          d.productId = firstProduct(s, d.machineId);
          d.workerIds = suggestWorkers(s, d);
          api.render();
        }));
        root.querySelectorAll('[data-f-shift]').forEach((b) => b.addEventListener('click', () => {
          d.shift = b.dataset.fShift;
          d.workerIds = suggestWorkers(s, d);
          api.render();
        }));
        root.querySelectorAll('[data-f-worker]').forEach((b) => b.addEventListener('click', () => {
          const id = b.dataset.fWorker;
          d.workerIds = d.workerIds.includes(id) ? d.workerIds.filter((x) => x !== id) : d.workerIds.concat(id);
          b.setAttribute('aria-pressed', String(d.workerIds.includes(id)));
        }));
        root.querySelectorAll('[data-dt-reason]').forEach((el) => el.addEventListener('change', () => { d.downtimes[+el.dataset.dtReason].reason = el.value; }));
        root.querySelectorAll('[data-dt-min]').forEach((el) => el.addEventListener('input', () => { d.downtimes[+el.dataset.dtMin].minutes = el.value; live(); }));
        root.querySelectorAll('[data-dt-rm]').forEach((b) => b.addEventListener('click', () => { d.downtimes.splice(+b.dataset.dtRm, 1); api.render(); }));
        const add = root.querySelector('[data-dt-add]');
        add.addEventListener('click', () => {
          d.downtimes.push({ reason: 'breakdown', minutes: '' });
          api.render();
          const inputs = document.querySelectorAll('[data-dt-min]');
          if (inputs.length) inputs[inputs.length - 1].focus();
        });
        root.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', closeForm));
        root.querySelector('[data-save]').addEventListener('click', () => saveProduction(s, d));
        if (Object.keys(e).length) focusFirstError();
      },
    };
  }

  function toLog(d) {
    return {
      date: d.date, shift: d.shift, machineId: d.machineId, productId: d.productId,
      plannedUnits: num(d.plannedUnits), goodUnits: num(d.goodUnits), scrapUnits: num(d.scrapUnits),
      plannedMinutes: num(d.plannedMinutes),
      downtimes: d.downtimes.map((x) => ({ reason: x.reason, minutes: num(x.minutes) })),
      workerIds: d.workerIds.slice(), note: (d.note || '').trim().slice(0, 200),
    };
  }

  function validateProduction(s, d) {
    const e = {};
    const log = toLog(d);
    if (!log.date) e.date = 'בחר תאריך';
    else if (log.date > api.today()) e.date = 'אי אפשר לדווח על תאריך עתידי';
    if (!byId(s.machines, log.machineId)) e.machineId = 'בחר מכונה';
    if (!log.productId || !byId(s.products, log.productId)) e.productId = 'בחר מוצר';
    if (!isWhole(log.plannedUnits)) e.plannedUnits = 'הזן מספר שלם, 0 או יותר';
    if (!isWhole(log.goodUnits)) e.goodUnits = 'הזן מספר שלם, 0 או יותר';
    if (log.scrapUnits != null && !isWhole(log.scrapUnits)) e.scrapUnits = 'הזן מספר שלם, 0 או יותר';
    if (!isWhole(log.plannedMinutes) || log.plannedMinutes < 1 || log.plannedMinutes > 720) e.plannedMinutes = 'הזן בין 1 ל-720 דקות';
    if (log.downtimes.some((x) => !isWhole(x.minutes) || x.minutes < 1)) e.downtimes = 'בכל שורת השבתה הזן דקות (מספר שלם גדול מ-0), או הסר את השורה';
    else if (!e.plannedMinutes && K.logDowntime(log) > log.plannedMinutes) e.downtimes = `סך ההשבתות (${K.logDowntime(log)} דק') גדול מהזמן המתוכנן (${log.plannedMinutes} דק')`;
    return { e, log };
  }

  function saveProduction(s, d) {
    const { e, log } = validateProduction(s, d);
    d.errors = e;
    if (Object.keys(e).length) {
      api.render();
      return;
    }
    log.scrapUnits = log.scrapUnits || 0;
    const m = byId(s.machines, log.machineId);
    S.lastMachine = log.machineId;
    api.ui.entryForm = null;
    api.commit((st) => {
      st.productionLogs.push(Object.assign({ id: Store.newId('l'), createdAt: nowStamp() }, log));
    }, { toast: `דיווח הייצור של ${m.name} נשמר` });
    window.scrollTo(0, 0);
  }

  // =====================================================================
  // Attendance
  // =====================================================================
  function newAttendanceDraft(s, date, shift) {
    const rows = {};
    for (const w of activeOnly(s.workers)) {
      const existing = s.attendance.find((a) => a.date === date && a.shift === shift && a.workerId === w.id);
      const last = s.attendance.filter((a) => a.workerId === w.id).sort((a, b) => ((a.createdAt || a.date) < (b.createdAt || b.date) ? 1 : -1))[0];
      rows[w.id] = existing
        ? { status: existing.status, hours: existing.hours, overtime: existing.overtimeHours || 0, machineId: existing.machineId || '' }
        : { status: last && last.shift === shift ? 'present' : 'skip', hours: 8, overtime: 0, machineId: (last && last.machineId) || '' };
    }
    return { date, shift, rows, errors: {} };
  }

  function attendanceForm(c) {
    const s = c.s;
    const d = S.attendance;
    const e = d.errors;
    const statuses = [{ id: 'skip', name: '—', title: 'לא במשמרת' }].concat(C.attendanceStatus);
    const workers = activeOnly(s.workers);
    const inShift = workers.filter((w) => d.rows[w.id].status !== 'skip').length;
    const rows = workers.map((w) => {
      const r = d.rows[w.id];
      return `<div class="att-row" data-status="${r.status}">
        <h4>${api.esc(w.name)} <small class="muted">${api.esc(w.role || '')}</small></h4>
        <div class="seg" role="group" aria-label="סטטוס של ${api.esc(w.name)}">${statuses.map((st) => `<button type="button" data-att-status="${w.id}|${st.id}" aria-pressed="${r.status === st.id}"${st.title ? ` title="${st.title}" aria-label="${st.title}"` : ''}>${st.name}</button>`).join('')}</div>
        <div class="att-nums">
          <div><label for="h-${w.id}">שעות</label><input class="cell-input" type="number" id="h-${w.id}" data-att-num="${w.id}|hours" inputmode="decimal" min="0" max="16" step="0.5" value="${r.hours}"></div>
          <div><label for="o-${w.id}">נוספות</label><input class="cell-input" type="number" id="o-${w.id}" data-att-num="${w.id}|overtime" inputmode="decimal" min="0" max="8" step="0.5" value="${r.overtime}"></div>
          <div><label for="mc-${w.id}">מכונה</label><select class="cell-input" id="mc-${w.id}" data-att-num="${w.id}|machineId"><option value="">—</option>${s.machines.map((m) => `<option value="${m.id}"${m.id === r.machineId ? ' selected' : ''}>${api.esc(m.name)}</option>`).join('')}</select></div>
        </div>
        ${err(e, 'w-' + w.id)}
      </div>`;
    }).join('');
    const html = `
      <section class="form" aria-labelledby="att-title">
        ${formHead('<span id="att-title">נוכחות משמרת</span>')}
        <div class="fields">
          <div class="field${inv(e, 'date')}"><label for="f-att-date">תאריך</label><input type="date" id="f-att-date" max="${api.today()}" value="${d.date}">${err(e, 'date')}</div>
          <div class="field"><span class="label">משמרת</span><div class="seg" role="group" aria-label="משמרת">${C.shifts.map((sh) => `<button type="button" data-att-shift="${sh.id}" aria-pressed="${sh.id === d.shift}">${sh.name}</button>`).join('')}</div></div>
        </div>
        <p class="hint">סמן סטטוס לכל עובד שהיה אמור לעבוד במשמרת. "—" = לא במשמרת. ${inShift} עובדים מסומנים.</p>
        <div class="btn-row"><button type="button" class="btn btn-sm" data-att-all>כל המסומנים נוכחים</button></div>
        ${err(e, 'rows')}
        <div class="att-list">${rows || '<div class="empty">אין עובדים פעילים</div>'}</div>
        <div class="btn-row"><button type="button" class="btn btn-primary" data-save>שמור נוכחות</button><button type="button" class="btn" data-back>ביטול</button></div>
      </section>`;
    return {
      html,
      after() {
        const root = document.getElementById('view');
        document.getElementById('f-att-date').addEventListener('change', (ev) => { S.attendance = newAttendanceDraft(s, ev.target.value, d.shift); api.render(); });
        root.querySelectorAll('[data-att-shift]').forEach((b) => b.addEventListener('click', () => { S.attendance = newAttendanceDraft(s, d.date, b.dataset.attShift); api.render(); }));
        root.querySelectorAll('[data-att-status]').forEach((b) => b.addEventListener('click', () => {
          const [wid, st] = b.dataset.attStatus.split('|');
          d.rows[wid].status = st;
          const row = b.closest('.att-row');
          row.dataset.status = st;
          row.querySelectorAll('[data-att-status]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        }));
        root.querySelectorAll('[data-att-num]').forEach((el) => el.addEventListener('change', () => {
          const [wid, key] = el.dataset.attNum.split('|');
          d.rows[wid][key] = el.value;
        }));
        root.querySelector('[data-att-all]').addEventListener('click', () => {
          for (const id of Object.keys(d.rows)) if (d.rows[id].status !== 'skip') d.rows[id].status = 'present';
          api.render();
        });
        root.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', closeForm));
        root.querySelector('[data-save]').addEventListener('click', () => saveAttendance(s, d));
        if (Object.keys(e).length) focusFirstError();
      },
    };
  }

  function saveAttendance(s, d) {
    const e = {};
    if (!d.date) e.date = 'בחר תאריך';
    else if (d.date > api.today()) e.date = 'אי אפשר לדווח על תאריך עתידי';
    const marked = Object.entries(d.rows).filter(([, r]) => r.status !== 'skip');
    if (!marked.length) e.rows = 'סמן לפחות עובד אחד';
    for (const [wid, r] of marked) {
      if (r.status !== 'present') continue;
      const h = num(r.hours);
      const o = num(r.overtime) || 0;
      if (h == null || h < 0 || h > 16) e['w-' + wid] = 'שעות: בין 0 ל-16';
      else if (o < 0 || o > 8) e['w-' + wid] = 'שעות נוספות: בין 0 ל-8';
    }
    d.errors = e;
    if (Object.keys(e).length) {
      api.render();
      return;
    }
    const batchId = Store.newId('b');
    const stamp = nowStamp();
    const ids = new Set(Object.keys(d.rows));
    api.ui.entryForm = null;
    api.commit((st) => {
      st.attendance = st.attendance.filter((a) => !(a.date === d.date && a.shift === d.shift && ids.has(a.workerId)));
      for (const [wid, r] of marked) {
        const present = r.status === 'present';
        st.attendance.push({
          id: Store.newId('a'), batchId, date: d.date, shift: d.shift, workerId: wid, status: r.status,
          hours: present ? num(r.hours) : 0, overtimeHours: present ? num(r.overtime) || 0 : 0,
          machineId: r.machineId || null, createdAt: stamp,
        });
      }
    }, { toast: `נוכחות נשמרה ל-${marked.length} עובדים` });
    window.scrollTo(0, 0);
  }

  // =====================================================================
  // Stock movement and count
  // =====================================================================
  function itemOptions(s, selected) {
    return C.itemCategories.map((cat) => {
      const items = activeOnly(s.items).filter((i) => i.category === cat.id);
      if (!items.length) return '';
      return `<optgroup label="${cat.name}">${items.map((i) => `<option value="${i.id}"${i.id === selected ? ' selected' : ''}>${api.esc(i.name)} (${api.esc(i.unit)})</option>`).join('')}</optgroup>`;
    }).join('');
  }

  const stockOf = (s, itemId, date) => {
    const it = byId(s.items, itemId);
    return it ? K.itemStock(it, s.stockMoves, s.productionLogs, date) : 0;
  };

  function moveForm(c) {
    const s = c.s;
    const d = S.move;
    const e = d.errors;
    const it = byId(s.items, d.itemId) || {};
    const types = C.moveTypes.filter((t) => t.id !== 'count');
    const html = `
      <section class="form" aria-labelledby="mv-title">
        ${formHead('<span id="mv-title">תנועת מלאי</span>')}
        <div class="field"><span class="label">סוג תנועה</span><div class="seg" role="group" aria-label="סוג תנועה">${types.map((t) => `<button type="button" data-mv-type="${t.id}" aria-pressed="${t.id === d.type}">${t.name}</button>`).join('')}</div></div>
        <div class="fields">
          <div class="field${inv(e, 'date')}"><label for="f-mv-date">תאריך</label><input type="date" id="f-mv-date" data-mv="date" max="${api.today()}" value="${d.date}">${err(e, 'date')}</div>
          <div class="field${inv(e, 'itemId')}"><label for="f-mv-item">פריט</label><select id="f-mv-item" data-mv="itemId">${itemOptions(s, d.itemId)}</select>${err(e, 'itemId')}</div>
          <div class="field${inv(e, 'qty')}"><label for="f-mv-qty">כמות${it.unit ? ` (${api.esc(it.unit)})` : ''}</label><input type="number" id="f-mv-qty" data-mv="qty" inputmode="decimal" min="0" step="any" value="${api.esc(d.qty)}"${described(e, 'qty')}>${err(e, 'qty')}</div>
        </div>
        <p class="live-kpi" id="mv-info"></p>
        <div class="field"><label for="f-mv-note">הערה</label><input type="text" id="f-mv-note" data-mv="note" maxlength="120" value="${api.esc(d.note)}" placeholder="ספק, מספר תעודה, סיבה"></div>
        <div class="btn-row"><button type="button" class="btn btn-primary" data-save>שמור תנועה</button><button type="button" class="btn" data-back>ביטול</button></div>
      </section>`;
    return {
      html,
      after() {
        const root = document.getElementById('view');
        const info = () => {
          const cur = stockOf(s, d.itemId, d.date || api.today());
          const q = num(d.qty);
          const item = byId(s.items, d.itemId) || {};
          let text = `במלאי כעת: <b>${api.fmt.int(cur)}</b> ${api.esc(item.unit || '')}`;
          if (q != null && q > 0) {
            const after = d.type === 'in' ? cur + q : cur - q;
            text += ` · אחרי התנועה: <b>${api.fmt.int(after)}</b>`;
            if (after < 0) text += ` ${api.pill('warn', 'יותר ממה שיש במלאי')}`;
            else if (item.minQty && after < item.minQty) text += ` ${api.pill('crit', 'מתחת למינימום')}`;
          }
          document.getElementById('mv-info').innerHTML = text;
        };
        info();
        root.querySelectorAll('[data-mv]').forEach((el) => el.addEventListener('input', () => { d[el.dataset.mv] = el.value; info(); }));
        document.getElementById('f-mv-item').addEventListener('change', (ev) => { d.itemId = ev.target.value; api.render(); });
        root.querySelectorAll('[data-mv-type]').forEach((b) => b.addEventListener('click', () => { d.type = b.dataset.mvType; api.render(); }));
        root.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', closeForm));
        root.querySelector('[data-save]').addEventListener('click', () => {
          const er = {};
          if (!d.date) er.date = 'בחר תאריך';
          else if (d.date > api.today()) er.date = 'אי אפשר לדווח על תאריך עתידי';
          if (!byId(s.items, d.itemId)) er.itemId = 'בחר פריט';
          const q = num(d.qty);
          if (q == null || !(q > 0)) er.qty = 'הזן כמות גדולה מ-0';
          d.errors = er;
          if (Object.keys(er).length) return api.render();
          const item = byId(s.items, d.itemId);
          const typeName = C.moveTypes.find((t) => t.id === d.type).name;
          api.ui.entryForm = null;
          api.commit((st) => {
            st.stockMoves.push({ id: Store.newId('m'), date: d.date, itemId: d.itemId, type: d.type, qty: q, note: (d.note || '').trim(), createdAt: nowStamp() });
          }, { toast: `${typeName} נשמרה: ${item.name} ${api.fmt.int(q)} ${item.unit}` });
          window.scrollTo(0, 0);
        });
        if (Object.keys(e).length) focusFirstError();
      },
    };
  }

  function countForm(c) {
    const s = c.s;
    const d = S.count;
    const e = d.errors;
    const it = byId(s.items, d.itemId) || {};
    const html = `
      <section class="form" aria-labelledby="cn-title">
        ${formHead('<span id="cn-title">ספירת מלאי</span>')}
        <div class="fields">
          <div class="field${inv(e, 'date')}"><label for="f-cn-date">תאריך</label><input type="date" id="f-cn-date" data-cn="date" max="${api.today()}" value="${d.date}">${err(e, 'date')}</div>
          <div class="field${inv(e, 'itemId')}"><label for="f-cn-item">פריט</label><select id="f-cn-item" data-cn="itemId">${itemOptions(s, d.itemId)}</select>${err(e, 'itemId')}</div>
          <div class="field${inv(e, 'qty')}"><label for="f-cn-qty">כמות שנספרה${it.unit ? ` (${api.esc(it.unit)})` : ''}</label><input type="number" id="f-cn-qty" data-cn="qty" inputmode="decimal" min="0" step="any" value="${api.esc(d.qty)}"${described(e, 'qty')}>${err(e, 'qty')}</div>
        </div>
        <p class="live-kpi" id="cn-info"></p>
        <div class="btn-row"><button type="button" class="btn btn-primary" data-save>שמור ספירה</button><button type="button" class="btn" data-back>ביטול</button></div>
      </section>`;
    return {
      html,
      after() {
        const root = document.getElementById('view');
        const info = () => {
          const exp = stockOf(s, d.itemId, d.date || api.today());
          const q = num(d.qty);
          const item = byId(s.items, d.itemId) || {};
          let text = `כמות במערכת: <b>${api.fmt.int(exp)}</b> ${api.esc(item.unit || '')}`;
          if (q != null && q >= 0) {
            const diff = q - exp;
            const pct = exp > 0 ? Math.abs(diff) / exp : null;
            const st = pct == null ? 'none' : pct <= 0.02 ? 'good' : pct <= 0.05 ? 'warn' : 'crit';
            text += ` · הפרש: <b>${diff > 0 ? '+' : ''}${api.fmt.int(diff)}</b>${pct != null ? ` (${api.fmt.pct(pct)})` : ''} ${st !== 'none' ? api.pill(st) : ''}`;
          }
          document.getElementById('cn-info').innerHTML = text;
        };
        info();
        root.querySelectorAll('[data-cn]').forEach((el) => el.addEventListener('input', () => { d[el.dataset.cn] = el.value; info(); }));
        document.getElementById('f-cn-item').addEventListener('change', (ev) => { d.itemId = ev.target.value; api.render(); });
        root.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', closeForm));
        root.querySelector('[data-save]').addEventListener('click', () => {
          const er = {};
          if (!d.date) er.date = 'בחר תאריך';
          else if (d.date > api.today()) er.date = 'אי אפשר לדווח על תאריך עתידי';
          if (!byId(s.items, d.itemId)) er.itemId = 'בחר פריט';
          const q = num(d.qty);
          if (q == null || q < 0) er.qty = 'הזן כמות, 0 או יותר';
          d.errors = er;
          if (Object.keys(er).length) return api.render();
          const expected = stockOf(s, d.itemId, d.date);
          const item = byId(s.items, d.itemId);
          api.ui.entryForm = null;
          api.commit((st) => {
            st.stockMoves.push({ id: Store.newId('m'), date: d.date, itemId: d.itemId, type: 'count', qty: q, expectedQty: expected, note: 'ספירה', createdAt: nowStamp() });
          }, { toast: `ספירה נשמרה: ${item.name} ${api.fmt.int(q)} ${item.unit}` });
          window.scrollTo(0, 0);
        });
        if (Object.keys(e).length) focusFirstError();
      },
    };
  }

  // =====================================================================
  // Settings
  // =====================================================================
  const TARGET_FIELDS = [
    ['oee', 'יעד OEE'], ['oeeWarn', 'OEE: מתחת לזה = חריגה'],
    ['scrapMax', 'פסולת מקסימלית'], ['scrapWarn', 'פסולת: מעל זה = חריגה'],
    ['attendance', 'יעד נוכחות'], ['attendanceWarn', 'נוכחות: מתחת לזה = חריגה'],
    ['planAdherence', 'יעד עמידה בתכנון'], ['planAdherenceWarn', 'עמידה בתכנון: מתחת לזה = חריגה'],
  ];

  const cellText = (coll, id, field, value, label) => `<input class="cell-input" type="text" data-edit="${coll}|${id}|${field}|text" value="${api.esc(value)}" aria-label="${label}">`;
  const cellNum = (coll, id, field, value, label, step) => `<input class="cell-input" type="number" inputmode="decimal" min="0" step="${step || 'any'}" data-edit="${coll}|${id}|${field}|num" value="${api.esc(value)}" aria-label="${label}">`;
  const cellBool = (coll, id, value, label) => `<label class="toggle"><input type="checkbox" data-edit="${coll}|${id}|active|bool"${value !== false ? ' checked' : ''} aria-label="${label}"> פעיל</label>`;
  const cellSelect = (coll, id, field, value, options, label, disabled) => `<select class="cell-input" data-edit="${coll}|${id}|${field}|text" aria-label="${label}"${disabled ? ' disabled' : ''}>${options.map((o) => `<option value="${o.id}"${o.id === value ? ' selected' : ''}>${api.esc(o.name)}</option>`).join('')}</select>`;
  const delBtn = (coll, id, name) => `<button type="button" class="btn btn-sm btn-del" data-del-master="${coll}|${id}" aria-label="מחק את ${api.esc(name)}">מחק</button>`;

  function settings(c, a) {
    api = a;
    const s = c.s;
    const t = s.settings.targets;
    const backup = Store.loadBackup();
    const theme = api.ui.theme;

    const machinesRows = s.machines.map((m) => `<tr><td><i class="swatch" style="background:var(--m-${m.id})"></i>${m.id}</td><td>${cellText('machines', m.id, 'name', m.name, 'שם מכונה')}</td><td>${cellNum('machines', m.id, 'ratePerHour', m.ratePerHour, 'קצב אידיאלי ליחידות בשעה', 1)}</td></tr>`).join('');
    const productRows = s.products.map((p) => `<tr><td>${cellText('products', p.id, 'name', p.name, 'שם מוצר')}</td><td>${cellSelect('products', p.id, 'machineId', p.machineId, s.machines, 'מכונה')}</td><td>${cellNum('products', p.id, 'price', p.price, 'מחיר מכירה', 0.01)}</td><td>${cellNum('products', p.id, 'cost', p.cost, 'עלות ליחידה', 0.01)}</td><td>${cellBool('products', p.id, p.active, 'מוצר פעיל')}</td><td>${delBtn('products', p.id, p.name)}</td></tr>`).join('');
    const workerRows = s.workers.map((w) => `<tr><td>${cellText('workers', w.id, 'name', w.name, 'שם עובד')}</td><td>${cellText('workers', w.id, 'role', w.role || '', 'תפקיד')}</td><td>${cellNum('workers', w.id, 'hourlyCost', w.hourlyCost, 'עלות לשעה', 0.5)}</td><td>${cellBool('workers', w.id, w.active, 'עובד פעיל')}</td><td>${delBtn('workers', w.id, w.name)}</td></tr>`).join('');
    const itemRows = s.items.map((i) => {
      const linked = !!i.productId;
      return `<tr><td>${linked ? api.esc(i.name) : cellText('items', i.id, 'name', i.name, 'שם פריט')}</td><td>${cellSelect('items', i.id, 'category', i.category, C.itemCategories.filter((x) => linked || x.id !== 'finished'), 'סוג פריט', linked)}</td><td>${cellText('items', i.id, 'unit', i.unit, 'יחידת מידה')}</td><td>${cellNum('items', i.id, 'unitCost', i.unitCost, 'עלות ליחידה', 0.01)}</td><td>${cellNum('items', i.id, 'minQty', i.minQty, 'מלאי מינימום', 1)}</td><td>${linked ? '<span class="muted">לפי המוצר</span>' : cellBool('items', i.id, i.active, 'פריט פעיל')}</td><td>${linked ? '' : delBtn('items', i.id, i.name)}</td></tr>`;
    }).join('');

    const table = (head, rows, empty) => `<div class="table-wrap settings-table"><table class="data"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${head.length}" class="muted">${empty}</td></tr>`}</tbody></table></div>`;

    const html = `
      <section class="section">${api.sectionHead('הגדרות', 'שינויים נשמרים אוטומטית')}
        <div class="form">
          <div class="field"><label for="set-plant">שם המפעל</label><input type="text" id="set-plant" value="${api.esc(s.settings.plantName)}" maxlength="60"></div>
          <div class="fields">${TARGET_FIELDS.map(([k, l]) => `<div class="field"><label for="tg-${k}">${l} (%)</label><input type="number" id="tg-${k}" data-target="${k}" inputmode="decimal" min="0" max="100" step="0.5" value="${Math.round(t[k] * 1000) / 10}"></div>`).join('')}</div>
          <div class="field"><span class="label">מצב תצוגה</span><div class="seg" role="group" aria-label="מצב תצוגה">${[['system', 'לפי המכשיר'], ['light', 'בהיר'], ['dark', 'כהה']].map(([v, l]) => `<button type="button" data-theme-set="${v}" aria-pressed="${theme === v}">${l}</button>`).join('')}</div></div>
        </div>
      </section>
      <section class="section">${api.sectionHead('מכונות', 'הצבע קבוע לכל מכונה')}${table(['מכונה', 'שם', 'קצב אידיאלי (יח\'/שעה)'], machinesRows)}</section>
      <section class="section">${api.sectionHead('מוצרים', 'כל מוצר מקבל פריט מלאי מוגמר')}${table(['שם', 'מכונה', 'מחיר ₪', 'עלות ₪', 'פעיל', ''], productRows, 'אין מוצרים')}<div><button type="button" class="btn" data-add="products">${api.icon('plus')} הוסף מוצר</button></div></section>
      <section class="section">${api.sectionHead('עובדים', '')}${table(['שם', 'תפקיד', 'עלות לשעה ₪', 'פעיל', ''], workerRows, 'אין עובדים')}<div><button type="button" class="btn" data-add="workers">${api.icon('plus')} הוסף עובד</button></div></section>
      <section class="section">${api.sectionHead('פריטי מלאי', 'מוצר מוגמר מתעדכן מהמוצרים')}${table(['שם', 'סוג', 'יחידה', 'עלות ₪', 'מינימום', 'פעיל', ''], itemRows, 'אין פריטים')}<div><button type="button" class="btn" data-add="items">${api.icon('plus')} הוסף פריט</button></div></section>
      <section class="section">${api.sectionHead('גיבוי ושחזור', 'הנתונים שמורים רק בדפדפן הזה')}
        <div class="form">
          <div class="btn-row">
            <button type="button" class="btn" data-backup-download>${api.icon('download')} הורד קובץ גיבוי</button>
            <button type="button" class="btn" data-backup-show>${api.icon('copy')} הצג טקסט לגיבוי</button>
            <label class="btn" for="import-file">${api.icon('upload')} ייבוא מקובץ</label>
            <input type="file" id="import-file" accept=".json,application/json" class="sr-only">
          </div>
          <div class="field" id="backup-box" hidden><label for="backup-text">טקסט הגיבוי. העתק ושמור אותו במקום בטוח.</label><textarea id="backup-text" class="backup-text" readonly></textarea><div><button type="button" class="btn btn-sm" data-copy>${api.icon('copy')} העתק</button></div></div>
          <div class="field"><label for="import-text">ייבוא מהדבקה: הדבק טקסט גיבוי ולחץ ייבא</label><textarea id="import-text" class="backup-text" placeholder="{ ... }"></textarea><div><button type="button" class="btn btn-sm" data-import-text>ייבא מהטקסט</button></div></div>
          ${backup ? `<div class="btn-row" style="align-items:center"><button type="button" class="btn" data-restore>שחזר את הגיבוי האחרון</button><span class="muted">נשמר ב-${api.esc(new Date(backup.savedAt).toLocaleString('he-IL'))}</span></div>` : ''}
          <p class="hint">ייבוא מחליף את כל הנתונים. לפני ייבוא נשמר גיבוי של המצב הנוכחי.</p>
        </div>
      </section>
      <section class="section">
        <div class="danger-zone">
          <h3>איפוס נתונים</h3>
          <p>מחיקת תנועות, חזרה לנתוני דמו או איפוס מלא. לפני האיפוס נשמר גיבוי אוטומטי.</p>
          <div><button type="button" class="btn btn-danger" data-reset>${api.icon('trash')} איפוס נתונים</button></div>
        </div>
      </section>`;

    return {
      html,
      after() {
        const root = document.getElementById('view');
        document.getElementById('set-plant').addEventListener('change', (ev) => {
          const v = ev.target.value.trim();
          if (!v) { ev.target.value = api.state.settings.plantName; return api.toast('שם המפעל לא יכול להיות ריק'); }
          api.commit((st) => { st.settings.plantName = v; }, { render: false });
          document.getElementById('plant-name').textContent = v;
          api.toast('שם המפעל עודכן');
        });
        root.querySelectorAll('[data-target]').forEach((el) => el.addEventListener('change', () => {
          const v = num(el.value);
          if (v == null || v < 0 || v > 100) { el.value = Math.round(api.state.settings.targets[el.dataset.target] * 1000) / 10; return api.toast('הזן אחוז בין 0 ל-100'); }
          api.commit((st) => { st.settings.targets[el.dataset.target] = v / 100; }, { render: false });
          api.toast('היעד עודכן');
        }));
        root.querySelectorAll('[data-theme-set]').forEach((b) => b.addEventListener('click', () => api.setTheme(b.dataset.themeSet)));
        root.querySelectorAll('[data-edit]').forEach((el) => el.addEventListener('change', () => editMaster(el)));
        root.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => addMaster(b.dataset.add)));
        root.querySelectorAll('[data-del-master]').forEach((b) => b.addEventListener('click', () => {
          const [coll, id] = b.dataset.delMaster.split('|');
          armDelete(b, b.dataset.delMaster, () => deleteMaster(coll, id));
        }));
        root.querySelector('[data-backup-download]').addEventListener('click', () => {
          api.download(`factory-dashboard-${api.today()}.json`, Store.exportJSON(api.state));
          api.toast('אם ההורדה לא התחילה, השתמש ב"הצג טקסט לגיבוי"');
        });
        root.querySelector('[data-backup-show]').addEventListener('click', () => {
          document.getElementById('backup-box').hidden = false;
          const ta = document.getElementById('backup-text');
          ta.value = Store.exportJSON(api.state);
          ta.focus();
          ta.select();
        });
        root.querySelector('[data-copy]').addEventListener('click', () => {
          const ta = document.getElementById('backup-text');
          const fallback = () => { ta.focus(); ta.select(); api.toast('הטקסט מסומן. העתק אותו ידנית'); };
          try {
            navigator.clipboard.writeText(ta.value).then(() => api.toast('הגיבוי הועתק'), fallback);
          } catch (e) { fallback(); }
        });
        document.getElementById('import-file').addEventListener('change', (ev) => {
          const file = ev.target.files && ev.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => importText(String(reader.result));
          reader.onerror = () => api.toast('לא הצלחתי לקרוא את הקובץ');
          reader.readAsText(file);
        });
        root.querySelector('[data-import-text]').addEventListener('click', () => importText(document.getElementById('import-text').value));
        const restore = root.querySelector('[data-restore]');
        if (restore) restore.addEventListener('click', restoreBackup);
        root.querySelector('[data-reset]').addEventListener('click', openReset);
      },
    };
  }

  function editMaster(el) {
    const [coll, id, field, type] = el.dataset.edit.split('|');
    const row = byId(api.state[coll], id);
    if (!row) return;
    let value;
    if (type === 'bool') value = el.checked;
    else if (type === 'num') {
      value = num(el.value);
      if (value == null || value < 0) { el.value = row[field]; return api.toast('הזן מספר 0 או יותר'); }
    } else {
      value = el.value.trim();
      if (!value && field !== 'role') { el.value = row[field]; return api.toast('השדה לא יכול להיות ריק'); }
    }
    api.commit((st) => {
      const r = byId(st[coll], id);
      r[field] = value;
      if (coll === 'products') {
        const fin = st.items.find((i) => i.productId === id);
        if (fin) {
          if (field === 'name') fin.name = value;
          if (field === 'cost') fin.unitCost = value;
          if (field === 'active') fin.active = value;
        }
      }
    }, { render: false });
    api.toast('נשמר');
  }

  function addMaster(coll) {
    const newId = coll === 'products' ? Store.newId('p') : coll === 'workers' ? Store.newId('w') : Store.newId('i');
    api.commit((st) => {
      if (coll === 'products') {
        st.products.push({ id: newId, name: 'מוצר חדש', machineId: st.machines[0].id, price: 0, cost: 0, active: true });
        st.items.push({ id: 'f-' + newId, name: 'מוצר חדש', category: 'finished', unit: 'יח\'', unitCost: 0, minQty: 0, productId: newId, active: true });
      }
      if (coll === 'workers') st.workers.push({ id: newId, name: 'עובד חדש', role: '', hourlyCost: 45, active: true });
      if (coll === 'items') st.items.push({ id: newId, name: 'פריט חדש', category: 'raw', unit: 'ק"ג', unitCost: 0, minQty: 0, active: true });
    }, { toast: 'נוסף. ערוך את השם והנתונים בטבלה' });
    const input = document.querySelector(`[data-edit="${coll}|${newId}|name|text"]`);
    if (input) { input.scrollIntoView({ block: 'center' }); input.focus(); input.select(); }
  }

  function deleteMaster(coll, id) {
    const s = api.state;
    let used = false;
    if (coll === 'products') {
      const fin = s.items.find((i) => i.productId === id);
      used = s.productionLogs.some((l) => l.productId === id) || (fin && s.stockMoves.some((m) => m.itemId === fin.id));
    }
    if (coll === 'workers') used = s.attendance.some((a) => a.workerId === id) || s.productionLogs.some((l) => (l.workerIds || []).includes(id));
    if (coll === 'items') used = s.stockMoves.some((m) => m.itemId === id);
    if (used) return api.toast('יש רשומות שמשתמשות בזה. במקום למחוק, בטל את הסימון "פעיל"');
    api.commit((st) => {
      st[coll] = st[coll].filter((x) => x.id !== id);
      if (coll === 'products') st.items = st.items.filter((i) => i.productId !== id);
    }, { toast: 'נמחק' });
  }

  function importText(text) {
    const r = Store.parseImport(text);
    if (!r.ok) return api.toast(`הייבוא נכשל: ${r.error}`);
    Store.saveBackup(api.state);
    r.state.meta = Object.assign({}, r.state.meta, { importedAt: new Date().toISOString() });
    api.replaceState(r.state, 'הנתונים יובאו', { label: 'בטל', run: restoreBackup });
  }

  function restoreBackup() {
    const b = Store.loadBackup();
    if (!b) return api.toast('אין גיבוי שמור');
    Store.saveBackup(api.state);
    api.replaceState(b.state, 'הגיבוי שוחזר', { label: 'בטל', run: restoreBackup });
  }

  function openReset() {
    const options = [
      ['transactions', 'מחיקת תנועות', 'מוחק דיווחי ייצור, נוכחות ותנועות מלאי. מכונות, מוצרים, עובדים, פריטים והגדרות נשארים.'],
      ['demo', 'חזרה לנתוני דמו', 'מוחק הכל וטוען 30 ימי דמו חדשים עד היום.'],
      ['empty', 'איפוס מלא', 'מוחק הכל. נשארות רק 4 המכונות והגדרות ברירת מחדל.'],
    ];
    api.openModal(`
      <h2 id="reset-title">איפוס נתונים</h2>
      <p>בחר מה לאפס. לפני האיפוס נשמר גיבוי, ואפשר לשחזר אותו מההגדרות.</p>
      <div role="radiogroup" aria-labelledby="reset-title" style="display:grid;gap:10px">
        ${options.map(([v, t, d]) => `<label class="option-card"><input type="radio" name="reset-mode" value="${v}"><div><b>${t}</b><span>${d}</span></div></label>`).join('')}
      </div>
      <div class="field"><label for="reset-confirm">כדי לאשר, הקלד את המילה: איפוס</label><input type="text" id="reset-confirm" autocomplete="off"></div>
      <div class="btn-row"><button type="button" class="btn btn-danger" id="reset-go" disabled>אפס נתונים</button><button type="button" class="btn" id="reset-cancel">ביטול</button></div>
    `, (modal) => {
      const go = modal.querySelector('#reset-go');
      const check = () => {
        const mode = modal.querySelector('input[name="reset-mode"]:checked');
        go.disabled = !(mode && modal.querySelector('#reset-confirm').value.trim() === 'איפוס');
      };
      modal.querySelectorAll('input').forEach((i) => i.addEventListener('input', check));
      modal.querySelectorAll('input[type="radio"]').forEach((i) => i.addEventListener('change', check));
      modal.querySelector('#reset-cancel').addEventListener('click', api.closeModal);
      go.addEventListener('click', () => {
        const mode = modal.querySelector('input[name="reset-mode"]:checked').value;
        const before = api.state;
        Store.saveBackup(before);
        api.download(`factory-dashboard-before-reset-${api.today()}.json`, Store.exportJSON(before));
        const next = Store.resetState(before, mode, api.today());
        S.production = S.attendance = S.move = S.count = null;
        S.lastMachine = 'rondo';
        api.closeModal();
        api.replaceState(next, 'הנתונים אופסו. גיבוי נשמר', { label: 'שחזר', run: restoreBackup });
      });
    });
  }

  window.Forms = { entry, settings };
})();
