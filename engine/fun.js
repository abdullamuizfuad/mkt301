/* MKT Arena engine: fun and tutors. Quick things (5–15 minutes) for top students and everyone else.
   - Boss rounds (#/boss): a 10-minute mini-case at the end of each topic's Expert set (course data BOSS, bank-boss.js). Pass with 70%+
     for "Boss beaten: Topic N"; all of them for "Boss of bosses". The lecturer approves each round (meta/expert b<topic>).
   - Story mode (#/story): a fictional start-up grows one chapter per topic (course data STORY). Released by the lecturer (meta/expert story).
   - Speed runs (#/speed): 20 mixed questions against the clock; score = right answers × 10 + seconds left × accuracy; personal best.
   - Hard mode (U.hard): no hints, no "Refer to notes", a shorter speed run, and double XP on correct answers (at most +60 extra a day).
   - Term cards (#/collection): a key term you have known on two flashcard reviews becomes a card; a full topic set gives a rare card.
   - Monday recap: a home card on Monday (and Tuesday until dismissed): last week's best day and badges, your weakest area, one task.
   - Class figures from meta/agg (written by the lecturer, engine/agg.js): the class goal, most improved last week and topic territories.
   - Streak duels (#/duels): a 7-day streak race with one classmate (challenges with mode 'streak').
   - Mentors: in a live session the lecturer pairs mentors with classmates (sessions/{id}.ment) and gives mentor bonuses.
   - Teach-back (#/teach) and Question writer (#/write): Expert-level students submit; the lecturer approves (subs/{id}).
   - The Tutor badge and Ask a tutor (#/help): tutors (Expert in enough topics and a high level) answer classmates' questions (help/{id}).
   New collections need the newest rules ("fun", probed by reading help/_probe); until then the parts that write stay hidden.
   Settings: CRS.fun = {boss, story, tutorLvl, tutorEx, goal (default class goal)}. XP keys: boss:, bosspass:, story:, speed:, spb:, hard:,
   goal:, imp:, duel:, tb:, qw:, helped:, bonus: (mentor bonuses arrive as marks, see applyMarks). */
const FUN={HARD_CAP:60,SP_N:20,SP_SECS:300,SP_HARD:240,BOSS_MIN:10,HELP_DAY:3,HELP_XP:10,HELP_CAP:50,DUEL_DAYS:7,DUEL_MAX:2,TB_XP:15,QW_XP:20};
const funCfg=()=>(typeof CRS!=='undefined'&&CRS.fun)||{};
let FUN_R=null;/* the newest rules are published (help, subs, streak duels, mentors, tutor rows) */
async function funOK(){if(FUN_R!=null)return FUN_R;if(!ME||!cloudOn()||!(await rulesOK()))return false;
  try{await CLOUD.get('help/_probe');FUN_R=true}catch(e){if(CLOUD.isNetwork&&CLOUD.isNetwork(e))return false;FUN_R=false}document.body.classList.toggle('rules4',FUN_R);return FUN_R}
onHook('signout',()=>{FUN_R=null;FU_AGG=null;document.body.classList.remove('rules4')});
const funMe=()=>!!(ME&&ME.sid!==LECTURER&&!VIEWAS);
const funU=()=>{U.fun=U.fun||{};return U.fun};
const funA=()=>typeof exA==='function'?exA():{};
/* the course's topics: [[topic, label]] */
const funTops=()=>typeof exTops==='function'&&exTops().length?exTops():(typeof actTopics==='function'?actTopics():[]);
const funTopLabel=t=>(funTops().find(([x])=>String(x)===String(t))||[t,'Topic '+t])[1];
const funWord=()=>typeof notesCfg==='function'&&typeof notesOK==='function'&&notesOK()?notesCfg().word:'Topic';
const funDayNo=()=>Math.floor((Date.now()+5*36e5)/864e5);
const funLink=s=>/(https?:|www\.|\.(com|net|org|mv|io|ly|me|co|app|link)(\/|\s|$))/i.test(String(s||''));

/* ---------- Expert level, tutors ---------- */
function funExTops(u){u=u||U;if(typeof exTops==='function'&&exTops().length)return exTops().map(([t])=>t).filter(t=>(u.badges||{})['ex'+t]);
  return level(u.xp|0).i>=(funCfg().tutorLvl|0)?funTops().map(([t])=>t):[]}
function isTutor(u){u=u||U;const c=funCfg();return !!c.tutorLvl&&level(u.xp|0).i>=c.tutorLvl&&funExTops(u).length>=(c.tutorEx|0)}
const tutorTops=u=>isTutor(u)?funExTops(u):[];
/* the leaderboard row carries the tutor's topics and how many classmates they helped (newest rules only) */
function funRow(r){if(FUN_R!==true||!U)return;r.tu=tutorTops(U).join(',').slice(0,40);r.hp=Math.min(999,funU().hp|0)}

/* ---------- hard mode ---------- */
const HARD_P=/^(mcq|mcqr|xmcq|chip|xchip|plan|rev|boss|story|fc|speed):/;
onHook('award',(key,xp)=>{if(!U||!U.hard||!xp||!key||!HARD_P.test(key)||VIEWAS)return;const d=today();U.hardd=U.hardd&&U.hardd.d===d?U.hardd:{d,x:0};
  const b=Math.min(xp,FUN.HARD_CAP-U.hardd.x);if(b<=0)return;U.hardd.x+=b;award('hard:'+key,b,'Hard mode ×2',1)});
function hardSync(){document.body.classList.toggle('hard',!!(U&&U.hard&&funMe()))}
onHook('leave',()=>{try{hardSync();funCredit()}catch(e){}});onHook('afterLoad',hardSync);
function hardToggleHTML(){return funMe()?`<div class="card hardc"><label class="row" style="justify-content:space-between;margin:0"><span><b>🔥 Hard mode</b><br><small class="muted">No hints, no "Refer to notes", a shorter speed run, and double XP on correct answers (up to +${FUN.HARD_CAP} extra a day).</small></span>
  <input type="checkbox" id="hardt"${U.hard?' checked':''} aria-label="Hard mode"></label></div>`:''}
function hardBind(){const h=$('#hardt');if(h)h.onchange=()=>{U.hard=h.checked;save();hardSync();toast('🔥',U.hard?'Hard mode on':'Hard mode off',U.hard?'Double XP on correct answers, no hints':'Hints and notes are back')}}

/* ---------- Boss rounds ---------- */
const BOSS_ON=()=>!!(funCfg().boss&&typeof BOSS!=='undefined'&&BOSS.sets);
const bossSet=t=>BOSS_ON()&&BOSS.sets[t]||null;
const bossOK=t=>!!funA()['b'+t];
const bossTops=()=>BOSS_ON()?Object.keys(BOSS.sets).map(Number):[];
const bossUnl=(u,t)=>typeof exSet==='function'&&exSet(t)?exStat(u,t).done:true;
const bossRec=t=>{U.boss=U.boss||{};return U.boss[t]||null};
function bossCardHTML(t){const S=bossSet(t);if(!S)return '';const L=ME&&ME.sid===LECTURER,R=(U&&U.boss||{})[t],st=L?'preview':!bossOK(t)?'soon':!bossUnl(U,t)?'locked':R&&R.sc!=null?'done':'open';
  const tag={preview:'<span class="tag" data-lect>'+(bossOK(t)?'Approved':'Not approved yet')+'</span>',soon:'<span class="tag">Coming soon</span>',locked:'<span class="tag">🔒 Locked</span>',open:'<span class="tag good">⚔️ Ready</span>',done:`<span class="tag${R&&R.pass?' good':''}">${R&&R.pass?'🏆 Beaten':'Tried'} · ${R?R.sc:0}%</span>`}[st];
  return `<div class="card bossc" data-boss="${t}" data-st="${st}"><div class="row" style="justify-content:space-between"><h3 style="margin:0">👹 Boss round · ${esc(funTopLabel(t))}</h3>${tag}</div>
  <p class="muted" style="font-size:.86rem;margin:6px 0"><b>${esc(S.title)}</b> · ${FUN.BOSS_MIN} minutes · ${S.mcq.length} decisions + a paragraph · pass with 70%</p>
  ${st==='locked'?`<p class="exlock">🔒 Finish the ${esc(funTopLabel(t))} Expert set to unlock.</p>`:st==='soon'?'<p class="muted" style="font-size:.85rem;margin:0">Your lecturer releases Boss rounds soon.</p>':`<a class="btn sm" href="#/boss/${t}">${st==='preview'?'Preview':st==='done'?'See result':'Fight the boss'} →</a>`}</div>`}
ROUTES.boss=h=>{if(!BOSS_ON())return shell('#/practice','<h1>Boss rounds</h1><p class="muted">No Boss rounds for this course yet.</p>');const t=h[1];
  if(!t||!bossSet(t))return shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>👹 Boss rounds</h1><p class="muted">A ${FUN.BOSS_MIN}-minute mini-case at the end of each topic's Expert set: read a short business problem, make ${3} decisions and build one paragraph. Everything is marked straight away. Pass with 70% or more for the <b>Boss beaten</b> badge.</p><div class="grid g2">${bossTops().map(bossCardHTML).join('')}</div>`);
  const L=ME.sid===LECTURER,tut=typeof tutOn==='function'&&tutOn()&&PR.sess.act.k==='boss'&&(PR.sess.act.topics||[]).map(String).includes(String(t));if(!L&&!tut&&(!bossOK(t)||!bossUnl(U,t)))return shell('#/practice',`<p><a href="#/boss">← Boss rounds</a></p>${bossCardHTML(t)}`);bossRun(t)};
