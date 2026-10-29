/* MKT Arena engine: the student's own dashboard (home), streak blocks, the countdown grid, spaced review with the confidence check,
   topic readiness, flashcards and MCQ item analysis. Course hooks (all optional, in course.js):
     readyAreas(u) → [{k, label, href, cov 0..1, acc 0..1|null}]   areas for readiness (k matches qArea)
     qArea(id) → area key for a question id                         (default: qIndex()[id].area)
     revItem(id) → {kind:'mcq', q, o:[...correct first], why, label} | null   (MCQs; written questions come from qIndex)
     flashDecks() → [{k, label, cards:[[front, back]]}]
     dashStats() → [[value, label, href]]                           extra tiles in the dashboard header
   New progress fields (additive): U.srs {id:{s,due,n}}, U.conf {area:[sure,sureRight,unsure,unsureRight]}, U.fc {id:{s,due}}, U.mi {id:[n,right,w1,w2,w3]}.
   All dates are GMT+5 (Maldives). */
const MV=5*3600e3,EXAM_AT=Date.parse('2026-12-14T09:00:00+05:00'),PAPER_AT=Date.parse('2026-11-22T00:00:00+05:00'),W14='2026-11-22',EXAM_DAY='2026-12-14';
const mvDay=t=>new Date((t==null?Date.now():t)+MV).toISOString().slice(0,10);
const dowOf=d=>new Date(d+'T12:00:00Z').getUTCDay();/* 0 Sunday … 6 Saturday */
const termWeek=d=>{const n=Math.floor((Date.parse(d+'T12:00:00Z')-Date.parse(W14+'T12:00:00Z'))/864e5/7);return 14+n};

/* ---------- streak blocks ---------- */
function streakBlocksHTML(u){u=u||U;const n=streak(u),F=u.frz||{},fz=F.d||{},days=new Set(u.days),t=today(),cells=[];
  let d=days.has(t)?t:addDays(t,-1);const run=[];while(days.has(d)||fz[d]){run.unshift(d);d=addDays(d,-1);if(run.length>60)break}
  const show=run.slice(-21);show.forEach(x=>cells.push(`<i class="sb ${fz[x]&&!days.has(x)?'fz':'on'}" title="${x}${fz[x]&&!days.has(x)?(fz[x]==='e'?' · earned back':' · ❄️ freeze used'):' · practised'}">${fz[x]&&!days.has(x)?'❄️':''}</i>`));
  if(!days.has(t))cells.push(`<i class="sb today" title="Today: practise to keep your streak"></i>`);
  return `<div class="sblocks" aria-label="${n} day streak"><div class="row" style="justify-content:space-between;gap:8px"><b class="lex">🔥 ${n} day${n===1?'':'s'} in a row</b><span class="tag" title="A banked freeze covers a missed day automatically">❄️ ${F.b|0}/${FRZ_MAX} freezes</span></div>
  <div class="sbrow">${run.length>show.length?`<span class="muted sbmore">+${run.length-show.length}</span>`:''}${cells.join('')||'<i class="sb today"></i>'}</div>
  <p class="muted" style="font-size:.78rem;margin:4px 0 0">${days.has(t)?'✓ Today counts.':'Practise today to add a block.'} Every 4 days in a row earns a ❄️ freeze (up to ${FRZ_MAX}).</p></div>`}

