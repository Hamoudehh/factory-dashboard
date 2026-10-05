// Mobile check for the dashboard (PRACTICE.md, section 7). Runs in the browser, not in Node.
//
//   1. node tools/serve.js, and open http://localhost:5173
//   2. In the browser console:  eval(await (await fetch('/tools/mobile-check.js')).text())
//
// Loads the dashboard in a 375px and a 412px frame, goes through every screen in light and dark,
// opens every entry form, and lists what breaks the mobile rules:
// horizontal page scroll, tap targets under 48px, and text fields under 16px.
// An empty `problems` list means it passed.
(async function mobileCheck(widths = [375, 412]) {
  const VIEWS = ['owner', 'machines', 'workers', 'products', 'inventory', 'suppliers', 'plan', 'entry', 'settings'];
  const CONTROLS = 'button, a.btn, a.tab, select, input:not([type=hidden]), textarea, label.btn, summary';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function run(width) {
    const frame = document.createElement('iframe');
    frame.style.cssText = `position:absolute;top:0;left:0;width:${width}px;height:812px;border:0;z-index:9999;background:#fff`;
    frame.src = `/index.html?check=${Date.now()}#owner`;
    document.body.appendChild(frame);
    await new Promise((r) => { frame.onload = r; });
    await wait(1200);
    const w = frame.contentWindow;
    const d = w.document;
    const pageWidth = w.innerWidth;
    const problems = [];
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && w.getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden]');
    };
    const inspect = (where, scope) => {
      const overflow = d.documentElement.scrollWidth - pageWidth;
      if (overflow > 0) problems.push(`${where}: page scrolls sideways by ${overflow}px`);
      for (const el of [...scope.querySelectorAll(CONTROLS)].filter(visible)) {
        if (/checkbox|radio/.test(el.type || '') || el.classList.contains('sr-only')) continue;
        const label = (el.textContent || el.getAttribute('aria-label') || el.type || '').trim().slice(0, 20);
        const h = el.getBoundingClientRect().height;
        // Number boxes in Settings sit inside a 64px clickable box, which is the real tap target.
        if (h < 47.5 && !el.closest('.vbox-input')) problems.push(`${where}: "${label}" is ${Math.round(h)}px tall (min 48)`);
        if (/INPUT|SELECT|TEXTAREA/.test(el.tagName) && parseFloat(w.getComputedStyle(el).fontSize) < 16) {
          problems.push(`${where}: field "${el.id || label}" text is ${w.getComputedStyle(el).fontSize} (min 16px)`);
        }
      }
    };

    for (const theme of ['light', 'dark']) {
      d.documentElement.setAttribute('data-theme', theme);
      for (const view of VIEWS) {
        w.location.hash = `#${view}`;
        await wait(450);
        inspect(`${width}px ${theme} ${view}`, d);
      }
    }
    d.documentElement.removeAttribute('data-theme');

    w.location.hash = '#entry';
    await wait(450);
    for (const form of [...d.querySelectorAll('[data-open-form]')].map((b) => b.dataset.openForm)) {
      w.location.hash = '#owner';
      await wait(200);
      w.location.hash = '#entry';
      await wait(400);
      const button = d.querySelector(`[data-open-form="${form}"]`);
      if (!button) continue;
      button.click();
      await wait(400);
      inspect(`${width}px form ${form}`, d.getElementById('view'));
    }
    frame.remove();
    return problems;
  }

  const problems = [];
  for (const width of widths) problems.push(...await run(width));
  const result = { widths, passed: problems.length === 0, problems: [...new Set(problems)] };
  console.log(result.passed ? 'mobile check passed' : 'mobile check found problems', result);
  return result;
})();
