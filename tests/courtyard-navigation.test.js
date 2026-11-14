import test from 'node:test';
import assert from 'node:assert/strict';
import { canStandAt, moveOnGround, planWalkPath, clearWalkLine } from '../src/courtyard-navigation.js';
import { WALK_START, GNOMON, GNOMON_APPROACH, WALK_BOUNDS, GROUND_Y } from '../src/courtyard-layout.js';
import { getCycle, observeNoon, PLACES } from '../src/solar-model.js';

test('entry and instrument approach are walkable; the ruler and shed are solid', () => {
  assert.ok(canStandAt(WALK_START.x, WALK_START.z));
  assert.ok(canStandAt(GNOMON_APPROACH.x, GNOMON_APPROACH.z));
  assert.equal(canStandAt(GNOMON.x, GNOMON.z), false);
  assert.equal(canStandAt(GNOMON.x, GNOMON.z - 4), false);
  assert.equal(canStandAt(5.4, -3), false);
});

test('a large movement cannot tunnel through the narrow stone ruler or leave the terrace', () => {
  const stopped = moveOnGround({ x: 0, z: 0 }, { x: 4, z: 0 });
  assert.ok(stopped.x < GNOMON.x - .26);
  assert.ok(canStandAt(stopped.x, stopped.z));
  const edge = moveOnGround({ x: 4, z: 3 }, { x: 30, z: 30 });
  assert.ok(edge.x <= WALK_BOUNDS.maxX - .22);
  assert.ok(edge.z <= WALK_BOUNDS.maxZ - .22);
  assert.ok(canStandAt(edge.x, edge.z));
});

test('click-to-walk routes around the instrument and every segment is safe', () => {
  const from = { x: -.8, z: -.5 }, to = { x: 3.2, z: -2 };
  assert.equal(clearWalkLine(from, to), false);
  const route = planWalkPath(from, to);
  assert.ok(route.length >= 2, 'must go around rather than cross the ruler');
  let current = from;
  for (const next of route) {
    assert.ok(clearWalkLine(current, next));
    current = next;
  }
  assert.deepEqual(route.at(-1), to);
  assert.deepEqual(planWalkPath(from, { x: GNOMON.x, z: GNOMON.z }), []);
});

test('courtyard elevation preserves the same physical two-metre shadow for all 24 terms', () => {
  const sourceY = GNOMON.y + GNOMON.datum + GNOMON.height;
  const receiverY = GROUND_Y + GNOMON.datum;
  assert.equal(sourceY - receiverY, 2);
  for (const place of PLACES) for (const term of getCycle(2026)) {
    const observation = observeNoon(term, place, GNOMON.height);
    const travel = (sourceY - receiverY) / observation.sunDirection.y;
    const dx = -observation.sunDirection.x * travel;
    const dz = -observation.sunDirection.z * travel;
    assert.ok(Math.abs(Math.hypot(dx, dz) - observation.shadowLength) < 1e-9);
    assert.ok(observation.shadowLength < 5.65, 'selected cities fit the actual stone measuring surface');
  }
});
