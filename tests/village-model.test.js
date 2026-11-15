import test from 'node:test';
import assert from 'node:assert/strict';
import { WaterwheelState, FestivalState, FESTIVAL_STAGES } from '../src/village-model.js';

test('waterwheel starts enabled, keeps its angle on stop, pause and offscreen, and resumes from it',()=>{
  const wheel=new WaterwheelState();assert.equal(wheel.enabled,true);
  for(let i=0;i<10;i++)wheel.step(.1,true);assert.ok(Math.abs(wheel.angle-18)<1e-8);
  const angle=wheel.angle;wheel.toggle();wheel.step(.1,true);assert.equal(wheel.angle,angle);
  wheel.toggle();wheel.step(.1,false);assert.equal(wheel.angle,angle);
  wheel.step(.1,true);assert.ok(wheel.angle>angle);
});
test('festival stages distinguish ordinary days, preparations, New Year and lantern viewing',()=>{
  const festival=new FestivalState();assert.equal(festival.stage,'eve');
  festival.setStage('ordinary');assert.equal(FESTIVAL_STAGES[festival.stage].decorated,false);
  festival.setStage('prepare');assert.equal(festival.couplets,false);assert.equal(festival.ignite(true,false),false);
  festival.changeCouplets();assert.equal(festival.couplets,true);
  festival.setStage('lantern');assert.equal(FESTIVAL_STAGES[festival.stage].crackers,false);
  assert.throws(()=>festival.setStage('winter'),RangeError);
});
test('crackers cannot retrigger, light in snow or survive scene pause; they can be rehung after a burst',()=>{
  const festival=new FestivalState();assert.equal(festival.ignite(false,false),false);assert.equal(festival.ignite(true,true),false);
  assert.equal(festival.ignite(true,false),true);assert.equal(festival.ignite(true,false),false);
  for(let i=0;i<30;i++)festival.step(.1,true);assert.equal(festival.burstAge,null);assert.equal(festival.spent,true);
  festival.rehang();assert.equal(festival.ignite(true,false),true);festival.step(0,false);assert.equal(festival.burstAge,null);
  festival.setStage('ordinary');assert.equal(festival.spent,false);assert.equal(festival.ignite(true,false),false);
});
