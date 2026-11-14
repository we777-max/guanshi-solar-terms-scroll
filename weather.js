import { WeatherModel } from './src/weather-model.js?v=2';
import { WeatherAudio } from './src/weather-audio.js?v=2';

const motion = window.ScrollMotion;
const frame = document.querySelector('.painting-frame');
if (motion && frame) init();

function init() {
  const $ = id => document.getElementById(id);
  const model = new WeatherModel(), sound = new WeatherAudio();
  const viewport = $('scrollViewport'), controls = $('weatherControls');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas'); canvas.className = 'weather-canvas'; canvas.setAttribute('aria-hidden','true'); frame.append(canvas);
  const ctx = canvas.getContext('2d');
  const fract = x => x-Math.floor(x), random = n => fract(Math.sin(n*127.1+311.7)*43758.5453);
  let width = 1, height = 1, layouts = [], rings = [], eaves = [], active = false;
  let raf = 0, previous = 0, lastDraw = 0, uiAge = 0, stormAge = 0, strikeAt = 4, flashAge = 9, flashX = .72, lightning = true, layoutTimer;
  let river = { level: 0, pan: 0, scene: -1 };
  const eaveLines = [
    [[752,309,972,309],[1143,303,1440,303],[1001,332,1152,332]],
    [[611,330,788,333],[1153,239,1288,239],[1574,259,1774,259]],
    [[249,296,439,296],[1045,328,1205,327]],
    [[283,354,473,354],[833,351,1094,351],[1474,354,1630,354]],
    [[334,304,555,304],[1009,281,1220,281]],
    [[1054,228,1166,228],[1691,365,1831,365]],
    [[395,304,657,304],[1047,332,1293,332]],
    [[209,355,438,355],[614,379,823,379]]
  ];
  const windows = [
    [[864,351,57,54],[1171,325,32,43]], [[609,367,43,53],[1629,278,29,33]],
    [[263,322,40,49],[389,322,38,48]], [[833,262,23,40],[1274,365,30,46],[1952,394,30,45]],
    [[345,323,37,50],[491,323,41,50]], [[1057,231,18,22]], [[410,326,44,49],[572,326,44,49]],
    [[217,372,29,66],[396,372,28,65],[638,390,30,39]]
  ];
  const springs = [[1160,650,.045],[850,490,.13],[1310,515,.048],[1120,654,.035],[1720,477,.065],[365,510,.085],[1600,612,.018],[1170,600,.035]];
  const sceneNodes = motion.scenes.map(scene => {
    const index = Number(scene.panel.dataset.panel);
    // SMIL owns each puff's opacity. Fade an unanimated parent so the rain
    // state can actually stop the smoke without fighting those animations.
    scene.svg.querySelectorAll('[data-smoke-stack]').forEach(stack=>{
      const output=document.createElementNS('http://www.w3.org/2000/svg','g');output.setAttribute('class','weather-smoke-output');
      [...stack.children].filter(node=>!node.classList.contains('life-chimney')).forEach(node=>output.append(node));stack.append(output);
    });
    const actors = [...scene.svg.querySelectorAll('[data-rural-actor]')].map((node,i) => ({node, story:node.dataset.ruralStory, i, targets:[...node.querySelectorAll('[role="button"]')]}));
    const wildlife = [...scene.svg.querySelectorAll('.weather-wildlife,.weather-duck')].map(node => ({node,duck:node.classList.contains('weather-duck'),targets:[...node.querySelectorAll('[role="button"]')]}));
    const water = (scene.waterAnimations || []).map(node => ({node, duration:parseFloat(node.getAttribute('dur'))}));
    const shops = [...scene.svg.querySelectorAll('[data-market-shop]')];
    // A still villager under an existing roof represents workers waiting out
    // a shower. Field workers themselves fade away, never work through thunder.
    const ns = 'http://www.w3.org/2000/svg';
    const smokeArea = [[1548,122,102,76],[658,101,96,84],[957,112,106,85],[1490,136,105,88],[1625,127,121,82],null,[1004,113,108,96],[1520,136,110,93]][index];
    if (smokeArea) {
      const [x,y,w,h] = smokeArea, id=`weather-smoke-${index}`;
      const mask=document.createElementNS(ns,'mask');mask.id=id;mask.setAttribute('maskUnits','userSpaceOnUse');
      const ellipse=document.createElementNS(ns,'ellipse');ellipse.setAttribute('cx',x+w/2);ellipse.setAttribute('cy',y+h/2);ellipse.setAttribute('rx',w/2);ellipse.setAttribute('ry',h/2);ellipse.setAttribute('fill','white');
      const soft=document.createElementNS(ns,'filter');soft.id=`${id}-soft`;const blur=document.createElementNS(ns,'feGaussianBlur');blur.setAttribute('stdDeviation','3');soft.append(blur);ellipse.setAttribute('filter',`url(#${soft.id})`);mask.append(ellipse);scene.svg.querySelector('defs').append(mask,soft);
      const patch=document.createElementNS(ns,'image');patch.setAttribute('href',`assets/weather/${['spring','spring-bridge','summer','summer-street','autumn','autumn-terraces','winter','winter-ferry'][index]}-smokeless-v1.png`);patch.setAttribute('width','2172');patch.setAttribute('height','724');patch.setAttribute('preserveAspectRatio','none');patch.setAttribute('mask',`url(#${id})`);patch.setAttribute('class','weather-smoke-cover');patch.setAttribute('aria-hidden','true');scene.svg.append(patch);
    }
    const shelter = document.createElementNS(ns,'g'); shelter.dataset.weatherPerson = 'shelter'; shelter.dataset.weatherHidden = 'true'; shelter.setAttribute('aria-hidden','true');
    const site = [[965,465],[1650,420],[1076,446],[465,470],[1092,414],[1169,412],[589,416],[665,451]][index];
    const size = index === 2 ? 72 : 78;
    const clip = document.createElementNS(ns,'clipPath'); clip.id = `weather-shelter-${index}`;
    const rect = document.createElementNS(ns,'rect'); rect.setAttribute('width',size); rect.setAttribute('height',size); clip.append(rect); scene.svg.querySelector('defs').append(clip);
    const box = document.createElementNS(ns,'g'); box.setAttribute('transform',`translate(${site[0]-size/2} ${site[1]-size*.965})`); box.setAttribute('clip-path',`url(#${clip.id})`);
    const img = document.createElementNS(ns,'image'); img.setAttribute('href','assets/villagers/market-shopkeeper-v1.png'); img.setAttribute('width',size*2); img.setAttribute('height',size); img.setAttribute('class','rural-art'); box.append(img); shelter.append(box); scene.svg.append(shelter);
    return {scene,index,actors,wildlife,water,shops,shelter,waterBand:-1};
  });

  function hidden(node, value, targets = []) {
    if (node.dataset.weatherHidden === String(value)) return;
    node.dataset.weatherHidden = String(value); node.setAttribute('aria-hidden',String(value));
    targets.forEach(target => { target.setAttribute('tabindex',value ? '-1':'0'); });
    if (value && node.contains(document.activeElement)) { $('weatherToggle').focus({preventScroll:true}); window.ScrollSeasonLife?.closeNote(); }
  }
  function applyLife(state) {
    sceneNodes.forEach(({scene,index,actors,wildlife,water,shops,shelter},i) => {
      const season = Math.floor(index/2);
      const raining = state.amount > .055 && season !== 3;
      scene.svg.dataset.precipitating = String(state.amount > .055);
      scene.svg.dataset.wetHarvest = String(season === 2 && state.amount > .08);
      actors.forEach(({node,story,i,targets}) => {
        const field = ['hoe','plough','plant','harvest','winnow','chop'].includes(story);
        const rest = state.dark > .5 || (season === 1 && state.amount > .48) || (season === 2 && state.amount > .16) || (story === 'chop' && state.amount > .25);
        const covered = story === 'winnow' && state.amount > .055;
        const nightStreet = !field && state.dark > .6 && i%2 === 0;
        hidden(node,(field && rest)||covered||nightStreet,targets);
      });
      wildlife.forEach(({node,duck,targets}) => hidden(node,duck ? state.dark>.45||(season===1&&state.amount>.48) : state.birdShelter,targets));
      shops.forEach(node => hidden(node,state.dark > .62,[node]));
      scene.svg.querySelectorAll('[data-market-display]').forEach(node=>hidden(node,state.dark > .62));
      hidden(shelter,!(state.amount > .48 && state.dark < .5 && season !== 3));
      // Increasing water speed never accelerates people, birds, or falling snow.
      const band = season === 3 ? 0 : Math.round(state.amount*4);
      if (sceneNodes[i].waterBand !== band) {
        water.forEach(({node,duration}) => { if (Number.isFinite(duration)) node.setAttribute('dur',`${duration/(1+band*.28)}s`); });
        scene.svg.querySelectorAll('[data-water-kind]').forEach(node => node.dataset.weatherSpeed = String(1+band*.28));
        sceneNodes[i].waterBand = band;
      }
      // Rain gear is used only for rain, not by the thickly clothed winter cast.
      scene.svg.dataset.rainGear = String(raining);
    });
  }
  function measure() {
    clearTimeout(layoutTimer);
    const bounds = viewport.getBoundingClientRect();
    const rects = motion.scenes.map(scene => ({scene,rect:scene.panel.getBoundingClientRect()}));
    width = Math.max(1,bounds.width); height = Math.max(1,bounds.height);
    const pixelRatio = Math.min(devicePixelRatio || 1,1.5);
    canvas.width = Math.round(width*pixelRatio); canvas.height = Math.round(height*pixelRatio); ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    layouts = rects.filter(({rect}) => rect.right > bounds.left && rect.left < bounds.right).map(({scene,rect}) => ({scene,index:Number(scene.panel.dataset.panel),x:rect.left-bounds.left,w:rect.width,h:rect.height}));
    const dominant = [...layouts].sort((a,b) => visible(b)-visible(a))[0];
    if (dominant) model.setSeason(Math.floor(dominant.index/2));
    rings = [];
    for (let i=0;i<95;i++) {
      const x = random(i+8)*width, y = (.37+random(i+301)*.62)*height;
      const local = [...layouts].reverse().find(item => x >= item.x && x <= item.x+item.w);
      if (local?.scene.onWater({x:(x-local.x)/local.w*2172,y:y/local.h*724})) rings.push({x,y,seed:i});
    }
    eaves = layouts.flatMap(item => eaveLines[item.index].flatMap(([x1,y1,x2,y2],row) => Array.from({length:9},(_,i)=>({x:item.x+(x1+(x2-x1)*(i+.5)/9)/2172*item.w,y:(y1+(y2-y1)*(i+.5)/9)/724*item.h,seed:i+row*13+item.index*29})))).filter(p=>p.x>0&&p.x<width);
    // The nearest on-screen water source wins; no offscreen painting owns a
    // second ambience loop. Distance pans and attenuates this shared source.
    const candidates = layouts.map(item => {
      const [x,,level] = springs[item.index], screen = item.x+x/2172*item.w;
      const distance = Math.abs(screen-width/2)/(width*.65);
      return {level:level*Math.max(0,1-distance*.8),pan:Math.max(-1,Math.min(1,(screen/width-.5)*2)),scene:item.index};
    }).sort((a,b)=>b.level-a.level);
    river = candidates[0] || {level:0,pan:0,scene:-1};
    const boundsVisible = bounds.bottom > 0 && bounds.top < innerHeight;
    active = motion.enabled && boundsVisible && !document.documentElement.classList.contains('is-studying') && document.visibilityState !== 'hidden';
    update(); draw(model.snapshot()); wake();
  }
  function visible(item) { return Math.max(0,Math.min(width,item.x+item.w)-Math.max(0,item.x)); }
  function update() {
    const state = model.snapshot(); applyLife(state);
    $('weatherDay').setAttribute('aria-pressed',String(!state.night)); $('weatherNight').setAttribute('aria-pressed',String(state.night));
    $('weatherClear').setAttribute('aria-pressed',String(!state.wet)); $('weatherWet').setAttribute('aria-pressed',String(state.wet));
    $('weatherWet').textContent = `下${state.profile.name}`;
    $('weatherSummary').textContent = `${state.night?'夜':'日'} · ${state.wet ? state.profile.name : state.amount>.01 ? '渐停' : '晴'}`;
    let message = state.amount > .01 ? `${state.night?'夜间':'白天'}${state.profile.name}${state.phase}。` : state.wet ? '云色渐聚，雨雪将起。' : state.rainbow ? '夏雨初霁，日光重现，一道淡虹渐入画中。' : `${state.night?'夜色已至，田间歇作，檐下亮灯。':'晴光入卷，村落恢复日常。'}`;
    if (state.amount > .06) message += state.season===3 ? '雪花缓落，冰面保持静止。' : state.storm ? '田间停工避雨，行人撑伞，虫鸟归檐。' : '农人戴笠，行人撑伞，虫鸟避雨。';
    if (!active && state.wet) message += '动景已停，雨雪暂留此刻。';
    if (sound.unavailable) message += '浏览器暂未开放声音，可再点环境声。';
    $('weatherStatus').textContent = message;
    frame.dataset.weather = state.profile.kind; frame.dataset.weatherPhase = state.phase;
    frame.dataset.weatherAmount = state.amount.toFixed(3); frame.dataset.weatherNight = String(state.night);
    frame.dataset.weatherRainbow = state.rainbow.toFixed(3);
    frame.dataset.weatherEligible = String(model.eligible); frame.dataset.weatherRainAge = model.rainAge.toFixed(2);
    frame.dataset.weatherClock = model.time.toFixed(2); frame.dataset.weatherDark = state.dark.toFixed(3);
    sound.update(state,active,river);
    frame.dataset.audioScene = String(sound.levels.scene); frame.dataset.audioRain = sound.levels.rain.toFixed(3); frame.dataset.audioRiver = sound.levels.river.toFixed(3);
    frame.dataset.audioState = sound.context?.state || 'awaiting-gesture';
    frame.dataset.audioThunders = String(sound.thunders.size); frame.dataset.audioRms = sound.meter().toFixed(5);
  }
  function draw(state) {
    ctx.clearRect(0,0,width,height);
    // A translucent ink wash changes the illumination without recolouring or
    // filtering every large painting on every frame.
    if (state.dark > 0) { ctx.fillStyle = `rgba(14,25,43,${state.dark*.76})`; ctx.fillRect(0,0,width,height); }
    if (state.amount > 0) {
      const shade = ctx.createLinearGradient(0,0,0,height);
      shade.addColorStop(0,`rgba(46,58,68,${state.amount*(state.season===1?.5:.25)})`); shade.addColorStop(1,`rgba(64,77,81,${state.amount*.09})`);
      ctx.fillStyle = shade; ctx.fillRect(0,0,width,height);
    }
    if (state.dark > .05) {
      ctx.globalAlpha = state.dark*(1-state.amount*.97);
      for (let i=0;i<38;i++) { ctx.beginPath(); ctx.fillStyle='#e9e0bf'; ctx.arc(random(i+22)*width,random(i+82)*height*.2,random(i+2)*.85+.35,0,Math.PI*2);ctx.fill(); }
      ctx.fillStyle='#e9dec3'; ctx.beginPath();ctx.arc(width*.75,height*.105,Math.max(5,height*.022),0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
      layouts.forEach(item=>windows[item.index].forEach(([x,y,w,h])=>{
        const px=item.x+x/2172*item.w, py=y/724*height, pw=w/2172*item.w, ph=h/724*height;
        const glow=ctx.createRadialGradient(px+pw*.5,py+ph*.5,0,px+pw*.5,py+ph*.5,Math.max(pw,ph)*.7);
        glow.addColorStop(0,`rgba(239,174,83,${state.dark*.32})`);glow.addColorStop(1,`rgba(239,174,83,${state.dark*.06})`);
        ctx.fillStyle=glow;ctx.fillRect(px,py,pw,ph);
      }));
    }
    if (state.rainbow > 0) {
      const cx=width*.61, cy=height*.49, radius=Math.min(width*.29,height*.46), colors=['#c88675','#cfaa72','#d4c58b','#9fb090','#8faeaa','#939eb3','#aaa0b6'];
      ctx.save();ctx.globalAlpha=state.rainbow*.36;ctx.lineWidth=Math.max(2,height*.007);
      colors.forEach((color,i)=>{
        const sky=ctx.createLinearGradient(0,0,0,height*.39);
        sky.addColorStop(0,color);sky.addColorStop(.6,color);sky.addColorStop(1,`${color}00`);
        ctx.strokeStyle=sky;ctx.beginPath();ctx.arc(cx,cy,radius-i*ctx.lineWidth,Math.PI*1.08,Math.PI*1.92);ctx.stroke();
      });ctx.restore();
    }
    if (state.amount > .001) {
      const count=Math.ceil(state.profile.drops*state.amount*Math.min(1.5,width/1150));
      ctx.lineCap='round';
      for (let i=0;i<count;i++) {
        const depth=.55+random(i+39)*.65, speed=state.profile.speed*depth;
        const y=fract(random(i+61)+state.time*speed/(height+70))*(height+70)-35;
        const x=fract(random(i+12)-state.time*(state.season===3?.005:.015)*depth)*width;
        if (state.season===3) {
          ctx.fillStyle=`rgba(248,246,234,${.35+depth*.35})`;ctx.beginPath();ctx.arc(x+Math.sin(state.time*.7+i)*9,y,.55+depth*1.1,0,Math.PI*2);ctx.fill();
        } else {
          const length=(state.season===1?20:7)*depth;
          ctx.strokeStyle=state.dark>.4 ? `rgba(213,222,218,${.24+state.rain*.33})` : `rgba(58,78,86,${.3+state.rain*.16})`;
          ctx.lineWidth=(state.season===1?.85:.7)*depth;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-length*.27,y+length);ctx.stroke();
        }
      }
      if (state.season!==3) {
        rings.slice(0,Math.ceil(rings.length*state.amount)).forEach(({x,y,seed})=>{
          const age=fract(state.time*(.7+state.rain*.8)+random(seed+501)), radius=(3+12*state.rain)*age;
          ctx.strokeStyle=`rgba(225,230,211,${(1-age)*state.amount*.55})`;ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.25,0,0,Math.PI*2);ctx.stroke();
        });
        // Drops begin exactly at authored eave edges, not at the sky or roof ridge.
        eaves.forEach(({x,y,seed})=>{
          const age=fract(state.time*(1.1+state.rain)+random(seed+981));
          if (random(seed+93)>state.amount*.87) return;
          const distance=age*age*(17+state.rain*30);
          ctx.strokeStyle=`rgba(224,231,219,${state.amount*(1-age)*.8})`;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x,y+distance);ctx.lineTo(x-.6,y+distance+2+age*3);ctx.stroke();
        });
      }
    }
    if (flashAge < .8 && lightning && !reduced.matches) {
      const alpha=Math.max(0,1-flashAge/.8)*.16;
      const glow=ctx.createLinearGradient(0,0,0,height*.8);glow.addColorStop(0,`rgba(227,235,243,${alpha})`);glow.addColorStop(1,'rgba(227,235,243,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      ctx.strokeStyle=`rgba(239,237,219,${(1-flashAge/.8)*.8})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(width*flashX,0);ctx.lineTo(width*flashX-13,height*.055);ctx.lineTo(width*flashX+4,height*.055);ctx.lineTo(width*flashX-21,height*.16);ctx.stroke();
    }
  }
  function tick(now) {
    raf=0;
    if (!active) { previous=0; return; }
    const dt=previous ? Math.min(.12,(now-previous)/1000) : 0; previous=now;
    const state=model.step(dt); flashAge+=dt; uiAge+=dt;
    if (state.season===1 && state.amount>.72 && state.wet) {
      stormAge+=dt;
      if (stormAge>strikeAt) { flashAge=0;flashX=.25+Math.random()*.5;stormAge=0;strikeAt=10+Math.random()*9;sound.thunder(1.2+Math.random()*1.6,(flashX-.5)*2); }
    } else { stormAge=0;flashAge=9;strikeAt=4; }
    if (uiAge>.25) { update();uiAge=0; }
    if (now-lastDraw>32) { draw(state);lastDraw=now; }
    if (state.amount>.001 || state.transitioning || state.rainbow>0 || model.rainbowAge!==null || model.dryAge<3) raf=requestAnimationFrame(tick);
    else { update();draw(state);previous=0; }
  }
  function wake() { if (active&&!raf) { previous=0;raf=requestAnimationFrame(tick); } }
  function refresh() {
    if (!active && raf) { cancelAnimationFrame(raf);raf=0;previous=0; }
    update();draw(model.snapshot());wake();
  }
  function choose(action) {
    window.ScrollSeasonLife?.closeNote(); sound.unlock().then(()=>update());
    const instant=!motion.enabled||reduced.matches; action(instant);
    if(instant&&model.rainbowAge!==null)model.rainbowAge=4;
    refresh();
  }
  $('weatherDay').addEventListener('click',()=>choose(instant=>model.setNight(false,instant)));
  $('weatherNight').addEventListener('click',()=>choose(instant=>model.setNight(true,instant)));
  $('weatherWet').addEventListener('click',()=>choose(instant=>model.setWet(true,instant)));
  $('weatherClear').addEventListener('click',()=>choose(instant=>model.setWet(false,instant)));
  $('weatherSound').addEventListener('click',()=>{
    sound.enabled=!sound.enabled; $('weatherSound').setAttribute('aria-pressed',String(sound.enabled));$('weatherSound').textContent=`环境声 · ${sound.enabled?'开':'关'}`;
    sound.unlock().then(()=>update());update();
  });
  $('weatherVolume').addEventListener('input',event=>{sound.volume=Number(event.target.value)/100;sound.unlock().then(()=>update());update();});
  $('weatherLightning').addEventListener('click',()=>{lightning=!lightning;$('weatherLightning').setAttribute('aria-pressed',String(lightning));$('weatherLightning').textContent=`闪电 · ${lightning?'开':'关'}`;draw(model.snapshot());});
  function close(restore=false) {controls.hidden=true;$('weatherToggle').setAttribute('aria-expanded','false');if(restore)$('weatherToggle').focus();}
  $('weatherToggle').addEventListener('click',()=>{const open=controls.hidden;controls.hidden=!open;$('weatherToggle').setAttribute('aria-expanded',String(open));});
  $('weatherClose').addEventListener('click',()=>close(true));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!controls.hidden){close(true);event.stopPropagation();}});
  document.addEventListener('pointerdown',event=>{if(!controls.hidden&&!controls.contains(event.target)&&!$('weatherToggle').contains(event.target))close();});
  const scheduleMeasure=()=>{clearTimeout(layoutTimer);layoutTimer=setTimeout(measure,70);};
  viewport.addEventListener('scroll',scheduleMeasure,{passive:true});window.addEventListener('scroll',scheduleMeasure,{passive:true});
  document.addEventListener('scroll:motion',()=>{active=motion.enabled&&!document.documentElement.classList.contains('is-studying')&&document.visibilityState!=='hidden'&&layouts.some(item=>item.scene.inView);refresh();});
  document.addEventListener('study:open',()=>{close();active=false;refresh();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){active=false;refresh();}else measure();});
  new ResizeObserver(measure).observe(viewport);
  const observer=new IntersectionObserver(()=>measure());observer.observe(viewport);
  reduced.addEventListener('change',()=>{flashAge=9;measure();});
  window.addEventListener('pagehide',()=>{active=false;if(raf)cancelAnimationFrame(raf);sound.close();});
  measure();
}
