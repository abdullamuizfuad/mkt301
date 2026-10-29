/* MKT Arena engine: the simple home ("Today"), My progress (#/progress), the Practice page, the phone tab bar and More menu,
   the backup page, the lecturer's home and the lecturer's read-only "View as student".
   Course hooks (in course.js):
     homeTiles() → [[emoji, title, line, href]]   the four big practice tiles (home and #/practice)
     profCourse(u, ctx) → {stats:[[value, label]], secs:[{id, ico, t, sum, html}], badgesX:html, cases:{sum, html}}
       the course's parts of a profile. The lecturer's view of a student and the student's own My progress are built from the
       same sections (profSections), so the student sees what the lecturer sees; ctx = {sid, self, lect, marked}.
   The phone tab bar is one block below (tabbarHTML and its styles); set CRS.tabbar=false in course-config.js to remove it.
   While the lecturer views as a student, VIEWAS (core.js) is set: save(), award(), countOnce(), localStorage, every cloud write,
   screen time and streak freezes are all switched off, and answer controls only show a "read-only" toast. */

/* ---------- Today (home) ---------- */
function cdLeft(){return Math.max(0,Math.round((Date.parse(EXAM_DAY+'T00:00:00Z')-Date.parse(mvDay()+'T00:00:00Z'))/864e5))}
function streakMiniHTML(u){const n=streak(u),F=u.frz||{},fz=F.d||{},days=new Set(u.days),t=today(),cells=[];
  for(let i=6;i>=0;i--){const d=addDays(t,-i),f=fz[d]&&!days.has(d);cells.push(`<i class="sb ${days.has(d)?'on':f?'fz':d===t?'today':''}" title="${d}${days.has(d)?' · practised':f?' · ❄️ freeze used':''}">${f?'❄️':''}</i>`)}
  return `<div class="tstreak" aria-label="${n} day streak, ${F.b|0} freezes banked"><b class="lex" title="${n} day${n===1?'':'s'} in a row">🔥 ${n}</b><span class="sbrow" aria-hidden="true">${cells.join('')}</span><span class="tag" title="Streak freezes: every 4 days in a row earns one (up to ${FRZ_MAX})">❄️ ${F.b|0}/${FRZ_MAX}</span></div>`}
function todayHeadHTML(){const L=level(U.xp),nm=U.dn||ME.name;
  return `<div class="card thead" id="thead"><a class="tav" href="#/avatar" aria-label="My profile">${avatarSVG(myAv(),64,'')}</a>
  <div class="tmain"><div class="tnm"><a class="tname" href="#/avatar"><b class="lex">${esc(nm)}</b>${U.un?` <span class="muted">${esc(U.un)}</span>`:''}</a><a class="tag tedit" href="#/avatar" id="tedit">✏️ Edit profile</a></div>
  <div class="lvline"><b class="lex">${typeof LVL_ICO!=='undefined'?LVL_ICO[L.i]+' ':''}Level ${L.i+1} · ${esc(L.name)}</b><span class="muted">${L.to?(L.to-U.xp)+' XP to go':'Top level'}</span></div><div class="bar"><i style="width:${L.pct}%"></i></div>
  ${streakMiniHTML(U)}</div></div>`}
/* the small countdown: a few weeks of days as tiny squares, and the days left */
function miniCdHTML(u){u=u||U;const days=new Set(u.days),t=mvDay();let st=addDays(t,-14);st=addDays(st,-dowOf(st));const cols=[];
  for(let w=st;w<=EXAM_DAY;w=addDays(w,7)){const c=[];for(let i=0;i<7;i++){const d=addDays(w,i);
      c.push(`<i class="${[days.has(d)?'on':'',d===t?'today':'',d===EXAM_DAY?'end':'',d>EXAM_DAY?'out':'',d<t&&!days.has(d)?'miss':''].filter(Boolean).join(' ')}"></i>`)}cols.push(`<span>${c.join('')}</span>`)}
  const n=cdLeft(),pp=typeof ppOpen==='function'&&ppOpen()&&!(typeof ppBusy==='function'&&ppBusy());
  return `<div class="card tcd" id="tcd"><a class="tcdl" href="#/progress/cd" aria-label="${n} days left until Monday 14 December 2026, 9:00 am. Open the full countdown"><span><b class="lex tcdn">⏳ ${n} day${n===1?'':'s'} left</b><span class="muted">Mon 14 Dec 2026 · 9:00 am</span></span><span class="minicd" aria-hidden="true">${cols.join('')}</span></a>${pp?'<a class="btn ghost sm" href="#/paper">📝 Practice paper</a>':''}</div>`}
