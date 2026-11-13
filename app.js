(() => {
  'use strict';

  const terms = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];
  const seasons = ['春', '夏', '秋', '冬'];
  const viewport = document.querySelector('#scrollViewport');
  const world = document.querySelector('#scrollWorld');
  const range = document.querySelector('#positionRange');
  const drawer = document.querySelector('#termsDrawer');
  const drawerToggle = document.querySelector('#termsToggle');
  const termList = document.querySelector('#termsList');
  const seasonButtons = [...document.querySelectorAll('.season-nav [data-season]')];
  const panels = [...document.querySelectorAll('.scene-panel')];
  const scenes = panels.map(panel => ({ panel, name: panel.dataset.title, season: Number(panel.dataset.season), start: 0, width: 0 }));
  const overview = document.querySelector('#scrollOverview');
  const overviewToggle = document.querySelector('#overviewToggle');
  const overviewScenes = document.querySelector('#overviewScenes');
  const overviewWindow = document.querySelector('#overviewWindow');
  const previousButton = document.querySelector('#previousView');
  const nextButton = document.querySelector('#nextView');
  const fullscreenButton = document.querySelector('#fullscreenToggle');
  const currentTerm = document.querySelector('#currentTerm');
  const termCaption = document.querySelector('#termCaption');
  const seasonCaption = document.querySelector('#seasonCaption');
  const sceneCaption = document.querySelector('#sceneCaption');
  const currentScene = document.querySelector('#currentScene');
  const scenePosition = document.querySelector('#scenePosition');
  const scaleLabels = [...document.querySelectorAll('.season-scale span')];
  const help = document.querySelector('#scrollHelp');
  const status = document.querySelector('#viewStatus');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dialSeasons = document.querySelector('#dialSeasons');
  const dialTerms = document.querySelector('#dialTerms');
  const dialNeedle = document.querySelector('#dialNeedle');
  const dialCurrentTerm = document.querySelector('#dialCurrentTerm');
  const dialCurrentSeason = document.querySelector('#dialCurrentSeason');
  const dialDock = document.querySelector('#dialDock');
  const dialPanel = document.querySelector('#dialPanel');
  const dialToggle = document.querySelector('#dialToggle');
  const dialToggleTerm = document.querySelector('#dialToggleTerm');
  const dialClose = document.querySelector('#dialClose');
  const miniDialNeedle = document.querySelector('#miniDialNeedle');
  let maxScroll = 0;
  let progress = 0;
  let currentIndex = -1;
  let currentSceneIndex = -1;
  let worldWidth = 1;
  let readingInset = 0;
  let readableWidth = 1;
  let sceneBoundaries = [];
  let drag = null;
  let updateFrame = 0;
  let announceTimer = 0;

  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const motionBehavior = () => reduceMotion.matches ? 'auto' : 'smooth';
  const dismissHelp = () => help.classList.add('is-dismissed');

  const svgNamespace = 'http://www.w3.org/2000/svg';
  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  // The dial follows the same scene-navigation index as the scroll. Its
  // equally spaced marks are navigation positions, not calculated solar dates.
  function dialPoint(angle, radius) {
    const radians = angle * Math.PI / 180;
    return [180 + Math.sin(radians) * radius, 180 - Math.cos(radians) * radius];
  }

  function dialArc(startAngle, endAngle, innerRadius, outerRadius) {
    const outerStart = dialPoint(startAngle, outerRadius);
    const outerEnd = dialPoint(endAngle, outerRadius);
    const innerEnd = dialPoint(endAngle, innerRadius);
    const innerStart = dialPoint(startAngle, innerRadius);
    return `M${outerStart.join(',')} A${outerRadius},${outerRadius} 0 0 1 ${outerEnd.join(',')} L${innerEnd.join(',')} A${innerRadius},${innerRadius} 0 0 0 ${innerStart.join(',')} Z`;
  }

  const seasonActions = ['生', '长', '收', '藏'];
  const seasonColors = ['#73866c', '#6b8982', '#aa8351', '#7d8793'];
  const dialSeasonMarks = seasons.map((name, index) => {
    const start = index * 90 - 7.5;
    const arc = svgElement('path', { class: 'dial-sector', d: dialArc(start, start + 90, 126, 138) });
    arc.style.setProperty('--season-color', seasonColors[index]);
    const [x, y] = dialPoint(start + 45, 96);
    const label = svgElement('text', { class: 'dial-season-label', x, y, 'dominant-baseline': 'middle' });
    label.textContent = name;
    dialSeasons.append(arc, label);
    return { arc, label };
  });

  const dialButtons = terms.map((name, index) => {
    const angle = index * 15;
    const button = svgElement('g', {
      class: 'dial-term', role: 'button', tabindex: '0',
      'aria-label': `${name}，${seasons[Math.floor(index / 6)]}季，定位画卷`
    });
    const title = svgElement('title');
    title.textContent = `前往${name}`;
    const hitArea = svgElement('path', { class: 'dial-hit', d: dialArc(angle - 7.2, angle + 7.2, 139, 173) });
    const inner = dialPoint(angle, index % 6 === 0 ? 139 : 142);
    const outer = dialPoint(angle, 148);
    const tick = svgElement('line', {
      class: 'dial-tick', x1: inner[0], y1: inner[1], x2: outer[0], y2: outer[1]
    });
    const [x, y] = dialPoint(angle, 160);
    const label = svgElement('text', { class: 'dial-term-label', x, y, 'dominant-baseline': 'middle' });
    label.textContent = name;
    button.append(title, hitArea, tick, label);
    button.addEventListener('click', () => selectDialTerm(index));
    button.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectDialTerm(index);
        return;
      }
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (step || event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? terms.length - 1 : (index + step + terms.length) % terms.length;
        dialButtons[nextIndex].focus({ preventScroll: true });
      }
    });
    dialTerms.append(button);
    return button;
  });

  const overviewButtons = scenes.map((scene, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'overview-scene';
    button.dataset.state = 'loading';
    button.setAttribute('aria-label', `前往${seasons[scene.season]}卷，${scene.name}`);
    const image = document.createElement('img');
    image.src = scene.panel.querySelector('img').getAttribute('src');
    image.alt = '';
    image.draggable = false;
    const label = document.createElement('span');
    label.textContent = scene.name;
    label.dataset.short = ['田园', '溪桥', '荷塘', '长街', '晒场', '梯田', '庭院', '古渡'][index];
    button.append(image, label);
    button.addEventListener('click', () => goToScene(index));
    overviewScenes.append(button);
    return button;
  });

  const termButtons = terms.map((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.dataset.term = String(index);
    button.addEventListener('click', () => {
      goToTerm(index);
      setDrawer(false);
      drawerToggle.focus({ preventScroll: true });
    });
    termList.append(button);
    return button;
  });

  function announce(message) {
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => { status.textContent = message; }, 220);
  }

  function updatePosition() {
    updateFrame = 0;
    progress = maxScroll > 0 ? clamp(viewport.scrollLeft / maxScroll, 0, 1) : 0;
    // A reading point stays inside the visible viewport. It moves from the
    // left side at the start to the right side at the end, so both end scenes
    // remain navigable even when a short window shows several panels at once.
    // Scene/term boundaries come from actual panel offsets, including overlap.
    const readingX = readingInset + progress * readableWidth;
    let sceneIndex = sceneBoundaries.findIndex((end, boundaryIndex) => boundaryIndex > 0 && readingX < end) - 1;
    if (sceneIndex < 0) sceneIndex = scenes.length - 1;
    const sceneStart = sceneBoundaries[sceneIndex] || 0;
    const sceneEnd = sceneBoundaries[sceneIndex + 1] || worldWidth;
    const localPosition = clamp((readingX - sceneStart) / Math.max(1, sceneEnd - sceneStart), 0, .999999);
    const index = sceneIndex * 3 + Math.floor(localPosition * 3);
    const seasonIndex = scenes[sceneIndex].season;
    const value = Math.round(progress * 1000);
    range.value = String(value);
    range.style.setProperty('--position', `${progress * 100}%`);
    range.setAttribute('aria-valuetext', `${seasons[seasonIndex]}卷，${scenes[sceneIndex].name}，${terms[index]}`);
    previousButton.disabled = progress <= .0005;
    nextButton.disabled = progress >= .9995;
    overviewWindow.style.left = `${viewport.scrollLeft / worldWidth * 100}%`;
    overviewWindow.style.width = `${Math.min(1, viewport.clientWidth / worldWidth) * 100}%`;
    if (index === currentIndex && sceneIndex === currentSceneIndex) return;
    currentIndex = index;
    currentSceneIndex = sceneIndex;
    currentTerm.textContent = terms[index];
    termCaption.textContent = terms[index];
    seasonCaption.textContent = seasons[seasonIndex];
    dialCurrentTerm.textContent = terms[index];
    dialCurrentSeason.textContent = `${seasons[seasonIndex]} · ${seasonActions[seasonIndex]}`;
    dialNeedle.style.setProperty('--dial-angle', `${index * 15}deg`);
    miniDialNeedle.style.setProperty('--dial-angle', `${index * 15}deg`);
    dialToggleTerm.textContent = terms[index];
    dialToggle.setAttribute('aria-label', `当前${seasons[seasonIndex]}季${terms[index]}，${dialPanel.hidden ? '展开' : '收起'}节气圆盘`);
    dialButtons.forEach((button, itemIndex) => {
      const selected = itemIndex === index;
      button.classList.toggle('is-current', selected);
      if (selected) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
    dialSeasonMarks.forEach((mark, itemIndex) => {
      mark.arc.classList.toggle('is-current', itemIndex === seasonIndex);
      mark.label.classList.toggle('is-current', itemIndex === seasonIndex);
    });
    sceneCaption.textContent = scenes[sceneIndex].name;
    currentScene.textContent = scenes[sceneIndex].name;
    scenePosition.textContent = `${sceneIndex + 1} / ${scenes.length} 景`;
    overviewButtons.forEach((button, itemIndex) => {
      const selected = itemIndex === sceneIndex;
      button.classList.toggle('is-current', selected);
      if (selected) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
    seasonButtons.forEach((button, itemIndex) => {
      const selected = itemIndex === seasonIndex;
      button.classList.toggle('is-current', selected);
      if (selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    termButtons.forEach((button, itemIndex) => {
      const selected = itemIndex === index;
      button.classList.toggle('is-current', selected);
      if (selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    announce(`行至${seasons[seasonIndex]}卷，${scenes[sceneIndex].name}，${terms[index]}。`);
  }

  function schedulePosition() {
    if (!updateFrame) updateFrame = requestAnimationFrame(updatePosition);
  }

  function measure() {
    const oldProgress = progress;
    maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    worldWidth = Math.max(1, world.scrollWidth);
    scenes.forEach((scene, index) => {
      scene.start = scene.panel.offsetLeft;
      scene.width = scene.panel.offsetWidth;
      overviewButtons[index].style.left = `${scene.start / worldWidth * 100}%`;
      overviewButtons[index].style.width = `${scene.width / worldWidth * 100}%`;
    });
    // Each transition is assigned at the middle of its real overlap.
    sceneBoundaries = [0];
    for (let index = 1; index < scenes.length; index += 1) {
      const previous = scenes[index - 1];
      const next = scenes[index];
      sceneBoundaries.push((previous.start + previous.width + next.start) / 2);
    }
    sceneBoundaries.push(worldWidth);
    readingInset = Math.min(viewport.clientWidth / 2, scenes[0].width * .3);
    readableWidth = Math.max(1, worldWidth - readingInset * 2);
    scaleLabels.forEach((label, index) => {
      const position = scrollForWorldPoint(sceneBoundaries[index * 2]);
      label.style.left = `${maxScroll > 0 ? position / maxScroll * 100 : 0}%`;
    });
    viewport.scrollLeft = oldProgress * maxScroll;
    updatePosition();
  }

  function scrollForWorldPoint(x) {
    return clamp((x - readingInset) / readableWidth, 0, 1) * maxScroll;
  }

  function goToTerm(index) {
    dismissHelp();
    stopDrag();
    const termIndex = clamp(index, 0, terms.length - 1);
    const sceneIndex = Math.floor(termIndex / 3);
    const start = sceneBoundaries[sceneIndex];
    const end = sceneBoundaries[sceneIndex + 1];
    const target = scrollForWorldPoint(start + (end - start) * ((termIndex % 3 + .5) / 3));
    viewport.scrollTo({ left: target, behavior: motionBehavior() });
  }

  function goToScene(index) {
    if (index === 0) {
      stopDrag();
      dismissHelp();
      viewport.scrollTo({ left: 0, behavior: motionBehavior() });
    } else goToTerm(clamp(index, 0, scenes.length - 1) * 3);
  }

  function moveView(direction) {
    dismissHelp();
    viewport.scrollBy({ left: direction * Math.max(140, viewport.clientWidth * .7), behavior: motionBehavior() });
  }

  function setDialOpen(open, restoreFocus = false) {
    dialPanel.hidden = !open;
    dialToggle.setAttribute('aria-expanded', String(open));
    const termIndex = Math.max(0, currentIndex);
    const seasonIndex = Math.floor(termIndex / 6);
    dialToggle.setAttribute('aria-label', `当前${seasons[seasonIndex]}季${terms[termIndex]}，${open ? '收起' : '展开'}节气圆盘`);
    dialToggle.title = open ? '收起节气圆盘' : '展开节气圆盘';
    if (open) {
      setDrawer(false);
      dialButtons[termIndex].focus({ preventScroll: true });
    } else if (restoreFocus) dialToggle.focus({ preventScroll: true });
  }

  function selectDialTerm(index) {
    goToTerm(index);
    setDialOpen(false, true);
  }

  function setDrawer(open) {
    drawer.hidden = !open;
    drawerToggle.setAttribute('aria-expanded', String(open));
    drawerToggle.querySelector('span').textContent = open ? '－' : '＋';
    if (open) {
      setDialOpen(false);
      termButtons[Math.max(0, currentIndex)].focus({ preventScroll: true });
    }
  }

  function stopDrag() {
    if (!drag) return;
    const pointerId = drag.pointerId;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
  }

  viewport.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    if (!event.isPrimary) { stopDrag(); return; }
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopDrag();
    // Stop an in-flight smooth scroll before anchoring the new drag.
    viewport.scrollTo({ left: viewport.scrollLeft, behavior: 'instant' });
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: viewport.scrollLeft, active: false };
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active && Math.abs(dx) > 5 && Math.abs(dx) >= Math.abs(dy)) {
      drag.active = true;
      viewport.classList.add('is-dragging');
      dismissHelp();
    }
    if (!drag.active) return;
    if (event.cancelable) event.preventDefault();
    viewport.scrollLeft = clamp(drag.scrollLeft - dx, 0, maxScroll);
  }, { passive: false });

  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);
  viewport.addEventListener('lostpointercapture', stopDrag);
  window.addEventListener('blur', stopDrag);

  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || !maxScroll) return;
    const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? viewport.clientWidth : 1;
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * multiplier;
    const target = clamp(viewport.scrollLeft + delta, 0, maxScroll);
    if (target === viewport.scrollLeft) return;
    event.preventDefault();
    dismissHelp();
    viewport.scrollLeft = target;
  }, { passive: false });

  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveView(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      dismissHelp();
      stopDrag();
      viewport.scrollTo({ left: event.key === 'Home' ? 0 : maxScroll, behavior: motionBehavior() });
    }
  });

  viewport.addEventListener('scroll', schedulePosition, { passive: true });
  range.addEventListener('input', () => {
    stopDrag();
    dismissHelp();
    viewport.scrollTo({ left: Number(range.value) / 1000 * maxScroll, behavior: 'instant' });
    updatePosition();
  });
  seasonButtons.forEach((button, index) => button.addEventListener('click', () => goToScene(index * 2)));
  dialToggle.addEventListener('click', () => setDialOpen(dialPanel.hidden, !dialPanel.hidden));
  dialClose.addEventListener('click', () => setDialOpen(false, true));
  overviewToggle.addEventListener('click', () => {
    const open = overview.hidden;
    overview.hidden = !open;
    overviewToggle.setAttribute('aria-expanded', String(open));
    overviewToggle.querySelector('.toggle-mark').textContent = open ? '－' : '＋';
    document.documentElement.classList.toggle('overview-collapsed', !open);
  });
  previousButton.addEventListener('click', () => moveView(-1));
  nextButton.addEventListener('click', () => moveView(1));
  drawerToggle.addEventListener('click', () => setDrawer(drawer.hidden));
  document.querySelector('#termsClose').addEventListener('click', () => {
    setDrawer(false);
    drawerToggle.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialPanel.hidden) {
      setDialOpen(false, true);
    } else if (event.key === 'Escape' && !drawer.hidden) {
      setDrawer(false);
      drawerToggle.focus({ preventScroll: true });
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!dialPanel.hidden && !dialDock.contains(event.target)) setDialOpen(false);
    if (!drawer.hidden && !drawer.contains(event.target) && !drawerToggle.contains(event.target)) setDrawer(false);
  });

  document.addEventListener('study:open', () => {
    stopDrag();
    setDialOpen(false);
    setDrawer(false);
  });

  if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
    fullscreenButton.hidden = false;
    fullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        announce('当前浏览器未能进入全屏，可继续浏览画卷。');
      }
    });
    document.addEventListener('fullscreenchange', () => {
      const active = Boolean(document.fullscreenElement);
      document.documentElement.classList.toggle('is-immersive', active);
      setDialOpen(false);
      setDrawer(false);
      fullscreenButton.setAttribute('aria-label', active ? '退出全屏' : '全屏欣赏');
      fullscreenButton.title = active ? '退出全屏' : '全屏欣赏';
      if (active) viewport.focus({ preventScroll: true });
      else fullscreenButton.focus({ preventScroll: true });
    });
  }

  panels.forEach((panel, index) => {
    const image = panel.querySelector('img');
    const label = panel.querySelector('.panel-state > span');
    const retry = panel.querySelector('.retry-button');
    let attempt = 0;
    function applyState(loaded) {
      panel.dataset.state = loaded ? 'loaded' : 'error';
      overviewButtons[index].dataset.state = loaded ? 'loaded' : 'error';
      retry.hidden = loaded;
      if (!loaded) label.textContent = `${scenes[index].name}尚未载入`;
      if (index === 0) viewport.setAttribute('aria-busy', 'false');
      if (!loaded) announce(`${scenes[index].name}加载失败，可以点击重新载入。`);
    }
    image.addEventListener('load', () => applyState(true));
    image.addEventListener('error', () => applyState(false));
    retry.addEventListener('click', event => {
      event.stopPropagation();
      panel.dataset.state = 'loading';
      retry.hidden = true;
      label.textContent = `${scenes[index].name}正在展开`;
      if (index === 0) viewport.setAttribute('aria-busy', 'true');
      const source = new URL(image.getAttribute('src'), window.location.href);
      source.searchParams.set('retry', String(++attempt));
      image.src = source.href;
      overviewButtons[index].querySelector('img').src = source.href;
    });
    if (image.complete) applyState(image.naturalWidth > 0);
  });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(world);
  } else window.addEventListener('resize', measure);
  window.addEventListener('pagehide', () => {
    stopDrag();
    window.clearTimeout(announceTimer);
    if (updateFrame) cancelAnimationFrame(updateFrame);
  });
  measure();
})();