function bossRun(t){const S=bossSet(t),L=ME.sid===LECTURER;U.boss=U.boss||{};let R=U.boss[t];
  const intro=()=>shell('#/practice',`<p><a href="#/boss">← Boss rounds</a></p><h1 style="margin:0 0 6px;font-size:1.3rem">👹 ${esc(S.title)}</h1>${L?'<p class="muted" data-lect>Preview: nothing here earns XP.</p>':''}
    <div class="card"><p style="margin:0">${esc(S.scen)}</p></div><p class="muted" style="font-size:.9rem">You have <b>${FUN.BOSS_MIN} minutes</b> for ${S.mcq.length} decisions and one paragraph. The clock keeps running if you leave the page. ${R&&R.sc!=null?'This try is practice: your first score stays.':''}</p>
    <button class="btn gold" id="bgo">⚔️ Start the ${FUN.BOSS_MIN}-minute round</button>`);
  if(!R||R.sc!=null&&!R.st){if(R&&R.sc!=null&&!R.again)return bossResult(t);intro();$('#bgo').onclick=()=>{R=U.boss[t]=Object.assign(R||{},{st:Date.now(),a:{},c:null,again:false});save();bossPlay(t)};return}
  bossPlay(t)}
function bossLeft(R){return Math.max(0,R.st+FUN.BOSS_MIN*60e3-Date.now())}
function bossPlay(t){const S=bossSet(t),R=U.boss[t];if(!R||!R.st)return bossRun(t);if(bossLeft(R)<=0)return bossEnd(t);
  shell('#/practice',`<p><a href="#/boss">← Boss rounds</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0;font-size:1.2rem">👹 ${esc(S.title)}</h1><b class="lex" id="btm"></b></div>
  <details class="card" style="margin-top:10px" open><summary><b>The case</b></summary><p style="margin:8px 0 0">${esc(S.scen)}</p></details>
  ${S.mcq.map((q,k)=>{const ord=qmix(seeded((ME.sid||'')+'|'+q.id),q.o.map((_,j)=>j));return `<div class="card qcard" style="margin-top:12px"><span class="tag">Decision ${k+1}</span><h2 style="font-weight:600;margin:8px 0">${esc(q.q)}</h2>
    <div class="mopts" data-bq="${esc(q.id)}">${ord.map(j=>`<button type="button" class="mopt${R.a[q.id]===j?' sel':''}" data-o="${j}" aria-pressed="${R.a[q.id]===j}">${esc(q.o[j])}</button>`).join('')}</div></div>`}).join('')}
  <div class="card qcard" id="bch" style="margin-top:12px"></div><div class="row" style="margin-top:12px"><button class="btn gold" id="bsub">Submit my round</button></div>`);
  document.querySelectorAll('[data-bq]').forEach(box=>box.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{R.a[box.dataset.bq]=+b.dataset.o;save();
    box.querySelectorAll('[data-o]').forEach(x=>{const on=x===b;x.classList.toggle('sel',on);x.setAttribute('aria-pressed',on)})}));
  if(R.c==null)chipsUI($('#bch'),S.chip,{seed:(ME.sid||'')+'|'+S.chip.id,btn:'Lock in my paragraph',fb:false,onDone:(sel,r)=>{R.c=r.max?r.s/r.max:0;save()}});
  else $('#bch').innerHTML=`<p class="muted" style="margin:0">✓ Paragraph locked in.</p>`;
  $('#bsub').onclick=()=>{if(S.mcq.some(q=>!(q.id in R.a))&&!confirm('Some decisions are still empty. Submit anyway?'))return;bossEnd(t)};
  const tm=setInterval(()=>{const e=$('#btm');if(!e)return clearInterval(tm);const l=bossLeft(R);if(l<=0){clearInterval(tm);toast('⏰','Time is up','Your round was submitted');return bossEnd(t)}
    e.textContent='⏱ '+Math.floor(l/60000)+':'+String(Math.floor(l/1000)%60).padStart(2,'0');e.classList.toggle('warn',l<60e3)},500)}
function bossEnd(t){const S=bossSet(t),R=U.boss[t];if(!R||!R.st)return bossRun(t);const first=R.sc==null;let right=0;
  S.mcq.forEach(q=>{const ok=R.a[q.id]===0;if(ok)right++;ansLog(q.id,ok?1:0,R.a[q.id]);if(first&&ok)award('boss:'+t+':'+q.id,5,'Boss decision',1)});
  const c=+R.c||0;ansLog(S.chip.id,c,'');const sc=Math.round((right+c)/(S.mcq.length+1)*100);
  if(first){if(c)award('boss:'+t+':c',Math.round(10*c),'Boss paragraph',1);R.sc=sc;R.pass=sc>=70;R.at=today();if(R.pass)award('bosspass:'+t,20,'Boss beaten: '+funTopLabel(t))}
  R.last=sc;R.n=(R.n|0)+1;R.st=0;R.again=false;checkBadges();save();hud();bossResult(t)}
function bossResult(t){const S=bossSet(t),R=U.boss[t];
  shell('#/practice',`<p><a href="#/boss">← Boss rounds</a></p><div class="card" style="text-align:center"><div style="font-size:2.4rem">${R.pass?'🏆':'👹'}</div><h1 style="margin:4px 0">${R.pass?'Boss beaten!':'The boss won this time'}</h1>
   <p>Your score: <b>${R.sc}%</b>${R.last!=null&&R.last!==R.sc?' · last practice try: '+R.last+'%':''}</p><p class="muted" style="font-size:.9rem">${R.pass?'Badge earned: Boss beaten, '+esc(funTopLabel(t))+'.':'Pass with 70%. Look at the answers below, then try again for practice.'}</p></div>
  ${S.mcq.map((q,k)=>`<div class="card" style="margin-top:10px"><b>Decision ${k+1}.</b> ${esc(q.q)}<div class="fb ${R.a[q.id]===0?'ok':'no'}" style="margin-top:6px">${R.a[q.id]===0?'✓ You chose well.':'✗ Best answer: '+esc(q.o[0])}<div class="muted" style="margin-top:4px">${esc(q.why)}</div></div></div>`).join('')}
  <div class="card" style="margin-top:10px"><b>A strong paragraph:</b> ${esc(chipPara(S.chip,S.chip.paths[0]))}</div>
  <div class="row" style="margin-top:12px"><button class="btn ghost" id="bagain">Try again (practice)</button>${typeof notesBtn==='function'?notesBtn({t,week:t},{topic:t}):''}</div>`);
  $('#bagain').onclick=()=>{R.again=true;R.st=0;R.a={};R.c=null;save();bossRun(t)}}

/* ---------- Story mode ---------- */
const STORY_ON=()=>!!(funCfg().story&&typeof STORY!=='undefined'&&STORY.ch);
const storyOK=()=>!!funA().story;
const storyTops=()=>STORY_ON()?Object.keys(STORY.ch).map(Number):[];
const storyOpen=(u,t)=>typeof expertProg==='function'?(expertProg(u,t).att|0)>=10:true;
function storyDone(u){const S=(u.story||{});return storyTops().length&&storyTops().every(t=>STORY.ch[t].q.every(q=>q.id in ((S[t]||{}).a||{})))}
ROUTES.story=h=>{if(!STORY_ON())return shell('#/practice','<h1>Story mode</h1><p class="muted">No story for this course yet.</p>');const L=ME.sid===LECTURER,t=h[1];
  if(!L&&!storyOK())return shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>📖 ${esc(STORY.title)}</h1><p class="muted">Coming soon: your lecturer releases story mode shortly.</p>`);
  if(!t||!STORY.ch[t]){const S=U.story||{};return shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>📖 ${esc(STORY.title)}</h1><p class="muted">${esc(STORY.intro)}</p>${L?'<p class="muted" data-lect>Preview: '+(storyOK()?'released to students.':'not released yet (Lecturer tab → Boss rounds and story).')+'</p>':''}
    <div class="ttiles">${storyTops().map((x,i)=>{const C=STORY.ch[x],open=L||storyOpen(U,x),dn=C.q.every(q=>q.id in (((S[x]||{}).a)||{}));
      return open?`<a class="card zone ttile" href="#/story/${x}" data-sch="${x}"><span class="em">${dn?'✅':'📘'}</span><span><b class="lex">Chapter ${i+1}: ${esc(C.title)}</b><small class="muted">${esc(funTopLabel(x))}</small></span></a>`
        :`<div class="card ttile" data-sch="${x}" data-st="locked"><span class="em">🔒</span><span><b class="lex">Chapter ${i+1}: ${esc(C.title)}</b><small class="muted">Answer 10 MCQs in ${esc(funTopLabel(x))} to open it</small></span></div>`}).join('')}</div>`)}
  if(!L&&!storyOpen(U,t))return location.hash='#/story';storyChapter(+t)};