function nextHTML(){const nx=nextAction();
  return `<a class="card zone next" href="${nx[3]}" id="nextact"><span class="em">${nx[0]}</span><div style="flex:1;min-width:0"><span class="muted" style="font-size:.78rem;font-weight:700;letter-spacing:.04em">NEXT UP</span><h2 style="margin:2px 0">${esc(nx[1])}</h2><p class="muted" style="margin:0;font-size:.9rem">${esc(nx[2])}</p></div><span class="btn">Go →</span></a>`}
function missionRowsHTML(){const GO=CRS.missionGo||{};return missions().map(m=>{const v=Math.min(U.day.c[m.k]||0,m.n);
  return `<div class="mission"><span class="tick ${v>=m.n?'on':''}">${v>=m.n?'✓':''}</span><div style="flex:1">${esc(m.x)}<div class="bar" style="margin-top:6px"><i style="width:${v/m.n*100}%"></i></div></div><span class="muted">${v}/${m.n}</span>${v<m.n?`<a class="btn ghost sm" href="${GO[m.k]||'#/'}" style="min-height:32px;padding:4px 10px">Go</a>`:''}</div>`}).join('')}
function todayRowHTML(){rollDay();const t=stToday(U),ms=missions(),done=ms.filter(m=>(U.day.c[m.k]||0)>=m.n).length,due=srsDue().length;
  return `<div class="card trow" id="trow"><div class="tchips">
  <a class="tchip" href="#/progress/screen" id="tst"><span class="tring" style="--p:${Math.min(100,t/ST.GOAL*100)}"></span><span><b>${t>=ST.GOAL?'Goal met ✓':Math.floor(t/60)+'/20'}</b><small>min today</small></span></a>
  <button type="button" class="tchip" id="tmb" aria-expanded="false" aria-controls="tml" data-va-ok><span class="tico">🎯</span><span><b>${U.day.done?'Done ✓':done+'/3'}</b><small>missions ▾</small></span></button>
  <a class="tchip" href="#/review" id="trv"><span class="tico">🧠</span><span><b>${due}</b><small>to review</small></span></a></div>
  <div id="tml" class="tml" hidden><p class="muted" style="font-size:.85rem;margin:10px 0 0">${U.day.done?'✅ Done for today. New missions tomorrow.':`Complete all three for +${MBONUS[U.day.t]} XP (${TIERS[U.day.t]}). New missions every day.`}</p>${missionRowsHTML()}</div></div>`}
function inviteHTML(){const n=typeof NOTE!=='undefined'?NOTE.filter(x=>!x.seen).length:0;
  return n?`<a class="card zone tinv" href="#/notifs" id="tinv"><span class="em">🔔</span><span style="flex:1"><b class="lex">${n} new notification${n===1?'':'s'}</b><br><span class="muted" style="font-size:.85rem">Challenge invites and results</span></span><span class="btn sm">Open</span></a>`:''}
/* the course's tiles, then the practice paper: locked for students until Sun 22 Nov 2026, 00:00 (GMT+5); the lecturer can always preview it */
function paperTile(){if(typeof ppLine!=='function')return null;const L=ME&&ME.sid===LECTURER,open=Date.now()>=PAPER_AT;
  return ['📝','Practice paper',L?'Preview':open?ppLine():'🔒 Opens Sun 22 Nov','#/paper',!L&&!open]}
function tilesHTML(){const T=(typeof homeTiles==='function'?homeTiles():[]).concat([paperTile()].filter(Boolean));
  return `<div class="ttiles" id="ttiles">${T.map(x=>`<a class="card zone ttile${x[4]?' locked':''}" href="${x[3]}"${x[3]==='#/paper'?' id="tpaper"':''}><span class="em">${x[0]}</span><span><b class="lex">${esc(x[1])}</b><small class="muted">${esc(x[2]||'')}</small></span></a>`).join('')}</div>`}
