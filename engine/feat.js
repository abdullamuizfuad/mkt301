/* MKT Arena engine features (shared by both courses).
   Everything that needs Firestore collections beyond users/board/reviews/sessions checks rulesOK() first and hides quietly
   (body:not(.rules2) [data-need=rules] is hidden) until the lecturer publishes the combined rules. */

/* ---------- plumbing ---------- */
const LCARDS=[];/* lecturer cards: {id,init(el)} drawn on the Lecturer tab (cloud only) */
const lcard=(id,init)=>LCARDS.push({id,init});
let RULES_P=null;
async function rulesOK(){if(!ME||!cloudOn())return false;const u=await CLOUD.current();if(!u)return false;
  if(!RULES_P)RULES_P=CLOUD.probe().then(ok=>{document.body.classList.toggle('rules2',ok);return ok});return RULES_P}
onHook('signout',()=>{RULES_P=null;document.body.classList.remove('rules2')});
const addDays=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x)};
const weekKey=d=>{const x=new Date(d+'T12:00:00'),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return ymd(x)};
const isoNow=()=>new Date().toISOString();
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;a.click()}
function modal(label,html){closeModal();const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label',label);
  m.innerHTML=`<div class="card"><button class="x" aria-label="Close">✕</button>${html}</div>`;document.body.append(m);m.querySelector('.x').onclick=closeModal;m.onclick=e=>{if(e.target===m)closeModal()};return m}
function lecturerCards(){LCARDS.forEach(c=>{const el=$('#'+c.id);if(el)try{c.init(el)}catch(e){console.error(e)}})}
const lcardsHTML=()=>LCARDS.map(c=>`<div class="card" id="${c.id}" style="margin-bottom:22px" hidden></div>`).join('');
/* shown only when the rules are published: put inside a lecturer card */
const needRulesHTML='<p class="callout" style="font-size:.88rem">This switches on when the new Firestore rules are published (see docs/NIGHT-BUILD.md).</p>';

/* ---------- client error reports: errors/{id} ---------- */
const ERRQ={n:0,seen:new Set(),q:[]};
function reportError(msg,src,line,stack){try{const m=String(msg||'').slice(0,300);if(!m||ERRQ.n>=5||ERRQ.seen.has(m))return;
    if(src&&!String(src).startsWith(location.origin))return;/* browser extensions and other sites */
    if(/ResizeObserver loop|Script error\.?$|Load failed|Failed to fetch|NetworkError/.test(m))return;
    ERRQ.seen.add(m);ERRQ.n++;ERRQ.q.push({m,s:String(src||'').replace(location.origin,'').slice(0,120),l:line|0,st:String(stack||'').slice(0,800),
      p:location.hash.slice(0,60),ua:navigator.userAgent.slice(0,160),at:isoNow()});flushErrors()}catch(e){}}
async function flushErrors(){if(!ERRQ.q.length||!ME||!(await rulesOK().catch(()=>false)))return;
  while(ERRQ.q.length){const e=ERRQ.q.shift();try{await CLOUD.add('errors',Object.assign({sid:ME.sid,t:CLOUD.ts()},e))}catch(x){break}}}
addEventListener('error',e=>reportError(e.message,e.filename,e.lineno,e.error&&e.error.stack));
addEventListener('unhandledrejection',e=>{const r=e.reason;reportError('Unhandled: '+((r&&r.message)||r),'',0,r&&r.stack)});
onHook('cloud',flushErrors);

