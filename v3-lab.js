/* V3 scientific workspaces. All catalogue values remain immutable in LabState. */
const AstroLabPages = (() => {
  const $ = id => document.getElementById(id);
  const lab = window.AstroLab, state = lab.state, objects = lab.catalogue;
  const fmt = (n, digits=4) => n === null || n === undefined || n === '' || !Number.isFinite(Number(n)) ? 'Veri yok' : new Intl.NumberFormat('tr-TR',{maximumSignificantDigits:digits}).format(Number(n));
  const sci = n => n === null || n === undefined || !Number.isFinite(Number(n)) ? 'Veri yok' : Number(n).toExponential(3);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const value = key => LabState.current(state,key);
  const current = () => state.catalogue;
  const tag = (label,n,unit,scientific=false) => `<div class="stat"><span>${label}</span><strong>${scientific?sci(n):fmt(n)}</strong><small>${unit}</small></div>`;
  let route = null, navigating = false;
  let compared = ['PSR J0534+2200','PSR J0835-4510','PSR J0437-4715'];
  let glitchSequence=null;
  const names = ['overview','geometry','timing','ppdot','propagation','observations','glitches','data','compare'];
  const labels = ['GENEL BAKIŞ','GEOMETRİ','ZAMANLAMA','P–Ṗ','YAYILIM','GÖZLEMLER','GLITCHLER','VERİ','KARŞILAŞTIR'];

  function updateUrl() {
    if(navigating || !route || route.mode!=='lab')return;
    const hash=route.page==='compare'?AstroRouter.compareHash(compared):AstroRouter.experimentHash(current().name,route.page,state.experiment,state.observation);
    if(location.hash!==hash)history.replaceState(null,'',hash);
    $('lab-share').setAttribute('data-url',location.href);
  }
  function copyLink(button,feedback){navigator.clipboard.writeText(location.href).then(()=>{$(feedback).textContent='Bağlantı kopyalandı.';},()=>{$(feedback).textContent='Bağlantı kopyalanamadı; adres çubuğundan alabilirsiniz.';});}
  function download(name,mime,body){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:mime}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function objectHeader(){const p=current();$('lab-object-header').innerHTML=route?.page==='compare'?`<div><small>LAB / KATALOG KARŞILAŞTIRMASI</small><h2>${compared.length} pulsar · yan yana analiz</h2><small>${compared.map(esc).join(' · ')}</small></div><div class="lab-quick"><button class="btn secondary" id="lab-share" type="button">Bağlantıyı kopyala</button></div>`:`<div><small>LAB / ${esc(p.alt_name||'ATNF KATALOG NESNESİ')} · ${esc(p.pulsar_type||'Tür bilgisi yok')}</small><h2>${esc(p.name)}</h2><small>ATNF / HEASARC · ${esc(p.retrieved||'Tarih yok')} · ${esc(p.assoc_object||'İlişki kaydı yok')}</small></div><div class="lab-quick"><span>P <strong>${fmt(p.period,9)} s</strong></span><span>Ṗ <strong>${sci(p.period_dot)} s/s</strong></span><span>DM <strong>${fmt(p.dm,6)} pc cm⁻³</strong></span><button class="btn secondary" id="lab-share" type="button">Bağlantıyı kopyala</button></div>`;$('lab-share').addEventListener('click',()=>copyLink('lab-share','lab-share-feedback'));
    let feedback=$('lab-share-feedback');if(!feedback){feedback=document.createElement('span');feedback.id='lab-share-feedback';feedback.setAttribute('role','status');$('lab-object-header').append(feedback);}
  }
  function overview(){const p=current(),d=Physics.derived(Number(p.period),Number(p.period_dot));
    const rows=[['P',p.period,'s'],['Ṗ',p.period_dot,'s/s'],['DM',p.dm,'pc cm⁻³'],['Uzaklık',p.distance,'kpc'],['RM',p.rm,'rad/m²'],['RA',p.ra,'°'],['Dec',p.dec,'°']];
    $('overview-catalogue').innerHTML=rows.map(([k,v,u])=>`<div class="source-item"><span>${k} · KATALOG</span><strong>${esc(v===null||v===undefined?'Veri yok':v)} ${v==null?'':u}</strong></div>`).join('');
    $('overview-derived').innerHTML=tag('ν',d.frequency,'Hz')+tag('ν̇',d.frequencyDot,'Hz/s',true)+tag('τc',d.ageYears,'yıl')+tag('Bs',d.fieldGauss,'G',true)+tag('Ė',d.edotErgS,'erg/s',true)+tag('RLC',d.lightCylinderKm,'km');
    $('overview-meta').innerHTML=`<p><strong>Tür:</strong> ${esc(p.pulsar_type||'Veri yok')}</p><p><strong>Diğer adı:</strong> ${esc(p.alt_name||'Veri yok')}</p><p><strong>İkili model:</strong> ${esc(p.binary_model||'Veri yok')}</p><p><strong>İlişkili nesne:</strong> ${esc(p.assoc_object||'Veri yok')}</p><p><strong>Uzaklık yöntemi:</strong> ${esc(p.distance_method||'Veri yok')}</p>`;
    $('overview-data-link').href=AstroRouter.experimentHash(p.name,'data',state.experiment,state.observation);
  }
  function timing(){const p=Number(value('period')),pd=Number(value('period_dot')),d=Physics.derived(p,pd);$('timing-values').innerHTML=tag('P · '+(state.experiment.period!==undefined?'DENEY':'KATALOG'),p,'s')+tag('ν · TÜRETİLEN',d.frequency,'Hz')+tag('Ṗ · '+(state.experiment.period_dot!==undefined?'DENEY':'KATALOG'),value('period_dot'),'s/s',true)+tag('ν̇ · TÜRETİLEN',d.frequencyDot,'Hz/s',true);
    $('timing-period').value=Number.isFinite(p)?String(p):'';$('timing-pdot').value=Number.isFinite(pd)?String(pd):'';
    const v=lab.prepare('timing-plot');if(!v)return;const{c,w,h}=v,m={l:62,r:22,t:22,b:38},pw=w-m.l-m.r,ph=h-m.t-m.b;
    c.strokeStyle='#42616e';c.lineWidth=1;c.strokeRect(m.l,m.t,pw,ph);c.fillStyle='#9fc2ca';c.font='11px ui-monospace,monospace';
    const horizon=1000, yMax=Number.isFinite(pd)&&pd>0?pd*Physics.constants.YEAR*horizon*1e6:null;
    for(let i=0;i<=4;i++){const xx=m.l+i*pw/4;c.fillText(`${i*horizon/4} yıl`,xx-15,h-12);if(yMax!==null)c.fillText(`${fmt(yMax*(4-i)/4,3)}`,4,m.t+i*ph/4+4);}
    c.fillText('ΔP [µs]',4,14);
    if(yMax===null){c.fillText('Ṗ verisi yok; model eğrisi çizilemedi.',m.l+15,m.t+ph/2);return;}
    c.beginPath();c.moveTo(m.l,m.t+ph);c.lineTo(m.l+pw,m.t);c.strokeStyle='#8ee8df';c.lineWidth=2;c.stroke();
  }
  function compareNamesFromQuery(query){return AstroRouter.readComparison(query,objects)||compared;}
  function compare(){const rows=compared.map(n=>objects.find(o=>o.name===n)).filter(Boolean);$('lab-compare-selector').innerHTML=objects.map(p=>`<label><input type="checkbox" value="${esc(p.name)}" ${compared.includes(p.name)?'checked':''}>${esc(p.alt_name||p.name)}</label>`).join('');
    const headers=['Pulsar','P [s]','ν [Hz]','Ṗ [s/s]','ν̇ [Hz/s]','DM [pc cm⁻³]','Uzaklık [kpc]','τc [yıl]','Bs [G]','Ė [erg/s]','RLC [km]','Tür'];$('lab-compare-table').querySelector('thead').innerHTML=`<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`;
    $('lab-compare-table').querySelector('tbody').innerHTML=rows.map(p=>{const d=Physics.derived(Number(p.period),Number(p.period_dot));return `<tr><th>${esc(p.name)}</th><td>${fmt(p.period,9)}</td><td>${fmt(d.frequency,6)}</td><td>${sci(p.period_dot)}</td><td>${sci(d.frequencyDot)}</td><td>${fmt(p.dm,6)}</td><td>${fmt(p.distance,5)}</td><td>${fmt(d.ageYears,4)}</td><td>${sci(d.fieldGauss)}</td><td>${sci(d.edotErgS)}</td><td>${fmt(d.lightCylinderKm,5)}</td><td>${esc(p.pulsar_type||'Veri yok')}</td></tr>`;}).join('');
    const v=lab.prepare('compare-map');if(!v)return;const{c,w,h}=v,m={l:67,r:20,t:22,b:42},pw=w-m.l-m.r,ph=h-m.t-m.b,x=P=>m.l+(Math.log10(P)+3.4)/4.7*pw,y=D=>m.t+(-8.5-Math.log10(D))/14*ph;
    c.strokeStyle='#42616e';c.strokeRect(m.l,m.t,pw,ph);c.fillStyle='#9fc2ca';c.font='11px ui-monospace,monospace';c.fillText('log P [s] →',w/2-30,h-12);c.fillText('log Ṗ',7,14);for(let i=0;i<rows.length;i++){const p=rows[i],P=Number(p.period),D=Number(p.period_dot);if(!(P>0&&D>0))continue;const xx=x(P),yy=y(D);c.fillStyle=['#8ee8df','#e7b577','#b5aeeb','#c3dd82'][i];c.beginPath();c.arc(xx,yy,5,0,2*Math.PI);c.fill();c.fillText(p.alt_name||p.name,Math.min(xx+9,w-105),Math.max(yy-9,15));}
  }
  function data(){const p=current(),r=AstroExports.record(p);$('data-object-name').textContent=p.name;$('data-table').querySelector('tbody').innerHTML=r.catalogue.concat(r.derived).map(f=>`<tr><th>${esc(f.field)}</th><td>${esc(f.value===null?'Veri yok':f.value)}</td><td>${esc(f.unit)}</td><td>${esc(f.semantic)}</td><td>${esc(f.uncertainty===null?'Veri yok':f.uncertainty)}</td><td>${esc(f.source)}</td><td>${esc(f.method||'Veri yok')}</td><td><a href="${esc(f.reference)}" target="_blank" rel="noopener noreferrer">ATNF ↗</a></td></tr>`).join('');$('data-formulas').innerHTML=AstroExports.formulas.map(([,symbol,unit,formula])=>`<p><strong>${esc(symbol)} [${esc(unit)}]</strong> = ${esc(formula)} · TÜRETİLEN</p>`).join('')+'<p>Model ışın geometrisi α=42°, ζ=48°, ρ=12° varsayılanlarıyla başlar. Bu açılar katalog ölçümü değildir.</p>';
  }
  function glitchPlot(items){const v=lab.prepare('glitch-plot');if(!v)return;const{c,w,h}=v,m={l:62,r:22,t:18,b:42},pw=w-m.l-m.r,ph=h-m.t-m.b,valid=items.filter(e=>e.mjd!==null&&e.deltaNuFractionNinth>0);if(!valid.length)return;
    const minX=Math.min(...valid.map(e=>e.mjd)),maxX=Math.max(...valid.map(e=>e.mjd)),minY=Math.min(...valid.map(e=>Math.log10(e.deltaNuFractionNinth)))-.25,maxY=Math.max(...valid.map(e=>Math.log10(e.deltaNuFractionNinth)))+.25;
    const x=e=>m.l+(e.mjd-minX)/Math.max(1,maxX-minX)*pw,y=e=>m.t+(maxY-Math.log10(e.deltaNuFractionNinth))/(maxY-minY)*ph;
    c.strokeStyle='#42616e';c.strokeRect(m.l,m.t,pw,ph);c.font='11px ui-monospace,monospace';c.fillStyle='#9fc2ca';c.fillText('MJD →',w/2-25,h-9);c.fillText('log Δν/ν [10⁻⁹]',6,12);c.fillText(fmt(minX,7),m.l,h-23);c.fillText(fmt(maxX,7),Math.max(m.l,w-102),h-23);
    for(const e of valid){const chosen=e.sequence===glitchSequence;c.fillStyle=chosen?'#ffdc9d':'#8ee8df';c.beginPath();c.arc(x(e),y(e),chosen?6:3.5,0,2*Math.PI);c.fill();if(chosen){c.strokeStyle='#ffdc9d';c.beginPath();c.arc(x(e),y(e),9,0,2*Math.PI);c.stroke();}}
  }
  function glitches(){const p=current(),items=GLITCHES.events.filter(e=>e.name===p.name);$('glitch-intro').textContent=items.length?`${p.name} için Jodrell Bank Pulsar Glitch Catalogue’dan tarihli olay kayıtları. Noktalar gözlemde raporlanan kesirsel frekans sıçramalarıdır; toparlanma eğrisi modellenmiyor.`:`${p.name} için doğrulanmış olayları bu sürümün veri kopyasına eklemedik. Olay yokluğu anlamına gelmez.`;
    if(items.length&&!items.some(e=>e.sequence===glitchSequence))glitchSequence=items.at(-1).sequence;
    $('glitch-content').innerHTML=items.length?`<div class="lab-form"><label for="glitch-select">Olay seç</label><select id="glitch-select">${items.map(e=>`<option value="${e.sequence}" ${e.sequence===glitchSequence?'selected':''}>#${e.sequence} · MJD ${e.mjd}</option>`).join('')}</select></div><canvas id="glitch-plot" class="lab-plot" role="img" aria-label="MJD'ye göre katalog glitch sıçramaları; seçilen olay vurgulanır"></canvas><p class="microcopy">KATALOG OLAYLARI · dikey eksen logaritmik Δν/ν, 10⁻⁹ biriminde. Noktalar arasında veri veya toparlanma eğrisi çizilmez.</p><div id="glitch-detail" class="lab-note"></div><div class="glitch-table-wrap"><table class="scientific-table"><thead><tr><th>#</th><th>MJD [gün]</th><th>± [gün]</th><th>Δν/ν [10⁻⁹]</th><th>±</th><th>Δν̇/ν̇ [10⁻³]</th><th>±</th><th>Kaynak</th></tr></thead><tbody>${items.map(e=>`<tr ${e.sequence===glitchSequence?'class="selected-event"':''}><td>${e.sequence}</td><td>${e.mjd}</td><td>${fmt(e.mjdUncertaintyDays,5)}</td><td>${fmt(e.deltaNuFractionNinth,6)}</td><td>${fmt(e.deltaNuFractionNinthUncertainty,5)}</td><td>${fmt(e.deltaNuDotFractionThousandth,5)}</td><td>${fmt(e.deltaNuDotFractionThousandthUncertainty,5)}</td><td>${esc(e.reference)}</td></tr>`).join('')}</tbody></table></div>`:'';
    $('glitch-content').innerHTML+=`<div class="lab-actions"><a class="btn secondary" href="${GLITCHES.url}" target="_blank" rel="noopener noreferrer">Jodrell Bank kayıtlarını aç ↗</a><span class="microcopy">Veri kopyası: ${GLITCHES.snapshot}</span></div>`;
    if(items.length){const selected=items.find(e=>e.sequence===glitchSequence);$('glitch-detail').innerHTML=`<strong>#${selected.sequence} · MJD ${selected.mjd}</strong><p>Δν/ν = ${fmt(selected.deltaNuFractionNinth,6)} × 10⁻⁹; Δν̇/ν̇ = ${fmt(selected.deltaNuDotFractionThousandth,5)} × 10⁻³. Bilinmeyen hata alanları tabloda “Veri yok” gösterilir.</p><p>Kaynak: ${esc(selected.reference)}</p>`;$('glitch-select').addEventListener('change',e=>{glitchSequence=Number(e.target.value);glitches();});glitchPlot(items);}
  }
  function refresh(){if(!route||route.mode!=='lab')return;objectHeader();overview();data();glitches();if(route.page==='timing')timing();if(route.page==='compare')compare();if(route.page==='propagation')$('sampling-input').value=state.observation.samplingMs;updateUrl();}
  function navigate(next){route=next;navigating=true;
    if(next.page==='compare')compared=compareNamesFromQuery(next.query);
    const id=next.page==='observations'?'signal':next.page==='propagation'?'dispersion':next.page;
    state.tab=id;
    document.querySelectorAll('#lab-shell .tab-page').forEach(el=>el.hidden=el.id!==`page-${id}`);
    document.querySelectorAll('#lab-shell [data-lab-page]').forEach(el=>{el.classList.toggle('active',el.dataset.labPage===next.page);el.setAttribute('aria-current',el.dataset.labPage===next.page?'page':'false');});
    refresh();navigating=false;requestAnimationFrame(()=>{lab.drawAll();if(next.page==='timing')timing();if(next.page==='compare')compare();if(next.page==='glitches')glitches();});
  }
  function init(){const nav=document.querySelector('#lab-shell nav.tabs');nav.innerHTML=names.map((name,i)=>`<button type="button" data-lab-page="${name}">${labels[i]}</button>`).join('')+'<a class="lab-explore-link" href="#/explore">KEŞFET ↗</a>';
    nav.addEventListener('click',e=>{const target=e.target.closest('[data-lab-page]');if(!target)return;location.hash=target.dataset.labPage==='compare'?AstroRouter.compareHash(compared):AstroRouter.experimentHash(current().name,target.dataset.labPage,state.experiment,state.observation);});
    $('pulsar-select').addEventListener('change',e=>{if(route?.mode!=='lab')return;e.stopImmediatePropagation();const item=objects.find(p=>p.name===e.target.value);if(item)location.hash=AstroRouter.experimentHash(item.name,route.page==='compare'?'overview':route.page,{},state.observation);},true);
    for(const [id,key] of [['timing-period','period'],['timing-pdot','period_dot']])$(id).addEventListener('change',e=>{if(!LabState.setExperiment(state,key,Number(e.target.value))){refresh();return;}lab.sync();});
    $('timing-reset').addEventListener('click',()=>{LabState.reset(state);lab.sync();});
    $('lab-compare-selector').addEventListener('change',e=>{if(e.target.type!=='checkbox')return;const name=e.target.value;if(e.target.checked){if(compared.length>=4){e.target.checked=false;return;}compared.push(name);}else{if(compared.length<=2){e.target.checked=true;return;}compared=compared.filter(n=>n!==name);}objectHeader();compare();updateUrl();});
    $('compare-export').addEventListener('click',()=>download('astrocom-comparison.csv','text/csv;charset=utf-8',AstroExports.comparisonCsv(compared.map(n=>objects.find(o=>o.name===n)))));
    $('compare-copy-link').addEventListener('click',()=>copyLink('compare-copy-link','compare-feedback'));
    $('download-json').addEventListener('click',()=>download(`${AstroRouter.idOf(current().name)}.json`,'application/json;charset=utf-8',JSON.stringify(AstroExports.record(current(),state),null,2)));
    $('download-csv').addEventListener('click',()=>download(`${AstroRouter.idOf(current().name)}.csv`,'text/csv;charset=utf-8',AstroExports.csv(current())));
    $('copy-citation').addEventListener('click',()=>{navigator.clipboard.writeText(`AstroCom Pulsar Lab, ATNF Pulsar Catalogue via NASA HEASARC, snapshot ${current().retrieved}; ${AstroExports.REFERENCE}`).then(()=>$('data-feedback').textContent='Atıf kopyalandı.');});
    document.querySelector('#lab-shell .below-grid .panel:last-child').removeAttribute('hidden');$('lab-source-slot').append(document.querySelector('#lab-shell .below-grid .panel:last-child'));
    const mapFilter=document.createElement('select');mapFilter.id='map-filter';mapFilter.className='lab-filter';mapFilter.setAttribute('aria-label','P–Ṗ popülasyon filtresi');mapFilter.innerHTML='<option value="all">Tüm popülasyon</option><option value="msp">P &lt; 30 ms</option><option value="magnetar">AXP / SGR</option><option value="binary">İkili</option><option value="normal">Diğer</option>';$('page-ppdot').querySelector('.panel-head').append(mapFilter);mapFilter.addEventListener('change',()=>lab.drawMap());
    const propagation=$('page-dispersion').querySelector('.panel:last-child');const extra=document.createElement('div');extra.className='lab-propagation-extra';extra.innerHTML='<div class="control"><label for="sampling-input">Zaman örnekleme</label><div class="field"><input id="sampling-input" type="number" min="0.01" max="100" step="any" value="1"><span>ms</span></div></div><div class="controls-actions"><button id="raw-view" class="btn secondary" type="button">Yayılım öncesi model</button></div><p class="microcopy">Zaman örnekleme gösterim profilini yaklaşık genişletir. Bu grafik simüle edilmiştir; cihaz tepkisi veya gerçek teleskop verisi değildir.</p>';propagation.append(extra);
    $('sampling-input').addEventListener('change',e=>{const n=Number(e.target.value);if(n>=.01&&n<=100){state.observation.samplingMs=n;lab.drawWaterfall();updateUrl();}else e.target.value=state.observation.samplingMs;});
    $('raw-view').addEventListener('click',()=>{state.observation.view='raw';state.observation.dedispersed=false;lab.drawAll();updateUrl();});
    for(const id of ['centre-input','bandwidth-input','channels-input'])$(id).addEventListener('change',updateUrl);
  }
  return {init,navigate,refresh,updateUrl,leave:()=>{route=null;},openObject:p=>{location.hash=AstroRouter.experimentHash(p.name,route?.page||'overview',state.experiment,state.observation);}};
})();
window.AstroLabPages=AstroLabPages;