function home(){if(!U)return;rollDay();if(ME.sid===LECTURER)return lectHome();
  shell('#/',`<h1 class="sr">Today</h1>${todayHeadHTML()}${miniCdHTML()}${nextHTML()}${todayRowHTML()}${inboxHTML()}${inviteHTML()}${tilesHTML()}`);
  const b=$('#tmb');b.onclick=()=>{const l=$('#tml'),o=l.hidden;l.hidden=!o;b.setAttribute('aria-expanded',o)}}

/* ---------- the lecturer's home: lecturer essentials only (the lecturer is never a player) ---------- */
let LH=null;/* one read of users, reviews and reports, kept for 5 minutes: counts, the at-risk list and who was active recently */
async function lectNums(){if(LH&&Date.now()-LH.at<5*60e3)return LH;const [us,rv]=await Promise.all([CLOUD.docs('users'),CLOUD.docs('reviews')]);
  const t0=Date.parse(mvDay()+'T00:00:00+05:00'),R={};rv.forEach(d=>R[d.id]=d.m||{});let active=0,mark=0;const riskL=[],recent=[];
  us.filter(x=>x.id!==LECTURER).forEach(x=>{let u={};try{u=JSON.parse(x.u)}catch(e){}const n=u.dn||x.name||x.id;if((x.ts|0)>=t0)active++;
    mark+=Object.keys(u.ans||{}).filter(k=>!(R[x.id]||{})[k]).length;const r=riskOf({u,ts:x.ts});if(r.length)riskL.push({id:x.id,n,why:r.join(' · ')});if(x.ts)recent.push({id:x.id,n,ts:x.ts})});
  let reports=null;try{if(await rulesOK())reports=(await CLOUD.docs('reports',{where:[['st','==','open']]})).length}catch(e){}
  recent.sort((a,b)=>b.ts-a.ts);return LH={at:Date.now(),active,mark,reports,risk:riskL.length,riskL,recent:recent.slice(0,30)}}