/* ---------- countdown and the day grid to 14 Dec 2026 ---------- */
function cdText(){const ms=EXAM_AT-Date.now();if(ms<=0)return 'Today';const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return `${d} day${d===1?'':'s'} · ${h} hour${h===1?'':'s'}`}
function countdownHTML(u){u=u||U;const days=new Set(u.days),fz=(u.frz||{}).d||{},t=mvDay(),first=[...u.days].sort()[0]||t;
  let st=[first,addDays(t,-27)].sort()[0];st=addDays(st,-dowOf(st));if(st<'2026-08-23')st='2026-08-23';
  const rows=[];for(let w=st;w<=EXAM_DAY;w=addDays(w,7)){const cells=[];for(let i=0;i<7;i++){const d=addDays(w,i),we=i===5||i===6,cls=[days.has(d)?'on':fz[d]?'fz':'',d===t?'today':'',we?'we':'',d<t&&!days.has(d)&&!fz[d]?'miss':'',d>EXAM_DAY?'out':''];
      const mark=d===EXAM_DAY?'🎯':d===W14?'📝':fz[d]&&!days.has(d)?'❄️':'';
      cells.push(`<i class="${cls.filter(Boolean).join(' ')}" title="${d}${d===EXAM_DAY?' · 9:00 am':''}${d===W14?' · week 14 starts, practice paper unlocks':''}${days.has(d)?' · practised':''}${we?' · weekend':''}">${mark}</i>`)}
    const wk=termWeek(w);rows.push(`<div class="cdrow${wk===14?' w14':''}"><span class="cdw">${wk>=1&&wk<=16?'Wk '+wk:''}</span>${cells.join('')}</div>`)}
  const left=Math.max(0,Math.ceil((Date.parse(EXAM_DAY+'T00:00:00+05:00')-Date.parse(t+'T00:00:00+05:00'))/864e5)),done=[...days].filter(d=>d>=st&&d<=t).length;
  return `<div class="card cdcard" id="cdcard"><h2 style="margin:0">⏳ Mon 14 Dec 2026 · 9:00 am</h2><p class="lex cdnum" id="cdnum" aria-live="off">${cdText()}</p>
  <div class="cdgrid" role="img" aria-label="Days from ${st} to 14 December 2026: ${done} practised so far, ${left} days to go"><div class="cdrow cdh"><span class="cdw"></span>${['S','M','T','W','T','F','S'].map(x=>`<b>${x}</b>`).join('')}</div>${rows.join('')}</div>
  <p class="muted cdkey"><span><i class="k on"></i>practised</span><span><i class="k today"></i>today</span><span><i class="k we"></i>weekend</span><span>📝 week 14: practice paper</span><span>🎯 14 Dec</span></p>${typeof ppLine==='function'?`<a class="btn ghost sm" href="#/paper" id="pplink">📝 Practice paper: ${esc(ppLine())}</a>`:''}</div>`}
setInterval(()=>{const e=document.getElementById('cdnum');if(e)e.textContent=cdText()},30000);

/* ---------- spaced review (1, 3, 7 and 14 days) and the confidence check ---------- */
const SRS_GAP=[1,3,7,14];
const qAreaOf=id=>typeof qArea==='function'?qArea(id):((qIndex()[id]||{}).area||'');
function srsAdd(id,wrong){U.srs=U.srs||{};const s=U.srs[id];if(s&&!wrong&&s.s<SRS_GAP.length)return;
  U.srs[id]={s:0,due:addDays(today(),SRS_GAP[0]),n:(s&&s.n)|0}}
function srsDue(u){u=u||U;const t=today();return Object.entries(u.srs||{}).filter(([id,s])=>s.due&&s.due<=t&&revOf(id)).sort((a,b)=>a[1].due<b[1].due?-1:1).map(([id])=>id)}
function srsDone(id,ok){const s=U.srs[id]||{s:0,n:0},due=s.due||today();award('rev:'+id+':'+due,ok?4:2,'Review done',1);countOnce('rev:'+id+':'+due,'reviews');
  s.n=(s.n|0)+1;if(ok){s.s++;s.due=s.s<SRS_GAP.length?addDays(today(),SRS_GAP[s.s]):null}else{s.s=0;s.due=addDays(today(),1)}U.srs[id]=s}
function confNote(id,sure,ok){U.conf=U.conf||{};const a=qAreaOf(id)||'_',r=U.conf[a]||(U.conf[a]=[0,0,0,0]);if(sure){r[0]++;if(ok)r[1]++}else{r[2]++;if(ok)r[3]++}}
/* written questions: the question and its key ideas (good chips) */
function revOf(id){if(typeof revItem==='function'){const r=revItem(id);if(r)return r}const e=qIndex()[id];if(!e||!e.q)return null;
  const ideas=(e.q.chips||[]).filter(c=>c.g).map(c=>c.t);return ideas.length?{kind:'plan',q:e.q.q,ideas,label:e.label}:null}
