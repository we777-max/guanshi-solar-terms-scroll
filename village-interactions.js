import { WaterwheelState, FestivalState, FESTIVAL_STAGES, MILL_WHEEL, projectWheelPoint } from './src/village-model.js?v=2';

const motion=window.ScrollMotion, frame=document.querySelector('.painting-frame');
if(motion&&frame)init();

function init(){
  const ns='http://www.w3.org/2000/svg', wheel=new WaterwheelState(),festival=new FestivalState();
  const mill=motion.scenes[1],winter=motion.scenes[6],status=document.querySelector('#viewStatus');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const el=(tag,attrs={})=>{const node=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));return node;};
  const say=text=>{status.textContent=text;};
  const image=(file,attrs={})=>el('image',{href:file,'pointer-events':'none',preserveAspectRatio:'none',...attrs});
  const stopSound=()=>document.dispatchEvent(new CustomEvent('village:stop-firecrackers'));
  function target(label,box,activate){
    const node=el('g',{class:'village-target',role:'button',tabindex:0,focusable:'true','aria-label':label});
    const title=el('title');title.textContent=label;node.append(title,el('rect',{class:'village-hit',x:box[0],y:box[1],width:box[2],height:box[3],rx:3}));
    for(const type of ['pointerdown','pointerup'])node.addEventListener(type,event=>event.stopPropagation());
    const act=event=>{event.preventDefault();event.stopPropagation();window.ScrollSeasonLife?.closeNote();if(!event.repeat)activate();};
    node.addEventListener('click',act);node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')act(event);});return node;
  }
  function underneathPeople(scene,group){
    const before=scene.svg.querySelector('.world-atmosphere,.rural-life');
    if(before)scene.svg.insertBefore(group,before);else scene.svg.append(group);
  }
  function clip(scene,id,shape){const node=el('clipPath',{id,clipPathUnits:'userSpaceOnUse'});node.append(shape);scene.svg.querySelector('defs').append(node);return `url(#${id})`;}

  // Wheel rotates in its own circular plane, then projects into the painting.
  // Its fixed bearing and axle are redrawn from the original in front of it.
  const millLayer=el('g',{class:'village-mill','data-wheel-ready':'false',visibility:'hidden'});
  const patchClip=clip(mill,'mill-clean-region',el('path',{d:'M665 335H808V535H665Z'}));
  millLayer.append(image('assets/scroll/effects/mechanical/watermill-clean-v1.png',{width:2172,height:724,'clip-path':patchClip}));
  const wheelPlane=offset=>`matrix(${MILL_WHEEL.scaleX} 0 0 1 ${MILL_WHEEL.x+offset} ${MILL_WHEEL.y})`;
  const back=el('g',{transform:wheelPlane(-MILL_WHEEL.depth)}),front=el('g',{transform:wheelPlane(0)});
  const backSpin=el('g'),frontSpin=el('g');
  const rotor='assets/scroll/effects/mechanical/waterwheel-rotor-v1.png';
  for(const [parent,spin]of[[back,backSpin],[front,frontSpin]]){spin.append(image(rotor,{x:-96,y:-96,width:192,height:192}));parent.append(spin);}
  back.setAttribute('opacity','.88');
  const paddles=el('g',{'pointer-events':'none'});const boards=[];
  for(let i=0;i<16;i++){const board=el('path',{fill:i%2?'#9e7e4e':'#b39463',stroke:'#685a40','stroke-width':.9});boards.push(board);paddles.append(board);}
  millLayer.append(back,paddles,front);
  // Divert a small branch of the existing millrace onto the right-hand rim.
  // The original stepped spillway remains visible beside it at all times.
  const trough=el('g',{'aria-hidden':'true','pointer-events':'none',class:'mill-trough'});
  trough.append(el('path',{d:'M806 419L852 417 860 423 808 429Z',fill:'#b49a70',stroke:'#766448','stroke-width':1.1}),el('path',{d:'M808 429L860 423V428L809 434Z',fill:'#927b56',stroke:'#6d5c43','stroke-width':'.9'}));
  const waterInlet=el('g',{'aria-hidden':'true','pointer-events':'none',class:'mill-inlet-water'});
  waterInlet.append(el('path',{d:'M811 420L851 419 857 422 811 427Z',fill:'#9ca28b',opacity:'.88'}));
  const waterTraces=[];
  function stream(d,width){
    waterInlet.append(el('path',{d,fill:'none',stroke:'#859481','stroke-width':width+2,opacity:'.55','stroke-linecap':'round'}),el('path',{d,fill:'none',stroke:'#dedfcc','stroke-width':width,opacity:'.92','stroke-linecap':'round'}));
    const line=el('path',{d,class:'mill-flow-highlight',fill:'none',stroke:'#f3ecd9','stroke-width':Math.max(1.3,width*.32),'stroke-dasharray':'9 19','stroke-linecap':'round'});waterInlet.append(line);waterTraces.push(line);
  }
  stream('M852 421L824 424 808 425Q802 427 803 439',5.2);
  stream('M803 437Q809 466 794 499Q791 521 812 532Q828 538 851 537',4.2);
  stream('M799 449Q800 475 786 497',1.9);
  const drops=[];
  for(let i=0;i<16;i++){const drop=el('path',{d:'M0 0l1 3.2',fill:'none',stroke:'#efe8d2','stroke-width':1.4,'stroke-linecap':'round'});drops.push(drop);waterInlet.append(drop);}
  const splash=[];
  for(let i=0;i<3;i++){const ring=el('ellipse',{cx:849+i*3,cy:538+i*.9,rx:4,ry:1.5,fill:'none',stroke:'#eee5cc','stroke-width':1.2});splash.push(ring);waterInlet.append(ring);}
  const gate=el('g',{'aria-hidden':'true','pointer-events':'none'});
  gate.append(el('path',{d:'M825 416V433M835 415V432',fill:'none',stroke:'#705d42','stroke-width':1.7}));
  const shutter=el('path',{d:'M826 0H834V9H826Z',fill:'#8c704c',stroke:'#67563e','stroke-width':'.8'});gate.append(shutter);
  millLayer.append(trough,waterInlet,gate);
  const bearing=clip(mill,'mill-fixed-bearing',el('path',{d:'M746 419Q760 410 774 427V448H783L791 474 797 523 740 532 735 503 737 466 742 454Z'}));
  millLayer.append(image('assets/scroll/backgrounds/spring-bridge.png',{width:2172,height:724,'clip-path':bearing}));
  const millButton=target('水车正在转动，点击停下',[662,334,148,200],()=>{
    wheel.toggle();sync();say(wheel.enabled?(mill.playing?'提闸进水，水流冲上轮缘，沿水轮落入溪中。':'水车已开启；画卷动景暂停，恢复播放后再转动。'):'关闸停轮，进轮水流停下，旁侧跌水与溪流继续流动。');
  });
  millButton.append(el('ellipse',{cx:735,cy:434,rx:65,ry:95,fill:'transparent'}));millLayer.append(millButton);underneathPeople(mill,millLayer);

  const decor=el('g',{class:'village-festival','data-festival-stage':festival.stage,visibility:'hidden','aria-hidden':'true'});underneathPeople(winter,decor);
  // Keep invisible hit areas above the villagers' larger sprite hit boxes;
  // painted decorations themselves remain under the shared night wash.
  const festivalHotspots=el('g',{class:'village-festival-hotspots',visibility:'hidden'});winter.svg.append(festivalHotspots);
  const couplets=el('g',{class:'festival-couplets'}),lanternArt=el('g'),crackerArt=el('g'),burst=el('g',{'pointer-events':'none'});
  const banners=[];
  function paper(x,y,width,height,text,vertical=true){
    const group=el('g',{transform:`translate(${x} ${y})`});
    group.append(el('path',{d:`M0 0L${width} .5 ${width-.8} ${height} .6 ${height-.7}Z`,fill:'#a44935',stroke:'#784735','stroke-width':.6}));
    const label=el('text',{class:'festival-ink','font-size':vertical?9.3:10.5,'text-anchor':'middle'});
    [...text].forEach((char,i)=>{const span=el('tspan',{x:vertical?width/2:width*(i+.5)/text.length,y:vertical?11+i*(height-11)/text.length:height*.75});span.textContent=char;label.append(span);});
    group.append(label);couplets.append(group);banners.push(label);return group;
  }
  // Paper follows gate posts / door jambs, not the open passage or sky.
  paper(785,366,14,112,'一元复始春风暖');paper(919,365,14,112,'万象更新岁月长');paper(817,347,84,15,'岁序更新',false);
  paper(474,350,10,68,'春回大地');paper(543,350,10,68,'福满人间');
  const coupletButton=target('门旁春联，点击换一副',[776,346,166,141],()=>{festival.changeCouplets();renderFestival();say('换上一副春联，门楣与两侧红笺同时更新。');});

  function atlasSprite(parent,cell,x,y,size){
    const id=`festival-art-${cell}-${x}-${y}`;const crop=clip(winter,id,el('rect',{x,y,width:size,height:size}));
    parent.append(image('assets/scroll/effects/festival/newyear-props-v1.png',{x:x-cell*size,y,width:size*2,height:size,'clip-path':crop}));
  }
  const glows=[],lanternButtons=[];
  const lampGradient=el('radialGradient',{id:'festival-paper-light'});lampGradient.append(el('stop',{offset:0,'stop-color':'#ffcf7d','stop-opacity':'.75'}),el('stop',{offset:1,'stop-color':'#eab265','stop-opacity':'0'}));winter.svg.querySelector('defs').append(lampGradient);
  function lantern(x,y,size,extra=false){
    const group=el('g',{'pointer-events':'none'});
    const button=target('檐下红灯笼，点击点亮或熄灭',[x+size*.18,y+size*.12,size*.64,size*.82],()=>{festival.lit=!festival.lit;renderFestival();say(festival.lit?'点亮纸灯，暖光留在檐下。':'纸灯熄灭，红灯笼仍挂在檐下。');});
    const light=el('ellipse',{cx:x+size*.5,cy:y+size*.48,rx:size*.22,ry:size*.25,fill:'url(#festival-paper-light)',class:'festival-lantern-glow','pointer-events':'none'});button.append(light);glows.push(light);
    lanternButtons.push({button,extra});
    const glow=el('ellipse',{cx:x+size*.5,cy:y+size*.49,rx:size*.29,ry:size*.29,fill:'#f0ad4d',class:'festival-lantern-glow'});group.append(glow);glows.push(glow);atlasSprite(group,0,x,y,size);lanternArt.append(group);return group;
  }
  lantern(750,342,52);lantern(921,343,52);lantern(437,319,39);lantern(549,319,39);
  const extraLanterns=el('g');lanternArt.append(extraLanterns);const extraA=lantern(1080,342,44,true),extraB=lantern(1200,345,44,true);extraLanterns.append(extraA,extraB);
  const crackerButton=target('檐下爆竹，点击点响',[937,388,41,91],()=>{
    if(festival.spent&&festival.burstAge===null){festival.rehang();renderFestival();say('重新挂好一串爆竹，再点击可点响。');return;}
    const wet=Number(frame.dataset.weatherAmount||0)>.08;
    if(!festival.ignite(Boolean(winter.playing),wet)){say(!winter.playing?'动景已暂停，播放后可点响爆竹。':wet?'雪还在落，先把引线收在檐下，待雪停再点响。':'爆竹正在响。');return;}
    stopSound();document.dispatchEvent(new CustomEvent('village:firecrackers',{detail:{scene:6,x:957}}));
    renderFestival();wake();say('爆竹声起，红纸屑落在门旁；响完后可重新挂一串。');
  });atlasSprite(crackerArt,1,928,380,62);
  const crackerVisual=el('g',{'pointer-events':'none'});crackerVisual.append(crackerArt,burst);
  const sparks=[],papers=[];
  for(let i=0;i<14;i++){const node=el('path',{stroke:'#e5bb76','stroke-width':1.1,fill:'none'});burst.append(node);sparks.push(node);}
  for(let i=0;i<22;i++){const node=el('path',{d:'M-1-1h3v2h-3Z',fill:i%2?'#aa4a32':'#bc7952',opacity:0});burst.append(node);papers.push(node);}
  decor.append(couplets,lanternArt,crackerVisual);festivalHotspots.append(coupletButton,...lanternButtons.map(item=>item.button),crackerButton);

  const tools=document.createElement('section');tools.className='festival-tools';tools.hidden=true;tools.setAttribute('aria-label','冬居年俗时间');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='festival-toggle';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','festivalPanel');
  const controls=document.createElement('div');controls.id='festivalPanel';controls.className='festival-panel';controls.hidden=true;
  const title=document.createElement('strong');title.textContent='冬居 · 岁末年俗';
  const intro=document.createElement('p');intro.textContent='年俗按农历过，春节与节气不固定对应。这里切换的是年俗小景。';
  const options=document.createElement('div');options.className='festival-options';const stageButtons=[];
  for(const [stage,config]of Object.entries(FESTIVAL_STAGES)){
    const button=document.createElement('button');button.type='button';button.textContent=config.name;button.title=config.period;
    button.addEventListener('click',()=>{stopSound();festival.setStage(stage);renderFestival();say(`年俗小景：${config.period}，${config.name}。`);});options.append(button);stageButtons.push([button,stage]);
  }
  const hint=document.createElement('p');hint.textContent='点门联换字，点灯笼亮灯；除夕可点响爆竹。落雪时先收好引线。';
  const close=document.createElement('button');close.type='button';close.className='festival-close';close.textContent='收起';close.addEventListener('click',()=>{controls.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();});
  controls.append(title,intro,options,hint,close);tools.append(toggle,controls);frame.append(tools);
  for(const eventName of ['pointerdown','pointerup','click'])tools.addEventListener(eventName,event=>event.stopPropagation());
  toggle.addEventListener('click',()=>{controls.hidden=!controls.hidden;toggle.setAttribute('aria-expanded',String(!controls.hidden));});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!controls.hidden){controls.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();event.stopPropagation();}});

  function renderFestival(){
    const config=FESTIVAL_STAGES[festival.stage];decor.dataset.festivalStage=festival.stage;decor.dataset.firecracker=festival.burstAge!==null?'bursting':festival.spent?'spent':'ready';
    toggle.textContent=`冬居年俗 · ${config.name}预览`;
    stageButtons.forEach(([button,stage])=>button.setAttribute('aria-pressed',String(stage===festival.stage)));
    decor.setAttribute('visibility',ready&&config.decorated?'visible':'hidden');
    festivalHotspots.setAttribute('visibility',ready&&config.decorated?'visible':'hidden');
    couplets.style.display=festival.couplets?'':'none';coupletButton.style.display=config.decorated?'':'none';
    coupletButton.setAttribute('aria-label',festival.couplets?'门旁春联，点击换一副':'门旁备好的红笺，点击贴春联');
    coupletButton.querySelector('title').textContent=coupletButton.getAttribute('aria-label');
    const text=festival.coupletVersion?['春到门庭千家喜','福临院落万事兴','迎春纳福','四时如意','五谷丰登']:['一元复始春风暖','万象更新岁月长','岁序更新','春回大地','福满人间'];
    banners.forEach((label,i)=>[...label.children].forEach((span,j)=>span.textContent=text[i][j]||''));
    extraLanterns.style.display=festival.stage==='lantern'?'':'none';
    crackerButton.style.display=config.crackers?'':'none';crackerVisual.style.display=config.crackers?'':'none';crackerArt.setAttribute('opacity',festival.spent?'.18':'1');
    crackerButton.setAttribute('aria-label',festival.burstAge!==null?'爆竹正在响':festival.spent?'爆竹已响完，点击重新挂一串':'檐下爆竹，点击点响');
    crackerButton.querySelector('title').textContent=crackerButton.getAttribute('aria-label');crackerButton.setAttribute('aria-hidden',String(!config.crackers));crackerButton.setAttribute('tabindex',config.crackers?'0':'-1');
    const dark=Number(frame.dataset.weatherDark||0);glows.forEach(glow=>glow.setAttribute('opacity',festival.lit?String(.08+dark*.55):'0'));
    lanternButtons.forEach(({button,extra})=>{const show=!extra||festival.stage==='lantern';button.style.display=show?'':'none';button.setAttribute('aria-hidden',String(!show));button.setAttribute('tabindex',show?'0':'-1');button.setAttribute('aria-pressed',String(festival.lit));});
    if(festival.burstAge===null){sparks.forEach(node=>node.setAttribute('opacity',0));papers.forEach((node,i)=>{node.setAttribute('opacity',festival.spent?'.65':'0');node.setAttribute('transform',`translate(${947+(i%7)*3.1} ${480+Math.floor(i/7)*2}) rotate(${i*29})`);});}
  }
  function drawWheel(){
    for(const spin of[backSpin,frontSpin])spin.setAttribute('transform',`rotate(${wheel.angle.toFixed(2)})`);
    boards.forEach((board,i)=>{const a=i*22.5+wheel.angle,p=[projectWheelPoint(a,-MILL_WHEEL.depth),projectWheelPoint(a+4,-MILL_WHEEL.depth),projectWheelPoint(a+4),projectWheelPoint(a)];board.setAttribute('d',`M${p.map(v=>v.join(' ')).join('L')}Z`);});
    waterInlet.setAttribute('opacity',wheel.enabled?'1':'0');shutter.setAttribute('transform',`translate(0 ${wheel.enabled?407:423})`);
    waterTraces.forEach((line,i)=>line.setAttribute('stroke-dashoffset',(-wheel.angle/360*280-i*7).toFixed(2)));
    drops.forEach((drop,i)=>{const angle=(wheel.angle+i*22.5)%360,t=(wheel.angle/360*8+i*.137)%1;const [x,y]=projectWheelPoint(angle);drop.setAttribute('opacity',angle>6&&angle<78?String((1-t)*.8):'0');drop.setAttribute('transform',`translate(${x+2+t*3} ${y+t*13})`);});
    splash.forEach((ring,i)=>{const t=(wheel.angle/360*12+i/3)%1;ring.setAttribute('rx',(4+t*10).toFixed(2));ring.setAttribute('ry',(1+t*2).toFixed(2));ring.setAttribute('opacity',String(.65*(1-t)));});
    millLayer.dataset.wheelAngle=wheel.angle.toFixed(2);millLayer.dataset.wheelEnabled=String(wheel.enabled);millLayer.dataset.wheelRunning=String(Boolean(mill.playing&&wheel.enabled));
    millLayer.dataset.wheelPlane='vertical';millLayer.dataset.millWater=wheel.enabled?(mill.playing?'flowing':'paused'):'closed';
    millButton.setAttribute('aria-pressed',String(wheel.enabled));millButton.setAttribute('aria-label',wheel.enabled?(mill.playing?'水车正在转动，点击停下':'水车已开启（动景暂停），点击关闭'):'水车已停止，点击开启');
    millButton.querySelector('title').textContent=millButton.getAttribute('aria-label');
  }
  function drawBurst(){
    const age=festival.burstAge;if(age===null)return;
    const pulse=Math.floor(age/.18),y=399+Math.min(pulse,12)*2.8;
    sparks.forEach((node,i)=>{const a=(i*2.4+pulse)*Math.PI/7,len=3+(i%4)*2.4;node.setAttribute('d',`M957 ${y}l${Math.cos(a)*len} ${Math.sin(a)*len}`);node.setAttribute('opacity',reduced.matches?'0':String(.25+Math.sin(age*27+i)*.2));});
    papers.forEach((node,i)=>{const t=Math.max(0,age-i*.055);node.setAttribute('opacity',t>0?'.75':'0');node.setAttribute('transform',`translate(${957+Math.sin(i*7)*Math.min(17,t*11)} ${Math.min(490,400+i*1.7+t*40)}) rotate(${i*29+t*85})`);});
    crackerArt.setAttribute('opacity',String(Math.max(.12,1-age/2.3)));
  }
  let ready=false,raf=0,previous=0;
  function needsFrame(){return ready&&(mill.playing&&wheel.enabled||winter.playing&&festival.burstAge!==null);}
  function wake(){if(!raf&&needsFrame())raf=requestAnimationFrame(tick);}
  function tick(now){
    raf=0;if(previous&&now-previous<32){wake();return;}
    const delta=previous?Math.min(.1,(now-previous)/1000):0;previous=now;
    const wasBurst=festival.burstAge!==null;wheel.step(delta,mill.playing);festival.step(delta,winter.playing);
    if(mill.playing)drawWheel();if(festival.burstAge!==null)drawBurst();else if(wasBurst)renderFestival();wake();
  }
  function sync(){
    drawWheel();const winterVisible=winter.inView&&winter.panel.dataset.state==='loaded'&&!document.documentElement.classList.contains('is-studying');tools.hidden=!winterVisible;
    if(!winterVisible){controls.hidden=true;toggle.setAttribute('aria-expanded','false');}
    if(!winter.playing){festival.step(0,false);stopSound();renderFestival();}
    if(!needsFrame()){cancelAnimationFrame(raf);raf=0;previous=0;}else wake();
  }
  new MutationObserver(sync).observe(winter.svg,{attributes:true,attributeFilter:['data-motion-state']});
  new MutationObserver(sync).observe(mill.svg,{attributes:true,attributeFilter:['data-motion-state']});
  new MutationObserver(renderFestival).observe(frame,{attributes:true,attributeFilter:['data-weather-dark']});
  document.addEventListener('scroll:motion',sync);document.addEventListener('study:open',sync);
  function load(file){return new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=file;});}
  Promise.all(['assets/scroll/effects/mechanical/watermill-clean-v1.png',rotor,'assets/scroll/effects/festival/newyear-props-v1.png'].map(load)).then(()=>{ready=true;millLayer.dataset.wheelReady='true';millLayer.setAttribute('visibility','visible');renderFestival();sync();}).catch(()=>say('水车或年俗素材暂未载入，请刷新重试。'));
}
