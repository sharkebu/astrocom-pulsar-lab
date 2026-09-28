const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/pulsars.json');
const e=require('../exports');
test('JSON separates catalogue, derived and model with missing values intact',()=>{
  const row=e.record(data.find(p=>p.name==='PSR J1748-2446ad'));
  assert.equal(row.catalogue.find(x=>x.field==='Pdot').value,null);
  assert.equal(row.derived.find(x=>x.field==='B_s').value,null);
  assert.equal(row.model.semantic,'MODEL');
  assert.equal(row.experiment,null);
  const state={experiment:{zeta:61},observation:{centreMHz:600,view:'dispersed'}};
  const shared=e.record(data[0],state);
  assert.equal(shared.catalogue.find(x=>x.field==='P').value,data[0].period);
  assert.equal(shared.experiment.overrides.zeta,61);
  assert.equal(shared.experiment.observation.centreMHz,600);
});
test('CSV encodes fields and missing data without invented numbers',()=>{
  const text=e.csv(data[0]);
  assert.ok(text.startsWith('field,value,unit,semantic,'));
  assert.ok(text.includes('P,0.472036662076,s,CATALOGUE'));
  const compare=e.comparisonCsv(data.slice(0,2));
  assert.equal(compare.trim().split('\r\n').length,3);
});
