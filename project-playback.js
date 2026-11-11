const colors = ['#086d64', '#325fa1', '#a44b24', '#695448'];
const dashes = [[], [6, 4], [2, 3], [9, 4, 2, 4]];
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const charts = new Map();

export function nearestSample(samples, value) {
  let low = 0;
  let high = samples.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low > 0 && value - samples[low - 1] <= samples[low] - value ? low - 1 : low;
}

// Keep breaks in the display series even when two samples share a screen pixel.
export function traceSeries(path, samples, values, x, y) {
  let connected = false;
  values.forEach((value, index) => {
    if (value === null) {
      connected = false;
      return;
    }
    const left = x(samples[index]);
    const top = y(value);
    if (connected) path.lineTo(left, top);
    else {
      path.moveTo(left, top);
      if (values[index + 1] == null) path.lineTo(left + 0.01, top);
    }
    connected = true;
  });
}

export function loadPlayback(source) {
  if (!/^\/portfolio\/assets\/projects\/[a-z0-9-]+\/[a-z0-9-]+\.playback\.json$/.test(source)) {
    return Promise.reject(new Error('无效的数据地址'));
  }
  if (!charts.has(source)) {
    charts.set(source, fetch(source).then(response => {
      if (!response.ok) throw new Error('数据文件不可用');
      return response.json();
    }).catch(error => {
      charts.delete(source);
      throw error;
    }));
  }
  return charts.get(source);
}

export function mountPlayback(host, source, { load = loadPlayback } = {}) {
  let disposed = false;
  let destroy;
  const status = document.createElement('p');
  status.className = 'trace-status';
  status.setAttribute('role', 'status');
  status.textContent = '正在加载时序数据…';
  host.append(status);
  Promise.resolve().then(() => load(source)).then(data => {
    if (!disposed) destroy = buildPlayback(host, data);
  }).catch(() => {
    if (!disposed) {
      if (!status.isConnected) host.replaceChildren(status);
      status.textContent = '交互数据暂时无法加载，可查看上方静态图。';
    }
  });
  return () => {
    disposed = true;
    status.remove();
    destroy?.();
  };
}