function storyChapter(t){const C=STORY.ch[t],L=ME.sid===LECTURER;U.story=U.story||{};const R=U.story[t]=U.story[t]||{a:{}},i=storyTops().indexOf(t);
  shell('#/practice',`<p><a href="#/story">← ${esc(STORY.title)}</a></p><h1 style="margin:0 0 6px;font-size:1.3rem">Chapter ${i+1}: ${esc(C.title)}</h1><div class="card"><p style="margin:0">${esc(C.text)}</p></div>
  ${C.q.map(q=>{const ord=qmix(seeded((ME.sid||'')+'|'+q.id),q.o.map((_,j)=>j)),done=q.id in R.a;return `<div class="card qcard" style="margin-top:12px"><h2 style="font-weight:600;margin:0 0 8px">${esc(q.q)}</h2>
    <div class="mopts" data-sq="${esc(q.id)}">${ord.map(j=>`<button type="button" class="mopt${done&&j===0?' ok':''}${done&&R.a[q.id]===j&&j!==0?' bad':''}" data-o="${j}"${done?' disabled':''}>${esc(q.o[j])}</button>`).join('')}</div><div data-sf="${esc(q.id)}">${done?`<div class="fb ${R.a[q.id]===0?'ok':'no'}" style="margin-top:8px">${esc(q.why)}</div>`:''}</div></div>`}).join('')}
  <div class="row" style="margin-top:12px">${storyTops()[i+1]&&(L||storyOpen(U,storyTops()[i+1]))?`<a class="btn" href="#/story/${storyTops()[i+1]}">Next chapter →</a>`:'<a class="btn ghost" href="#/story">All chapters</a>'}</div>`);
  document.querySelectorAll('[data-sq]').forEach(box=>box.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const id=box.dataset.sq,q=C.q.find(x=>x.id===id),pick=+b.dataset.o,ok=pick===0;if(id in R.a)return;
    if(!L)R.a[id]=pick;ansLog(id,ok?1:0,pick);if(ok)award('story:'+id,5,'Story decision',1);
    box.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;const j=+x.dataset.o;if(j===0)x.classList.add('ok');else if(j===pick)x.classList.add('bad')});
    $(`[data-sf="${id}"]`).innerHTML=`<div class="fb ${ok?'ok':'no'}" style="margin-top:8px">${ok?'✓ Good call. ':'✗ Not the best call. '}${esc(q.why)}</div>`;checkBadges();save();hud()}))}

/* ---------- Speed runs ---------- */
ROUTES.speed=()=>{if(typeof quizItems!=='function')return shell('#/practice','<h1>Speed run</h1><p class="muted">Not available for this course.</p>');const L=ME.sid===LECTURER,P=U.sp||{},secs=U.hard?FUN.SP_HARD:FUN.SP_SECS;
  shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>⚡ Speed run</h1><p class="muted">${FUN.SP_N} mixed questions in ${secs/60} minutes${U.hard?' (hard mode)':''}. Score = right answers × 10, plus the seconds you have left × your accuracy. Your first run each day earns XP for every right answer; a new personal best earns +5.</p>
  <div class="card" id="spc"><div class="row" style="justify-content:space-between"><span>🏅 Personal best: <b>${P.best|0}</b></span><span class="muted">${P.runs|0} run${P.runs===1?'':'s'}</span></div><button class="btn gold" id="spgo" style="margin-top:10px">⚡ Start</button></div>${L?'<p class="muted" data-lect>Preview: nothing here earns XP.</p>':''}`);
  $('#spgo').onclick=()=>{const ids=quizItems(seeded((ME.sid||'')+'|sp|'+Date.now()),FUN.SP_N).map(x=>x.id);
    quizRun($('#spc'),ids,secs,r=>{const left=Math.max(0,secs*1000-r.ms)/1000,acc=r.n?r.s/r.n:0,score=r.s*10+Math.round(left*acc),P2=U.sp=U.sp||{best:0,runs:0};
      const pb=score>(P2.best|0);P2.runs=(P2.runs|0)+1;P2.last=score;if(pb)P2.best=score;if(r.s===r.n&&r.n>=FUN.SP_N)P2.perf=1;
      if(award('speed:'+today(),r.s,'Speed run',1))countOnce('speed:'+today(),'speed');if(pb&&r.s)award('spb:'+today(),5,'New personal best');checkBadges();save();hud();
      $('#spc').innerHTML=`<div style="text-align:center"><div style="font-size:2.2rem">${pb?'🏅':'⚡'}</div><h2 style="margin:4px 0">${score} points</h2><p>${r.s}/${r.n} right · ${Math.round(r.ms/1000)} s${pb?' · <b>new personal best!</b>':''}</p><button class="btn" onclick="ROUTES.speed()">Run again</button></div>`},'sp|'+(ME.sid||'')+'|'+Date.now())}};

/* ---------- Term cards ---------- */
const cardKnown=(u,k,front)=>(((u.fc||{})[fcId(k,front)]||{}).s|0)>=2;
function cardStats(u){u=u||U;const D=typeof flashDecks==='function'?flashDecks():[];let got=0,all=0,full=0;D.forEach(d=>{const n=d.cards.filter(c=>cardKnown(u,d.k,c[0])).length;got+=n;all+=d.cards.length;if(n&&n===d.cards.length)full++});return {got,all,full,D}}
ROUTES.collection=()=>{const C=cardStats(U);shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🃏 Term cards</h1><p class="muted">A key term becomes a card once you have known it on two flashcard reviews. Collect a whole topic for its rare card. <b>${C.got}/${C.all}</b> collected.</p>
  ${C.D.map(d=>{const n=d.cards.filter(c=>cardKnown(U,d.k,c[0])).length,full=n&&n===d.cards.length;return `<h2 style="margin:18px 0 6px">${esc(d.label)} <span class="tag${full?' gold':''}">${full?'✨ Rare card':n+'/'+d.cards.length}</span></h2>
    <div class="tcards">${full?`<div class="tcard rare"><b>✨ ${esc(d.label)}</b><small>Complete set</small></div>`:''}${d.cards.map(c=>cardKnown(U,d.k,c[0])?`<div class="tcard got"><b>${esc(c[0])}</b><small>${esc(String(c[1]).slice(0,90))}</small></div>`:'<div class="tcard"><b>?</b><small>Not collected</small></div>').join('')}</div>`}).join('')}
  <p style="margin-top:14px"><a class="btn" href="#/cards">🃏 Study flashcards</a></p>`)};

/* ---------- Monday recap ---------- */
function recapHTML(){if(!funMe())return '';const t=today(),dw=dowOf(t);if(dw!==1&&dw!==2)return '';const wk=weekKey(t);if((U.recap||{})[wk])return '';
  const from=addDays(wk,-7),to=addDays(wk,-1),xd=Object.entries(U.xpd||{}).filter(([d])=>d>=from&&d<=to).sort((a,b)=>b[1]-a[1]),bd=xd[0];
  const bg=Object.entries(U.badges||{}).filter(([,d])=>d>=from&&d<=to).map(([id])=>(BADGES.find(b=>b.id===id)||{}).name).filter(Boolean);
  const R=typeof readiness==='function'?readiness(U).sort((a,b)=>a.pct-b.pct):[],w=R[0],nx=nextAction();
  const day=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'long'});
  return `<div class="card recap" id="recap"><div class="row" style="justify-content:space-between"><h2 style="margin:0;font-size:1.05rem">📬 Your week in review</h2><button class="btn ghost sm" id="recx" aria-label="Dismiss the recap">✕</button></div>
  <ul class="sumlist" style="margin:8px 0 0"><li>🌟 Best moment: ${bd?`<b>${esc(day(bd[0]))}</b> with +${bd[1]|0} XP`:'no practice last week. This week is a fresh start!'}${bg.length?` · ${bg.length} badge${bg.length===1?'':'s'}: ${esc(bg.slice(0,3).join(', '))}`:''}</li>
  <li>🎯 Work on: <b>${w?esc(w.label)+' ('+w.pct+'%)':'any topic you haven\'t practised yet'}</b></li><li>✅ One task: <a href="${nx[3]}">${esc(nx[1])}</a></li></ul></div>`}
function recapBind(){const x=$('#recx');if(x)x.onclick=()=>{U.recap=U.recap||{};U.recap[weekKey(today())]=1;save();const c=$('#recap');if(c)c.remove()}}

/* ---------- class figures: class goal, most improved, territories (meta/agg) ---------- */
let FU_AGG=null;
async function funAggLoad(force){if(!ME||!cloudOn())return null;if(FU_AGG&&!force&&Date.now()-FU_AGG._t<10*60e3)return FU_AGG;if(!(await rulesOK()))return null;
  try{FU_AGG=Object.assign((await CLOUD.get('meta/agg'))||{},{_t:Date.now()})}catch(e){FU_AGG=null}return FU_AGG}
const myWeekAnswers=wk=>{const from=Date.parse(wk+'T00:00:00+05:00')/1000;return (U.qa||[]).filter(x=>x[0]>=from).length};
function goalHTML(A){const G=A&&A.goal;if(!G||!G.target)return '';const pct=Math.min(100,Math.round(G.n/G.target*100));
  return `<div class="card goalc"><div class="row" style="justify-content:space-between"><b>🎯 Class goal this week</b><span class="tag${G.done?' good':''}">${G.done?'✓ Reached!':pct+'%'}</span></div>
  <p class="muted" style="font-size:.86rem;margin:4px 0 6px">${G.n|0} / ${G.target} answers by the whole class. When the class reaches it, everyone who answered at least one question this week gets +20 XP and the Class goal badge.</p><div class="bar"><i style="width:${pct}%"></i></div></div>`}
function impHTML(A){const I=A&&A.imp;if(!I||!(I.top||[]).length)return '';
  return `<div class="card impc"><b>📈 Most improved last week</b><ol class="sumlist" style="margin:6px 0 0">${I.top.map((r,i)=>`<li>${['🥇','🥈','🥉'][i]} ${esc(r.n||'A classmate')} <span class="muted">+${r.d} points of accuracy</span></li>`).join('')}</ol></div>`}
function terrHTML(A,full){const T=A&&A.terr||{},ts=Object.keys(T);if(!ts.length)return full?'<p class="muted">No territories yet: each team needs at least two students with 5+ answers in a topic.</p>':'';const my=(A.mem||{})[ME.sid];
  return `<div class="terr">${funTops().filter(([t])=>T[t]).map(([t,l])=>{const x=T[t];return `<div class="tt${x.own?' own':''}${x.own&&x.own===my?' mine':''}"><b>${esc(funWord())} ${esc(t)}</b><small>${x.own?'🚩 '+esc(x.own):'⚖️ Tied'}</small><small class="muted">${Object.entries(x.av).map(([g,v])=>esc(g)+' '+v+'%').join(' · ')}</small></div>`}).join('')}</div>${my?`<p class="muted" style="font-size:.85rem">Your team: <b>${esc(my)}</b>. A team owns a topic when its average accuracy there is higher.</p>`:''}`}
