import test from 'node:test';
import assert from 'node:assert/strict';
import { getMoonAppearance,moonDiskPath,skyContains,skylineHeight,SKYLINES,TREE_SKY_CUTOUTS } from '../src/sky-model.js';
import { getCycle } from '../src/solar-model.js';

function pathArea(phase) {
  const points=moonDiskPath(phase).slice(1,-1).split('L').map(p=>p.split(' ').map(Number));
  return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
}
test('projected lunar terminator produces new, quarter, full and waning shapes',()=>{
  assert.ok(pathArea(0)<.001);assert.ok(Math.abs(pathArea(90)/Math.PI-.5)<.003);
  assert.ok(Math.abs(pathArea(180)/Math.PI-1)<.004);assert.ok(Math.abs(pathArea(270)/Math.PI-.5)<.003);
  assert.equal(pathArea(45).toFixed(3),pathArea(315).toFixed(3));
});
test('Moon phase and apparent diameter vary by date, with size proportional to inverse distance',()=>{
  const moons=getCycle(2026).map(term=>getMoonAppearance(term.instant));
  assert.ok(new Set(moons.map(m=>m.phase.toFixed(0))).size>15);
  moons.forEach(m=>{assert.ok(m.distanceKm>350000&&m.distanceKm<410000);assert.ok(m.angularDiameter>28&&m.angularDiameter<35);assert.ok(Math.abs(m.scale*m.distanceKm-384400)<1e-6);});
  assert.ok(Math.max(...moons.map(m=>m.scale))/Math.min(...moons.map(m=>m.scale))>1.1);
  assert.throws(()=>getMoonAppearance('not-a-date'),TypeError);
});
test('all eight sky masks reject mountains and foreground tree crowns',()=>{
  for(let scene=0;scene<8;scene++){
    for(let x=0;x<=2172;x+=23)assert.equal(skyContains(scene,x,skylineHeight(scene,x)+1),false,`scene ${scene}, x ${x}`);
    assert.equal(SKYLINES[scene][0][0],0);assert.equal(SKYLINES[scene].at(-1)[0],2172);
    assert.ok(TREE_SKY_CUTOUTS[scene].length>0);
    assert.equal(skyContains(scene,-1,10),false);assert.equal(skyContains(scene,2173,10),false);
    assert.equal(skyContains(scene,100,-1),false);
    assert.ok(Array.from({length:100},(_,i)=>skyContains(scene,i*21,12)).some(Boolean));
  }
  assert.equal(skyContains(0,530,10),false);assert.equal(skyContains(7,300,10),false);
});
