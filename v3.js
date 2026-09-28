(() => {
  'use strict';
  const $=id=>document.getElementById(id),lab=window.AstroLab;
  const fmt=(n,d=2)=>Number.isFinite(n)?new Intl.NumberFormat('tr-TR',{maximumFractionDigits:d}).format(n):'Veri yok';
  const current=key=>LabState.current(lab.state,key);
  const selected=()=>lab.state.catalogue;
  const catalogue=lab.catalogue;
  let routeState=null,beamPrediction=null,beamCaptured=false,beamChallengeDone=false,beamStarted=false;
  let dispersionPrediction=null;
  const comparison=new Set(['PSR J0534+2200','PSR J0835-4510','PSR J0437-4715']);

  function syncLink(id,page){$(id).href=AstroRouter.experimentHash(selected().name,page,lab.state.experiment,lab.state.observation);}
  function syncExplore(){
    $('explore-alpha').value=current('alpha');$('explore-zeta').value=current('zeta');
    $('explore-alpha-value').textContent=`${fmt(Number(current('alpha')),0)}°`;
    $('explore-zeta-value').textContent=`${fmt(Number(current('zeta')),0)}°`;
    syncLink('explore-lab-header','overview');syncLink('beam-lab-link','geometry');syncLink('rotation-lab-link','timing');syncLink('dispersion-lab-link','propagation');
    const sees=lab.visible();
    if(beamPrediction && sees)beamCaptured=true;
    if(beamCaptured&&!sees)beamChallengeDone=true;
    $('beam-result').hidden=!beamCaptured;
    $('beam-challenge').hidden=!beamCaptured||beamChallengeDone;
    if(beamCaptured){$('beam-result-title').textContent=beamChallengeDone?'Başardın. Işın artık Dünya’dan geçmiyor.':'Atım yakalandı.';$('beam-result-text').textContent=beamChallengeDone?'Nötron yıldızı hâlâ dönüyor ve radyo yayıyor. Yalnızca ışını artık Dünya’dan geçmiyor.':'Yıldız yeni bir şey yapmadı. Yalnızca ışını görüş hattından geçti.';}
    const p=Number(current('period')),rate=Physics.frequency(p);
    $('rotation-turn').textContent=rate?`1 tur / ${fmt(p,4)} saniye`:'Veri yok';
    $('rotation-rate').textContent=rate?`${fmt(rate,2)} tur / saniye`:'Veri yok';
    $('rotation-rate-control').value=rate?Math.log10(rate):0;
    $('rotation-rate-value').textContent=fmt(rate,2);
    $('rotation-playback').textContent=`Fiziksel hız: ${fmt(rate,2)} tur/sn · Gösterim: ${fmt(lab.state.playback.speed,3)}× hız. Aynı değer değiller.`;
    $('rotation-object').value=selected().name;
    $('explore-frequency').value=String(lab.state.observation.centreMHz);
    const s=lab.state.observation,lo=s.centreMHz-s.bandwidthMHz/2,hi=s.centreMHz+s.bandwidthMHz/2,delay=Physics.dispersionDelay(Number(current('dm')),lo,hi);
    $('explore-delay').textContent=delay===null?'Bu nesnede DM verisi yok.':`${fmt(lo,0)}–${fmt(hi,0)} MHz arasında model gecikmesi ${fmt(delay,2)} ms.`;
    if(routeState?.page==='dispersion')lab.drawWaterfall('explore-waterfall');
  }

  function navigate(){
    const route=AstroRouter.parse(location.hash,catalogue);routeState=route;
    $('landing-shell').hidden=route.mode!=='landing';$('explore-shell').hidden=route.mode!=='explore';$('lab-shell').hidden=route.mode!=='lab';
    if(route.mode!=='lab')AstroLabPages.leave();
    for(const section of document.querySelectorAll('.explore-view'))section.hidden=route.mode!=='explore'||section.id!==`explore-${route.page}`;
    lab.activeExplore=route.mode==='explore'&&['beam','rotation'].includes(route.page)?route.page:null;
    if(route.mode==='explore'&&route.page==='beam'&&!beamStarted){beamStarted=true;LabState.setExperiment(lab.state,'zeta',70);lab.sync();}
    if(route.mode==='lab'){
      if(route.object){LabState.select(lab.state,route.object);$('pulsar-select').value=route.object.name;}
      for(const [key,value] of Object.entries(AstroRouter.readExperiment(route.query)))LabState.setExperiment(lab.state,key,value);
      Object.assign(lab.state.observation,AstroRouter.readObservation(route.query));
      AstroLabPages.navigate(route);
      lab.sync();
    }
    if(route.mode==='explore'){syncExplore();requestAnimationFrame(()=>{if(route.page==='beam'){lab.drawStage('explore-star',false);lab.drawSignal('explore-trace',true);}if(route.page==='rotation')lab.drawStage('rotation-star',false);if(route.page==='dispersion')lab.drawWaterfall('explore-waterfall');});}
    document.title=route.mode==='landing'?'AstroCom Interactive · Pulsar Laboratuvarı':route.mode==='explore'?`Keşfet · ${route.page} · AstroCom`:`LAB · ${selected().name} · AstroCom`;
    window.scrollTo(0,0);
  }

  // The discovery paths operate on the same LabState and Physics instances as LAB.
  for(const key of ['alpha','zeta'])$(key==='alpha'?'explore-alpha':'explore-zeta').addEventListener('input',e=>{LabState.setExperiment(lab.state,key,Number(e.target.value));lab.sync();});
  $('beam-reset').addEventListener('click',()=>{LabState.setExperiment(lab.state,'alpha',42);LabState.setExperiment(lab.state,'zeta',70);beamCaptured=false;beamChallengeDone=false;lab.sync();});
  for(const id of ['explore-alpha','explore-zeta'])$(id).disabled=true;
  document.querySelectorAll('[data-prediction]').forEach(btn=>btn.addEventListener('click',()=>{beamPrediction=btn.dataset.prediction;for(const id of ['explore-alpha','explore-zeta'])$(id).disabled=false;document.querySelectorAll('[data-prediction]').forEach(b=>b.classList.toggle('selected',b===btn));$('beam-prediction-note').textContent='Şimdi ışını Dünya’ya yönlendir.';syncExplore();}));
  $('beam-why').addEventListener('click',()=>$('beam-explanation').hidden=false);
  $('beam-physics').addEventListener('click',()=>{$('beam-technical').open=true;$('beam-technical').scrollIntoView({block:'nearest'});});

  const rotationNames=['PSR J0056+4756','PSR J0835-4510','PSR J0534+2200','PSR J0437-4715','PSR J1748-2446ad'];
  for(const name of rotationNames){const item=catalogue.find(o=>o.name===name);for(const id of ['rotation-object','rotation-prediction']){const o=document.createElement('option');o.value=name;o.textContent=item.alt_name&&name==='PSR J0835-4510'?'Vela':name==='PSR J0534+2200'?'Crab':name;$(id).append(o);}}
  $('rotation-object').addEventListener('change',e=>{lab.selectObject(catalogue.find(o=>o.name===e.target.value));});
  $('rotation-rate-control').addEventListener('input',e=>{const rate=10**Number(e.target.value);LabState.setExperiment(lab.state,'period',1/rate);lab.state.playback.speed=Math.min(1,2/rate);lab.sync();});
  $('rotation-reveal').addEventListener('click',()=>{const winner=catalogue.find(o=>o.name==='PSR J1748-2446ad');const rate=Physics.frequency(Number(winner.period));$('rotation-result-text').textContent=`Bu seçkide en hızlı katalog nesnesi ${winner.name}: ${fmt(rate,1)} tur/sn. ${$('rotation-prediction').value===winner.name?'Tahminin doğru.':'Tahmininle karşılaştır.'} Ekran böyle hızlı bir dönüşü algılanabilir kılmak için yavaşlatabilir; fiziksel P değişmez.`;$('rotation-result').hidden=false;});

  document.querySelectorAll('[data-dispersion-prediction]').forEach(btn=>btn.addEventListener('click',()=>{dispersionPrediction=btn.dataset.dispersionPrediction;document.querySelectorAll('[data-dispersion-prediction]').forEach(b=>b.classList.toggle('selected',b===btn));$('dispersion-prediction-note').textContent='Şimdi gözlem frekansını değiştir ve kanalları hizala.';}));
  $('explore-frequency').addEventListener('change',e=>{lab.state.observation.centreMHz=Number(e.target.value);lab.state.observation.bandwidthMHz=Number(e.target.value)===150?60:100;lab.state.observation.dedispersed=false;syncExplore();});
  $('explore-dedisperse').addEventListener('click',()=>{lab.state.observation.dedispersed=true;lab.drawWaterfall('explore-waterfall');$('explore-dispersion-result').hidden=false;syncExplore();});
  $('explore-redisperse').addEventListener('click',()=>{lab.state.observation.dedispersed=false;lab.drawWaterfall('explore-waterfall');$('explore-dispersion-result').hidden=true;syncExplore();});

  const compareNames=['PSR J0534+2200','PSR J0835-4510','PSR J0437-4715','PSR J0056+4756','PSR J1748-2446ad'];
  const shortName=item=>item.name==='PSR J0534+2200'?'Crab':item.name==='PSR J0835-4510'?'Vela':item.name;
  for(const name of compareNames){const item=catalogue.find(o=>o.name===name),label=document.createElement('label');label.innerHTML=`<input type="checkbox" value="${item.name}" ${comparison.has(name)?'checked':''}><strong>${shortName(item)}</strong><small>${fmt(Physics.frequency(Number(item.period)),2)} tur/sn · katalog</small>`;$('explore-compare-cards').append(label);}
  function syncCompareChoices(){const options=Array.from(comparison).map(name=>catalogue.find(o=>o.name===name));$('compare-prediction').innerHTML='<option value="">Tahmin seç</option>'+options.map(o=>`<option value="${o.name}">${shortName(o)}</option>`).join('');$('compare-lab-link').href=AstroRouter.compareHash([...comparison]);}
  $('explore-compare-cards').addEventListener('change',e=>{if(e.target.type!=='checkbox')return;const name=e.target.value;if(e.target.checked){if(comparison.size>=3){e.target.checked=false;return;}comparison.add(name);}else{if(comparison.size<=2){e.target.checked=true;return;}comparison.delete(name);}syncCompareChoices();$('explore-compare-result').hidden=true;});
  $('compare-reveal').addEventListener('click',()=>{const objects=[...comparison].map(name=>catalogue.find(o=>o.name===name)),fastest=objects.toSorted((a,b)=>Number(a.period)-Number(b.period))[0];$('explore-compare-result').innerHTML=`<p>En hızlısı ${shortName(fastest)}: ${fmt(Physics.frequency(Number(fastest.period)),2)} tur/sn. ${$('compare-prediction').value===fastest.name?'Tahminin doğru.':'Tahmininle karşılaştır.'}</p><table><thead><tr><th>Pulsar</th><th>Bir tur</th><th>Tur/sn</th><th>Yavaşlama</th></tr></thead><tbody>${objects.map(o=>`<tr><td>${shortName(o)}</td><td>${fmt(Number(o.period),6)} s</td><td>${fmt(Physics.frequency(Number(o.period)),2)}</td><td>${o.period_dot===null?'Veri yok':Number(o.period_dot).toExponential(2)+' s/s'}</td></tr>`).join('')}</tbody></table><p>Bu değerler katalog kayıtlarından gelir. Neden farklı olduklarını LAB haritasında inceleyebilirsin.</p>`;$('explore-compare-result').hidden=false;});
  syncCompareChoices();

  AstroLabPages.init();
  window.AstroV3={refresh:()=>{syncExplore();AstroLabPages.refresh();},route:()=>routeState};
  window.addEventListener('hashchange',navigate);
  navigate();
})();
