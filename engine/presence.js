/* Screen time, break reminders and live tutorial sessions. Shared by MKT101 and MKT301 Arena (same file in both repos).
   Uses the page script's globals at call time: ME, U, LS, CLOUD, LECTURER, save(), award(), countOnce(), checkBadges(), toast(), esc(), $(),
   closeModal(), today(), cloudOn(), shell(), level(), openStudent(); optional site hooks presWhere() (current section label) and presBusy()
   (true while a task shouldn't be interrupted, e.g. mid-MCQ question).

   Screen time: counts while the portal is visible and focused AND the student interacted in the last 2 minutes. Idle doesn't stop it while a
   writing timer is running or 🎤 dictation is on. Seconds per local day live in U.st (U.stx = the part outside live sessions); ~120 days kept,
   older days are folded into U.stArch so the total stays right.
   XP: +15 once a day for 20 active minutes (daily goal); +10 for every 20 active minutes outside live sessions, up to 6 a day.
   Break reminder: after 20 minutes of continuous focus (a break = 3+ minutes without activity). Not during a live session; deferred while a
   writing timer runs, dictation is on or presBusy() says so. "Not now" asks again 10 minutes later.

   Live sessions (cloud only): the lecturer starts one (sessions/{id}); students tap Join; while joined the portal reports whether it is on
   screen (on / idle / away) and the current section to sessions/{id}/p/{SID}: on every status change, section changes at most every 30 s,
   and a heartbeat every 2 minutes. About 60-80 writes per student per 2-hour session (≈ 4,500 for 56 students).
   Focus XP: +20 once per session if the student was on screen for 85%+ of at least 10 joined minutes, claimed by their own portal. */
const ST={IDLE:120,GOAL:1200,GOAL_XP:15,BLOCK:1200,BLOCK_XP:10,BLOCKS:6,KEEP:120,BRK:1200,GAP:180,SNOOZE:600,BRK_LEN:300,
  SESS_H:3,OFF:300,BEAT:120,SEC_MIN:30,FOCUS:.85,FOCUS_MIN:600,FOCUS_XP:20};
const PRES_BADGES=[[5,'⏳','5 Hours Logged'],[10,'⌛','10 Hours Logged'],[20,'🕰️','20 Hours Logged']].map(([h,ico,name])=>
  ({id:'hrs'+h,ico,name,d:'Practise for '+h+' hours in total (active screen time)',t:u=>stTotal(u)>=h*3600}));
const PRES_MISSIONS=[0,1,2].map(t=>({id:'stgoal'+t,t,k:'stgoal',n:1,x:'Practise for 20 minutes today'}));

/* ---------- screen-time numbers (work on any U, so the lecturer's profile view can use them too) ---------- */
const stYmd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function stDays(u,n){const st=(u&&u.st)||{},out=[],d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-n+1);
  for(let i=0;i<n;i++){const k=stYmd(d);out.push([k,st[k]|0]);d.setDate(d.getDate()+1)}return out}
const stToday=u=>((u&&u.st)||{})[stYmd(new Date())]|0;
const stWeek=u=>stDays(u,7).reduce((t,x)=>t+x[1],0);
const stTotal=u=>Object.values((u&&u.st)||{}).reduce((t,s)=>t+(s|0),0)+((u&&u.stArch)|0);
const stFmt=s=>{s=Math.round(s/60);return s<60?s+' min':Math.floor(s/60)+' h'+(s%60?' '+s%60+' min':'')};

/* ---------- state ---------- */
const PR={last:Date.now(),lt:Date.now(),pend:0,pendx:0,lastSave:Date.now(),fc:0,gap:0,next:ST.BRK,brk:0,
  sess:null,sessOn:false,joined:false,st:'',stAt:0,awayAt:0,wrote:0,sec:'',secAt:0,secDirty:false,sessList:null,started:false,iv:null};
const presTimerOn=()=>[...document.querySelectorAll('[data-a="tgo"]')].some(b=>/pause/i.test(b.textContent||''));
const presMicOn=()=>typeof MIC!=='undefined'&&!!MIC;
const presBusyNow=()=>presTimerOn()||presMicOn()||(typeof presBusy==='function'&&!!presBusy());
const sessLive=()=>!!(PR.sess&&PR.sess.active&&(!PR.sess.endsAt||Date.now()<PR.sess.endsAt));
const presVisible=()=>document.visibilityState==='visible'&&(typeof document.hasFocus!=='function'||document.hasFocus());

function presStart(){if(PR.started)return;PR.started=true;const poke=()=>{PR.last=Date.now()};
  ['pointerdown','keydown','input','wheel','touchstart'].forEach(e=>addEventListener(e,poke,{capture:true,passive:true}));
  addEventListener('scroll',poke,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{presTick();if(document.visibilityState==='hidden'){stFlush(true)}});
  addEventListener('blur',()=>presTick());addEventListener('focus',()=>{PR.last=Date.now();presTick()});
  addEventListener('pagehide',()=>stFlush(true));addEventListener('hashchange',()=>setTimeout(()=>{presSection();presBar()},50));
  PR.iv=setInterval(presTick,1000)}

/* called by the page after sign-in (start) and sign-out */
function presOn(){alHooks();alStart();PR.last=PR.lt=Date.now();PR.pend=PR.pendx=0;PR.fc=0;PR.gap=0;PR.next=ST.BRK;presStart();presBar()}
/* called once the cloud account is ready (after the first sync): live sessions; quietly off if the rules don't allow them yet */
function presCloud(){if(!cloudOn()||!CLOUD.watchLatestSession)return;
  CLOUD.watchLatestSession(s=>{presSession(s)},()=>{PR.sess=null;PR.sessOn=false;PR.joined=false;presBar()});presClaimOld()}
function presOff(){stFlush(false);if(CLOUD.unwatchLatestSession)CLOUD.unwatchLatestSession();PR.sess=null;PR.sessOn=false;PR.joined=false;presBar()}

/* ---------- the 1-second tick ---------- */
function presTick(){if(typeof ME==='undefined'||!ME||!U||VIEWAS)return;const now=Date.now(),dt=Math.min(Math.max(0,(now-PR.lt)/1000),600);PR.lt=now;
  const vis=presVisible(),busy=presTimerOn()||presMicOn(),active=!PR.brk&&vis&&(busy||now-PR.last<ST.IDLE*1000);
  if(PR.brk){if(now>=PR.brk)presBreakEnd();else presBreakPaint()}
  const inSess=PR.joined&&sessLive();
  if(active){const a=Math.min(dt,5);PR.pend+=a;if(!inSess)PR.pendx+=a;PR.fc+=a;PR.gap=0}
  else{PR.gap+=dt;if(PR.gap>=ST.GAP){PR.fc=0;PR.next=ST.BRK}}
  if(PR.pend>=60||now-PR.lastSave>300000)stFlush(now-PR.lastSave>300000);
  if(!PR.brk&&PR.fc>=PR.next&&!window.__presNoBreak&&!sessLive()&&!document.querySelector('.modal')&&!presBusyNow())presBreakAsk();
  if(PR.joined)presSessTick(now,dt,vis,active)}

/* move counted seconds into U, award goal and block XP; full=true also saves (and syncs) */
function stFlush(full){if(typeof ME==='undefined'||!ME||!U||VIEWAS)return;const d=today();U.st=U.st||{};U.stx=U.stx||{};
  const s=Math.floor(PR.pend),sx=Math.floor(PR.pendx);PR.pend-=s;PR.pendx-=sx;
  if(s){U.st[d]=(U.st[d]|0)+s}if(sx){U.stx[d]=(U.stx[d]|0)+sx}
  const ks=Object.keys(U.st).sort();while(ks.length>ST.KEEP){const k=ks.shift();U.stArch=(U.stArch|0)+(U.st[k]|0);delete U.st[k];delete U.stx[k]}
  let got=false;
  if((U.st[d]|0)>=ST.GOAL&&award('stgoal:'+d,ST.GOAL_XP,'Daily goal: 20 minutes of practice')){countOnce('stgoal:'+d,'stgoal');got=true}
  const nb=Math.min(ST.BLOCKS,Math.floor((U.stx[d]|0)/ST.BLOCK));
  for(let b=1;b<=nb;b++)if(award('stblock:'+d+':'+b,ST.BLOCK_XP,'20 minutes of practice'))got=true;
  if(!got){const before=Object.keys(U.badges).length;checkBadges();if(Object.keys(U.badges).length>before)full=true}
  if(full||got){PR.lastSave=Date.now();if(!got)save()}
  else{try{LS.set('u_'+ME.sid,U)}catch(e){}}
  const c=document.getElementById('stcard');if(c&&!c.contains(document.activeElement))c.outerHTML=stCardHTML()}

/* ---------- break reminder ---------- */
function presBreakAsk(){const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Take a break');
  m.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:2.6rem">☕</div><h2 style="margin:6px 0">Time for a short break</h2>
  <p style="color:var(--ink2)">You've focused for 20 minutes. Take a 3–5 minute break: stretch, have some water and look away from the screen.</p>
  <div class="row" style="justify-content:center"><button class="btn ghost" id="brn">Not now</button><button class="btn" id="brs">Start 5-min break</button></div></div>`;
  document.body.append(m);$('#brs').focus();
  $('#brn').onclick=()=>{PR.next=PR.fc+ST.SNOOZE;closeModal()};
  $('#brs').onclick=()=>{PR.brk=Date.now()+ST.BRK_LEN*1000;presBreakShow()}}
function presBreakShow(){closeModal();const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Break');
  m.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:2.6rem">🧘</div><h2 style="margin:6px 0">Break time</h2>
  <div class="timer" id="brt">5:00</div><p class="muted">Screen time is paused. Stretch, drink some water, rest your eyes.</p><button class="btn ghost" id="brb">I'm back</button></div>`;
  document.body.append(m);$('#brb').onclick=presBreakEnd;presBreakPaint()}