/* award keys plan:<id>:… mean a plan was built: schedule its first review */
onHook('award',key=>{const m=/^plan:([^:]+):/.exec(key);if(m&&U&&ME&&ME.sid!==LECTURER)srsAdd(m[1])});
ROUTES.review=()=>{const due=srsDue(),all=Object.keys(U.srs||{}).length,next=Object.values(U.srs||{}).map(s=>s.due).filter(d=>d&&d>today()).sort()[0];
  if(!due.length){shell('#/',`<p><a href="#/">← Home</a></p><h1>Review</h1><div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:2.6rem">✅</div><h2>Nothing to review today</h2>
    <p class="muted">${all?`${all} question${all===1?'':'s'} in your review queue. Next one is due ${esc(next||'soon')}.`:'Questions you practise come back for a quick review after 1, 3, 7 and 14 days. That is how they stick.'}</p><a class="btn" href="#/cards">🃏 Flashcards</a> <a class="btn ghost" href="#/">Home</a></div>`);return}
  let i=0,right=0;const one=()=>{if(i>=due.length){save();hud();shell('#/',`<p><a href="#/">← Home</a></p><div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:2.6rem">🧠</div><h2>Review done</h2><p>${right} of ${due.length} remembered. Missed ones come back tomorrow.</p><a class="btn" href="#/">Home</a> <a class="btn ghost" href="#/cards">🃏 Flashcards</a></div>`);return}
    const id=due[i],r=revOf(id);let sure=null,done=false;
    shell('#/',`<p><a href="#/">← Home</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0">Review</h1><span class="tag">${i+1} of ${due.length}</span></div>
    <div class="card qcard" id="rvc" style="margin-top:12px"><div class="qmeta"><span class="tag">${esc(r.label||'')}</span>${typeof rptBtn==='function'?rptBtn(id,r.label||id):''}</div><h2 style="font-weight:600">${esc(r.q)}</h2>
    <div id="rvconf"><p class="muted" style="margin:6px 0">${r.kind==='mcq'?'Before you answer:':'Recall your plan in your head first.'} How sure are you?</p><div class="row"><button class="btn ghost" data-sure="1">😎 Sure</button><button class="btn ghost" data-sure="0">🤔 Unsure</button></div></div>
    <div id="rvbody" class="hide"></div></div>`);
    const body=$('#rvbody'),fin=ok=>{if(done)return;done=true;if(ok)right++;confNote(id,sure,ok);srsDone(id,ok);save();
      body.insertAdjacentHTML('beforeend',`<div class="row" style="margin-top:12px"><button class="btn" id="rvnx">${i+1<due.length?'Next →':'Finish'}</button></div>`);$('#rvnx').onclick=()=>{i++;one()};$('#rvnx').focus()};
    document.querySelectorAll('[data-sure]').forEach(b=>b.onclick=()=>{sure=b.dataset.sure==='1';$('#rvconf').innerHTML=`<p class="muted" style="margin:6px 0">You said: <b>${sure?'😎 Sure':'🤔 Unsure'}</b></p>`;body.classList.remove('hide');
      if(r.kind==='mcq'){const ord=shuffle(r.o.map((x,j)=>j));body.innerHTML=`<div class="mopts">${ord.map(j=>`<button class="mopt" data-oi="${j}">${esc(r.o[j])}</button>`).join('')}</div><div id="rvwhy"></div>`;
        body.querySelectorAll('[data-oi]').forEach(b=>b.onclick=()=>{if(done)return;const ok=+b.dataset.oi===0;body.querySelectorAll('[data-oi]').forEach(x=>{x.disabled=true;if(+x.dataset.oi===0)x.classList.add('ok');else if(x===b)x.classList.add('bad')});
          $('#rvwhy').innerHTML=`<div class="fb ${ok?'ok':'bad'}" style="margin-top:10px">${ok?'✓ Correct.':'✗ Not quite.'} ${esc(r.why||'')}${sure&&!ok?'<br><b>You were sure, so this one is worth a second look.</b>':''}</div>`;fin(ok)})}
      else{body.innerHTML=`<button class="btn ghost" id="rvshow">Show the key ideas</button>`;$('#rvshow').onclick=()=>{body.innerHTML=`<h3 style="margin:10px 0 6px">Key ideas</h3><ul class="sumlist">${r.ideas.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
        <p class="muted" style="margin:8px 0">Did your plan have most of these?</p><div class="row"><button class="btn" data-got="1">✓ I had most of them</button><button class="btn ghost" data-got="0">✗ Not yet</button></div>`;
        body.querySelectorAll('[data-got]').forEach(b=>b.onclick=()=>{body.querySelectorAll('[data-got]').forEach(x=>x.disabled=true);fin(b.dataset.got==='1')})}}})};
  one()};