lcard('errc',el=>{rulesOK().then(ok=>{if(!ok)return;el.hidden=false;
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Errors</h2><span class="live"><i></i>LIVE</span></div>
  <p class="muted" style="font-size:.88rem;margin:6px 0 8px">Problems students' browsers hit (at most 5 per visit). Most are harmless; repeated ones point to a bug to fix.</p><div id="errb"><p class="muted">Loading…</p></div>`;
  CLOUD.watch('errors',{order:['t','desc'],limit:100},list=>{const b=$('#errb');if(!b)return;if(!list.length){b.innerHTML='<p class="muted">No errors reported. 🎉</p>';return}
    const by={};list.forEach(e=>{const g=by[e.m]||(by[e.m]={m:e.m,n:0,sids:new Set(),last:0,e});g.n++;g.sids.add(e.sid);g.last=Math.max(g.last,e.t||0)});
    b.innerHTML=`<div class="tablewrap"><table><tr><th>Error</th><th>Times</th><th>Students</th><th>Last</th></tr>${Object.values(by).sort((a,b)=>b.last-a.last).map(g=>`<tr><td><b>${esc(g.m)}</b><div class="muted" style="font-size:.78rem">${esc(g.e.s)}:${g.e.l} · ${esc(g.e.p||'#/')} · ${esc(g.e.ua.slice(0,60))}</div></td><td>${g.n}</td><td>${[...g.sids].map(esc).join(', ')}</td><td>${ago(g.last)}</td></tr>`).join('')}</table></div>
    <button class="btn ghost sm" id="errclr" style="margin-top:10px">🗑 Clear all</button>`;
    $('#errclr').onclick=async()=>{if(!confirm('Delete every error report?'))return;for(const e of list)try{await CLOUD.del('errors/'+e.id)}catch(x){}}},
  e=>{const b=$('#errb');if(b)b.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})})});

/* ---------- "Report a problem" on every question: reports/{id} ---------- */
const RPT_KINDS=[['wrong','The answer or a key idea looks wrong'],['unclear','Typo or unclear wording'],['broken','Something doesn\'t work'],['other','Something else']];
const rptBtn=(qid,label)=>`<button type="button" class="btn ghost sm rpt" data-need="rules" data-rpt="${esc(qid)}" data-rptl="${esc(String(label||'').slice(0,120))}" title="Tell your lecturer about a problem with this question">⚑ ${(U.rpts||{})[qid]?'Reported':'Report a problem'}</button>`;
function reportPop(qid,label,kind,text){
  const m=modal('Report a problem',`<h2 style="margin:4px 0 6px">⚑ Report a problem</h2><p class="muted" style="margin:0 0 10px">${esc(label||qid)}</p>
  <div class="opts" role="radiogroup" aria-label="What is wrong?">${RPT_KINDS.map(([k,t],i)=>`<label class="tpk" style="margin-bottom:6px"><input type="radio" name="rk" value="${k}" ${(kind||'wrong')===k?'checked':''}><span>${t}</span></label>`).join('')}</div>
  <label for="rtx">What did you notice? (optional)</label><textarea id="rtx" maxlength="500" style="min-height:80px" placeholder="E.g. option B is also right because…">${esc(text||'')}</textarea>
  <p class="err" id="rerr" aria-live="polite"></p><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost" id="rcan">Cancel</button><button class="btn" id="rsend">Send to my lecturer</button></div>`);
  $('#rcan').onclick=closeModal;
  $('#rsend').onclick=async()=>{const k=(m.querySelector('input[name=rk]:checked')||{}).value||'other',tx=$('#rtx').value.trim().slice(0,500);$('#rsend').disabled=true;
    try{if(!(await rulesOK()))throw {code:'unavailable'};await CLOUD.add('reports',{sid:ME.sid,q:String(qid).slice(0,40),w:String(label||'').slice(0,120),k,tx,st:'open',t:CLOUD.ts()});
      U.rpts=U.rpts||{};U.rpts[qid]=today();save();closeModal();toast('⚑','Thanks! Sent to your lecturer','You\'ll get a message if they reply.');
      document.querySelectorAll(`[data-rpt="${CSS.escape(qid)}"]`).forEach(b=>b.textContent='⚑ Reported')}
    catch(e){$('#rsend').disabled=false;$('#rerr').textContent=CLOUD.say(e)}}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-rpt]');if(!b||!ME)return;e.preventDefault();e.stopPropagation();reportPop(b.dataset.rpt,b.dataset.rptl)},true);

