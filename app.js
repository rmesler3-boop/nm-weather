const $=s=>document.querySelector(s);let D;
const th=localStorage.theme;if(th)document.documentElement.dataset.theme=th;
$('#theme').onclick=()=>{const c=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const n=c=='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.theme=n};
const f=(v,d=0)=>v==null?'—':(+v).toFixed(d), pct=v=>v==null?'—':Math.round(v*100)+'%';
function icon(d){const s=(d.sky||'').toLowerCase();if((d.snow_in||0)>=0.5)return'🌨️';if(d.pop>=.5)return'🌧️';if(d.pop>=.25)return'🌦️';if(d.gust_mph>=35)return'💨';
 if(s.includes('cloudy')&&!s.includes('partly')&&!s.includes('mostly sunny'))return'☁️';if(s.includes('partly'))return'⛅';if(s.includes('mostly'))return'🌤️';return'☀️'}
function chart(days,series,h=120){const W=320,pad=24,n=days.length,xs=i=>pad+i*(W-pad-6)/(n-1);let mx=Math.max(1,...series.flatMap(s=>days.map(s.v).filter(x=>x!=null)),...series.map(s=>s.line||0));
 const ys=v=>h-18-(v/mx)*(h-30);let g=`<svg viewBox="0 0 ${W} ${h}" width="100%" role="img">`;
 series.forEach(s=>{if(s.line)g+=`<line x1="${pad}" x2="${W}" y1="${ys(s.line)}" y2="${ys(s.line)}" stroke="${s.c}" stroke-dasharray="4 3" opacity=".7"/><text x="${W-4}" y="${ys(s.line)-3}" text-anchor="end">${s.lt}</text>`;
  if(s.bar)days.forEach((d,i)=>{const v=s.v(d);if(v!=null)g+=`<rect x="${xs(i)-6}" y="${ys(v)}" width="12" height="${h-18-ys(v)}" rx="3" fill="${s.c}" opacity=".75"/>`});
  else{const p=days.map((d,i)=>s.v(d)==null?null:`${xs(i)},${ys(s.v(d))}`).filter(Boolean);g+=`<polyline fill="none" stroke="${s.c}" stroke-width="2.5" points="${p.join(' ')}"/>`;days.forEach((d,i)=>{if(s.v(d)!=null)g+=`<circle cx="${xs(i)}" cy="${ys(s.v(d))}" r="3" fill="${s.c}"/>`})}});
 days.forEach((d,i)=>g+=`<text x="${xs(i)}" y="${h-4}" text-anchor="middle">${d.dow}</text>`);g+=`<text x="2" y="10">${f(mx)}</text></svg>`;
 return g+`<div class="chips">${series.map(s=>`<span class="chip" style="border-left:8px solid ${s.c}">${s.n}</span>`).join('')}</div>`}
const nwsTxt=d=>d.nws.length?d.nws.map(p=>`<div><b>${p.name}</b>: ${p.short} · ${p.temp}°F · PoP ${p.pop}% · ${p.wind}</div>`).join(''):'<div class="muted">No NWS period</div>';
const amt=d=>d.pop<.1?'dry':`${f(d.med_in,2)}–${f(d.q90_in,2)}″`;
function dayCard(d,temps){return `<div class="card day" onclick="this.classList.toggle('open')"><div><div class="dow">${d.d==1?'Today':d.dow}</div><div class="muted">${d.date.slice(5)}</div></div>
<div class="ic">${icon(d)}</div><div>${d.sky?`<div>${d.sky}</div>`:''}<div class="chips"><span class="chip r">💧 ${pct(d.pop)} · ${amt(d)}</span><span class="chip w">💨 ${f(d.wind_mph)} g${f(d.gust_mph)} mph</span>${(d.snow_in||0)>=.1?`<span class="chip">❄️ ${f(d.snow_in,1)}″</span>`:''}</div></div>
<div class="temps">${temps?`${d.hi}°<br><span>${d.lo}°</span>`:''}</div>
<div class="more"><div class="muted">${d.label} · basis: ${d.basis}-corrected · NBM PoP ${pct(d.nbm_pop)}, QPF ${f(d.nbm_qpf_in,2)}″</div><h3>NWS forecast</h3>${nwsTxt(d)}</div></div>`}
const V={
hawk(){const s=D.sites.wsmr_hawk;return `<h2>${s.name} <span class="muted">${s.elev_ft} ft</span></h2>
<div class="card">${chart(s.days,[{n:'High °F',c:'#ef4444',v:d=>+d.hi||null},{n:'Low °F',c:'#3b82f6',v:d=>+d.lo||null}])}</div>
<div class="card">${chart(s.days,[{n:'Rain chance %',c:'#0ea5e9',bar:1,v:d=>d.pop*100},{n:'Gust mph',c:'#f59e0b',v:d=>d.gust_mph}])}</div>
${s.days.map(d=>dayCard(d,1)).join('')}
<div class="card"><h3>Storm / weather notes</h3>${D.hawk_storm.length?'<ul>'+D.hawk_storm.map(x=>`<li>${x.replace(/^- /,'')}</li>`).join('')+'</ul>':'<p>Nothing notable in the next 10 days.</p>'}
<details><summary>Pattern discussion (troughs, moisture, ensemble agreement)</summary><ul>${D.hawk_disc.join('')}</ul></details>
<details><summary>NWS El Paso Area Forecast Discussion</summary><pre>${D.afd.replace(/</g,'&lt;')}</pre></details></div>`},
pass(){const s=D.sites.san_augustin_pass,a=D.pass_alert,T=D.thresholds;return `<h2>${s.name} <span class="muted">${s.elev_ft} ft</span></h2>
<div class="status ${a.alert?'al':'ok'}"><b>${a.alert?'⚠️ ALERT':'✓ No alert'}</b>${a.alert?a.reasons.join('<br>'):'No high wind, low visibility, or snow forecast in the next 10 days'}</div>
${a.near.length?`<div class="card note"><h3>Near threshold</h3>${a.near.map(x=>`<div>${x}</div>`).join('')}</div>`:''}
<div class="card"><h3>Gusts (mph)</h3>${chart(s.days,[{n:'Corrected max gust',c:'#f59e0b',v:d=>d.gust_mph,line:T.gust_mph,lt:'alert '+T.gust_mph}])}</div>
<div class="card"><h3>Visibility & snow</h3>${chart(s.days,[{n:'NBM P(vis<1 mi) %',c:'#a855f7',bar:1,v:d=>d.p_vis_lt1==null?null:d.p_vis_lt1*100},{n:'NBM snow ×10 (in)',c:'#38bdf8',v:d=>d.snow_in==null?null:d.snow_in*10}])}
<p class="muted">HRRR min visibility: day 1 ${f(s.days[0].vis_min_mi,1)} mi, day 2 ${f(s.days[1].vis_min_mi,1)} mi. Visibility/snow are raw model output (not locally verified). Thresholds: gust ≥${T.gust_mph} mph, wind ≥${T.wind_mph} mph, vis &lt;${T.vis_mi} mi, any snow.</p></div>
${s.days.map(d=>dayCard(d,0)).join('')}`},
cloud(){const s=D.sites.cloudcroft,w=s.days.filter(d=>D.weekend.includes(d.d));return `<h2>${s.name} <span class="muted">${s.elev_ft} ft</span></h2><h3>This weekend</h3>
<div class="wk">${w.map(d=>`<div class="card"><div class="muted">${d.dow} ${d.date.slice(5)}</div><div class="big">${icon(d)} ${pct(d.pop)}</div><div>Rain ${amt(d)}</div><div>Gusts ${f(d.gust_mph)} mph</div>${(d.snow_in||0)>=.1?`<div>Snow ${f(d.snow_in,1)}″</div>`:''}<details><summary>NWS</summary>${nwsTxt(d)}</details></div>`).join('')}</div>
<details class="card"><summary>All 10 days</summary>${s.days.map(d=>dayCard(d,0)).join('')}</details>`},
about(){const t=(rows,cols,hd)=>`<table><tr>${hd.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c]??'—'}</td>`).join('')}</tr>`).join('')}</table>`;const S=D.skill;
 return `<h2>Model accuracy & about</h2><div class="card"><p>Forecasts are corrections of HRRR (days 1–2) and GEFS/ECMWF/NBM ensembles (days 1–10), trained on local station and gauge history (2023–2026) with terrain features. Lower error = better.</p>
<p class="muted">Issued ${D.issued}. Guidance: HRRR ${D.guidance.hrrr||'n/a'}, NBM ${D.guidance.nbm}, GEFS ${D.guidance.gefs}, ECMWF ${D.guidance.ecmwf}.${D.notes.length?' Notes: '+D.notes.join('; '):''}</p></div>
<div class="card"><h3>Daily rain chance (Brier score, lower better) by lead day</h3>${chart(S.lr_precip.map(r=>({dow:'D'+r.key,...r})),[{n:'NBM',c:'#94a3b8',v:r=>r.BS_nbm*100},{n:'This model',c:'#2563eb',v:r=>r.BS_model*100}])}</div>
<div class="card"><h3>Daily max gust error (MAE m/s) by lead day</h3>${chart(S.lr_wind.filter(r=>r.var=='gmax').map(r=>({dow:'D'+r.lead_day,...r})),[{n:'NBM (height+bias adj.)',c:'#94a3b8',v:r=>r.MAE_nbm_hadj_biascorr},{n:'This model',c:'#f59e0b',v:r=>r.MAE_model}])}</div>
<details class="card"><summary>Day 1 rain amount by station</summary>${t(S.day1_precip,['target','n','MAE_hrrr','MAE_median','cov_q90'],['Station','n','HRRR MAE mm','Model MAE mm','90% cover'])}</details>
<details class="card"><summary>Caveats</summary><ul><li>No on-site wind record at Hawk St or the Pass; winds transfer from nearby stations.</li><li>Rain gauges undercatch snow; snow skill is weak.</li><li>Visibility, smoke and snow are raw model output.</li></ul></details>`}};
function show(t){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==t));$('#app').innerHTML=V[t]();location.hash=t;scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.t));
fetch('data.json',{cache:'no-cache'}).then(r=>r.json()).then(j=>{D=j;$('#issued').textContent='Updated '+j.issued+(j.pass_alert.alert?' · ⚠️ Pass alert':'');show((location.hash||'#hawk').slice(1))});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