let LF_FOCUS='';/* a Lecturer-tab block to open and scroll to (from the lecturer home) */
const lgo=id=>`href="#/lecturer" data-lgo="${id}"`;
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-lgo]');if(a)LF_FOCUS=a.dataset.lgo});
function lectHome(){const first=esc(String(ME.name).split(' ')[0]),c=cloudOn();
  shell('#/',`<div data-lect id="lhome"><div class="card thead"><a class="tav" href="#/avatar" aria-label="My profile">${avatarSVG(lectAv(),56,'')}</a><div class="tmain"><div class="tnm"><h1 style="margin:0;font-size:1.3rem">Welcome back, ${first}</h1><a class="tag tedit" href="#/avatar">✏️ Edit profile</a></div><p class="muted" style="margin:4px 0 0">${esc(mvDay())} · your class at a glance.</p></div></div>
  ${c?`<div class="card trow" id="lday"><h2 style="margin:0 0 8px;font-size:1.05rem">Class today</h2><div class="tchips lchips"><a class="tchip" ${lgo('cdash')}><span class="tico">🟢</span><span><b data-ln="active">…</b><small>active today</small></span></a>
   <a class="tchip" ${lgo('mq')}><span class="tico">✍️</span><span><b data-ln="mark">…</b><small>to mark</small></span></a>
   <a class="tchip" ${lgo('rptc')}><span class="tico">🚩</span><span><b data-ln="reports">…</b><small>open reports</small></span></a>
   <a class="tchip" ${lgo('riskc')}><span class="tico">⚠️</span><span><b data-ln="risk">…</b><small>at risk</small></span></a></div><p class="err" id="lderr"></p></div>`
   :'<div class="callout">Sign in with your PIN while online to see the class.</div>'}
  <div class="lbtns"><button type="button" class="btn" id="lhva"${c?'':' disabled'}>👁 View as student</button><a class="btn ghost" ${lgo('mq')}>✍️ Marking</a><a class="btn ghost" ${lgo('annc')}>📣 Post announcement</a><a class="btn ghost" ${lgo('lsess')}>🎓 Start live session</a><a class="btn ghost" href="#/board">🏆 Leaderboard</a><a class="btn ghost" href="#/lecturer">🧑‍🏫 Lecturer tools</a></div>
  <div id="lhvap"></div>
  ${c?`<div class="grid g2" style="margin-top:12px"><div class="card"><h2 style="margin:0 0 6px;font-size:1.05rem">⚠️ At risk</h2><div id="lhrisk"><p class="muted">Loading…</p></div></div><div class="card"><h2 style="margin:0 0 6px;font-size:1.05rem">🟢 Recently active</h2><div id="lhrecent"><p class="muted">Loading…</p></div></div></div>`:''}
  <h2 style="margin-top:22px">Previews</h2><p class="muted" style="margin-top:-4px;font-size:.9rem">Try the practice paper and any question yourself. Nothing you do here earns XP or reaches the class.</p></div>${tilesHTML()}`);
  $('#lhva').onclick=()=>{const p=$('#lhvap');if(p.innerHTML)return;p.innerHTML=vaCardHTML();vaCardInit();setTimeout(()=>{const i=$('#vaq');if(i)i.focus()},50)};
  if(!c)return;lectNums().then(N=>{const el=$('#lday');if(!el)return;['active','mark','reports','risk'].forEach(k=>{const b=el.querySelector(`[data-ln="${k}"]`);if(b)b.textContent=N[k]==null?'–':N[k]});
    const list=(rows,sub)=>rows.length?`<ol class="sumlist">${rows.map(r=>`<li><a href="#/student/${esc(r.id)}" data-sid="${esc(r.id)}">${esc(r.n)}</a> <span class="muted" style="font-size:.82rem">${esc(sub(r))}</span></li>`).join('')}</ol>`:'<p class="muted" style="margin:0">None.</p>';
    $('#lhrisk').innerHTML=list(N.riskL,r=>r.why);$('#lhrecent').innerHTML=list(N.recent,r=>ago(r.ts));
    ['#lhrisk','#lhrecent'].forEach(q=>{const b=$(q);lfTrim(b,q);b.querySelectorAll('[data-sid]').forEach(a=>a.onclick=e=>{e.preventDefault();openStudent(a.dataset.sid)})})})
    .catch(e=>{const er=$('#lderr');if(er)er.textContent=CLOUD.say(e)})}

/* ---------- Practice, backup ---------- */
ROUTES.practice=()=>{
  const L=ME.sid===LECTURER;shell('#/practice',`<h1>Practice</h1>${L?'<p class="muted" data-lect>Try any question yourself. Nothing you do here earns XP or reaches the class.</p>':''}${tilesHTML()}
  ${L?'':`<h2 style="margin-top:22px">Quick recall</h2><div class="ttiles"><a class="card zone ttile" href="#/review"><span class="em">🧠</span><span><b class="lex">Review</b><small class="muted">${U?srsDue().length:0} due today</small></span></a><a class="card zone ttile" href="#/cards"><span class="em">🃏</span><span><b class="lex">Flashcards</b><small class="muted">Key terms</small></span></a></div>
  ${typeof socialCardHTML==='function'?socialCardHTML():''}`}`)};
ROUTES.backup=()=>{shell('#/backup',`<p><a href="#/">← Home</a></p><div class="card" id="bk"><div class="row" style="justify-content:space-between"><h1 style="margin:0;font-size:1.4rem">💾 Save my progress</h1><span class="tag" id="bkl"></span></div>
  <p class="muted" style="font-size:.9rem;margin:8px 0 12px">${cloudOn()?'Your progress saves to your account. A backup copy is an extra safety net.':'Your progress lives on this device only. Save a backup to move it to another phone or laptop, or to keep it safe before clearing your browser.'}</p>
  <div class="row"><button class="btn" id="bkd">⬇ Download backup</button><button class="btn ghost" id="bkc">📧 Email or copy…</button><button class="btn ghost" id="bkr">Restore</button></div>
  <div id="bkp" class="hide" style="margin-top:14px"><label for="bkt">Paste your backup code, or choose your backup file</label><textarea id="bkt" style="min-height:90px" placeholder="${CRS.CODE}B-..."></textarea>
  <div class="row" style="margin-top:10px"><input type="file" id="bkf" accept=".txt,text/plain" style="max-width:100%;color:var(--ink2)"><button class="btn gold" id="bkgo">Restore</button></div><div class="err" id="bke"></div></div></div>`);backupCard()};

