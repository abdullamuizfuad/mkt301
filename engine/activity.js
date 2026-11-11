/* MKT Arena engine: lecturer card "📊 Class activity" (Lecturer tab, lecturer only, works on the published rules: it reads users/ only).
   For any range (full semester, a week, or from–to): a calendar heatmap, class totals, the activity mix per week, busy times of day,
   and a students table (top 5 / 10 / 20 / everyone, sortable) with a per-student chart and CSV downloads.
   Sources in each student's progress (U): days (practice days), cnt (one entry per counted practice action, with its day), st (active
   on-screen seconds per day), stw (timed writing seconds per day, see presence.js), xpd (XP per day), al (exact XP log, from 4 Nov),
   qa (every answer, from 4 Nov). All days are Maldives days (GMT+5). */
const ACT_CATS=[['mcq','MCQs'],['plan','Plans'],['written','Typed & timed answers'],['chip','Paragraph builders'],['case','Cases'],['notes','Notes'],
  ['review','Review & flashcards'],['expert','Expert'],['boss','Boss rounds'],['chal','Challenges'],['paper','Practice paper']];
const ACT_PRE={mcq:'mcq',mcqr:'mcq',plan:'plan',eplan:'plan',typed:'written',timed:'written',ltimed:'written',catimed:'written',ess:'written',essay:'written',script:'written',
  chip:'chip',read:'case',actdone:'case',argue:'case',verdict:'case',ca:'case',notes:'notes',rev:'review',fc:'review',xmcq:'expert',xchip:'expert',xessay:'expert',
  boss:'boss',ch:'chal',wk:'chal',bt:'chal',wild:'chal',speed:'chal',duel:'chal',story:'case',pp:'paper'};
const ACT_COL={mcq:'var(--teal)',plan:'var(--blue)',written:'var(--gold)',chip:'var(--pink)',case:'var(--violet)',notes:'var(--green)',review:'var(--muted)',
  expert:'var(--red)',boss:'#e8813a',chal:'#4fb3d9',paper:'#9a8c6a'};
const actCat=k=>ACT_PRE[String(k).split(':')[0]]||'';
const actDay=t=>new Date(t*1000+MV).toISOString().slice(0,10);
const actCsv=(rows,name)=>(window.__csvSpy||csvDownload)(rows,name);
const ACT_FROM='2026-10-28';
/* one student's activity, by day: {sid,name,xpAll,days:Set,st:{},stw:{},xpd:{},ev:{day:{cat:n}},mq:{day:[n,right]},hr:[24]} */
function actStudent(d){let u={};try{u=JSON.parse(d.u)||{}}catch(e){}
  const s={sid:d.id,name:d.name||'',xpAll:d.xp|0,days:new Set((u.days||[]).filter(x=>x>=ACT_FROM)),st:u.st||{},stw:u.stw||{},xpd:u.xpd||{},ev:{},mq:{},hr:new Array(24).fill(0)};
  const add=(day,c)=>{if(!day||day<ACT_FROM)return;const e=s.ev[day]||(s.ev[day]={});e[c]=(e[c]|0)+1};
  Object.entries(u.cnt||{}).forEach(([k,c])=>{const cat=actCat(k);if(!cat||!c)return;add(c.d,cat);
    if(cat==='mcq'&&String(k).startsWith('mcq:')){const m=s.mq[c.d]||(s.mq[c.d]=[0,0]);m[0]++;if((c.k||[]).includes('mcqRight'))m[1]++}});
  (u.al||[]).forEach(([t,k])=>{const cat=actCat(k);if(!cat)return;if(!(u.cnt||{})[k])add(actDay(t),cat);if(cat!=='mcq')s.hr[new Date(t*1000+MV).getUTCHours()]++});
  (u.qa||[]).forEach(([t])=>s.hr[new Date(t*1000+MV).getUTCHours()]++);
  return s}
const inR=(d,R)=>d>=R.a&&d<=R.b;
const actSum=(o,R)=>Object.entries(o||{}).reduce((t,[d,v])=>inR(d,R)?t+(v|0):t,0);
/* a student's numbers in range R ({a,b,full}) */
function actNums(s,R){let ans=0,n=0,r=0;const cats={};
  Object.entries(s.ev).forEach(([d,e])=>{if(!inR(d,R))return;Object.entries(e).forEach(([c,v])=>{ans+=v;cats[c]=(cats[c]|0)+v})});
  Object.entries(s.mq).forEach(([d,m])=>{if(inR(d,R)){n+=m[0];r+=m[1]}});
  const st=actSum(s.st,R),tw=actSum(s.stw,R),hrs=(st+tw)/3600,xp=R.full?Math.max(s.xpAll,actSum(s.xpd,R)):actSum(s.xpd,R);
  const days=[...s.days].filter(d=>inR(d,R)).length||Object.keys(s.ev).filter(d=>inR(d,R)).length;
  return {sid:s.sid,name:s.name,xp,hrs,tw:tw/3600,days,ans,acc:n?Math.round(r/n*100):null,mcq:n,xph:hrs>=.25?Math.round(xp/hrs):null,cats}}