ROUTES.territories=async()=>{shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🗺️ Topic territories</h1><p class="muted">Teams (your section or tutorial session) compete for each topic. The team with the higher average accuracy owns it. Updated a few times a day.</p><div id="ter"><p class="muted">Loading…</p></div>`);
  const A=await funAggLoad();const el=$('#ter');if(el)el.innerHTML=A&&A.at?terrHTML(A,1)+`<p class="muted" style="font-size:.8rem">Updated ${esc(ago(A.at))}.</p>`:'<p class="muted">Not calculated yet.</p>'};
/* rewards from the class figures and from tutor help, credited once each */
async function funCredit(){if(!funMe()||!U)return;const F=funU();
  const A=FU_AGG;if(A&&A.goal&&A.goal.done&&myWeekAnswers(A.goal.wk)>0&&award('goal:'+A.goal.wk,20,'Class goal reached')){F.goal=A.goal.wk;checkBadges()}
  if(A&&A.imp&&(A.imp.top||[]).some(r=>r.sid===ME.sid)&&award('imp:'+A.imp.wk,20,'Most improved')){F.imp=A.imp.wk;checkBadges()}
  /* "This helped me" arrives as a notification (ref help:<thread>/<reply>) */
  if(typeof NOTE!=='undefined')NOTE.filter(n=>/^help:[^/]+\/.+/.test(n.ref||'')&&n.to===ME.sid).forEach(n=>{const k='helped:'+n.ref.slice(5),d=today();if(U.log[k])return;
    U.hpd=U.hpd&&U.hpd.d===d?U.hpd:{d,x:0};const xp=Math.max(0,Math.min(FUN.HELP_XP,FUN.HELP_CAP-U.hpd.x));if(award(k,xp,'You helped a classmate')){U.hpd.x+=xp;F.hp=(F.hp|0)+1;checkBadges();save()}});
  /* approved teach-backs and questions */
  if(FUN_R&&!funCredit.subT||FUN_R&&Date.now()-funCredit.subT>10*60e3){funCredit.subT=Date.now();try{(await CLOUD.docs('subs',{where:[['by','==',ME.sid]]})).forEach(s=>{if(s.st!=='ok')return;
    if(s.k==='tb'&&award('tb:'+s.id,FUN.TB_XP,'Teach-back approved')){F.tb=(F.tb|0)+1;checkBadges()}if(s.k==='qw'&&award('qw:'+s.id,FUN.QW_XP,'Your question is in the bank')){F.qw=(F.qw|0)+1;checkBadges()}})}catch(e){}}}
onHook('cloud',()=>{funAggLoad().then(()=>funCredit()).catch(()=>{});funOK().catch(()=>{})});

/* ---------- home and practice ---------- */
function funHome(){const el=$('#tfun');if(!el||!U)return;el.innerHTML=recapHTML();recapBind();if(!cloudOn())return;
  funAggLoad().then(A=>{const e=$('#tfun');if(!e||!A)return;e.insertAdjacentHTML('beforeend',goalHTML(A)+impHTML(A));funCredit()})}
function funPracticeHTML(){if(!U)return '';const L=ME.sid===LECTURER,C=cardStats(U),bt=bossTops();
  const tile=(href,em,name,line,need)=>`<a class="card zone ttile" href="${href}"${need?' data-need="rules4"':''}><span class="em">${em}</span><span><b class="lex">${name}</b><small class="muted">${line}</small></span></a>`;
  return `<h2 style="margin-top:22px">🎮 Challenge yourself</h2><div class="ttiles funtiles">
  ${bt.length?tile('#/boss','👹','Boss rounds',bt.filter(t=>(U.boss||{})[t]&&U.boss[t].pass).length+'/'+bt.length+' beaten · after each Expert set'):''}
  ${STORY_ON()?tile('#/story','📖','Story mode: '+STORY.title,'One chapter per topic'):''}
  ${typeof quizItems==='function'?tile('#/speed','⚡','Speed run','Best: '+((U.sp||{}).best|0)+' points'):''}
  ${typeof flashDecks==='function'&&C.all?tile('#/collection','🃏','Term cards',C.got+'/'+C.all+' collected'):''}
  ${tile('#/territories','🗺️','Topic territories','Which team owns each topic')}
  ${L?'':tile('#/duels','🔥','Streak duels','7 days, one classmate',1)}
  ${tile('#/help','🙋','Ask a tutor',isTutor(U)?'🎓 You are a tutor':'Ask classmates who are tutors',1)}
  ${L?'':tile('#/teach','💡','Teach-back','Explain an idea for classmates',1)+tile('#/write','📝','Question writer','Write a question for the bank',1)}
  </div>${hardToggleHTML()}`}
function funPracticeBind(){hardBind();funOK().then(ok=>{if(!ok)document.querySelectorAll('.funtiles [data-need="rules4"]').forEach(a=>a.hidden=true)})}

/* ---------- streak duels ---------- */
const duelEnd=c=>(c.t||Date.now())+FUN.DUEL_DAYS*864e5;
function duelRun(u,c){const from=mvDay(c.t),to=mvDay(duelEnd(c)-1),days=new Set((u.days||[]).filter(d=>d>=from&&d<=to));let best=0,cur=0;for(let d=from;d<=to;d=addDays(d,1)){if(days.has(d)){cur++;best=Math.max(best,cur)}else cur=0}return Math.min(7,best)}
ROUTES.duels=async h=>{if(notPlayer('Streak duels'))return;if(!(await funOK()))return shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🔥 Streak duels</h1><p class="muted">Streak duels switch on soon.</p>`);await socDir();
  if(h[1]==='new')return duelNew();if(h[1])return duelView(h[1]);
  shell('#/practice',`<p><a href="#/practice">← Practice</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0">🔥 Streak duels</h1><a class="btn" href="#/duels/new">New duel</a></div>
  <p class="muted">Pick a classmate. For ${FUN.DUEL_DAYS} days, practise every day: the longer run of days in a row wins. Win +30 XP, tie +15 each, and +5 for taking part. Up to ${FUN.DUEL_MAX} duels at a time.</p><div class="card" id="dul"><p class="muted" style="margin:0">Loading…</p></div>`);
  CLOUD.watch('challenges',{where:[['p','array-contains',ME.sid]],limit:60},d=>{const el=$('#dul');if(!el)return;d=d.filter(c=>c.mode==='streak').sort((a,b)=>(b.t|0)-(a.t|0));
    el.innerHTML=d.length?d.map(c=>{const o=c.p.find(s=>s!==ME.sid),over=Date.now()>duelEnd(c);return `<a class="rdrow" href="#/duels/${c.id}"><span class="em">🔥</span><span class="rdl">vs ${esc(nameOf(o))}</span><span class="tag">${over?'Finished':'Day '+Math.min(7,Math.floor((Date.now()-c.t)/864e5)+1)+' of 7'}</span></a>`}).join(''):'<p class="muted" style="margin:0">No duels yet.</p>'},e=>{const el=$('#dul');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})};
async function duelNew(){const mine=(await CLOUD.docs('challenges',{where:[['p','array-contains',ME.sid]]})).filter(c=>c.mode==='streak'&&Date.now()<duelEnd(c));
  const all=Object.entries(SDIR).filter(([s])=>s!==ME.sid&&s!==LECTURER).sort((a,b)=>a[1].n<b[1].n?-1:1);
  shell('#/practice',`<p><a href="#/duels">← Streak duels</a></p><h1>New streak duel</h1>${mine.length>=FUN.DUEL_MAX?`<p class="err">You already have ${FUN.DUEL_MAX} duels running. Finish one first.</p>`:`<input id="duq" placeholder="Search names" aria-label="Search names" style="width:100%;margin-bottom:8px">
  <div class="chpick" id="dup">${all.map(([s,x])=>`<button type="button" class="chip" data-s="${s}">${esc(x.n||s)}</button>`).join('')||'<p class="muted">Your lecturer has not added the class names yet.</p>'}</div>`}`);
  const q=$('#duq');if(q)q.oninput=e=>{const v=e.target.value.toLowerCase();document.querySelectorAll('#dup [data-s]').forEach(b=>b.hidden=!!v&&!b.textContent.toLowerCase().includes(v))};
  document.querySelectorAll('#dup [data-s]').forEach(b=>b.onclick=async()=>{if(!confirm('Start a 7-day streak duel with '+b.textContent+'?'))return;b.disabled=true;
    try{const id=await CLOUD.add('challenges',{by:ME.sid,p:[ME.sid,b.dataset.s],mode:'streak',items:[],t:CLOUD.ts(),exp:CLOUD.when(Date.now()+(FUN.DUEL_DAYS+1)*864e5-36e5),st:'wait'});
      await notify(b.dataset.s,'invite',id,`${U.dn||ME.name} started a 7-day streak duel with you 🔥`);toast('🔥','Duel on!','Practise every day for 7 days');location.hash='#/duels/'+id}catch(e){b.disabled=false;toast('⚠️','Not started',CLOUD.say(e))}})}