function presBreakPaint(){const el=$('#brt');if(!el)return;const s=Math.max(0,Math.ceil((PR.brk-Date.now())/1000));el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function presBreakEnd(){PR.brk=0;PR.fc=0;PR.gap=0;PR.next=ST.BRK;PR.last=Date.now();if($('#brt'))closeModal();toast('💪','Welcome back','Ready for the next 20 minutes?')}

/* ---------- Home card ---------- */
function stCardHTML(){if(!U)return '';const days=stDays(U,7),t=stToday(U),wk=stWeek(U),tot=stTotal(U),mx=Math.max(ST.GOAL,...days.map(x=>x[1]));
  const nh=[5,10,20].find(h=>tot<h*3600),nb=nh&&PRES_BADGES.find(b=>b.id==='hrs'+nh),blocks=Math.min(ST.BLOCKS,Math.floor(((U.stx||{})[today()]|0)/ST.BLOCK));
  const dn=['S','M','T','W','T','F','S'];
  return `<div class="card stcard" id="stcard"><div class="row" style="justify-content:space-between"><h2 style="margin:0">⏱️ Screen time</h2><span class="tag">Daily goal 20 min · +${ST.GOAL_XP} XP</span></div>
  <div class="stwrap"><div class="ring string" style="--p:${Math.min(100,t/ST.GOAL*100)}"><div><b>${Math.floor(t/60)}</b><small>${t>=ST.GOAL?'GOAL MET ✓':'OF 20 MIN'}</small></div></div>
  <div class="stcol"><div class="stats" style="grid-template-columns:repeat(3,1fr);margin-top:0"><div class="stat"><b>${stFmt(t)}</b><span>today</span></div><div class="stat"><b>${stFmt(wk)}</b><span>this week</span></div><div class="stat"><b>${stFmt(tot)}</b><span>total</span></div></div>
  <div class="stbars" aria-label="Minutes per day, last 7 days">${days.map(([k,s])=>{const d=new Date(k+'T12:00');return `<div title="${k}: ${stFmt(s)}"><i style="height:${Math.max(2,Math.round(s/mx*100))}%" class="${s>=ST.GOAL?'goal':''}"></i><span>${dn[d.getDay()]}</span></div>`}).join('')}</div></div></div>
  <p class="muted" style="font-size:.84rem;margin:10px 0 0">${nb?`Next badge: ${nb.ico} <b>${nb.name}</b> · ${stFmt(nh*3600-tot)} to go. `:'All hours badges earned! '}20-minute bonuses today: ${blocks}/${ST.BLOCKS} (+${ST.BLOCK_XP} XP each, outside live sessions).</p>
  <p class="muted" style="font-size:.78rem;margin:4px 0 0">Counts only while the portal is on screen and you're active. It pauses after 2 minutes without a tap or keypress, except while a writing timer is running.</p></div>`}

/* ---------- live sessions: student side ---------- */
function presSession(s){const was=PR.sess;PR.sess=s;PR.sessOn=sessLive();
  if(s&&U&&U.sess&&U.sess[s.id]&&PR.sessOn&&ME.sid!==LECTURER&&!PR.joined){PR.joined=true;PR.st='';presSection()}
  if(PR.joined&&(!PR.sessOn||(was&&s&&was.id!==s.id))){const id=was&&was.id||s&&s.id;PR.joined=false;presClaim(id)}
  if(s&&!PR.sessOn&&U&&U.sess&&U.sess[s.id]&&!U.sess[s.id].c)presClaim(s.id);
  if(PR.sessOn&&document.querySelector('[aria-label="Take a break"]'))closeModal();
  sxFbSeen(s);presBar();if(typeof liveCardRefresh==='function')liveCardRefresh()}
function presBar(){let b=document.getElementById('livebar');const show=typeof ME!=='undefined'&&ME&&PR.sessOn;
  if(!show){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.id='livebar';b.setAttribute('role','status');const app=document.getElementById('app');app.parentNode.insertBefore(b,app)}
  const S=PR.sess,lect=ME.sid===LECTURER,dot={on:'🟢 On screen',idle:'🟡 Idle',away:'🔴 Away'}[PR.st]||'🟢 On screen';
  b.innerHTML=`<div class="wrap lbin"><span class="live"><i></i>LIVE</span>${!lect&&typeof lectAvHTML==='function'?lectAvHTML(26):''}<b>${esc(S.name)}</b>${lect?`<a class="btn sm" href="#/live">Open live board</a>`:PR.joined?`<span class="muted">You're joined · ${dot}</span>${(x=>x?`<span class="tag" id="lbxp">+${x.xp} XP this session</span>`:'')(sxMine())}<button class="btn ghost sm" id="lbinfo" aria-label="What is shared">ⓘ</button>`:`<button class="btn sm" id="lbjoin">Join</button>`}</div>`;
  if(!lect&&S.fb&&S.fb.length){const f=S.fb[S.fb.length-1];b.querySelector('.lbin').insertAdjacentHTML('beforeend',`<span class="lbfb" title="From your lecturer">💬 ${f.q?esc(f.q)+': ':''}${esc(f.m)}</span>`)}
  const j=$('#lbjoin');if(j)j.onclick=presJoinAsk;const i=$('#lbinfo');if(i)i.onclick=()=>presNote(false)}
function presNote(join){closeModal();const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Live session');
  m.innerHTML=`<div class="card"><button class="x" aria-label="Close">✕</button><div style="font-size:2.4rem;text-align:center">🔴</div><h2 style="text-align:center;margin:4px 0 8px">${esc(PR.sess?PR.sess.name:'Live session')}</h2>
  <p>While you're joined, your lecturer can see <b>whether this app is on your screen</b> and <b>which section you're on</b>. Nothing else is recorded. Tracking stops when the session ends.</p>
  <p class="muted" style="font-size:.88rem">Stay on screen for 85% of the session (at least 10 minutes joined) to earn <b>+${ST.FOCUS_XP} XP</b>.</p>
  <div class="row" style="justify-content:center">${join?`<button class="btn ghost" id="lnx">Not now</button><button class="btn" id="lok">Join session</button>`:`<button class="btn" id="lnx">OK</button>`}</div></div>`;
  document.body.append(m);m.querySelector('.x').onclick=closeModal;$('#lnx').onclick=closeModal;const ok=$('#lok');if(ok){ok.focus();ok.onclick=presJoin}}
const presJoinAsk=()=>presNote(true);
function presJoin(){closeModal();const S=PR.sess;if(!S||!sessLive())return;U.sess=U.sess||{};
  if(!U.sess[S.id])U.sess[S.id]={j:Date.now(),on:0,idle:0,away:0,left:0,lg:0,pr:[],c:0};
  PR.joined=true;PR.st='';PR.last=Date.now();save();presSection();presWrite(true);presBar();toast('🔴','Joined '+S.name,'Stay on screen to earn the focus bonus')}
function presSection(){const w=(typeof presWhere==='function'&&presWhere())||(document.querySelector('main h1')||{}).textContent||'Home';
  const sec=String(w).replace(/\s+/g,' ').trim().slice(0,60);if(sec!==PR.sec){PR.sec=sec;PR.secDirty=true}
  if(PR.joined&&U&&PR.sess&&U.sess&&U.sess[PR.sess.id]){const r=U.sess[PR.sess.id],a=sec.split(' · ')[0];if(a&&!r.pr.includes(a)&&r.pr.length<12)r.pr.push(a)}}
function presSessTick(now,dt,vis,active){const r=U.sess&&PR.sess&&U.sess[PR.sess.id];if(!r||!sessLive())return;
  const st=!vis?'away':active?'on':'idle';r[st]=(r[st]||0)+dt;
  if(st!==PR.st){if(st==='away'){r.left=(r.left|0)+1;PR.awayAt=now}if(PR.st==='away'&&PR.awayAt)r.lg=Math.max(r.lg|0,Math.round((now-PR.awayAt)/1000));
    PR.st=st;PR.stAt=now;r.ch=Math.round((now-r.j)/1000);presWrite(true);presBar();return}
  if(PR.st==='away'&&PR.awayAt)r.lg=Math.max(r.lg|0,Math.round((now-PR.awayAt)/1000));
  if(now-(PR.secChk||0)>=10000){PR.secChk=now;presSection()}
  if(PR.secDirty&&now-PR.secAt>=ST.SEC_MIN*1000)return presWrite(false);
  if(now-PR.wrote>=ST.BEAT*1000)presWrite(false)}
function presWrite(force,stOver){const S=PR.sess,r=S&&U.sess&&U.sess[S.id];if(!S||!r||!cloudOn()||!CLOUD.putPresence)return;const now=Date.now();
  if(!force&&now-PR.wrote<5000)return;PR.wrote=now;PR.secAt=now;PR.secDirty=false;
  const i=v=>Math.max(0,Math.round(v||0));
  CLOUD.putPresence(S.id,ME.sid,{st:stOver||PR.st||'on',sec:PR.sec||'',pr:(r.pr||[]).join(', ').slice(0,200),on:i(r.on),idle:i(r.idle),away:i(r.away),
    left:i(r.left),longest:i(r.lg),ch:i(r.ch),joinedAt:new Date(r.j)}).catch(()=>{});
  if(force)try{LS.set('u_'+ME.sid,U)}catch(e){}}
/* focus XP: from the student's own record of a session that has ended */
function presFocus(r){const tot=(r.on|0)+(r.idle|0)+(r.away|0);return {tot,pct:tot?Math.round((r.on|0)/tot*100):0}}
function presClaim(id){const r=id&&U.sess&&U.sess[id];if(!r||r.c)return;r.c=1;const f=presFocus(r);
  const ok=f.tot>=ST.FOCUS_MIN&&f.pct>=ST.FOCUS*100;
  if(ok)award('sessfocus:'+id,ST.FOCUS_XP,'Focused session: '+f.pct+'% on screen');
  else{save();toast('🔴','Session ended','You were on screen '+f.pct+'% of the time'+(f.tot<ST.FOCUS_MIN?' (under 10 minutes joined).':'.'))}}
async function presClaimOld(){if(!U||!U.sess)return;for(const id of Object.keys(U.sess)){const r=U.sess[id];if(r.c)continue;
  try{const s=await CLOUD.getSession(id);if(!s||!s.active||(s.endsAt&&Date.now()>s.endsAt))presClaim(id)}catch(e){}}}

/* ---------- live sessions: lecturer side ---------- */
let LIVEREF=null;
function liveCardHTML(){return cloudOn()?'<div class="card" id="lsess" style="margin-bottom:22px"><h2>🔴 Live tutorial session</h2><p class="muted" id="lschk">Checking…</p></div>':''}
/* weeks the lecturer can still run tutorials for; the earliest one without a past session is preselected */
const SESS_WEEKS=[11,12,13,14];
function sessWeekDefault(list){const used=new Set(list.map(s=>String(s.name||'')));const w=SESS_WEEKS.find(n=>!used.has('Week '+n+' tutorial'));return w||SESS_WEEKS[SESS_WEEKS.length-1]}
const SESS_RULES_MSG='<h2>🔴 Live tutorial session</h2><p>Live sessions aren\'t switched on in this Firebase project yet: the live-session rules haven\'t been published.</p><ol style="padding-left:1.2em;margin:6px 0"><li>Firebase console → <b>Firestore</b> → <b>Rules</b>.</li><li>Click in the editor, select all (<b>Ctrl+A</b> / <b>Cmd+A</b>) and delete.</li><li>Paste the <b>full</b> rules file, then click <b>Publish</b>.</li><li>Reload this page.</li></ol><p class="muted" style="font-size:.88rem;margin:0">Screen time, break reminders and everything else still work meanwhile.</p>';
function liveCardInit(){if(!document.getElementById('lsess'))return;PR.sessErr=0;PR.sessList=null;CLOUD.watchSessions(list=>{PR.sessErr=0;PR.sessList=list;liveCardRefresh();if(!PR.migr){PR.migr=1;sxMigrate(list)}},e=>{PR.sessErr=1;liveCardRefresh()})}
function liveCardRefresh(){const el=document.getElementById('lsess');if(!el||el.contains(document.activeElement)&&/^(INPUT|SELECT)$/.test(document.activeElement.tagName))return;
  if(PR.sessErr){el.innerHTML=SESS_RULES_MSG;return}
  if(PR.sessList==null){if(!$('#lschk'))el.innerHTML='<h2>🔴 Live tutorial session</h2><p class="muted" id="lschk">Checking…</p>';return}
  const S=PR.sess,list=PR.sessList||[],past=list.filter(s=>!(s.active&&(!s.endsAt||Date.now()<s.endsAt)));
  if(S&&S.active&&S.endsAt&&Date.now()>S.endsAt&&!S.rep)liveFinish(S.id);
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">🔴 Live tutorial session</h2>${sessLive()?'<span class="live"><i></i>LIVE</span>':''}</div>
  ${sessLive()?`<p style="margin:8px 0">Running: <b>${esc(S.name)}</b> · started ${S.startedAt?new Date(S.startedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'just now'} · ends automatically at ${new Date(S.endsAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>
    <div class="row"><a class="btn" href="#/live">Open live board</a><button class="btn red" id="lsend">■ End session</button></div>`
  :`<p class="muted" style="font-size:.9rem;margin:6px 0 10px">Start a session in class. Students see a banner and tap <b>Join</b>; you see who has the portal on screen and which section they're on. It ends automatically after ${ST.SESS_H} hours.</p>
    <div class="row"><select id="lsname" aria-label="Which week" style="flex:1;min-width:180px">${SESS_WEEKS.map(n=>`<option value="Week ${n} tutorial"${n===sessWeekDefault(list)?' selected':''}>Week ${n} tutorial${list.some(s=>s.name==='Week '+n+' tutorial')?' (run before)':''}</option>`).join('')}</select><button class="btn" id="lsgo">▶ Start session</button></div><div class="err" id="lserr"></div>`}
  <h3 style="margin-top:16px">Past sessions</h3>${past.length?`<ul class="sumlist">${past.slice(0,12).map(s=>`<li><a href="#/session/${esc(s.id)}">${esc(s.name)}</a> <span class="muted" style="font-size:.82rem">${s.startedAt?new Date(s.startedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):''}${s.nj!=null?' · '+s.nj+' joined':s.rep?' · '+Object.keys(s.rep).length+' joined':''}${s.refl?' · reflection ✓':''}</span></li>`).join('')}</ul>`:'<p class="muted">No sessions yet.</p>'}`;
  const go=$('#lsgo');if(go)go.onclick=async()=>{const n=$('#lsname').value||'Week '+sessWeekDefault(list)+' tutorial';go.disabled=true;try{await CLOUD.startSession(n,ST.SESS_H);toast('🔴','Session started',n)}catch(e){$('#lserr').textContent=CLOUD.say(e);go.disabled=false}};
  const en=$('#lsend');if(en)en.onclick=()=>{if(confirm('End "'+S.name+'" now? Students stop being tracked and the report is saved.'))liveFinish(S.id)}}
const LIVE_LBL={on:'🟢 On screen',idle:'🟡 Idle',away:'🔴 Left the app',off:'⚫ Offline'};
function liveRow(p,now){const off=!p.t||now-p.t>ST.OFF*1000,st=off&&p.st!=='off'?'off':p.st,tot=(p.on|0)+(p.idle|0)+(p.away|0);
  return Object.assign({},p,{s:st,pct:tot?Math.round((p.on|0)/tot*100):0,chAt:p.joinedAt!=null?p.joinedAt+(p.ch|0)*1000:p.t})}
async function liveFinish(id){if(liveFinish.busy)return;liveFinish.busy=1;try{const ps=await CLOUD.presenceOnce(id),now=Date.now(),names=await liveNames();const rep={};
  ps.forEach(p=>{const r=liveRow(p,now);rep[p.id]={n:(names[p.id]||'').slice(0,60),on:r.on|0,idle:r.idle|0,away:r.away|0,left:r.left|0,lg:r.longest|0,pct:r.pct,pr:String(r.pr||'').slice(0,200)}});
  const S=(PR.sessList||[]).find(s=>s.id===id)||(PR.sess&&PR.sess.id===id?PR.sess:null);try{if(S)sxRepAdd(rep,Object.assign({},S,{endedAt:now}),await usersOnce(),ps)}catch(e){console.warn('Session XP not added',e)}
  if(S&&await sessR3()){const users=await usersOnce(),o=await sxPublish(Object.assign({},S,{endedAt:now}),rep,users,ps);await CLOUD.endSession2(id,{nj:o.nj,refl:o.refl})}
  else await CLOUD.endSession(id,rep);toast('■','Session ended','Report saved: '+Object.keys(rep).length+' joined')}catch(e){toast('⚠️','Could not end the session',CLOUD.say(e))}finally{liveFinish.busy=0}}
let LIVE_NAMES=null,LIVE_USERS=null;
const usersOnce=()=>new Promise(res=>{let d=0;CLOUD.watchUsers(l=>{if(!d){d=1;res(l)}},()=>{if(!d){d=1;res([])}})});
function liveNames(){return new Promise(res=>{if(LIVE_NAMES)return res(LIVE_NAMES);let done=false;CLOUD.watchUsers(list=>{LIVE_NAMES={};LIVE_USERS=list;list.forEach(x=>LIVE_NAMES[x.id]=x.name||'');if(!done){done=true;res(LIVE_NAMES)}},()=>{if(!done){done=true;res({})}})})}
const csvDownload=(rows,name)=>{const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download=name;a.click()};
function livePage(){if(ME.sid!==LECTURER)return home();if(!cloudOn())return shell('#/lecturer','<div class="callout">Live sessions need the live connection.</div>');
  shell('#/lecturer',`<div class="row" style="justify-content:space-between;align-items:center"><a href="#/lecturer">← Lecturer</a><button class="btn ghost sm" id="lvproj" data-lect>⛶ Projector view</button></div><div id="lvb" style="margin-top:10px"><p class="muted">Loading…</p></div><div class="card" id="lvfc" data-lect style="margin-top:16px"><h2>💬 Send live feedback</h2><div id="lvfcb"><p class="muted">Checking…</p></div></div>`);
  let P=[],USERS=null,sort={k:'s',d:1},allM=false,fcOn=false;const order={away:0,off:1,idle:2,on:3};
  $('#lvproj').onclick=()=>{const on=document.body.classList.toggle('proj');$('#lvproj').textContent=on?'✕ Exit projector view':'⛶ Projector view'};
  addEventListener('hashchange',function off(){document.body.classList.remove('proj');removeEventListener('hashchange',off)});
  CLOUD.watchUsers(l=>{USERS=l;draw()},()=>{});
  const draw=()=>{const el=$('#lvb');if(!el)return;const S=PR.sess;
    if(!S){el.innerHTML='<div class="card"><h2>No live session</h2><p class="muted">Start one from the Lecturer tab.</p></div>';return}
    const now=Date.now(),names={},UU={};(USERS||[]).forEach(u=>{names[u.id]=u.name;UU[u.id]=u.u});
    const rows=P.map(p=>{const x=USERS?sessXP(UU[p.id],S,p.joinedAt):null;return Object.assign(liveRow(p,now),{name:names[p.id]||p.id,sxo:x,sx:x?x.xp:null})});
    const sxTot=rows.reduce((t,r)=>t+(r.sx|0),0),sxEst=rows.some(r=>r.sxo&&r.sxo.est),sxTop=rows.filter(r=>r.sx>0).sort((a,b)=>b.sx-a.sx).slice(0,3);
    const k=sort.k,cmp=(a,b)=>k==='name'?a.name.localeCompare(b.name):k==='s'?order[a.s]-order[b.s]:(a[k]||0)-(b[k]||0);rows.sort((a,b)=>cmp(a,b)*sort.d);
    const total=(typeof ROSTER!=='undefined'?ROSTER.hashes.length-1:rows.length),cnt=s=>rows.filter(r=>r.s===s).length;
    const not=(USERS||[]).filter(u=>u.id!==LECTURER&&!P.some(p=>p.id===u.id)).map(u=>u.name||u.id).sort();
    const th=(key,l)=>`<th data-sk="${key}" class="click" aria-sort="${sort.k===key?(sort.d>0?'ascending':'descending'):'none'}">${l}${sort.k===key?(sort.d>0?' ▲':' ▼'):''}</th>`;
    const st=USERS?sessStats(P.map(p=>({id:p.id,u:UU[p.id],join:p.joinedAt})),S):null;rows.forEach(r=>{const x=st&&st.per[r.id];r.sc=x?x.sc:null});
    el.innerHTML=`<div class="card sxpanel" id="lvpan"><div class="row" style="justify-content:space-between"><h2 style="margin:0">📊 ${esc(S.name)}: live feedback</h2>${sessLive()?'<span class="live"><i></i>LIVE</span>':''}</div>${sxPanelHTML(st,allM)}</div>
    <div class="card" id="lvmain" style="margin-top:16px"><div class="row" style="justify-content:space-between"><h1 style="margin:0">${esc(S.name)}</h1>${sessLive()?'<span class="live"><i></i>LIVE</span>':'<span class="tag">Ended</span>'}</div>
    <div class="stats" style="margin:12px 0"><div class="stat"><b>${rows.length}/${total}</b><span>joined</span></div><div class="stat"><b>${cnt('on')}</b><span>🟢 on screen</span></div><div class="stat"><b>${cnt('idle')}</b><span>🟡 idle</span></div><div class="stat"><b>${cnt('away')+cnt('off')}</b><span>🔴 away or ⚫ offline</span></div><div class="stat"><b>${sxEst?'≈ ':''}+${sxTot}</b><span>XP this session</span></div></div>
    ${sxTop.length?`<p style="margin:0 0 10px"><b>🏆 Session leaders:</b> ${sxTop.map((r,i)=>['🥇','🥈','🥉'][i]+' '+esc(r.name)+' <b>'+(r.sxo.est?'≈ ':'')+'+'+r.sx+'</b>').join(' · ')}</p>`:''}
    <div class="tablewrap"><table class="wide"><tr>${th('s','Status')}${th('name','Student')}${th('sx','XP this session')}${th('sc','Score')}${th('pct','On screen')}${th('idle','Idle')}${th('left','Times left')}${th('longest','Longest away')}${th('chAt','Last change')}<th>Section now</th><th>Practised</th></tr>
    ${rows.map(r=>`<tr class="click" data-sid="${esc(r.id)}"><td style="white-space:nowrap">${LIVE_LBL[r.s]||r.s}</td><td>${esc(r.name)}<div class="muted" style="font-size:.78rem">${esc(r.id)}</div></td><td>${sxCell(r.sxo)}${r.sxo&&!r.sxo.est&&sxActs(r.sxo.acts)?`<div class="muted" style="font-size:.74rem">${esc(sxActs(r.sxo.acts,3))}</div>`:''}</td><td>${r.sc==null?'–':r.sc+'%'}</td><td><b>${r.pct}%</b></td><td>${stFmt(r.idle|0)}</td><td>${r.left|0}</td><td>${stFmt(r.longest|0)}</td><td>${r.chAt?ago(new Date(r.chAt)):'–'}</td><td style="font-size:.85rem">${esc(r.sec||'')}</td><td style="font-size:.8rem">${esc(r.pr||'')}</td></tr>`).join('')||'<tr><td colspan="11" class="muted">Nobody has joined yet.</td></tr>'}</table></div>
    <h3 style="margin-top:14px">Not joined (${not.length}${total>(USERS||[]).length-1?` + ${Math.max(0,total-((USERS||[]).filter(u=>u.id!==LECTURER).length))} not signed up`:''})</h3><p style="font-size:.9rem">${not.map(esc).join(', ')||'–'}</p>
    <p class="muted" style="font-size:.8rem">On screen = the portal is open and in use. Idle = open but untouched for 2+ minutes. Left the app = switched app or tab, or locked the screen. Offline = no check-in for 5+ minutes. These are signals, not proof. XP this session counts XP since each student joined; ≈ marks an estimate from whole hours (devices not yet on the exact record).</p>
    <div class="row" style="margin-top:10px">${sessLive()?'<button class="btn red" id="lvend">■ End session</button>':''}<a class="btn ghost" href="#/session/${esc(S.id)}">Report</a></div></div>`;
    el.querySelectorAll('[data-sk]').forEach(h=>h.onclick=()=>{sort=sort.k===h.dataset.sk?{k:sort.k,d:-sort.d}:{k:h.dataset.sk,d:h.dataset.sk==='name'||h.dataset.sk==='s'?1:-1};draw()});
    const sa=$('#sxall');if(sa)sa.onclick=()=>{allM=!allM;draw()};
    if(!fcOn){fcOn=true;sessR3().then(ok=>{const b=$('#lvfcb');if(!b)return;b.innerHTML=sxFbBox(PR.sess||S,ok);const go=$('#sxfs');if(go){go.onclick=()=>sxFbSend(PR.sess||S);$('#sxfm').onkeydown=e=>{if(e.key==='Enter')sxFbSend(PR.sess||S)}}})}
    else{const fl=$('#sxfl');if(fl)fl.innerHTML=sxFbList((PR.sess||S).fb)}
    el.querySelectorAll('tr[data-sid]').forEach(r=>r.onclick=()=>openStudent(r.dataset.sid));
    const e=$('#lvend');if(e)e.onclick=()=>{if(confirm('End "'+S.name+'" now?'))liveFinish(S.id)}};
  const watch=()=>{if(!PR.sess)return draw();CLOUD.watchPresence(PR.sess.id,ps=>{P=ps;draw()},err=>{const el=$('#lvb');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(err))}</p>`})};
  watch();const iv=setInterval(()=>{if(!document.getElementById('lvb'))return clearInterval(iv);draw()},15000)}