/* ---------- readiness ---------- */
function readiness(u){u=u||U;if(typeof readyAreas!=='function')return [];const C=u.conf||{};
  return readyAreas(u).map(a=>{const c=C[a.k]||[0,0,0,0],sureWrong=c[0]-c[1],cal=c[0]+c[2]?(c[1]+c[3]*.5)/(c[0]+c[2]):null;
    const parts=[[a.cov,.55],[a.acc,.3],[cal,.15]].filter(p=>p[0]!=null),w=parts.reduce((t,p)=>t+p[1],0);
    return Object.assign({},a,{pct:Math.round(parts.reduce((t,p)=>t+p[0]*p[1],0)/(w||1)*100*(a.cov==null?1:Math.min(1,.4+a.cov))),sureWrong})}).map(a=>Object.assign(a,{pct:Math.max(0,Math.min(100,a.pct))}))}
function readyHTML(u,limit){const R=readiness(u).sort((a,b)=>a.pct-b.pct);if(!R.length)return '';const avg=Math.round(R.reduce((t,a)=>t+a.pct,0)/R.length);
  const row=a=>`<a class="rdrow" href="${a.href||'#/'}"><span class="rdl">${esc(a.label)}</span><span class="bar"><i style="width:${a.pct}%;background:${a.pct>=70?'var(--green)':a.pct>=40?'var(--gold)':'var(--pink)'}"></i></span><b>${a.pct}%</b>${a.sureWrong>=2?'<span class="tag" title="Answers you were sure about but got wrong">😬 '+a.sureWrong+'</span>':''}</a>`;
  const lim=limit||6;return `<div class="card" id="rdcard"><div class="row" style="justify-content:space-between"><h2 style="margin:0">📈 Readiness</h2><span class="tag">Overall ${avg}%</span></div>
  <p class="muted" style="font-size:.85rem;margin:6px 0 8px">How much you have practised each area, how well it went, and whether your confidence matched (😬 = sure but wrong). Weakest first.</p>
  ${R.slice(0,lim).map(row).join('')}${R.length>lim?`<details><summary class="click muted" style="font-size:.88rem;margin-top:6px">All ${R.length} areas</summary>${R.slice(lim).map(row).join('')}</details>`:''}</div>`}

/* ---------- next action, weak spots, profile header ---------- */
function weakHref(k){return k[0]===CRS.bPfx?(CRS.bHref||'#/short'):'#/case/'+k.split('|')[0]+'/practice'}
function nextAction(){if(typeof ppBusy==='function'&&ppBusy())return ['📝','Practice paper: '+ppLine(),'Your paper is waiting for you.','#/paper'];const due=srsDue();if(due.length)return ['🧠',`Review ${due.length} question${due.length===1?'':'s'}`,'Quick recall now makes it stick for later.','#/review'];
  rollDay();const m=missions().find(m=>(U.day.c[m.k]||0)<m.n);if(m&&!U.day.done)return ['🎯','Today’s mission: '+m.x,'Complete all three for the bonus XP.',(CRS.missionGo||{})[m.k]||'#/'];
  const R=readiness().sort((a,b)=>a.pct-b.pct)[0];if(R&&R.pct<70)return ['📈','Build up: '+R.label,'Your least practised area right now.',R.href||'#/'];
  const w=weakTopics()[0];if(w)return ['🩹','Fix a weak spot: '+tkLabel(w),'Practise it again to clear it.',weakHref(w)];
  return ['🃏','Flashcards','Five minutes of quick recall.','#/cards']}
