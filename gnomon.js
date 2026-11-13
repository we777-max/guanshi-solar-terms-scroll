import { TERMS, PLACES, getCycle, observeNoon, GNOMON_HEIGHT, DATUM_Y, formatInstant, formatClock, formatDaylight } from './src/solar-model.js?v=0.2.0';

const $ = selector => document.querySelector(selector);
const stage = $('#modelStage'), rail = $('#termRail');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = { year: Math.max(2024,Math.min(2030,new Date().getFullYear())), index:3, place:PLACES[0], comparing:false, playing:false };
let sceneView = null, cycleTimer = 0;
const colors = ['#9aa98c','#8aab9f','#b99b70','#a4b0b7'];

for (let year=2024;year<=2030;year+=1) {
  const option=document.createElement('option');
  option.value=year;
  option.textContent=`${year}立春—次年大寒`;
  option.selected=year===state.year;
  $('#yearSelect').append(option);
}
const termButtons=TERMS.map((name,index)=> {
  const button=document.createElement('button');
  button.type='button';
  button.textContent=name;
  button.dataset.term=index;
  button.style.setProperty('--season-color',colors[Math.floor(index/6)]);
  button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>choose(index));
  button.addEventListener('keydown',event=> {
    let next;
    if (event.key==='ArrowRight') next=(index+1)%24;
    else if (event.key==='ArrowLeft') next=(index+23)%24;
    else if (event.key==='Home') next=0;
    else if (event.key==='End') next=23;
    else return;
    event.preventDefault(); choose(next); termButtons[next].focus({preventScroll:true});
  });
  rail.append(button);
  return button;
});
function stopCycle() {
  window.clearInterval(cycleTimer); cycleTimer=0; state.playing=false;
  $('#cyclePlay').setAttribute('aria-pressed','false');
  $('#playLabel').textContent='巡览四时'; $('#playSymbol').textContent='▷';
}
function choose(index,manual=true,scroll=true) {
  if (manual) stopCycle();
  state.index=index;
  state.cycle=getCycle(state.year);
  const term=state.cycle[index], result=observeNoon(term,state.place);
  state.observation=result;
  state.comparison={summer:observeNoon(state.cycle[9],state.place),winter:observeNoon(state.cycle[21],state.place)};
  $('#selectedTerm').textContent=term.name;
  $('#seasonLabel').textContent=`${term.season} · 第${index+1}气`;
  $('#longitudeValue').textContent=`黄经 ${term.longitude}°`;
  $('#stageTerm').textContent=`${term.name} · 正午`;
  $('#stagePlace').textContent=`${state.place.name} · 北纬${state.place.latitude}°`;
  $('#shadowValue').textContent=result.shadowLength.toFixed(2);
  $('#altitudeValue').textContent=result.altitude.toFixed(2);
  $('#daylightValue').textContent=formatDaylight(result.daylightMinutes);
  $('#termInstant').textContent=formatInstant(term.instant,true);
  $('#noonInstant').textContent=`${formatClock(result.noon)}（太阳上中天）`;
  $('#shadowDescription').textContent=result.onRuler?'日影沿圭面向北展开':'影端超出圭面，数值为水平面投影';
  $('#shadowCalloutValue').textContent=`${result.shadowLength.toFixed(2)} 米`;
  $('#summerShadow').textContent=`${state.comparison.summer.shadowLength.toFixed(2)}米`;
  $('#winterShadow').textContent=`${state.comparison.winter.shadowLength.toFixed(2)}米`;
  $('#modelCanvas').setAttribute('aria-label',`${state.place.name}${term.name}正午，三维圭表高2米，日影${result.shadowLength.toFixed(2)}米，太阳高度${result.altitude.toFixed(2)}度`);
  termButtons.forEach((button,i)=> {
    button.setAttribute('aria-pressed',String(i===index));
    if (i===index) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current');
  });
  if (scroll) rail.scrollTo({left:termButtons[index].offsetLeft-(rail.clientWidth-termButtons[index].clientWidth)/2,behavior:reduced.matches?'auto':'smooth'});
  sceneView?.update(result,state.comparison,state.comparing);
  $('#labStatus').textContent=`${state.place.name}，${term.name}正午，影长${result.shadowLength.toFixed(2)}米。`;
}
$('#placeSelect').addEventListener('change',()=> { state.place=PLACES.find(place=>place.id===$('#placeSelect').value); choose(state.index); });
$('#yearSelect').addEventListener('change',()=> { state.year=Number($('#yearSelect').value); choose(state.index); });
$('#compareToggle').addEventListener('click',()=> {
  state.comparing=!state.comparing;
  $('#compareToggle').setAttribute('aria-pressed',String(state.comparing));
  $('#compareToggle .compare-symbol').textContent=state.comparing?'－':'＋';
  $('#compareReadings').hidden=!state.comparing;
  sceneView?.update(state.observation,state.comparison,state.comparing);
});
$('#cyclePlay').addEventListener('click',()=> {
  if (state.playing) { stopCycle(); return; }
  state.playing=true;
  $('#cyclePlay').setAttribute('aria-pressed','true');
  $('#playLabel').textContent='停止巡览'; $('#playSymbol').textContent='Ⅱ';
  cycleTimer=window.setInterval(()=>choose((state.index+1)%24,false),1600);
});
document.addEventListener('visibilitychange',()=> { if (document.hidden) stopCycle(); });
$('#modelRetry').addEventListener('click',()=>window.location.reload());
choose(3,false,false);