/* ---------- profiles: the lecturer's view of a student and the student's own My progress ---------- */
const xp7=u=>{const from=addDays(today(),-6);return Object.entries(u.xpd||{}).filter(([d])=>d>=from).reduce((t,[,x])=>t+(x|0),0)};
function profSumHTML(u,o){o=o||{};const R=readiness(u).sort((a,b)=>a.pct-b.pct),w=R[0],wk=weakOf(u)[0];
  const tiles=[o.self?['Days practised',(u.days||[]).length]:['Last active',esc(ago(o.last))],['XP last 7 days',xp7(u)],['Streak','🔥 '+streak(u)],['Weakest',w?esc(w.label)+' · '+w.pct+'%':esc(wk||'–')]]
    .concat(o.self&&typeof dashStats==='function'?dashStats().map(x=>[esc(x[1]),esc(x[0])]):[]);
  const risk=o.risk?`<p class="psrisk ${o.risk.length?'bad':'ok'}">${o.risk.length?'⚠️ At risk: '+esc(o.risk.join(' · ')):'✓ No risk signs'}</p>`:'';
  return `<div class="psum" id="psum">${tiles.map(t=>`<div><span>${t[0]}</span><b>${t[1]}</b></div>`).join('')}</div>${risk}`}
function weakSecHTML(u){const w=((u.wk||{}).t)||{},ks=Object.keys(w).filter(k=>w[k][1]>0).sort((a,b)=>w[b][1]/Math.max(1,w[b][0])-w[a][1]/Math.max(1,w[a][0])).slice(0,6),{dec,miss}=decoyStats(u);
  return (ks.length?`<ol class="sumlist">${ks.map(k=>`<li>${esc(tkLabel(k))} <span class="tag">${w[k][1]} pts over ${w[k][0]} tries</span></li>`).join('')}</ol>`:'<p class="muted">None recorded yet.</p>')
  +`<h3>Decoys picked (${dec.length})</h3>${dec.length?`<ul class="sumlist">${dec.slice(0,8).map(d=>`<li><b>${esc(d.t)}</b><div class="muted" style="font-size:.8rem">${esc(d.where)}${d.why?' · '+esc(d.why):''}</div></li>`).join('')}</ul>`:'<p class="muted">None.</p>'}
  <h3>Key ideas missed in plans (${miss.length})</h3>${miss.length?`<ul class="sumlist">${miss.slice(0,8).map(d=>`<li>${esc(d.t)}<div class="muted" style="font-size:.8rem">${esc(d.where)}</div></li>`).join('')}</ul>`:'<p class="muted">None.</p>'}`}
const badgeListHTML=u=>`<div>${BADGES.map(b=>u.badges[b.id]?`<span class="bsm got" title="${esc(b.d)}">${b.ico} ${esc(b.name)} <span class="muted">${esc(u.badges[b.id])}</span></span>`:'').join('')}</div>
  <details style="margin-top:8px"><summary class="muted" style="cursor:pointer">Not yet earned (${BADGES.filter(b=>!u.badges[b.id]).length})</summary>${BADGES.filter(b=>!u.badges[b.id]).map(b=>`<span class="bsm no" title="${esc(b.d)}">${b.ico} ${esc(b.name)}</span>`).join('')}</details>`;