function weakHTML(){const w=weakTopics().slice(0,3);return `<div class="card"><h2 style="margin:0 0 6px">🩹 Weak spots</h2>${w.length?w.map(k=>`<a class="rdrow" href="${weakHref(k)}"><span class="rdl">${esc(tkLabel(k))}</span><span class="btn ghost sm">Practise</span></a>`).join(''):'<p class="muted" style="margin:0">None yet. Plans with missed or wrong ideas show up here.</p>'}</div>`}
function dashHeadHTML(){const L=level(U.xp),got=Object.keys(U.badges).length,nm=U.dn||ME.name,nx=nextAction(),due=srsDue().length;
  return `<div class="card hero dash"><a class="dav" href="#/avatar" title="Edit my avatar" aria-label="Edit my avatar">${avatarSVG(myAv(),112,'My avatar')}<span class="tag">✏️ Edit</span></a>
  <div style="min-width:0"><h1 style="margin:0">${esc(nm)}</h1><p class="muted" style="margin:2px 0 0">${U.un?esc(U.un)+' · ':''}${esc(ME.sid)}${U.dg?' · '+esc(U.dg):''}</p>
  <div class="lvline"><b class="lex">Level ${L.i+1} · ${esc(L.name)}</b><span class="muted">${L.to?(L.to-U.xp)+' XP to '+esc(LEVELS[L.i+1][1]):'Top level reached'}</span></div><div class="bar"><i style="width:${L.pct}%"></i></div>
  <div class="stats"><div class="stat"><b>${U.xp}</b><span>XP</span></div><div class="stat"><b>🔥 ${streak(U)}</b><span>day streak</span></div><a class="stat" href="#/badges"><b>${got}/${BADGES.length}</b><span>badges</span></a><a class="stat" href="#/review"><b>🧠 ${due}</b><span>to review</span></a>${typeof dashStats==='function'?dashStats().map(x=>`<a class="stat" href="${x[2]||'#/'}"><b>${x[0]}</b><span>${esc(x[1])}</span></a>`).join(''):''}</div>
  ${streakBlocksHTML()}</div></div>
  <a class="card zone next" href="${nx[3]}" id="nextact"><span class="em">${nx[0]}</span><div style="flex:1;min-width:0"><span class="muted" style="font-size:.78rem;font-weight:700;letter-spacing:.04em">NEXT UP</span><h2 style="margin:2px 0">${esc(nx[1])}</h2><p class="muted" style="margin:0;font-size:.9rem">${esc(nx[2])}</p></div><span class="btn">Go →</span></a>`}
function badgesMiniHTML(){const got=BADGES.filter(b=>U.badges[b.id]).sort((a,b)=>U.badges[a.id]<U.badges[b.id]?1:-1).slice(0,4);
  return `<div class="card"><h2>Recent badges</h2>${got.length?`<div class="badges">${got.map(b=>`<div class="badge got"><div class="ico">${b.ico}</div><b>${b.name}</b></div>`).join('')}</div>`:'<p class="muted">None yet. Practise to earn your first.</p>'}<p style="margin:12px 0 0"><a href="#/badges">See all badges →</a></p></div>`}
/* the top of every student's home page */
function dashHTML(){if(!U)return '';if(ME.sid===LECTURER)return `<div class="card"><h1 style="margin:0">Welcome back, ${esc(String(ME.name).split(' ')[0])}</h1><p class="muted" style="margin:4px 0 0">Students see their own dashboard here. Your tools are on the <a href="#/lecturer">Lecturer</a> tab.</p></div>`;
  return `${dashHeadHTML()}<div class="grid g2" style="margin-top:16px">${countdownHTML()}<div>${readyHTML()}<div style="margin-top:16px">${weakHTML()}</div></div></div>
  ${typeof socialCardHTML==='function'?socialCardHTML():''}<div class="grid g2" style="margin-top:16px"><div class="card"><h2 style="margin:0 0 6px">📅 Activity</h2>${heatHTML(U.days)}<h3 style="margin:12px 0 4px">Recent activity</h3>${recentHTML(U)}</div>${badgesMiniHTML()}</div>`}

