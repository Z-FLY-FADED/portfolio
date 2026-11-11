const brEscape = value => String(value ?? '').replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const brNumber = index => String(index + 1).padStart(2, '0');

export function projectBriefingMarkup() {
  return `<section id="project-briefing" class="project-briefing" aria-labelledby="project-briefing-title">
    <div class="br-heading">
      <h2 id="project-briefing-title">项目汇报</h2>
      <button type="button" data-br-fullscreen hidden>全屏讲解</button>
    </div>
    <div class="br-stages" role="tablist" aria-label="汇报章节"></div>
    <div id="project-briefing-slide" class="br-slide" role="tabpanel"></div>
    <div class="br-navigation" aria-label="汇报翻页">
      <button type="button" data-br-move="-1">← 上一页</button>
      <span data-br-page aria-live="polite"></span>
      <button type="button" data-br-move="1">下一页 →</button>
    </div>
    <dialog class="br-dialog" aria-label="放大图档">
      <button type="button" data-br-close autofocus>关闭</button>
      <img alt=""><p></p>
    </dialog>
  </section>`;
}

export function mountProjectBriefing(root, briefing, { imageUrl, loadScene, mountModel, mountPlayback } = {}) {
  if (!root || !briefing?.stages?.length) return () => {};
  const e = brEscape;
  const stages = briefing.stages;
  const tabs = root.querySelector('.br-stages');
  const panel = root.querySelector('.br-slide');
  const dialog = root.querySelector('.br-dialog');
  const full = root.querySelector('[data-br-fullscreen]');
  const cachedScenes = new Map();
  let stageIndex = 0;
  let visualIndex = 0;
  let modelMode = false;
  let request = 0;
  let disposeModel;
  let disposePlayback;
  let opener;

  tabs.innerHTML = stages.map((stage, i) => `<button type="button" role="tab" id="br-stage-${i}" aria-controls="project-briefing-slide" data-br-stage="${i}"><span>${brNumber(i)}</span>${e(stage.label)}</button>`).join('');
  full.hidden = !document.fullscreenEnabled;

  function stopVisual() {
    request++;
    disposeModel?.();
    disposeModel = undefined;
    disposePlayback?.();
    disposePlayback = undefined;
  }

  function renderVisual() {
    stopVisual();
    const stage = stages[stageIndex];
    const view = stage.visuals[visualIndex];
    const media = panel.querySelector('[data-br-media]');
    const path = imageUrl ? imageUrl(view.src) : view.src;
    const animation = view.animation && (imageUrl ? imageUrl(view.animation) : view.animation);
    const modelAvailable = view.scene && loadScene && mountModel;
    const interactive = view.playback && mountPlayback;
    const description = view.caption?.trim() === view.label?.trim() ? '' : view.caption?.trim();
    const details = description || view.source;
    const mediaActions = `${modelAvailable ? `<button type="button" data-br-model-mode>${modelMode ? '图示' : '旋转模型'}</button>` : ''}
      ${interactive ? '<button type="button" data-br-interactive aria-expanded="false">查看动态曲线</button>' : animation && !modelAvailable ? '<button type="button" data-br-playback>播放 GIF</button>' : ''}`.trim();
    media.innerHTML = `
      <div class="br-visual-choices" role="group" aria-label="汇报图档">
        ${stage.visuals.length > 1 ? stage.visuals.map((item, i) => `<button type="button" data-br-visual="${i}" aria-pressed="${i === visualIndex}">${e(item.label)}</button>`).join('') : ''}
      </div>
      <div class="br-media-model" data-br-model>
        <button class="br-picture" type="button" data-br-zoom aria-label="放大图档 ${e(view.alt)}"><img src="${e(path)}" alt="${e(view.alt)}"></button>
      </div>
      ${details || mediaActions ? `<div class="br-caption">
        ${details ? `<div>${description ? `<p>${e(description)}</p>` : ''}${view.source ? `<small>${e(view.source)}</small>` : ''}</div>` : ''}
        ${mediaActions}
      </div>` : ''}
      ${interactive ? '<div class="trace-slot" hidden></div>' : ''}
      <p class="br-model-status" data-br-status aria-live="polite" hidden></p>`;
    if (interactive) {
      const control = media.querySelector('[data-br-interactive]');
      const slot = media.querySelector('.trace-slot');
      control.onclick = () => {
        const opening = slot.hidden;
        slot.hidden = !opening;
        control.setAttribute('aria-expanded', String(opening));
        control.textContent = opening ? '收起动态曲线' : '查看动态曲线';
        if (opening) disposePlayback = mountPlayback(slot, view.playback);
        else {
          disposePlayback?.();
          disposePlayback = undefined;
        }
      };
    }
    const playback = media.querySelector('[data-br-playback]');
    if (playback) {
      const picture = media.querySelector('.br-picture img');
      const status = media.querySelector('[data-br-status]');
      let playing = false;
      function showAnimation(active) {
        playing = active;
        picture.src = active ? animation : path;
        playback.textContent = active ? '返回静态图' : '播放 GIF';
      }
      playback.addEventListener('click', () => {
        status.hidden = true;
        showAnimation(!playing);
      });
      picture.addEventListener('error', () => {
        if (!playing) return;
        showAnimation(false);
        status.textContent = 'GIF 加载失败，已恢复静态图。';
        status.hidden = false;
      });
    }
    if (modelMode && modelAvailable) {
      const ticket = request;
      const status = media.querySelector('[data-br-status]');
      status.hidden = false;
      status.textContent = '正在载入三维模型…';
      if (!cachedScenes.has(view.scene)) {
        cachedScenes.set(view.scene, Promise.resolve().then(() => loadScene(view.scene)).catch(error => {
          cachedScenes.delete(view.scene);
          throw error;
        }));
      }
      cachedScenes.get(view.scene).then(scene => {
        if (ticket !== request || !root.isConnected) return;
        disposeModel = mountModel(media.querySelector('[data-br-model]'), scene);
        status.textContent = disposeModel ? '' : '当前浏览器显示模型图示。';
        status.hidden = Boolean(disposeModel);
      }).catch(() => {
        if (ticket === request) status.textContent = '三维视图暂不可用，可查看模型图示。';
      });
    }
  }

  function chooseVisual(index) {
    visualIndex = index;
    modelMode = Boolean(stages[stageIndex].visuals[index].scene);
    renderVisual();
  }

  function showStage(index) {
    stageIndex = Math.max(0, Math.min(stages.length - 1, index));
    const stage = stages[stageIndex];
    for (const tab of tabs.querySelectorAll('[data-br-stage]')) {
      const selected = Number(tab.dataset.brStage) === stageIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', 'br-stage-' + stageIndex);
    panel.innerHTML = `<div class="br-layout">
      <div class="br-media" data-br-media></div>
      <div class="br-copy">
        <h3>${e(stage.title)}</h3>
        ${stage.lead ? `<p class="br-lead">${e(stage.lead)}</p>` : ''}
        ${stage.facts?.length ? `<dl class="br-facts">${stage.facts.map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>` : ''}
        ${stage.points?.length ? `<ul class="br-points">${stage.points.map(point => `<li>${e(point)}</li>`).join('')}</ul>` : ''}
      </div>
    </div>`;
    root.querySelector('[data-br-page]').textContent = brNumber(stageIndex) + ' / ' + String(stages.length).padStart(2, '0');
    root.querySelector('[data-br-move="-1"]').disabled = stageIndex === 0;
    root.querySelector('[data-br-move="1"]').disabled = stageIndex === stages.length - 1;
    chooseVisual(0);
  }

  function onClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-br-stage')) showStage(Number(button.dataset.brStage));
    if (button.hasAttribute('data-br-move')) showStage(stageIndex + Number(button.dataset.brMove));
    if (button.hasAttribute('data-br-visual')) {
      chooseVisual(Number(button.dataset.brVisual));
      panel.querySelector('[data-br-visual="' + visualIndex + '"]')?.focus({ preventScroll: true });
    }
    if (button.hasAttribute('data-br-model-mode')) {
      modelMode = !modelMode;
      renderVisual();
      panel.querySelector('[data-br-model-mode]')?.focus({ preventScroll: true });
    }
    if (button.hasAttribute('data-br-zoom')) {
      const image = button.querySelector('img');
      const fullImage = dialog.querySelector('img');
      fullImage.src = image.src;
      fullImage.alt = image.alt;
      const caption = dialog.querySelector('p');
      const view = stages[stageIndex].visuals[visualIndex];
      caption.textContent = view.caption?.trim() === view.label?.trim() ? '' : view.caption || '';
      caption.hidden = !caption.textContent;
      opener = button;
      dialog.showModal();
    }
    if (button.hasAttribute('data-br-close')) dialog.close();
    if (button === full) {
      const change = document.fullscreenElement === root ? document.exitFullscreen() : root.requestFullscreen();
      change.catch(() => {});
    }
  }

  function onKey(event) {
    if (!event.target.closest('[data-br-stage]')) return;
    const next = {
      ArrowLeft: (stageIndex + stages.length - 1) % stages.length,
      ArrowRight: (stageIndex + 1) % stages.length,
      Home: 0,
      End: stages.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    showStage(next);
    tabs.querySelector('[aria-selected="true"]').focus();
  }

  const fullscreenLabel = () => {
    full.textContent = document.fullscreenElement === root ? '退出全屏' : '全屏讲解';
  };
  dialog.addEventListener('close', () => {
    dialog.querySelector('img').removeAttribute('src');
    opener?.focus({ preventScroll: true });
  });
  root.addEventListener('click', onClick);
  tabs.addEventListener('keydown', onKey);
  document.addEventListener('fullscreenchange', fullscreenLabel);
  showStage(0);
  return () => {
    stopVisual();
    root.removeEventListener('click', onClick);
    tabs.removeEventListener('keydown', onKey);
    document.removeEventListener('fullscreenchange', fullscreenLabel);
  };
}
