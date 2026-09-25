/* Chart.js wrappers: modern styling (gradient fills, rounded bars, value labels),
   theme-aware colors, RTL tooltips, dashed target line. */
(function (root) {
  const registry = [];

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function theme() {
    return {
      ink: css('--ink'), ink2: css('--ink-2'), ink3: css('--ink-3'), line: css('--line'), surface: css('--surface'),
      bar: css('--bar'), barMuted: css('--bar-muted'),
      good: css('--good'), warn: css('--warn'), crit: css('--crit'), none: css('--none'),
      machine: (id) => css(`--m-${id}`) || css('--bar'),
      reason: (id) => css(`--r-${id}`) || css('--bar'),
    };
  }

  const available = () => typeof root.Chart === 'function';
  const reducedMotion = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rgba(hex, a) {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return hex;
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // Gradient from a softer base to the full color at the bar end.
  function gradient(chart, color, horizontal) {
    const a = chart.chartArea;
    if (!a) return color;
    const g = horizontal
      ? chart.ctx.createLinearGradient(a.right, 0, a.left, 0)
      : chart.ctx.createLinearGradient(0, a.bottom, 0, a.top);
    g.addColorStop(0, rgba(color, 0.62));
    g.addColorStop(1, color);
    return g;
  }

  // ---------- plugins ----------
  const targetLine = {
    id: 'targetLine',
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts || opts.value == null) return;
      const horizontal = chart.options.indexAxis === 'y';
      const scale = horizontal ? chart.scales.x : chart.scales.y;
      if (!scale) return;
      const px = scale.getPixelForValue(opts.value);
      const { ctx, chartArea: a } = chart;
      if (horizontal ? px < a.left || px > a.right : px < a.top || px > a.bottom) return;
      ctx.save();
      ctx.strokeStyle = opts.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      if (horizontal) { ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); } else { ctx.moveTo(a.left, px); ctx.lineTo(a.right, px); }
      ctx.stroke();
      if (opts.label) {
        ctx.setLineDash([]);
        ctx.font = '700 12px Heebo, sans-serif';
        const w = ctx.measureText(opts.label).width + 14;
        const x = horizontal ? px - w / 2 : a.left + 4;
        const y = horizontal ? a.top - 20 : px - 22;
        ctx.fillStyle = opts.color;
        roundRect(ctx, x, y, w, 18, 9);
        ctx.fill();
        ctx.fillStyle = opts.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opts.label, x + w / 2, y + 9.5);
      }
      ctx.restore();
    },
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Values printed at the end of each bar (or on top of each stack).
  const valueLabels = {
    id: 'valueLabels',
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts || !opts.display) return;
      const { ctx } = chart;
      const horizontal = chart.options.indexAxis === 'y';
      const reversed = horizontal && chart.scales.x && chart.scales.x.options.reverse;
      ctx.save();
      ctx.font = '700 12px Heebo, sans-serif';
      ctx.fillStyle = opts.color;
      const draw = (el, v) => {
        if (horizontal) {
          const dir = el.x < el.base ? -1 : el.x > el.base ? 1 : reversed ? -1 : 1;
          ctx.textAlign = dir < 0 ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(opts.fmt(v), el.x + dir * 6, el.y);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(opts.fmt(v), el.x, el.y - 5);
        }
      };
      const visible = chart.data.datasets.map((ds, i) => ({ ds, meta: chart.getDatasetMeta(i) })).filter((x) => !x.meta.hidden);
      if (opts.stacked) {
        chart.data.labels.forEach((_l, i) => {
          let total = 0;
          let top = null;
          for (const { ds, meta } of visible) {
            const v = Number(ds.data[i]) || 0;
            total += v;
            if (v > 0) top = meta.data[i];
          }
          if (top && total > 0) draw(top, total);
        });
      } else {
        for (const { ds, meta } of visible) {
          meta.data.forEach((el, i) => {
            const v = ds.data[i];
            if (v != null && (v !== 0 || opts.zero)) draw(el, v);
          });
        }
      }
      ctx.restore();
    },
  };

  const centerText = {
    id: 'centerText',
    afterDraw(chart, _args, opts) {
      if (!opts || !opts.text) return;
      const meta = chart.getDatasetMeta(0);
      const arc = meta && meta.data[0];
      if (!arc) return;
      const { ctx } = chart;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = opts.color;
      ctx.font = '800 26px Rubik, Heebo, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(opts.text, arc.x, arc.y + 6);
      if (opts.sub) {
        ctx.font = '600 12px Heebo, sans-serif';
        ctx.fillStyle = opts.subColor;
        ctx.textBaseline = 'top';
        ctx.fillText(opts.sub, arc.x, arc.y + 8);
      }
      ctx.restore();
    },
  };

  function setup() {
    if (!available()) return;
    root.Chart.register(targetLine, valueLabels, centerText);
    const d = root.Chart.defaults;
    d.font.family = "Heebo, 'Segoe UI', Arial, sans-serif";
    d.font.size = 13;
    d.locale = 'he-IL';
    d.animation = reducedMotion() ? false : { duration: 450, easing: 'easeOutQuart' };
    if (d.animations && d.animations.colors) d.animations.colors = false; // gradients cannot be color-interpolated
    if (d.plugins.colors) d.plugins.colors.enabled = false; // never fall back to the default palette
    d.maintainAspectRatio = false;
    d.plugins.legend.rtl = true;
    d.plugins.legend.textDirection = 'rtl';
    d.plugins.tooltip.rtl = true;
    d.plugins.tooltip.textDirection = 'rtl';
  }

  function destroyAll() {
    while (registry.length) {
      const c = registry.pop();
      try { c.destroy(); } catch (e) { /* ignore */ }
    }
  }

  function make(canvas, config) {
    if (!available() || !canvas) return null;
    const c = new root.Chart(canvas, config);
    registry.push(c);
    return c;
  }

  function legendOpts(t, show) {
    return {
      display: show,
      position: 'top',
      align: 'start',
      labels: { color: t.ink2, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 16, font: { size: 13, weight: '600' } },
    };
  }

  function tooltipOpts(t, fmt) {
    return {
      backgroundColor: rgba(t.ink, 0.94),
      titleColor: t.surface,
      bodyColor: t.surface,
      titleFont: { weight: '700', size: 13 },
      bodyFont: { weight: '600', size: 13 },
      padding: 12,
      cornerRadius: 10,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        label(ctx) {
          const v = ctx.chart.options.indexAxis === 'y' ? ctx.parsed.x : ctx.parsed.y;
          if (v == null) return `${ctx.dataset.label || ''}: אין נתונים`;
          return `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${fmt(v)}`;
        },
      },
    };
  }

  function valueAxis(t, fmt, opts) {
    return {
      beginAtZero: true,
      max: opts.max,
      suggestedMax: opts.suggestedMax,
      stacked: !!opts.stacked,
      reverse: !!opts.reverse,
      grid: { color: rgba(t.ink3, 0.18), drawTicks: false, lineWidth: 1 },
      border: { display: false, dash: [4, 4] },
      ticks: { color: t.ink3, padding: 8, callback: (v) => fmt(v), maxTicksLimit: 5, font: { size: 12 } },
    };
  }

  function categoryAxis(t, opts) {
    return {
      stacked: !!opts.stacked,
      position: opts.position,
      grid: { display: false },
      border: { display: false },
      ticks: { color: t.ink2, autoSkip: true, maxRotation: 0, font: { size: 12, weight: '600' }, padding: 6 },
    };
  }

  // datasets: [{ label, data, color | colors[] }]
  function bar(canvas, labels, datasets, opts) {
    opts = opts || {};
    const t = theme();
    const fmt = opts.fmt || ((v) => v);
    const horizontal = !!opts.horizontal;
    const stacked = !!opts.stacked;
    const showValues = opts.values != null ? opts.values : labels.length <= (horizontal ? 24 : 14);
    return make(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: (ctx) => gradient(ctx.chart, ds.colors ? ds.colors[ctx.dataIndex] : ds.color, horizontal),
          hoverBackgroundColor: ds.colors || ds.color,
          borderColor: t.surface,
          borderWidth: stacked ? 2 : 0,
          borderRadius: stacked ? 6 : 8,
          borderSkipped: stacked ? false : 'start',
          maxBarThickness: horizontal ? 26 : 46,
          categoryPercentage: 0.72,
          barPercentage: 0.88,
        })),
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        layout: { padding: horizontal ? { left: showValues ? 46 : 8, top: opts.target != null ? 24 : 4 } : { top: showValues || opts.target != null ? 24 : 8 } },
        plugins: {
          legend: legendOpts(t, opts.legend != null ? opts.legend : datasets.length > 1),
          tooltip: tooltipOpts(t, fmt),
          targetLine: opts.target != null ? { value: opts.target, label: opts.targetLabel, color: t.ink2, textColor: t.surface } : undefined,
          valueLabels: { display: showValues, fmt: opts.valueFmt || fmt, color: t.ink, stacked, zero: !!opts.zero },
        },
        scales: horizontal
          ? { x: valueAxis(t, fmt, Object.assign({}, opts, { reverse: true })), y: categoryAxis(t, { stacked, position: 'right' }) }
          : { x: categoryAxis(t, { stacked }), y: valueAxis(t, fmt, opts) },
      },
    });
  }

  // datasets: [{ label, data, color }] — area line with a soft gradient.
  function line(canvas, labels, datasets, opts) {
    opts = opts || {};
    const t = theme();
    const fmt = opts.fmt || ((v) => v);
    return make(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          borderColor: ds.color,
          backgroundColor: (ctx) => {
            const a = ctx.chart.chartArea;
            if (!a) return rgba(ds.color, 0.15);
            const g = ctx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
            g.addColorStop(0, rgba(ds.color, 0.28));
            g.addColorStop(1, rgba(ds.color, 0));
            return g;
          },
          fill: datasets.length === 1,
          borderWidth: 3,
          pointRadius: labels.length > 20 ? 0 : 4,
          pointHoverRadius: 6,
          pointBackgroundColor: t.surface,
          pointBorderColor: ds.color,
          pointBorderWidth: 2,
          spanGaps: true,
          tension: 0.35,
        })),
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: opts.target != null ? 24 : 8 } },
        plugins: {
          legend: legendOpts(t, datasets.length > 1),
          tooltip: tooltipOpts(t, fmt),
          targetLine: opts.target != null ? { value: opts.target, label: opts.targetLabel, color: t.ink2, textColor: t.surface } : undefined,
        },
        scales: { x: categoryAxis(t, {}), y: valueAxis(t, fmt, opts) },
      },
    });
  }

  function doughnut(canvas, labels, data, colors, opts) {
    opts = opts || {};
    const t = theme();
    const fmt = opts.fmt || ((v) => v);
    const total = data.reduce((a, b) => a + b, 0);
    return make(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, hoverBackgroundColor: colors, borderWidth: 0, borderRadius: 8, spacing: 3, hoverOffset: 6 }] },
      options: {
        cutout: '70%',
        layout: { padding: 8 },
        plugins: {
          legend: {
            position: 'right',
            rtl: true,
            labels: {
              color: t.ink2, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14, font: { size: 14, weight: '600' },
              generateLabels(chart) {
                return chart.data.labels.map((l, i) => ({
                  text: `${l} · ${fmt(chart.data.datasets[0].data[i])}`,
                  fillStyle: colors[i], strokeStyle: colors[i], pointStyle: 'circle', index: i, fontColor: t.ink2,
                  hidden: !chart.getDataVisibility(i),
                }));
              },
            },
          },
          tooltip: Object.assign(tooltipOpts(t, fmt), {
            callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)} (${total ? Math.round((ctx.parsed / total) * 100) : 0}%)` },
          }),
          centerText: { text: opts.centerText, sub: opts.centerSub, color: t.ink, subColor: t.ink3 },
        },
      },
    });
  }

  root.Charts = { setup, destroyAll, line, bar, doughnut, theme, available };
})(typeof globalThis !== 'undefined' ? globalThis : this);
