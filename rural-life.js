(() => {
  'use strict';

  const farmingSource = { title: '参考：故宫《耕织图》工序说明', url: 'https://www.dpm.org.cn/collection/paint/231818.html' };
  const marketSource = { title: '参考：故宫《清明上河图》街市', url: 'https://minghuaji.dpm.org.cn/paint/detail?id=592d80e225aac624977fee2e19452c1f&topicType=12' };
  // Ground anchors measured from the alpha silhouettes of the saved frames.
  const footAnchors = { 'field-hoeing': .926, 'spring-ox-plough': .789, 'summer-rice-planter': .955, 'autumn-rice-harvester': .935, 'autumn-winnower': .955, 'grain-carrier': .931, 'market-shopkeeper': .965, 'market-shopper': .956, 'village-walker': .95, 'winter-chopping': .931, 'winter-villager': .952 };
  const stories = {
    plough: { title: '春耕 · 扶犁整地', text: '牛在前牵引木犁，农人随后扶住犁柄，在田畦内慢行整地。这里表现春季备耕，使用畜力与木柄铁刃农具。', source: farmingSource },
    hoe: { title: '田间 · 锄土理畦', text: '农人双手持木柄锄，作短距离起落，整理田土与畦边。疏松表土、理顺畦沟，是照料田地的日常功夫。', source: farmingSource },
    plant: { title: '夏日 · 分秧插植', text: '手中留一束秧苗，再分取小丛插下。这里选取春末夏初的稻作意象；各地种植时序不同，并非每个地方都在同一节气插秧。', source: farmingSource },
    harvest: { title: '秋收 · 持镰割稻', text: '一手拢住稻秆，一手用短柄镰刀在近根处收割，割下后再束成谷把。收割之后，谷把沿田埂运往禾场，再做进一步整理。', source: farmingSource },
    winnow: { title: '禾场 · 筛簸收粮', text: '收获后还要整理谷物。农人持浅竹簸箕作轻微扬簸，谷筐与谷束放在一旁，随后再收储。', source: farmingSource },
    carry: { title: '村路 · 挑担运送', text: '竹扁担两端以绳索悬挂竹筐，挑担人沿村路慢行。谷束与粮筐从田间送往禾场，整理后的收成也可送到街市。', source: farmingSource },
    chop: { title: '冬藏 · 劈柴备薪', text: '木墩承托柴段，双手持短斧分劈，再把干柴收置檐下。备薪、收储和缝补，都是冬日村落的日常劳作。' },
    winterWalk: { title: '冬日 · 束薪归家', text: '村人着厚布衣、披肩和裹腿，抱一小束柴薪沿岸上村路归家。院里炊烟正起，屋檐下已经收好了柴薪与陶罐。' },
    walk: { title: '村路 · 往来赶集', text: '村人带着小包裹和日用物件来到街上，驻足选货，也在铺前与邻人交谈。挑担、提篮与沿街买卖，串起村落的日常往来。', source: marketSource },
    buyer: { title: '街市 · 驻足选货', text: '提篮顾客在柜前选货，店家递出小包裹。米粮、布料和茶具等日用品摆在铺前，等着往来村人挑选。', source: marketSource },
    grain: { title: '米铺 · 量谷售粮', text: '开敞店面摆上盛粮竹篮和木制量器，店家在木柜台后照应顾客。粮食从田间、禾场来到街市。', source: marketSource },
    cloth: { title: '布铺 · 展布选料', text: '布卷与叠放的粗布摆在柜上，顾客在店前选看。素麻、靛色布料既可裁衣，也供日常缝补使用。', source: marketSource },
    tea: { title: '茶摊 · 歇脚饮茶', text: '陶壶、浅茶碗和茶叶盘陈列在店面，往来村人可驻足歇脚。与米铺、布铺一起构成长街的生活场景。', source: marketSource }
  };

  // All positions use the original paintings' coordinates. Foot routes are
  // authored along visible earth/stone paths; no free roaming crosses water.
  const actors = [
    [
      { key: 'field-hoeing', x: 214, y: 387, size: 74, story: 'hoe', period: 2.8, phase: 1.1 },
      { key: 'spring-ox-plough', x: 215, y: 493, width: 242, height: 161.33, story: 'plough', period: 1.5, route: '0 0;-28 -3;0 0', duration: 34, faces: '1 1;-1 1;1 1' }
    ],
    [
      { key: 'field-hoeing', x: 205, y: 432, size: 86, story: 'hoe', period: 2.8, phase: 1.4 },
      { key: 'grain-carrier', x: 1579, y: 436, size: 111, story: 'carry', period: 1.15, route: '0 0;76 2;0 0', duration: 42 },
      { key: 'village-walker', x: 1828, y: 428, size: 83, story: 'walk', period: 1.1, route: '0 0;110 -6;0 0', duration: 46 }
    ],
    [
      { key: 'summer-rice-planter', x: 820, y: 345, size: 62, story: 'plant', period: 3.4, phase: .8, cropDepth: 5 },
      { key: 'summer-rice-planter', x: 776, y: 395, size: 74, flip: true, story: 'plant', period: 3.7, phase: 2, cropDepth: 5 },
      { key: 'village-walker', x: 1743, y: 505, size: 96, story: 'walk', period: 1.15, route: '0 0;152 0;0 0', duration: 48 }
    ],
    [
      { key: 'market-shopper', x: 482, y: 490, size: 105, flip: true, story: 'buyer', period: 5.8, phase: 2.1 },
      { key: 'market-shopper', x: 861, y: 489, size: 102, story: 'buyer', period: 6.2, phase: 3.6 },
      { key: 'market-shopper', x: 1614, y: 493, size: 104, flip: true, story: 'buyer', period: 5.6, phase: 1.7 },
      { key: 'village-walker', x: 544, y: 516, size: 103, story: 'walk', period: 1.12, route: '0 0;130 0;0 0', duration: 38 },
      { key: 'village-walker', x: 772, y: 524, size: 108, story: 'walk', period: 1.14, route: '0 0;217 0;0 0', duration: 54, phase: 8 },
      { key: 'grain-carrier', x: 1173, y: 518, size: 121, story: 'carry', period: 1.2, route: '0 0;206 0;0 0', duration: 56, phase: 4 },
      { key: 'village-walker', x: 1854, y: 514, size: 99, story: 'walk', period: 1.14, route: '0 0;154 -3;0 0', duration: 48, phase: 14 }
    ],
    [
      { key: 'autumn-rice-harvester', x: 1510, y: 350, size: 73, flip: true, story: 'harvest', period: 3.4, phase: 1.6, cropDepth: 12 },
      { key: 'autumn-rice-harvester', x: 1374, y: 374, size: 87, story: 'harvest', period: 3.7, phase: .7, cropDepth: 12 },
      { key: 'autumn-winnower', x: 1451, y: 480, size: 109, story: 'winnow', period: 3.4, phase: 1.2 },
      { key: 'grain-carrier', x: 683, y: 545, size: 117, story: 'carry', period: 1.2, route: '0 0;192 -1;0 0', duration: 50, phase: 3 }
    ],
    [
      { key: 'autumn-rice-harvester', x: 670, y: 368, size: 70, flip: true, story: 'harvest', period: 3.8, phase: 2.3, cropDepth: 12 },
      { key: 'autumn-rice-harvester', x: 1078, y: 461, size: 104, story: 'harvest', period: 3.5, phase: .4, cropDepth: 13 },
      { key: 'grain-carrier', x: 567, y: 546, size: 119, story: 'carry', period: 1.2, route: '0 0;216 0;0 0', duration: 52, phase: 9 }
    ],
    [
      { key: 'winter-chopping', x: 749, y: 454, size: 113, story: 'chop', period: 3.4, phase: 1.3 },
      { key: 'winter-villager', x: 573, y: 546, size: 104, story: 'winterWalk', period: 1.25, route: '0 0;147 -1;0 0', duration: 48 }
    ],
    [
      { key: 'winter-villager', x: 378, y: 502, size: 104, story: 'winterWalk', period: 1.25, route: '0 0;242 0;0 0', duration: 60, phase: 12 },
      { key: 'winter-villager', x: 1752, y: 437, size: 74, story: 'winterWalk', period: 1.3, route: '0 0;101 -4;0 0', duration: 46, phase: 4 }
    ]
  ];

  const shops = [
    { key: 'grain', x: 371, y: 470, size: 96, flip: true, goods: [369,441,102,43], counter: 'M304 442H438V476H304Z', sign: [299,376] },
    { key: 'cloth', x: 969, y: 467, size: 97, goods: [956,443,102,48], counter: 'M891 447H1032V478H891Z', sign: [884,376] },
    { key: 'tea', x: 1526, y: 467, size: 95, flip: true, goods: [1520,440,82,42], counter: 'M1468 444H1587V477H1468Z', sign: [1455,373] }
  ];

  function decorate(scene, { element, animate, cancelPress }) {
    const index = Number(scene.panel.dataset.panel);
    const season = Math.floor(index / 2);
    const svg = scene.svg;
    const defs = svg.querySelector('defs');
    const source = scene.panel.querySelector('img').getAttribute('src');
    const layer = element('g', { class: 'rural-life', 'data-rural-scene': index });
    let sequence = 0;
    function makeId(name) { return `rural-${index}-${name}-${sequence++}`; }
    function explain(button, story) {
      const details = stories[story];
      window.ScrollSeasonLife.showNote(button, season, details);
      const status = document.querySelector('#viewStatus');
      if (status) status.textContent = details.text;
    }
    function button(story, box) {
      const details = stories[story];
      const node = element('g', { class: 'rural-target', role: 'button', tabindex: 0, focusable: 'true', 'aria-label': `${details.title}，点击了解`, 'aria-controls': 'seasonLifeNote', 'aria-expanded': 'false', 'data-rural-activity': story });
      const title = element('title'); title.textContent = details.title;
      node.append(title, element('rect', { class: 'rural-hit', x: box[0], y: box[1], width: box[2], height: box[3], rx: 5 }));
      ['pointerdown','pointerup'].forEach(name => node.addEventListener(name, event => { event.stopPropagation(); cancelPress(); }));
      function activate(event) {
        event.preventDefault(); event.stopPropagation();
        explain(node, story);
      }
      node.addEventListener('click', activate);
      node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') activate(event); });
      return node;
    }
    function foreground(parent, d) {
      const id = makeId('foreground');
      const clip = element('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
      clip.append(element('path', { d })); defs.append(clip);
      parent.append(element('image', { href: source, width: 2172, height: 724, preserveAspectRatio: 'none', 'clip-path': `url(#${id})`, 'aria-hidden': 'true', 'pointer-events': 'none' }));
    }
    function sprite(parent, config) {
      const rainy = new Set(['field-hoeing','spring-ox-plough','summer-rice-planter','autumn-rice-harvester','grain-carrier','village-walker','market-shopper']);
      function frame(file, scale, foot, className) {
        const width = (config.width || config.size)*scale, height = (config.height || config.size)*scale;
        const id = makeId('frame');
        const clip = element('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
        clip.append(element('rect', { width, height })); defs.append(clip);
        const anchor = element('g', { class: className, transform: `translate(${-width/2} ${-height*foot})`, 'aria-hidden': 'true' });
        const window = element('g', { 'clip-path': `url(#${id})` });
        const image = element('image', { class: 'rural-art', href: `assets/villagers/${file}.png`, width: width*2, height, preserveAspectRatio: 'none' });
        animate(image, { attributeName: 'x', values: `0;${-width};0`, keyTimes: '0;.5;1', calcMode: 'discrete', dur: `${config.period || 3.5}s`, begin: `${-(config.phase || 0)}s` });
        window.append(image); anchor.append(window); parent.append(anchor);
      }
      const width = config.width || config.size;
      const height = config.height || config.size;
      const foot = config.foot || footAnchors[config.key] || .9;
      frame(`${config.key}-v1`, 1, foot, rainy.has(config.key) ? 'weather-dry-art' : '');
      if (rainy.has(config.key)) {
        const umbrella = config.key === 'village-walker' || config.key === 'market-shopper';
        frame(`${config.key}-rain-v1`, umbrella ? config.key==='market-shopper'?1.08:1.1 : 1, umbrella ? config.key==='market-shopper'?.967:.98 : foot, 'weather-rain-art');
      }
      return { width, height };
    }
    function actor(config) {
      const width = config.width || config.size, height = config.height || config.size;
      const anchor = element('g', { transform: `translate(${config.x} ${config.y})`, 'data-rural-actor': config.key, 'data-rural-story': config.story });
      const travel = element('g');
      const facing = element('g', config.flip ? { transform: 'scale(-1 1)' } : {});
      const target = button(config.story, [-width*.44,-height*.86,width*.88,height*.9]);
      const art = element('g', { 'aria-hidden': 'true' });
      const shadow = element('ellipse', { cx: 0, cy: 0, rx: width*(config.key === 'spring-ox-plough' ? .32 : .18), ry: 1.8, class: 'rural-shadow', 'aria-hidden': 'true' });
      art.append(shadow); sprite(art, config);
      if (config.route) {
        const duration = `${config.duration}s`, begin = `${-(config.phase || 0)}s`;
        animate(travel, { attributeName: 'transform', type: 'translate', values: config.route, keyTimes: '0;.5;1', dur: duration, begin }, true);
        animate(facing, { attributeName: 'transform', type: 'scale', values: config.faces || '1 1;-1 1;1 1', keyTimes: '0;.5;1', calcMode: 'discrete', dur: duration, begin }, true);
      }
      facing.append(art, target); travel.append(facing); anchor.append(travel); layer.append(anchor);
      if (config.cropDepth) {
        const x = config.x, y = config.y, half = width*.46, depth = config.cropDepth;
        const edge = [0,.12,.23,.33,.45,.56,.67,.77,.89,1].map((part,i) => `${x-half+part*half*2} ${y-depth+[0,4,0,5,1,4,0,4,1,3][i]}`).join('L');
        foreground(layer, `M${edge}V${y+7}H${x-half}Z`);
      }
    }
    function shop(config) {
      const group = button(config.key, [config.x-77,config.y-114,159,121]);
      group.setAttribute('data-market-shop', config.key);
      const display = element('g', { 'aria-hidden': 'true' });
      display.setAttribute('data-market-display',config.key);
      const keeper = element('g', { transform: `translate(${config.x} ${config.y})` });
      const facing = element('g', config.flip ? { transform: 'scale(-1 1)' } : {});
      sprite(facing, { key: 'market-shopkeeper', size: config.size, period: 5.8, phase: config.x / 110 });
      keeper.append(facing);
      display.append(keeper);
      foreground(display, config.counter);
      const [x,y,width,height] = config.goods;
      display.append(element('image', { class: 'rural-art', href: `assets/villagers/market-${config.key}-goods-v1.png`, x: x-width/2, y: y-height*.88, width, height, preserveAspectRatio: 'none', 'aria-hidden': 'true' }));
      const flag = element('g', { transform: `translate(${config.sign.join(' ')})`, 'aria-hidden': 'true' });
      const sway = element('g');
      sway.append(element('path', { class: 'market-sign-cord', d: 'M0-12V0' }), element('path', { class: 'market-sign-cloth', d: 'M-12 0H12V39L5 36 0 39-6 36-12 39Z' }));
      const label = element('text', { class: 'market-sign-label', x: 0, y: 20, 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      label.textContent = { grain: '米', cloth: '布', tea: '茶' }[config.key]; sway.append(label);
      animate(sway, { attributeName: 'transform', type: 'rotate', values: '-1.2;1.5;-1.2', dur: '6s', begin: `${-config.x/500}s` }, true);
      flag.append(sway); display.append(flag); layer.append(display, group);
    }
    if (index === 3) shops.forEach(shop);
    [...actors[index]].sort((a,b) => a.y-b.y).forEach(actor);
    svg.append(layer);
    svg.setAttribute('aria-label', `${['春','夏','秋','冬'][season]}卷动景，可点击农事人物、商铺、陈设与虫鸟`);
    return {
      update(playing, visible) {
        layer.dataset.playing = String(playing);
        if ((!visible || document.documentElement.classList.contains('is-studying')) && layer.querySelector('[aria-expanded="true"]')) window.ScrollSeasonLife.closeNote();
      }
    };
  }
  window.ScrollRuralLife = { decorate };
})();