function buildPlayback(host, data) {
  const samples = data.samples;
  const start = samples[0];
  const end = samples.at(-1);
  const duration = end - start;
  const formatY = (value, series) => value === null ? '触限，已隐藏' :
    (series.scientific && value !== 0 ? value.toExponential(3) : value.toLocaleString('en-US', {
      maximumFractionDigits: series.decimals ?? 3,
    }));
  let index = samples.length - 1;
  let started = false;
  let raw = false;
  let frame = 0;
  let anchor = 0;
  let elapsed = 0;
  let previousElapsed = 0;
  const e = escape;
  const readSeries = series => raw ? series.values : (series.filtered ?? series.values);
  host.innerHTML = `<div class="trace-player" aria-label="${e(data.title)}">
    ${data.facts?.length ? `<dl class="trace-facts">${data.facts.map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>` : ''}
    <div class="trace-controls">
      <button type="button" class="trace-play">播放</button>
      ${data.panels.some(panel => panel.series.some(series => series.filtered)) ? '<label class="trace-raw"><input type="checkbox"> 显示原始限幅点</label>' : ''}
    </div>
    <div class="trace-panels">${data.panels.map(panel => `<div class="trace-panel">
      <p class="trace-panel-title"><strong>${e(panel.label)}</strong>${panel.unit ? ` <small>${e(panel.unit)}</small>` : ''}</p>
      <dl class="trace-readout">${panel.series.map((series, i) => `<div><dt><i style="--trace-color:${colors[i % colors.length]}" aria-hidden="true"></i>${e(series.label)}</dt><dd></dd></div>`).join('')}</dl>
      <canvas role="img" aria-label="${e(panel.label)}曲线"></canvas>
      ${panel.reference ? `<p class="trace-reference">${e(panel.reference.label)}</p>` : ''}
    </div>`).join('')}</div>
  </div>`;
  const play = host.querySelector('.trace-play');
  const plots = [...host.querySelectorAll('.trace-panel')].map((element, i) => {
    const canvas = element.querySelector('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 不可用');
    return { canvas, context, values: element.querySelectorAll('dd'), panel: data.panels[i] };
  });

  function layout(plot) {
    const { canvas, context, panel } = plot;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 80 || height < 60) return;
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.scale(pixelRatio, pixelRatio);
    const left = width > 400 ? 53 : 40;
    const right = width - 14;
    const top = 10;
    const bottom = height - 10;
    const x = value => left + (value - start) / duration * (right - left);
    const transform = panel.scale === 'log' ? Math.log10 : value => value;
    const min = transform(panel.ticks[0]);
    const max = transform(panel.ticks.at(-1));
    const y = value => bottom - (transform(value) - min) / (max - min) * (bottom - top);
    const paths = panel.series.map(series => {
      const path = new Path2D();
      traceSeries(path, samples, readSeries(series), x, y);
      return path;
    });
    Object.assign(plot, { width, height, left, right, top, bottom, x, y, paths });
  }

  function draw(plot) {
    const { context: ctx, panel, width, height, left, right, top, bottom, x, y, paths } = plot;
    if (!paths) return;
    const cursor = x(samples[index]);
    ctx.clearRect(0, 0, width, height);
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#516561';
    ctx.strokeStyle = '#d8e2df';
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (panel.reference?.band) {
      ctx.fillStyle = '#e1f0e8';
      const [low, high] = panel.reference.band;
      ctx.fillRect(left, y(high), right - left, y(low) - y(high));
      ctx.fillStyle = '#516561';
    }
    for (const tick of panel.ticks) {
      const row = y(tick);
      ctx.fillText(tick >= 10000 ? `${tick / 1000}k` : String(tick), left - 7, row);
      ctx.beginPath();
      ctx.moveTo(left, row);
      ctx.lineTo(right, row);
      ctx.stroke();
    }
    for (let division = 0; division <= 4; division++) {
      const column = left + division * (right - left) / 4;
      ctx.beginPath();
      ctx.moveTo(column, top);
      ctx.lineTo(column, bottom);
      ctx.stroke();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top - 1, right - left, bottom - top + 2);
    ctx.clip();
    if (panel.reference) {
      ctx.strokeStyle = '#835e41';
      ctx.setLineDash([4, 4]);
      for (const reference of panel.reference.lines ?? []) {
        ctx.beginPath();
        ctx.moveTo(left, y(reference));
        ctx.lineTo(right, y(reference));
        ctx.stroke();
      }
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top - 1, cursor - left, bottom - top + 2);
    ctx.clip();
    ctx.lineWidth = 1.75;
    ctx.lineCap = 'round';
    paths.forEach((path, i) => {
      ctx.strokeStyle = colors[i % colors.length];
      ctx.setLineDash(dashes[i % dashes.length]);
      ctx.stroke(path);
    });
    ctx.restore();
    if (index < samples.length - 1) {
      ctx.strokeStyle = '#556b65';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursor, top);
      ctx.lineTo(cursor, bottom);
      ctx.stroke();
    }
    ctx.restore();
    panel.series.forEach((series, i) => {
      const value = readSeries(series)[index];
      if (value === null) return;
      ctx.beginPath();
      ctx.arc(cursor, y(value), 3.5 + 0.8 * i, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = colors[i % colors.length];
      ctx.fill();
      ctx.stroke();
    });
  }

  function render() {
    for (const plot of plots) {
      plot.panel.series.forEach((series, i) => {
        const value = readSeries(series)[index];
        plot.values[i].textContent = formatY(value, series) + (plot.panel.unit && value !== null ? ' ' + plot.panel.unit : '');
      });
      draw(plot);
    }
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    play.textContent = index < samples.length - 1 ? '继续播放' : started ? '重新播放' : '播放';
  }

  function tick(timestamp) {
    elapsed = Math.min(1, previousElapsed + (timestamp - anchor) / 9000);
    const next = nearestSample(samples, start + duration * elapsed);
    if (next !== index) {
      index = next;
      render();
    }
    if (elapsed < 1) frame = requestAnimationFrame(tick);
    else pause();
  }

  play.onclick = () => {
    if (frame) return pause();
    started = true;
    if (index === samples.length - 1) {
      index = 0;
      elapsed = 0;
      render();
    }
    previousElapsed = elapsed;
    anchor = performance.now();
    play.textContent = '暂停';
    frame = requestAnimationFrame(tick);
  };
  const resize = new ResizeObserver(() => { plots.forEach(layout); render(); });
  plots.forEach(plot => resize.observe(plot.canvas));
  const rawControl = host.querySelector('.trace-raw input');
  if (rawControl) rawControl.onchange = () => { raw = rawControl.checked; plots.forEach(layout); render(); };
  const visibility = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', visibility);
  render();
  return () => {
    pause();
    resize.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    host.replaceChildren();
  };
}
