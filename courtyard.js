import { TERMS, PLACES, getCycle, observeNoon, formatDaylight, formatClock, formatInstant } from './src/solar-model.js';
import { GROUND_Y, EYE_HEIGHT, GNOMON, WALK_START, GNOMON_APPROACH } from './src/courtyard-layout.js';
import { moveOnGround, planWalkPath } from './src/courtyard-navigation.js';

const $ = selector => document.querySelector(selector);
const stage = $('#courtyardStage');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const termArgument = Number(new URLSearchParams(window.location.search).get('term') || 0);
const state = { term: Number.isInteger(termArgument) && termArgument >= 0 && termArgument < 24 ? termArgument : 0, year: Math.max(2024, Math.min(2030, new Date().getFullYear())), place: PLACES[0] };
let sceneView = null;

TERMS.forEach((name, index) => {
  const option = document.createElement('option');
  option.value = index; option.textContent = name; option.selected = index === state.term;
  $('#termSelect').append(option);
});
for (let year = 2024; year <= 2030; year += 1) {
  const option = document.createElement('option');
  option.value = year; option.textContent = `${year} 立春—次年大寒`; option.selected = year === state.year;
  $('#yearSelect').append(option);
}
function announce(message) { $('#courtStatus').textContent = message; }
function observation(open, focus = false) {
  $('#courtObservation').hidden = !open;
  $('#observationToggle').setAttribute('aria-expanded', String(open));
  document.body.dataset.observation = open ? 'open' : 'closed';
  if (focus) (open ? $('#termSelect') : $('#observationToggle')).focus({ preventScroll: true });
}
function chooseTerm() {
  const term = getCycle(state.year)[state.term];
  const result = observeNoon(term, state.place, GNOMON.height);
  state.observation = result;
  $('#currentTermBadge').textContent = term.name;
  $('#observationTitle').textContent = `${term.name} · 正午`;
  $('#observationPlace').textContent = state.place.name;
  $('#shadowLength').textContent = result.shadowLength.toFixed(2);
  $('#sunAltitude').textContent = `${result.altitude.toFixed(2)}°`;
  $('#dayLength').textContent = formatDaylight(result.daylightMinutes);
  $('#observationTime').textContent = `当日太阳正午：${formatClock(result.noon)}`;
  $('#termTime').textContent = `交节：${formatInstant(term.instant, true)}；黄经 ${term.longitude}°`;
  sceneView?.updateSun(result);
}
$('#termSelect').addEventListener('change', () => { state.term = Number($('#termSelect').value); chooseTerm(); announce(`已切换${TERMS[state.term]}正午日影，影长${state.observation.shadowLength.toFixed(2)}米。`); });
$('#placeSelect').addEventListener('change', () => { state.place = PLACES.find(place => place.id === $('#placeSelect').value); chooseTerm(); });
$('#yearSelect').addEventListener('change', () => { state.year = Number($('#yearSelect').value); chooseTerm(); });
$('#observationToggle').addEventListener('click', () => observation(true, true));
$('#closeObservation').addEventListener('click', () => observation(false, true));
$('#helpToggle').addEventListener('click', () => {
  const open = $('#helpPanel').hidden;
  $('#helpPanel').hidden = !open;
  $('#helpToggle').setAttribute('aria-expanded', String(open));
});
$('#helpClose').addEventListener('click', () => { $('#helpPanel').hidden = true; $('#helpToggle').setAttribute('aria-expanded', 'false'); $('#helpToggle').focus(); });
$('#retryScene').addEventListener('click', () => window.location.reload());
chooseTerm();

