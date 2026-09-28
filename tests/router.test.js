const {test}=require('node:test');
const assert=require('node:assert/strict');
const router=require('../router');
const catalogue=require('../data/pulsars.json');

test('static hash routes are meaningful and shareable',()=>{
  assert.equal(router.parse('',catalogue).mode,'landing');
  assert.equal(router.parse('#/explore/beam',catalogue).page,'beam');
  const hash=router.experimentHash('PSR J0835-4510','geometry',{alpha:42,zeta:70,rho:12});
  const parsed=router.parse(hash,catalogue);
  assert.equal(parsed.object.name,'PSR J0835-4510');
  assert.equal(parsed.page,'geometry');
  assert.deepEqual(router.readExperiment(parsed.query),{alpha:42,zeta:70,rho:12});
});

test('compare URL and invalid object fallback',()=>{
  const hash=router.compareHash(['PSR J0534+2200','PSR J0835-4510']);
  assert.equal(router.parse(hash,catalogue).query.get('objects'),'J0534+2200,J0835-4510');
  assert.equal(router.parse('#/lab/pulsar/not-here/data',catalogue).object.name,catalogue[0].name);
});
