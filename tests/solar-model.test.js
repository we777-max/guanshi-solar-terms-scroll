import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMS, PLACES, getCycle, observeNoon, solarDayStart, GNOMON_HEIGHT } from '../src/solar-model.js';

test('24 terms cover a chronological 360-degree cycle including the next January', () => {
  for (const year of [2024, 2026, 2030]) {
    const cycle = getCycle(year);
    assert.equal(cycle.length, 24);
    cycle.forEach((term, i) => {
      assert.equal(term.name, TERMS[i]);
      assert.equal(term.longitude, (315+i*15)%360);
      assert.equal(term.instant.getUTCFullYear(), i >= 22 ? year+1 : year);
      if (i) assert.ok(term.instant > cycle[i-1].instant);
    });
  }
});
test('2026 equinox and summer solstice agree with HKO to two minutes', () => {
  // HKO Almanac 2026, times in UTC+8: March 20 22:46, June 21 16:25.
  const cycle = getCycle(2026);
  for (const [name, published] of [['春分','2026-03-20T22:46:00+08:00'],['夏至','2026-06-21T16:25:00+08:00']]) {
    assert.ok(Math.abs(cycle.find(term => term.name === name).instant - new Date(published)) < 120000, name);
  }
});
test('shadow, solar direction and noon refer to the same physical model', () => {
  for (const place of PLACES) for (const term of getCycle(2026)) {
    const result = observeNoon(term, place);
    assert.ok(result.altitude > 0 && result.altitude < 90);
    assert.ok(result.shadowLength > 0);
    assert.ok(Math.abs(Math.hypot(result.shadowTip.x,result.shadowTip.z) - result.shadowLength) < 1e-8);
    assert.ok(Math.abs(result.shadowTip.x*result.sunDirection.z - result.shadowTip.z*result.sunDirection.x) < 1e-8, 'shadow and horizontal sunlight are parallel');
    assert.ok(result.shadowTip.x*result.sunDirection.x + result.shadowTip.z*result.sunDirection.z < 0, 'shadow points away from the Sun');
    assert.ok(Math.abs(result.sunDirection.x) < 1e-4, 'upper transit has negligible east-west component');
    assert.ok(result.shadowTip.z < 0, 'northward shadow for all supported places');
    assert.ok(result.noon >= solarDayStart(term.instant) && result.noon < new Date(+solarDayStart(term.instant)+86400000));
    assert.ok(result.daylightMinutes > 480 && result.daylightMinutes < 960);
    const doubled = observeNoon(term, place, GNOMON_HEIGHT*2);
    assert.ok(Math.abs(doubled.shadowLength - result.shadowLength*2) < 1e-9);
  }
});
test('summer/winter seasonal ordering and latitude effects are correct', () => {
  const cycle = getCycle(2026);
  const summer = cycle.find(t => t.name === '夏至');
  const winter = cycle.find(t => t.name === '冬至');
  const a = observeNoon(summer, PLACES[0]);
  const b = observeNoon(winter, PLACES[0]);
  assert.ok(a.altitude > b.altitude);
  assert.ok(a.daylightMinutes > b.daylightMinutes);
  assert.ok(b.shadowLength > a.shadowLength*5);
  assert.ok(observeNoon(winter, PLACES[1]).shadowLength > b.shadowLength);
});
test('invalid input fails explicitly', () => {
  assert.throws(() => getCycle(1900), RangeError);
  assert.throws(() => observeNoon(getCycle(2026)[0], PLACES[0], 0), RangeError);
  assert.throws(() => observeNoon(getCycle(2026)[0], {latitude:NaN, longitude:0}), RangeError);
});