/* ---------- XP and activity per live session ----------
   U.al: a timestamped log of every award from this version on: [seconds, key, xp]; 45 days and at most 2,500 entries kept
   (about 100 KB). U.alSince = when this device started logging, so older sessions are known to need the estimate.
   A student's session window runs from the later of the session start and their join time to the end (or now, while live).
   XP in session = the XP logged inside that window plus the session's focus bonus (claimed after the end, so found by key).
   Sessions from before U.al fall back to U.xph (XP per hour, kept 21 days): marked "≈" (estimate, whole hours) with no breakdown. */
const AL={KEEP:45*864e5,MAX:2500};
function alAdd(key,xp){if(typeof U==='undefined'||!U||!xp||VIEWAS)return;const now=Date.now();U.al=U.al||[];U.alSince=U.alSince||now;
  U.al.push([Math.round(now/1000),key==null?'mission':String(key).slice(0,60),xp|0]);
  const cut=Math.round((now-AL.KEEP)/1000);let i=0;while(i<U.al.length&&U.al[i][0]<cut)i++;if(i)U.al.splice(0,i);if(U.al.length>AL.MAX)U.al.splice(0,U.al.length-AL.MAX)}
const alStart=()=>{if(typeof U!=='undefined'&&U&&!VIEWAS&&ME&&ME.sid!==LECTURER){if(!U.alSince)U.alSince=Date.now();if(!U.qaSince)U.qaSince=Date.now()}};
/* registered from presOn(): this file loads before core.js defines onHook */
function alHooks(){if(alHooks.done)return;alHooks.done=1;onHook('award',(key,xp)=>{alAdd(key,xp);if(PR.joined)setTimeout(presBar,0)});
  onHook('checkin',xp=>alAdd('checkin:'+today(),xp));onHook('cloud',alStart)}