function profSections(u,ctx){u=Object.assign({log:{},days:[],badges:{},n:{}},u);ctx=ctx||{};const C=typeof profCourse==='function'?profCourse(u,ctx):{},days=u.days||[],R=readiness(u),got=Object.keys(u.badges).length;
  const avg=R.length?Math.round(R.reduce((t,a)=>t+a.pct,0)/R.length):0,lo=R.slice().sort((a,b)=>a.pct-b.pct)[0],W=((u.wk||{}).t)||{},wk=Object.keys(W).filter(k=>W[k][1]>0).length,wo=weakOf(u)[0];
  const last=days.slice().sort().pop(),S=[
  {id:'cd',ico:'⏳',t:'Countdown to 14 Dec',sum:`${cdLeft()} days left · ${days.length} day${days.length===1?'':'s'} practised`,html:countdownHTML(u,1)}];
  if(R.length)S.push({id:'ready',ico:'📈',t:'Readiness',sum:`Overall ${avg}%${lo?' · weakest: '+esc(lo.label):''}`,html:readyHTML(u,6,1)});
  S.push({id:'weak',ico:'🩹',t:'Weak spots',sum:wk?esc(wo||'')+(wk>1?` and ${wk-1} more`:''):'None yet',html:weakSecHTML(u)});
  (C.secs||[]).forEach(s=>S.push(s));
  S.push({id:'act',ico:'📅',t:'Activity',sum:last?`Last practised ${esc(last)} · ${days.length} day${days.length===1?'':'s'} in all`:'Not started yet',
    html:`${heatHTML(days)}<div class="stats" style="grid-template-columns:repeat(3,1fr)">${(C.stats||[]).map(x=>`<div class="stat"><b>${x[0]}</b><span>${esc(x[1])}</span></div>`).join('')}</div><h3 style="margin-top:14px">Recent activity</h3>${recentHTML(u)}`});
  S.push({id:'screen',ico:'⏱️',t:'Screen time & live sessions',sum:`${stFmt(stToday(u))} today · ${stFmt(stWeek(u))} this week`,html:ctx.self?stCardHTML()+presProfileHTML(u,ctx.sid,2):presProfileHTML(u,ctx.sid,1)});
  S.push({id:'badges',ico:'🏅',t:'Badges',sum:`${got}/${BADGES.length} earned`,html:badgeListHTML(u)+(C.badgesX||'')});
  if(C.cases)S.push(Object.assign({id:'cases',ico:'📚',t:'Cases'},C.cases));
  return S}
function secsHTML(S,open){return S.map(s=>`<details class="card psec sec" data-sec="${s.id}" id="sec-${s.id}"${open.has(s.id)?' open':''}><summary><span class="sech"><b class="lex">${s.ico||''} ${esc(s.t)}</b><span class="muted secs">${s.sum||''}</span></span></summary><div class="secb">${s.html}</div></details>`).join('')}
function secsBind(el,open){el.querySelectorAll('details[data-sec]').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)open.add(d.dataset.sec);else open.delete(d.dataset.sec)}))}
/* lecturer-only: integrity flags */
function integSecHTML(u,open){const ig=u.integ||{},n=Object.values(ig).reduce((t,v)=>t+(v|0),0);
  return secsHTML([{id:'integ',ico:'🛡️',t:'Integrity',sum:n?n+' flag'+(n===1?'':'s'):'No flags',html:`<p style="font-size:.9rem;margin:0">${Object.keys(ig).length?Object.entries(ig).map(([k,v])=>`${esc({paste:'Pastes blocked',bigKept:'Large inserts kept (often voice typing)',big:'Big insertions removed (older rule)',fast:'Answers too fast'}[k]||k)}: <b>${v|0}</b>`).join(' · '):'No integrity flags.'}</p>
  <p class="muted" style="font-size:.8rem">Flags are signals, not proof. Large inserts are usually voice typing; open an answer to see each flag's snippet.</p>`}],open)}
const PG_OPEN=new Set();
ROUTES.progress=h=>{if(ME.sid===LECTURER){shell('#/progress',`<h1>My progress</h1><div class="card"><p style="margin:0">Students see their progress here: the same sections you see on their profile, without the integrity flags, typed-answer marking or your messages.</p></div><div id="lhvap">${vaCardHTML()}</div>`);vaCardInit();return}
  if(h[1])PG_OPEN.add(h[1]);
  shell('#/progress',`<h1>My progress</h1><p class="muted" style="margin-top:-4px">Everything you have done so far. Tap a section to open it.</p>${profSumHTML(U,{self:1})}<div id="pgb"></div>`);
  const draw=()=>{const el=$('#pgb');if(!el)return;const marked=Object.keys(U.ans||{}).filter(k=>(U.rev||{})[k]).length;el.innerHTML=secsHTML(profSections(U,{sid:ME.sid,self:1,marked}),PG_OPEN);secsBind(el,PG_OPEN)};
  draw();if(h[1]){const d=document.getElementById('sec-'+h[1]);if(d)setTimeout(()=>d.scrollIntoView({block:'start'}),30)}
  presProfileWatch(draw)};

