const $=s=>document.querySelector(s);let D;
const th=localStorage.theme;if(th)document.documentElement.dataset.theme=th;
document.getElementById('theme').onclick=()=>{const c=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const n=c=='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.theme=n};
const f=(v,d=0)=>v==null?'—':(+v).toFixed(d), pct=v=>v==null?'—':Math.round(v*100)+'%', rg=(r,d=0)=>r&&r[0]!=null?f(r[0],d)+'–'+f(r[1],d):'—';

/* ---- precip type palette (consistent app-wide; patterns help color-blind) ---- */
const PTYPE={
  rain:{n:'Rain',u:'%',c:'#0284c7',pat:'solid'},
  snow:{n:'Snow',u:'%',c:'#6366f1',pat:'diag'},
  frzr:{n:'Freezing rain / ice',u:'%',c:'#db2777',pat:'hatch'},
  sleet:{n:'Sleet',u:'%',c:'#9333ea',pat:'dots'}
};
const LEG='Rain % = chance of measurable rain (≥0.01″). “If it rains, likely X–Y″” is the middle half of the amount when rain does fall; “could reach” is the high end (90th percentile) if it rains.';
const crng=a=>a&&a.c25_in!=null?`if it rains, likely ${f(a.c25_in,2)}–${f(a.c75_in,2)}″, could reach ${f(a.c90_in,2)}″`:'';
const amtShort=a=>a&&a.c25_in!=null?`${f(a.c25_in,2)}–${f(a.c75_in,2)}″`:'';
const amt=d=>{const a=d.amt||{};return `<span title="${LEG}">${crng(a)}</span>`};
const accChips=d=>{const a=d.amt||{};return ((a.snow_in||0)>=0.05?`<span class="chip s">❄️ snow ${f(a.snow_in,1)}″ (snow, not liquid)</span>`:'')+((a.ice_in||0)>=0.005?`<span class="chip i">🧊 ice ${f(a.ice_in,2)}″</span>`:'')};
const HZI={'thunder':'⚡ Thunder','hail':'🧊 Hail','freezing rain':'🧊 Freezing rain','sleet':'🌨️ Sleet'};
function icon(d){const s=(d.sky||'').toLowerCase();if((d.amt&&d.amt.snow_in||0)>=0.5)return'🌨️';if(d.pop>=.5)return'🌧️';if(d.pop>=.25)return'🌦️';if(d.gust_mph>=35)return'💨';
 if(s.includes('cloudy')&&!s.includes('partly')&&!s.includes('mostly sunny'))return'☁️';if(s.includes('partly'))return'⛅';if(s.includes('mostly'))return'🌤️';return'☀️'}
function wxIcon(short,day){const s=(short||'').toLowerCase();if(/thunder|t-storm/.test(s))return'⛈️';if(/snow|flurr/.test(s))return'🌨️';if(/sleet|freezing|ice/.test(s))return'🧊';if(/rain|shower|drizzle/.test(s))return day?'🌦️':'🌧️';
 if(/fog|haze|smoke|dust/.test(s))return'🌫️';if(/wind|breezy/.test(s)&&!/sunny|clear/.test(s))return'💨';if(/mostly cloudy|overcast|^cloudy/.test(s))return'☁️';if(/partly/.test(s))return day?'⛅':'☁️';if(/mostly sunny|mostly clear/.test(s))return day?'🌤️':'🌙';return day?'☀️':'🌙'}
const hh=t=>new Date(t).toLocaleTimeString('en-US',{hour:'numeric',timeZone:'America/Denver'}).replace(':00','').replace(' ','').toLowerCase();
const ago=t=>{if(!t)return'';const m=Math.round((Date.now()-new Date(t))/60000);return m<60?m+' min ago':Math.round(m/60)+' h ago'};
const dayLab=d=>{const m=(d.date||'').slice(5);return (d.d==1?'Today':d.dow)+(m?' '+m.replace('-','/'):'')};
function nice(lo,hi,n=5){if(hi<=lo)hi=lo+1;const r=(hi-lo)/n,p=Math.pow(10,Math.floor(Math.log10(r))),st=[1,2,2.5,5,10].map(m=>m*p).find(m=>m>=r)||1;return{lo:Math.floor(lo/st)*st,hi:Math.ceil(hi/st)*st,st}}

function patDefs(){return `<defs>
 <pattern id="pat-diag" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#6366f1"/><line x1="0" y1="0" x2="0" y2="6" stroke="#fff" stroke-width="2.5"/></pattern>
 <pattern id="pat-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#db2777"/><line x1="0" y1="3" x2="6" y2="3" stroke="#fff" stroke-width="2"/></pattern>
 <pattern id="pat-dots" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#9333ea"/><circle cx="3" cy="3" r="1.3" fill="#fff"/></pattern>
</defs>`}
function fillFor(s){return s.pat=='diag'?'url(#pat-diag)':s.pat=='hatch'?'url(#pat-hatch)':s.pat=='dots'?'url(#pat-dots)':s.c}
function chipPat(s){return s.pat=='diag'?'pat-snow':s.pat=='hatch'?'pat-frzr':s.pat=='dots'?'pat-sleet':''}

/* series: {n,u,c,v,bar,ax,dp,pat,lab}; o: {title,sub,L:{t,min,max},R,lines,xt,xlab} */
function chart(days,series,o={}){
 const W=380,H=220,l=46,r=o.R?52:14,t=18,b=46,n=days.length,pw=W-l-r,ph=H-t-b,xs=i=>l+(i+.5)*pw/n;
 const sc={};['L','R'].forEach(k=>{if(!o[k])return;const vals=series.filter(s=>(s.ax||'L')==k).flatMap(s=>days.map(s.v)).filter(x=>x!=null).concat((o.lines||[]).filter(x=>(x.ax||'L')==k).map(x=>x.y));
  let lo=o[k].min??Math.min(...vals),hi=o[k].max??Math.max(...vals);if(!isFinite(lo)||!isFinite(hi)){lo=0;hi=1}if(o[k].min==null&&lo>0&&!o[k].tight)lo=0;if(hi<=lo)hi=lo+1;const N=nice(lo,hi);sc[k]={...N,y:v=>t+ph-(v-N.lo)/(N.hi-N.lo)*ph}});
 let g=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" class="ch" aria-label="${(o.title||'').replace(/"/g,'')}">${patDefs()}`;
 const L=sc.L;for(let v=L.lo;v<=L.hi+1e-9;v+=L.st){g+=`<line x1="${l}" x2="${W-r}" y1="${L.y(v)}" y2="${L.y(v)}" class="grid"/><text x="${l-5}" y="${L.y(v)+3}" text-anchor="end">${+v.toFixed(v>=10||Number.isInteger(L.st)?0:2)}</text>`}
 if(sc.R){const R=sc.R;for(let v=R.lo;v<=R.hi+1e-9;v+=R.st)g+=`<text x="${W-r+5}" y="${R.y(v)+3}">${+v.toFixed(v>=10||Number.isInteger(R.st)?0:2)}</text>`}
 g+=`<line x1="${l}" x2="${l}" y1="${t}" y2="${t+ph}" class="axis"/><line x1="${l}" x2="${W-r}" y1="${t+ph}" y2="${t+ph}" class="axis"/>`;
 if(sc.R)g+=`<line x1="${W-r}" x2="${W-r}" y1="${t}" y2="${t+ph}" class="axis"/>`;
 g+=`<text class="at" transform="translate(12 ${t+ph/2}) rotate(-90)" text-anchor="middle">${o.L.t}</text>`;
 if(sc.R)g+=`<text class="at" transform="translate(${W-7} ${t+ph/2}) rotate(90)" text-anchor="middle">${o.R.t}</text>`;
 const nb=series.filter(s=>s.bar).length;let bi=0;
 series.forEach(s=>{const S=sc[s.ax||'L'],dp=s.dp??0,fl=fillFor(s);
  if(s.bar){const bw=Math.min(18,pw/n*.62/Math.max(1,nb)),off=(bi++-(nb-1)/2)*bw;days.forEach((d,i)=>{const v=s.v(d);if(v!=null){const y0=S.y(Math.max(0,S.lo));g+=`<rect x="${xs(i)-bw/2+off}" y="${Math.min(S.y(v),y0)}" width="${Math.max(1,bw-1)}" height="${Math.abs(y0-S.y(v))}" rx="2" fill="${fl}" opacity=".9"><title>${dayLab(d)}: ${s.n} ${(+v).toFixed(dp)} ${s.u}</title></rect>`}})}
  else{const p=days.map((d,i)=>s.v(d)==null?null:`${xs(i)},${S.y(s.v(d))}`).filter(Boolean);g+=`<polyline fill="none" stroke="${s.c}" stroke-width="${s.dash?1.5:2.3}" ${s.dash?'stroke-dasharray="4 3" opacity=".85"':''} points="${p.join(' ')}"/>`;
   days.forEach((d,i)=>{const v=s.v(d);if(v!=null&&!s.dash){const mk=s.marker||'circle';if(mk=='diamond')g+=`<rect x="${xs(i)-3.2}" y="${S.y(v)-3.2}" width="6.4" height="6.4" transform="rotate(45 ${xs(i)} ${S.y(v)})" fill="${s.c}"><title>${dayLab(d)}: ${s.n} ${(+v).toFixed(dp)} ${s.u}</title></rect>`;
    else if(mk=='tri')g+=`<polygon points="${xs(i)},${S.y(v)-4} ${xs(i)+4},${S.y(v)+3.5} ${xs(i)-4},${S.y(v)+3.5}" fill="${s.c}"><title>${dayLab(d)}: ${s.n} ${(+v).toFixed(dp)} ${s.u}</title></polygon>`;
    else g+=`<circle cx="${xs(i)}" cy="${S.y(v)}" r="3.2" fill="${s.c}"><title>${dayLab(d)}: ${s.n} ${(+v).toFixed(dp)} ${s.u}</title></circle>`;
    if(s.lab)g+=`<text x="${xs(i)}" y="${S.y(v)-7}" text-anchor="middle" class="pl">${(+v).toFixed(dp)}</text>`}})}});
 (o.lines||[]).forEach(x=>{const S=sc[x.ax||'L'];g+=`<line x1="${l}" x2="${W-r}" y1="${S.y(x.y)}" y2="${S.y(x.y)}" stroke="${x.c}" stroke-width="1.5" stroke-dasharray="5 3"/><text x="${W-r-3}" y="${S.y(x.y)-4}" text-anchor="end" style="fill:${x.c}">${x.t}</text>`});
 const skip=n>8?2:1;days.forEach((d,i)=>{if(i%skip&&i!==n-1)return;const lab=o.xlab?o.xlab(d,i):(d.d==1?'Today':(d.dow||'').slice(0,3)+((d.date||'').slice(8)?'\n'+Number((d.date||'').slice(8)):''));
  const parts=String(lab).split('\n');parts.forEach((p,j)=>g+=`<text x="${xs(i)}" y="${t+ph+14+j*11}" text-anchor="middle">${p}</text>`)});
 g+=`<text class="at" x="${l+pw/2}" y="${H-3}" text-anchor="middle">${o.xt||'Day (6am–6am Mountain time)'}</text></svg>`;
 const leg=series.map(s=>`<span class="chip"><i class="${chipPat(s)}" style="background:${s.pat&&s.pat!=='solid'?'':s.c}"></i>${s.n}${s.u?` (${s.u})`:''}${s.ax=='R'?' →':''}</span>`).join('')+(o.lines||[]).map(x=>`<span class="chip"><i style="background:${x.c};height:2px;width:14px"></i>${x.t}</span>`).join('');
 return `${o.title?`<div class="chtitle">${o.title}</div>`:''}${o.sub?`<div class="chsub">${o.sub}</div>`:''}${g}<div class="legend">${leg}</div>`}

const nwsTxt=d=>d.nws&&d.nws.length?d.nws.map(p=>`<div><b>${p.name}</b>: ${p.short} · ${p.temp}°F · PoP ${p.pop}% · ${p.wind}</div>`).join(''):'<div class="muted">No NWS period</div>';
function spcBadge(d){const p=d.hz&&d.hz.spc;if(!p||p.cat==='none')return'';const lv={TSTM:1,MRGL:2,SLGT:3,ENH:4,MDT:5,HIGH:6}[p.cat]??0;return `<span class="chip hz" title="Storm Prediction Center outlook">SPC: ${p.cat_name}</span>`}
function hzChips(d){const h=d.hz||{};return (h.flags||[]).map(x=>`<span class="chip hz">${HZI[x]||x}</span>`).join('')+spcBadge(d)}

function amtChart(ds,title){
 const hasSnow=ds.some(d=>d.amt&&d.amt.snow_in>=0.05);
 const series=[{n:'Expected liquid',u:'in',c:'#0284c7',bar:1,v:d=>d.amt&&d.amt.mean_in,dp:2},
  {n:'If it rains: likely low',u:'in',c:'#7dd3fc',v:d=>d.amt&&d.amt.c25_in,dp:2,marker:'circle'},
  {n:'If it rains: likely high',u:'in',c:'#0369a1',v:d=>d.amt&&d.amt.c75_in,dp:2,marker:'circle'},
  {n:'If it rains: could reach',u:'in',c:'#64748b',v:d=>d.amt&&d.amt.c90_in,dp:2,dash:1}];
 if(hasSnow)series.push({n:'Snow (inches of snow)',u:'in of snow',c:'#6366f1',bar:1,pat:'diag',v:d=>d.amt&&d.amt.snow_in,dp:1});
 return `<div class="card">${chart(ds,series,{title:title||'Precipitation amounts',sub:'Bars = expected liquid (chance × typical wet amount). Lines = amount if rain falls. Snow is inches of snow, not liquid.',L:{t:'Amount (inches)',min:0}})}
 <p class="muted" style="margin-top:8px">${LEG}</p></div>`}
function ptypeChart(s,ds){ds=ds||s.days;
 const T=[['rain',PTYPE.rain],['snow',PTYPE.snow],['frzr',PTYPE.frzr],['sleet',PTYPE.sleet]];
 const act=T.filter(([k])=>ds.some(d=>d.hz&&d.hz.ptype_abs&&(d.hz.ptype_abs[k]||0)>0.5));
 let g=`<div class="card">`;
 if(!act.length)return g+`<div class="chtitle">Precipitation chance by type</div><p class="none">No rain, snow, sleet or ice expected in this period.</p></div>`;
 const series=act.map(([k,p],i)=>({n:p.n,u:'%',c:p.c,pat:p.pat,bar:k==='rain'||act.length===1,marker:k==='snow'?'diamond':k==='sleet'?'tri':k==='frzr'?'diamond':'circle',v:d=>d.hz&&d.hz.ptype_abs?d.hz.ptype_abs[k]:null,lab:act.length<=2}));
 return g+chart(ds,series,{title:'Precipitation chance by type',sub:'Daily chance of each type. Types with ~0% chance are hidden. Colors and patterns stay the same everywhere in the app.',L:{t:'Daily chance (%)',min:0,max:100}})+`</div>`}
function thunderChart(s,ds){const wk=!!ds;ds=ds||s.days;
 if(!ds.some(d=>d.hz&&(d.hz.nbm_tstm||0)>=5))return'';
 let g=`<div class="card">${chart(ds,[{n:'Thunder chance',u:'%',c:'#ca8a04',bar:1,v:d=>d.hz&&d.hz.nbm_tstm}],{title:'Thunderstorm chance',sub:'National Blend 12-hour thunder probability.',L:{t:'Thunder chance (%)',min:0,max:100},lines:[{y:25,c:'#ca8a04',t:'flag ≥25%'}]})}`;
 return g+`</div>`}
function tempChart(ds){if(!ds[0]||ds[0].hi==null||ds[0].hi==='—')return'';
 return `<div class="card">${chart(ds,[{n:'High',u:'°F',c:'#ef4444',v:d=>+d.hi||null,lab:1},{n:'Low',u:'°F',c:'#3b82f6',v:d=>+d.lo||null,lab:1},{n:'High range (10–90%)',u:'°F',c:'#fca5a5',dash:1,v:d=>d.hi_rng?d.hi_rng[0]:null},{n:'High range high',u:'°F',c:'#fca5a5',dash:1,v:d=>d.hi_rng?d.hi_rng[1]:null},{n:'Low range (10–90%)',u:'°F',c:'#93c5fd',dash:1,v:d=>d.lo_rng?d.lo_rng[0]:null},{n:'Low range high',u:'°F',c:'#93c5fd',dash:1,v:d=>d.lo_rng?d.lo_rng[1]:null}],{title:'Temperature',sub:'Solid = forecast high/low. Dashed = 80% range (about 8 of 10 days fall inside).',L:{t:'Temperature (°F)',tight:1}})}</div>`}
function windChart(ds,pass){const T=D.thresholds;const lines=pass?[{y:T.gust_mph,c:'#dc2626',t:'Gust alert '+T.gust_mph+' mph'}]:[];
 return `<div class="card">${chart(ds,[{n:'Max sustained wind',u:'mph',c:'#94a3b8',v:d=>d.wind_mph},{n:'Max gust',u:'mph',c:'#f59e0b',v:d=>d.gust_mph,lab:1,marker:'diamond'},{n:'Gust range low',u:'mph',c:'#fcd34d',dash:1,v:d=>d.gust_rng?d.gust_rng[0]:null},{n:'Gust range high',u:'mph',c:'#fcd34d',dash:1,v:d=>d.gust_rng?d.gust_rng[1]:null}],{title:'Wind and gusts',sub:'Daily max sustained wind and gust. Dashed = 80% gust range.',L:{t:'Speed (mph)',min:0},lines})}</div>`}

function hero(k,s){const n=s.now||{},d1=s.days[0],h0=(s.hourly||[])[0]||{};const day=h0.day!==false;const rain=(d1.pop||0)>=.5;
 const ic=n.text?wxIcon(n.text,day):wxIcon(h0.short,day);
 return `<div class="hero ${!day?'night':rain?'rain':''}"><div class="loc">${s.name} · ${s.elev_ft.toLocaleString()} ft</div>
 <div class="now"><div class="t">${n.temp_f!=null?Math.round(n.temp_f)+'°':(h0.temp!=null?h0.temp+'°':'—')}</div><div><div class="ic">${ic}</div></div></div>
 <div class="cond">${n.text||h0.short||''}</div><div class="hl">H ${d1.hi||'—'}° · L ${d1.lo||'—'}°${n.wind_mph!=null?` · Wind ${Math.round(n.wind_mph)}${n.gust_mph?' g'+Math.round(n.gust_mph):''} mph`:''}</div>
 <div class="src">${n.station?`Now: ${n.station}, ${ago(n.time)}`:'Current obs unavailable; showing forecast'} · Updated ${D.issued}</div></div>`}

function whatMatters(k,s){
 const days=k==='cloudcroft'?s.days.filter(d=>D.weekend.includes(d.d)):s.days;
 const wet=days.filter(d=>(d.pop||0)>=0.2).sort((a,b)=>b.pop-a.pop)[0];
 const windy=days.filter(d=>(d.gust_mph||0)>=25).sort((a,b)=>b.gust_mph-a.gust_mph)[0];
 const hz=days.filter(d=>d.hz&&d.hz.flags&&d.hz.flags.length);
 const st=(D.storms[k]||[])[0];
 let lead='';
 if(k==='san_augustin_pass'){
   const a=D.pass_alert;
   lead=a.alert?`Drive carefully: ${a.reasons[0].replace(/^[^:]+:\s*/,'')}`:'No pass alerts for high wind, low visibility, snow or ice in the next 10 days.';
 }else if(wet&&wet.pop>=0.5){
   const a=wet.amt||{};lead=`${wet.d===1?'Today':wet.dow}: ${pct(wet.pop)} chance of rain — ${crng(a)||'amounts uncertain'}.`;
 }else if(st){lead=`Next storm ${st.name}: about ${f(st.mean_in,2)}″ expected liquid (peak daily chance ${st.peak_pop}%).`;
 }else if(wet){lead=`Best rain chance is ${wet.d===1?'today':wet.dow} (${pct(wet.pop)}). ${crng(wet.amt||{})||'Mostly dry otherwise.'}`;
 }else lead='Mostly dry over this period. No strong storm signal.';
 if(windy&&windy.gust_mph>=35&&k!=='san_augustin_pass')lead+=` Windy ${windy.d===1?'today':windy.dow}, gusts near ${f(windy.gust_mph)} mph.`;
 let rows='';
 if(wet){const a=wet.amt||{};rows+=`<div class="row"><div>💧</div><div><b>Precipitation${wet.d===1?' today':' — '+wet.dow}</b><span class="muted"> · ${pct(wet.pop)} chance of measurable rain</span><br>${crng(a)||'Amount uncertain'}${(a.snow_in||0)>=0.05?` · ❄️ ${f(a.snow_in,1)}″ of snow`:''}${(a.ice_in||0)>=0.005?` · 🧊 ${f(a.ice_in,2)}″ ice`:''}</div></div>`}
 else rows+=`<div class="row"><div>💧</div><div><b>Precipitation</b><br><span class="muted">No meaningful rain chance in view.</span></div></div>`;
 if(windy)rows+=`<div class="row"><div>💨</div><div><b>Wind${windy.d===1?' today':' — '+windy.dow}</b><br>Gusts up to about ${f(windy.gust_mph)} mph (sustained ~${f(windy.wind_mph)} mph).</div></div>`;
 else rows+=`<div class="row"><div>💨</div><div><b>Wind</b><br><span class="muted">No strong winds expected.</span></div></div>`;
 if(hz.length)rows+=`<div class="row"><div>⚡</div><div><b>Hazards</b><br>${hz.map(d=>`${d.d===1?'Today':d.dow}: ${(d.hz.flags||[]).map(x=>HZI[x]||x).join(', ')}`).join(' · ')}</div></div>`;
 return `<div class="card matter"><div class="lead">${lead}</div><div class="rows">${rows}</div><p class="muted" style="margin:10px 0 0">${LEG}</p></div>`}

function alertBanner(k,s){let out='';
 (s.nws_alerts||[]).forEach(a=>out+=`<div class="alertb">⚠️ NWS ${a.event}<small>${a.headline||''}</small></div>`);
 if(k==='san_augustin_pass'){const a=D.pass_alert;
  out+=a.alert?`<div class="alertb">⚠️ Pass alert<small>${a.reasons.join('<br>')}</small></div>`:`<div class="alertb ok">✓ No pass alerts<small>No high wind (≥45 mph gusts), low visibility (&lt;1 mi), snow, freezing rain or sleet in the next 10 days.${a.near.length?`<br>Near threshold: ${a.near.join('; ')}`:''}</small></div>`}
 const hz=s.days.filter(d=>d.d<=3&&d.hz&&d.hz.flags&&d.hz.flags.length);
 if(hz.length&&k!=='san_augustin_pass')out+=`<div class="alertb warn">⚡ Near-term hazards<small>${hz.map(d=>(d.d===1?'Today':d.dow)+': '+d.hz.flags.map(x=>HZI[x]||x).join(', ')).join(' · ')}</small></div>`;
 return out}

function organCells(k){const O=D.organ_cells;const tg={wsmr_hawk:'hawk',san_augustin_pass:'pass'}[k];if(!O||!tg||!(O.targets||[]).includes(tg))return'';
 const nm=tg=='hawk'?'Hawk St (east slope)':'San Augustin Pass';const rt=O.radar_time?hh(O.radar_time):'?';
 const C=(O.cells||[]).filter(c=>c['p_'+tg]!=null);
 const body=C.length?C.map(c=>c['now40_'+tg]?`<li>Heavy rain is already within 5 mi of ${nm}.</li>`:`<li>Storm cell <b>${c.dist_km} km west</b> of the Organ crest (${c.maxdbz} dBZ): <b>${Math.round(c['p_'+tg]*100)}%</b> chance of heavy rain near ${nm} in the next 90 min.</li>`).join(''):`<li>No storm cells west of the Organs heading this way on the latest radar.</li>`;
 return `<div style="margin-top:8px"><b>🏔️ Storms near the Organs</b> <span class="muted">(radar ${rt})</span><ul style="margin:4px 0 0 18px;padding:0">${body}</ul></div>`}
function nowcastCard(k){const N=D.nowcast;if(!N||!N.points||!N.points[k]){const oc=organCells(k);return oc?`<div class="sec">Next few hours</div><div class="card">${oc}</div>`:''}
 const p=N.points[k];const rt=N.radar_time?new Date(N.radar_time):null;
 if(!N.active||!(p.hours||[]).length){const oc=organCells(k);if(!oc&&(p.echo_max60==null||p.echo_max60<20))return'';
  return `<div class="sec">Next few hours</div><div class="card"><div class="muted">📡 Radar ${N.radar_time?'as of '+hh(N.radar_time)+'. ':''}${p.echo_max60!=null?`Strongest echo within 60 km: ${Math.round(p.echo_max60)} dBZ.`:'No radar echoes within 60 km.'}</div>${oc}</div>`}
 const mx=Math.max(.25,...p.hours.map(h=>h.pop));
 return `<div class="sec">Next 4 hours</div><div class="card"><div class="hours">${p.hours.map(h=>`<div class="hr"><div class="h">${hh(h.valid_utc)}</div><div class="i">${h.pop>=.5?'⛈️':h.pop>=.2?'🌦️':'☁️'}</div><div style="height:46px;display:flex;align-items:flex-end;justify-content:center"><div style="width:22px;height:${Math.max(2,Math.round(h.pop/mx*44))}px;background:var(--rain);border-radius:3px"></div></div><div class="p">${Math.round(h.pop*100)}%</div></div>`).join('')}</div><div class="muted">Chance of measurable rain each hour, from live radar + terrain. Radar as of ${rt?hh(rt):'?'}.</div>${organCells(k)}</div>`}

function hourStrip(s){const H=s.hourly||[];if(!H.length)return'';
 return `<div class="sec">Next 48 hours</div><div class="card"><div class="hours">${H.map((h,i)=>`<div class="hr"><div class="h">${i?hh(h.t):'Now'}</div><div class="i">${wxIcon(h.short,h.day)}</div><div class="tt">${h.temp}°</div><div class="p">${h.pop>=10?h.pop+'%':''}</div><div class="w">${(h.wind||'').replace(' mph','').replace(' to ','–')}${h.gust_corr?' g'+h.gust_corr:''}</div></div>`).join('')}</div>
 <div class="muted">Temps & rain % from NWS; gusts (“g”) from this app’s correction where available.</div></div>`}

function stormCards(key,dayFilter){let S=(D.storms[key]||[]);if(dayFilter)S=S.filter(x=>x.days.some(d=>dayFilter.includes(d)));
 if(!S.length)return `<div class="card"><p class="none">No storm events expected${dayFilter?' this weekend':' in the next 10 days'}.</p></div>`;
 return `<div class="wk">${S.map(x=>`<div class="card storm"><div style="font-weight:700">${x.name}</div><div class="muted">${x.start} → ${x.end}</div><div class="big" style="font-size:22px">${f(x.mean_in,2)}″</div><div class="muted">expected liquid · peak chance ${x.peak_pop}%</div><div class="muted">${crng(x)}</div><div class="chips">${x.snow_in>=0.05?`<span class="chip s">❄️ ${f(x.snow_in,1)}″ snow (in of snow)</span>`:''}${x.ice_in>=0.01?`<span class="chip i">🧊 ${f(x.ice_in,2)}″ ice</span>`:''}</div></div>`).join('')}</div>`}

function tenDay(s){const his=s.days.map(d=>+d.hi).filter(x=>!isNaN(x)),los=s.days.map(d=>+d.lo).filter(x=>!isNaN(x));const mn=Math.min(...los,0),mx=Math.max(...his,1),sp=Math.max(1,mx-mn);
 return `<div class="sec">10-day forecast</div><div class="card" style="padding:4px 10px">${s.days.map(d=>{const lo=+d.lo,hi=+d.hi,ok=!isNaN(lo)&&!isNaN(hi);const a=d.amt||{};
  return `<div class="dl" onclick="this.classList.toggle('open')"><div class="dw">${d.d==1?'Today':d.dow}</div><div class="ic">${icon(d)}</div>
  <div class="pp">${(d.pop||0)>=.1?`💧 ${pct(d.pop)}<span class="amt">${amtShort(a)||''}${(a.snow_in||0)>=0.05?` · ❄️${f(a.snow_in,1)}″`:''}</span>`:'—'}</div>
  <div class="lo">${ok?lo+'°':'—'}</div><div class="bar">${ok?`<i style="left:${(lo-mn)/sp*100}%;right:${(mx-hi)/sp*100}%"></i>`:''}</div><div class="hi">${ok?hi+'°':''}</div>
  <div class="dlx">${d.sky?`<div style="margin-bottom:4px">${d.sky}</div>`:''}
   <div><b>Rain:</b> ${pct(d.pop)} chance. ${amt(d)||'—'}</div>
   <div><b>Wind:</b> ${f(d.wind_mph)} mph, gusts ${f(d.gust_mph)} mph${d.gust_rng?` (80% range ${rg(d.gust_rng)} mph)`:''}</div>
   <div class="chips">${accChips(d)}${hzChips(d)}</div>
   <details style="margin-top:6px"><summary class="muted">NWS forecast for comparison</summary>${nwsTxt(d)}</details>
  </div></div>`}).join('')}
  <p class="muted" style="font-size:12px;margin:8px 0 4px">Tap a day for details. 💧 ${LEG}</p></div>`}

function weekendCards(s){const w=s.days.filter(d=>D.weekend.includes(d.d));
 const t=D.totals.cloudcroft;
 return `<div class="sec">This weekend</div>
 <div class="card"><div class="muted">Fri–Sun precipitation</div><div class="big">💧 ${f(t.mean_in,2)}″ <span class="muted" style="font-size:14px">expected liquid</span></div>
 <div class="muted">${crng(t)}${t.snow_in>=0.05?` · ❄️ ${f(t.snow_in,1)}″ snow (in of snow)`:''}</div></div>
 <div class="wk">${w.map(d=>`<div class="card"><div class="muted">${d.dow} ${(d.date||'').slice(5)}</div>
  <div class="big">${icon(d)} ${d.hi||''}°<span class="muted" style="font-size:15px"> / ${d.lo||''}°</span></div>
  <div style="margin-top:6px"><b>💧 ${pct(d.pop)}</b> chance of rain</div><div class="muted">${amt(d)}</div>
  <div style="margin-top:4px">💨 Gusts ${f(d.gust_mph)} mph</div>
  <div class="chips">${accChips(d)}${hzChips(d)}</div></div>`).join('')}</div>`}

function details(k,s){
 const pass=k==='san_augustin_pass', cloud=k==='cloudcroft';
 const ds=cloud?s.days.filter(d=>D.weekend.includes(d.d)):s.days;
 let o=`<div class="sec">Charts & details</div>`;
 o+=`<details class="card"><summary>Precipitation charts</summary>${amtChart(ds,cloud?'Weekend precipitation amounts':'Precipitation amounts')}${ptypeChart(s,ds)}${thunderChart(s,ds)}</details>`;
 o+=`<details class="card"><summary>Temperature & wind charts</summary>${tempChart(s.days)}${windChart(s.days,pass)}`;
 if(pass){const T=D.thresholds;
  o+=chart(s.days,[{n:'Chance visibility under 1 mile',u:'%',c:'#a855f7',bar:1,v:d=>d.p_vis_lt1==null?null:d.p_vis_lt1*100}],{title:'Low-visibility chance',sub:'National Blend probability of visibility under 1 mile.',L:{t:'Chance (%)',min:0,max:100},lines:[{y:T.p_vis*100,c:'#a855f7',t:'Alert '+T.p_vis*100+'%'}]});
  o+=`<p class="muted">HRRR minimum visibility: day 1 ${f(s.days[0].vis_min_mi,1)} mi, day 2 ${f(s.days[1].vis_min_mi,1)} mi.</p>`;
 }
 o+=`</details>`;
 if(k==='wsmr_hawk')o+=`<details class="card"><summary>Storm & pattern discussion</summary>${D.hawk_storm.length?'<ul>'+D.hawk_storm.map(x=>`<li>${x.replace(/^- /,'')}</li>`).join('')+'</ul>':'<p class="muted">Nothing notable.</p>'}
  <h3 style="margin-top:10px">Pattern notes</h3><ul>${D.hawk_disc.join('')}</ul>
  <details style="margin-top:8px"><summary>NWS El Paso Area Forecast Discussion</summary><pre>${D.afd.replace(/</g,'&lt;')}</pre></details></details>`;
 if(cloud)o+=`<details class="card"><summary>Full 10-day list</summary>${s.days.map(d=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${dayLab(d)}</b> · 💧 ${pct(d.pop)} · ${amt(d)} · gust ${f(d.gust_mph)} mph ${accChips(d)}</div>`).join('')}</details>`;
 o+=`<details class="card"><summary>How this forecast works</summary>
  <p>This app corrects national models (HRRR for days 1–2, GEFS/ECMWF/NBM for days 1–10) with local station and gauge history and terrain. Issued ${D.issued}.</p>
  <p class="muted">Guidance used: HRRR ${D.guidance.hrrr||'n/a'}, NBM ${D.guidance.nbm}, GEFS ${D.guidance.gefs}, ECMWF ${D.guidance.ecmwf}.${D.notes.length?' Notes: '+D.notes.join('; '):''}</p>
  <p>${LEG}</p>
  <ul style="margin:6px 0 0 18px">
   <li>Wind at Hawk St and the Pass is transferred from nearby stations (no on-site wind record).</li>
   <li>Snow amounts are inches of snow, not liquid equivalent; gauges undercatch snow so snow skill is weaker.</li>
   <li>Visibility, thunder, hail, freezing rain and sleet are mostly raw model/SPC guidance, not locally recalibrated.</li>
  </ul>
  <p class="muted" style="margin-top:8px"><a href="#about">See the Accuracy page</a> for verification scores.</p></details>`;
 return o}

function passView(){const s=D.sites.san_augustin_pass,a=D.pass_alert,T=D.thresholds;
 return hero('san_augustin_pass',s)+
  `<div class="status ${a.alert?'al':'ok'}"><b>${a.alert?'⚠️ ALERT':'✓ No alerts'}</b>
   ${a.alert?a.reasons.map(r=>`<div style="font-weight:500;margin-top:4px">${r}</div>`).join(''):'No high wind, low visibility, snow, freezing rain or sleet forecast in the next 10 days.'}</div>
  ${a.near.length?`<div class="card note"><h3>Near threshold (not an alert)</h3>${a.near.map(x=>`<div>${x}</div>`).join('')}</div>`:''}
  <div class="card"><p class="muted" style="margin:0">Alerts fire for: gusts ≥${T.gust_mph} mph, sustained ≥${T.wind_mph} mph, visibility under ${T.vis_mi} mi, any snow, freezing rain or sleet.</p></div>
  ${whatMatters('san_augustin_pass',s)}
  ${details('san_augustin_pass',s)}`}

function locView(k){
 if(k==='san_augustin_pass')return passView();
 const s=D.sites[k], cloud=k==='cloudcroft';
 return hero(k,s)+alertBanner(k,s)+`<div class="sec">What matters</div>`+whatMatters(k,s)
  +nowcastCard(k)+hourStrip(s)
  +(cloud?weekendCards(s):`<div class="sec">Upcoming storms</div>`+stormCards(k))
  +(cloud?'':tenDay(s))
  +details(k,s)
  +`<p class="muted" style="text-align:center;margin-top:16px">Updated ${D.issued}</p>`}

/* ---- Seasonal ---- */
function pvCard(){const P=D.polar_vortex;if(!P)return `<div class="card"><h3>🌀 Polar vortex watch</h3><p class="muted">Stratosphere data unavailable right now.</p></div>`;
 const md=s=>{if(!s)return'—';const d=new Date(s.slice(0,10)+'T12:00:00Z');return d.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})};
 const r0=x=>{const v=Math.round(x);return (v===0?0:v).toString()},G=P.gefs,O=P.obs_latest,A=P.ao,H=P.history,st=P.status||'unavailable',fc=P.basis=='forecast';
 const lab=st=='Disrupted'?(fc?'Disruption forecast':'Disrupted'):st=='Weakening'?(fc?'Weakening forecast':'Weakening'):st;
 const col=st=='Disrupted'?'#7c3aed':st=='Weakening'?'#d97706':'#16a34a';
 let now=O?`Stratospheric wind (10 hPa, 60°N) on ${md(O.date)}: <b>${r0(O.u)} m/s</b> westerly (normal ~${O.clim_mean!=null?r0(O.clim_mean):'—'} m/s).`:'Observed stratospheric wind unavailable.';
 let fcs=G?`GEFS: <b>${G.n_reverse} of ${G.members}</b> members reverse to easterly${G.first_reverse_median?`, median date ${md(G.first_reverse_median)}`:''}.`:'GEFS forecast unavailable.';
 const win=P.cold_window?`<div class="card note" style="margin:8px 0 0"><b>${fc?'Tentative window':'Window'} for elevated odds of cold spells: ${md(P.cold_window[0])} – ${md(P.cold_window[1])}</b>. Only if the disruption reaches the surface — many don't. Past events here have not shown a clear local cold signal.</div>`:'';
 const ob=(P.obs||[]).slice(-30),cl=(P.clim_on_obs_dates||[]).slice(-30),rows=ob.map((x,i)=>({dow:'',date:x[0],o:x[1],c:cl[i]}));
 if(G)G.dates.forEach((d,i)=>{if(i==0&&rows.length&&rows[rows.length-1].date==d){Object.assign(rows[rows.length-1],{m:G.mean[0],lo:G.p10[0],hi:G.p90[0]});return}rows.push({dow:'',date:d,m:G.mean[i],lo:G.p10[i],hi:G.p90[i],c:(P.clim_on_gefs_dates||[])[i]})});
 rows.forEach((r,i)=>{r.dow=(i%5===0)?md(r.date):'';r.d=i+1});
 const ch=rows.length?chart(rows,[{n:'Observed',u:'m/s',c:'#0f172a',v:d=>d.o,dp:1},{n:'GEFS mean',u:'m/s',c:'#7c3aed',v:d=>d.m,dp:1},{n:'GEFS range low',u:'m/s',c:'#a78bfa',dash:1,v:d=>d.lo,dp:1},{n:'GEFS range high',u:'m/s',c:'#c4b5fd',dash:1,v:d=>d.hi,dp:1},{n:'Normal',u:'m/s',c:'#94a3b8',dash:1,v:d=>d.c,dp:1}],{title:'Stratospheric wind (10 hPa, 60°N)',sub:'Last ~30 days observed, then 16-day GEFS forecast. Crossing 0 = a major disruption.',L:{t:'Zonal wind (m/s)'},lines:[{y:0,c:'#ef4444',t:'reversal (0)'}],xt:'Date',xlab:(d)=>d.dow}):'';
 return `<div class="card"><h3>🌀 Polar vortex watch</h3>
 <div class="big" style="font-size:22px;color:${col}">${lab}</div>
 <div class="muted" style="margin:4px 0">${now}<br>${fcs}</div>${win}
 <p style="font-size:14px;margin:8px 0 0"><b>What it could mean here:</b> if it reaches the surface, colder spells become a bit more likely (especially Cloudcroft / east of the Sacramentos). It does not flip the winter — the strong El Niño still favors mild overall. Treat this as a heads-up, not a calibrated forecast.</p>
 ${ch?`<div style="margin-top:10px">${ch}</div>`:''}
 <details style="margin-top:8px"><summary class="muted">Sources & history check</summary><p class="muted">GFS/GEFS (AWS), NCEP Reanalysis-1 normals, CPC Arctic Oscillation. Refreshed about every 8 hours.${H&&H.stations?` After ${H.stations.cloudcroft.n} past major disruptions, very cold nights here were about as common as usual.`:''}</p></details></div>`}

function seasView(){const S=D.seasonal;if(!S)return'<p class="muted">Seasonal outlook not available.</p>';
 const W=S.winter,M=S.monsoon,E=S.enso,r1=x=>x==null?'—':(+x).toFixed(1),r2=x=>x==null?'—':(+x).toFixed(2);
 const cc=W.cloudcroft,hk=W.wsmr_hawk,mm=M.wsmr_hawk,mc=M.cloudcroft;
 return `<h2>Seasonal outlook</h2>
 <div class="card matter"><div class="lead">${E.forecast_class}</div>
  <div class="muted">Latest ONI ${E.oni_latest} · PDO ${r2(E.pdo_latest)} (${E.pdo_latest<0?'negative':'positive'})</div>
  <div class="rows" style="margin-top:10px">
   <div class="row"><div>❄️</div><div><b>Cloudcroft winter snow</b><br>~${r1(cc.best_snow.central)}″ expected (likely ${r1(cc.best_snow.lo)}–${r1(cc.best_snow.hi)}″; normal ${r1(cc.normal&&cc.normal.median)}″)</div></div>
   <div class="row"><div>🌨️</div><div><b>Hawk St area winter snow</b><br>~${r1(hk.best_snow.central)}″ (normal ${r1(hk.normal&&hk.normal.median)}″; Las Cruces proxy)</div></div>
   <div class="row"><div>🌩️</div><div><b>Monsoon 2027</b><br>Near normal ~${r2(mm.total_best&&mm.total_best.central)}″ at Hawk St — <b>very low skill</b> this far out.</div></div>
  </div></div>
 ${pvCard()}
 <details class="card"><summary>Winter snowfall details & charts</summary>
  <div class="card" style="border:0;padding:0">${chart(cc.months.map((m,i)=>({dow:m,a:cc.mon_normal[i],b:cc.mon_strong[i],d:i+1,date:''})),[{n:'Normal (1991–2020)',u:'in of snow',c:'#94a3b8',bar:1,v:d=>d.a,dp:1},{n:'Strong El Niño winters',u:'in of snow',c:'#6366f1',bar:1,pat:'diag',v:d=>d.b,dp:1}],{title:'Cloudcroft: when the snow usually comes',sub:'Mean monthly snowfall in inches of snow.',L:{t:'Snowfall (inches of snow)',min:0},xt:'Month'})}</div>
  <div class="card" style="border:0;padding:0;margin-top:8px">${chart(cc.strong_years.map(([y,v],i)=>({dow:String(y).slice(0,4),v,d:i+1,date:''})),[{n:'Season snowfall',u:'in of snow',c:'#6366f1',bar:1,pat:'diag',v:d=>d.v,dp:0}],{title:'Cloudcroft: every strong El Niño winter on record',sub:'2023–24 (strong El Niño + negative PDO, like now) was below normal — a big El Niño does not guarantee big snow.',L:{t:'Snowfall (inches of snow)',min:0},lines:[{y:cc.normal.median,c:'#64748b',t:'normal '+r1(cc.normal.median)+'″'}],xt:'Winter start year'})}</div>
 </details>
 <details class="card"><summary>NOAA CPC & NMME outlooks</summary>
  <p class="muted">These are shifts in seasonal odds, not storm forecasts. Skill for New Mexico precip is modest.</p>
  ${(()=>{const C=D.cpc_outlook;if(!C||!C.leads)return'<p class="muted">CPC outlook unavailable.</p>';
   const pts=[['wsmr_hawk','Hawk'],['cloudcroft','Cloudcroft']];
   const seas=C.leads.filter(L=>/^[A-Z]{3}\b/.test(L.season||'')).slice(0,6);
   const cell=r=>!r||r.cat=='EC'||r.prob<=33.5?'equal chances':`${r.cat} ${Math.round(r.prob)}%`;
   return `<table><tr><th>Season</th>${pts.map(p=>`<th>${p[1]} precip</th>`).join('')}</tr>${seas.map(L=>`<tr><td>${L.season}</td>${pts.map(([k])=>`<td>${cell(L.prcp[k])}</td>`).join('')}</tr>`).join('')}</table>`})()}
 </details>
 <details class="card"><summary>How the seasonal outlook is built</summary>
  <ul><li>Expected totals shrink the strong-El-Niño composite toward the 1991–2020 normal because only a handful of strong events exist.</li>
  <li>ENSO explains at most about a quarter of year-to-year snowfall variance at Cloudcroft, less in the lowlands.</li>
  <li>No long record exists at WSMR main post; Las Cruces is the proxy and sits lower/west of the Organs.</li></ul></details>`}

/* ---- About ---- */
function aboutView(){const t=(rows,cols,hd)=>`<table><tr>${hd.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c]??'—'}</td>`).join('')}</tr>`).join('')}</table>`;const S=D.skill;
 return `<h2>Accuracy & about</h2>
 <div class="card"><p>Forecasts correct HRRR (days 1–2) and GEFS/ECMWF/NBM (days 1–10) with local station/gauge history and terrain. Lower error = better.</p>
 <p class="muted">Issued ${D.issued}. Guidance: HRRR ${D.guidance.hrrr||'n/a'}, NBM ${D.guidance.nbm}, GEFS ${D.guidance.gefs}, ECMWF ${D.guidance.ecmwf}.</p></div>
 <details class="card" open><summary>Rain-chance accuracy by lead day</summary>${(()=>{const rows=S.lr_precip.filter(r=>/^\d+$/.test(String(r.key))).map(r=>({dow:'D'+r.key,d:+r.key,date:'',...r}));return chart(rows,[{n:'NBM',u:'Brier',c:'#94a3b8',v:d=>d.BS_nbm,dp:3},{n:'This model',u:'Brier',c:'#2563eb',v:d=>d.BS_model,dp:3},{n:'Climatology',u:'Brier',c:'#cbd5e1',v:d=>d.BS_clim,dp:3}],{title:'Daily rain-chance skill',sub:'Brier score 0–1; lower is better.',L:{t:'Brier score (lower better)',min:0},xt:'Forecast lead day'})})()}</details>
 <details class="card"><summary>Gust error by lead day</summary>${chart(S.lr_wind.filter(r=>r.var=='gmax'&&/^\d+$/.test(String(r.lead_day))).sort((a,b)=>a.lead_day-b.lead_day).map(r=>({dow:'D'+r.lead_day,d:r.lead_day,date:'',...r})),[{n:'NBM (adjusted)',u:'mph',c:'#94a3b8',v:r=>r.MAE_nbm_hadj_biascorr==null?null:r.MAE_nbm_hadj_biascorr*2.237,dp:1},{n:'This model',u:'mph',c:'#f59e0b',v:r=>r.MAE_model==null?null:r.MAE_model*2.237,dp:1}],{title:'Daily max gust error',sub:'Mean absolute error in mph; lower is better.',L:{t:'Mean abs. error (mph)',min:0},xt:'Forecast lead day'})}</details>
 <details class="card"><summary>Uncertainty ranges & caveats</summary>
  <p>Dashed lines on charts are the 10th–90th percentile (an 80% range).</p>
  ${(D.uncertainty&&D.uncertainty.rows||[]).length?t(D.uncertainty.rows,['what','days','nominal','covered'],['Quantity','Lead','Nominal','Actually inside']):''}
  <ul><li>No on-site wind record at Hawk St or the Pass.</li><li>Rain gauges undercatch snow.</li><li>Visibility, thunder, hail, freezing rain and sleet are mostly raw guidance.</li></ul></details>`}

/* ---- Maps ---- */
let MAP=null,timer=null;
function mapsView(){return `<div class="sec">Maps</div><div class="mapctl"><button id="mRadar" class="on">Radar</button><button id="mSat">Satellite</button><button id="mQpf">Forecast rain</button><button id="mPlay">⏸</button><input type="range" id="mSlide" min="0" max="0" value="0"><span id="mTime" class="muted"></span></div><div id="map"></div><div id="mLeg" class="mapleg"></div><p class="muted">Radar: RainViewer. Forecast rain: ${D.qpf_map?D.qpf_map.source:''} (6-hour totals). Satellite: NASA GIBS GOES-East IR. Base © OpenStreetMap.</p>`}
async function initMap(){if(!window.L){setTimeout(initMap,200);return}
 MAP=L.map('map',{zoomControl:true}).setView([32.7,-106.1],8);
 L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`,{attribution:'© OpenStreetMap contributors',maxZoom:12}).addTo(MAP);
 Object.entries(D.points).forEach(([k,p])=>L.marker([p.lat,p.lon]).addTo(MAP).bindPopup(`<b>${p.name}</b><br>${D.sites[k].days[0].hi||''}°/${D.sites[k].days[0].lo||''}° · rain ${pct(D.sites[k].days[0].pop)}`));
 let rv=null;try{rv=await (await fetch('https://api.rainviewer.com/public/weather-maps.json')).json()}catch(e){}
 const modes={radar:()=>rv?rv.radar.past.map(f=>({t:new Date(f.time*1000),layer:()=>L.tileLayer(`${rv.host}${f.path}/256/{z}/{x}/{y}/4/1_1.png`,{opacity:.7,maxNativeZoom:7,maxZoom:12})})):[],
  sat:()=>{const now=Date.now(),out=[];for(let k=8;k>=0;k--){const t=new Date(Math.floor((now-50*60e3-k*20*60e3)/600e3)*600e3);const iso=t.toISOString().slice(0,17)+'00Z';out.push({t,layer:()=>L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_Band13_Clean_Infrared/default/${iso}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,{opacity:.65,maxNativeZoom:6,maxZoom:12})})}return out},
  qpf:()=>D.qpf_map?D.qpf_map.frames.map(f=>({t:new Date(f.start+'Z'),t1:new Date(f.end+'Z'),layer:()=>L.imageOverlay(f.file,[[D.qpf_map.bounds.s,D.qpf_map.bounds.w],[D.qpf_map.bounds.n,D.qpf_map.bounds.e]],{opacity:.8})})):[]};
 let frames=[],idx=0,cur=null,playing=true;const sl=document.getElementById('mSlide'),tl=document.getElementById('mTime');
 const fmt=d=>d.toLocaleString('en-US',{weekday:'short',hour:'numeric',minute:'2-digit',timeZone:'America/Denver'});
 function draw(i){idx=i;sl.value=i;if(cur)MAP.removeLayer(cur);if(!frames.length){tl.textContent='No frames available';return}cur=frames[i].layer().addTo(MAP);tl.textContent=frames[i].t1?`${fmt(frames[i].t)} → ${fmt(frames[i].t1)} MT`:fmt(frames[i].t)+' MT'}
 function set(m){['mRadar','mSat','mQpf'].forEach(b=>document.getElementById(b).classList.toggle('on',b==({radar:'mRadar',sat:'mSat',qpf:'mQpf'})[m]));frames=modes[m]();sl.max=Math.max(0,frames.length-1);draw(m=='qpf'?0:Math.max(0,frames.length-1));
  document.getElementById('mLeg').innerHTML=m=='qpf'&&D.qpf_map?'6-h rain (in): '+D.qpf_map.legend.map(([v,c])=>`<span style="background:rgba(${c[0]},${c[1]},${c[2]},.9)">≥${v}</span>`).join(''):(m=='radar'?'Radar reflectivity (light → heavy)':'Infrared satellite (brighter = colder tops)')}
 document.getElementById('mRadar').onclick=()=>set('radar');document.getElementById('mSat').onclick=()=>set('sat');document.getElementById('mQpf').onclick=()=>set('qpf');
 sl.oninput=()=>draw(+sl.value);document.getElementById('mPlay').onclick=e=>{playing=!playing;e.target.textContent=playing?'⏸':'▶'};
 clearInterval(timer);timer=setInterval(()=>{if(playing&&frames.length>1)draw((idx+1)%frames.length)},900);set('radar')}

/* ---- Router ---- */
function route(){const h=(location.hash||'#wsmr_hawk').slice(1);const sel=document.getElementById('loc');clearInterval(timer);
 document.querySelectorAll('.topbtns button[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p==h));
 if(D.sites[h]){sel.value=h;localStorage.loc=h;document.getElementById('app').innerHTML=locView(h)}
 else if(h=='maps'){document.getElementById('app').innerHTML=mapsView();initMap()}
 else if(h=='seas')document.getElementById('app').innerHTML=seasView();
 else if(h=='about')document.getElementById('app').innerHTML=aboutView();
 scrollTo(0,0)}
document.getElementById('loc').onchange=e=>location.hash=e.target.value;
document.querySelectorAll('.topbtns button[data-p]').forEach(b=>b.onclick=()=>location.hash=b.dataset.p);
window.addEventListener('hashchange',route);
fetch('data.json',{cache:'no-cache'}).then(r=>r.json()).then(j=>{D=j;if(!location.hash)location.hash=localStorage.loc||'wsmr_hawk';route()}).catch(e=>{document.getElementById('app').innerHTML='<p class="muted">Could not load forecast data.</p>'});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