/* U.qa: every practice answer from this version on: [seconds, question id, ok (1/0, or a score 0-1), what was picked]; 45 days, at most 3,000.
   U.qaSince = when this device started logging. Session analytics (lecturer live board, reflections) come from it. */
const ANS={KEEP:45*864e5,MAX:3000};
function ansLog(qid,ok,pick){if(typeof U==='undefined'||!U||VIEWAS||!ME||ME.sid===LECTURER||qid==null)return;const now=Date.now();U.qa=U.qa||[];U.qaSince=U.qaSince||now;
  const v=typeof ok==='boolean'?+ok:Math.max(0,Math.min(1,Math.round((+ok||0)*100)/100));U.qa.push([Math.round(now/1000),String(qid).slice(0,40),v,pick==null?'':typeof pick==='number'?pick:String(pick).slice(0,12)]);
  const cut=Math.round((now-ANS.KEEP)/1000);let i=0;while(i<U.qa.length&&U.qa[i][0]<cut)i++;if(i)U.qa.splice(0,i);if(U.qa.length>ANS.MAX)U.qa.splice(0,U.qa.length-ANS.MAX)}
/* award key prefix → activity category; * = a bonus on top of an activity already counted (XP only, not counted again) */
const SX_MAP={mcq:'mcq',mcqr:'mcq',mqs:'mset',plan:'plan',perfect:'plan*',chip:'chip',typed:'typed',timed:'timed',ltimed:'timed',catimed:'timed',essay:'timed',
  check:'check',lmark:'check',cacheck:'check',emark:'check',fc:'fc',rev:'rev',notes:'notes',read:'case',readall:'case*',casedone:'case*',actdone:'case',argue:'case',
  verdict:'case',ca:'case',cadone:'case*',ess:'essay',eplan:'essay*',script:'essay',pp:'paper',ch:'chal',wk:'chal',wkteam:'chal*',bt:'chal',btp:'chal*',
  wild:'wild',wildwin:'wild*',review:'marked',stgoal:'st',stblock:'st',sessfocus:'focus',checkin:'daily',mission:'daily',avatar:'other'};
const SX_CAT={mcq:['MCQ','MCQs'],mset:['MCQ set','MCQ sets'],plan:['plan','plans'],chip:['paragraph','paragraphs'],typed:['typed answer','typed answers'],
  timed:['timed answer','timed answers'],check:['self-check','self-checks'],fc:['flashcard','flashcards'],rev:['review','reviews'],notes:['notes topic','notes topics'],
  case:['case task','case tasks'],essay:['essay step','essay steps'],paper:['practice paper answer','practice paper answers'],chal:['challenge','challenges'],
  wild:['weekly challenge','weekly challenges'],marked:['marked answer','marked answers'],st:['screen-time bonus','screen-time bonuses'],
  daily:['daily bonus','daily bonuses'],focus:['focus bonus','focus bonus'],other:['other','other']};
const SX_BONUS=new Set(['st','daily','marked','focus']);/* XP that isn't practice done in the session */
function sxCat(key){const m=SX_MAP[String(key).split(':')[0]]||'other';return {c:m.replace('*',''),n:!m.endsWith('*')}}
/* the window [a, b] in ms for one student and one session (join = their join time, if known) */
function sxWin(S,join,now){now=now||Date.now();const a=Math.max(S.startedAt||0,join||0),live=S.active&&(!S.endsAt||now<S.endsAt);
  return {a,b:S.endedAt||(live?now:Math.min(now,S.endsAt||now)),live}}
/* one student's XP and activity in a session: {xp, fx, acts:{cat:n}, cx:{cat:xp}, tl:[[ms,key,xp]], est, src} or null when unknown.
   rep = the row saved when the session ended (its xp/acts are used when the log no longer covers the window) */
function sessXP(u,S,join,rep){u=u||{};join=join||(u.sess&&u.sess[S.id]&&u.sess[S.id].j)||(rep&&rep.j)||0;const w=sxWin(S,join),fk='sessfocus:'+S.id,fx=((u.gain||{})[fk])|0;
  if(u.alSince&&u.alSince<=w.a&&w.a>=Date.now()-AL.KEEP){const acts={},cx={},tl=[];let xp=0;
    (u.al||[]).forEach(([t,k,x])=>{t*=1000;if(t<w.a||t>w.b||k===fk)return;const c=sxCat(k);xp+=x;cx[c.c]=(cx[c.c]|0)+x;if(c.n)acts[c.c]=(acts[c.c]|0)+1;tl.push([t,k,x])});
    return {xp:xp+fx,fx,acts,cx,tl,est:false,src:'log'}}
  if(rep&&rep.xp!=null){const f=Math.max(rep.fx|0,fx);return {xp:(rep.xp|0)+f,fx:f,acts:rep.acts||{},cx:{},tl:[],est:!!rep.est,src:'saved'}}
  const H=u.xph||{};if(!Object.keys(H).length||typeof mvHour!=='function')return null;
  const ha=mvHour(w.a),hb=mvHour(w.b),oldest=Object.keys(H).sort()[0];if(oldest>hb)return null;
  let xp=0;Object.entries(H).forEach(([h,x])=>{if(h>=ha&&h<=hb)xp+=x|0});
  return {xp:Math.max(xp,fx),fx,acts:{},cx:{},tl:[],est:true,src:'hourly'}}
/* "12 MCQs · 2 plans · 1 paragraph" (practice only; bonuses are shown on their own) */
function sxActs(acts,max){const e=Object.entries(acts||{}).filter(([c,n])=>n&&!SX_BONUS.has(c)).sort((a,b)=>b[1]-a[1]);
  return e.slice(0,max||9).map(([c,n])=>n+' '+(SX_CAT[c]||SX_CAT.other)[n===1?0:1]).join(' · ')}
