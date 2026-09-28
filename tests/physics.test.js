const { test } = require('node:test');
const assert = require('node:assert/strict');
const p = require('../physics');
const s = require('../state');
const near = (actual, expected, tolerance) => assert.ok(Math.abs(actual - expected) / Math.abs(expected) < tolerance, `${actual} ≈ ${expected}`);

test('J0056 catalogue yields expected derived scales', () => {
  const P = 0.472036662076, Pdot = 3.32849e-15;
  near(p.frequency(P), 2.118, .001);
  near(p.periodFromFrequency(p.frequency(P)), P, 1e-12);
  near(p.frequencyDerivative(P, Pdot), -Pdot/P**2, 1e-12);
  near(p.characteristicAge(P, Pdot), 2.25e6, .01);
  near(p.surfaceDipoleField(P, Pdot), 1.27e12, .01);
  near(p.spinDownLuminosity(P, Pdot), 1.25e33, .02);
  near(p.lightCylinderRadius(P), 2.25e4, .01);
});
test('geometry and both poles use phase-dependent separation', () => {
  near(p.observerMagneticAngle(42, 48, 0), 6, 1e-10);
  assert.equal(p.isBeamVisible(42, 48, 12), true);
  assert.equal(p.isBeamVisible(42, 70, 12), false);
  assert.equal(p.beamResponse(42, 70, 12, 0), 0);
  assert.ok(p.beamResponse(42, 48, 12, 0) > p.beamResponse(42, 48, 12, Math.PI / 4));
  assert.equal(p.isBeamVisible(42, 138, 12), true); // opposite pole
});
test('cold plasma delays lower frequencies, dedispersion removes relative delay', () => {
  near(p.dispersionDelay(18.1354, 350, 450), 18.1354 * 4.148808e6 * (350 ** -2 - 450 ** -2), 1e-12);
  assert.ok(p.dispersionDelay(18.1354, 350, 450) > 0);
  assert.equal(p.dispersionDelay(0, 350, 450), 0);
});
test('invalid inputs never produce non-finite derived output', () => {
  for (const value of Object.values(p.derived(0, -1))) assert.equal(value, null);
  assert.equal(p.dispersionDelay(-1, 100, 200), null);
  assert.equal(p.observerMagneticAngle(200, 20, 0), null);
});
test('experiment and reset preserve original catalogue object', () => {
  const catalogue = Object.freeze({ period: '0.472036662076', period_dot: 3.32849e-15, dm: 18.1354 });
  const state = s.create(catalogue);
  assert.equal(s.current(state, 'period'), catalogue.period);
  assert.equal(s.setExperiment(state, 'period', .3), true);
  assert.equal(state.mode, 'experiment');
  assert.equal(s.current(state, 'period'), .3);
  assert.equal(catalogue.period, '0.472036662076');
  s.reset(state);
  assert.equal(state.mode, 'catalogue');
  assert.equal(s.current(state, 'period'), catalogue.period);
  assert.deepEqual(state.experiment, {});
});