const ACT_SORT={xp:'XP',hrs:'Study hours',days:'Days active',ans:'Answers',acc:'MCQ accuracy',xph:'XP per hour'};
const hFmt=h=>h>=10?Math.round(h)+' h':(Math.round(h*10)/10)+' h';
let ACTV=null;/* {S:[students], first, today, R, top, sort, open} — kept while the page is open */
function actRanges(){const out=[['full','Full semester (since '+ACT_FROM.slice(8)+' Oct)'],['week','This week']];let w=weekKey(today());const w0=weekKey(ACTV.first);
  for(w=addDays(w,-7);w>=w0;w=addDays(w,-7)){const e=addDays(w,6),tw=typeof termWeek==='function'?termWeek(w):0;
    out.push(['w:'+w,(tw>=1&&tw<=16?'Week '+tw+' · ':'')+actLbl(w)+'–'+actLbl(e)])}
  out.push(['custom','Custom range…']);return out}
const actLbl=d=>{const x=new Date(d+'T12:00:00');return x.getDate()+' '+x.toLocaleString('en-GB',{month:'short'})};
function actSetRange(v){const t=today();if(v==='full')ACTV.R={a:ACTV.first,b:t,full:1,v};
  else if(v==='week'){const w=weekKey(t);ACTV.R={a:w,b:addDays(w,6),v}}
  else if(v.startsWith('w:')){const w=v.slice(2);ACTV.R={a:w,b:addDays(w,6),v}}
  else ACTV.R={a:ACTV.R.a,b:ACTV.R.b,v:'custom'}}
const actDays=R=>{const out=[];for(let d=R.a;d<=R.b&&out.length<400;d=addDays(d,1))out.push(d);return out};
/* class numbers per day in R */
function actDaily(R){return actDays(R).map(d=>{let act=0,ans=0,xp=0,sec=0;ACTV.S.forEach(s=>{const e=s.ev[d],n=e?Object.values(e).reduce((t,v)=>t+v,0):0;
  if(s.days.has(d)||n)act++;ans+=n;xp+=(s.xpd[d]|0);sec+=(s.st[d]|0)+(s.stw[d]|0)});return {d,act,ans,xp,hrs:sec/3600}})}