const sxXP=r=>r?(r.est?'≈ ':'')+r.xp+' XP':'–';
const sxCell=x=>x==null?'–':`<b>${x.est?'≈ ':''}+${x.xp}</b>`;
const sxTime=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Indian/Maldives'});
function sxTimeline(r){if(!r||!r.tl.length)return '';return `<details class="sxtl" data-lect=""><summary>Timeline (${r.tl.length})</summary><ol>${r.tl.map(([t,k,x])=>{const c=sxCat(k).c;
  return `<li><span class="muted">${sxTime(t)}</span> ${esc((SX_CAT[c]||SX_CAT.other)[0])} <span class="muted">${esc(String(k).split(':').slice(1,2).join(''))}</span> <b>+${x}</b></li>`}).join('')}</ol></details>`}
/* the joined student's own bar counter, from their own log */
function sxMine(){if(!PR.joined||!PR.sess||!U||!U.sess||!U.sess[PR.sess.id])return null;return sessXP(U,PR.sess,U.sess[PR.sess.id].j)}
/* rows saved at the end of a session: add xp / fx / acts / j from the users docs the lecturer can read */
function sxRepAdd(rep,S,users,ps){const by={};(users||[]).forEach(x=>by[x.id]=x.u);const jn={};(ps||[]).forEach(p=>jn[p.id]=p.joinedAt);
  Object.keys(rep).forEach(sid=>{const r=sessXP(by[sid],Object.assign({},S,{endedAt:S.endedAt||Date.now()}),jn[sid]);if(jn[sid])rep[sid].j=jn[sid];
    if(r){rep[sid].xp=r.xp-r.fx;rep[sid].fx=r.fx;rep[sid].acts=Object.fromEntries(Object.entries(r.acts).slice(0,20));if(r.est)rep[sid].est=1}});return rep}

/* ---------- session analytics, live feedback, reflections, attendance ----------
   Newer rules ("r3", probed by reading sessions/_probe/me/<own ID>) allow: nj / fb / refl on the session doc (lecturer writes),
   sessions/{id}/lect/{rep|att} (lecturer only: the per-student rows and attendance overrides) and sessions/{id}/me/{SID}
   (that student's own stats; only they and the lecturer read it). On the older rules everything here that writes stays hidden. */
async function sessR3(){if(PR.r3!=null)return PR.r3;if(!cloudOn())return PR.r3=false;try{await CLOUD.get('sessions/_probe/me/'+ME.sid);PR.r3=true}catch(e){PR.r3=false}return PR.r3}
/* a question by id, from whatever bank holds it: {q, ans, opt(pick), top, href} */
function qInfo(id){id=String(id);const num=s=>{const m=/(?:Topic|Week)\s*(\d+)/i.exec(s||'');return m?+m[1]:0};
  const wd=typeof notesCfg==='function'&&typeof notesOK==='function'&&notesOK()?notesCfg().word:(CRS.id==='mkt301'?'Week':'Topic');
  const fin=(q,ans,top,n,opt)=>({q:String(q||id),ans:String(ans||''),top:top||'Other practice',opt:opt||(()=>''),href:n&&typeof notesHref==='function'?notesHref({t:n,week:n},{}):''});
  if(id.startsWith('v:'))return fin('Case verdict: '+id.slice(2),'','Case verdicts');
  if(id.startsWith('fc:'))return fin('Flashcard: '+id.slice(3),'','Flashcards');
  let it=null;try{it=typeof wildItem==='function'?wildItem(id):null}catch(e){}
  if(it&&it.kind==='chips'){const n=+it.topic||num(it.label),best=(it.paths&&it.paths[0]||[]).map(j=>it.chips[j]&&it.chips[j].t).filter(Boolean).join(' → ');return fin(it.q,best,n?wd+' '+n:'Paragraphs',n)}
  if(it&&it.o){const n=num(it.label);return fin(it.q,it.o[0],n?wd+' '+n:(it.label||'').split(':')[0]||'Quick questions',n,j=>it.o[j]==null?'':it.o[j])}
  const e=typeof qIndex==='function'?qIndex()[id]:null;if(e&&e.q){const n=+(e.q.t||e.q.week)||num(e.label);return fin(e.q.q,(e.q.chips||[]).filter(c=>c.g).map(c=>c.t).slice(0,4).join('; '),n?wd+' '+n:(e.label||'').split(':')[0],n)}
  return fin(id,'','Other practice')}
/* one student's answers inside their session window, or null if their device wasn't logging answers yet */
function sxAns(u,S,join){u=u||{};join=join||(u.sess&&u.sess[S.id]&&u.sess[S.id].j)||0;const w=sxWin(S,join);if(!u.qaSince||u.qaSince>w.a)return sxDay(u,w);
  return (u.qa||[]).filter(x=>{const t=x[0]*1000;return t>=w.a&&t<=w.b})}
/* before the answer log: the session day's practice (≈). MCQs from U.mday (that day's question ids; right = an mcq:<id>:<day> award, so
   rushed right answers count as wrong), plans from plan:<id>:<day> awards (topics only, no score). Null if nothing from that day. */
function sxDay(u,w){const d=new Date(w.a+5*36e5).toISOString().slice(0,10),L=u.log||{},o=[],t=Math.round(w.a/1000);
  if(u.mday&&u.mday.d===d)Object.keys(u.mday.ids||{}).forEach(id=>o.push([t,id,L['mcq:'+id+':'+d]?1:0,'']));
  Object.keys(L).forEach(k=>{const m=/^plan:(.+):(\d{4}-\d{2}-\d{2})$/.exec(k);if(m&&m[2]===d)o.push([t,m[1],null,'plan'])});
  if(!o.length)return null;o.est=true;return o}
/* rows: [{id, u, join}] → class figures for the session */
function sessStats(rows,S){const Q={},per={},top={};let tot=0,sum=0,cover=0,miss=0;
  let est=false;rows.forEach(r=>{const a=sxAns(r.u,S,r.join);if(!a){miss++;return}cover++;if(a.est)est=true;const seen=new Set();let s=0,ns=0;
    a.forEach(([t,q,ok,p])=>{const I=qInfo(q);top[I.top]=(top[I.top]|0)+1;if(ok==null)return;s+=ok;ns++;tot++;sum+=ok;if(seen.has(q))return;seen.add(q);
      const e=Q[q]||(Q[q]={id:q,n:0,w:0,picks:{}});e.n++;if(ok<.5){e.w++;if(p!==''&&p!=null&&typeof p==='number')e.picks[p]=(e.picks[p]|0)+1}});
    per[r.id]={n:ns,sc:ns?Math.round(s/ns*100):null,miss:[...new Set(a.filter(x=>x[2]!=null&&x[2]<.5).map(x=>x[1]))],est:!!a.est}});
  const qs=Object.values(Q).map(e=>Object.assign(e,{pw:Math.round(e.w/e.n*100)})),need=Math.min(2,cover);
  return {avg:tot?Math.round(sum/tot*100):null,n:tot,per,cover,miss,est,missed:qs.filter(e=>e.w).sort((a,b)=>b.pw-a.pw||b.n-a.n),
    right:qs.filter(e=>e.n>=need&&e.pw<=20).sort((a,b)=>b.n-a.n||a.pw-b.pw),topics:Object.entries(top).sort((a,b)=>b[1]-a[1])}}