async function enterCourtyard() {
  const THREE = await import('three');
  const [{ OrbitControls }, { GLTFLoader }, { RoomEnvironment }, { createCourtyard }] = await Promise.all([
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/environments/RoomEnvironment.js'),
    import('./src/courtyard-scene.js'),
  ]);
  const mount = $('#courtyardCanvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.25 : 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  mount.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e5d7b8');
  scene.fog = new THREE.Fog('#e5d7b8', 24, 90);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .05).texture;
  scene.environmentIntensity = .22;
  room.dispose(); pmrem.dispose();
  // Let sunlight dominate the fill so cast shadows remain legible on pale
  // plaster and paving, while the warm sky still reveals unlit surfaces.
  scene.add(new THREE.HemisphereLight('#fff0d2', '#8c896b', .65));
  const sun = new THREE.DirectionalLight('#fff0d1', 3.2);
  sun.castShadow = true;
  const shadowSize = Math.min(renderer.capabilities.maxTextureSize, window.innerWidth < 700 ? 2048 : 4096);
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: .1, far: 65 });
  sun.shadow.bias = -.000035;
  sun.shadow.normalBias = .0015;
  sun.shadow.radius = .75;
  sun.target.position.set(GNOMON.x, GNOMON.y + GNOMON.datum, GNOMON.z - 1.7);
  scene.add(sun, sun.target);

  const [courtyard, gltf] = await Promise.all([
    createCourtyard(renderer),
    new GLTFLoader().loadAsync('assets/courtyard/guibiao-aged-v2.glb'),
  ]);
  scene.add(courtyard.group);
  const model = gltf.scene;
  model.position.set(GNOMON.x, GNOMON.y, GNOMON.z);
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      // These closed solids were exported as double-sided. Casting their back
      // faces avoids stippled self-shadowing on the broad stone measuring face.
      material.shadowSide = THREE.BackSide;
      if (material.map) material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    }
  });
  scene.add(model);
  const tip = new THREE.Mesh(new THREE.RingGeometry(.045, .065, 24), new THREE.MeshBasicMaterial({ color: '#95673e', side: THREE.DoubleSide, depthWrite: false }));
  tip.rotation.x = -Math.PI / 2;
  scene.add(tip);
  const destination = new THREE.Mesh(new THREE.RingGeometry(.12, .15, 24), new THREE.MeshBasicMaterial({ color: '#c2a16b', side: THREE.DoubleSide, transparent: true, opacity: .8, depthWrite: false }));
  destination.rotation.x = -Math.PI / 2;
  destination.visible = false;
  scene.add(destination);

  const camera = new THREE.PerspectiveCamera(55, 1, .06, 180);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 12; controls.maxDistance = 48;
  controls.minPolarAngle = .18; controls.maxPolarAngle = Math.PI * .46;
  let mode = 'walk', yaw = 0, pitch = -.1;
  let savedWalk = { x: WALK_START.x, z: WALK_START.z, yaw: 0, pitch: -.1 };
  let path = [], faceGnomonOnArrival = false, drag = null;
  let previousTime = 0, elapsed = 0, lastRenderTime = 0;
  const held = new Set();
  const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  const hotspotPoint = new THREE.Vector3(GNOMON.x, GNOMON.y + GNOMON.datum + GNOMON.height + .28, GNOMON.z);
  const cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const hotspot = $('#gnomonHotspot');

  function lookAt(x, y, z) {
    const dx = x - camera.position.x, dz = z - camera.position.z;
    yaw = Math.atan2(-dx, -dz);
    pitch = Math.atan2(y - camera.position.y, Math.hypot(dx, dz));
    updateLook();
  }
  function updateLook() { camera.quaternion.setFromEuler(cameraEuler.set(pitch, yaw, 0, 'YXZ')); }
  function setMode(next, restore = true) {
    if (mode === 'walk' && next !== 'walk') savedWalk = { x: camera.position.x, z: camera.position.z, yaw, pitch };
    mode = next;
    held.clear(); path = []; destination.visible = false;
    controls.enabled = next === 'overview';
    if (next === 'overview') {
      controls.target.set(-.9, 1, -1);
      camera.position.set(16, 15, 20);
      controls.update();
    } else {
      const pose = restore ? savedWalk : WALK_START;
      camera.position.set(pose.x, GROUND_Y + EYE_HEIGHT, pose.z);
      if (restore) { yaw = pose.yaw; pitch = pose.pitch; updateLook(); }
      else lookAt(WALK_START.targetX, WALK_START.targetY, WALK_START.targetZ);
    }
    document.body.dataset.mode = next;
    stage.dataset.view = next;
    $('#walkView').setAttribute('aria-pressed', String(next === 'walk'));
    $('#overviewView').setAttribute('aria-pressed', String(next === 'overview'));
    $('#walkHelp').textContent = next === 'walk' ? '拖动环顾 · WASD 行走 · 点石地移步' : '拖动俯看庭院 · 滚轮缩放 · 可返回院中漫游';
    render();
  }
  function beginWalk(target, faceGnomon = false) {
    if (mode !== 'walk') setMode('walk');
    path = planWalkPath(camera.position, target);
    faceGnomonOnArrival = faceGnomon;
    if (!path.length) { announce('请点院内空处，沿石铺地行走。'); return; }
    destination.position.set(target.x, GROUND_Y + .009, target.z);
    destination.visible = true;
    held.clear();
    announce(faceGnomon ? '沿石地走近圭表。' : '正在沿石铺地移步。');
  }
  function approach() {
    beginWalk(GNOMON_APPROACH, true);
    observation(true);
    mount.focus({ preventScroll: true });
  }
  function render() {
    camera.updateMatrixWorld();
    const projected = hotspotPoint.clone().project(camera);
    hotspot.hidden = projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > .96 || Math.abs(projected.y) > .84;
    if (!hotspot.hidden) {
      hotspot.style.left = `${(projected.x * .5 + .5) * mount.clientWidth}px`;
      hotspot.style.top = `${(-projected.y * .5 + .5) * mount.clientHeight}px`;
    }
    const northYaw = mode === 'walk' ? yaw : Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
    $('#northNeedle').style.transform = `rotate(${-northYaw * 180 / Math.PI}deg)`;
    stage.dataset.cameraX = camera.position.x.toFixed(2);
    stage.dataset.cameraZ = camera.position.z.toFixed(2);
    stage.dataset.navigation = path.length ? 'moving' : 'idle';
    renderer.render(scene, camera);
  }
  function updateSun(result) {
    sun.position.set(result.sunDirection.x, result.sunDirection.y, result.sunDirection.z).multiplyScalar(28).add(sun.target.position);
    tip.position.set(GNOMON.x + result.shadowTip.x, GNOMON.y + GNOMON.datum + .006, GNOMON.z + result.shadowTip.z);
    render();
  }
  function tick(timeMs) {
    const dt = Math.min((timeMs - (previousTime || timeMs)) / 1000, .05);
    previousTime = timeMs;
    elapsed += dt;
    let moving = false;
    if (mode === 'walk') {
      const forward = Number(held.has('KeyW') || held.has('ArrowUp') || held.has('forward')) - Number(held.has('KeyS') || held.has('ArrowDown') || held.has('back'));
      const side = Number(held.has('KeyD') || held.has('ArrowRight') || held.has('right')) - Number(held.has('KeyA') || held.has('ArrowLeft') || held.has('left'));
      if (forward || side) {
        path = []; destination.visible = false;
        const length = Math.hypot(forward, side), speed = 1.8 * dt / length;
        const delta = { x: (-Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed, z: (-Math.cos(yaw) * forward - Math.sin(yaw) * side) * speed };
        const next = moveOnGround(camera.position, delta);
        camera.position.x = next.x; camera.position.z = next.z;
        moving = true;
      } else if (path.length) {
        const target = path[0], dx = target.x - camera.position.x, dz = target.z - camera.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < .07) {
          path.shift();
          if (!path.length) {
            destination.visible = false;
            if (faceGnomonOnArrival) lookAt(GNOMON.x, GNOMON.y + 1.12, GNOMON.z);
            announce(faceGnomonOnArrival ? '已走近圭表，可切换节气比较正午日影。' : '已行至所选位置。');
          }
        } else {
          const step = Math.min(1.8 * dt, distance), next = moveOnGround(camera.position, { x: dx / distance * step, z: dz / distance * step });
          if (Math.hypot(next.x - camera.position.x, next.z - camera.position.z) < .0001 && dt > 0) { path = []; destination.visible = false; }
          camera.position.x = next.x; camera.position.z = next.z;
          const desiredYaw = Math.atan2(-dx, -dz);
          const difference = Math.atan2(Math.sin(desiredYaw - yaw), Math.cos(desiredYaw - yaw));
          yaw += difference * Math.min(1, dt * 5);
          updateLook();
          moving = true;
        }
      }
    }
    courtyard.animate(elapsed, !reduced.matches);
    if (moving || timeMs - lastRenderTime > 40) { render(); lastRenderTime = timeMs; }
  }

  $('#walkView').addEventListener('click', () => { setMode('walk'); mount.focus({ preventScroll: true }); });
  $('#overviewView').addEventListener('click', () => { setMode('overview'); mount.focus({ preventScroll: true }); });
  $('#approachGnomon').addEventListener('click', approach);
  hotspot.addEventListener('click', approach);
  controls.addEventListener('change', () => { if (mode === 'overview') render(); });
  const movementCodes = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!$('#helpPanel').hidden) { $('#helpPanel').hidden = true; $('#helpToggle').setAttribute('aria-expanded', 'false'); }
      else if (!$('#courtObservation').hidden) observation(false, true);
      else if (mode === 'overview') setMode('walk');
      return;
    }
    if (event.target.closest?.('input,select,textarea')) return;
    if (movementCodes.has(event.code) && mode === 'walk') { event.preventDefault(); held.add(event.code); }
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  window.addEventListener('blur', () => { held.clear(); drag = null; });
  for (const button of document.querySelectorAll('[data-move]')) {
    const stop = () => { held.delete(button.dataset.move); button.classList.remove('is-held'); };
    button.addEventListener('pointerdown', event => {
      if (mode !== 'walk') return;
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      held.add(button.dataset.move); button.classList.add('is-held');
      mount.focus({ preventScroll: true });
    });
    button.addEventListener('pointerup', stop); button.addEventListener('pointercancel', stop); button.addEventListener('lostpointercapture', stop);
    button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); held.add(button.dataset.move); } });
    button.addEventListener('keyup', stop); button.addEventListener('blur', stop);
  }
  renderer.domElement.addEventListener('pointerdown', event => {
    if (mode !== 'walk' || !event.isPrimary || event.button !== 0) return;
    mount.focus({ preventScroll: true });
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId || mode !== 'walk') return;
    const dx = event.clientX - drag.lastX, dy = event.clientY - drag.lastY;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 5) drag.moved = true;
    if (drag.moved) { yaw -= dx * .003; pitch = Math.max(-.85, Math.min(.7, pitch - dy * .003)); path = []; destination.visible = false; updateLook(); render(); }
    drag.lastX = event.clientX; drag.lastY = event.clientY;
  });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    if (moved || mode !== 'walk') return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.intersectObject(model, true).length) { approach(); return; }
    const hit = raycaster.intersectObject(courtyard.ground)[0];
    if (hit) beginWalk(hit.point);
  });
  renderer.domElement.addEventListener('pointercancel', () => { drag = null; });
  renderer.domElement.addEventListener('lostpointercapture', () => { drag = null; });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); held.clear(); renderer.setAnimationLoop(null); showFallback();
  });
  new ResizeObserver(() => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    render();
  }).observe(mount);
  document.addEventListener('visibilitychange', () => {
    held.clear();
    previousTime = 0;
    renderer.setAnimationLoop(document.hidden ? null : tick);
  });
  window.addEventListener('pagehide', () => { held.clear(); renderer.setAnimationLoop(null); });
  window.addEventListener('pageshow', () => { previousTime = 0; renderer.setAnimationLoop(tick); });
  setMode('walk', false);
  sceneView = { updateSun };
  updateSun(state.observation);
  renderer.setSize(mount.clientWidth, mount.clientHeight, false);
  render();
  stage.dataset.state = 'ready'; stage.setAttribute('aria-busy', 'false');
  $('#courtyardLoading').setAttribute('aria-hidden', 'true');
  document.querySelectorAll('button').forEach(button => { button.disabled = false; });
  renderer.setAnimationLoop(tick);
  announce('已进入春卷庭院。拖动画面环顾，使用方向键行走，也可点击石铺地移步。');
}

function showFallback(error) {
  if (error) console.error('Courtyard unavailable:', error);
  stage.dataset.state = 'error'; stage.setAttribute('aria-busy', 'false');
  $('#loadTitle').textContent = '庭院暂未展开';
  $('#loadMessage').textContent = '当前保留春卷画面，可以重新进入，或返回长卷。';
  $('#retryScene').hidden = false;
  $('#gnomonHotspot').hidden = true;
  for (const button of document.querySelectorAll('.court-actions button, [data-move]')) button.disabled = true;
  $('#observationToggle').disabled = false;
}
enterCourtyard().catch(showFallback);
