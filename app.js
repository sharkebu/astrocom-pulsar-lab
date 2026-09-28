(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2, RAD = Math.PI / 180, OBS_AZ = .6;
  const catalogue = CATALOGUE.map(row => Object.freeze(row));
  const state = LabState.create(catalogue[0]);
  state.playback.running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const name = item => item.alt_name && item.name === 'PSR J0332+5434' ? 'PSR B0329+54' : item.name;
  const nf = (n, max=3) => Number.isFinite(n) ? new Intl.NumberFormat('tr-TR',{maximumFractionDigits:max}).format(n) : 'Veri yok';
  const sci = n => Number.isFinite(n) ? n.toExponential(3).replace('e+','e') : 'Veri yok';
  const raw = v => v === null || v === undefined || v === '' ? 'Veri yok' : String(v);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val = key => LabState.current(state,key);
  const num = key => Number(val(key));
  const phase = cycles => TAU * cycles - OBS_AZ;
  const visible = () => Physics.isBeamVisible(num('alpha'), num('zeta'), num('rho'));
  const response = cycles => Physics.beamResponse(num('alpha'),num('zeta'),num('rho'),phase(cycles));
  const derived = () => Physics.derived(num('period'),num('period_dot'));
  const formatPeriod = p => Number.isFinite(p) && p>0 ? p < .1 ? `${nf(p*1000,5)} ms` : `${nf(p,9)} s` : 'Veri yok';

  // DOM controls are generated from field definitions; provenance remains in state.
  const specs = [
    {key:'period',label:'Dönme periyodu P',unit:'s',min:.0005,max:10,step:'any',group:'catalogue',log:true,info:'Katalog: fiziksel dönme periyodu.'},
    {key:'period_dot',label:'Periyot türevi Ṗ',unit:'s/s',min:1e-22,max:1e-9,step:'any',group:'catalogue',log:true,info:'Pozitif Ṗ, dönüşün yavaşladığını gösterir.'},
    {key:'alpha',label:'Manyetik eğim α',unit:'°',min:0,max:90,step:1,group:'geometry',info:'Dönme ve manyetik eksen arasındaki açı.'},
    {key:'zeta',label:'Bakış açısı ζ',unit:'°',min:0,max:180,step:1,group:'geometry',info:'Dönme ekseniyle görüş hattı arasındaki açı.'},
    {key:'rho',label:'Işın yarı açıklığı ρ',unit:'°',min:1,max:45,step:1,group:'geometry',info:'Temsili radyo ışın konisinin yarı açıklığı.'},
  ];
  function makeControls() {
    for (const spec of specs) {
      const node=document.createElement('div'); node.className='control';
      const range = spec.log ? `<input id="${spec.key}-range" type="range" min="${Math.log10(spec.min)}" max="${Math.log10(spec.max)}" step="0.005" aria-label="${spec.label} kaydırıcısı">` : `<input id="${spec.key}-range" type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" aria-label="${spec.label} kaydırıcısı">`;
      node.innerHTML=`<label for="${spec.key}-input">${spec.label} <b class="badge" id="${spec.key}-badge">${spec.group==='geometry'?'MODEL':'KATALOG'}</b></label><div class="field"><input id="${spec.key}-input" type="number" min="${spec.min}" max="${spec.max}" step="${spec.step}" aria-label="${spec.label}"><span>${spec.unit}</span></div>${range}<small id="${spec.key}-original">${spec.info}</small>`;
      $(spec.group==='geometry'?'geometry-controls':'catalogue-controls').append(node);
      $(spec.key+'-input').addEventListener('input', e => {
        const value=Number(e.target.value);
        if(e.target.value===''||!Number.isFinite(value)||value<spec.min||value>spec.max||!LabState.setExperiment(state,spec.key,value))return;
        $(spec.key+'-range').value=spec.log?Math.log10(value):value;
        state.observation.dedispersed=false;syncMode();syncSummary();drawAll();
        const badge=$(spec.key+'-badge');badge.textContent='DENEY';badge.className='badge experiment';
        const source=spec.group==='geometry'?state.model[spec.key]:state.catalogue[spec.key];
        $(spec.key+'-original').textContent=`Başlangıç: ${raw(source)} ${spec.unit} · ${spec.info}`;
      });
      $(spec.key+'-input').addEventListener('change', e => commit(spec, Number(e.target.value)));
      $(spec.key+'-range').addEventListener('input', e => commit(spec, spec.log ? 10 ** Number(e.target.value) : Number(e.target.value)));
    }
  }
  function commit(spec,value) {
    if (!Number.isFinite(value) || value<spec.min || value>spec.max || !LabState.setExperiment(state,spec.key,value)) { sync();$(spec.key+'-original').textContent=`Geçersiz değer. İzin verilen aralık: ${spec.min}–${spec.max} ${spec.unit}.`;$(spec.key+'-original').style.color='var(--amber)';return; }
    $(spec.key+'-original').style.color='';
    state.observation.dedispersed=false;
    sync();
  }
  function syncControls() {
    for (const spec of specs) {
      const current=val(spec.key), source=spec.group==='geometry'?state.model[spec.key]:state.catalogue[spec.key];
      $(spec.key+'-input').value=current ?? '';
      $(spec.key+'-range').value=current==null?spec.log?Math.log10(spec.min):spec.min:spec.log?Math.log10(Number(current)):Number(current);
      const changed=Object.hasOwn(state.experiment,spec.key) && state.mode==='experiment';
      const badge=$(spec.key+'-badge'); badge.textContent=changed?'DENEY':spec.group==='geometry'?'MODEL':'KATALOG';badge.className='badge'+(changed?' experiment':spec.group==='geometry'?' model':'');
      $(spec.key+'-original').textContent=changed?`Başlangıç: ${raw(source)} ${spec.unit} · ${spec.info}`:spec.info;
    }
    $('dm-input').value=val('dm')??'';
    $('dm-badge').textContent=state.experiment.dm!==undefined&&state.mode==='experiment'?'DENEY':'KATALOG';
    $('dm-badge').className='badge'+(state.experiment.dm!==undefined&&state.mode==='experiment'?' experiment':'');
    $('dm-original').textContent=`Katalog: ${raw(state.catalogue.dm)} pc cm⁻³`;
  }
  function syncMode() {
    const experiment=state.mode==='experiment';
    $('catalogue-mode').classList.toggle('active',!experiment);$('experiment-mode').classList.toggle('active',experiment);
    document.querySelector('.modebar').classList.toggle('experiment',experiment);
    $('mode-description').textContent=experiment?`DENEYSEL MODEL · Başlangıç nesnesi: ${state.catalogue.name}`:'Katalog değerleriyle görüntüleniyor · açı değerleri model varsayımı';
    $('reset').hidden=!experiment;
  }
  function stat(label,value,unit,kind,tip='') {return `<div class="stat"><span>${label} <b class="badge ${kind==='MODEL'?'model':kind==='DENEY'?'experiment':kind==='TÜRETİLEN'?'derived':''}" title="${esc(tip)}">${kind}</b></span><strong>${esc(value)}</strong><small>${esc(unit)}${tip?' · '+esc(tip):''}</small></div>`;}
  function syncSummary() {
    const d=derived(), p=num('period'), pdot=num('period_dot'), experimental=state.mode==='experiment';
    $('star-title').textContent=experimental?'DENEYSEL MODEL':state.catalogue.name;
    $('period-readout').textContent=formatPeriod(p);$('frequency-readout').textContent=d.frequency===null?'Veri yok':`${nf(d.frequency,4)} Hz`;
    $('period-badge').textContent=experimental&&state.experiment.period!==undefined?'DENEY':'KATALOG';
    $('period-badge').className='badge'+(experimental&&state.experiment.period!==undefined?' experiment':'');
    const badge=experimental?'DENEY':'KATALOG';
    $('summary-grid').innerHTML=[
      stat('P',raw(experimental&&state.experiment.period!==undefined?state.experiment.period:state.catalogue.period),'s',experimental&&state.experiment.period!==undefined?badge:'KATALOG'),
      stat('Ṗ',pdot>0?sci(pdot):'Veri yok','s/s',experimental&&state.experiment.period_dot!==undefined?badge:'KATALOG','Periyotun zamanla değişim oranı'),
      stat('DM',val('dm')==null?'Veri yok':nf(num('dm'),4),'pc cm⁻³',experimental&&state.experiment.dm!==undefined?badge:'KATALOG','Serbest elektron sütun yoğunluğu'),
      stat('ν',d.frequency===null?'Veri yok':nf(d.frequency,5),'Hz','TÜRETİLEN'),
      stat('τc',d.ageYears===null?'Veri yok':`${nf(d.ageYears/1e6,3)} Myr`,'Gerçek yaş olmak zorunda değildir','TÜRETİLEN','Standart frenleme varsayımı'),
      stat('Bs',d.fieldGauss===null?'Veri yok':sci(d.fieldGauss),'G · doğrudan ölçüm değildir','TÜRETİLEN','Standart dipol frenleme yaklaşımı'),
      stat('Ė',d.edotErgS===null?'Veri yok':sci(d.edotErgS),'erg/s · dönme enerjisi kaybı','TÜRETİLEN','I = 10⁴⁵ g cm² varsayımı'),
      stat('RLC',d.lightCylinderKm===null?'Veri yok':nf(d.lightCylinderKm,1),'km','TÜRETİLEN','cP / 2π'),
    ].join('');
    const yes=visible(), indicator=$('detection-indicator');indicator.classList.toggle('off',!yes);
    indicator.querySelector('span').textContent=yes?'ATIM BEKLENİYOR':'ATIM YOK';
    $('pulse-state').textContent=yes?'GÖRÜŞ HATTI IŞINDA':'IŞIN GÖRÜŞ DIŞINDA';
    const beta=num('zeta')-num('alpha');
    $('geometry-explanation').textContent=`α ${nf(num('alpha'),0)}° · ζ ${nf(num('zeta'),0)}° · ρ ${nf(num('rho'),0)}° · β≈${nf(beta,0)}° · ${yes?'Görüş hattı ışın konisini kesebilir.':'Yıldız döner; bu açıdan radyo atımı görülmez.'}`;
    $('signal-detect').textContent=yes?'Atım mümkün':'Atım yok';
    $('signal-geometry').textContent=`β≈${nf(beta,0)}° · ρ=${nf(num('rho'),0)}°`;
    syncSource(); syncMapDescription(); syncDispersion();
  }
  function syncSource() {
    const c=state.catalogue; $('source-title').textContent=c.name;
    const fields=[['Ad / diğer ad',c.alt_name],['P',c.period==null?null:`${c.period} s`],['Ṗ',c.period_dot==null?null:`${c.period_dot} s/s`],['DM',c.dm==null?null:`${c.dm} pc cm⁻³`],['RM',c.rm==null?null:`${c.rm} rad/m²`],['W50',c.pulse_width_50==null?null:`${c.pulse_width_50} ms`],['W10',c.pulse_width_10==null?null:`${c.pulse_width_10} ms`],['S400',c.flux_400_mhz==null?null:`${c.flux_400_mhz} mJy`],['S1400',c.flux_1400_mhz==null?null:`${c.flux_1400_mhz} mJy`],['RA / Dec',`${c.ra}° / ${c.dec}°`],['Uzaklık',c.distance==null?null:`${c.distance} kpc`],['Uzaklık yöntemi',c.distance_method||'Aynada belirtilmemiş'],['Tür',c.pulsar_type],['İkili model',c.binary_model],['İlişki',c.assoc_object]];
    $('source-content').innerHTML=`<p class="microcopy">Bu kayıt ATNF kataloğunun NASA HEASARC aynasından alınmıştır. Aşağıdaki sayılar kaynakta gelen değerlerdir; deney değişiklikleri burada yer almaz. Uzaklığın yöntemi bu aynada belirtilmez.</p><div class="source-table">${fields.map(([k,v])=>`<div class="source-item"><span>${esc(k)} · KATALOG</span><strong>${esc(raw(v))}</strong></div>`).join('')}</div>`;
  }
  function selectObject(item) {LabState.select(state,item);$('pulsar-select').value=item.name;sync();}
  function sync() {syncMode();syncControls();syncSummary();drawAll();}

  const canvases=['star','trace','profile','ppdot','waterfall'];
  const ctx={}; for (const id of canvases) ctx[id]=$(id).getContext('2d');
  function prepare(id) { const canvas=$(id), box=canvas.getBoundingClientRect();if(!box.width||!box.height)return null;const ratio=Math.min(devicePixelRatio||1,2), w=box.width,h=box.height;if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}ctx[id].setTransform(ratio,0,0,ratio,0,0);ctx[id].clearRect(0,0,w,h);return {c:ctx[id],w,h};}
  const camera=55*RAD;function project(v){return{x:v[1],y:-v[0]*Math.cos(camera)+v[2]*Math.sin(camera),depth:v[0]*Math.sin(camera)+v[2]*Math.cos(camera)};}
  function vector(a,az){return[Math.sin(a*RAD)*Math.cos(az),Math.sin(a*RAD)*Math.sin(az),Math.cos(a*RAD)];}
  const stars=Array.from({length:75},(_,i)=>{const fract=x=>x-Math.floor(x);return{x:fract(i*.6180339+.19),y:fract(i*.7548777+.32),r:.4+fract(i*.4389),a:.12+fract(i*.367)*.36};});
  const patches=Array.from({length:30},(_,i)=>{const fract=x=>x-Math.floor(x);return{lat:Math.asin(fract(i*.618+.31)*1.8-.9),lon:TAU*fract(i*.754+.23),size:.03+fract(i*.414)*.06};});
  function line(c,x1,y1,x2,y2,color,width=1,dash=[]) {c.beginPath();c.setLineDash(dash);c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();c.setLineDash([]);}
  function beam(c,cx,cy,r,v,front,power){const q=project(v),endX=cx+q.x*r*3,endY=cy-q.y*r*3,dx=endX-cx,dy=endY-cy,len=Math.hypot(dx,dy);if(len<5)return;const spread=r*3*Math.tan(num('rho')*RAD)*(.45+Math.abs(q.depth)*.25),nx=-dy/len,ny=dx/len;c.save();c.globalAlpha=front?.55+power*.25:.17;const g=c.createLinearGradient(cx,cy,endX,endY);g.addColorStop(0,'rgba(172,255,236,.48)');g.addColorStop(1,'rgba(56,186,207,0)');c.fillStyle=g;c.beginPath();c.moveTo(cx,cy);c.lineTo(endX+nx*spread,endY+ny*spread);c.quadraticCurveTo(endX+dx*.12,endY+dy*.12,endX-nx*spread,endY-ny*spread);c.closePath();c.fill();line(c,cx,cy,endX,endY,'rgba(145,244,237,.48)');c.restore();}
  function drawStage(){const v=prepare('star');if(!v)return;const{c,w,h}=v,cx=w*.5,cy=h*.5,r=Math.min(w*.15,h*.16,78),turn=TAU*state.playback.cycles,power=response(state.playback.cycles),m=vector(num('alpha'),turn),neg=m.map(x=>-x),observer=vector(num('zeta'),OBS_AZ),op=project(observer),mp=project(m);
    for(const s of stars){c.fillStyle=`rgba(165,217,224,${s.a})`;c.beginPath();c.arc(s.x*w,s.y*h,s.r,0,TAU);c.fill();}
    c.strokeStyle='rgba(112,169,185,.13)';for(const n of [1.6,2.35]){c.beginPath();c.arc(cx,cy,r*n,0,TAU);c.stroke();}
    const axis=project([0,0,1]);line(c,cx-axis.x*r*2.2,cy+axis.y*r*2.2,cx+axis.x*r*2.2,cy-axis.y*r*2.2,'rgba(139,233,223,.58)',1.4,[5,6]);
    c.fillStyle='#a4dce1';c.font='11px ui-monospace,monospace';c.fillText('Ω  DÖNME EKSENİ',16,25);
    const ox=cx+op.x*r*2.7,oy=cy-op.y*r*2.7;line(c,cx,cy,ox,oy,'rgba(225,170,104,.75)',1.4,[3,5]);c.fillStyle=power>.15?'#ffdaa1':'#e1aa68';c.beginPath();c.arc(ox,oy,4+power*4,0,TAU);c.fill();c.fillText('○  GÖZLEMCİ',16,58);
    for(const b of [m,neg])if(project(b).depth<=0)beam(c,cx,cy,r,b,false,power);
    const halo=c.createRadialGradient(cx,cy,r*.1,cx,cy,r*2.2);halo.addColorStop(0,`rgba(151,244,226,${.16+power*.22})`);halo.addColorStop(1,'rgba(82,204,217,0)');c.fillStyle=halo;c.beginPath();c.arc(cx,cy,r*2.2,0,TAU);c.fill();
    const body=c.createRadialGradient(cx-r*.3,cy-r*.38,0,cx,cy,r);body.addColorStop(0,'#effff2');body.addColorStop(.25,'#afdcd0');body.addColorStop(.6,'#4d8e96');body.addColorStop(1,'#061827');c.fillStyle=body;c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();
    c.save();c.beginPath();c.arc(cx,cy,r-1,0,TAU);c.clip();for(const patch of patches){const p=project([Math.cos(patch.lat)*Math.cos(patch.lon+turn),Math.cos(patch.lat)*Math.sin(patch.lon+turn),Math.sin(patch.lat)]);if(p.depth<=0)continue;c.fillStyle=`rgba(221,255,231,${.08+p.depth*.3})`;c.beginPath();c.ellipse(cx+p.x*r,cy-p.y*r,r*patch.size*(.5+p.depth),r*patch.size*.5,turn*.3,0,TAU);c.fill();}c.restore();
    for(const b of [m,neg])if(project(b).depth>0)beam(c,cx,cy,r,b,true,power);
    line(c,cx-mp.x*r*1.7,cy+mp.y*r*1.7,cx+mp.x*r*1.7,cy-mp.y*r*1.7,'rgba(255,237,176,.75)',1.4);
    c.fillStyle='#ffedb0';for(const b of [m,neg]){const q=project(b);c.beginPath();c.arc(cx+q.x*r,cy-q.y*r,4,0,TAU);c.fill();}c.fillText('μ  MANYETİK EKSEN',16,41);
  }
  function drawSignal(id,live){const v=prepare(id);if(!v)return;const{c,w,h}=v,top=22,base=h-34,amp=base-top-5;for(let i=0;i<=6;i++){let x=i*w/6;line(c,x,0,x,h,i===6?'rgba(225,170,104,.45)':'rgba(119,166,181,.14)');}for(const y of [top,(top+base)/2,base])line(c,0,y,w,y,'rgba(119,166,181,.24)');const yAt=x=>{const cycles=live?state.playback.cycles-5+5*x/w:x/w;return base-response(cycles)*amp;};const fill=c.createLinearGradient(0,top,0,base);fill.addColorStop(0,'rgba(112,227,224,.22)');fill.addColorStop(1,'rgba(112,227,224,.01)');c.beginPath();c.moveTo(0,base);for(let x=0;x<=w;x+=2)c.lineTo(x,yAt(x));c.lineTo(w,base);c.closePath();c.fillStyle=fill;c.fill();c.beginPath();for(let x=0;x<=w;x+=2)x?c.lineTo(x,yAt(x)):c.moveTo(x,yAt(x));c.strokeStyle='#a0f5ea';c.lineWidth=2;c.shadowColor='#52dbdc';c.shadowBlur=8;c.stroke();c.shadowBlur=0;line(c,w*(live?1:(state.playback.cycles%1)),top,w*(live?1:(state.playback.cycles%1)),base,'rgba(225,170,104,.6)',1,[3,4]);c.fillStyle='#97b5be';c.font='11px ui-monospace,monospace';c.fillText(live?'5 DÖNÜŞLÜK PENCERE':'DÖNME FAZI 0 → 1',12,h-10);}
  function nextPulse(){
    if(!visible())return null;
    const alpha=num('alpha'),zeta=num('zeta'),rho=num('rho');
    const peaks=[];
    if(Math.abs(zeta-alpha)<rho)peaks.push(0);
    if(Math.abs(180-zeta-alpha)<rho)peaks.push(Math.PI);
    const current=phase(state.playback.cycles);
    const remaining=peaks.map(target=>((target-current)%TAU+TAU)%TAU || TAU);
    return Math.min(...remaining)/TAU*num('period');
  }
  function drawDynamic(){if(state.tab==='geometry'){drawStage();drawSignal('trace',true);}if(state.tab==='signal'&&state.signalView==='model')drawSignal('profile',false);const ph=((phase(state.playback.cycles)%TAU+TAU)%TAU)/RAD,power=response(state.playback.cycles);$('phase-corner').textContent=`${nf(ph,0)}°`;$('phase-readout').textContent=`${nf(ph,0)}°`;$('intensity-readout').textContent=nf(power*100,0);const indicator=$('detection-indicator');indicator.querySelector('span').textContent=!visible()?'ATIM YOK':power>.1?'ATIM ALGILANIYOR':'ATIM BEKLENİYOR';indicator.classList.toggle('waiting',visible()&&power<=.1);const next=nextPulse();$('next-pulse').textContent=next===null?'yok':next<.001?`${nf(next*1000,2)} ms`:`${nf(next,3)} s`;$('signal-next').textContent=`Sonraki: ${$('next-pulse').textContent}`;}
  function drawAll(){drawDynamic();if(state.tab==='ppdot')drawMap();if(state.tab==='dispersion')drawWaterfall();}

  // Static catalogue population. Canvas positions are reused for hover and curated-object selection.
  let plotted=[];
  const limits={x0:-3.4,x1:1.3,y0:-22.5,y1:-8.5};
  function drawMap(){const v=prepare('ppdot');if(!v)return;const{c,w,h}=v,m={left:68,right:17,top:18,bottom:50},pw=w-m.left-m.right,ph=h-m.top-m.bottom;const x=P=>m.left+(Math.log10(P)-limits.x0)/(limits.x1-limits.x0)*pw,y=D=>m.top+(limits.y1-Math.log10(D))/(limits.y1-limits.y0)*ph,inside=(P,D)=>P>0&&D>0&&Math.log10(P)>=limits.x0&&Math.log10(P)<=limits.x1&&Math.log10(D)>=limits.y0&&Math.log10(D)<=limits.y1;
    c.font='10px ui-monospace,monospace';c.fillStyle='#97b5be';for(let q=-3;q<=1;q++){let xx=x(10**q);line(c,xx,m.top,xx,m.top+ph,'rgba(119,166,181,.14)');c.fillText(`10^${q}`,xx-13,h-25);}for(let q=-22;q<=-10;q+=2){let yy=y(10**q);line(c,m.left,yy,m.left+pw,yy,'rgba(119,166,181,.14)');c.fillText(`10^${q}`,8,yy+3);}c.fillText('P [s] →',w/2-22,h-8);c.fillText('Ṗ [s/s]',m.left,12);
    function guide(fn,label){c.beginPath();let started=false;for(let i=0;i<180;i++){const P=10**(limits.x0+(limits.x1-limits.x0)*i/179),D=fn(P);if(!inside(P,D)){started=false;continue;}const xx=x(P),yy=y(D);started?c.lineTo(xx,yy):c.moveTo(xx,yy);started=true;}c.setLineDash([4,7]);c.lineWidth=1;c.strokeStyle='rgba(225,170,104,.32)';c.stroke();c.setLineDash([]);}
    for(const B of [1e8,1e12,1e14])guide(P=>(B/3.2e19)**2/P,`B${B}`);
    for(const age of [1e3,1e6,1e9])guide(P=>P/(2*age*Physics.constants.YEAR),`τ${age}`);
    plotted=[];for(const row of POPULATION){const [n,P,D,t,binary]=row;if(!inside(P,D))continue;const xx=x(P),yy=y(D);let color=t&&/AXP|SGR/.test(t)?'#d89665':P<.03?'#9a9ce2':'#5d8391';c.fillStyle=color;c.globalAlpha=.55;c.beginPath();c.arc(xx,yy,1.5,0,TAU);c.fill();if(binary){c.strokeStyle='#89c6ba';c.lineWidth=.7;c.beginPath();c.arc(xx,yy,2.6,0,TAU);c.stroke();}plotted.push({name:n,x:xx,y:yy});}c.globalAlpha=1;
    const catP=Number(state.catalogue.period),catD=Number(state.catalogue.period_dot),expP=num('period'),expD=num('period_dot');
    if(inside(catP,catD)){const cx=x(catP),cy=y(catD);if(state.mode==='experiment'&&inside(expP,expD)&&(catP!==expP||catD!==expD)){line(c,cx,cy,x(expP),y(expD),'rgba(225,170,104,.78)',1.5,[4,4]);c.strokeStyle='#ffedb0';c.lineWidth=2;c.beginPath();c.arc(cx,cy,7,0,TAU);c.stroke();c.fillStyle='#e1aa68';c.beginPath();c.arc(x(expP),y(expD),6,0,TAU);c.fill();}else{c.fillStyle='#ffedb0';c.beginPath();c.arc(cx,cy,6,0,TAU);c.fill();}c.font='11px ui-monospace,monospace';c.fillStyle='#ffedb0';c.fillText('SEÇİLEN',Math.min(cx+10,w-74),Math.max(cy-10,19));}else if(state.mode==='experiment'&&inside(expP,expD)){c.fillStyle='#e1aa68';c.beginPath();c.arc(x(expP),y(expD),6,0,TAU);c.fill();}
  }
  function syncMapDescription(){const c=state.catalogue;$('map-name').textContent=c.name;$('map-description').innerHTML=c.period_dot==null?`<strong>Katalog konumu yok.</strong> Ṗ kaydı bu aynada bulunmadığından gerçek nesne haritada gösterilemez. Deneyde Ṗ girerseniz yalnız deneysel konum görünür.`:`<strong>Katalog:</strong> P=${esc(c.period)} s, Ṗ=${esc(c.period_dot)} s/s.${state.mode==='experiment'?`<br><strong>Deney:</strong> P=${esc(raw(val('period')))} s, Ṗ=${esc(raw(val('period_dot')))} s/s. Katalog noktası korunur.`:''}`;}
  function syncDispersion(){if(val('dm')===null){$('dispersion-result').textContent='DM katalogda yok. Deneyde bir DM girerek yayılımı sınayın.';return;}const s=state.observation,lo=s.centreMHz-s.bandwidthMHz/2,hi=s.centreMHz+s.bandwidthMHz/2,dt=Physics.dispersionDelay(num('dm'),lo,hi);$('dispersion-result').textContent=dt===null?'Geçerli pozitif frekans ve bant genişliği seçin.':`${nf(lo,0)}–${nf(hi,0)} MHz boyunca gecikme: ${nf(dt,3)} ms. ${s.dedispersed?'Kanallar model gecikmesi çıkarılarak hizalandı.':'Düşük frekans daha geç ulaşıyor.'}`;}
  function drawWaterfall(){const v=prepare('waterfall');if(!v)return;const{c,w,h}=v,s=state.observation,dm=num('dm'),lo=s.centreMHz-s.bandwidthMHz/2,hi=s.centreMHz+s.bandwidthMHz/2,m={l:52,r:18,t:20,b:40},pw=w-m.l-m.r,ph=h-m.t-m.b;if(!Number.isFinite(dm)||dm<0||lo<=0||hi<=lo)return;const span=Physics.dispersionDelay(dm,lo,hi)||0;for(let i=0;i<s.channels;i++){const freq=hi-(i+.5)/s.channels*(hi-lo),delay=Physics.dispersionDelay(dm,freq,hi)||0,center=s.dedispersed?.5:.16+(span?delay/span*.68:0),rowH=ph/s.channels;const grad=c.createLinearGradient(m.l,0,m.l+pw,0);for(let j=0;j<=16;j++){const t=j/16,intensity=Math.exp(-.5*((t-center)/.018)**2);grad.addColorStop(t,`rgba(${Math.round(24+120*intensity)},${Math.round(72+155*intensity)},${Math.round(90+142*intensity)},1)`);}c.fillStyle=grad;c.fillRect(m.l,m.t+i*rowH,pw,rowH+.4);if(i%4===0){c.fillStyle='#a8cad0';c.font='10px ui-monospace,monospace';c.fillText(`${nf(freq,0)}`,4,m.t+i*rowH+8);}}line(c,m.l,m.t+ph,m.l+pw,m.t+ph,'#567685');c.fillStyle='#a8cad0';c.font='10px ui-monospace,monospace';c.fillText(`0 ms`,m.l,h-13);c.fillText(`${nf(span,2)} ms yayılım`,Math.max(m.l,m.l+pw-115),h-13);}
  const missions={lose:['Periyoda dokunmadan bakış açısını değiştir. Atımın kaybolduğu koşulu bul.','Görüş hattı iki ışın konisinin dışına çıktı. Dönme sürse de atım algılanmaz.'],find:['α, ζ ve ρ ilişkisini kullanarak yeniden atım üret.','Görüş hattı en az bir manyetik ışını kesiyor.'],fast:['Dönme frekansını 100 Hz üzerine çıkar. RLC nasıl değişir?','P küçülünce frekans artar, ışık silindiri yarıçapı azalır.'],dedispersion:['Yayılım ekranında kanalları hizalamadan önce ne olacağını tahmin et.','DM gecikmesi geri alınınca sentetik kanal darbeleri aynı zamana gelir.'],age:['Deneyde Ṗ değerini değiştir. Karakteristik yaş nasıl etkilenir?','τc=P/(2Ṗ); P sabitken Ṗ artarsa karakteristik yaş azalır. Bu doğrudan gerçek yaş değildir.']};
  function missionPrompt(){$('mission-prompt').textContent=missions[$('mission-select').value][0];$('mission-result').hidden=true;}
  function missionCheck(){if(!$('prediction').value.trim()){$('mission-result').textContent='Önce bir tahmin yaz; sonra sonucu karşılaştır.';$('mission-result').hidden=false;return;}const key=$('mission-select').value,done=key==='lose'?!visible():key==='find'?visible():key==='fast'?Physics.frequency(num('period'))>100:key==='dedispersion'?state.observation.dedispersed:state.mode==='experiment'&&state.experiment.period_dot!==undefined;$('mission-result').textContent=done?`Ne oldu? ${missions[key][1]}`:'Koşul henüz sağlanmadı. Parametreyi değiştirip yeniden dene.';$('mission-result').hidden=false;}

  makeControls();$('population-count').textContent=nf(POPULATION.length,0);
  document.querySelector('#page-ppdot .legend + .microcopy').textContent='Kesikli kılavuzlar: B=10⁸, 10¹², 10¹⁴ G; τc=10³, 10⁶, 10⁹ yıl. Milisaniye rengi P<30 ms kuralıdır. Ṗ yoksa nesne yerleştirilemez.';
  for(const item of catalogue){const opt=document.createElement('option');opt.value=item.name;opt.textContent=`${name(item)}${item.name==='PSR J0534+2200'?' · Crab':item.name==='PSR J0835-4510'?' · Vela':''}`;$('pulsar-select').append(opt);}
  $('pulsar-select').addEventListener('change',e=>selectObject(catalogue.find(o=>o.name===e.target.value)));
  $('catalogue-mode').addEventListener('click',()=>{LabState.reset(state);sync();});
  $('experiment-mode').addEventListener('click',()=>{state.mode='experiment';sync();});
  $('reset').addEventListener('click',()=>{LabState.reset(state);sync();});
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('.tab-page').forEach(p=>p.hidden=p.id!==`page-${state.tab}`);requestAnimationFrame(drawAll);}));
  $('toggle').addEventListener('click',()=>{state.playback.running=!state.playback.running;$('toggle').textContent=state.playback.running?'⏸':'▶';$('toggle').setAttribute('aria-label',state.playback.running?'Animasyonu duraklat':'Animasyonu oynat');});
  $('step').addEventListener('click',()=>{state.playback.running=false;$('toggle').textContent='▶';state.playback.cycles+=1/24;drawDynamic();});
  $('speed').addEventListener('change',e=>{state.playback.speed=Number(e.target.value);});
  $('model-view').addEventListener('click',()=>{state.signalView='model';$('model-view').classList.add('active');$('observed-view').classList.remove('active');$('model-signal').hidden=false;$('observed-signal').hidden=true;drawAll();});
  $('observed-view').addEventListener('click',()=>{state.signalView='observed';$('observed-view').classList.add('active');$('model-view').classList.remove('active');$('model-signal').hidden=true;$('observed-signal').hidden=false;});
  $('dm-input').addEventListener('input',e=>{const value=Number(e.target.value);if(e.target.value!==''&&value>=0&&value<=1000&&LabState.setExperiment(state,'dm',value)){state.observation.dedispersed=false;syncMode();syncSummary();drawAll();$('dm-badge').textContent='DENEY';$('dm-badge').className='badge experiment';}});
  $('dm-input').addEventListener('change',e=>{const value=Number(e.target.value);if(e.target.value!==''&&value>=0&&value<=1000&&LabState.setExperiment(state,'dm',value)){state.observation.dedispersed=false;sync();}else sync();});
  for(const [id,key] of [['centre-input','centreMHz'],['bandwidth-input','bandwidthMHz'],['channels-input','channels']])$(id).addEventListener('change',e=>{const n=Number(e.target.value);if(!Number.isFinite(n)||n<=0||key==='bandwidthMHz'&&n>=2*state.observation.centreMHz||key==='centreMHz'&&n<=state.observation.bandwidthMHz/2){e.target.value=state.observation[key];return;}state.observation[key]=n;state.observation.dedispersed=false;syncDispersion();drawWaterfall();});
  $('dedisperse').addEventListener('click',()=>{state.observation.dedispersed=true;syncDispersion();drawWaterfall();});
  $('restore-dispersion').addEventListener('click',()=>{state.observation.dedispersed=false;syncDispersion();drawWaterfall();});
  $('mission-select').addEventListener('change',missionPrompt);$('mission-check').addEventListener('click',missionCheck);missionPrompt();
  $('ppdot').addEventListener('mousemove',e=>{const box=e.target.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;let nearest=null,best=8;for(const p of plotted){const d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;nearest=p;}}const tip=$('map-tooltip');tip.hidden=!nearest;if(nearest){tip.textContent=nearest.name;tip.style.left=`${Math.min(x+24,box.width-145)}px`;tip.style.top=`${Math.max(0,y-25)}px`;}});
  $('ppdot').addEventListener('mouseleave',()=>$('map-tooltip').hidden=true);
  $('ppdot').addEventListener('click',e=>{const box=e.target.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;let closest=null,best=12;for(const item of catalogue){const p=plotted.find(a=>a.name===item.name);if(p){const d=Math.hypot(p.x-x,p.y-y);if(d<best){best=d;closest=item;}}}if(closest)selectObject(closest);});
  new ResizeObserver(()=>drawAll()).observe(document.querySelector('.app'));
  sync();$('toggle').textContent=state.playback.running?'⏸':'▶';
  let previous=performance.now();function frame(now){const delta=Math.min(100,Math.max(0,now-previous));previous=now;if(state.playback.running)state.playback.cycles+=delta/1000/num('period')*state.playback.speed;drawDynamic();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
