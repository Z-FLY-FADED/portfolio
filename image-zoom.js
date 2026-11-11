const zoomLevels = [1, 1.25, 1.5, 2, 2.5, 3, 4];

export function imageZoomMarkup(image) {
  return `<div class="image-zoom-controls" role="group" aria-label="图片缩放">
    <button type="button" data-image-zoom="out" aria-label="缩小图片" disabled>−</button>
    <output data-image-zoom-level aria-label="图片缩放比例">100%</output>
    <button type="button" data-image-zoom="in" aria-label="放大图片" disabled>+</button>
    <button type="button" data-image-zoom="fit" disabled>适合窗口</button>
  </div><div class="lightbox-image" tabindex="0" role="region" aria-label="图片查看区域"><div class="image-zoom-canvas">${image}</div></div>`;
}

export function mountImageZoom(dialog, rotation = 0) {
  const viewport = dialog.querySelector('.lightbox-image');
  const canvas = viewport.querySelector('.image-zoom-canvas');
  const image = canvas.querySelector('img');
  const output = dialog.querySelector('[data-image-zoom-level]');
  const smaller = dialog.querySelector('[data-image-zoom="out"]');
  const larger = dialog.querySelector('[data-image-zoom="in"]');
  const fit = dialog.querySelector('[data-image-zoom="fit"]');
  const lifecycle = new AbortController();
  const quarterTurn = Math.abs(rotation) === 90;
  let level = 0;
  let drag;
  let wheelDelta = 0;

  canvas.style.setProperty('--zoom-rotation', `${rotation}deg`);
  image.loading = 'eager';
  image.draggable = false;
  smaller.disabled = larger.disabled = fit.disabled = true;
  output.value = '100%';

  function render() {
    const {naturalWidth, naturalHeight} = image;
    const {offsetWidth, offsetHeight} = viewport;
    if (!image.complete || !naturalWidth || !naturalHeight || !offsetWidth || !offsetHeight) return;

    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth;
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight;
    const rotatedWidth = quarterTurn ? naturalHeight : naturalWidth;
    const rotatedHeight = quarterTurn ? naturalWidth : naturalHeight;
    const scale = Math.min(1, offsetWidth / rotatedWidth, offsetHeight / rotatedHeight) * zoomLevels[level];
    const width = Math.max(1, Math.floor(naturalWidth * scale));
    const height = Math.max(1, Math.floor(naturalHeight * scale));
    canvas.style.setProperty('--zoom-image-width', `${width}px`);
    canvas.style.setProperty('--zoom-image-height', `${height}px`);
    canvas.style.setProperty('--zoom-width', `${quarterTurn ? height : width}px`);
    canvas.style.setProperty('--zoom-height', `${quarterTurn ? width : height}px`);
    viewport.scrollLeft = centerX * viewport.scrollWidth - viewport.clientWidth / 2;
    viewport.scrollTop = centerY * viewport.scrollHeight - viewport.clientHeight / 2;
    viewport.classList.toggle('is-zoomed', viewport.scrollWidth > viewport.clientWidth || viewport.scrollHeight > viewport.clientHeight);
    smaller.disabled = fit.disabled = level === 0;
    larger.disabled = level === zoomLevels.length - 1;
    output.value = `${zoomLevels[level] * 100}%`;
    if ([smaller, larger, fit].some(button => button.disabled && button === document.activeElement)) {
      viewport.focus({preventScroll:true});
    }
  }

  function setLevel(next) {
    if (!image.complete || !image.naturalWidth) return;
    level = Math.max(0, Math.min(zoomLevels.length - 1, next));
    render();
  }

  const options = {signal: lifecycle.signal};
  smaller.addEventListener('click', () => setLevel(level - 1), options);
  larger.addEventListener('click', () => setLevel(level + 1), options);
  fit.addEventListener('click', () => setLevel(0), options);
  dialog.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || !image.naturalWidth) return;
    const next = {'-':level - 1, '+':level + 1, '=':level + 1, '0':0}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setLevel(next);
  }, options);

  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !image.complete || !image.naturalWidth) return;
    event.preventDefault();
    wheelDelta += event.deltaY * (event.deltaMode === 0 ? 1 : event.deltaMode === 1 ? 16 : viewport.clientHeight);
    if (Math.abs(wheelDelta) < 60) return;
    setLevel(level - Math.sign(wheelDelta));
    wheelDelta = 0;
  }, {...options, passive:false});

  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !viewport.classList.contains('is-zoomed') || !canvas.contains(event.target)) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:viewport.scrollLeft, top:viewport.scrollTop};
    viewport.classList.add('is-panning');
    viewport.setPointerCapture(event.pointerId);
  }, options);
  viewport.addEventListener('pointermove', event => {
    if (event.pointerId !== drag?.id) return;
    viewport.scrollLeft = drag.left + drag.x - event.clientX;
    viewport.scrollTop = drag.top + drag.y - event.clientY;
  }, options);
  viewport.addEventListener('lostpointercapture', () => {
    drag = undefined;
    viewport.classList.remove('is-panning');
  }, options);

  const observer = new ResizeObserver(render);
  observer.observe(viewport, {box:'border-box'});
  image.addEventListener('load', render, options);
  render();

  return () => {
    observer.disconnect();
    lifecycle.abort();
    canvas.removeAttribute('style');
    viewport.classList.remove('is-panning','is-zoomed');
  };
}