async function duelView(id){shell('#/practice',`<p><a href="#/duels">← Streak duels</a></p><div id="duv"><p class="muted">Loading…</p></div>`);let C=null,R={};
  const draw=async()=>{const el=$('#duv');if(!el||!C)return;const o=C.p.find(s=>s!==ME.sid),end=duelEnd(C),over=Date.now()>=end,mineRun=duelRun(U,C);
    if(over&&!R[ME.sid]&&Date.now()<C.exp){try{await CLOUD.put('challenges/'+id+'/r/'+ME.sid,{s:mineRun,n:7,ms:0,at:CLOUD.ts()});R[ME.sid]={s:mineRun}}catch(e){}}
    let ob=null;try{ob=await CLOUD.get('board/'+o)}catch(e){}
    const done=over&&(R[o]||Date.now()>=C.exp),me=(R[ME.sid]||{}).s|0,them=(R[o]||{}).s|0,res=!done?'':me>them?'win':me<them?'lose':'tie';
    if(res){const xp={win:30,tie:15,lose:5}[res];if(award('duel:'+id,xp,res==='win'?'Streak duel won':res==='tie'?'Streak duel tied':'Streak duel'))if(res==='win'){funU().dw=(funU().dw|0)+1;checkBadges();save()}}
    el.innerHTML=`<div class="card"><h1 style="margin:0">🔥 You vs ${esc(nameOf(o))}</h1><p class="muted">${over?'Finished on '+esc(mvDay(end-1)):'Ends '+esc(mvDay(end-1))+' · day '+Math.min(7,Math.floor((Date.now()-C.t)/864e5)+1)+' of 7'}</p>
    <div class="stats"><div class="stat"><b>${mineRun}</b><span>your days in a row (best run)</span></div><div class="stat"><b>${over?((R[o]||{}).s!=null?them:'…'):(ob?'🔥 '+(ob.s|0):'–')}</b><span>${over?'their best run':'their streak now'}</span></div></div>
    ${res?`<div class="fb ${res==='lose'?'no':'ok'}" style="margin-top:10px">${res==='win'?'🏆 You won!':res==='tie'?'🤝 A tie: well kept, both of you!':'They kept going longer this time. Rematch?'}</div>`:over?'<p class="muted">Waiting for your classmate to open the duel (they have one day).</p>':'<p class="muted">Keep practising every day: any XP-earning practice counts.</p>'}</div>`};
  CLOUD.watchOne('challenges/'+id,c=>{C=c;if(c&&c.mode==='streak')draw()},e=>{const el=$('#duv');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});
  CLOUD.watch('challenges/'+id+'/r',{},d=>{R={};d.forEach(x=>R[x.id]=x);draw()},()=>{})}

/* ---------- mentors (live sessions) ---------- */
function mentHTML(S){if(!S||!S.ment||!ME)return '';const M=S.ment,me=ME.sid,mine=M[me];
  const mentor=Object.keys(M).find(k=>(M[k]||[]).includes(me));
  if(mine&&mine.length)return `<div class="card mentc" style="margin-top:14px"><h3 style="margin:0 0 6px">🤝 You're a mentor today</h3><p class="muted" style="margin:0;font-size:.9rem">Help ${mine.map(s=>esc(nameOf(s))).join(', ')}. If their scores improve in this session, you earn a mentor bonus.</p></div>`;
  if(mentor)return `<div class="card mentc" style="margin-top:14px"><h3 style="margin:0 0 6px">🤝 Your mentor today: ${esc(nameOf(mentor))}</h3><p class="muted" style="margin:0;font-size:.9rem">Stuck? Ask them first.</p></div>`;return ''}