/* ---------- charts (inline SVG, theme colours) ---------- */
function actHeat(D){if(!D.length)return '';const w0=weekKey(D[0].d),rows=[];let wk=w0;const by=Object.fromEntries(D.map(x=>[x.d,x])),mx=Math.max(1,...D.map(x=>x.act));
  for(;wk<=D[D.length-1].d;wk=addDays(wk,7))rows.push(wk);const cs=22,g=4,lw=58,W=lw+7*(cs+g),H=18+rows.length*(cs+g);
  const cells=rows.map((w,i)=>[0,1,2,3,4,5,6].map(j=>{const d=addDays(w,j),x=by[d],y=18+i*(cs+g),X=lw+j*(cs+g);if(!x)return '';
    const op=x.act?.18+.82*x.act/mx:.06;return `<rect x="${X}" y="${y}" width="${cs}" height="${cs}" rx="5" fill="var(--teal)" fill-opacity="${op.toFixed(2)}" stroke="${d===today()?'var(--gold)':'none'}" stroke-width="2" data-hd="${d}" class="click"><title>${d}: ${x.act} students · ${x.ans} answers · ${x.xp} XP · ${hFmt(x.hrs)}</title></rect>`}).join('')+`<text x="0" y="${18+i*(cs+g)+15}" font-size="11" fill="var(--muted)">${actLbl(w)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Active students per day">${['M','T','W','T','F','S','S'].map((l,j)=>`<text x="${lw+j*(cs+g)+cs/2}" y="12" font-size="10" text-anchor="middle" fill="var(--muted)">${l}</text>`).join('')}${cells}</svg>`}
function actMix(R){const weeks=[];for(let w=weekKey(R.a);w<=R.b;w=addDays(w,7))weeks.push(w);
  const data=weeks.map(w=>{const r={a:w<R.a?R.a:w,b:addDays(w,6)>R.b?R.b:addDays(w,6)},c={};ACTV.S.forEach(s=>Object.entries(s.ev).forEach(([d,e])=>{if(inR(d,r))Object.entries(e).forEach(([k,v])=>c[k]=(c[k]|0)+v)}));return [w,c]});
  const mx=Math.max(1,...data.map(([,c])=>Object.values(c).reduce((t,v)=>t+v,0))),bw=34,g=12,H=150,W=Math.max(220,data.length*(bw+g)+10);
  const bars=data.map(([w,c],i)=>{let y=H-20;const x=6+i*(bw+g);return ACT_CATS.map(([k,l])=>{const v=c[k]|0;if(!v)return '';const h=v/mx*(H-34);y-=h;return `<rect x="${x}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" fill="${ACT_COL[k]}"><title>${actLbl(w)}: ${l} ${v}</title></rect>`}).join('')+`<text x="${x+bw/2}" y="${H-6}" font-size="10" text-anchor="middle" fill="var(--muted)">${actLbl(w)}</text>`}).join('');
  const used=ACT_CATS.filter(([k])=>data.some(([,c])=>c[k]));
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Activity mix per week">${bars}</svg><p class="actleg">${used.map(([k,l])=>`<span><i style="background:${ACT_COL[k]}"></i>${esc(l)}</span>`).join('')}</p>`}
function actHours(){const h=new Array(24).fill(0);ACTV.S.forEach(s=>s.hr.forEach((v,i)=>h[i]+=v));const mx=Math.max(1,...h),bw=12,g=3,H=110,W=24*(bw+g);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W*1.6}px" role="img" aria-label="Activity by hour of day">${h.map((v,i)=>{const bh=v/mx*(H-26);return `<rect x="${i*(bw+g)}" y="${(H-16-bh).toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" rx="2" fill="var(--blue)"><title>${String(i).padStart(2,'0')}:00 · ${v} actions</title></rect>${i%3===0?`<text x="${i*(bw+g)+bw/2}" y="${H-3}" font-size="9" text-anchor="middle" fill="var(--muted)">${i}</text>`:''}`}).join('')}</svg>`}
function actMini(s,R){const D=actDays(R).slice(-60),v=D.map(d=>(((s.st[d]|0)+(s.stw[d]|0))/3600)),x=D.map(d=>s.xpd[d]|0),mh=Math.max(.25,...v),mx=Math.max(1,...x),bw=Math.max(4,Math.min(14,Math.floor(320/D.length)-2)),W=D.length*(bw+2),H=90;
  const pts=x.map((y,i)=>`${i*(bw+2)+bw/2},${(H-14-y/mx*(H-24)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${Math.max(W,200)}px" role="img" aria-label="Study hours and XP per day">${v.map((h,i)=>{const bh=h/mh*(H-24);return `<rect x="${i*(bw+2)}" y="${(H-14-bh).toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" rx="2" fill="var(--teal)" fill-opacity=".75"><title>${D[i]}: ${hFmt(h)} · ${x[i]} XP</title></rect>`}).join('')}<polyline points="${pts}" fill="none" stroke="var(--gold)" stroke-width="2"/><text x="0" y="${H-2}" font-size="9" fill="var(--muted)">${actLbl(D[0])}</text><text x="${W}" y="${H-2}" font-size="9" text-anchor="end" fill="var(--muted)">${actLbl(D[D.length-1])}</text></svg><p class="actleg"><span><i style="background:var(--teal)"></i>study hours</span><span><i style="background:var(--gold)"></i>XP</span></p>`}
/* ---------- the card ---------- */
function actRows(){const R=ACTV.R,N=ACTV.S.map(s=>actNums(s,R)),k=ACTV.sort;
  return N.sort((a,b)=>((b[k]==null?-1:b[k])-(a[k]==null?-1:a[k]))||b.xp-a.xp||(a.sid<b.sid?-1:1))}
function actDraw(){const el=$('#actb');if(!el||!ACTV)return;const R=ACTV.R,D=actDaily(R),N=actRows(),act=N.filter(n=>n.days||n.ans),tot=N.reduce((t,n)=>({h:t.h+n.hrs,a:t.a+n.ans,x:t.x+n.xp,m:t.m+n.mcq,r:t.r+(n.acc==null?0:n.acc*n.mcq/100)}),{h:0,a:0,x:0,m:0,r:0});
  const show=ACTV.top?N.slice(0,ACTV.top):N;
  el.innerHTML=`<div class="actctl"><label>Range <select id="actrng">${actRanges().map(([v,l])=>`<option value="${v}"${R.v===v?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
    <span id="actcus"${R.v==='custom'?'':' hidden'}><input type="date" id="acta" value="${R.a}" min="${ACTV.first}" max="${ACTV.today}" aria-label="From"> – <input type="date" id="actb2" value="${R.b}" min="${ACTV.first}" max="${ACTV.today}" aria-label="To"></span>
    <button class="btn ghost sm" id="actref">↻ Refresh</button></div>
  <p class="muted" style="margin:6px 0 10px;font-size:.88rem">${esc(actLbl(R.a))} – ${esc(actLbl(R.b))} · ${D.length} days</p>
  <div class="stats actstats"><div class="stat"><b>${act.length}/${N.length}</b><span>students active</span></div><div class="stat"><b>${hFmt(tot.h)}</b><span>study hours</span></div><div class="stat"><b>${tot.a}</b><span>answers</span></div><div class="stat"><b>${tot.m?Math.round(tot.r/tot.m*100)+'%':'–'}</b><span>MCQ accuracy</span></div><div class="stat"><b>${tot.x}</b><span>XP</span></div></div>
  <h3>Calendar</h3><p class="muted" style="font-size:.82rem;margin:0 0 6px">Darker = more students practised that day. Tap a day.</p><div class="actscroll">${actHeat(D)}</div><p id="actday" class="muted" style="font-size:.86rem;min-height:1.2em;margin:6px 0 0"></p>
  <h3>Activity mix per week</h3><div class="actscroll">${actMix(R)}</div>
  <h3>Busy times of day</h3><p class="muted" style="font-size:.82rem;margin:0 0 6px">Answers and practice actions by hour (Maldives time), all students, from 4 Nov (when exact times started).</p><div class="actscroll">${actHours()}</div>
  <h3>Students</h3><div class="row" style="gap:6px;flex-wrap:wrap"><span class="chipline" role="group" aria-label="How many">${[[5,'Top 5'],[10,'Top 10'],[20,'Top 20'],[0,'Everyone']].map(([n,l])=>`<button type="button" class="chip${ACTV.top===n?' on':''}" data-atop="${n}" aria-pressed="${ACTV.top===n}">${l}</button>`).join('')}</span>
    <label style="font-size:.88rem">Sort by <select id="actsort">${Object.entries(ACT_SORT).map(([k,l])=>`<option value="${k}"${ACTV.sort===k?' selected':''}>${l}</option>`).join('')}</select></label></div>
  <div class="tablewrap" style="margin-top:8px"><table class="acttbl"><tr><th>#</th><th>Student</th><th>XP</th><th>Study hours</th><th>Days</th><th>Answers</th><th>MCQ acc.</th><th>XP / h</th></tr>
  ${show.map((n,i)=>`<tr class="click" data-asid="${esc(n.sid)}" tabindex="0"><td>${i+1}</td><td>${esc(n.name||n.sid)}<div class="muted" style="font-size:.76rem">${esc(n.sid)}</div></td><td><b>${n.xp}</b></td><td>${hFmt(n.hrs)}${n.tw>=.05?`<div class="muted" style="font-size:.74rem">incl. ${hFmt(n.tw)} timed writing</div>`:''}</td><td>${n.days}</td><td>${n.ans}</td><td>${n.acc==null?'–':n.acc+'%'}</td><td>${n.xph==null?'–':n.xph}</td></tr>${ACTV.open===n.sid?`<tr class="actdet"><td colspan="8">${actMini(ACTV.S.find(s=>s.sid===n.sid),R)}<div class="row" style="margin-top:6px"><button class="btn ghost sm" data-aprof="${esc(n.sid)}">Open profile</button><button class="btn ghost sm" data-va="${esc(n.sid)}">👁 View as student</button></div></td></tr>`:''}`).join('')||'<tr><td colspan="8" class="muted">No students yet.</td></tr>'}</table></div>
  <div class="row" style="margin-top:10px"><button class="btn ghost sm" id="actcsv">⬇ CSV (this list)</button><button class="btn ghost sm" id="actcsva">⬇ CSV (everyone)</button><button class="btn ghost sm" id="actcsvd">⬇ Daily class CSV</button></div>
  <p class="muted" style="font-size:.8rem;margin:10px 0 0">Study hours count time with the app open and in use (idle over 2 minutes not counted), plus time on a running writing timer. Practice on paper without the timer isn't counted. Data since 28 Oct 2026; exact per-answer data since 4 Nov. Answers = counted practice actions (MCQs, plans, written answers, paragraphs, cases, notes, reviews, Expert, Boss, challenges). MCQ accuracy = first tries. XP per day is recorded from 29 Oct; "Full semester" XP is each student's total.</p>`;
  const rng=$('#actrng');rng.onchange=()=>{actSetRange(rng.value);if(rng.value==='custom')$('#actcus').hidden=false;actDraw()};
  const cus=()=>{let a=$('#acta').value||ACTV.first,b=$('#actb2').value||ACTV.today;if(a>b)[a,b]=[b,a];ACTV.R={a,b,v:'custom'};actDraw()};
  $('#acta').onchange=cus;$('#actb2').onchange=cus;$('#actref').onclick=()=>actLoad(true);
  el.querySelectorAll('[data-atop]').forEach(b=>b.onclick=()=>{ACTV.top=+b.dataset.atop;actDraw()});
  $('#actsort').onchange=e=>{ACTV.sort=e.target.value;actDraw()};
  el.querySelectorAll('[data-hd]').forEach(r=>r.onclick=()=>{const x=D.find(y=>y.d===r.dataset.hd);if(x)$('#actday').textContent=`${x.d}: ${x.act} students practised · ${x.ans} answers · ${x.xp} XP · ${hFmt(x.hrs)} study time`});
  el.querySelectorAll('tr[data-asid]').forEach(r=>{const go=()=>{ACTV.open=ACTV.open===r.dataset.asid?'':r.dataset.asid;actDraw()};r.onclick=go;r.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}}});
  el.querySelectorAll('[data-aprof]').forEach(b=>b.onclick=e=>{e.stopPropagation();openStudent(b.dataset.aprof)});
  const head=['rank','sid','name','from','to','xp','study_hours','timed_writing_hours','days_active','answers','mcq_answers','mcq_accuracy_pct','xp_per_hour'].concat(ACT_CATS.map(([k])=>'act_'+k));
  const row=(n,i)=>[i+1,n.sid,n.name,R.a,R.b,n.xp,n.hrs.toFixed(2),n.tw.toFixed(2),n.days,n.ans,n.mcq,n.acc==null?'':n.acc,n.xph==null?'':n.xph].concat(ACT_CATS.map(([k])=>n.cats[k]|0));
  const nm=CRS.id+'-activity-'+R.a+'-to-'+R.b;
  $('#actcsv').onclick=()=>actCsv([head].concat(show.map(row)),nm+(ACTV.top?'-top'+ACTV.top:'')+'.csv');
  $('#actcsva').onclick=()=>actCsv([head].concat(N.map(row)),nm+'-everyone.csv');
  $('#actcsvd').onclick=()=>actCsv([['date','students_active','answers','xp','study_hours']].concat(D.map(x=>[x.d,x.act,x.ans,x.xp,x.hrs.toFixed(2)])),CRS.id+'-daily-'+R.a+'-to-'+R.b+'.csv')}
async function actLoad(force){const el=$('#actb');if(!el)return;if(ACTV&&!force){actDraw();return}
  el.innerHTML='<p class="muted">Reading everyone\'s progress…</p>';let docs;try{docs=await CLOUD.docs('users')}catch(e){el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`;return}
  const S=docs.filter(d=>d.id!==LECTURER).map(actStudent),all=S.flatMap(s=>[...s.days,...Object.keys(s.ev)]).filter(d=>d>=ACT_FROM).sort();
  const prev=ACTV;ACTV={S,first:all[0]||ACT_FROM,today:today(),top:prev?prev.top:10,sort:prev?prev.sort:'xp',open:'',R:prev?prev.R:null};
  if(!ACTV.R)actSetRange('full');else if(ACTV.R.v!=='custom')actSetRange(ACTV.R.v);
  lfSum('actc',S.filter(s=>[...s.days].some(d=>d>=weekKey(today()))).length+' active this week');actDraw()}
if(typeof LF_META!=='undefined')LF_META.actc=['📊 Class activity','Since launch: calendar, hours, top students'];
lcard('actc',el=>{if(!cloudOn())return;el.hidden=false;el.innerHTML=`<h2 style="margin:0">📊 Class activity</h2><div id="actb" style="margin-top:8px"></div>`;actLoad(false)});