function showFallback(error) {
  console.error('Gnomon 3D view unavailable:',error);
  stage.dataset.state='fallback'; stage.setAttribute('aria-busy','false');
  $('#modelLoadState').hidden=false;
  $('#modelLoadText').textContent='当前显示模型静帧；右侧观测数据仍可切换。重新展开可重试三维视图。';
  $('#modelRetry').hidden=false;
  $('#gnomonLabel').hidden=true; $('#shadowLabel').hidden=true;
  $('#viewHelp').textContent='模型静帧 · 数值可交互';
  for (const id of ['cameraOblique','cameraTop','cameraReset']) $(`#${id}`).disabled=true;
}
async function createScene() {
  const THREE=await import('three');
  const [{OrbitControls},{GLTFLoader}]=await Promise.all([import('three/addons/controls/OrbitControls.js'),import('three/addons/loaders/GLTFLoader.js')]);
  const mount=$('#modelCanvas');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,window.matchMedia('(max-width:767px)').matches?1.3:1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  mount.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#e3e5d8'); scene.fog=new THREE.Fog('#e3e5d8',26,65);
  const camera=new THREE.PerspectiveCamera(36,1,.1,90);
  const target=new THREE.Vector3(0,.6,-2.2);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.copy(target); controls.enableDamping=!reduced.matches; controls.dampingFactor=.08;
  controls.enablePan=false; controls.minDistance=6; controls.maxDistance=30;
  controls.minPolarAngle=.035; controls.maxPolarAngle=Math.PI*.475;
  scene.add(new THREE.HemisphereLight('#fff8e4','#89917d',1.8));
  const sun=new THREE.DirectionalLight('#fff3d4',3);
  sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:35});
  sun.shadow.bias=-.00012; sun.shadow.normalBias=.004;
  sun.target.position.set(0,DATUM_Y,0); scene.add(sun,sun.target);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:'#dce0ce',roughness:1}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.005; floor.receiveShadow=true; scene.add(floor);
  const gltf=await new GLTFLoader().loadAsync('assets/gnomon/gnomon-v1.glb');
  gltf.scene.traverse(object=> {
    if (!object.isMesh) return;
    // The measuring instrument casts the teaching shadow; the flush platform
    // stays a receiver to avoid self-shadow striping on coplanar stone faces.
    object.castShadow=object.userData.role==='gnomon';
    object.receiveShadow=true;
  });
  scene.add(gltf.scene);
  const sunMarker=new THREE.Mesh(new THREE.SphereGeometry(.105,20,12),new THREE.MeshBasicMaterial({color:'#cfaa63'})); scene.add(sunMarker);
  const lightRay=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#ac965c',transparent:true,opacity:.42})); scene.add(lightRay);
  const tipMarker=new THREE.Mesh(new THREE.RingGeometry(.062,.083,32),new THREE.MeshBasicMaterial({color:'#8e6145',side:THREE.DoubleSide})); tipMarker.rotation.x=-Math.PI/2; scene.add(tipMarker);
  const measure=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#9a7758',transparent:true,opacity:.6})); scene.add(measure);
  const comparisonGroup=new THREE.Group(); scene.add(comparisonGroup);
  const comparisonLines=[0xaa8554,0x798ca1].map(color=> {
    const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({color,dashSize:.075,gapSize:.055,transparent:true,opacity:.9})); comparisonGroup.add(line); return line;
  });
  let dirty=true, cameraMotion=null, lastObservation=state.observation, currentPreset='oblique', userAdjusted=false;
  const postTop=new THREE.Vector3(0,DATUM_Y+GNOMON_HEIGHT,0);
  const labelPoints=[[$('#gnomonLabel'),postTop.clone(),-25,-5],[$('#shadowLabel'),new THREE.Vector3(),18,0]];
  function linePoints(line,points) { line.geometry.dispose(); line.geometry=new THREE.BufferGeometry().setFromPoints(points); }
  function update(observation,comparison,visible) {
    lastObservation=observation;
    const direction=new THREE.Vector3(observation.sunDirection.x,observation.sunDirection.y,observation.sunDirection.z);
    sun.position.copy(direction).multiplyScalar(14).add(sun.target.position);
    sunMarker.position.copy(direction).multiplyScalar(2.7).add(postTop);
    const tip=new THREE.Vector3(observation.shadowTip.x,DATUM_Y+.009,observation.shadowTip.z);
    tipMarker.position.copy(tip); labelPoints[1][1].copy(tip);
    linePoints(lightRay,[sunMarker.position.clone(),postTop.clone(),tip.clone()]);
    linePoints(measure,[new THREE.Vector3(.22,DATUM_Y+.009,0),new THREE.Vector3(.22,DATUM_Y+.009,tip.z)]);
    [comparison.summer,comparison.winter].forEach((value,index)=> {
      const x=index===0?-.16:.16;
      linePoints(comparisonLines[index],[new THREE.Vector3(x,DATUM_Y+.012,0),new THREE.Vector3(x,DATUM_Y+.012,value.shadowTip.z)]);
      comparisonLines[index].computeLineDistances();
    });
    comparisonGroup.visible=visible; dirty=true;
  }
  function viewPosition(mode) {
    const aspect=mount.clientWidth/Math.max(1,mount.clientHeight), scale=1.2*Math.max(1,.95/aspect);
    const offset=mode==='top'?new THREE.Vector3(.015,14,3):new THREE.Vector3(6.5,6.4,10);
    return offset.multiplyScalar(scale).add(target);
  }
  function setView(mode,instant=false) {
    currentPreset=mode; userAdjusted=false;
    const end=viewPosition(mode);
    $('#cameraOblique').setAttribute('aria-pressed',String(mode==='oblique'));
    $('#cameraTop').setAttribute('aria-pressed',String(mode==='top'));
    if (reduced.matches||instant) { camera.position.copy(end); controls.target.copy(target); cameraMotion=null; }
    else cameraMotion={start:camera.position.clone(),end,started:performance.now()};
    dirty=true;
  }
  controls.addEventListener('change',()=> { dirty=true; });
  controls.addEventListener('start',()=> { cameraMotion=null; userAdjusted=true; $('#cameraOblique').setAttribute('aria-pressed','false'); $('#cameraTop').setAttribute('aria-pressed','false'); });
  $('#cameraOblique').addEventListener('click',()=>setView('oblique'));
  $('#cameraTop').addEventListener('click',()=>setView('top'));
  $('#cameraReset').addEventListener('click',()=>setView('oblique'));
  reduced.addEventListener('change',()=> { controls.enableDamping=!reduced.matches; dirty=true; });
  function resize() {
    const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);
    camera.aspect=width/height; camera.updateProjectionMatrix(); renderer.setSize(width,height,false); dirty=true;
    if (!userAdjusted) setView(currentPreset,true);
  }
  new ResizeObserver(resize).observe(mount); resize(); setView('oblique',true); controls.update();
  update(state.observation,state.comparison,state.comparing);
  renderer.domElement.addEventListener('webglcontextlost',event=> { event.preventDefault(); stopCycle(); renderer.setAnimationLoop(null); showFallback(new Error('WebGL context lost')); });
  renderer.setAnimationLoop(time=> {
    if (document.hidden) return;
    if (cameraMotion) {
      const t=Math.min(1,(time-cameraMotion.started)/650);
      camera.position.lerpVectors(cameraMotion.start,cameraMotion.end,1-(1-t)**3); controls.target.copy(target); dirty=true;
      if (t===1) cameraMotion=null;
    }
    const changed=controls.update();
    if (!dirty&&!changed) return;
    renderer.render(scene,camera);
    for (const [node,point,dx,dy] of labelPoints) {
      const p=point.clone().project(camera);
      node.hidden=p.z>1||p.z<-1||Math.abs(p.x)>.96||Math.abs(p.y)>.9||(node.id==='gnomonLabel'&&lastObservation.shadowLength<.65);
      node.style.left=`${(p.x*.5+.5)*mount.clientWidth+dx}px`; node.style.top=`${(-p.y*.5+.5)*mount.clientHeight+dy}px`;
    }
    dirty=false;
  });
  stage.dataset.state='ready'; stage.setAttribute('aria-busy','false'); $('#modelLoadState').hidden=true;
  return {update};
}
createScene().then(view=> { sceneView=view; }).catch(showFallback);