ROUTES.mentors=async h=>{if(ME.sid!==LECTURER)return home();const id=h[1];if(!id)return location.hash='#/live';await socDir();
  shell('#/lecturer',`<div data-lect><p><a href="#/live">← Live board</a></p><h1>🤝 Mentors</h1><p class="muted">Tick 2–4 students as mentors, then pair the others with them. Students see their mentor (or mentees) on the tutorial page. After the session, give mentors a +15 XP bonus when their mentees improved.</p><div id="mtb"><p class="muted">Loading…</p></div></div>`);
  let S=null,P=[];try{S=await CLOUD.get('sessions/'+id);P=(await CLOUD.presenceOnce(id)).map(p=>p.id).filter(s=>s!==LECTURER)}catch(e){return $('#mtb').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`}
  const M=Object.assign({},S&&S.ment||{}),of=s=>Object.keys(M).find(k=>(M[k]||[]).includes(s))||'';
  const draw=()=>{const ms=Object.keys(M);$('#mtb').innerHTML=P.length?`<div class="card"><table class="wide"><tr><th>Student</th><th>Mentor?</th><th>Paired with</th></tr>${P.map(s=>`<tr><td>${esc(nameOf(s))}</td><td><input type="checkbox" data-mm="${s}"${s in M?' checked':''} aria-label="Mentor"></td>
    <td>${s in M?'<span class="muted">mentor</span>':`<select data-mp="${s}"><option value="">–</option>${ms.map(m=>`<option value="${m}"${of(s)===m?' selected':''}>${esc(nameOf(m))}</option>`).join('')}</select>`}</td></tr>`).join('')}</table>
    <div class="row" style="margin-top:10px"><button class="btn ghost" id="mtauto">Pair the rest automatically</button><button class="btn" id="mtsave">Save pairs</button><button class="btn gold" id="mtbon">Give mentor bonuses</button></div><p class="muted" id="mtmsg"></p></div>`:'<p class="muted">Nobody has joined this session yet.</p>';
    document.querySelectorAll('[data-mm]').forEach(c=>c.onchange=()=>{const s=c.dataset.mm;if(c.checked){Object.keys(M).forEach(k=>M[k]=(M[k]||[]).filter(x=>x!==s));M[s]=M[s]||[]}else delete M[s];draw()});
    document.querySelectorAll('[data-mp]').forEach(c=>c.onchange=()=>{const s=c.dataset.mp;Object.keys(M).forEach(k=>M[k]=(M[k]||[]).filter(x=>x!==s));if(c.value)M[c.value].push(s)});
    const au=$('#mtauto');if(au)au.onclick=()=>{const ms=Object.keys(M);if(!ms.length)return toast('🤝','Tick mentors first','');P.filter(s=>!(s in M)&&!of(s)).forEach((s,i)=>M[ms[i%ms.length]].push(s));draw()};
    const sv=$('#mtsave');if(sv)sv.onclick=async()=>{try{await CLOUD.put('sessions/'+id,{ment:M},true);$('#mtmsg').textContent='Saved. Students see their pairs now.'}catch(e){$('#mtmsg').textContent=CLOUD.say(e)}};
    const bo=$('#mtbon');if(bo)bo.onclick=async()=>{bo.disabled=true;try{$('#mtmsg').textContent='Checking scores…';const us=await CLOUD.docs('users'),UU={};us.forEach(x=>{try{UU[x.id]=JSON.parse(x.u)}catch(e){}});
      const a=(S.startedAt|0)/1000,b=(S.endedAt||Date.now())/1000,acc=(u,p,q)=>{const v=((u||{}).qa||[]).filter(x=>x[0]>=p&&x[0]<q);return v.length?{n:v.length,a:v.reduce((t,x)=>t+(+x[2]||0),0)/v.length}:{n:0,a:0}};let n=0;
      for(const m of Object.keys(M)){const ok=(M[m]||[]).filter(s=>{const now=acc(UU[s],a,b),before=acc(UU[s],a-7*86400,a);return now.n>=5&&(!before.n||now.a>=before.a)});
        if(!ok.length)continue;await CLOUD.put('reviews/'+m,{m:{['bonus_ment_'+id]:{q:'mentor',xp:15,fb:'Mentor bonus: '+ok.length+' of your classmates improved in '+String(S.name||'the session')+'. Thank you for helping!',at:isoNow(),by:'lecturer'}}},true);n++}
      $('#mtmsg').textContent=n?'Bonus sent to '+n+' mentor'+(n===1?'':'s')+'.':'No mentees with 5+ answers improved yet.'}catch(e){$('#mtmsg').textContent=CLOUD.say(e)}bo.disabled=false}};draw()};

/* ---------- teach-back and question writer ---------- */
async function subMine(){return (await CLOUD.docs('subs',{where:[['by','==',ME.sid]]})).sort((a,b)=>a.id<b.id?-1:1)}
function subFree(mine,k){for(let i=1;i<=9;i++){const id=ME.sid+'_'+k+'_'+i;if(!mine.some(s=>s.id===id))return id}return null}
const subSt=s=>({sub:'⏳ Waiting for your lecturer',ok:'✅ Approved',no:'↩️ Not this time'}[s.st]||s.st);
async function subPage(k){if(notPlayer(k==='tb'?'Teach-back':'Question writer'))return;const name=k==='tb'?'💡 Teach-back':'📝 Question writer';
  if(!(await funOK()))return shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>${name}</h1><p class="muted">Switches on soon.</p>`);
  const tops=funExTops(U),w=funWord(),mine=(await subMine()).filter(s=>s.k===k);
  const intro=k==='tb'?`Explain one hard idea in your own words, in 100 words or fewer, for classmates who find it tricky. Your lecturer reviews it; approved explanations appear in the notes as "Explained by ${esc(U.un||U.dn||'you')}" and earn +${FUN.TB_XP} XP.`
    :`Write a multiple-choice question: the question, the right answer and three believable wrong answers, plus why the answer is right. Your lecturer reviews it; approved questions join the practice bank, credited to you, for +${FUN.QW_XP} XP.`;
  shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>${name}</h1><p class="muted">${intro}</p>
  ${tops.length?`<div class="card" id="sbf"><label for="sbt">${w}</label><select id="sbt">${tops.map(t=>`<option value="${t}">${esc(funTopLabel(t))}</option>`).join('')}</select>
   ${k==='tb'?`<label for="sbx">Your explanation (<span id="sbw">0</span>/100 words)</label><textarea id="sbx" style="min-height:120px" maxlength="700"></textarea>`
    :`<label for="sbq">Question</label><textarea id="sbq" maxlength="300"></textarea>${[0,1,2,3].map(i=>`<label for="sbo${i}">${i?'Wrong answer '+i:'Right answer'}</label><input id="sbo${i}" maxlength="140">`).join('')}<label for="sby">Why the right answer is right</label><textarea id="sby" maxlength="300"></textarea>`}
   <button class="btn" id="sbgo" style="margin-top:10px">Send to my lecturer</button><p class="err" id="sber"></p></div>`
   :`<div class="card"><p class="exlock" style="margin:0">🔒 ${typeof exTops==='function'&&exTops().length?'Earn the Expert badge for a topic (finish its Expert set with 70%+) to write about it.':'Reach '+esc((LEVELS[funCfg().tutorLvl|0]||[0,'a higher level'])[1])+' to unlock this.'}</p></div>`}
  <h2 style="margin-top:18px">Yours (${mine.length})</h2>${mine.length?mine.map(s=>`<div class="card" style="margin-top:8px"><div class="row" style="justify-content:space-between"><b>${esc(w)} ${s.tp}</b><span class="tag">${subSt(s)}</span></div><p style="margin:6px 0 0">${esc(s.tx||s.q||'')}</p>${s.note?`<p class="muted" style="font-size:.86rem;margin:6px 0 0">Your lecturer: ${esc(s.note)}</p>`:''}</div>`).join(''):'<p class="muted">None yet.</p>'}`);
  const x=$('#sbx');if(x)x.oninput=()=>{$('#sbw').textContent=words(x.value)};
  const go=$('#sbgo');if(go)go.onclick=async()=>{const er=t=>{$('#sber').textContent=t},id=subFree(mine,k);if(!id)return er('You have sent the most (9). Ask your lecturer to tidy up old ones.');
    const d={by:ME.sid,n:String(U.dn||ME.name).slice(0,80),un:String(U.un||'').slice(0,24),k,tp:+$('#sbt').value,st:'sub',at:CLOUD.ts()};
    if(k==='tb'){const t=x.value.trim();if(words(t)<15)return er('Write at least 15 words.');if(words(t)>100)return er('Keep it to 100 words.');if(funLink(t))return er('No links, please.');d.tx=t}
    else{const q=$('#sbq').value.trim(),o=[0,1,2,3].map(i=>$('#sbo'+i).value.trim()),why=$('#sby').value.trim();if(q.length<15)return er('Write the question (15+ characters).');if(o.some(v=>!v))return er('Fill in all four answers.');
      if(new Set(o.map(v=>v.toLowerCase())).size<4)return er('The four answers must be different.');if(!why)return er('Explain why the right answer is right.');if(funLink(q+' '+o.join(' ')+' '+why))return er('No links, please.');Object.assign(d,{q,o,why})}
    go.disabled=true;try{await CLOUD.put('subs/'+id,d);toast('📨','Sent','Your lecturer will review it');subPage(k)}catch(e){go.disabled=false;er(CLOUD.say(e))}}}
ROUTES.teach=()=>subPage('tb');ROUTES.write=()=>subPage('qw');
/* approved teach-backs on a topic's notes page */
let TB_LIST=null;
function tbNoteHTML(t){setTimeout(()=>tbFill(t),0);return `<div class="tbn" data-tbn="${esc(t)}"></div>`}
async function tbFill(t){const el=document.querySelector(`[data-tbn="${t}"]`);if(!el||!cloudOn()||!(await funOK()))return;
  try{if(!TB_LIST)TB_LIST=(await CLOUD.docs('subs',{where:[['st','==','ok']]})).filter(s=>s.k==='tb')}catch(e){return}
  const L=TB_LIST.filter(s=>String(s.tp)===String(t));if(!L.length)return;el.innerHTML=`<div class="card" style="margin-top:18px"><h2 style="margin:0 0 6px">💡 Explained by classmates</h2>${L.map(s=>`<blockquote class="tbq">${esc(s.tx)}<footer class="muted">Explained by ${esc(s.un||s.n||'a classmate')}</footer></blockquote>`).join('')}</div>`}

/* ---------- Ask a tutor ---------- */
let TUT_ROWS=null;
async function tutorRows(){if(TUT_ROWS&&Date.now()-TUT_ROWS._t<5*60e3)return TUT_ROWS;const r=(await CLOUD.docs('board')).filter(x=>x.tu&&x.id!==LECTURER);r._t=Date.now();return TUT_ROWS=r}
ROUTES.help=async h=>{if(!(await funOK()))return shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🙋 Ask a tutor</h1><p class="muted">Ask a tutor switches on soon.</p>`);
  if(h[1])return helpThread(h[1]);const L=ME.sid===LECTURER,me=funMe(),tops=funTops(),w=funWord(),mt=tutorTops(U);let f=LS.get('hlpf','');
  shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🙋 Ask a tutor</h1><p class="muted">Stuck on an idea? Ask a short question. Classmates with the <b>🎓 Tutor</b> badge for that ${w.toLowerCase()} answer it. When an answer helps, tap <b>👍 This helped me</b>: the tutor earns XP. Be kind, keep it about the course, no links.</p>
  ${me&&mt.length?`<div class="callout">🎓 You are a tutor for ${mt.map(t=>esc(w)+' '+t).join(', ')}. Questions on your topics show a ⭐.</div>`:''}
  ${me?`<details class="card" id="hask"><summary class="click"><b>Ask a question</b> <span class="muted">(up to ${FUN.HELP_DAY} a day)</span></summary><label for="hat">${w}</label><select id="hat">${tops.map(([t,l])=>`<option value="${t}">${esc(l)}</option>`).join('')}</select>
   <label for="haq">Your question</label><textarea id="haq" maxlength="300" placeholder="e.g. Why does a two-level channel have two intermediaries?"></textarea><button class="btn" id="hago" style="margin-top:8px">Ask</button><p class="err" id="haer"></p></details>`:''}
  <div class="row" id="hfil" style="margin:12px 0 6px"><button class="chip${f?'':' on'}" data-hf="">All</button>${tops.map(([t])=>`<button class="chip${String(f)===String(t)?' on':''}" data-hf="${t}">${esc(w)} ${t}</button>`).join('')}</div>
  <div class="card" id="hlist"><p class="muted" style="margin:0">Loading…</p></div><div class="card" id="htut" style="margin-top:12px"></div>`);
  document.querySelectorAll('[data-hf]').forEach(b=>b.onclick=()=>{LS.set('hlpf',b.dataset.hf);ROUTES.help(['help'])});
  const go=$('#hago');if(go)go.onclick=async()=>{const q=$('#haq').value.trim(),tp=+$('#hat').value,er=t=>{$('#haer').textContent=t};if(q.length<10)return er('Write a little more (10+ characters).');if(funLink(q))return er('No links, please.');
    go.disabled=true;let id=null;for(let i=1;i<=FUN.HELP_DAY;i++){const c=ME.sid+'_'+funDayNo()+'_'+i;try{if(!(await CLOUD.get('help/'+c))){id=c;break}}catch(e){}}
    if(!id){go.disabled=false;return er('You have asked '+FUN.HELP_DAY+' questions today. Try again tomorrow.')}
    try{await CLOUD.put('help/'+id,{by:ME.sid,n:String(U.dn||ME.name).slice(0,80),tp,q,at:CLOUD.ts(),st:'open'});
      try{const T=(await tutorRows()).filter(r=>r.id!==ME.sid&&String(r.tu).split(',').includes(String(tp))).slice(0,5);await Promise.all(T.map(r=>notify(r.id,'result','help:'+id,'New question on '+w+' '+tp+' in Ask a tutor')))}catch(e){}
      toast('🙋','Question posted','Tutors for this topic have been told');location.hash='#/help/'+id}catch(e){go.disabled=false;er(/permission/i.test(String(e&&e.message))?'Not posted: check there are no links, or try again in a minute.':CLOUD.say(e))}};
  CLOUD.watch('help',{order:['at','desc'],limit:80},d=>{const el=$('#hlist');if(!el)return;d=d.filter(x=>x.id!=='_probe'&&(x.st!=='hid'||L)&&(!f||String(x.tp)===String(f)));
    el.innerHTML=d.length?d.map(x=>`<a class="rdrow" href="#/help/${esc(x.id)}"><span class="em">${x.st==='closed'?'✅':mt.includes(+x.tp)?'⭐':'🙋'}</span><span class="rdl">${esc(x.q)}<small class="muted" style="display:block">${esc(w)} ${x.tp} · ${esc(x.by===ME.sid?'you':x.n||'a classmate')} · ${esc(ago(x.at))}${x.st==='hid'?' · hidden':''}</small></span></a>`).join(''):'<p class="muted" style="margin:0">No questions yet.</p>'},
    e=>{const el=$('#hlist');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});
  tutorRows().then(T=>{const el=$('#htut');if(!el)return;el.innerHTML=`<h2 style="margin:0 0 6px">🎓 Tutors (${T.length})</h2>${T.length?`<ul class="sumlist">${T.sort((a,b)=>(b.hp|0)-(a.hp|0)).map(r=>`<li><b>${esc(showName(r.n,r.id))}</b> · ${esc(w)} ${esc(String(r.tu).split(',').join(', '))}${r.hp?` · <span class="muted">helped ${r.hp}</span>`:''}</li>`).join('')}</ul>`:'<p class="muted" style="margin:0">No tutors yet. '+(funCfg().tutorLvl?`Reach ${esc((LEVELS[funCfg().tutorLvl]||[0,''])[1])}${funCfg().tutorEx?' and earn '+funCfg().tutorEx+' Expert badges':''} to become one.`:'')+'</p>'}`}).catch(()=>{})};
async function helpThread(id){const L=ME.sid===LECTURER,w=funWord();let T=null,R=[];
  shell('#/practice',`<p><a href="#/help">← Ask a tutor</a></p><div id="hth"><p class="muted">Loading…</p></div>`);
  const draw=()=>{const el=$('#hth');if(!el||!T)return;const asker=T.by===ME.sid,canR=funMe()&&!asker&&T.st==='open'&&tutorTops(U).includes(+T.tp),mineN=R.filter(r=>r.by===ME.sid).length;
    el.innerHTML=`<div class="card"><span class="tag">${esc(w)} ${T.tp}</span>${T.st==='closed'?' <span class="tag good">Closed</span>':''}${T.st==='hid'?' <span class="tag" data-lect>Hidden</span>':''}<h2 style="margin:8px 0 4px">${esc(T.q)}</h2><p class="muted" style="margin:0;font-size:.85rem">${esc(asker?'You':T.n||'A classmate')} · ${esc(ago(T.at))}</p>
      <div class="row" style="margin-top:8px">${asker&&T.st==='open'?'<button class="btn ghost sm" id="hcl">✓ Close (I understand now)</button>':''}${!asker&&!L?'<button class="btn ghost sm" id="hrp">🚩 Report</button>':''}${L?`<button class="btn ghost sm" data-lect id="hhide">${T.st==='hid'?'Unhide':'Hide'}</button><button class="btn red sm" data-lect id="hdel">Delete</button>`:''}</div></div>
    ${R.filter(r=>r.st!=='hid'||L).map(r=>`<div class="card hrep" style="margin-top:10px"><p style="margin:0">${esc(r.tx)}</p><p class="muted" style="margin:6px 0 0;font-size:.85rem">🎓 ${esc(r.by===ME.sid?'You':r.n||'A tutor')} · ${esc(ago(r.at))}${r.ok?' · <b>👍 helped</b>':''}${r.st==='hid'?' · hidden':''}</p>
      <div class="row" style="margin-top:6px">${asker&&!r.ok?`<button class="btn sm" data-hok="${esc(r.id)}">👍 This helped me</button>`:''}${L?`<button class="btn ghost sm" data-lect data-rhide="${esc(r.id)}">${r.st==='hid'?'Unhide':'Hide'}</button><button class="btn red sm" data-lect data-rdel="${esc(r.id)}">Delete</button>`:''}</div></div>`).join('')||'<p class="muted" style="margin-top:10px">No answers yet.</p>'}
    ${canR&&mineN<3?`<div class="card" style="margin-top:12px"><label for="hrx">Your answer</label><textarea id="hrx" maxlength="500" placeholder="Explain it simply, with an example."></textarea><button class="btn" id="hrgo" style="margin-top:8px">Post answer</button><p class="err" id="hrer"></p></div>`
      :funMe()&&!asker&&T.st==='open'&&!tutorTops(U).includes(+T.tp)?`<p class="muted" style="margin-top:12px;font-size:.86rem">Only tutors for ${esc(w)} ${T.tp} can answer here.</p>`:''}`;
    const b=(s,f)=>{const e=$(s);if(e)e.onclick=f};
    b('#hcl',()=>CLOUD.put('help/'+id,{st:'closed'},true).catch(e=>toast('⚠️','Not closed',CLOUD.say(e))));
    b('#hrp',async()=>{if(!confirm('Report this question or its answers to your lecturer?'))return;try{await CLOUD.add('reports',{sid:ME.sid,q:('help:'+id).slice(0,40),w:'Ask a tutor',k:'other',tx:'A post in Ask a tutor was reported.',st:'open',t:CLOUD.ts()});toast('🚩','Reported','Your lecturer will look at it')}catch(e){toast('⚠️','Not sent',CLOUD.say(e))}});
    b('#hhide',()=>CLOUD.put('help/'+id,{st:T.st==='hid'?'open':'hid'},true).catch(e=>toast('⚠️','Not changed',CLOUD.say(e))));
    b('#hdel',async()=>{if(!confirm('Delete this question and its answers?'))return;try{for(const r of R)await CLOUD.del('help/'+id+'/r/'+r.id);await CLOUD.del('help/'+id);location.hash='#/help'}catch(e){toast('⚠️','Not deleted',CLOUD.say(e))}});
    document.querySelectorAll('[data-hok]').forEach(x=>x.onclick=async()=>{const r=R.find(y=>y.id===x.dataset.hok);x.disabled=true;try{await CLOUD.put('help/'+id+'/r/'+r.id,{ok:true},true);await notify(r.by,'result',('help:'+id+'/'+r.id).slice(0,40),'Your answer helped a classmate 👍');toast('👍','Thanks!','The tutor earns XP')}catch(e){x.disabled=false;toast('⚠️','Not saved',CLOUD.say(e))}});
    document.querySelectorAll('[data-rhide]').forEach(x=>x.onclick=()=>{const r=R.find(y=>y.id===x.dataset.rhide);CLOUD.put('help/'+id+'/r/'+r.id,{st:r.st==='hid'?'ok':'hid'},true).catch(e=>toast('⚠️','Not changed',CLOUD.say(e)))});
    document.querySelectorAll('[data-rdel]').forEach(x=>x.onclick=()=>{if(confirm('Delete this answer?'))CLOUD.del('help/'+id+'/r/'+x.dataset.rdel).catch(e=>toast('⚠️','Not deleted',CLOUD.say(e)))});
    b('#hrgo',async()=>{const t=$('#hrx').value.trim(),er=s=>{$('#hrer').textContent=s};if(t.length<5)return er('Write a little more.');if(funLink(t))return er('No links, please.');
      let rid=null;for(let i=1;i<=3;i++){const c=ME.sid+'_'+i;if(!R.some(r=>r.id===c)){rid=c;break}}if(!rid)return er('You can post up to 3 answers here.');
      $('#hrgo').disabled=true;try{await CLOUD.put('help/'+id+'/r/'+rid,{by:ME.sid,n:String(U.dn||ME.name).slice(0,80),tx:t,at:CLOUD.ts(),ok:false,st:'ok'});await notify(T.by,'result',('help:'+id).slice(0,40),'A tutor answered your question 🙋')}catch(e){$('#hrgo').disabled=false;er(CLOUD.say(e))}})};
  CLOUD.watchOne('help/'+id,d=>{T=d;if(!d){const el=$('#hth');if(el)el.innerHTML='<p class="muted">This question was removed.</p>';return}draw()},e=>{const el=$('#hth');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});
  CLOUD.watch('help/'+id+'/r',{},d=>{R=d.sort((a,b)=>(a.at|0)-(b.at|0));draw()},()=>{})}

/* ---------- lecturer cards ---------- */
if(typeof LF_META!=='undefined')Object.assign(LF_META,{subc:['💡 Teach-backs and questions','Approve what students wrote'],helpc:['🙋 Ask a tutor','See and moderate every question'],
  aggc:['🎯 Class goal and class figures','Goal, most improved, territories'],bossac:['👹 Boss rounds and story','Release them topic by topic',()=>BOSS_ON()||STORY_ON()]});
lcard('bossac',el=>{if(!BOSS_ON()&&!STORY_ON())return;el.hidden=false;const draw=()=>{const A=funA();
  el.innerHTML=`<h2 style="margin:0">👹 Boss rounds and story</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Students see every Boss round, locked until they finish that topic's Expert set; it opens only after you approve it here. Story mode opens chapter by chapter once released.</p>
  ${bossTops().map(t=>{const S=bossSet(t),on=!!A['b'+t];return `<details><summary><b>${esc(funTopLabel(t))}: ${esc(S.title)}</b> <span class="tag${on?' good':''}">${on?'Approved':'Hidden'}</span></summary><p style="font-size:.88rem">${esc(S.scen)}</p>
    <ol style="font-size:.86rem">${S.mcq.map(q=>`<li>${esc(q.q)}<br><span class="muted">✓ ${esc(q.o[0])}</span></li>`).join('')}<li>🧱 ${esc(S.chip.q)}</li></ol><button class="btn${on?' ghost':''} sm" data-bap="b${t}">${on?'Hide from students':'✓ Approve'}</button></details>`}).join('')}
  ${STORY_ON()?`<p style="margin-top:10px"><b>📖 Story mode: ${esc(STORY.title)}</b> <span class="tag${A.story?' good':''}">${A.story?'Released':'Hidden'}</span> <a href="#/story">Preview</a> <button class="btn${A.story?' ghost':''} sm" data-bap="story">${A.story?'Hide':'✓ Release'}</button></p>`:''}
  ${[BOSS_ON()&&BOSS.review,STORY_ON()&&STORY.review].filter(Boolean).flat().length?`<details style="margin-top:10px"><summary>Invented scenarios to check</summary><ul style="font-size:.85rem">${[BOSS_ON()?BOSS.review:[],STORY_ON()?STORY.review:[]].flat().map(r=>`<li>${esc(r)}</li>`).join('')}</ul></details>`:''}<p class="err" id="baperr"></p>`;
  el.querySelectorAll('[data-bap]').forEach(b=>b.onclick=async()=>{const A2=Object.assign({},funA());A2[b.dataset.bap]=!A2[b.dataset.bap];b.disabled=true;
    try{await CLOUD.put('meta/expert',A2);EXA=A2;LS.set('exa',EXA);draw()}catch(e){$('#baperr').textContent=CLOUD.say(e);b.disabled=false}})};
  el.innerHTML='<p class="muted">Loading…</p>';(typeof exLoadA==='function'?exLoadA():Promise.resolve()).then(draw)});
lcard('subc',el=>{funOK().then(ok=>{if(!ok)return;el.hidden=false;let tab='sub';const w=funWord();
  const draw=async()=>{el.innerHTML=`<h2 style="margin:0">💡 Teach-backs and questions</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Students with the Expert badge for a topic can explain an idea or write an MCQ. Approved teach-backs appear on that topic's notes page; approved questions go live in the practice bank (Question editor), credited to the student.</p>
    <div class="row">${['sub','ok','no'].map(t=>`<button class="btn ghost sm${tab===t?' on':''}" data-st="${t}">${{sub:'Waiting',ok:'Approved',no:'Not approved'}[t]}</button>`).join('')}</div><div id="sbl" style="margin-top:8px"><p class="muted">Loading…</p></div>`;
    el.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{tab=b.dataset.st;draw()});
    let L=[];try{L=(await CLOUD.docs('subs',{where:[['st','==',tab]]})).sort((a,b)=>(b.at|0)-(a.at|0))}catch(e){$('#sbl').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`;return}
    $('#sbl').innerHTML=L.length?L.map(s=>`<div class="card" style="margin-top:8px" data-sid="${esc(s.id)}"><div class="row" style="justify-content:space-between"><b>${s.k==='tb'?'💡 Teach-back':'📝 Question'} · ${esc(w)} ${s.tp}</b><span class="muted" style="font-size:.85rem">${esc(s.n)}${s.un?' '+esc(s.un):''}</span></div>
      ${s.k==='tb'?`<p style="margin:6px 0">${esc(s.tx)}</p>`:`<p style="margin:6px 0"><b>${esc(s.q)}</b></p><ol style="font-size:.88rem;margin:0">${(s.o||[]).map((o,i)=>`<li>${i?'':'✓ '}${esc(o)}</li>`).join('')}</ol><p class="muted" style="font-size:.86rem">${esc(s.why||'')}</p>`}
      <input data-note placeholder="A short note for the student (optional)" maxlength="300" value="${esc(s.note||'')}" style="width:100%"><div class="row" style="margin-top:6px">${tab!=='ok'?'<button class="btn sm" data-ap="ok">✓ Approve</button>':''}${tab!=='no'?'<button class="btn ghost sm" data-ap="no">↩ Not this time</button>':''}</div></div>`).join(''):'<p class="muted">None.</p>';
    $('#sbl').querySelectorAll('[data-ap]').forEach(b=>b.onclick=async()=>{const box=b.closest('[data-sid]'),s=L.find(x=>x.id===box.dataset.sid),st=b.dataset.ap,note=box.querySelector('[data-note]').value.trim().slice(0,300);b.disabled=true;
      try{await CLOUD.put('subs/'+s.id,Object.assign({st},note?{note}:{}),true);
        if(st==='ok'&&s.k==='qw'&&typeof qbankKinds==='function'&&qbankKinds().mcq){const qid='qw-'+s.id.replace(/[^A-Za-z0-9]/g,'').slice(-14).toLowerCase();
          await CLOUD.put('qbank/'+qid,{kind:'mcq',data:JSON.stringify({id:qid,t:s.tp,b:'A',d:2,q:s.q,o:s.o,why:s.why+' (Question written by '+(s.un||s.n)+'.)'}),st:'live',by:'lecturer',t:CLOUD.ts(),note:'Written by '+(s.un||s.n)})}
        TB_LIST=null;draw()}catch(e){b.disabled=false;toast('⚠️','Not saved',CLOUD.say(e))}})};draw()})});