/* ---------- flashcards (#/cards) ---------- */
const fcId=(k,front)=>{let h=0;for(const c of k+'|'+front)h=(h*31+c.charCodeAt(0))>>>0;return k+'_'+h.toString(36)};
ROUTES.cards=h=>{const D=typeof flashDecks==='function'?flashDecks():[];U.fc=U.fc||{};
  if(!D.length){shell('#/',`<p><a href="#/">← Home</a></p><h1>Flashcards</h1><p class="muted">No flashcards for this course yet.</p>`);return}
  const dk=D.find(d=>d.k===h[1]);const dueIn=d=>d.cards.filter(c=>{const s=U.fc[fcId(d.k,c[0])];return !s||s.due&&s.due<=today()}).length;
  if(!dk){shell('#/',`<p><a href="#/">← Home</a></p><h1>Flashcards</h1><p class="muted">Flip a card, say the answer, then mark it. Cards you know come back after 1, 3, 7 and 14 days; the rest come back tomorrow.</p>
    <div class="grid g3">${D.map(d=>{const n=dueIn(d),known=d.cards.filter(c=>((U.fc[fcId(d.k,c[0])]||{}).s|0)>=SRS_GAP.length).length;return `<a class="card zone" href="#/cards/${esc(d.k)}"><div class="em">🃏</div><h3>${esc(d.label)}</h3><div class="chipline"><span class="tag">${d.cards.length} cards</span><span class="tag">${n} to study</span>${known?`<span class="tag">✓ ${known} learnt</span>`:''}</div></a>`}).join('')}</div>`);return}
  const q=shuffle(dk.cards.filter(c=>{const s=U.fc[fcId(dk.k,c[0])];return !s||s.due&&s.due<=today()})).slice(0,12);let i=0,got=0;
  const one=()=>{if(i>=q.length){save();hud();shell('#/',`<p><a href="#/cards">← All decks</a></p><div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:2.6rem">🃏</div><h2>${q.length?'Deck done':'All caught up'}</h2><p>${q.length?got+' of '+q.length+' known.':'Nothing due in this deck today. Come back tomorrow.'}</p><a class="btn" href="#/cards">All decks</a></div>`);return}
    const c=q[i],id=fcId(dk.k,c[0]);
    shell('#/',`<p><a href="#/cards">← All decks</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0">${esc(dk.label)}</h1><span class="tag">${i+1} of ${q.length}</span></div>
    <button class="card fcard" id="fcard" aria-live="polite"><span class="muted" style="font-size:.78rem">TAP TO FLIP</span><b class="lex">${esc(c[0])}</b></button><div class="row hide" id="fcr" style="justify-content:center;margin-top:12px"><button class="btn" data-k="1">✓ Knew it</button><button class="btn ghost" data-k="0">↺ Again</button></div>`);
    $('#fcard').onclick=()=>{$('#fcard').innerHTML=`<span class="muted" style="font-size:.78rem">${esc(c[0])}</span><span>${esc(c[1])}</span>`;$('#fcard').classList.add('flip');$('#fcr').classList.remove('hide')};
    document.querySelectorAll('#fcr [data-k]').forEach(b=>b.onclick=()=>{const ok=b.dataset.k==='1',s=U.fc[id]||{s:0};if(ok){got++;s.s=(s.s|0)+1;s.due=s.s<SRS_GAP.length?addDays(today(),SRS_GAP[s.s]):null}else{s.s=0;s.due=addDays(today(),1)}U.fc[id]=s;
      if(award('fc:'+id+':'+today(),1,'Flashcard',1))countOnce('fc:'+id+':'+today(),'cards');i++;one()})};
  one()};

