(() => {
  'use strict';

  const panel = document.querySelector('.scene-panel[data-panel="0"]');
  const viewport = document.querySelector('#scrollViewport');
  const toggle = document.querySelector('#motionToggle');
  const label = document.querySelector('#motionToggleLabel');
  const frame = document.querySelector('.painting-frame');
  const help = document.querySelector('#scrollHelp');
  if (!panel || !toggle) return;

  const ns = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const bank = [[0,622],[120,614],[260,620],[380,643],[500,630],[620,636],[800,648],[980,635],[1150,623],[1350,636],[1530,623],[1620,608],[1760,623],[1900,613],[2050,594],[2172,578]];
  let choice = null;
  let inView = false;
  let playing = false;
  let press = null;
  const rippleTimers = new Set();

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

  const svg = element('svg', { class: 'scene-motion', viewBox: '0 0 2172 724', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false', 'data-motion-state': 'paused' });
  if (typeof svg.pauseAnimations !== 'function') return;
  const defs = element('defs');
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
  const smokeBlur = element('filter', { id: 'spring-smoke-soft', x: '-100%', y: '-40%', width: '300%', height: '180%' });
  smokeBlur.append(element('feGaussianBlur', { stdDeviation: '1.8' }));
  const waterClip = element('clipPath', { id: 'spring-river-clip', clipPathUnits: 'userSpaceOnUse' });
  waterClip.append(element('path', { d: `M${bank.map(point => point.join(' ')).join(' ')}V724H0Z`, fill: 'white', stroke: 'none' }));
  defs.append(filter, smokeBlur, waterClip);
  // Only the river is redrawn. Trees, architecture and land remain the original static image.
  const painting = element('image', { href: 'assets/scroll/spring.png', width: 2172, height: 724, preserveAspectRatio: 'none', filter: 'url(#spring-live-field)', 'clip-path': 'url(#spring-river-clip)' });
  const river = element('g', { 'clip-path': 'url(#spring-river-clip)' });
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
  const hearth = element('g', { transform: 'translate(615 292)' });
  hearth.append(element('path', { class: 'motion-chimney', d: 'M-5 1V-14H4V1M-7-14H6V-17H-7Z' }));
  for (let index = 0; index < 3; index += 1) {
    const plume = element('g', { class: 'motion-smoke', opacity: 0, filter: 'url(#spring-smoke-soft)' });
    const swelling = element('g');
    swelling.append(element('path', { d: 'M0-17C-8-32 9-40 0-54S-4-78 3-93', 'stroke-width': index === 1 ? 8 : 5 }));
    const begin = `${-index * 3.2}s`;
    animate(plume, { attributeName: 'opacity', values: '0;.38;.24;0', keyTimes: '0;.2;.65;1', dur: '9.6s', begin });
    animate(plume, { attributeName: 'transform', type: 'translate', values: '0 0;9 -17;28 -42', dur: '9.6s', begin }, true);
    animate(swelling, { attributeName: 'transform', type: 'scale', values: '.6 .65;1 1.1;1.45 1.4', dur: '9.6s', begin }, true);
    plume.append(swelling);
    hearth.append(plume);
  }
  svg.append(defs, painting, river, hearth);
  panel.insertBefore(svg, panel.querySelector('.study-entry'));
  svg.pauseAnimations();

  function removeRipples() {
    rippleTimers.forEach(timer => window.clearTimeout(timer));
    rippleTimers.clear();
    ripples.replaceChildren();
  }
  function sync() {
    const enabled = choice === null ? !reduced.matches : choice;
    const studying = document.documentElement.classList.contains('is-studying');
    const loaded = panel.dataset.state === 'loaded';
    const visible = inView && loaded;
    const nextPlaying = enabled && visible && !studying && document.visibilityState !== 'hidden';
    svg.classList.toggle('is-ready', visible);
    toggle.hidden = !visible;
    frame.classList.toggle('has-motion', visible);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? '暂停春卷动景' : '播放春卷动景');
    toggle.title = enabled ? '暂停流水与炊烟；点击水面可泛涟漪' : '播放春卷的流水与炊烟';
    label.textContent = enabled ? '动景已启' : '动景已停';
    svg.dataset.motionState = nextPlaying ? 'playing' : studying ? 'study' : !visible ? 'offscreen' : document.visibilityState === 'hidden' ? 'background' : 'paused';
    if (nextPlaying === playing) return;
    playing = nextPlaying;
    svg.classList.toggle('is-playing', playing);
    if (playing) svg.unpauseAnimations();
    else { svg.pauseAnimations(); removeRipples(); press = null; }
  }
  function point(clientX, clientY) {
    const bounds = panel.getBoundingClientRect();
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
  function addRipple(location) {
    const group = element('g');
    for (let index = 0; index < 2; index += 1) {
      const ring = element('ellipse', { class: 'motion-ripple', cx: location.x, cy: location.y, rx: 5, ry: 1.5, opacity: 0 });
      const duration = `${2.2 + index * .4}s`;
      ring.append(element('animate', { attributeName: 'rx', from: 5 + index * 4, to: 65 + index * 16, dur: duration, begin: 'indefinite', fill: 'freeze' }));
      ring.append(element('animate', { attributeName: 'ry', from: 1.5, to: 10 + index * 3, dur: duration, begin: 'indefinite', fill: 'freeze' }));
      ring.append(element('animate', { attributeName: 'opacity', values: '0;.6;0', keyTimes: '0;.12;1', dur: duration, begin: 'indefinite', fill: 'freeze' }));
      group.append(ring);
    }
    while (ripples.childElementCount >= 4) ripples.firstElementChild.remove();
    ripples.append(group);
    group.querySelectorAll('animate').forEach(animation => animation.beginElement());
    const timer = window.setTimeout(() => { group.remove(); rippleTimers.delete(timer); }, 2800);
    rippleTimers.add(timer);
  }

  toggle.addEventListener('click', () => { choice = !(choice === null ? !reduced.matches : choice); sync(); });
  viewport.addEventListener('pointerdown', event => {
    if (!playing || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button')) return;
    const location = point(event.clientX, event.clientY);
    if (onWater(location)) press = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: viewport.scrollLeft };
  });
  viewport.addEventListener('pointerup', event => {
    if (!press || press.id !== event.pointerId) return;
    const start = press;
    press = null;
    if (!playing || Math.hypot(event.clientX-start.x, event.clientY-start.y) > 6 || Math.abs(viewport.scrollLeft-start.scroll) > 3) return;
    const location = point(event.clientX, event.clientY);
    if (onWater(location)) addRipple(location);
  });
  viewport.addEventListener('pointercancel', () => { press = null; });
  window.addEventListener('blur', () => { press = null; });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['data-state'] });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting && entries[0].intersectionRect.width > 1; sync(); }, { threshold: 0 }).observe(panel);
  } else {
    const checkView = () => {
      const bounds = panel.getBoundingClientRect();
      const visibleBounds = viewport.getBoundingClientRect();
      inView = bounds.right > visibleBounds.left && bounds.left < visibleBounds.right && visibleBounds.bottom > 0 && visibleBounds.top < window.innerHeight;
      sync();
    };
    viewport.addEventListener('scroll', checkView, { passive: true });
    window.addEventListener('scroll', checkView, { passive: true });
    window.addEventListener('resize', checkView);
    checkView();
  }
  if (help) help.setAttribute('aria-label', '左右拖动画卷，滚轮与方向键亦可浏览；春卷动景开启时，点击水面可泛涟漪。');
  sync();
})();