lcard('helpc',el=>{funOK().then(ok=>{if(!ok)return;el.hidden=false;const w=funWord();
  el.innerHTML=`<h2 style="margin:0">🙋 Ask a tutor</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Every question students asked, newest first. Open one to hide or delete a question or an answer. Reported posts also appear under Reports.</p><div id="hlc"><p class="muted">Loading…</p></div>`;
  CLOUD.docs('help',{order:['at','desc'],limit:100}).then(d=>{d=d.filter(x=>x.id!=='_probe');$('#hlc').innerHTML=d.length?`<ul class="sumlist">${d.map(x=>`<li><a href="#/help/${esc(x.id)}">${esc(x.q)}</a> <span class="muted" style="font-size:.82rem">${esc(w)} ${x.tp} · ${esc(x.n)} · ${esc(ago(x.at))}${x.st!=='open'?' · '+esc(x.st==='hid'?'hidden':'closed'):''}</span></li>`).join('')}</ul>`:'<p class="muted">No questions yet.</p>';lfTrim($('#hlc'),'helpc')})
    .catch(e=>{$('#hlc').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})})});
/* the class figures: the lecturer sets the goal; the figures are worked out from everyone's progress (here, or by tools/agg/run.mjs) */
async function aggGroups(){const G={};let dir=[];try{dir=await CLOUD.docs('directory')}catch(e){}dir.forEach(x=>{if(x.g)G[x.id]=typeof secLabel==='function'?secLabel(x.g):x.g});if(Object.keys(G).length)return G;
  const ss=await CLOUD.docs('sessions');for(const s of ss){try{s.p=(await CLOUD.docs('sessions/'+s.id+'/p')).map(p=>p.id)}catch(e){s.p=[]}}return aggSessGroups(ss)}
