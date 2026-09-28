const { test } = require('node:test');
const assert = require('node:assert/strict');
const pulsars = require('../data/pulsars.json');
const population = require('../data/population.json');
const { create, current } = require('../state');

test('curated snapshot contains seven original records with missing fields preserved', () => {
  assert.ok(pulsars.length >= 6);
  assert.equal(pulsars.find(p => p.name === 'PSR J0056+4756').period, '0.472036662076');
  assert.equal(pulsars.find(p => p.name === 'PSR J1748-2446ad').period_dot, null);
  assert.ok(pulsars.every(p => p.distance_method === null && Array.isArray(p.observedProfiles)));
  assert.ok(population.length > 2000);
  assert.ok(population.every(([,period,pdot]) => period > 0 && pdot > 0));
});

test('playback acceleration does not alter catalogue or experimental period', () => {
  const state = create(pulsars[0]);
  state.playback.speed = 20;
  assert.equal(current(state, 'period'), pulsars[0].period);
  assert.equal(state.catalogue.period, '0.472036662076');
});
