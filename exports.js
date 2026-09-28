/* Explicit catalogue/derived records for reproducible scientific exports. */
const AstroExports = (() => {
  const physics = typeof Physics !== 'undefined' ? Physics : require('./physics');
  const SOURCE='ATNF Pulsar Catalogue via NASA HEASARC';
  const REFERENCE='https://www.atnf.csiro.au/research/pulsar/psrcat/';
  const fields=[
    ['name','Name',''],['alt_name','Alias',''],['ra','RA','deg'],['dec','Dec','deg'],
    ['period','P','s'],['period_dot','Pdot','s/s'],['dm','DM','pc cm^-3'],['rm','RM','rad/m^2'],
    ['distance','Distance','kpc'],['pulse_width_50','W50','ms'],['pulse_width_10','W10','ms'],
    ['flux_400_mhz','S400','mJy'],['flux_1400_mhz','S1400','mJy'],['pulsar_type','Type',''],
    ['binary_model','Binary model',''],['assoc_object','Association',''],
  ];
  const formulas=[
    ['frequency','nu','Hz','1/P'],['frequencyDot','nudot','Hz/s','-Pdot/P^2'],
    ['ageYears','tau_c','yr','P/(2 Pdot); standard spin-down assumptions'],
    ['fieldGauss','B_s','G','3.2e19 sqrt(P Pdot); dipole model'],
    ['edotErgS','Edot','erg/s','4 pi^2 I Pdot/P^3; I=1e45 g cm^2'],
    ['lightCylinderKm','R_LC','km','cP/(2 pi)'],
  ];
  function record(pulsar,state=null) {
    const catalogue=fields.map(([key,field,unit])=>({field,value:pulsar[key]??null,unit,semantic:'CATALOGUE',uncertainty:null,source:SOURCE,method:key==='distance'?pulsar.distance_method??null:null,reference:REFERENCE}));
    const values=physics.derived(Number(pulsar.period),Number(pulsar.period_dot));
    const derived=formulas.map(([key,field,unit,method])=>({field,value:values[key]??null,unit,semantic:'DERIVED',uncertainty:null,source:'Calculated from catalogue P and Pdot',method,reference:REFERENCE}));
    return {name:pulsar.name,snapshot:pulsar.retrieved,catalogue,derived,model:{alpha:42,zeta:48,rho:12,semantic:'MODEL',note:'Illustrative geometry defaults; not catalogue measurements'},experiment:state?{semantic:'EXPERIMENT',overrides:{...state.experiment},observation:{...state.observation}}:null};
  }
  const escapeCell=value=>{const text=value===null||value===undefined?'':String(value);return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;};
  function csv(pulsar) {
    const {catalogue,derived}=record(pulsar),columns=['field','value','unit','semantic','uncertainty','source','method','reference'];
    return [columns.join(','),...catalogue.concat(derived).map(row=>columns.map(key=>escapeCell(row[key])).join(','))].join('\r\n')+'\r\n';
  }
  function comparisonCsv(pulsars) {
    const columns=['name','P_s','nu_Hz','Pdot_s_per_s','nudot_Hz_per_s','DM_pc_cm-3','distance_kpc','tau_years','B_G','Edot_erg_s','RLC_km','type'];
    const rows=pulsars.map(p=>{const d=physics.derived(Number(p.period),Number(p.period_dot));return [p.name,p.period,d.frequency,p.period_dot,d.frequencyDot,p.dm,p.distance,d.ageYears,d.fieldGauss,d.edotErgS,d.lightCylinderKm,p.pulsar_type].map(escapeCell).join(',');});
    return [columns.join(','),...rows].join('\r\n')+'\r\n';
  }
  return {record,csv,comparisonCsv,fields,formulas,SOURCE,REFERENCE};
})();
if(typeof module!=='undefined')module.exports=AstroExports;
