(() => {
  'use strict';

  const panel = document.querySelector('.scene-panel[data-panel="0"]');
  const viewport = document.querySelector('#scrollViewport');
  const toggle = document.querySelector('#motionToggle');
  const label = document.querySelector('#motionToggleLabel');
  const frame = document.querySelector('.painting-frame');
  const help = document.querySelector('#scrollHelp');
  const status = document.querySelector('#viewStatus');
  if (!panel || !toggle) return;

  const ns = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bank = [[0,622],[120,614],[260,620],[380,643],[500,630],[620,636],[800,648],[980,635],[1150,623],[1350,636],[1530,623],[1620,608],[1760,623],[1900,613],[2050,594],[2172,578]];
  let choice = null;
  let playing = false;
  let press = null;
  const rippleTimers = new Set();
  const creatures = [];

  function element(name, attributes = {}) {
    const node = document.createElementNS(ns, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function animate(node, attributes, transform = false) {
    const animation = element(transform ? 'animateTransform' : 'animate', { repeatCount: 'indefinite', ...attributes });
    node.append(animation);
    return animation;
  }

  const svg = element('svg', { class: 'scene-motion', viewBox: '0 0 2172 724', preserveAspectRatio: 'none', role: 'group', 'aria-label': '春卷动景，可点击麻雀或水鸭互动', focusable: 'false', 'data-motion-state': 'paused' });
  if (typeof svg.pauseAnimations !== 'function') return;
  const defs = element('defs', { 'aria-hidden': 'true' });
  const filter = element('filter', { id: 'spring-live-field', x: 0, y: 560, width: 2172, height: 164, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
  const neutral = element('feFlood', { 'flood-color': 'rgb(50%,50%,50%)', result: 'still-field' });
  const waterMask = element('feImage', { href: 'assets/motion/spring-water-mask.svg', x: 0, y: 0, width: 2172, height: 724, preserveAspectRatio: 'none', result: 'water-mask' });
  const noise = element('feTurbulence', { type: 'fractalNoise', baseFrequency: '.009 .11', numOctaves: '1', seed: '12', stitchTiles: 'stitch', result: 'water-noise' });
  animate(noise, { attributeName: 'baseFrequency', values: '.009 .11;.011 .135;.009 .11', dur: '13s' });
  const water = element('feColorMatrix', { in: 'water-noise', type: 'matrix', values: '.16 0 0 0 .42  0 .75 0 0 .125  0 0 1 0 0  0 0 0 1 0', result: 'water-color' });
  const maskedWater = element('feComposite', { in: 'water-color', in2: 'water-mask', operator: 'in', result: 'water-field' });
  const merged = element('feMerge', { result: 'live-field' });
  ['still-field', 'water-field'].forEach(name => merged.append(element('feMergeNode', { in: name })));
  const displaced = element('feDisplacementMap', { in: 'SourceGraphic', in2: 'live-field', scale: '14', xChannelSelector: 'R', yChannelSelector: 'G' });
  filter.append(neutral, waterMask, noise, water, maskedWater, merged, displaced);
  const waterClip = element('clipPath', { id: 'spring-river-clip', clipPathUnits: 'userSpaceOnUse' });
  waterClip.append(element('path', { d: `M${bank.map(point => point.join(' ')).join(' ')}V724H0Z`, fill: 'white', stroke: 'none' }));
  defs.append(filter, waterClip);
  // Only the river is redrawn. Trees, architecture and land remain the original static image.
  const painting = element('image', { href: 'assets/scroll/spring.png', width: 2172, height: 724, preserveAspectRatio: 'none', filter: 'url(#spring-live-field)', 'clip-path': 'url(#spring-river-clip)', 'aria-hidden': 'true' });
  const river = element('g', { 'clip-path': 'url(#spring-river-clip)', 'aria-hidden': 'true' });
  const glints = [[120,675,62],[345,700,45],[585,663,52],[855,693,70],[1115,666,48],[1380,705,64],[1615,656,55],[1885,687,72],[2060,634,40]];
  glints.forEach(([x,y,width], index) => {
    const group = element('g', { opacity: 0 });
    group.append(element('path', { class: 'motion-glint', d: `M${x} ${y}q${width/2} -2 ${width} 0m${-width*.7} 6h${width*.45}` }));
    group.append(element('path', { class: 'motion-glint motion-glint-ink', d: `M${x+8} ${y+3}h${width*.4}` }));
    const begin = `${-index * .8}s`;
    animate(group, { attributeName: 'opacity', values: '0;.36;.28;0', keyTimes: '0;.2;.7;1', dur: '7.2s', begin });
    animate(group, { attributeName: 'transform', type: 'translate', values: '-15 0;30 1.5', dur: '7.2s', begin }, true);
    river.append(group);
  });
  const ripples = element('g');
  river.append(ripples);
  const wildlife = element('g', { class: 'motion-wildlife' });
  const swimArea = element('g', { 'clip-path': 'url(#spring-river-clip)' });
  wildlife.append(swimArea);

  function sprite(kind, width, height) {
    const id = `spring-${kind}-window-${creatures.length}`;
    const clip = element('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
    clip.append(element('rect', { width, height }));
    defs.append(clip);
    const anchor = element('g', { transform: `translate(${-width * (kind === 'sparrow' ? .58 : .5)} ${-height * (kind === 'sparrow' ? .735 : .715)})`, 'aria-hidden': 'true' });
    const window = element('g', { 'clip-path': `url(#${id})` });
    const image = element('image', { class: 'motion-bird-art', href: `assets/motion/spring-${kind}-frames-v1.png`, width: width * 2, height, preserveAspectRatio: 'none', x: 0, y: 0 });
    window.append(image); anchor.append(window);
    return { anchor, image };
  }

  function interactiveBird(kind, label, x, y, width, height) {
    const anchor = element('g', { transform: `translate(${x} ${y})` });
    const mover = element('g');
    const bird = element('g', { class: `motion-creature motion-${kind}`, role: 'button', tabindex: '0', focusable: 'true', 'data-motion-bird': kind, 'aria-label': label, 'aria-disabled': 'true' });
    const title = element('title'); title.textContent = label;
    const hit = element('rect', { class: 'motion-hit', x: -Math.max(24, width * .52), y: -Math.max(33, height * .75), width: Math.max(48, width * 1.04), height: Math.max(40, height * .87), rx: 5, fill: 'transparent', 'aria-hidden': 'true' });
    bird.append(title, hit);
    mover.append(bird); anchor.append(mover);
    // A press on a creature belongs to it, not to the scroll's drag gesture.
    for (const name of ['pointerdown', 'pointerup']) bird.addEventListener(name, event => { event.stopPropagation(); press = null; });
    function activate(event) {
      event.preventDefault(); event.stopPropagation();
      if (!playing) {
        if (status) status.textContent = '动景已暂停，开启后可与小鸟互动。';
        return;
      }
      bird.querySelectorAll('[data-reaction]').forEach(animation => animation.beginElement());
      if (kind === 'duck') {
        const transform = bird.getScreenCTM();
        if (transform) {
          const current = new DOMPoint(0, 0).matrixTransform(transform);
          const location = point(current.x, current.y);
          addRipple({ x: location.x, y: location.y + 2 });
        }
      }
      if (status) status.textContent = kind === 'duck' ? '水鸭划开两圈涟漪。' : '墙头麻雀轻跳了一下。';
    }
    bird.addEventListener('click', activate);
    bird.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') activate(event); });
    creatures.push(bird);
    return { anchor, mover, bird };
  }

  // Short hops stay on the back-wall coping. A separate shadow stays on the
  // wall while the sparrow rises; no part of the painted tree is displaced.
  const sparrow = interactiveBird('sparrow', '墙头麻雀，点击看它轻跳', 1690, 325, 34, 34);
  const sparrowDuration = '26s', sparrowBegin = '-8s';
  const hopTimes = '0;.18;.22;.26;.65;.69;.73;1';
  animate(sparrow.mover, { attributeName: 'transform', type: 'translate', values: '0 0;0 0;7 -5;14 0;14 0;7 -5;0 0;0 0', keyTimes: hopTimes, dur: sparrowDuration, begin: sparrowBegin }, true);
  const sparrowFacing = element('g');
  animate(sparrowFacing, { attributeName: 'transform', type: 'scale', values: '1 1;-1 1;1 1', keyTimes: '0;.55;1', calcMode: 'discrete', dur: sparrowDuration, begin: sparrowBegin }, true);
  const sparrowReaction = element('g');
  sparrowReaction.append(element('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;0 -8;0 0', keyTimes: '0;.4;1', dur: '.85s', begin: 'indefinite', 'data-reaction': 'hop' }));
  const sparrowArt = sprite('sparrow', 34, 34);
  animate(sparrowArt.image, { attributeName: 'x', values: '0;-34;0;0;-34;0;0', keyTimes: '0;.18;.26;.65;.69;.73;1', calcMode: 'discrete', dur: sparrowDuration, begin: sparrowBegin });
  sparrowArt.image.append(element('animate', { attributeName: 'x', values: '0;-34;0;0', keyTimes: '0;.15;.8;1', calcMode: 'discrete', dur: '.85s', begin: 'indefinite', 'data-reaction': 'wings' }));
  sparrowReaction.append(sparrowArt.anchor); sparrowFacing.append(sparrowReaction); sparrow.bird.append(sparrowFacing);
  const perchShadow = element('g', { transform: 'translate(1690 325)', 'aria-hidden': 'true' });
  const shadowMover = element('g');
  shadowMover.append(element('ellipse', { cx: 0, cy: 1, rx: 5, ry: .8, fill: '#6f5c3c', opacity: .15 }));
  animate(shadowMover, { attributeName: 'transform', type: 'translate', values: '0 0;0 0;7 0;14 0;14 0;7 0;0 0;0 0', keyTimes: hopTimes, dur: sparrowDuration, begin: sparrowBegin }, true);
  perchShadow.append(shadowMover); wildlife.append(perchShadow, sparrow.anchor);

  function duck(x, y, size, begin) {
    const width = 60 * size, height = 48 * size;
    const item = interactiveBird('duck', x > 1000 ? '院前水鸭，点击泛起水纹' : '田边水鸭，点击泛起水纹', x, y, width, height);
    const duration = '38s';
    animate(item.mover, { attributeName: 'transform', type: 'translate', values: '0 0;85 -1;0 0', keyTimes: '0;.5;1', calcMode: 'spline', keySplines: '.4 0 .6 1;.4 0 .6 1', dur: duration, begin }, true);
    const facing = element('g');
    animate(facing, { attributeName: 'transform', type: 'scale', values: '1 1;-1 1;1 1', keyTimes: '0;.5;1', calcMode: 'discrete', dur: duration, begin }, true);
    const wake = element('g', { class: 'motion-duck-wake', 'aria-hidden': 'true' });
    wake.append(element('path', { d: `M${-width*.34} 1q${-width*.28} -3 ${-width*.56} 0m${width*.55} 3q${-width*.3} 2 ${-width*.54} 0` }));
    animate(wake, { attributeName: 'opacity', values: '.2;.6;.2', dur: '4s', begin });
    const bob = element('g');
    animate(bob, { attributeName: 'transform', type: 'translate', values: '0 0;0 -.6;0 0', dur: '5s', begin }, true);
    const art = sprite('duck', width, height);
    animate(art.image, { attributeName: 'x', values: `0;${-width};0`, keyTimes: '0;.46;1', calcMode: 'discrete', dur: '13s', begin });
    art.image.append(element('animate', { attributeName: 'x', values: `0;${-width};0;0`, keyTimes: '0;.12;.85;1', calcMode: 'discrete', dur: '1.1s', begin: 'indefinite', 'data-reaction': 'nod' }));
    bob.append(art.anchor); facing.append(wake, bob); item.bird.append(facing); swimArea.append(item.anchor);
  }
  duck(1495, 650, 1, '-6s');
  duck(540, 656, .84, '-19s');

  svg.append(defs, painting, river, wildlife);
  panel.insertBefore(svg, panel.querySelector('.study-entry'));
  svg.pauseAnimations();
  const scenes = [
    { panel, svg, ripples, onWater },
    ...[...document.querySelectorAll('.scene-panel')]
      .filter(item => item !== panel)
      .map(item => window.ScrollWaterMotion?.create(item, { element, animate }))
      .filter(Boolean)
  ];
  scenes.forEach(scene => {
    scene.life = window.ScrollSeasonLife?.decorate(scene, {
      element, animate,
      cancelPress() { press = null; },
      ripple(node) {
        const matrix = node.getScreenCTM();
        if (!matrix) return;
        const current = new DOMPoint(0, 0).matrixTransform(matrix);
        const location = point(current.x, current.y, scene.panel);
        if (scene.onWater(location)) addRipple(location, scene);
      }
    });
  });

  function removeRipples() {
    rippleTimers.forEach(timer => window.clearTimeout(timer));
    rippleTimers.clear();
    scenes.forEach(scene => scene.ripples.replaceChildren());
  }
  function sync() {
    const enabled = choice === null ? !reduced.matches : choice;
    const studying = document.documentElement.classList.contains('is-studying');
    let anyVisible = false;
    let stopped = false;
    scenes.forEach(scene => {
      const visible = scene.inView && scene.panel.dataset.state === 'loaded';
      const nextPlaying = enabled && visible && !studying && document.visibilityState !== 'hidden';
      anyVisible ||= visible;
      scene.life?.update(nextPlaying, visible);
      scene.svg.classList.toggle('is-ready', visible);
      scene.svg.dataset.motionState = nextPlaying ? 'playing' : studying ? 'study' : !visible ? 'offscreen' : document.visibilityState === 'hidden' ? 'background' : 'paused';
      if (scene.playing === nextPlaying) return;
      stopped ||= scene.playing && !nextPlaying;
      scene.playing = nextPlaying;
      scene.svg.classList.toggle('is-playing', nextPlaying);
      if (nextPlaying) scene.svg.unpauseAnimations();
      else scene.svg.pauseAnimations();
    });
    playing = scenes[0].playing;
    if (stopped) { removeRipples(); press = null; }
    toggle.hidden = !anyVisible;
    frame.classList.toggle('has-motion', anyVisible);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? '暂停画卷动景' : '播放画卷动景');
    toggle.title = enabled ? '暂停流水、炊烟、虫鸟、落叶与细雪' : '播放四季动景；冬季冰面保持静止';
    label.textContent = enabled ? '动景已启' : '动景已停';
    creatures.forEach(creature => creature.setAttribute('aria-disabled', String(!playing)));
  }
  function point(clientX, clientY, targetPanel = panel) {
    const bounds = targetPanel.getBoundingClientRect();
    return { x: (clientX - bounds.left) / bounds.width * 2172, y: (clientY - bounds.top) / bounds.height * 724 };
  }
  function onWater(location) {
    if (location.x < 0 || location.x > 2172 || location.y > 724) return false;
    const right = bank.findIndex(([x]) => x >= location.x);
    const a = bank[Math.max(0, right - 1)];
    const b = bank[Math.max(0, right)];
    const shore = a[1] + (b[1] - a[1]) * (location.x - a[0]) / (b[0] - a[0] || 1);
    return location.y > shore + 4;
  }
  function addRipple(location, scene = scenes[0]) {
    const group = element('g');
    for (let index = 0; index < 2; index += 1) {
      const ring = element('ellipse', { class: 'motion-ripple', cx: location.x, cy: location.y, rx: 5, ry: 1.5, opacity: 0 });
      const duration = `${2.2 + index * .4}s`;
      ring.append(element('animate', { attributeName: 'rx', from: 5 + index * 4, to: 65 + index * 16, dur: duration, begin: 'indefinite', fill: 'freeze' }));
      ring.append(element('animate', { attributeName: 'ry', from: 1.5, to: 10 + index * 3, dur: duration, begin: 'indefinite', fill: 'freeze' }));
      ring.append(element('animate', { attributeName: 'opacity', values: '0;.6;0', keyTimes: '0;.12;1', dur: duration, begin: 'indefinite', fill: 'freeze' }));
      group.append(ring);
    }
    while (scene.ripples.childElementCount >= 4) scene.ripples.firstElementChild.remove();
    scene.ripples.append(group);
    group.querySelectorAll('animate').forEach(animation => animation.beginElement());
    const timer = window.setTimeout(() => { group.remove(); rippleTimers.delete(timer); }, 2800);
    rippleTimers.add(timer);
  }

  toggle.addEventListener('click', () => { choice = !(choice === null ? !reduced.matches : choice); sync(); });
  viewport.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button')) return;
    const scene = [...scenes].reverse().find(item => item.playing && item.onWater(point(event.clientX, event.clientY, item.panel)));
    if (scene) press = { scene, id: event.pointerId, x: event.clientX, y: event.clientY, scroll: viewport.scrollLeft };
  });
  viewport.addEventListener('pointerup', event => {
    if (!press || press.id !== event.pointerId) return;
    const start = press;
    press = null;
    if (!start.scene.playing || Math.hypot(event.clientX-start.x, event.clientY-start.y) > 6 || Math.abs(viewport.scrollLeft-start.scroll) > 3) return;
    const location = point(event.clientX, event.clientY, start.scene.panel);
    if (start.scene.onWater(location)) addRipple(location, start.scene);
  });
  viewport.addEventListener('pointercancel', () => { press = null; });
  window.addEventListener('blur', () => { press = null; });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  scenes.forEach(scene => new MutationObserver(sync).observe(scene.panel, { attributes: true, attributeFilter: ['data-state'] }));
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const scene = scenes.find(item => item.panel === entry.target);
        if (scene) scene.inView = entry.isIntersecting && entry.intersectionRect.width > 1;
      });
      sync();
    }, { threshold: 0 });
    scenes.forEach(scene => observer.observe(scene.panel));
  } else {
    const checkView = () => {
      const visibleBounds = viewport.getBoundingClientRect();
      scenes.forEach(scene => {
        const bounds = scene.panel.getBoundingClientRect();
        scene.inView = bounds.right > visibleBounds.left && bounds.left < visibleBounds.right && visibleBounds.bottom > 0 && visibleBounds.top < window.innerHeight;
      });
      sync();
    };
    viewport.addEventListener('scroll', checkView, { passive: true });
    window.addEventListener('scroll', checkView, { passive: true });
    window.addEventListener('resize', checkView);
    checkView();
  }
  if (help) help.setAttribute('aria-label', '左右拖动画卷，滚轮与方向键亦可浏览；点击屋旁陈设了解四时生活，点击蝴蝶、蜻蜓与小鸟看回应，未结冰的水面可泛起涟漪。');
  sync();
})();