/* ---------- MCQ item analysis (U.mi) ---------- */
function miNote(id,oi){U.mi=U.mi||{};const r=U.mi[id]||(U.mi[id]=[0,0,0,0,0]);r[0]++;if(oi===0)r[1]++;else if(oi>0&&oi<4)r[1+oi]++}
lcard('mic',el=>{if(typeof revItem!=='function'||typeof MCQ_BY==='undefined')return;el.hidden=false;
  el.innerHTML=`<h2 style="margin:0">MCQ item analysis</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">First tries of each day, from everyone's progress. Very easy (90%+) or very hard (under 30%) questions, and distractors that pull many students, are worth a look.</p><div id="mib"><button class="btn ghost" id="migo">Analyse</button></div>`;
  $('#migo').onclick=async()=>{$('#mib').innerHTML='<p class="muted">Reading progress…</p>';let docs=[];try{docs=await CLOUD.docs('users')}catch(e){$('#mib').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`;return}
    const A={};docs.filter(d=>d.id!==LECTURER).forEach(d=>{let u;try{u=JSON.parse(d.u)}catch(e){return}Object.entries(u.mi||{}).forEach(([id,r])=>{const a=A[id]||(A[id]=[0,0,0,0,0,0]);for(let j=0;j<5;j++)a[j]+=r[j]|0;a[5]++})});
    const rows=Object.entries(A).filter(([id])=>MCQ_BY[id]).map(([id,a])=>({id,q:MCQ_BY[id],n:a[0],p:a[0]?Math.round(a[1]/a[0]*100):0,w:a.slice(2,5),st:a[5]})).sort((x,y)=>x.p-y.p);
    if(!rows.length){$('#mib').innerHTML='<p class="muted">No MCQ answers recorded yet (recording started with this update).</p>';return}
    $('#mib').innerHTML=`<div class="tablewrap"><table><tr><th>Question</th><th>Tries</th><th>Correct</th><th>Most picked wrong answer</th></tr>${rows.map(r=>{const wi=r.w.indexOf(Math.max(...r.w)),wn=r.w[wi];
      return `<tr><td style="max-width:420px"><b>${esc(r.id)}</b> ${esc(r.q.q)}</td><td>${r.n} (${r.st} students)</td><td><b style="color:${r.p>=90?'var(--blue)':r.p<30?'var(--red)':'inherit'}">${r.p}%</b></td><td>${wn?esc(r.q.o[wi+1])+' · '+Math.round(wn/r.n*100)+'%':'–'}</td></tr>`}).join('')}</table></div>
      <button class="btn ghost sm" id="micsv" style="margin-top:8px">⬇ CSV</button>`;
    $('#micsv').onclick=()=>dl(CRS.id+'-mcq-items.csv',['id,topic,tries,students,correct_pct,wrong1,wrong2,wrong3'].concat(rows.map(r=>[r.id,r.q.t,r.n,r.st,r.p,...r.w].join(','))).join('\n'),'text/csv')}});

/* ---------- hints on practice plans: each 💡 shows the start of one key idea not picked yet (recorded in the plan as st.hint, U.hints; no XP change) ---------- */
function hintHTML(q,st){const good=q.chips.map((c,j)=>c.g?j:-1).filter(j=>j>=0),n=Math.min(st.hint|0,good.length-1),shown=(st.hints||[]).slice(0,n);
  const cue=t=>{const m=/^([^:]{2,40}):/.exec(t);return m?m[1]+'…':t.split(/\s+/).slice(0,4).join(' ')+'…'};
  return `<div class="hints" data-hintq="${esc(q.id)}">${shown.map(j=>`<p class="hint">💡 Think about: <b>${esc(cue(q.chips[j].t))}</b></p>`).join('')}${n<good.length-1?`<button type="button" class="btn ghost sm" data-hint="1">💡 ${n?'Another hint':'Hint'}</button>`:''}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-hint]');if(!b||!U)return;const box=b.closest('[data-hintq]'),id=box.dataset.hintq,q=(qIndex()[id]||{}).q,st=U.plansSaved&&U.plansSaved[id];if(!q||!st)return;
  const left=q.chips.map((c,j)=>c.g&&!st.sel.includes(j)&&!(st.hints||[]).includes(j)?j:-1).filter(j=>j>=0);if(!left.length){b.remove();return}
  st.hints=(st.hints||[]).concat(left[Math.floor(Math.random()*left.length)]);st.hint=st.hints.length;U.hints=(U.hints|0)+1;save();box.outerHTML=hintHTML(q,st)});