lcard('rptc',el=>{rulesOK().then(ok=>{if(!ok)return;el.hidden=false;let tab='open',US={};
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Problem reports</h2><span class="live"><i></i>LIVE</span></div>
  <p class="muted" style="font-size:.88rem;margin:6px 0 8px">Students tap ⚑ on a question to report a problem. Reply here: the reply arrives as a message on their home page.</p>
  <div class="subnav"><button data-rt="open" class="on">Open</button><button data-rt="done">Answered</button></div><div id="rptb"><p class="muted">Loading…</p></div>`;
  let L=[];const I=qIndex();const draw=()=>{const b=$('#rptb');if(!b)return;const ae=document.activeElement;if(ae&&b.contains(ae)&&ae.tagName==='TEXTAREA')return;
    const list=L.filter(r=>tab==='open'?r.st==='open':r.st!=='open');
    b.innerHTML=list.length?list.map(r=>`<div class="note" style="margin:8px 0"><div class="row" style="justify-content:space-between"><b>${esc((I[r.q]&&I[r.q].label)||r.w||r.q)}</b><span class="tag">${esc((RPT_KINDS.find(k=>k[0]===r.k)||[,r.k])[1])}</span></div>
      <p style="margin:6px 0">${r.tx?esc(r.tx):'<span class="muted">(no comment)</span>'}</p><p class="muted" style="font-size:.8rem;margin:0">${esc(US[r.sid]||'')} · <a href="#/student/${esc(r.sid)}">${esc(r.sid)}</a> · ${ago(r.t)}${r.re?' · replied: '+esc(r.re):''}</p>
      ${r.st==='open'?`<textarea data-rre="${r.id}" maxlength="500" style="min-height:60px;margin-top:8px" placeholder="Reply to the student (optional)"></textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-rsend="${r.id}">Reply and close</button><button class="btn ghost sm" data-rclose="${r.id}">Close without reply</button></div>`:''}</div>`).join(''):'<p class="muted">Nothing here.</p>';
    b.querySelectorAll('[data-rsend],[data-rclose]').forEach(x=>x.onclick=async()=>{const id=x.dataset.rsend||x.dataset.rclose,r=L.find(y=>y.id===id),t=x.dataset.rsend?(b.querySelector(`[data-rre="${id}"]`).value||'').trim():'';
      x.disabled=true;try{if(t)await CLOUD.saveReview(r.sid,'note_rp'+id.slice(0,12),{fb:('About your report on “'+((I[r.q]&&I[r.q].label)||r.w||r.q)+'”: '+t).slice(0,600),at:isoNow(),by:'lecturer'});
        await CLOUD.put('reports/'+id,{st:'done',re:t.slice(0,500),rt:CLOUD.ts()},true);toast('✓','Report closed',t?'Reply sent':'')}catch(e){x.disabled=false;toast('⚠️','Not saved',CLOUD.say(e))}})};
  el.querySelectorAll('[data-rt]').forEach(x=>x.onclick=()=>{tab=x.dataset.rt;el.querySelectorAll('[data-rt]').forEach(y=>y.classList.toggle('on',y===x));draw()});
  CLOUD.watchUsers(list=>{list.forEach(x=>US[x.id]=x.name||'');draw()});
  CLOUD.watch('reports',{order:['t','desc'],limit:150},list=>{L=list;draw()},e=>{const b=$('#rptb');if(b)b.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})})});

/* ---------- class announcements: announcements/{id} = {t,b,at,exp?} ---------- */
let ANN=[];
function annHTML(){const R=(U&&U.annRead)||{},now=Date.now(),list=ANN.filter(a=>!R[a.id]&&(!a.exp||a.exp>now)).slice(0,3);if(!list.length)return '';
  return `<div class="card inbox ann" style="margin-bottom:16px"><h2 style="margin:0 0 6px">📣 From your lecturer</h2>${list.map(a=>`<div class="note"><b class="lex">${esc(a.t)}</b><p style="margin:4px 0 0">${esc(a.b).replace(/\n/g,'<br>')}</p><div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted" style="font-size:.8rem">${a.at?esc(ymd(new Date(a.at))):''}</span><button class="btn ghost sm" data-annread="${esc(a.id)}">Got it</button></div></div>`).join('')}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-annread]');if(!b||!U)return;U.annRead=U.annRead||{};U.annRead[b.dataset.annread]=1;save();route()});
let annStop=null;
async function annWatch(){if(annStop||!ME||ME.sid===LECTURER||!(await rulesOK()))return;let first=true;
  annStop=CLOUD.watch('announcements',{order:['at','desc'],limit:5},list=>{const was=new Set(ANN.map(a=>a.id));ANN=list;
    const fresh=list.filter(a=>!was.has(a.id)&&!((U&&U.annRead)||{})[a.id]);if(!first&&fresh.length)toast('📣','New announcement',fresh[0].t);first=false;
    const h=location.hash.replace(/^#\/?/,'');if(h===''&&!(document.activeElement&&/TEXTAREA|INPUT/.test(document.activeElement.tagName))&&!document.querySelector('.modal'))route()},()=>{},true)}
onHook('cloud',annWatch);onHook('signout',()=>{if(annStop)annStop();annStop=null;ANN=[]});

lcard('annc',el=>{rulesOK().then(ok=>{if(!ok)return;el.hidden=false;
  el.innerHTML=`<h2 style="margin:0">Announcements</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Shown at the top of every student's home page until they tap "Got it" (or until the date you choose).</p>
  <label for="ant">Title</label><input type="text" id="ant" maxlength="80" placeholder="E.g. Tutorial moved to Thursday">
  <label for="anb">Message</label><textarea id="anb" maxlength="600" style="min-height:80px"></textarea>
  <label for="ane">Show until (optional)</label><input type="date" id="ane" style="max-width:220px">
  <div class="row" style="margin-top:10px"><button class="btn" id="ango">📣 Post to the class</button></div><div id="anl" style="margin-top:12px"></div>`;
  $('#ango').onclick=async()=>{const t=$('#ant').value.trim(),b=$('#anb').value.trim(),e=$('#ane').value;if(!t||!b){toast('✍️','Add a title and a message','');return}
    $('#ango').disabled=true;try{await CLOUD.add('announcements',Object.assign({t:t.slice(0,80),b:b.slice(0,600),at:CLOUD.ts()},e?{exp:CLOUD.when(new Date(e+'T23:59:59').getTime())}:{}));$('#ant').value=$('#anb').value=$('#ane').value='';toast('📣','Posted','')}
    catch(x){toast('⚠️','Not posted',CLOUD.say(x))}$('#ango').disabled=false};
  CLOUD.watch('announcements',{order:['at','desc'],limit:20},list=>{const l=$('#anl');if(!l)return;
    l.innerHTML=list.length?`<h3>Posted</h3>${list.map(a=>`<div class="note" style="margin:6px 0"><div class="row" style="justify-content:space-between"><b>${esc(a.t)}</b><button class="btn ghost sm" data-andel="${a.id}">Delete</button></div><p style="margin:4px 0 0;font-size:.9rem">${esc(a.b)}</p><span class="muted" style="font-size:.78rem">${a.at?ago(a.at):''}${a.exp?' · until '+ymd(new Date(a.exp)):''}</span></div>`).join('')}`:'';
    l.querySelectorAll('[data-andel]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this announcement?'))try{await CLOUD.del('announcements/'+b.dataset.andel)}catch(x){toast('⚠️','Not deleted',CLOUD.say(x))}})})})});

/* ---------- streak freeze and earn-back ----------
   U.frz={b: freezes banked (max 2), d:{date:'f' frozen | 'e' earned back}, g:{date:1} freeze earned that day, eb:{weekStart:date}}.
   Earn 1 freeze each time the streak reaches a multiple of 4. A missed day is covered automatically when a freeze is banked.
   With none banked, a 20-minute focus block (stblock:<today>:1) the day after a single missed day earns it back, at most once a week. */
const FRZ_MAX=2;
function frzGap(){const F=U.frz||{},days=new Set(U.days),t=today();let d=addDays(t,-1);const gap=[];while(!days.has(d)&&!(F.d||{})[d]&&gap.length<5){gap.push(d);d=addDays(d,-1)}
  return {gap,before:days.has(d)||!!(F.d||{})[d],last:d}}
function frzTick(){if(!U||!ME||ME.sid===LECTURER)return;const F=U.frz=U.frz||{b:0,d:{},g:{},eb:{}};F.d=F.d||{};F.g=F.g||{};F.eb=F.eb||{};const t=today();let ch=false;
  const {gap,before}=frzGap();
  if(gap.length&&before&&gap.length<=F.b){gap.forEach(x=>F.d[x]='f');F.b-=gap.length;ch=true;toast('❄️','Streak freeze used',gap.length>1?gap.length+' missed days covered':'Yesterday is covered: your streak is safe')}
  else if(gap.length===1&&before&&U.log['stblock:'+t+':1']&&!F.eb[weekKey(t)]){F.d[gap[0]]='e';F.eb[weekKey(t)]=t;ch=true;toast('🔥','Streak earned back','Your 20 focused minutes saved yesterday')}
  const n=streak(U);if(U.days.includes(t)&&n>0&&n%4===0&&!F.g[t]){F.g[t]=1;ch=true;if(F.b<FRZ_MAX){F.b++;toast('❄️','Streak freeze earned',n+' days in a row! A missed day will be covered automatically.')}}
  if(ch){Object.keys(F.g).forEach(k=>{if(k<addDays(t,-90))delete F.g[k]});save();hud()}}
/* would-be streak if the single missed day were earned back */
function frzRescue(){if(!U||!U.frz||ME.sid===LECTURER)return null;const {gap,before,last}=frzGap();if(gap.length!==1||!before||U.frz.b>0||U.frz.eb[weekKey(today())])return null;
  const u=Object.assign({},U,{frz:Object.assign({},U.frz,{d:Object.assign({},U.frz.d,{[gap[0]]:'e'})})});return {n:streak(u),day:gap[0]}}
function frzHTML(){const r=frzRescue();if(!r||!r.n)return '';const blk=(((U.stx||{})[today()]|0));
  return `<div class="card inbox" style="margin-bottom:16px;border-color:var(--gold)"><h2 style="margin:0 0 6px">🔥 Save your ${r.n}-day streak</h2><p style="margin:0">You missed yesterday. Practise for <b>20 focused minutes today</b> to earn it back (once a week).</p><div class="bar" style="margin-top:8px"><i style="width:${Math.min(100,blk/ST.BLOCK*100)|0}%"></i></div><p class="muted" style="font-size:.8rem;margin:4px 0 0">${Math.floor(blk/60)} of 20 minutes</p></div>`}
onHook('afterLoad',frzTick);onHook('leave',()=>{if(ME&&U)frzTick()});onHook('award',()=>frzTick());

/* ---------- lecturer: XP audit (fake-XP detection) ---------- */
/* XP the record can explain: every keyed award (U.gain), the daily check-in (+10 per day kept) and the daily mission bonus */
function xpAudit(u,board){u=u||{};const g=u.gain||{},log=u.log||{};const keyed=Object.keys(log).reduce((t,k)=>t+(+g[k]||0),0),days=(u.days||[]).length,mb=((u.n||{}).missions|0)*Math.max(...MBONUS);
  const xp=u.xp|0,expl=keyed+days*10+mb,flags=[];
  if(xp-expl>300)flags.push('XP not explained by activity: '+(xp-expl)+' extra');
  if(board&&board.x>xp+20)flags.push('Leaderboard shows '+board.x+' XP but the progress has '+xp);
  if(xp>2000&&Object.keys(log).length<20)flags.push('High XP with very little activity');
  return {xp,expl,flags}}
lcard('xpac',el=>{el.hidden=false;let US=null,BD=null;
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">XP check</h2><span class="live"><i></i>LIVE</span></div><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Compares each student's XP with what their activity explains, and with the leaderboard. A flag is a reason to look, not proof.</p><div id="xpab"><p class="muted">Loading…</p></div>`;
  const draw=()=>{const b=$('#xpab');if(!b||!US||!BD)return;const rows=US.filter(x=>x.id!==LECTURER&&x.u).map(x=>Object.assign({id:x.id,name:x.name},xpAudit(x.u,BD[x.id]))).filter(r=>r.flags.length);
    b.innerHTML=rows.length?`<div class="tablewrap"><table><tr><th>Student</th><th>XP</th><th>Explained</th><th>Flags</th></tr>${rows.map(r=>`<tr class="click" data-sid="${esc(r.id)}"><td>${esc(r.name)}<div class="muted" style="font-size:.78rem">${esc(r.id)}</div></td><td>${r.xp}</td><td>${r.expl}</td><td>${r.flags.map(esc).join('<br>')}</td></tr>`).join('')}</table></div>`:'<p class="muted">✓ No XP looks out of place.</p>';
    b.querySelectorAll('tr[data-sid]').forEach(r=>r.onclick=()=>openStudent(r.dataset.sid))};
  CLOUD.watchUsers(l=>{US=l;draw()});CLOUD.watchBoard(l=>{BD={};l.forEach(r=>BD[r.id]=r);draw()})});

/* ---------- lecturer: at-risk alerts ---------- */
function riskOf(x){const u=x.u||{},now=Date.now(),day=864e5,r=[];const last=x.ts?x.ts.getTime?x.ts.getTime():x.ts:0;
  if(last&&now-last>5*day)r.push('not active for '+Math.floor((now-last)/day)+' days');
  const ds=(u.days||[]).slice().sort(),t=today();if(ds.length>=3){const lastDay=ds[ds.length-1];let run=1;for(let i=ds.length-1;i>0&&addDays(ds[i-1],1)===ds[i];i--)run++;
    if(lastDay<addDays(t,-1)&&run>=3)r.push('lost a '+run+'-day streak')}
  if(typeof stWeek==='function'&&last&&now-last<14*day&&stWeek(u)<20*60)r.push('under 20 min of practice this week');
  const w=weakOf(u);if(w.length&&u.xp>300)r.push('weak spots: '+w.join(', '));
  return r}
lcard('riskc',el=>{el.hidden=false;
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Students who may need a nudge</h2><span class="live"><i></i>LIVE</span></div><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Inactive for 5+ days, lost a streak of 3+ days, or under 20 minutes this week. Send a friendly message: it appears on their home page.</p><div id="riskb"><p class="muted">Loading…</p></div>`;
  CLOUD.watchUsers(list=>{const b=$('#riskb');if(!b)return;const ae=document.activeElement;if(ae&&b.contains(ae)&&ae.tagName==='TEXTAREA')return;
    const rows=list.filter(x=>x.id!==LECTURER&&x.u).map(x=>({x,r:riskOf(x).filter(s=>!/^weak/.test(s))})).filter(y=>y.r.length).sort((a,b)=>b.r.length-a.r.length);
    b.innerHTML=rows.length?rows.map(({x,r})=>`<div class="note" style="margin:6px 0"><div class="row" style="justify-content:space-between"><a href="#/student/${esc(x.id)}"><b>${esc(x.name||x.id)}</b></a><span class="muted" style="font-size:.8rem">${esc(x.id)}</span></div><p class="muted" style="margin:4px 0;font-size:.86rem">${r.map(esc).join(' · ')}</p>
      <details><summary class="click" style="font-size:.86rem">✉️ Send a nudge</summary><textarea data-nudge="${esc(x.id)}" maxlength="600" style="min-height:60px;margin-top:6px">Hi! I noticed you haven't practised for a while. Ten minutes today keeps you on track. You've got this! 💪</textarea><button class="btn sm" data-nsend="${esc(x.id)}" style="margin-top:6px">Send</button></details></div>`).join(''):'<p class="muted">✓ Everyone who has signed up is on track.</p>';
    b.querySelectorAll('[data-nsend]').forEach(btn=>btn.onclick=async()=>{const sid=btn.dataset.nsend,t=b.querySelector(`[data-nudge="${sid}"]`).value.trim();if(!t)return;btn.disabled=true;
      try{await CLOUD.saveReview(sid,'note_n'+Date.now().toString(36),{fb:t.slice(0,600),at:isoNow(),by:'lecturer'});toast('✉️','Sent',sid);btn.textContent='✓ Sent'}catch(e){btn.disabled=false;toast('⚠️','Not sent',CLOUD.say(e))}})})});

/* ---------- lecturer: full class backup (JSON) ---------- */
const BACKUP_COLS=['users','board','reviews','sessions','directory','announcements','reports','errors','challenges','notifs','qbank','battles','weekend'];
lcard('bkc',el=>{el.hidden=false;
  el.innerHTML=`<h2 style="margin:0">Class backup</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Downloads everything in the class database (progress, leaderboard, marks, sessions and the rest) as one JSON file. Keep it private: it holds personal data.</p><button class="btn" id="bkgo">⬇ Download full class backup (JSON)</button><p class="muted" id="bkst" style="font-size:.85rem;margin:8px 0 0" aria-live="polite"></p>`;
  $('#bkgo').onclick=async()=>{const st=$('#bkst'),out={course:CRS.id,at:isoNow(),counts:{},data:{}};$('#bkgo').disabled=true;
    for(const c of BACKUP_COLS){st.textContent='Reading '+c+'…';try{const d=await CLOUD.docs(c);out.data[c]=Object.fromEntries(d.map(x=>[x.id,x]));out.counts[c]=d.length;
      if(c==='sessions')for(const s of d){try{const p=await CLOUD.docs('sessions/'+s.id+'/p');out.data['sessions/'+s.id+'/p']=Object.fromEntries(p.map(x=>[x.id,x]))}catch(e){}}}catch(e){}}
    out.students=Object.keys(out.data.users||{}).filter(s=>s!==LECTURER).length;
    dl(CRS.id+'-backup-'+isoNow().replace(/[:.]/g,'-')+'.json',JSON.stringify(out));st.textContent='✓ Downloaded: '+out.students+' students, '+Object.entries(out.counts).map(([k,n])=>k+' '+n).join(', ');$('#bkgo').disabled=false}});

/* ---------- privacy page (#/privacy) ---------- */
ROUTES.privacy=()=>shell('#/privacy',`<h1>Privacy</h1><div class="card reader" style="max-width:760px">
  <p>${esc(CRS.name)} is a practice site for your course at MNU. Here is what it keeps and who can see it.</p>
  <h2>What is saved</h2><ul><li>Your student ID and your name from the class list.</li><li>Your progress: XP, badges, streak, practice answers, plans, self-checks, screen time on the site and your settings.</li><li>Typed answers you submit for marking, and the feedback you get.</li><li>Problems you report on a question, and error messages from your browser if the site breaks (no answers or passwords).</li></ul>
  <h2>Who can see it</h2><ul><li><b>Your classmates</b> see your name, @username, avatar, level, XP, badges and streak on the leaderboard and in challenges, as on Moodle.</li><li><b>Your lecturer</b> sees all of your progress and answers, to help you learn.</li><li>Nobody else. Your PIN is never visible to anyone, including your lecturer.</li></ul>
  <h2>Where it is kept</h2><p>On this device, and (when you sign in with your PIN) in the course's Google Firebase database, protected by security rules so only you and your lecturer can read your progress.</p>
  <h2>Your choices</h2><ul><li>Download a copy of your progress any time with 💾 Save.</li><li>Ask your lecturer to delete your account and progress at the end of the course.</li></ul>
  <p class="muted" style="font-size:.85rem">Practice material only. Questions? Ask your lecturer.</p></div>`);

/* ---------- lecturer: extra cards on a student's profile (XP check, streak freezes) ---------- */
const BOARD_ROW={};
function profileXHTML(sid,u){const row=BOARD_ROW[sid];if(row===undefined){BOARD_ROW[sid]=null;CLOUD.get('board/'+sid).then(r=>{BOARD_ROW[sid]=r||false;const e=$('#pxa');if(e&&e.dataset.sid===sid)e.outerHTML=profileXHTML(sid,u)}).catch(()=>{})}
  const A=xpAudit(u,row||null),F=u.frz||{},fd=Object.entries(F.d||{}).sort().reverse().slice(0,6);
  return `<div class="card psec" id="pxa" data-sid="${esc(sid)}"><h2>XP check ${A.flags.length?'<span class="tag" style="color:var(--red)">⚠️ '+A.flags.length+' flag'+(A.flags.length>1?'s':'')+'</span>':'<span class="tag">✓ OK</span>'}</h2>
  <p style="font-size:.9rem;margin:0">Progress XP <b>${A.xp}</b> · explained by activity <b>${A.expl}</b>${row?' · leaderboard <b>'+row.x+'</b>':row===false?' · not on the leaderboard':''}</p>
  ${A.flags.length?`<ul class="sumlist" style="margin-top:6px">${A.flags.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:''}
  <p class="muted" style="font-size:.85rem;margin:8px 0 0">❄️ Streak freezes banked: ${F.b|0}/${FRZ_MAX}${fd.length?' · covered days: '+fd.map(([d,k])=>d+(k==='e'?' (earned back)':'')).join(', '):''}</p></div>`}
