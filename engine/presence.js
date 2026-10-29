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
function presOn(){PR.last=PR.lt=Date.now();PR.pend=PR.pendx=0;PR.fc=0;PR.gap=0;PR.next=ST.BRK;presStart();presBar()}
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
  presBar();if(typeof liveCardRefresh==='function')liveCardRefresh()}
function presBar(){let b=document.getElementById('livebar');const show=typeof ME!=='undefined'&&ME&&PR.sessOn;
  if(!show){if(b)b.remove();return}
  if(!b){b=document.createElement('div');b.id='livebar';b.setAttribute('role','status');const app=document.getElementById('app');app.parentNode.insertBefore(b,app)}
  const S=PR.sess,lect=ME.sid===LECTURER,dot={on:'🟢 On screen',idle:'🟡 Idle',away:'🔴 Away'}[PR.st]||'🟢 On screen';
  b.innerHTML=`<div class="wrap lbin"><span class="live"><i></i>LIVE</span>${!lect&&typeof lectAvHTML==='function'?lectAvHTML(26):''}<b>${esc(S.name)}</b>${lect?`<a class="btn sm" href="#/live">Open live board</a>`:PR.joined?`<span class="muted">You're joined · ${dot}</span><button class="btn ghost sm" id="lbinfo" aria-label="What is shared">ⓘ</button>`:`<button class="btn sm" id="lbjoin">Join</button>`}</div>`;
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
function liveCardInit(){if(!document.getElementById('lsess'))return;PR.sessErr=0;PR.sessList=null;CLOUD.watchSessions(list=>{PR.sessErr=0;PR.sessList=list;liveCardRefresh()},e=>{PR.sessErr=1;liveCardRefresh()})}
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
  <h3 style="margin-top:16px">Past sessions</h3>${past.length?`<ul class="sumlist">${past.slice(0,12).map(s=>`<li><a href="#/session/${esc(s.id)}">${esc(s.name)}</a> <span class="muted" style="font-size:.82rem">${s.startedAt?new Date(s.startedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):''}${s.rep?' · '+Object.keys(s.rep).length+' joined':''}</span></li>`).join('')}</ul>`:'<p class="muted">No sessions yet.</p>'}`;
  const go=$('#lsgo');if(go)go.onclick=async()=>{const n=$('#lsname').value||'Week '+sessWeekDefault(list)+' tutorial';go.disabled=true;try{await CLOUD.startSession(n,ST.SESS_H);toast('🔴','Session started',n)}catch(e){$('#lserr').textContent=CLOUD.say(e);go.disabled=false}};
  const en=$('#lsend');if(en)en.onclick=()=>{if(confirm('End "'+S.name+'" now? Students stop being tracked and the report is saved.'))liveFinish(S.id)}}
const LIVE_LBL={on:'🟢 On screen',idle:'🟡 Idle',away:'🔴 Left the app',off:'⚫ Offline'};
function liveRow(p,now){const off=!p.t||now-p.t>ST.OFF*1000,st=off&&p.st!=='off'?'off':p.st,tot=(p.on|0)+(p.idle|0)+(p.away|0);
  return Object.assign({},p,{s:st,pct:tot?Math.round((p.on|0)/tot*100):0,chAt:p.joinedAt!=null?p.joinedAt+(p.ch|0)*1000:p.t})}
async function liveFinish(id){if(liveFinish.busy)return;liveFinish.busy=1;try{const ps=await CLOUD.presenceOnce(id),now=Date.now(),names=await liveNames();const rep={};
  ps.forEach(p=>{const r=liveRow(p,now);rep[p.id]={n:(names[p.id]||'').slice(0,60),on:r.on|0,idle:r.idle|0,away:r.away|0,left:r.left|0,lg:r.longest|0,pct:r.pct,pr:String(r.pr||'').slice(0,200)}});
  await CLOUD.endSession(id,rep);toast('■','Session ended','Report saved: '+Object.keys(rep).length+' joined')}catch(e){toast('⚠️','Could not end the session',CLOUD.say(e))}finally{liveFinish.busy=0}}
let LIVE_NAMES=null;
function liveNames(){return new Promise(res=>{if(LIVE_NAMES)return res(LIVE_NAMES);let done=false;CLOUD.watchUsers(list=>{LIVE_NAMES={};list.forEach(x=>LIVE_NAMES[x.id]=x.name||'');if(!done){done=true;res(LIVE_NAMES)}},()=>{if(!done){done=true;res({})}})})}
const csvDownload=(rows,name)=>{const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download=name;a.click()};
function livePage(){if(ME.sid!==LECTURER)return home();if(!cloudOn())return shell('#/lecturer','<div class="callout">Live sessions need the live connection.</div>');
  shell('#/lecturer',`<p><a href="#/lecturer">← Lecturer</a></p><div id="lvb"><p class="muted">Loading…</p></div>`);
  let P=[],USERS=null,sort={k:'s',d:1};const order={away:0,off:1,idle:2,on:3};
  CLOUD.watchUsers(l=>{USERS=l;draw()},()=>{});
  const draw=()=>{const el=$('#lvb');if(!el)return;const S=PR.sess;
    if(!S){el.innerHTML='<div class="card"><h2>No live session</h2><p class="muted">Start one from the Lecturer tab.</p></div>';return}
    const now=Date.now(),names={};(USERS||[]).forEach(u=>names[u.id]=u.name);
    const rows=P.map(p=>Object.assign(liveRow(p,now),{name:names[p.id]||p.id}));
    const k=sort.k,cmp=(a,b)=>k==='name'?a.name.localeCompare(b.name):k==='s'?order[a.s]-order[b.s]:(a[k]||0)-(b[k]||0);rows.sort((a,b)=>cmp(a,b)*sort.d);
    const total=(typeof ROSTER!=='undefined'?ROSTER.hashes.length-1:rows.length),cnt=s=>rows.filter(r=>r.s===s).length;
    const not=(USERS||[]).filter(u=>u.id!==LECTURER&&!P.some(p=>p.id===u.id)).map(u=>u.name||u.id).sort();
    const th=(key,l)=>`<th data-sk="${key}" class="click" aria-sort="${sort.k===key?(sort.d>0?'ascending':'descending'):'none'}">${l}${sort.k===key?(sort.d>0?' ▲':' ▼'):''}</th>`;
    el.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between"><h1 style="margin:0">${esc(S.name)}</h1>${sessLive()?'<span class="live"><i></i>LIVE</span>':'<span class="tag">Ended</span>'}</div>
    <div class="stats" style="margin:12px 0"><div class="stat"><b>${rows.length}/${total}</b><span>joined</span></div><div class="stat"><b>${cnt('on')}</b><span>🟢 on screen</span></div><div class="stat"><b>${cnt('idle')}</b><span>🟡 idle</span></div><div class="stat"><b>${cnt('away')+cnt('off')}</b><span>🔴 away or ⚫ offline</span></div></div>
    <div class="tablewrap"><table class="wide"><tr>${th('s','Status')}${th('name','Student')}${th('pct','On screen')}${th('idle','Idle')}${th('left','Times left')}${th('longest','Longest away')}${th('chAt','Last change')}<th>Section now</th><th>Practised</th></tr>
    ${rows.map(r=>`<tr class="click" data-sid="${esc(r.id)}"><td style="white-space:nowrap">${LIVE_LBL[r.s]||r.s}</td><td>${esc(r.name)}<div class="muted" style="font-size:.78rem">${esc(r.id)}</div></td><td><b>${r.pct}%</b></td><td>${stFmt(r.idle|0)}</td><td>${r.left|0}</td><td>${stFmt(r.longest|0)}</td><td>${r.chAt?ago(new Date(r.chAt)):'–'}</td><td style="font-size:.85rem">${esc(r.sec||'')}</td><td style="font-size:.8rem">${esc(r.pr||'')}</td></tr>`).join('')||'<tr><td colspan="9" class="muted">Nobody has joined yet.</td></tr>'}</table></div>
    <h3 style="margin-top:14px">Not joined (${not.length}${total>(USERS||[]).length-1?` + ${Math.max(0,total-((USERS||[]).filter(u=>u.id!==LECTURER).length))} not signed up`:''})</h3><p style="font-size:.9rem">${not.map(esc).join(', ')||'–'}</p>
    <p class="muted" style="font-size:.8rem">On screen = the portal is open and in use. Idle = open but untouched for 2+ minutes. Left the app = switched app or tab, or locked the screen. Offline = no check-in for 5+ minutes. These are signals, not proof.</p>
    <div class="row" style="margin-top:10px">${sessLive()?'<button class="btn red" id="lvend">■ End session</button>':''}<a class="btn ghost" href="#/session/${esc(S.id)}">Report</a></div></div>`;
    el.querySelectorAll('[data-sk]').forEach(h=>h.onclick=()=>{sort=sort.k===h.dataset.sk?{k:sort.k,d:-sort.d}:{k:h.dataset.sk,d:h.dataset.sk==='name'||h.dataset.sk==='s'?1:-1};draw()});
    el.querySelectorAll('tr[data-sid]').forEach(r=>r.onclick=()=>openStudent(r.dataset.sid));
    const e=$('#lvend');if(e)e.onclick=()=>{if(confirm('End "'+S.name+'" now?'))liveFinish(S.id)}};
  const watch=()=>{if(!PR.sess)return draw();CLOUD.watchPresence(PR.sess.id,ps=>{P=ps;draw()},err=>{const el=$('#lvb');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(err))}</p>`})};
  watch();const iv=setInterval(()=>{if(!document.getElementById('lvb'))return clearInterval(iv);draw()},15000)}
function sessionReport(id){if(ME.sid!==LECTURER)return home();if(!cloudOn())return shell('#/lecturer','<div class="callout">Session reports need the live connection.</div>');
  shell('#/lecturer',`<p><a href="#/lecturer">← Lecturer</a></p><div id="srp"><p class="muted">Loading…</p></div>`);
  let S=null,P=null;const draw=()=>{const el=$('#srp');if(!el||!S)return;const now=Date.now(),live=S.active&&(!S.endsAt||now<S.endsAt);
    const rep=S.rep||Object.fromEntries((P||[]).map(p=>{const r=liveRow(p,now);return [p.id,{n:'',on:r.on|0,idle:r.idle|0,away:r.away|0,left:r.left|0,lg:r.longest|0,pct:r.pct,pr:r.pr||''}]}));
    const rows=Object.entries(rep).map(([sid,r])=>Object.assign({sid},r)).sort((a,b)=>b.pct-a.pct),avg=rows.length?Math.round(rows.reduce((t,r)=>t+r.pct,0)/rows.length):0;
    const total=(typeof ROSTER!=='undefined'?ROSTER.hashes.length-1:rows.length),dur=S.startedAt?Math.round(((S.endedAt||(live?now:S.endsAt))-S.startedAt)/60000):0;
    el.innerHTML=`<div class="card"><h1 style="margin:0">${esc(S.name)}</h1><p class="muted">${S.startedAt?new Date(S.startedAt).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''} · ${dur} min${live?' · still running':''}</p>
    <div class="stats" style="margin:12px 0"><div class="stat"><b>${rows.length}/${total}</b><span>attended</span></div><div class="stat"><b>${avg}%</b><span>average on screen</span></div><div class="stat"><b>${rows.filter(r=>r.pct>=ST.FOCUS*100).length}</b><span>85%+ focused</span></div><div class="stat"><b>${rows.reduce((t,r)=>t+(r.left|0),0)}</b><span>switches in total</span></div></div>
    <div class="tablewrap"><table class="wide"><tr><th>Student</th><th>On screen</th><th>Idle</th><th>Away</th><th>Times left</th><th>Longest away</th><th>Practised</th></tr>
    ${rows.map(r=>`<tr class="click" data-sid="${esc(r.sid)}"><td>${esc(r.n||r.sid)}<div class="muted" style="font-size:.78rem">${esc(r.sid)}</div></td><td><b>${r.pct}%</b></td><td>${stFmt(r.idle|0)}</td><td>${stFmt(r.away|0)}</td><td>${r.left|0}</td><td>${stFmt(r.lg|0)}</td><td style="font-size:.82rem">${esc(r.pr||'')}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">Nobody joined.</td></tr>'}</table></div>
    <button class="btn ghost sm" id="srcsv" style="margin-top:12px">⬇ Download CSV</button></div>`;
    $('#srcsv').onclick=()=>csvDownload([['Name','ID','On screen %','On screen (s)','Idle (s)','Away (s)','Times left','Longest away (s)','Practised']].concat(rows.map(r=>[r.n,r.sid,r.pct,r.on,r.idle,r.away,r.left,r.lg,r.pr])),'session-'+(S.startedAt?stYmd(new Date(S.startedAt)):id)+'.csv');
    el.querySelectorAll('tr[data-sid]').forEach(r=>r.onclick=()=>openStudent(r.dataset.sid))};
  CLOUD.watchSessionDoc(id,s=>{S=s;if(s&&!s.rep)CLOUD.watchPresence(id,ps=>{P=ps;draw()},()=>{});draw()},e=>{const el=$('#srp');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})}

/* ---------- lecturer: one student's screen time and sessions (profile) ---------- */
function presProfileWatch(cb){if(!cloudOn())return;CLOUD.watchSessions(list=>{PR.sessList=list;cb()},()=>{PR.sessList=[];cb()})}
function presProfileHTML(u,sid,bare){const days=stDays(u,28),mx=Math.max(ST.GOAL,...days.map(x=>x[1])),goals=Object.keys(u.log||{}).filter(k=>k.startsWith('stgoal:')).length;
  const ss=(PR.sessList||[]).filter(s=>s.rep&&s.rep[sid]).slice(0,10),held=(PR.sessList||[]).filter(s=>s.rep).length;
  if(bare===2)return `<h3>Live sessions <span class="tag">${ss.length}/${held}</span></h3>${presSessRows(ss,held,sid)}`;
  return `${bare?'<div>':'<div class="card psec"><h2>Screen time & live sessions</h2>'}
  <div class="stats" style="grid-template-columns:repeat(4,1fr)"><div class="stat"><b>${stFmt(stToday(u))}</b><span>today</span></div><div class="stat"><b>${stFmt(stWeek(u))}</b><span>this week</span></div><div class="stat"><b>${stFmt(stTotal(u))}</b><span>total</span></div><div class="stat"><b>${goals}</b><span>daily goals met</span></div></div>
  <div class="stbars wide" aria-label="Minutes per day, last 4 weeks">${days.map(([k,s])=>`<div title="${k}: ${stFmt(s)}"><i style="height:${Math.max(2,Math.round(s/mx*100))}%" class="${s>=ST.GOAL?'goal':''}"></i></div>`).join('')}</div>
  <p class="muted" style="font-size:.78rem;margin:2px 0 10px">Active minutes per day, last 4 weeks (green = 20-minute goal met). Screen time is tracked from ${esc(Object.keys(u.st||{}).sort()[0]||'its first use')}.</p>
  <h3>Live sessions <span class="tag">${ss.length}/${held}</span></h3>${presSessRows(ss,held,sid)}</div>`}
const presSessRows=(ss,held,sid)=>ss.length?`<div class="tablewrap"><table><tr><th>Session</th><th>On screen</th><th>Times left</th><th>Longest away</th></tr>${ss.map(s=>{const r=s.rep[sid];return `<tr><td>${ME&&ME.sid===LECTURER?`<a href="#/session/${esc(s.id)}">${esc(s.name)}</a>`:esc(s.name)}</td><td><b>${r.pct|0}%</b></td><td>${r.left|0}</td><td>${stFmt(r.lg|0)}</td></tr>`}).join('')}</table></div>`:`<p class="muted">${held?'Not joined any of the '+held+' sessions held.':'No sessions held yet.'}</p>`;

/* ---------- styles ---------- */
(()=>{const s=document.createElement('style');s.textContent=`
.stwrap{display:flex;gap:16px;align-items:center;margin-top:12px;flex-wrap:wrap;justify-content:center}.stcol{flex:1;min-width:240px}.stcard .stat b{font-size:1.02rem}.stcard .stat{padding:8px 6px}.string{width:104px;height:104px;margin:0}.string::before{inset:9px}.string b{font-size:1.6rem}.string small{font-size:.58rem}
.stbars{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;height:84px;align-items:end;margin-top:12px}.stbars>div{display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:3px}
.stbars i{display:block;width:100%;max-width:28px;border-radius:6px 6px 2px 2px;background:var(--violet,var(--teal));opacity:.85}.stbars i.goal{background:var(--teal);opacity:1}
.stbars span{font:600 .68rem Lexend,sans-serif;color:var(--muted)}.stbars.wide{grid-template-columns:repeat(28,1fr);gap:2px;height:70px}.stbars.wide i{border-radius:3px 3px 1px 1px}
#livebar{position:sticky;top:60px;z-index:19;background:color-mix(in srgb,var(--red) 16%,var(--bg));border-bottom:1px solid var(--line)}
#livebar .lbin{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-height:46px;padding-top:6px;padding-bottom:6px;font-size:.92rem}
#livebar .btn.sm{min-height:34px}`;document.head.append(s)})();
