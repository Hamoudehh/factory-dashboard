/* Chart.js wrappers: theme-aware colors, RTL tooltips, target line plugin. */
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
    };
  }

  const available = () => typeof root.Chart === 'function';

  // Dashed reference line at a value on the value axis.
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
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      if (horizontal) { ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); } else { ctx.moveTo(a.left, px); ctx.lineTo(a.right, px); }
      ctx.stroke();
      if (opts.label) {
        ctx.setLineDash([]);
        ctx.fillStyle = opts.color;
        ctx.font = '600 12px Heebo, sans-serif';
        ctx.textAlign = horizontal ? 'center' : 'left';
        ctx.textBaseline = 'bottom';
        if (horizontal) ctx.fillText(opts.label, px, a.top - 2);
        else ctx.fillText(opts.label, a.left + 4, px - 3);
      }
      ctx.restore();
    },
  };

  function setup() {
    if (!available()) return;
    root.Chart.register(targetLine);
    const d = root.Chart.defaults;
    d.font.family = "Heebo, 'Segoe UI', Arial, sans-serif";
    d.font.size = 13;
    d.locale = 'he-IL';
    d.animation = false;
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

  function commonPlugins(t, fmt, legend) {
    return {
      legend: {
        display: legend !== false,
        position: 'top',
        align: 'start',
        labels: { color: t.ink2, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, padding: 14, font: { size: 13, weight: '600' } },
      },
      tooltip: {
        backgroundColor: t.ink,
        titleColor: t.surface,
        bodyColor: t.surface,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        callbacks: {
          label(ctx) {
            const v = ctx.chart.options.indexAxis === 'y' ? ctx.parsed.x : ctx.parsed.y;
            if (v == null) return `${ctx.dataset.label || ''}: אין נתונים`;
            return `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${fmt(v)}`;
          },
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
      position: opts.position,
      grid: { color: t.line, drawTicks: false },
      border: { display: false },
      ticks: { color: t.ink3, padding: 6, callback: (v) => fmt(v), maxTicksLimit: 6 },
    };
  }

  function categoryAxis(t, opts) {
    return {
      stacked: !!opts.stacked,
      position: opts.position,
      grid: { display: false },
      border: { color: t.line },
      ticks: { color: t.ink2, autoSkip: true, maxRotation: 0, font: { size: 12 } },
    };
  }

  // datasets: [{ label, data, color, dashed }]
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
          backgroundColor: ds.color,
          borderWidth: 2,
          pointRadius: labels.length > 20 ? 0 : 4,
          pointHoverRadius: 6,
          pointBackgroundColor: ds.color,
          pointBorderColor: t.surface,
          pointBorderWidth: 2,
          spanGaps: true,
          tension: 0.25,
        })),
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: Object.assign(commonPlugins(t, fmt, datasets.length > 1), {
          targetLine: opts.target != null ? { value: opts.target, label: opts.targetLabel, color: t.ink3 } : undefined,
        }),
        scales: { x: categoryAxis(t, {}), y: valueAxis(t, fmt, opts) },
      },
    });
  }

  // datasets: [{ label, data, color | colors[] }]
  function bar(canvas, labels, datasets, opts) {
    opts = opts || {};
    const t = theme();
    const fmt = opts.fmt || ((v) => v);
    const horizontal = !!opts.horizontal;
    const valueOpts = Object.assign({}, opts, horizontal ? { reverse: true } : {});
    const catOpts = { stacked: opts.stacked, position: horizontal ? 'right' : undefined };
    return make(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.colors || ds.color,
          borderColor: t.surface,
          borderWidth: opts.stacked ? { top: 2 } : 0,
          borderRadius: 4,
          borderSkipped: 'start',
          maxBarThickness: horizontal ? 26 : 40,
          categoryPercentage: 0.75,
          barPercentage: 0.9,
        })),
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        plugins: Object.assign(commonPlugins(t, fmt, opts.legend != null ? opts.legend : datasets.length > 1), {
          targetLine: opts.target != null ? { value: opts.target, label: opts.targetLabel, color: t.ink3 } : undefined,
        }),
        scales: horizontal
          ? { x: valueAxis(t, fmt, valueOpts), y: categoryAxis(t, catOpts) }
          : { x: categoryAxis(t, catOpts), y: valueAxis(t, fmt, valueOpts) },
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
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: t.surface, borderWidth: 2, hoverOffset: 6 }] },
      options: {
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            rtl: true,
            labels: {
              color: t.ink2, usePointStyle: true, pointStyle: 'rectRounded', padding: 14, font: { size: 14, weight: '600' },
              generateLabels(chart) {
                return chart.data.labels.map((l, i) => ({
                  text: `${l} · ${fmt(chart.data.datasets[0].data[i])}`,
                  fillStyle: colors[i], strokeStyle: colors[i], pointStyle: 'rectRounded', index: i, fontColor: t.ink2,
                  hidden: !chart.getDataVisibility(i),
                }));
              },
            },
          },
          tooltip: {
            backgroundColor: t.ink, titleColor: t.surface, bodyColor: t.surface, padding: 10, cornerRadius: 8,
            callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)} (${total ? Math.round((ctx.parsed / total) * 100) : 0}%)` },
          },
        },
      },
    });
  }

  root.Charts = { setup, destroyAll, line, bar, doughnut, theme, available };
})(typeof globalThis !== 'undefined' ? globalThis : this);