/* ---------- More menu, and the phone tab bar (remove with CRS.tabbar=false) ---------- */
function moreMenu(){const st=ME&&ME.sid!==LECTURER,N=NAV.map(n=>n[0]);
  const items=[['#/avatar','🧑‍🎨','My profile'],st&&['#/progress','📈','My progress'],st&&['#/badges','🏅','Badges'],N.includes('#/notes')&&['#/notes','📖','Study notes'],st&&['#/cards','🃏','Flashcards'],st&&['#/review','🧠','Review'],
    typeof ppLine==='function'&&['#/paper','📝','Practice paper'],st&&['#/backup','💾','Save my progress'],['help','❔','How it works'],['#/whatsnew','✨',"What's new"],['inst','📲','Install the app'],['#/privacy','🔒','Privacy'],['so','🚪','Sign out']].filter(Boolean);
  const m=modal('More',`<h2 style="margin:0 0 10px">More</h2><div class="morelist">${items.map(x=>x[0][0]==='#'?`<a href="${x[0]}" data-mi="1"><span>${x[1]}</span>${x[2]}</a>`:`<button type="button" data-mi="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join('')}</div>`);
  m.querySelectorAll('[data-mi]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.mi;closeModal();if(k==='help')tour(0);else if(k==='inst')installPop(0);else if(k==='so')signOut()}))}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-more]');if(b&&ME){e.preventDefault();moreMenu()}});
function tabbarHTML(active){const on=CRS.tabbar!==false&&!!ME;document.body.classList.toggle('tb',on);if(!on)return '';const L=ME.sid===LECTURER,a=active||'#/';
  const prac=!['#/','#/progress','#/board','#/badges','#/lecturer','#/privacy','#/backup'].includes(a);
  const it=[['#/','🏠','Home',a==='#/'],['#/practice','🎯','Practice',prac],L?['#/lecturer','🧑‍🏫','Lecturer',a==='#/lecturer']:['#/progress','📈','Progress',a==='#/progress'],['#/board','🏆','Leaderboard',a==='#/board']];
  return `<nav class="tabbar" aria-label="Main">${it.map(x=>`<a href="${x[0]}"${x[3]?' class="on" aria-current="page"':''}${x[0]==='#/lecturer'?' data-lect':''}><span>${x[1]}</span>${x[2]}</a>`).join('')}<button type="button" data-more="1" aria-haspopup="dialog"><span>☰</span>More</button></nav>`}

/* ---------- lecturer: View as student (read-only) ---------- */
const vaInner=()=>`<h2 style="margin:0 0 6px">👁 View as student</h2><p class="muted" style="font-size:.88rem;margin:0 0 8px">See the portal exactly as a student sees it: their home, progress, practice pages, paper, challenges and badges. Read-only: nothing is saved, and questions can't be answered.</p>
  <input type="search" id="vaq" placeholder="🔎 Name, ID or @username" aria-label="Find a student" autocomplete="off"><div id="vares" class="vares"><p class="muted">Loading the class…</p></div><div class="err" id="vaer"></div>`;
const vaCardHTML=()=>cloudOn()&&ME&&ME.sid===LECTURER?`<div class="card" id="vac" style="margin-top:12px" data-lect>${vaInner()}</div>`:'';
let VA_LIST=null;
async function vaCardInit(){if(!$('#vaq'))return;if(!VA_LIST){let list;try{list=await CLOUD.docs('users')}catch(e){const er=$('#vaer');if(er)er.textContent=CLOUD.say(e);return}
    VA_LIST=list.filter(x=>x.id!==LECTURER).map(x=>{let u={};try{u=JSON.parse(x.u)}catch(e){}return {id:x.id,n:u.dn||x.name||x.id,un:u.un||''}}).sort((a,b)=>a.n.toLowerCase()<b.n.toLowerCase()?-1:1)}
  const q=$('#vaq'),draw=()=>{const r=$('#vares');if(!r)return;const t=q.value.trim().toLowerCase(),L=VA_LIST.filter(x=>!t||x.n.toLowerCase().includes(t)||x.id.toLowerCase().includes(t)||x.un.toLowerCase().includes(t.replace(/^@?/,'@')));
    r.innerHTML=L.length?L.slice(0,8).map(x=>`<button type="button" class="vapick" data-va="${esc(x.id)}"><b>${esc(x.n)}</b> <span class="muted">${esc(x.id)}${x.un?' · '+esc(x.un):''}</span></button>`).join('')+(L.length>8?`<p class="muted" style="font-size:.82rem;margin:4px 0 0">${L.length-8} more: keep typing.</p>`:''):'<p class="muted">No student matches.</p>'};
  q.oninput=draw;draw()}