async function aggRun(){const [us,dir,goal]=await Promise.all([CLOUD.docs('users'),CLOUD.docs('directory').catch(()=>[]),CLOUD.get('meta/goal').catch(()=>null)]),N={};dir.forEach(x=>N[x.id]=x.n);
  const users=us.filter(x=>x.id!==LECTURER).map(x=>{let u={};try{u=JSON.parse(x.u)}catch(e){}return {id:x.id,n:N[x.id]||u.dn||'',u}});
  const A=aggCompute(users,await aggGroups(),{target:(goal&&goal.target)||funCfg().goal||1500});await CLOUD.put('meta/agg',A);FU_AGG=Object.assign({},A,{_t:Date.now()});return A}
lcard('aggc',el=>{rulesOK().then(ok=>{if(!ok)return;el.hidden=false;const draw=async()=>{const A=await funAggLoad(true),G=await CLOUD.get('meta/goal').catch(()=>null);
  el.innerHTML=`<h2 style="margin:0">🎯 Class goal and class figures</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">The class goal, most improved and topic territories are worked out from everyone's progress a few times a day (scheduled task: tools/agg/run.mjs). You can also work them out now.</p>
  <div class="row"><label for="agt" style="margin:0">Weekly class goal (answers)</label><input id="agt" type="number" min="50" max="100000" value="${(G&&G.target)||funCfg().goal||1500}" style="width:120px"><button class="btn ghost sm" id="agts">Save goal</button><button class="btn sm" id="agrun">Work out the figures now</button></div>
  <p class="muted" style="font-size:.85rem">${A&&A.at?'Last worked out '+esc(ago(A.at))+'.':'Not worked out yet.'}</p>${A&&A.goal?goalHTML(A)+impHTML(A)+terrHTML(A):''}<p class="err" id="agerr"></p>`;
  $('#agts').onclick=async()=>{try{await CLOUD.put('meta/goal',{target:Math.max(50,+$('#agt').value|0)});toast('🎯','Goal saved','It applies from the next calculation')}catch(e){$('#agerr').textContent=CLOUD.say(e)}};
  $('#agrun').onclick=async()=>{$('#agrun').disabled=true;try{await aggRun();draw()}catch(e){$('#agerr').textContent=CLOUD.say(e);$('#agrun').disabled=false}}};draw()})});

/* ---------- badges ---------- */
if(typeof BADGES!=='undefined'){
  BADGES.push(...bossTops().map(t=>({id:'boss'+t,ico:'👹',name:'Boss beaten: '+funTopLabel(t),d:'Pass the '+funTopLabel(t)+' Boss round with 70% or more',t:u=>!!((u.boss||{})[t]||{}).pass})));
  if(bossTops().length)BADGES.push({id:'bossall',ico:'🐉',name:'Boss of bosses',d:'Beat every Boss round',t:u=>bossTops().every(t=>((u.boss||{})[t]||{}).pass)});
  if(STORY_ON())BADGES.push({id:'story',ico:'📖',name:'Story finished',d:'Make every decision in '+STORY.title,t:u=>!!storyDone(u)});
  if(funCfg().tutorLvl)BADGES.push({id:'tutor',ico:'🎓',name:'Tutor',d:'Reach '+((LEVELS[funCfg().tutorLvl]||[0,''])[1])+(funCfg().tutorEx?' and earn '+funCfg().tutorEx+' Expert badges':'')+': classmates can ask you for help',t:u=>isTutor(u)});
  BADGES.push({id:'helper',ico:'🤝',name:'Helpful tutor',d:'Help 5 classmates in Ask a tutor',t:u=>((u.fun||{}).hp|0)>=5},
    {id:'speed20',ico:'⚡',name:'Perfect speed run',d:'Get all '+FUN.SP_N+' right in a speed run',t:u=>!!((u.sp||{}).perf)},
    {id:'cards25',ico:'🃏',name:'Card collector',d:'Collect 25 term cards',t:u=>cardStats(u).got>=25},{id:'carddeck',ico:'✨',name:'Rare card',d:'Collect every card in one topic',t:u=>cardStats(u).full>=1},
    {id:'goal',ico:'🎯',name:'Class goal',d:'Help the class reach its weekly goal',t:u=>!!((u.fun||{}).goal)},{id:'imp',ico:'📈',name:'Most improved',d:'Be one of the 3 most improved students of a week',t:u=>!!((u.fun||{}).imp)},
    {id:'duel',ico:'🔥',name:'Duel winner',d:'Win a streak duel',t:u=>((u.fun||{}).dw|0)>=1},{id:'teach',ico:'💡',name:'Teacher',d:'Have a teach-back approved',t:u=>((u.fun||{}).tb|0)>=1},
    {id:'writer',ico:'📝',name:'Question writer',d:'Have a question approved for the bank',t:u=>((u.fun||{}).qw|0)>=1},{id:'mentor',ico:'🧑‍🏫',name:'Mentor',d:'Earn a mentor bonus in a live session',t:u=>((u.fun||{}).ment|0)>=1})}
