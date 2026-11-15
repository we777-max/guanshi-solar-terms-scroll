import * as THREE from 'three';
import { GROUND_Y } from './courtyard-layout.js';

// Walkable architecture is real geometry. Only the distant landscape uses the
// existing painting, wrapped far outside the courtyard to continue its world.
export async function createCourtyard(renderer) {
  const loader = new THREE.TextureLoader();
  const [atlas, landscape] = await Promise.all([
    loader.loadAsync('assets/guibiao/courtyard/material-atlas-v1.png'),
    loader.loadAsync('assets/scroll/backgrounds/spring.png'),
  ]);
  atlas.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  group.name = 'Spring painting courtyard';
  let seed = 241114;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  function surface(x, y, color, roughness = .96) {
    const map = atlas.clone();
    map.repeat.set(.49, .49);
    map.offset.set(x * .5 + .005, y * .5 + .005);
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, color, roughness });
  }
  const plaster = surface(0, 1, '#eee5ce');
  const clay = surface(1, 1, '#a49e8e');
  const timber = surface(0, 0, '#b7a78b');
  const stone = surface(1, 0, '#ded7c5');
  const darkWood = surface(0, 0, '#74664f');
  const dryThatch = surface(0, 0, '#b6aa80');
  const earth = surface(1, 0, '#b7ab8b');
  const ink = new THREE.LineBasicMaterial({ color: '#66583f', transparent: true, opacity: .36 });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);

  function box(name, position, size, material, outline = false, parent = group) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...size);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (outline) {
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(unitBox), ink);
      mesh.add(line);
    }
    return mesh;
  }

  function instances(geometry, material, placements, name, cast = true) {
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
    mesh.name = name;
    for (let i = 0; i < placements.length; i += 1) {
      const item = placements[i];
      dummy.position.copy(item.position);
      dummy.quaternion.copy(item.quaternion ?? new THREE.Quaternion());
      dummy.scale.copy(item.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setScalar(item.tone ?? 1));
    }
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function stick(a, b, radius, tone = 1) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    return { position: start.clone().add(end).multiplyScalar(.5), quaternion: new THREE.Quaternion().setFromUnitVectors(up, end.clone().sub(start).normalize()), scale: new THREE.Vector3(radius, start.distanceTo(end), radius), tone };
  }

  // Raised, stone-paved terrace and its river-facing steps.
  box('Earth below the village', [0, -.23, -26.2], [95, .3, 67], new THREE.MeshStandardMaterial({ color: '#b7aa8b', roughness: 1 }));
  const soil = [];
  for (let row = 0; row < 17; row += 1) for (let col = 0; col < 24; col += 1) {
    soil.push({ position: new THREE.Vector3(-47.5 + (col + .5) * 95 / 24, -.078, -59.7 + (row + .5) * 67 / 17), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), scale: new THREE.Vector3(95 / 24 + .001, 67 / 17 + .001, 1) });
  }
  instances(new THREE.PlaneGeometry(1, 1), earth, soil, 'Fine-grained earth continuing around the courtyard', false);
  box('Stone terrace foundation', [0, .13, -1.1], [14.2, .34, 11.6], stone);
  const paving = [];
  for (let row = 0; row < 16; row += 1) for (let col = 0; col < 14; col += 1) {
    paving.push({ position: new THREE.Vector3(-6.83 + col * .976 + .48, GROUND_Y - .035, -6.77 + row * .708 + .35), scale: new THREE.Vector3(.958, .07, .69), tone: .91 + random() * .15 });
  }
  instances(unitBox, stone, paving, 'Individual stone paving slabs', false);
  const foundation = [];
  for (let row = 0; row < 2; row += 1) for (let i = 0; i < 25; i += 1) {
    foundation.push({ position: new THREE.Vector3(-7.0 + (i + .5) * .56, -.03 + row * .18, 4.72), scale: new THREE.Vector3(.54, .17, .24), tone: .78 + random() * .2 });
  }
  instances(unitBox, stone, foundation, 'Front retaining wall blocks');
  for (let i = 0; i < 3; i += 1) box('Terrace step', [.1, GROUND_Y - .065 - i * .13, 4.83 + i * .34], [2.9, .13, .36], stone, true);

  function roof(cx, cz, halfWidth, halfLength, eave, rise, material = clay) {
    const segments = 16, rows = 12, positions = [], uv = [], indices = [];
    const roofY = x => eave + rise * (1 - Math.pow(Math.abs(x) / halfWidth, .8)) + .12 * Math.pow(Math.abs(x) / halfWidth, 8);
    for (let j = 0; j <= rows; j += 1) for (let i = 0; i <= segments; i += 1) {
      const x = -halfWidth + 2 * halfWidth * i / segments;
      const z = -halfLength + 2 * halfLength * j / rows;
      positions.push(cx + x, roofY(x), cz + z);
      uv.push(i / segments, j / rows);
      if (j < rows && i < segments) {
        const a = j * (segments + 1) + i, b = a + segments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const roofMat = material.clone();
    roofMat.side = THREE.DoubleSide;
    const top = new THREE.Mesh(geometry, roofMat);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);
    const channels = [];
    for (let z = -halfLength; z <= halfLength; z += .2) for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i += 1) {
        const x1 = side * halfWidth * i / 6, x2 = side * halfWidth * (i + 1) / 6;
        channels.push(stick([cx + x1, roofY(x1) + .025, cz + z], [cx + x2, roofY(x2) + .025, cz + z], .037, .8 + random() * .25));
      }
    }
    instances(new THREE.CylinderGeometry(1, 1, 1, 6), material, channels, 'Curved rows of grey clay tiles');
    box('Roof ridge', [cx, eave + rise + .065, cz], [.2, .13, halfLength * 2 + .24], material, true);
    for (const side of [-1, 1]) {
      box('Eave beam', [cx + side * halfWidth, eave + .02, cz], [.12, .16, halfLength * 2 + .15], darkWood, true);
      const points = [];
      for (let i = 0; i <= 16; i += 1) {
        const x = -halfWidth + i * halfWidth / 8;
        points.push(new THREE.Vector3(cx + x, roofY(x), cz + side * halfLength));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ink));
    }
  }

  // Main timber house on the west, with a verandah facing the open courtyard.
  box('West house stone plinth', [-9.1, .26, -1.6], [5.5, .68, 9.2], stone, true);
  box('West house earthen walls', [-9.35, 1.67, -1.6], [4.3, 2.65, 8.7], plaster, true);
  roof(-9.1, -1.6, 3.45, 5.05, 3.02, 1.64);
  for (let i = 0; i < 5; i += 1) {
    const z = -5.85 + i * 2.13;
    box('Verandah timber column', [-6.3, 1.77, z], [.17, 2.78, .17], darkWood, true);
    box('Wall timber upright', [-7.12, 1.76, z], [.12, 2.7, .16], timber, true);
  }
  box('Verandah upper lintel', [-6.3, 3.0, -1.6], [.19, .22, 8.9], timber, true);
  for (const z of [-3.7, .55]) {
    box('Shadow behind lattice window', [-7.175, 1.75, z], [.035, 1.45, 1.72], darkWood);
    for (let i = 0; i <= 7; i += 1) box('Window vertical lattice', [-7.11, 1.75, z - .81 + i * .23], [.05, 1.47, .032], timber);
    for (let i = 0; i <= 5; i += 1) box('Window horizontal lattice', [-7.08, 1.08 + i * .27, z], [.045, .035, 1.78], timber);
  }
  for (const z of [-1.38, -1.9]) box('Old wooden door leaf', [-7.11, 1.55, z], [.08, 2.3, .49], timber, true);
  box('Door threshold', [-6.94, .48, -1.64], [.65, .18, 1.25], stone, true);

  // Low north wall with a grey tiled coping; no artificial museum platform.
  box('North wall plaster', [0, 1.42, -6.5], [14.0, 1.95, .34], plaster, true);
  const wallStones = [];
  for (let row = 0; row < 2; row += 1) for (let i = 0; i < 28; i += 1) wallStones.push({ position: new THREE.Vector3(-6.9 + i * .5, .48 + row * .19, -6.25), scale: new THREE.Vector3(.48, .2, .21), tone: .78 + random() * .22 });
  instances(unitBox, stone, wallStones, 'Rubble foundation of courtyard wall');
  box('North wall clay coping', [0, 2.44, -6.5], [14.3, .15, .55], clay, true);
  const coping = [];
  for (let i = 0; i < 70; i += 1) coping.push(stick([-7 + i * .2, 2.51, -6.82], [-7 + i * .2, 2.51, -6.17], .045, .8 + random() * .25));
  instances(new THREE.CylinderGeometry(1, 1, 1, 6), clay, coping, 'Grey roof tiles along wall');

  // The small timber shed seen at the right end of the painted courtyard.
  box('East shed stone foot', [6.7, .15, -4.15], [3.6, .46, 3.6], stone, true);
  box('East shed rear wall', [6.7, 1.62, -5.65], [3.2, 2.45, .12], timber, true);
  box('East shed right wall', [8.22, 1.62, -4.15], [.12, 2.45, 3.1], timber, true);
  for (const x of [5.1, 6.7, 8.3]) for (const z of [-5.7, -2.5]) box('Shed timber upright', [x, 1.7, z], [.13, 2.65, .13], darkWood, true);
  roof(6.7, -4.1, 2.05, 2.15, 2.89, 1.04, dryThatch);
  for (let i = 0; i < 16; i += 1) box('Old slatted shed wall', [5.22 + i * .19, 1.6, -5.55], [.035, 2.2, .04], darkWood);
  box('Shed front lintel', [6.7, 2.9, -2.5], [3.5, .18, .16], timber, true);

  // The gate and bamboo fence link the terrace to the larger painted village.
  for (const x of [-6.4, -4.3]) box('Open wooden gate post', [x, 1.87, 4.12], [.22, 3.05, .22], darkWood, true);
  box('Open gate lintel', [-5.35, 3.32, 4.12], [2.5, .23, .26], timber, true);
  roof(-5.35, 4.12, 1.45, .7, 3.42, .62);
  const gateLeaf = box('Gate leaf left open', [-6.27, 1.7, 3.47], [.1, 2.6, 1.23], timber, true);
  gateLeaf.rotation.y = -.16;
  const fence = [];
  for (let i = 0; i < 19; i += 1) fence.push(stick([-6.9 + i * .13, .4, 3.75], [-6.9 + i * .13, 1.45, 3.75], .022));
  fence.push(stick([-7, .72, 3.75], [-4.55, .72, 3.75], .025));
  fence.push(stick([-7, 1.25, 3.75], [-4.55, 1.25, 3.75], .025));
  instances(new THREE.CylinderGeometry(1, 1, 1, 5), timber, fence, 'Bamboo fence beside gate');

  const bark = surface(0, 0, '#9a9077');
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#91956a', roughness: 1, side: THREE.DoubleSide });
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -.11); leafShape.quadraticCurveTo(.035, 0, 0, .12); leafShape.quadraticCurveTo(-.035, 0, 0, -.11);
  const leafGeometry = new THREE.ShapeGeometry(leafShape, 3);
  const branches = [], leaves = [], fineBranches = [];
  function tree(x, z, willow) {
    const base = new THREE.Vector3(x, Math.abs(x) > 7.1 ? -.08 : GROUND_Y, z);
    const levels = willow ? [[0,0,0],[-.12,1.1,.08],[-.55,2.5,0],[-.3,3.5,-.25],[-.5,4.5,-.1]] : [[0,0,0],[.1,1.3,.04],[-.14,2.65,-.15],[.04,3.8,0]];
    for (let i = 0; i < levels.length - 1; i += 1) branches.push(stick(base.clone().add(new THREE.Vector3(...levels[i])).toArray(), base.clone().add(new THREE.Vector3(...levels[i + 1])).toArray(), (willow ? .22 : .15) * (1 - i * .18)));
    if (!willow) {
      function fork(start, direction, length, radius, depth) {
        const end = start.clone().addScaledVector(direction, length);
        branches.push(stick(start.toArray(), end.toArray(), radius));
        if (depth > 0) {
          for (const side of [-1, 1]) {
            const next = direction.clone().multiplyScalar(.58).add(new THREE.Vector3(side * (.25 + random() * .35), .18 + random() * .25, (random() - .5) * .85)).normalize();
            fork(end, next, length * (.56 + random() * .12), radius * .55, depth - 1);
          }
        } else {
          for (let i = 0; i < 3; i += 1) leaves.push({ position: end.clone().add(new THREE.Vector3((random() - .5) * .14, (random() - .5) * .14, (random() - .5) * .14)), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(random(), random() * 3, random())), scale: new THREE.Vector3(.7, .55, .7), tone: .8 + random() * .3 });
        }
      }
      for (let i = 0; i < 5; i += 1) {
        const angle = i * 2.4;
        const start = base.clone().add(new THREE.Vector3(0, 1.5 + i * .32, 0));
        fork(start, new THREE.Vector3(Math.cos(angle) * .75, .5 + random() * .4, Math.sin(angle) * .75).normalize(), 1.0 + random() * .7, .045, 2);
      }
      return;
    }
    const crown = base.clone().add(new THREE.Vector3(...levels.at(-1)));
    const count = 100;
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.39996;
      const radius = (willow ? 2.0 : 1.0) + random() * (willow ? 1.3 : .9);
      const shoulder = crown.clone().add(new THREE.Vector3(Math.cos(angle) * radius * .6, -.4 + random() * .5, Math.sin(angle) * radius * .6));
      const tip = crown.clone().add(new THREE.Vector3(Math.cos(angle) * radius, willow ? -2.3 - random() * 1.1 : -.1 + random(), Math.sin(angle) * radius));
      const branchStart = base.clone().add(new THREE.Vector3(...levels[2 + i % 3]));
      const bend = branchStart.clone().lerp(shoulder, .52).add(new THREE.Vector3(0, .25, 0));
      branches.push(stick(branchStart.toArray(), bend.toArray(), .022));
      branches.push(stick(bend.toArray(), shoulder.toArray(), .016));
      const curve = new THREE.QuadraticBezierCurve3(shoulder, shoulder.clone().lerp(tip, .5).add(new THREE.Vector3(0, willow ? .1 : .35, 0)), tip);
      const points = curve.getPoints(9);
      for (let j = 0; j < points.length - 1; j += 1) fineBranches.push(points[j], points[j + 1]);
      const number = willow ? 24 : 5;
      for (let j = 0; j < number; j += 1) {
        const p = curve.getPoint((j + .5) / number);
        p.x += (j % 2 ? 1 : -1) * .025;
        leaves.push({ position: p, quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(random() * 1.5, random() * Math.PI, random() * .7)), scale: new THREE.Vector3(1.6, .75, 1), tone: .72 + random() * .45 });
        leaves.push({ position: p.clone().add(new THREE.Vector3(.04 * (j % 2 ? 1 : -1), -.035, .015)), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(random(), random() * Math.PI, random() * .6)), scale: new THREE.Vector3(1.4, .7, 1), tone: .78 + random() * .38 });
      }
    }
  }
  tree(9.6, 3.3, true);
  tree(-6.05, -5.15, false);
  tree(-7.45, 3.25, false);
  instances(new THREE.CylinderGeometry(.72, 1, 1, 7), bark, branches, 'Static trunks and branches');
  instances(leafGeometry, leafMaterial, leaves, 'Young spring leaves — static');
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fineBranches), new THREE.LineBasicMaterial({ color: '#777057', transparent: true, opacity: .68 })));

  const stones = [], shrubs = [];
  for (let i = 0; i < 70; i += 1) {
    const x = -6.6 + random() * 13.2;
    stones.push({ position: new THREE.Vector3(x, .52, -6 + random() * .16), scale: new THREE.Vector3(.13 + random() * .2, .13 + random() * .12, .13 + random() * .16), tone: .8 + random() * .23 });
    for (let leaf = 0; leaf < 8; leaf += 1) shrubs.push({ position: new THREE.Vector3(x + (random() - .5) * .18, .53 + random() * .11, -5.99 + (random() - .5) * .22), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler((random() - .5) * 1.3, random() * Math.PI, (random() - .5) * 1.8)), scale: new THREE.Vector3(1 + random(), 1.2 + random() * .8, 1), tone: .7 + random() * .35 });
  }
  for (let i = 0; i < 32; i += 1) stones.push({ position: new THREE.Vector3(-13 + random() * 28, -.2 + random() * .1, 7.15 + random() * .65), scale: new THREE.Vector3(.3 + random() * .5, .2 + random() * .4, .3 + random() * .45), tone: .8 + random() * .2 });
  for (const item of stones) item.quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(random(), random() * Math.PI, random()));
  instances(new THREE.IcosahedronGeometry(1, 1), surface(1, 0, '#bdbbad'), stones, 'Weathered wall and river stones');
  instances(leafGeometry, new THREE.MeshStandardMaterial({ color: '#7e8660', roughness: 1, side: THREE.DoubleSide }), shrubs, 'Low wall-side spring plants');
  const furrows = [];
  for (let i = 0; i < 22; i += 1) furrows.push({ position: new THREE.Vector3(-17.5, -.015, -16 + i * .62), scale: new THREE.Vector3(9.5, .11, .21), tone: .77 + random() * .15 });
  instances(unitBox, earth, furrows, 'Low field furrows beside the village', false);

  // A distant ring uses only the sky/landscape portion of the original artwork.
  landscape.colorSpace = THREE.SRGBColorSpace;
  landscape.wrapS = THREE.RepeatWrapping;
  landscape.repeat.set(3, .43);
  landscape.offset.set(0, .54);
  const backdrop = new THREE.Mesh(new THREE.CylinderGeometry(64, 64, 29, 64, 1, true), new THREE.MeshBasicMaterial({ map: landscape, side: THREE.BackSide, fog: true, color: '#eee7d4' }));
  backdrop.position.y = 10;
  group.add(backdrop);

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, lightColor: { value: new THREE.Color('#c0b99a') }, darkColor: { value: new THREE.Color('#8b8e7b') } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float time;uniform vec3 lightColor;uniform vec3 darkColor;varying vec2 vUv;void main(){float wave=sin(vUv.y*500.0+sin(vUv.x*28.0+time*.15)*2.0+time*.32);float glint=smoothstep(.82,.98,wave)*.3;float cloud=.5+.5*sin(vUv.x*38.0+vUv.y*8.0+time*.08);vec3 color=mix(darkColor,lightColor,.35+cloud*.22+glint);gl_FragColor=vec4(color,1.0);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(';#include', ';\n#include'),
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(110, 30), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -.34, 22.5);
  group.add(water);

  // Only water and chimney smoke animate; vegetation and architecture stay still.
  box('Small roof chimney', [-10.3, 4.2, -.8], [.32, .7, .32], clay, true);
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = smokeCanvas.height = 64;
  const ctx = smokeCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(184,174,151,.4)');
  gradient.addColorStop(1, 'rgba(184,174,151,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
  const smoke = Array.from({ length: 7 }, (_, i) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTexture, transparent: true, depthWrite: false, opacity: .2 }));
    sprite.position.set(-10.3, 4.7 + i * .3, -.8);
    group.add(sprite);
    return sprite;
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 11.1), new THREE.MeshBasicMaterial({ visible: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, GROUND_Y + .002, -1.1);
  group.add(ground);
  return {
    group, ground,
    animate(time, enabled) {
      if (!enabled) return;
      waterMaterial.uniforms.time.value = time;
      smoke.forEach((sprite, i) => {
        const phase = (time * .065 + i / smoke.length) % 1;
        sprite.position.set(-10.3 + phase * .7, 4.5 + phase * 2.8, -.8 + Math.sin(phase * 4) * .2);
        sprite.scale.setScalar(.35 + phase * 1.3);
        sprite.material.opacity = Math.sin(phase * Math.PI) * .16;
      });
    },
  };
}