LCARDS.unshift({id:'vaclc',init:el=>{el.hidden=false;el.dataset.lect='';el.innerHTML=vaInner();vaCardInit()}});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-va]');if(b&&!VIEWAS)vaOpen(b.dataset.va)});
async function vaOpen(sid){if(!ME||ME.sid!==LECTURER||VIEWAS||!cloudOn())return;let x;
  try{x=await CLOUD.get('users/'+sid)}catch(e){toast('⚠️','Could not open '+sid,CLOUD.say(e));return}
  let u=null;try{u=x&&JSON.parse(x.u)}catch(e){}if(!u){toast('👁','Nothing to show yet',sid+' has no saved progress.');return}
  vaEnter({id:sid,name:u.dn||x.name||sid,u})}
function vaEnter(X){if(!ME||ME.sid!==LECTURER||VIEWAS)return;closeModal();
  VIEWAS={me:ME,u:U,sid:X.id,name:X.name,back:location.hash||'#/lecturer'};presOff();
  ME={sid:X.id,name:X.name,cloud:VIEWAS.me.cloud,va:1};U=Object.assign(blank(),JSON.parse(JSON.stringify(X.u)));U.n=Object.assign(blank().n,U.n);
  document.body.classList.add('va');document.body.insertAdjacentHTML('afterbegin',`<div class="vabar" id="vabar" role="status"><span>👁 Viewing as <b>${esc(X.name)}</b> (${esc(X.id)}) · read-only</span><button type="button" class="btn sm" id="vax">Exit</button></div>`);
  $('#vax').onclick=vaExit;hud();if(location.hash==='#/')route();else location.hash='#/'}
function vaExit(){if(!VIEWAS)return;const V=VIEWAS;closeModal();CLOUD.unwatch();ME=V.me;U=V.u;VIEWAS=null;document.body.classList.remove('va');const b=$('#vabar');if(b)b.remove();
  hud();presOn();presCloud();if(location.hash===V.back)route();else location.hash=V.back}
/* nothing a student would save or send gets through while viewing */
['push','flush','put','add','del','tx','saveReview','putPresence','startSession','endSession','reset'].forEach(k=>{const f=CLOUD[k];if(typeof f==='function')CLOUD[k]=(...a)=>VIEWAS?Promise.resolve(null):f(...a)});
let VA_SAID=0;const vaSay=()=>{if(Date.now()-VA_SAID<1500)return;VA_SAID=Date.now();toast('👁',"Read-only: you're viewing as a student.",'')};
const VA_OK='a[href],summary,nav,.tabbar,.vabar,.subnav,#tbtn,[data-more],[data-va-ok],.morelist,.modal .x,.avpill';
document.addEventListener('click',e=>{if(!VIEWAS)return;const t=e.target.closest&&e.target.closest('button,input,select,textarea,label,.chip,.mopt,[role="button"],[data-a],[contenteditable]');
  if(!t||t.closest(VA_OK))return;e.preventDefault();e.stopImmediatePropagation();vaSay()},true);
document.addEventListener('focusin',e=>{if(!VIEWAS)return;const t=e.target;if(/^(TEXTAREA|INPUT|SELECT)$/.test(t.tagName)&&!t.closest(VA_OK)){t.blur();vaSay()}},true);
document.addEventListener('keydown',e=>{if(VIEWAS&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!(e.target.closest&&e.target.closest('a[href],'+VA_OK))){e.preventDefault();e.stopImmediatePropagation()}},true);
