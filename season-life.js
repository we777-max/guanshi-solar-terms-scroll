(() => {
  'use strict';

  const scenes = [
    { prop: [972,465,132], smoke: [[873,274,.92],[1217,281,.65]], painted: [1561,131,67,61], butterflies: [[655,421,38],[1415,506,32]], petals: [[971,385,4]] },
    { prop: [391,546,112], smoke: [[778,315,.9],[1807,197,.57]], painted: [669,112,56,65], butterflies: [[932,466,37]], petals: [[893,310,6]] },
    { prop: [1981,429,130], smoke: [[338,270,.65]], painted: [958,123,64,69], butterflies: [[1452,413,32]], dragonflies: [[1291,402,52],[1457,454,44]], ducks: [[460,631,.8],[1060,650,.86]] },
    { prop: [1092,495,135], smoke: [[1262,311,.72]], painted: [1497,149,62,65], butterflies: [[1562,456,32]], dragonflies: [[1640,555,45]] },
    { prop: [1284,487,166], smoke: [[404,271,.86]], painted: [1631,138,68,67], sparrows: [[1398,497,34],[1516,495,31]], leaves: [[584,184,5],[749,236,3]] },
    { prop: [1880,470,142], smoke: [[1107,219,.67],[762,224,.55]], painted: [1138,153,63,66], sparrows: [[1806,487,31],[1952,487,34]], leaves: [[1425,245,5],[1525,271,3]] },
    { prop: [666,449,146], smoke: [[515,275,1.12],[1225,324,.8]], painted: [1019,127,76,76], sparrows: [[888,305,34]], windows: ['M375 334L418 335 418 391 375 390Z','M1142 364H1170V402H1142Z'], snow: 16 },
    { prop: [831,484,144], smoke: [[316,312,1.06],[662,354,.78]], painted: [1534,147,74,69], sparrows: [[712,340,34]], windows: ['M245 366H285V415H245Z','M627 405H657V447H627Z'], snow: 18 }
  ];
  const seasons = ['春','夏','秋','冬'];
  const propKinds = ['spring-porch','summer-porch','autumn-harvest','winter-storage'];
  const propTitles = ['檐下新绿','檐下纳凉','晒场收成','檐下冬藏'];
  const propTexts = [
    '花枝陶盆与柳编篮放在屋旁，院边添了新绿。可以点击蝴蝶看它振翅。',
    '竹扇、竹席与水罐收在阴凉屋檐下。荷塘边的蜻蜓会短暂盘旋。',
    '谷筐、簸箕与谷束靠晒场收置。小雀在空地觅食，落叶从树冠边飘下。',
    '柴薪码在檐下，陶罐封口收存；窗内透出暖光，屋顶炊烟缓缓上升。'
  ];
  let note;
  let selected;
  const propButtons = new Set();

  function closeNote(restore = false) {
    if (note) note.hidden = true;
    const previous = selected;
    selected = null;
    propButtons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (restore && previous?.isConnected && previous.getBoundingClientRect().width) previous.focus({ preventScroll: true });
  }
  function showNote(button, season) {
    if (!note) {
      note = document.createElement('aside');
      note.id = 'seasonLifeNote'; note.className = 'season-life-note'; note.hidden = true;
      note.setAttribute('role', 'region'); note.setAttribute('aria-label', '画中四时生活');
      const title = document.createElement('strong');
      const text = document.createElement('p');
      const close = document.createElement('button'); close.type = 'button'; close.textContent = '×';
      close.setAttribute('aria-label', '收起四时生活说明'); close.addEventListener('click', () => closeNote(true));
      note.append(title, text, close); document.querySelector('.painting-frame').append(note);
      document.querySelector('#scrollViewport').addEventListener('scroll', () => closeNote(), { passive: true });
      document.addEventListener('keydown', event => { if (event.key === 'Escape' && !note.hidden) { closeNote(true); event.stopPropagation(); } });
    }
    const same = selected === button && !note.hidden;
    closeNote();
    if (same) return;
    selected = button; button.setAttribute('aria-expanded', 'true');
    note.querySelector('strong').textContent = `${seasons[season]} · ${propTitles[season]}`;
    note.querySelector('p').textContent = propTexts[season]; note.hidden = false;
  }

  function decorate(scene, { element, animate, ripple, cancelPress }) {
    const index = Number(scene.panel.dataset.panel);
    const season = Math.floor(index / 2);
    const config = scenes[index];
    const svg = scene.svg;
    const defs = svg.querySelector('defs');
    // The original water stays decorative; only the new targets join the
    // accessibility tree. Everything shares this scene's paused SVG clock.
    if (index !== 0) [...svg.children].forEach(child => child.setAttribute('aria-hidden', 'true'));
    svg.removeAttribute('aria-hidden'); svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', `${seasons[season]}卷动景，可点击屋旁陈设与小动物`);
    const layer = element('g', { class: 'season-life', 'data-season-life': season });
    const targets = [];
    let sequence = 0;
    function id(name) { return `life-${index}-${name}-${sequence++}`; }
    function once(node, attributes, transform = false) {
      const animation = element(transform ? 'animateTransform' : 'animate', { begin: 'indefinite', 'data-life-reaction': '', ...attributes });
      node.append(animation); return animation;
    }
    function target(label, width, height, callback, isProp = false) {
      const group = element('g', { class: `life-target${isProp ? ' life-prop' : ''}`, role: 'button', tabindex: 0, focusable: 'true', 'aria-label': label });
      const title = element('title'); title.textContent = label;
      group.append(title, element('rect', { class: 'life-hit', x: -width / 2, y: -height, width, height, rx: 6 }));
      ['pointerdown','pointerup'].forEach(name => group.addEventListener(name, event => { event.stopPropagation(); cancelPress(); }));
      function activate(event) {
        event.preventDefault(); event.stopPropagation();
        if (scene.playing) group.querySelectorAll('[data-life-reaction]').forEach(animation => animation.beginElement());
        callback(group);
      }
      group.addEventListener('click', activate);
      group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') activate(event); });
      targets.push({ group, isProp });
      return group;
    }
    function report(text) { const status = document.querySelector('#viewStatus'); if (status) status.textContent = text; }
    function assetStrip(parent, kind, size, foot = .5) {
      const clipId = id(kind);
      const clip = element('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' });
      clip.append(element('rect', { width: size, height: size })); defs.append(clip);
      const anchor = element('g', { transform: `translate(${-size/2} ${-size*foot})`, 'aria-hidden': 'true' });
      const window = element('g', { 'clip-path': `url(#${clipId})` });
      const source = kind === 'sparrow' || kind === 'duck' ? `spring-${kind}-frames-v1` : `${kind}-frames-v1`;
      const image = element('image', { class: 'life-sprite', href: `assets/motion/${source}.png`, width: size * 2, height: size, preserveAspectRatio: 'none' });
      window.append(image); anchor.append(window); parent.append(anchor);
      return image;
    }

    // Broad low-opacity puffs rise continuously from a small real roof vent.
    // A second fine curling stroke prevents a detached "smoke cloud" look.
    const smokeFilterId = id('smoke-soft');
    const smokeFilter = element('filter', { id: smokeFilterId, x: '-100%', y: '-60%', width: '300%', height: '220%' });
    smokeFilter.append(element('feGaussianBlur', { stdDeviation: 2.1 })); defs.append(smokeFilter);
    config.smoke.forEach(([x,y,size], stackIndex) => {
      const stack = element('g', { transform: `translate(${x} ${y}) scale(${size})`, 'aria-hidden': 'true', 'data-smoke-stack': `${index}-${stackIndex}` });
      stack.append(element('path', { class: 'life-chimney', d: 'M-6 0V-19H5V0M-8-19H7V-22H-8Z' }));
      const stem = element('path', { class: 'life-smoke-stem', d: 'M0-22C-10-37 11-47 2-66S-5-83 7-97', filter: `url(#${smokeFilterId})` });
      animate(stem, { attributeName: 'd', values: 'M0-22C-10-37 11-47 2-66S-5-83 7-97;M0-22C10-38-7-48 9-64S8-83 19-99;M0-22C-10-37 11-47 2-66S-5-83 7-97', dur: '5.2s', begin: `${-stackIndex*2}s` });
      stack.append(stem);
      for (let j = 0; j < 5; j += 1) {
        const plume = element('g', { opacity: 0 });
        const puff = element('g', { filter: `url(#${smokeFilterId})` });
        puff.append(element('path', { class: 'life-smoke-shadow', d: 'M0-22C-9-36 11-44 3-57S5-75 13-83' }));
        puff.append(element('ellipse', { class: 'life-smoke-cloud', cx: 2, cy: -47, rx: 8, ry: 13 }));
        puff.append(element('ellipse', { class: 'life-smoke-cloud', cx: 9, cy: -72, rx: 12, ry: 13 }));
        puff.append(element('path', { class: 'life-smoke-light', d: 'M1-23C-6-36 14-44 5-58S9-73 13-82' }));
        const begin = `${-j*1.28-stackIndex*.7}s`, duration = season === 3 ? '6.4s' : '7.2s';
        animate(plume, { attributeName: 'transform', type: 'translate', values: '0 0;13 -26;38 -66', dur: duration, begin }, true);
        animate(plume, { attributeName: 'opacity', values: '0;.8;.52;0', keyTimes: '0;.15;.6;1', dur: duration, begin });
        animate(puff, { attributeName: 'transform', type: 'scale', values: '.5 .65;1 1.05;1.65 1.3', dur: duration, begin }, true);
        plume.append(puff); stack.append(plume);
      }
      layer.append(stack);
    });

    // Also animate the smoke already painted above the distant village. A
    // feathered local replacement prevents rectangular edges or moving roofs.
    const [px,py,pw,ph] = config.painted;
    const paintedId = id('painted-smoke'), featherId = id('smoke-feather'), maskId = id('smoke-mask');
    const feather = element('filter', { id: featherId, x: '-30%', y: '-30%', width: '160%', height: '160%' });
    feather.append(element('feGaussianBlur', { stdDeviation: 4 }));
    const mask = element('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: px-12, y: py-12, width: pw+24, height: ph+24 });
    mask.append(element('ellipse', { cx: px+pw/2, cy: py+ph/2, rx: pw*.44, ry: ph*.44, fill: 'white', filter: `url(#${featherId})` }));
    const paintedFilter = element('filter', { id: paintedId, x: px-12, y: py-12, width: pw+24, height: ph+24, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
    const noise = element('feTurbulence', { type: 'fractalNoise', baseFrequency: '.045 .07', numOctaves: 1, seed: 17+index, result: 'curl' });
    animate(noise, { attributeName: 'baseFrequency', values: '.045 .07;.065 .09;.045 .07', dur: '4s' });
    paintedFilter.append(noise, element('feDisplacementMap', { in: 'SourceGraphic', in2: 'curl', scale: 5, xChannelSelector: 'R', yChannelSelector: 'G' }));
    defs.append(feather, mask, paintedFilter);
    const distant = element('g', { mask: `url(#${maskId})`, 'aria-hidden': 'true', 'data-painted-smoke': index });
    distant.append(element('image', { href: scene.panel.querySelector('img').getAttribute('src'), width: 2172, height: 724, preserveAspectRatio: 'none', filter: `url(#${paintedId})` }));
    layer.append(distant);

    if (config.windows) config.windows.forEach(d => {
      const glow = element('path', { class: 'life-window-glow', d, 'aria-hidden': 'true' });
      animate(glow, { attributeName: 'opacity', values: '.13;.29;.19;.25;.13', dur: '8.5s', begin: '-3s' });
      layer.append(glow);
    });
    const [propX,propY,propSize] = config.prop;
    const propAnchor = element('g', { transform: `translate(${propX} ${propY})` });
    const prop = target(`${seasons[season]}景陈设：${propTitles[season]}，点击查看`, propSize*.88, propSize*.87, button => { showNote(button, season); report(propTexts[season]); }, true);
    prop.setAttribute('aria-controls', 'seasonLifeNote'); prop.setAttribute('aria-expanded', 'false'); propButtons.add(prop);
    // Shadow stays on the ground; the illustrated props themselves stay still.
    prop.append(element('ellipse', { cx: 0, cy: 0, rx: propSize*.29, ry: propSize*.026, fill: '#625037', opacity: .17, 'aria-hidden': 'true' }));
    prop.append(element('image', { class: 'life-prop-art', href: `assets/motion/${propKinds[season]}-v1.png`, x: -propSize/2, y: -propSize*.88, width: propSize, height: propSize, preserveAspectRatio: 'none', 'aria-hidden': 'true' }));
    propAnchor.append(prop); layer.append(propAnchor);

    function flying(kind, x, y, size, number) {
      const anchor = element('g', { transform: `translate(${x} ${y})` });
      const flight = element('g');
      const name = kind === 'dragonfly' ? '蜻蜓' : '蝴蝶';
      const insect = target(`${name}，点击看它振翅`, 80, 72, () => report(scene.playing ? `${name}振翅飞过院边。` : '动景已暂停，开启后可看振翅回应。'));
      // Flying sprites use a centre anchor rather than the birds' ground line.
      insect.querySelector('.life-hit').setAttribute('y', -36);
      const reaction = element('g');
      const image = assetStrip(reaction, kind, size);
      const begin = `${-number*4.3-2}s`;
      const route = kind === 'dragonfly' ? '0 0;52 -8;95 5;35 14;0 0' : '0 0;35 -28;88 -8;48 19;0 0';
      animate(flight, { attributeName: 'transform', type: 'translate', values: route, dur: kind === 'dragonfly' ? '15s' : '21s', begin }, true);
      animate(image, { attributeName: 'x', values: `0;${-size};0`, keyTimes: '0;.5;1', calcMode: 'discrete', dur: kind === 'dragonfly' ? '.16s' : '.44s', begin });
      once(reaction, { attributeName: 'transform', type: 'translate', values: '0 0;12 -25;28 -8;0 0', dur: '1.35s' }, true);
      insect.append(reaction); flight.append(insect); anchor.append(flight); layer.append(anchor);
    }
    (config.butterflies || []).forEach(([x,y,size], i) => flying('butterfly', x,y,size,i));
    (config.dragonflies || []).forEach(([x,y,size], i) => flying('dragonfly', x,y,size,i+2));

    function bird(kind, x,y,size, number) {
      const duck = kind === 'duck';
      const anchor = element('g', { transform: `translate(${x} ${y})` });
      const mover = element('g');
      const label = duck ? '夏日水鸭，点击泛起水纹' : `${seasons[season]}卷麻雀，点击看它轻跳`;
      const creature = target(label, 78, 62, node => {
        if (scene.playing && duck) ripple(node);
        report(scene.playing ? duck ? '水鸭轻轻划水，泛起涟漪。' : '小雀抖了抖羽，轻跳一步。' : '动景已暂停，开启后可看小鸟回应。');
      });
      const facing = element('g');
      const image = assetStrip(facing, kind, duck ? 60*size : size, duck ? .715 : .735);
      const begin = `${-number*6.7-3}s`;
      const duration = duck ? '35s' : '25s';
      animate(mover, { attributeName: 'transform', type: 'translate', values: duck ? '0 0;78 -1;0 0' : '0 0;0 0;10 -5;21 0;21 0;10 -5;0 0;0 0', keyTimes: duck ? '0;.5;1' : '0;.18;.22;.26;.65;.69;.73;1', dur: duration, begin }, true);
      animate(facing, { attributeName: 'transform', type: 'scale', values: '1 1;-1 1;1 1', keyTimes: '0;.5;1', calcMode: 'discrete', dur: duration, begin }, true);
      animate(image, { attributeName: 'x', values: `0;${-(duck ? 60*size : size)};0`, keyTimes: '0;.46;1', calcMode: 'discrete', dur: '9s', begin });
      once(creature, { attributeName: 'transform', type: 'translate', values: '0 0;0 -7;0 0', dur: '.85s' }, true);
      if (duck) {
        const wake = element('path', { class: 'motion-duck-wake', d: 'M-23 0q-13-3-25 0m25 4q-13 2-24 0', 'aria-hidden': 'true' });
        animate(wake, { attributeName: 'opacity', values: '.2;.65;.2', dur: '4s', begin }); facing.prepend(wake);
      }
      creature.append(facing); mover.append(creature); anchor.append(mover); layer.append(anchor);
    }
    (config.sparrows || []).forEach(([x,y,size], i) => bird('sparrow',x,y,size,i));
    (config.ducks || []).forEach(([x,y,size], i) => bird('duck',x,y,size,i));

    function falling(x,y,count, petal) {
      for (let i = 0; i < count; i += 1) {
        const anchor = element('g', { transform: `translate(${x+i*14} ${y+(i%3)*18})`, 'aria-hidden': 'true' });
        const fall = element('g', { opacity: 0, 'data-falling': petal ? 'petal' : 'leaf' });
        const turn = element('g');
        turn.append(element('path', { class: petal ? 'life-petal' : 'life-leaf', d: petal ? 'M0 0Q-5-6 0-9Q6-5 0 0Z' : 'M0 0Q-9-1-11-11Q-2-12 0 0ZM-2-3-8-9' }));
        const begin = `${-i*2.3}s`, duration = `${petal ? 10 : 12}s`;
        animate(fall, { attributeName: 'transform', type: 'translate', values: '0 0;-12 35;17 75;42 116', dur: duration, begin }, true);
        animate(fall, { attributeName: 'opacity', values: '0;.8;.65;0', keyTimes: '0;.1;.75;1', dur: duration, begin });
        animate(turn, { attributeName: 'transform', type: 'rotate', values: '-35;70;150;220', dur: duration, begin }, true);
        fall.append(turn); anchor.append(fall); layer.append(anchor);
      }
    }
    (config.petals || []).forEach(([x,y,count]) => falling(x,y,count,true));
    (config.leaves || []).forEach(([x,y,count]) => falling(x,y,count,false));
    for (let i = 0; i < (config.snow || 0); i += 1) {
      const x = 180 + (i*137)%1850, y = 80 + (i*43)%260;
      const anchor = element('g', { transform: `translate(${x} ${y})`, 'aria-hidden': 'true' });
      const flake = element('circle', { class: 'life-snow', r: 1.1 + (i%3)*.4, opacity: 0 });
      const begin = `${-i*1.13}s`, duration = `${10+i%4}s`;
      animate(flake, { attributeName: 'transform', type: 'translate', values: '0 0;22 95;11 190', dur: duration, begin }, true);
      animate(flake, { attributeName: 'opacity', values: '0;.76;.55;0', keyTimes: '0;.15;.8;1', dur: duration, begin });
      anchor.append(flake); layer.append(anchor);
    }
    svg.append(layer);
    return {
      update(playing, visible) {
        targets.forEach(({group,isProp}) => { if (!isProp) group.setAttribute('aria-disabled', String(!playing)); });
        if (selected && (!visible || document.documentElement.classList.contains('is-studying')) && layer.contains(selected)) closeNote();
      }
    };
  }
  window.ScrollSeasonLife = { decorate };
})();