const sxPick=e=>{const k=Object.entries(e.picks||{}).sort((a,b)=>b[1]-a[1])[0];return k?qInfo(e.id).opt(+k[0]):''};
/* the live feedback panel (lecturer, #/live): figures, most missed, mostly right, topics */
function sxPanelHTML(st,all){if(!st)return '<p class="muted">Loading answers…</p>';const M=st.missed,top=all?M:M.slice(0,5);
  return `<div class="stats" style="margin:8px 0"><div class="stat"><b>${st.avg==null?'–':(st.est?'≈ ':'')+st.avg+'%'}</b><span>average score</span></div><div class="stat"><b>${st.n}</b><span>answers</span></div><div class="stat"><b>${M.length}</b><span>questions missed</span></div></div>
  ${st.est?'<p class="muted" style="font-size:.8rem;margin:0 0 8px"><b>≈ Based on the day\'s practice:</b> some students\' devices weren\'t logging single answers yet, so their MCQs of that day count (a right answer given too fast counts as wrong) and their plans count towards topics.</p>':''}
  ${st.miss?`<p class="muted" style="font-size:.8rem;margin:0 0 8px">Answer details from ${st.cover} of ${st.cover+st.miss} joined students: the others haven't opened the updated site since this session started (their XP is an estimate, ≈).</p>`:''}
  <h3>❌ Most missed</h3>${top.length?`<ol class="sxq">${top.map(e=>{const I=qInfo(e.id),p=sxPick(e);return `<li><b>${esc(I.q)}</b><div class="muted">${e.pw}% wrong · ${e.n} tried${I.ans?` · <span class="ok">Correct: ${esc(I.ans)}</span>`:''}${p?` · most common wrong pick: “${esc(p)}”`:''}</div></li>`}).join('')}</ol>${M.length>5?`<button class="btn ghost sm" id="sxall">${all?'Show fewer ▴':'Show all '+M.length+' ▾'}</button>`:''}`:'<p class="muted">Nothing missed yet.</p>'}
  <h3>✅ Most got right (80%+)</h3>${st.right.length?`<ul class="sxq">${st.right.slice(0,6).map(e=>`<li>${esc(qInfo(e.id).q)} <span class="muted">· ${100-e.pw}% right of ${e.n}</span></li>`).join('')}</ul>`:'<p class="muted">Not enough answers yet.</p>'}
  <h3>📚 Topics practised</h3>${st.topics.length?`<p>${st.topics.slice(0,8).map(([t,n])=>`<span class="tag">${esc(t)} · ${n}</span>`).join(' ')}</p>`:'<p class="muted">None yet.</p>'}`}
/* live feedback: the lecturer sends short messages; students see them at once */
function sxFbList(fb){return (fb||[]).slice().reverse().map(f=>`<li><span class="muted">${sxTime(f.t)}</span> ${f.q?`<span class="tag">${esc(f.q)}</span> `:''}${esc(f.m)}</li>`).join('')}
function sxFbBox(S,ok){if(!ok)return '<p class="muted" style="font-size:.85rem">Live feedback needs the newest rules: publish them, then reload.</p>';
  return `<div class="row"><input id="sxfm" maxlength="200" placeholder="Short message to students, e.g. remember levels count intermediaries" style="flex:2;min-width:200px" aria-label="Feedback message"><input id="sxfq" maxlength="40" placeholder="Question id (optional)" style="flex:1;min-width:120px" aria-label="Question"><button class="btn" id="sxfs">Send</button></div><ul class="sxfb" id="sxfl">${sxFbList(S.fb)}</ul>`}
async function sxFbSend(S){const m=($('#sxfm').value||'').trim().slice(0,200),q=($('#sxfq').value||'').trim().slice(0,40);if(!m)return;
  const fb=(S.fb||[]).concat({t:Date.now(),m,q}).slice(-60);try{await CLOUD.put('sessions/'+S.id,{fb},true);S.fb=fb;$('#sxfm').value='';$('#sxfq').value='';$('#sxfl').innerHTML=sxFbList(fb);toast('💬','Sent to students',m)}catch(e){toast('⚠️','Not sent',CLOUD.say(e))}}
/* students: new messages arrive with the session doc */
function sxFbSeen(s){if(!s||!ME||ME.sid===LECTURER||VIEWAS)return;const fb=s.fb||[];if(PR.fbS!==s.id){PR.fbS=s.id;PR.fbT=Date.now()-10*60e3}
  fb.filter(f=>f.t>PR.fbT).forEach(f=>toast('💬','From your lecturer',(f.q?f.q+': ':'')+f.m));if(fb.length)PR.fbT=Math.max(PR.fbT,...fb.map(f=>f.t))}
/* the reflection and each student's own stats, built when the session ends (or later from the report) */
function sxReflect(S,st,xps){const ar=(st?st.missed:[]).slice(0,5).map(e=>{const I=qInfo(e.id);return {id:e.id,q:I.q.slice(0,200),a:I.ans.slice(0,200),p:e.pw,h:I.href}}),
  sr=(st?st.right:[]).slice(0,5).map(e=>({id:e.id,q:qInfo(e.id).q.slice(0,200),p:100-e.pw}));
  return {est:st&&st.est?1:0,cov:(st?st.topics:[]).slice(0,8),avg:st?st.avg:null,xp:xps.length?Math.round(xps.reduce((t,x)=>t+x,0)/xps.length):null,nj:xps.length,str:sr,ar,note:(S.refl&&S.refl.note)||'',at:Date.now()}}
async function sxPublish(S,rep,users,ps){const jn={};(ps||[]).forEach(p=>jn[p.id]=p.joinedAt);const by={};(users||[]).forEach(x=>by[x.id]=x.u);
  const ids=Object.keys(rep),st=sessStats(ids.map(id=>({id,u:by[id],join:jn[id]||rep[id].j})),S),xps=[];
  const me={};ids.forEach(id=>{const r=rep[id],x=sessXP(by[id],S,jn[id]||r.j,r),p=st.per[id];if(x)xps.push(x.xp);
    me[id]={j:jn[id]||r.j||null,on:r.on|0,pct:r.pct|0,xp:x?x.xp:null,est:x&&x.est?1:0,sest:p&&p.est?1:0,sc:p?p.sc:null,n:p?p.n:0,miss:p?p.miss.slice(0,12):[]}});
  const refl=sxReflect(S,st,xps);
  await CLOUD.put('sessions/'+S.id+'/lect/rep',{rows:rep},true);
  await Promise.all(ids.map(id=>CLOUD.put('sessions/'+S.id+'/me/'+id,me[id]).catch(()=>{})));
  return {refl,nj:ids.length}}
/* older sessions keep their rows on the session doc (visible to the class): copy them to lect/rep, check, then remove them */
async function sxMigrate(list){if(!(await sessR3()))return;for(const s of list||[]){if(!s.rep||s.active&&(!s.endsAt||Date.now()<s.endsAt))continue;
  try{await CLOUD.put('sessions/'+s.id+'/lect/rep',{rows:s.rep},true);const chk=await CLOUD.get('sessions/'+s.id+'/lect/rep');
    if(chk&&chk.rows&&Object.keys(chk.rows).length===Object.keys(s.rep).length)await CLOUD.put('sessions/'+s.id,{rep:CLOUD.noField(),nj:Object.keys(s.rep).length},true)}catch(e){console.warn('Session rows not moved',e)}}}
/* the report's rows: the session doc's (older) or lect/rep */
async function sxRep(S){if(S.rep)return S.rep;if(!(await sessR3()))return null;try{const d=await CLOUD.get('sessions/'+S.id+'/lect/rep');return d&&d.rows||null}catch(e){return null}}
/* attendance: Present (on screen 50%+), Late (joined 10+ minutes after the start), Partial, Absent; the lecturer's overrides win */
function sxAtt(r,S,ov){if(ov==='p')return ['Present','m'];if(ov==='a')return ['Absent','m'];if(!r)return ['Absent',''];
  const late=r.j&&S.startedAt&&r.j-S.startedAt>=10*60e3;return [(r.pct|0)>=50?(late?'Late':'Present'):'Partial','']}
function sxAttHTML(S,rep,dir,ov,f,sort,ok){const rows=(dir.length?dir:Object.keys(rep).map(id=>({id,n:rep[id].n||id,g:''}))).map(d=>{const r=rep[d.id],a=sxAtt(r,S,ov[d.id]);
    return {id:d.id,n:d.n||d.id,g:typeof secLabel==='function'?secLabel(d.g||''):(d.g||''),r,st:a[0],m:a[1],j:r&&r.j?sxTime(r.j):'–',min:r?Math.round((r.on|0)/60):0,pct:r?r.pct|0:0}});
  Object.keys(rep).forEach(id=>{if(!rows.some(x=>x.id===id)){const a=sxAtt(rep[id],S,ov[id]);rows.push({id,n:rep[id].n||id,g:'',r:rep[id],st:a[0],m:a[1],j:rep[id].j?sxTime(rep[id].j):'–',min:Math.round((rep[id].on|0)/60),pct:rep[id].pct|0})}});
  const ord={Present:0,Late:1,Partial:2,Absent:3},sh=rows.filter(x=>!f||x.st===f).sort((a,b)=>sort==='st'?ord[a.st]-ord[b.st]||a.n.localeCompare(b.n):sort==='g'?a.g.localeCompare(b.g)||a.n.localeCompare(b.n):a.n.localeCompare(b.n));
  const cnt=k=>rows.filter(x=>x.st===k).length;
  return {rows,html:`<div class="row" style="align-items:center;margin:6px 0"><span class="tag">Present ${cnt('Present')}</span><span class="tag">Late ${cnt('Late')}</span><span class="tag">Partial ${cnt('Partial')}</span><span class="tag">Absent ${cnt('Absent')}</span></div>
  <div class="row" style="margin:6px 0"><select id="atf" aria-label="Filter">${['','Present','Late','Partial','Absent'].map(k=>`<option value="${k}"${f===k?' selected':''}>${k||'Everyone'}</option>`).join('')}</select><select id="ats" aria-label="Sort">${[['n','Name'],['st','Status'],['g','Section']].map(([k,l])=>`<option value="${k}"${sort===k?' selected':''}>Sort: ${l}</option>`).join('')}</select><button class="btn ghost sm" id="atcp">📋 Copy present names</button><button class="btn ghost sm" id="atcsv">⬇ Attendance CSV</button></div>
  <div class="tablewrap"><table><tr><th>Student</th><th>Section</th><th>Status</th><th>Joined</th><th>Minutes</th><th>On screen</th><th>Override</th></tr>${sh.map(x=>`<tr data-att="${esc(x.id)}"><td>${esc(x.n)}<div class="muted" style="font-size:.76rem">${esc(x.id)}</div></td><td>${esc(x.g)}</td><td><b>${x.st}</b>${x.m?' <span class="muted" style="font-size:.74rem">(set by you)</span>':''}</td><td>${x.j}</td><td>${x.r?x.min:'–'}</td><td>${x.r?x.pct+'%':'–'}</td><td>${ok?`<button class="btn ghost sm" data-ov="${esc(x.id)}">${ov[x.id]==='p'?'✓ Present':ov[x.id]==='a'?'✗ Absent':'Auto'}</button>`:'–'}</td></tr>`).join('')}</table></div>
  ${ok?'<p class="muted" style="font-size:.78rem">Override: tap to cycle Auto → Present → Absent (for students without a phone, and so on). Saved for this session.</p>':'<p class="muted" style="font-size:.78rem">Overrides need the newest rules.</p>'}`}}
/* students: Past tutorial sessions (#/sessions, #/sessions/<id>): the reflection and only their OWN figures */
/* registered from engine/simple.js (this file loads before core.js defines ROUTES) */
function presRoutes(){ROUTES.sessions=h=>{if(!cloudOn())return shell('#/progress','<h1>Past tutorial sessions</h1><div class="callout">Past sessions need the live connection.</div>');if(h[1])return sxSessPage(h[1]);
  const L=ME.sid===LECTURER;shell('#/progress',`<h1>Past tutorial sessions</h1><p class="muted" style="margin-top:-4px">${L?'Every session you have run. Open one for its report.':'What each session covered, and how you did.'}</p><div id="sxsl"><p class="muted">Loading…</p></div>`);
  CLOUD.watchSessions(list=>{const el=$('#sxsl');if(!el)return;const past=list.filter(s=>!(s.active&&(!s.endsAt||Date.now()<s.endsAt)));
    el.innerHTML=past.length?`<div class="card"><ul class="sumlist">${past.map(s=>{const j=U&&U.sess&&U.sess[s.id];return `<li><a href="${L?'#/session/':'#/sessions/'}${esc(s.id)}">${esc(s.name)}</a> <span class="muted" style="font-size:.82rem">${s.startedAt?new Date(s.startedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Indian/Maldives'}):''}${L?'':j?' · you joined':' · not joined'}${s.refl?' · reflection ✓':''}</span></li>`}).join('')}</ul></div>`:'<div class="card"><p class="muted" style="margin:0">No sessions yet.</p></div>'},
    e=>{const el=$('#sxsl');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})};}
async function sxSessPage(id){shell('#/progress',`<p><a href="#/sessions">← Past tutorial sessions</a></p><div id="sxsp"><p class="muted">Loading…</p></div>`);
  let S=null,me=null;try{S=await CLOUD.getSession(id)}catch(e){}const el=$('#sxsp');if(!el)return;if(!S){el.innerHTML='<div class="card"><p class="muted">Session not found.</p></div>';return}
  if(ME.sid!==LECTURER&&await sessR3())try{me=await CLOUD.get('sessions/'+id+'/me/'+ME.sid)}catch(e){}
  const own=U&&U.sess&&U.sess[id],x=sessXP(U,S),a=sxAns(U,S),R=S.refl,mine=me||(own?{j:own.j,pct:presFocus(own).pct,on:own.on|0,xp:x?x.xp:null,est:x&&x.est,sest:a&&a.est?1:0,...(b=>({sc:b.length?Math.round(b.reduce((t,v)=>t+v[2],0)/b.length*100):null,n:b.length}))((a||[]).filter(v=>v[2]!=null)),miss:a?[...new Set(a.filter(v=>v[2]!=null&&v[2]<.5).map(v=>v[1]))]:[]}:null);
  const qli=ids=>`<ul class="sxq">${ids.map(q=>{const I=qInfo(q);return `<li>${esc(I.q)}${I.ans?`<div class="muted"><span class="ok">Correct idea: ${esc(I.ans)}</span></div>`:''}${I.href?` <a class="btn ghost sm" href="${I.href}">📖 Refer to notes</a>`:''}</li>`}).join('')}</ul>`;
  el.innerHTML=`<div class="card"><h1 style="margin:0">${esc(S.name)}</h1><p class="muted">${S.startedAt?new Date(S.startedAt).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Indian/Maldives'}):''}</p>
  ${ME.sid===LECTURER?'':`<h2>Your session</h2>${mine?`<div class="stats"><div class="stat"><b>✓</b><span>joined${mine.j?' '+sxTime(mine.j):''}</span></div><div class="stat"><b>${Math.round((mine.on|0)/60)} min</b><span>on screen (${mine.pct|0}%)</span></div><div class="stat"><b>${mine.xp==null?'–':(mine.est?'≈ ':'')+mine.xp}</b><span>XP in session</span></div><div class="stat"><b>${mine.sc==null?'–':(mine.sest?'≈ ':'')+mine.sc+'%'}</b><span>your score${mine.n?' ('+mine.n+' answers)':''}</span></div></div>${mine.sest||mine.est?'<p class="muted" style="font-size:.78rem">≈ = based on the day\'s practice (before single answers were recorded).</p>':''}
    ${(mine.miss||[]).length?`<h3>Questions you missed</h3>${qli(mine.miss)}`:mine.n?'<p>You got everything right. 🎉</p>':''}`:'<p class="muted">You didn\'t join this session.</p>'}`}
  <h2>Session reflection</h2>${R?`${R.note?`<div class="callout"><b>From your lecturer:</b> ${esc(R.note)}</div>`:''}<p><b>Covered:</b> ${(R.cov||[]).map(([t,n])=>esc(t)).join(' · ')||'–'}</p>
    <p><b>Class:</b> ${R.nj|0} joined · average score ${R.avg==null?'–':(R.est?'≈ ':'')+R.avg+'%'} · ${R.xp==null?'–':R.xp} XP each on average</p>
    ${(R.str||[]).length?`<h3>✅ Strengths</h3><ul class="sxq">${R.str.map(e=>`<li>${esc(e.q)} <span class="muted">· ${e.p}% right</span></li>`).join('')}</ul>`:''}
    ${(R.ar||[]).length?`<h3>🤔 Areas to reflect on</h3><ul class="sxq">${R.ar.map(e=>`<li><b>${esc(e.q)}</b>${e.a?`<div class="muted"><span class="ok">Correct idea: ${esc(e.a)}</span></div>`:''}${e.h?` <a class="btn ghost sm" href="${esc(e.h)}">📖 Refer to notes</a>`:''}</li>`).join('')}</ul>`:''}
    ${(S.fb||[]).length?`<h3>💬 Feedback during the session</h3><ul class="sxfb">${sxFbList(S.fb)}</ul>`:''}`:'<p class="muted">Your lecturer hasn\'t published a reflection for this session yet.</p>'}</div>`}
function sessionReport(id){if(ME.sid!==LECTURER)return home();if(!cloudOn())return shell('#/lecturer','<div class="callout">Session reports need the live connection.</div>');
  shell('#/lecturer',`<p><a href="#/lecturer">← Lecturer</a></p><div id="srp"><p class="muted">Loading…</p></div><div class="card" id="srrefl" data-lect style="margin-top:16px" hidden></div>`);
  let S=null,P=null,USERS=null,drawn=0,REP=null,DIR=null,ATT={},R3=false,af='',as='n',reflId='',sp=false;
  const draw=()=>{const el=$('#srp');if(!el||!S)return;drawn=Date.now();const now=Date.now(),live=S.active&&(!S.endsAt||now<S.endsAt);
    const rep=S.rep||REP||Object.fromEntries((P||[]).map(p=>{const r=liveRow(p,now);return [p.id,{n:'',on:r.on|0,idle:r.idle|0,away:r.away|0,left:r.left|0,lg:r.longest|0,pct:r.pct,pr:r.pr||'',j:p.joinedAt}]}));
    const UB={},NB={};(USERS||[]).forEach(x=>{UB[x.id]=x.u;NB[x.id]=x.name});const JN={};(P||[]).forEach(p=>JN[p.id]=p.joinedAt);
    const rows=Object.entries(rep).map(([sid,r])=>Object.assign({sid},r,{n:r.n||NB[sid]||'',sx:USERS||r.xp!=null?sessXP(UB[sid],S,JN[sid]||r.j,r):null})).sort((a,b)=>b.pct-a.pct),avg=rows.length?Math.round(rows.reduce((t,r)=>t+r.pct,0)/rows.length):0;
    const total=(typeof ROSTER!=='undefined'?ROSTER.hashes.length-1:rows.length),dur=S.startedAt?Math.round(((S.endedAt||(live?now:S.endsAt))-S.startedAt)/60000):0;
    const kn=rows.filter(r=>r.sx),xpT=kn.reduce((t,r)=>t+r.sx.xp,0),est=kn.some(r=>r.sx.est),A={};kn.forEach(r=>Object.entries(r.sx.acts).forEach(([c,n])=>A[c]=(A[c]|0)+n));
    el.innerHTML=`<div class="card"><h1 style="margin:0">${esc(S.name)}</h1><p class="muted">${S.startedAt?new Date(S.startedAt).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''} · ${dur} min${live?' · still running':''}</p>
    <div class="stats" style="margin:12px 0"><div class="stat"><b>${rows.length}/${total}</b><span>attended</span></div><div class="stat"><b>${avg}%</b><span>average on screen</span></div><div class="stat"><b>${rows.filter(r=>r.pct>=ST.FOCUS*100).length}</b><span>85%+ focused</span></div><div class="stat"><b>${rows.reduce((t,r)=>t+(r.left|0),0)}</b><span>switches in total</span></div>
    <div class="stat" id="srxt"><b>${kn.length?(est?'≈ ':'')+xpT:'–'}</b><span>XP earned in session</span></div><div class="stat" id="srxa"><b>${kn.length?(est?'≈ ':'')+Math.round(xpT/kn.length):'–'}</b><span>XP per student</span></div></div>
    ${Object.keys(A).length?`<p style="font-size:.9rem;margin:0 0 10px"><b>Class activity:</b> ${esc(sxActs(A,12))||'–'}</p>`:''}
    <div class="row" style="margin:0 0 8px;align-items:center"><button class="btn ghost sm" id="srrf">↻ Refresh</button><span class="muted" style="font-size:.8rem">${live?'XP updates as students sync; refreshed at most once a minute. ':''}${est?'≈ = estimate from whole hours (before exact session tracking started).':''}</span></div>
    <div class="tablewrap"><table class="wide"><tr><th>Student</th><th>On screen</th><th>XP in session</th><th>Focus bonus</th><th>Activity</th><th>Idle</th><th>Away</th><th>Times left</th><th>Longest away</th><th>Practised</th></tr>
    ${rows.map(r=>`<tr data-sid="${esc(r.sid)}"><td class="click" data-open="${esc(r.sid)}">${esc(r.n||r.sid)}<div class="muted" style="font-size:.78rem">${esc(r.sid)}</div></td><td><b>${r.pct}%</b></td><td class="sxx"><b>${sxXP(r.sx)}</b>${r.sx&&r.sx.est?'<div class="muted" style="font-size:.72rem">estimate (hourly)</div>':''}</td><td>${r.sx&&r.sx.fx?'+'+r.sx.fx:'–'}</td><td class="sxa" style="font-size:.82rem;min-width:150px">${r.sx?(esc(sxActs(r.sx.acts))||(r.sx.est?'<span class="muted">no breakdown</span>':'<span class="muted">none</span>')):'–'}${sxTimeline(r.sx)}</td><td>${stFmt(r.idle|0)}</td><td>${stFmt(r.away|0)}</td><td>${r.left|0}</td><td>${stFmt(r.lg|0)}</td><td style="font-size:.82rem">${esc(r.pr||'')}</td></tr>`).join('')||'<tr><td colspan="10" class="muted">Nobody joined.</td></tr>'}</table></div>
    <button class="btn ghost sm" id="srcsv" style="margin-top:12px">⬇ Download CSV</button></div>
    <div class="card" style="margin-top:16px"><h2>📊 Answers in this session</h2>${USERS?sxPanelHTML(sessStats(rows.map(r=>({id:r.sid,u:UB[r.sid],join:JN[r.sid]||r.j})),S),sp):'<p class="muted">Loading…</p>'}</div>
    <div class="card" style="margin-top:16px" id="sratt"><h2>🗒️ Attendance</h2>${DIR==null?'<p class="muted">Loading the class list…</p>':(ATTV=sxAttHTML(S,rep,DIR,ATT,af,as,R3)).html}</div>`;
    $('#srcsv').onclick=()=>csvDownload([['Name','ID','On screen %','On screen (s)','Idle (s)','Away (s)','Times left','Longest away (s)','Practised','XP in session','Focus bonus','XP basis','Activity']].concat(rows.map(r=>[r.n,r.sid,r.pct,r.on,r.idle,r.away,r.left,r.lg,r.pr,r.sx?r.sx.xp:'',r.sx?r.sx.fx:'',r.sx?(r.sx.est?'estimate (hourly)':'exact'):'',r.sx?sxActs(r.sx.acts,20):''])),'session-'+(S.startedAt?stYmd(new Date(S.startedAt)):id)+'.csv');
    $('#srrf').onclick=draw;const sa=$('#sxall');if(sa)sa.onclick=()=>{sp=!sp;draw()};
    el.querySelectorAll('[data-open]').forEach(r=>r.onclick=()=>openStudent(r.dataset.open));
    if(ATTV&&$('#atf')){$('#atf').onchange=e=>{af=e.target.value;draw()};$('#ats').onchange=e=>{as=e.target.value;draw()};
      $('#atcsv').onclick=()=>csvDownload([['Name','ID','Section','Status','Set by lecturer','Joined','Minutes present','On screen %']].concat(ATTV.rows.map(x=>[x.n,x.id,x.g,x.st,x.m?'yes':'',x.j,x.r?x.min:'',x.r?x.pct:''])),'attendance-'+(S.startedAt?stYmd(new Date(S.startedAt)):id)+'.csv');
      $('#atcp').onclick=()=>{const t=ATTV.rows.filter(x=>x.st==='Present'||x.st==='Late').map(x=>x.n).join('\n');try{navigator.clipboard.writeText(t).then(()=>toast('📋','Copied',ATTV.rows.filter(x=>x.st==='Present'||x.st==='Late').length+' names'),()=>prompt('Copy the names',t))}catch(e){prompt('Copy the names',t)}};
      el.querySelectorAll('[data-ov]').forEach(b=>b.onclick=async()=>{const k=b.dataset.ov,v={'':'p',p:'a',a:''}[ATT[k]||''];ATT[k]=v;draw();
        try{await CLOUD.put('sessions/'+id+'/lect/att',{m:{[k]:v}},true)}catch(e){toast('⚠️','Override not saved',CLOUD.say(e))}})}
    reflDraw(rep,UB,JN)};
  let ATTV=null;
  const reflDraw=(rep,UB,JN)=>{const box=$('#srrefl');if(!box||!S)return;const ended=!(S.active&&(!S.endsAt||Date.now()<S.endsAt)),key=S.id+'|'+(S.refl?S.refl.at:0)+'|'+R3+'|'+ended;
    if(reflId===key||box.contains(document.activeElement))return;reflId=key;box.hidden=false;const R=S.refl;
    box.innerHTML=`<h2>🪞 Session reflection</h2>${!R3?'<p class="muted">Reflections need the newest rules: publish them, then reload.</p>':!ended?'<p class="muted">Published automatically when the session ends.</p>':R?`<p class="muted" style="font-size:.85rem">Students see this on Past tutorial sessions, with only their own figures.</p>
      <p><b>Covered:</b> ${(R.cov||[]).map(([t])=>esc(t)).join(' · ')||'–'} · <b>Average score:</b> ${R.avg==null?'–':R.avg+'%'} · <b>XP each:</b> ${R.xp==null?'–':R.xp}</p>
      <p style="font-size:.88rem">${(R.ar||[]).length} areas to reflect on · ${(R.str||[]).length} strengths · ${(S.fb||[]).length} feedback messages</p>
      <label for="srnote"><b>Your note to the class</b> (optional)</label><textarea id="srnote" maxlength="600" style="min-height:70px">${esc(R.note||'')}</textarea><div class="row" style="margin-top:6px"><button class="btn sm" id="srns">Save note</button><button class="btn ghost sm" id="srrb">↻ Rebuild from the latest answers</button></div>`
      :'<p>No reflection yet for this session (it ended before reflections existed, or on the older rules). Create one from the answers and practice students did during the session; you can add a note and rebuild it later.</p><button class="btn sm" id="srrb">🪞 Create reflection</button>'}`;
    const ns=$('#srns');if(ns)ns.onclick=async()=>{const note=$('#srnote').value.trim().slice(0,600);try{await CLOUD.put('sessions/'+S.id,{refl:{note}},true);toast('🪞','Note saved','Students see it now')}catch(e){toast('⚠️','Not saved',CLOUD.say(e))}};
    const rb=$('#srrb');if(rb)rb.onclick=async()=>{rb.disabled=true;try{const users=USERS||await usersOnce(),ps=(P||[]),o=await sxPublish(S,rep,users,ps);if(S.refl&&S.refl.note)o.refl.note=S.refl.note;
      await CLOUD.put('sessions/'+S.id,{refl:o.refl,nj:o.nj},true);if(S.rep)await sxMigrate([S]);toast('🪞','Reflection published','Students can see it now')}catch(e){toast('⚠️','Not published',CLOUD.say(e));rb.disabled=false}}};
  sessR3().then(async ok=>{R3=ok;if(ok){try{const a=await CLOUD.get('sessions/'+id+'/lect/att');ATT=(a&&a.m)||{}}catch(e){}}draw()});
  CLOUD.docs('directory').then(d=>{DIR=d.map(x=>({id:x.id,n:x.n||'',g:x.g||''})).filter(x=>/^S0\d{5}$/.test(x.id)&&x.id!==LECTURER);draw()},()=>{DIR=[];draw()});
  CLOUD.watchUsers(l=>{USERS=l;if(!drawn||Date.now()-drawn>=60000||!S||!S.active)draw()},()=>{USERS=USERS||[];draw()});
  let pw=false;CLOUD.watchSessionDoc(id,s=>{S=s;if(s&&!s.rep&&!pw){pw=true;CLOUD.watchPresence(id,ps=>{P=ps;draw()},()=>{})}
    if(s&&!s.rep&&!REP&&!(s.active&&(!s.endsAt||Date.now()<s.endsAt)))sxRep(s).then(r=>{if(r){REP=r;draw()}});draw()},e=>{const el=$('#srp');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})}

/* ---------- lecturer: one student's screen time and sessions (profile) ---------- */
function presProfileWatch(cb){if(!cloudOn())return;CLOUD.watchSessions(list=>{PR.sessList=list;cb()},()=>{PR.sessList=[];cb()})}
function presProfileHTML(u,sid,bare){const days=stDays(u,28),mx=Math.max(ST.GOAL,...days.map(x=>x[1])),goals=Object.keys(u.log||{}).filter(k=>k.startsWith('stgoal:')).length;
  const ended=s=>!(s.active&&(!s.endsAt||Date.now()<s.endsAt)),ss=(PR.sessList||[]).filter(s=>ended(s)&&(s.rep&&s.rep[sid]||u.sess&&u.sess[s.id])).slice(0,10),held=(PR.sessList||[]).filter(ended).length;
  const own=ME&&ME.sid===sid&&cloudOn()?'<p style="margin:8px 0 0"><a href="#/sessions">🎓 Past tutorial sessions →</a></p>':'';
  if(bare===2)return `<h3>Live sessions <span class="tag">${ss.length}/${held}</span></h3>${presSessRows(ss,held,sid,u)}${own}`;
  return `${bare?'<div>':'<div class="card psec"><h2>Screen time & live sessions</h2>'}
  <div class="stats" style="grid-template-columns:repeat(4,1fr)"><div class="stat"><b>${stFmt(stToday(u))}</b><span>today</span></div><div class="stat"><b>${stFmt(stWeek(u))}</b><span>this week</span></div><div class="stat"><b>${stFmt(stTotal(u))}</b><span>total</span></div><div class="stat"><b>${goals}</b><span>daily goals met</span></div></div>
  <div class="stbars wide" aria-label="Minutes per day, last 4 weeks">${days.map(([k,s])=>`<div title="${k}: ${stFmt(s)}"><i style="height:${Math.max(2,Math.round(s/mx*100))}%" class="${s>=ST.GOAL?'goal':''}"></i></div>`).join('')}</div>
  <p class="muted" style="font-size:.78rem;margin:2px 0 10px">Active minutes per day, last 4 weeks (green = 20-minute goal met). Screen time is tracked from ${esc(Object.keys(u.st||{}).sort()[0]||'its first use')}.</p>
  <h3>Live sessions <span class="tag">${ss.length}/${held}</span></h3>${presSessRows(ss,held,sid,u)}</div>`}
/* one student's row for a session: the report row if visible here, else their own record (u.sess) */
function sxOwnRow(s,u,sid){const r=s.rep&&s.rep[sid];if(r)return r;const o=u&&u.sess&&u.sess[s.id];if(!o)return null;const f=presFocus(o);return {pct:f.pct,left:o.left|0,lg:o.lg|0,on:o.on|0,j:o.j}}
const presSessRows=(ss,held,sid,u)=>ss.length?`<div class="tablewrap"><table><tr><th>Session</th><th>On screen</th><th>XP in session</th><th>Times left</th><th>Longest away</th></tr>${ss.map(s=>{const r=sxOwnRow(s,u,sid)||{},x=sessXP(u,s,null,r);return `<tr><td>${ME&&ME.sid===LECTURER?`<a href="#/session/${esc(s.id)}">${esc(s.name)}</a>`:`<a href="#/sessions/${esc(s.id)}">${esc(s.name)}</a>`}</td><td><b>${r.pct|0}%</b></td><td class="sxx"><b>${sxXP(x)}</b>${x&&!x.est&&sxActs(x.acts)?`<div class="muted" style="font-size:.74rem">${esc(sxActs(x.acts,3))}</div>`:''}</td><td>${r.left|0}</td><td>${stFmt(r.lg|0)}</td></tr>`}).join('')}</table></div>${ss.some(s=>{const x=sessXP(u,s,null,sxOwnRow(s,u,sid));return x&&x.est})?'<p class="muted" style="font-size:.76rem;margin:4px 0 0">≈ = estimate from whole hours (before exact session tracking started).</p>':''}`:`<p class="muted">${held?'Not joined any of the '+held+' sessions held.':'No sessions held yet.'}</p>`;

/* ---------- styles ---------- */
(()=>{const s=document.createElement('style');s.textContent=`
.stwrap{display:flex;gap:16px;align-items:center;margin-top:12px;flex-wrap:wrap;justify-content:center}.stcol{flex:1;min-width:240px}.stcard .stat b{font-size:1.02rem}.stcard .stat{padding:8px 6px}.string{width:104px;height:104px;margin:0}.string::before{inset:9px}.string b{font-size:1.6rem}.string small{font-size:.58rem}
.stbars{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:84px;align-items:end;margin-top:12px}.stbars>div{display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:3px}
.stbars i{display:block;width:100%;max-width:28px;border-radius:6px 6px 2px 2px;background:var(--violet,var(--teal));opacity:.85}.stbars i.goal{background:var(--teal);opacity:1}
.stbars span{font:600 .68rem Lexend,sans-serif;color:var(--muted)}.stbars.wide{grid-template-columns:repeat(28,1fr);gap:2px;height:70px}.stbars.wide i{border-radius:3px 3px 1px 1px}
#livebar{position:sticky;top:60px;z-index:19;background:color-mix(in srgb,var(--red) 16%,var(--bg));border-bottom:1px solid var(--line)}
#livebar .lbin{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-height:46px;padding-top:6px;padding-bottom:6px;font-size:.92rem}
#livebar .btn.sm{min-height:34px}#livebar .lbfb{flex-basis:100%;font-size:.86rem;background:color-mix(in srgb,var(--teal) 14%,transparent);border-radius:8px;padding:4px 8px}
.sxq{margin:4px 0 10px;padding-left:1.2em}.sxq li{margin:6px 0}.sxq .muted{font-size:.82rem}.sxq .ok{color:var(--teal)}.sxfb{margin:8px 0 0;padding-left:1.1em;font-size:.88rem}
body.proj #lvmain,body.proj #lvfc,body.proj .tabbar,body.proj header.top,body.proj #livebar{display:none!important}body.proj .sxpanel{font-size:1.3rem}body.proj .sxpanel h2{font-size:2rem}body.proj .sxpanel h3{font-size:1.5rem;margin-top:22px}body.proj .sxpanel .stat b{font-size:2.2rem}
.sxtl summary{cursor:pointer;font-size:.78rem;color:var(--muted);margin-top:4px}.sxtl ol{margin:4px 0 0;padding-left:1.1em;font-size:.78rem;max-height:220px;overflow:auto}.sxtl li{margin:1px 0}`;document.head.append(s)})();
