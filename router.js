/* Hash routing keeps deep links working on a static host and from a local HTML file. */
const AstroRouter = (() => {
  const LAB_PAGES = new Set(['overview','geometry','timing','ppdot','propagation','observations','glitches','data']);
  const EXPLORE_PAGES = new Set(['beam','rotation','dispersion','compare']);
  const idOf = name => String(name).replace(/^PSR\s+/, '');
  function parse(hash, catalogue) {
    const input = (hash || '#/').replace(/^#/, '');
    const [path, search=''] = input.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const query = new URLSearchParams(search);
    if (parts[0] === 'explore') return {mode:'explore',page:EXPLORE_PAGES.has(parts[1])?parts[1]:'home',query};
    if (parts[0] === 'lab' && parts[1] === 'compare') return {mode:'lab',page:'compare',query};
    if (parts[0] === 'lab') {
      const wanted = parts[1] === 'pulsar' ? parts[2] : null;
      const object = catalogue.find(row => idOf(row.name) === wanted || row.name === wanted) || catalogue[0];
      return {mode:'lab',page:LAB_PAGES.has(parts[3])?parts[3]:'overview',object,query};
    }
    return {mode:'landing',page:'home',query};
  }
  function objectPath(name,page='overview') { return `#/lab/pulsar/${encodeURIComponent(idOf(name))}/${page}`; }
  function experimentHash(name,page,experiment={},observation={}) {
    const q = new URLSearchParams();
    for (const [key,value] of Object.entries(experiment)) if(Number.isFinite(value)) q.set(key,String(value));
    for (const key of ['centreMHz','bandwidthMHz','channels']) if(Number.isFinite(observation[key])) q.set(key,String(observation[key]));
    if(observation.dedispersed)q.set('dedispersed','1');
    const suffix=q.toString();return objectPath(name,page)+(suffix?`?${suffix}`:'');
  }
  function compareHash(names) {const q=new URLSearchParams();q.set('objects',names.map(idOf).join(','));return '#/lab/compare?'+q.toString();}
  function readExperiment(query) {
    const output={};
    for(const key of ['period','period_dot','dm','alpha','zeta','rho']){
      const text=query.get(key),n=Number(text);
      if(text!==null&&text!==''&&Number.isFinite(n))output[key]=n;
    }
    return output;
  }
  return {parse,objectPath,experimentHash,compareHash,readExperiment,idOf};
})();
if(typeof module!=='undefined')module.exports=AstroRouter;
