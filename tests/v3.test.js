const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Router=require('../router');
const State=require('../state');
const Physics=require('../physics');
const catalogue=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/pulsars.json'),'utf8'));
const glitches=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/glitches.json'),'utf8'));

test('Explore geometry opens the same object and experiment in Lab',()=>{
  const first=catalogue[0],state=State.create(first);
  State.setExperiment(state,'alpha',42);State.setExperiment(state,'zeta',48);
  const url=Router.experimentHash(first.name,'geometry',state.experiment,state.observation);
  const route=Router.parse(url,catalogue),loaded=State.create(route.object);
  for(const [key,value] of Object.entries(Router.readExperiment(route.query)))State.setExperiment(loaded,key,value);
  Object.assign(loaded.observation,Router.readObservation(route.query));
  assert.equal(route.page,'geometry');assert.equal(route.object.name,first.name);
  assert.equal(State.current(loaded,'zeta'),48);
  assert.equal(Physics.isBeamVisible(State.current(loaded,'alpha'),State.current(loaded,'zeta'),State.current(loaded,'rho')),true);
  assert.deepEqual(loaded.observation,state.observation);
  assert.equal(first.zeta,undefined);
});

test('timing and propagation settings round trip, invalid settings are rejected',()=>{
  const p=catalogue.find(x=>x.name==='PSR J0835-4510');
  const hash=Router.experimentHash(p.name,'propagation',{period:.12,period_dot:2e-13,dm:68},{centreMHz:600,bandwidthMHz:120,channels:32,samplingMs:.5,view:'dedispersed',dedispersed:true});
  const route=Router.parse(hash,catalogue);
  assert.equal(route.object.name,p.name);
  assert.deepEqual(Router.readExperiment(route.query),{period:.12,period_dot:2e-13,dm:68});
  assert.deepEqual(Router.readObservation(route.query),{centreMHz:600,bandwidthMHz:120,channels:32,samplingMs:.5,dedispersed:true,view:'dedispersed'});
  assert.deepEqual(Router.readObservation(new URLSearchParams('centreMHz=-5&samplingMs=9999')),{});
});

test('comparison URL preserves two to four unique catalogue selections',()=>{
  const names=['PSR J0534+2200','PSR J0835-4510','PSR J0437-4715'];
  const route=Router.parse(Router.compareHash(names),catalogue);
  assert.deepEqual(Router.readComparison(route.query,catalogue),names);
  assert.equal(Router.readComparison(new URLSearchParams('objects=J0534%2B2200%2CJ0534%2B2200'),catalogue),null);
  assert.equal(Router.readComparison(new URLSearchParams('objects=J0534%2B2200%2Cunknown'),catalogue),null);
});

test('Vela glitches are sourced event records with missing errors left missing',()=>{
  const vela=glitches.events.filter(e=>e.name==='PSR J0835-4510');
  assert.equal(glitches.url,'https://www.jb.man.ac.uk/pulsar/glitches/gTable.html');
  assert.equal(vela.length,26);
  const latest=vela.at(-1);
  assert.equal(latest.mjd,60429.9);
  assert.equal(latest.deltaNuFractionNinth,2396);
  assert.equal(latest.deltaNuDotFractionThousandth,23);
  assert.equal(vela.find(e=>e.sequence===24).deltaNuDotFractionThousandth,null);
});
