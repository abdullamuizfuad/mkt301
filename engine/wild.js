/* MKT Arena engine: the weekly 6th-spot challenge (#/wild, the lecturer's live screen #/wild/live). Needs the combined rules (wild blocks).
   The lecturer brings a gift each week for the top 5 students by XP earned that week. Everyone else gets one 20-minute attempt at a
   stand-alone challenge; the best score wins the 6th gift. The lecturer is never a player.
   - The window (CRS.wild = {day, hour}: the class start, GMT+5) opens 24 hours before class and closes when class starts.
     wildWin(now) → {id:'w<class date>', opens, closes, from (the previous class start), open}.
   - The week's top 5: XP earned from the previous class start up to the opening (U.xph, XP per hour GMT+5, kept 21 days;
     days before U.xph existed fall back to U.xpd). Only students with XP that week qualify. Locked when the challenge opens.
   - wild/{id} {wk, top:[topic keys], tl:[labels], items:[ids], t5:[SIDs], t5x:[week XP], opens, closes, st plan|open|closed|done, res, win, by}
       written only by the lecturer: tools/wild/open.mjs (a scheduled task) or "Open this week's challenge" on the lecturer's screens.
     wild/{id}/e/{SID} {st go|done, at, s, mx, ms, a:{index:{v:answer, t:ms}}, fin}: the student's attempt (created at the start, finished once).
     wild/{id}/s/{SID} {n, s, mx, ms, at}: the public score for the live "6th spot" table (must match the attempt).
   - Questions (course hooks): wildTopicList() → [[key, label]], wildItems(topics, seed) → ids (same for everyone, in one shuffled order),
     wildItem(id) → {kind:'mcq', q, o:[correct first], why} or a chips question (engine/chips.js), wildArea(key) → the readiness area key.
     MCQs score 1, chips questions up to 4.
   - Before starting, the two topics show with "📖 Refer to notes"; notes are locked (WILD_LOCK) once the 20 minutes start.
   - XP: +20 for taking part (wild:<id>), +30 for the confirmed winner (wildwin:<id>). The gift itself is real.
   - The lecturer confirms the winner after the close (ties: higher score, then less time, then earlier finish). */
const WILD_MS=20*60e3;
let WILD_LOCK=false,WILDT=null;onHook('leave',()=>clearInterval(WILDT));
const wildCfg=()=>CRS.wild||null;
function wildWin(now){now=now==null?Date.now():now;const W=wildCfg();if(!W)return null;const mv=new Date(now+MV);
  let c=Date.UTC(mv.getUTCFullYear(),mv.getUTCMonth(),mv.getUTCDate()+((W.day-mv.getUTCDay()+7)%7),W.hour)-MV;if(c<=now)c+=7*864e5;
  const o=c-864e5;return {id:'w'+mvDay(c),opens:o,closes:c,from:c-7*864e5,open:now>=o&&now<c}}
const wildPrev=()=>{const w=wildWin();return w?wildWin(w.closes-7*864e5-1):null};/* last week's window (closed) */
const mvHour=t=>new Date((t==null?Date.now():t)+MV).toISOString().slice(0,13);
const wildWhen=t=>{const d=new Date(t+MV);return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+' '+d.getUTCDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]+', '+((d.getUTCHours()+11)%12+1)+':'+String(d.getUTCMinutes()).padStart(2,'0')+(d.getUTCHours()<12?' am':' pm')};
/* XP per hour (GMT+5), for the weekly top 5 */
onHook('award',(key,xp)=>{if(!U||!xp)return;U.xph=U.xph||{};const h=mvHour();U.xph[h]=(U.xph[h]|0)+xp;const cut=mvHour(Date.now()-21*864e5);Object.keys(U.xph).forEach(k=>{if(k<cut)delete U.xph[k]})});
function weekXP(u,from,to){const H=u.xph||{},a=mvHour(from),b=mvHour(to),hd=new Set(Object.keys(H).map(k=>k.slice(0,10)));let x=0;
  Object.entries(H).forEach(([k,v])=>{if(k>=a&&k<b)x+=v|0});
  Object.entries(u.xpd||{}).forEach(([d,v])=>{if(!hd.has(d)&&d>=a.slice(0,10)&&d<=b.slice(0,10))x+=v|0});return x}
/* rows: [{id, u}] → the week's top 5 [{id, x}] */
function wildTop5(rows,win){return rows.filter(r=>r.id!==LECTURER&&/^S0\d{5}$/.test(r.id)).map(r=>({id:r.id,x:weekXP(r.u||{},win.from,win.opens),xp:(r.u||{}).xp|0})).filter(r=>r.x>0)
  .sort((a,b)=>b.x-a.x||b.xp-a.xp||(a.id<b.id?-1:1)).slice(0,5).map(r=>({id:r.id,x:r.x}))}
/* scoring an attempt from its answers (the lecturer re-checks every entry this way) */
function wildScore(items,a){let s=0,mx=0;items.forEach((id,i)=>{const it=wildItem(id);if(!it)return;const v=(a||{})[i];
  if(it.kind==='chips'){mx+=it.max||4;if(v&&Array.isArray(v.v))s+=chipsScore(it,v.v).s}else{mx+=1;if(v&&v.v===0)s+=1}});return {s,mx}}
const wildSensible=items=>items.reduce((t,id)=>{const it=wildItem(id);return t+(it&&it.kind==='chips'?120e3:45e3)},0);
function wildFlags(e,items){const f=[],sn=wildSensible(items);if(e.ms<sn*.25)f.push('very fast');if(e.s===e.mx&&e.mx>0&&e.ms<sn*.4)f.push('perfect in very little time');
  const r=wildScore(items,e.a);if(r.s!==e.s)f.push('score does not match the answers ('+r.s+')');return f}
const wildDur=ms=>{const t=Math.round((ms|0)/1000);return Math.floor(t/60)+' min '+String(t%60).padStart(2,'0')+' s'};
const wildRank=L=>L.slice().sort((a,b)=>b.s-a.s||a.ms-b.ms||(a.fin|0)-(b.fin|0));
const wildDefTopics=win=>{const L=wildTopicList().map(x=>String(x[0])),wk=String(termWeek(mvDay(win.opens))),i=L.indexOf(wk);return i<0?L.slice(-2):i===0?L.slice(0,2):[L[i-1],L[i]]};
const wildTL=top=>top.map(k=>(wildTopicList().find(x=>String(x[0])===String(k))||[k,String(k)])[1]);
let WSDIR=null;const wildDir=async()=>{if(!WSDIR){try{const d=await CLOUD.docs('directory');WSDIR={};d.forEach(x=>WSDIR[x.id]=x)}catch(e){WSDIR={}}}return WSDIR};
const wildName=sid=>(WSDIR&&WSDIR[sid]&&WSDIR[sid].n)||sid;

/* the lecturer opens the week's challenge (the scheduled task does the same with tools/wild/open.mjs) */
async function wildOpen(win,topics){if(ME.sid!==LECTURER)return;const old=await CLOUD.get('wild/'+win.id);if(old&&old.st!=='plan')return old;
  const us=await CLOUD.docs('users'),rows=us.map(x=>{let u={};try{u=JSON.parse(x.u)}catch(e){}return {id:x.id,u}});
  let top=topics||(old&&old.top&&old.top.length===2?old.top:null)||(CRS.wildPlan||{})[win.id]||null;
  if(!top){/* the two weakest topics across the class (readiness), else the two most recent */const L=wildTopicList(),sc={};
    rows.forEach(r=>readiness(r.u).forEach(a=>{const k=L.find(x=>wildArea(x[0])===a.k);if(k&&a.pct!=null){(sc[k[0]]=sc[k[0]]||[]).push(a.pct)}}));
    const ks=Object.keys(sc).filter(k=>+k<=termWeek(mvDay(win.opens))).map(k=>[k,sc[k].reduce((t,v)=>t+v,0)/sc[k].length]).sort((a,b)=>a[1]-b[1]);top=ks.length>=2?ks.slice(0,2).map(x=>x[0]).sort((a,b)=>a-b):wildDefTopics(win)}
  top=top.map(String);const t5=wildTop5(rows,win),items=wildItems(top,CRS.id+'|'+win.id);
  const doc={wk:win.id,top,tl:wildTL(top),items,t5:t5.map(r=>r.id),t5x:t5.map(r=>r.x),opens:CLOUD.when(win.opens),closes:CLOUD.when(win.closes),st:'open',by:LECTURER};
  await CLOUD.put('wild/'+win.id,doc);
  const D=await wildDir(),all=[...new Set(Object.keys(D).concat(rows.map(r=>r.id)))].filter(s=>s!==LECTURER&&/^S0\d{5}$/.test(s)),when=wildWhen(win.closes);
  await Promise.all(all.map(s=>notify(s,doc.t5.includes(s)?'result':'invite','wild:'+win.id,doc.t5.includes(s)?"You're in this week's top 5. Hold your place 🎁":`This week's 6th-spot challenge is open until ${when}. The best score wins the 6th gift 🎁`).catch(()=>{})));
  return Object.assign({id:win.id},doc,{opens:win.opens,closes:win.closes})}
/* the topics for a challenge that has not opened yet */
const wildPlan=(win,top)=>CLOUD.put('wild/'+win.id,{wk:win.id,top:top.map(String),tl:wildTL(top),st:'plan',by:LECTURER,opens:CLOUD.when(win.opens),closes:CLOUD.when(win.closes)});

/* ---------- students: #/wild ---------- */
const wildId=x=>x&&/^w[\w-]{1,30}$/.test(x)?x:null;
ROUTES.wild=async h=>{if(h[1]==='live')return wildLive(wildId(h[2]));if(ME.sid===LECTURER)return wildLive(wildId(h[1]));
  if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>🎁 6th-spot challenge</h1><p class="muted">The weekly challenge switches on soon.</p>`);
  const win=wildWin(),prev=wildPrev();await wildDir();
  shell('#/',`<p><a href="#/">← Home</a></p><h1>🎁 6th-spot challenge</h1><p class="muted">Every week your lecturer brings a gift for the top 5 students by XP earned that week. Everyone else can win the <b>6th gift</b>: the best score in this 20-minute challenge wins it.</p><div id="wlv"><p class="muted">Loading…</p></div>`);
  let D=null,S=[],stop=null;const id=wildId(h[1])||(win.open?win.id:prev.id);
  const draw=()=>{const el=$('#wlv');if(!el||WILD_LOCK)return;const mine=(U.wild||{})[id],open=D&&D.st==='open'&&Date.now()>=D.opens&&Date.now()<D.closes,inT5=D&&(D.t5||[]).includes(ME.sid);
    if(mine&&!mine.done&&D&&D.items){if(Date.now()-mine.at<WILD_MS)return wildRun(D,mine);wildSubmit(D,mine).then(draw);return}
    const rank=wildRank(S),me=S.find(r=>r.id===ME.sid),won=D&&D.win;if(won===ME.sid&&award('wildwin:'+id,30,'6th spot won! 🎁'))countOnce('wildwin:'+id,'wildwins');
    el.innerHTML=(!D?`<div class="card"><p style="margin:0">${win.open?'This week\'s challenge opens soon.':`The next challenge opens <b>${esc(wildWhen(win.opens))}</b> and closes when class starts, <b>${esc(wildWhen(win.closes))}</b>.`}</p></div>`
      :`<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${open?'Open now':D.st==='plan'?'Coming up':'Closed'}</h2><span class="tag">${open?'Closes '+esc(wildWhen(D.closes)):D.st==='plan'?'Opens '+esc(wildWhen(D.opens)):esc(wildWhen(D.closes))}</span></div>
        <p style="margin:8px 0 4px"><b>Topics:</b></p><div class="wtop">${(D.top||[]).map((k,i)=>`<div class="rdrow"><span class="rdl">${esc((D.tl||[])[i]||k)}</span>${notesHref({topic:k},{topic:k})?`<a class="btn ghost sm" href="${notesHref({topic:k},{topic:k})}">📖 Refer to notes</a>`:''}</div>`).join('')}</div>
        ${inT5?`<div class="callout" id="wt5" style="margin-top:10px">🏆 You're in this week's top 5. Hold your place 🎁</div>`
          :mine&&mine.done?`<div class="callout" style="margin-top:10px">You scored <b>${mine.s}/${mine.mx}</b> in ${wildDur(mine.ms)}.${D.win?'':' The winner is announced when class starts.'}</div>`
          :open&&D.items?`<div class="card" style="margin-top:10px;text-align:center"><p style="margin:0 0 8px">${D.items.length} questions · 20 minutes · <b>one attempt</b>. The clock keeps running if you close the app. Notes are locked once you start, so read them first.</p><button class="btn gold" id="wgo">▶ Start the challenge</button></div>`
          :D.st==='plan'?'<p class="muted" style="margin:8px 0 0">Read the notes on these topics before the challenge opens.</p>':''}
        ${D.win?`<div class="callout" style="margin-top:10px">🎁 6th spot: <b>${esc(D.win===ME.sid?'You! Collect your gift in class.':wildName(D.win))}</b></div>`:''}</div>
      <div class="card" style="margin-top:12px"><h2 style="margin:0 0 6px">6th spot table</h2>${rank.slice(0,10).map((r,i)=>`<div class="rdrow${r.id===ME.sid?' me':''}"><span class="rdl">${i+1}. ${esc(r.id===ME.sid?'You':r.n||wildName(r.id))}</span><span class="muted">${Math.round(r.ms/1000)} s</span><b>${r.s}/${r.mx}</b></div>`).join('')||'<p class="muted" style="margin:0">No one has finished yet.</p>'}${me&&rank.indexOf(me)>=10?`<div class="rdrow me"><span class="rdl">${rank.indexOf(me)+1}. You</span><b>${me.s}/${me.mx}</b></div>`:''}</div>`)
      +(D&&D.st!=='open'&&D.st!=='plan'&&D.items&&mine&&mine.done?`<details class="card" style="margin-top:12px"><summary><b>Review your answers</b></summary>${wildReviewHTML(D,mine.a)}</details>`:'');
    $('#wgo')&&($('#wgo').onclick=()=>wildStart(D))};
  stop=CLOUD.watchOne('wild/'+id,d=>{D=d;draw()},e=>{const el=$('#wlv');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});
  CLOUD.watch('wild/'+id+'/s',{},d=>{S=d;draw()},()=>{})};
async function wildStart(D){if(ME.sid===LECTURER||VIEWAS)return;U.wild=U.wild||{};if(U.wild[D.id])return ROUTES.wild(['wild',D.id]);
  try{await CLOUD.put('wild/'+D.id+'/e/'+ME.sid,{st:'go',at:CLOUD.ts()})}catch(e){toast('⚠️','Could not start',CLOUD.say(e));return}
  U.wild[D.id]={at:Date.now(),i:0,a:{},done:0};save();wildRun(D,U.wild[D.id])}
function wildRun(D,A){WILD_LOCK=true;document.body.classList.add('wlock');const el=$('#wlv');if(!el)return;clearInterval(WILDT);
  const left=()=>A.at+WILD_MS-Date.now(),fin=()=>{clearInterval(WILDT);wildSubmit(D,A).then(()=>ROUTES.wild(['wild',D.id]))};
  const one=()=>{if(A.i>=D.items.length||left()<=0)return fin();const it=wildItem(D.items[A.i]),t0=Date.now();
    el.innerHTML=`<div class="card qcard wrun"><div class="row" style="justify-content:space-between"><span class="tag">${A.i+1} of ${D.items.length}</span><b class="lex" id="wclk"></b></div><div id="wq"></div>
      <p class="muted" style="font-size:.8rem;margin:10px 0 0">📖 Notes are locked during the challenge.</p></div>`;
    const next=v=>{A.a[A.i]={v,t:Date.now()-t0};A.i++;save();one()};
    if(!it){next(null);return}
    if(it.kind==='chips')chipsUI($('#wq'),it,{seed:D.id+'|'+it.id,fb:false,btn:A.i+1<D.items.length?'Save and next →':'Save and finish',onDone:sel=>next(sel)});
    else{const ord=qmix(seeded(D.id+'|'+it.id),it.o.map((x,j)=>j));$('#wq').innerHTML=`<h2 style="font-weight:600;margin:10px 0">${esc(it.q)}</h2><div class="mopts">${ord.map(j=>`<button class="mopt" data-wo="${j}">${esc(it.o[j])}</button>`).join('')}</div>`;
      $('#wq').querySelectorAll('[data-wo]').forEach(b=>b.onclick=()=>next(+b.dataset.wo))}};
  const tick=()=>{const e=$('#wclk'),l=left();if(!document.body.contains(el))return clearInterval(WILDT);if(l<=0)return fin();if(e)e.textContent='⏱ '+Math.floor(l/60000)+':'+String(Math.floor(l/1000)%60).padStart(2,'0')};
  one();tick();WILDT=setInterval(tick,500)}
/* finishing: the attempt (with every answer), then the public score; +20 XP for taking part */
async function wildSubmit(D,A){WILD_LOCK=false;document.body.classList.remove('wlock');if(A.done&&A.up)return;if(A.done&&!A.up)return wildUpload(D,A);const r=wildScore(D.items,A.a),V=Object.values(A.a),ms=Math.round(V.length>=D.items.length?Math.min(WILD_MS,V.reduce((t,x)=>t+(x.t|0),0)):WILD_MS);
  const a={};Object.entries(A.a).forEach(([i,x])=>{a[i]={v:x.v==null?-1:x.v,t:x.t|0}});
  Object.assign(A,{done:1,up:0,s:r.s,mx:r.mx,ms,sa:a});save();if(award('wild:'+D.id,20,'6th-spot challenge'))countOnce('wild:'+D.id,'wild');return wildUpload(D,A)}
/* sends a finished attempt (again, if it failed before): the attempt first, then the public score */
async function wildUpload(D,A){if(A.up||A.busy)return;A.busy=1;
  try{const e=await CLOUD.get('wild/'+D.id+'/e/'+ME.sid);if(!e||e.st!=='done')await CLOUD.put('wild/'+D.id+'/e/'+ME.sid,{st:'done',s:A.s,mx:A.mx,ms:A.ms,a:A.sa||{},fin:CLOUD.ts()},true);
    if(!await CLOUD.get('wild/'+D.id+'/s/'+ME.sid))await CLOUD.put('wild/'+D.id+'/s/'+ME.sid,{n:String(U.dn||'').slice(0,80),s:A.s,mx:A.mx,ms:A.ms,at:CLOUD.ts()});A.up=1;save()}
  catch(e){toast('⚠️','Your score was not sent yet',CLOUD.say(e)+' It is kept on this device and sent next time.')}finally{A.busy=0}}
function wildReviewHTML(D,a){return D.items.map((id,i)=>{const it=wildItem(id),v=(a||{})[i];if(!it)return '';
  if(it.kind==='chips'){const sel=v&&Array.isArray(v.v)?v.v:[],R=chipsScore(it,sel);return `<div class="wrv"><b>${i+1}. ${esc(it.q)}</b><p class="muted" style="margin:4px 0">Your paragraph (${R.s}/${R.max}): ${esc(chipPara(it,sel))||'–'}</p><p style="margin:0">Strong paragraph: ${esc(chipPara(it,R.best))}</p></div>`}
  return `<div class="wrv"><b>${i+1}. ${esc(it.q)}</b><p style="margin:4px 0">${v&&v.v===0?'✓':'✗'} ${esc(it.o[0])}</p>${it.why?`<p class="muted" style="margin:0;font-size:.85rem">${esc(it.why)}</p>`:''}</div>`}).join('')}

/* ---------- the lecturer: live screen and history (#/wild/live) ---------- */
async function wildLive(pick){if(ME.sid!==LECTURER)return ROUTES.wild(['wild']);
  if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>🎁 6th-spot challenge</h1><p class="muted">Publish the latest rules to switch the weekly challenge on.</p>`);
  const win=wildWin(),prev=wildPrev();await wildDir();let id=pick||(win.open?win.id:prev.id),D=null,E=[],stopE=null;
  shell('#/',`<div data-lect class="wlive"><div class="row" style="justify-content:space-between"><h1 style="margin:0">🎁 6th-spot challenge</h1><span class="row"><a class="btn ghost sm" href="#/lecturer" data-lgo="wildc">Topics and history</a></span></div><div id="wlv" style="margin-top:12px"><p class="muted">Loading…</p></div></div>`);
  const draw=()=>{const el=$('#wlv');if(!el)return;clearInterval(WILDT);
    if(!D||D.st==='plan'){el.innerHTML=`<div class="card"><h2 style="margin:0 0 6px">${win.open?'This week\'s challenge is not open yet':'Next challenge'}</h2><p>Opens <b>${esc(wildWhen(win.opens))}</b>, closes <b>${esc(wildWhen(win.closes))}</b> (class start).${D&&D.top?' Topics: '+esc((D.tl||D.top).join(' and '))+'.':''}</p>
      ${win.open?`<button class="btn gold" id="wopen">Open this week's challenge</button><p class="muted" style="font-size:.85rem">Locks this week's top 5 and sends everyone else an invite.</p>`:'<p class="muted" style="font-size:.85rem">The scheduled task opens it on time. If it hasn\'t, an "Open" button appears here when the window starts.</p>'}</div>`;
      $('#wopen')&&($('#wopen').onclick=async()=>{$('#wopen').disabled=true;try{D=await wildOpen(win);toast('🎁','Challenge open','Invites sent');watch()}catch(e){$('#wopen').disabled=false;toast('⚠️','Not opened',CLOUD.say(e))}});return}
    const done=E.filter(e=>e.st==='done'),rank=wildRank(done),closed=Date.now()>=D.closes,started=E.length-done.length;
    el.innerHTML=`<div class="card wbig"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><p class="muted" style="margin:0">${esc((D.tl||D.top||[]).join(' · '))}</p><h2 style="margin:4px 0 0">${closed?'Closed':'Closes '+esc(wildWhen(D.closes))}</h2></div><b class="lex wclock" id="wlc"></b></div>
      <p class="muted" style="margin:8px 0 0">${done.length} finished · ${started} in progress</p></div>
      <div class="grid g2" style="margin-top:12px"><div class="card"><h2 style="margin:0 0 6px">6th spot</h2>${rank.slice(0,10).map((e,i)=>{const f=wildFlags(e,D.items);return `<div class="rdrow${D.win===e.id?' me':''}"><span class="rdl">${i+1}. ${esc(wildName(e.id))}${f.length?` <span class="tag warn" title="${esc(f.join('; '))}">⚠️ ${esc(f[0])}</span>`:''}</span><span class="muted">${Math.round(e.ms/1000)} s</span><b>${e.s}/${e.mx}</b>${closed&&!D.win?`<button class="btn ghost sm" data-win="${e.id}">Confirm</button>`:''}</div>`}).join('')||'<p class="muted" style="margin:0">No one has finished yet.</p>'}
        ${D.win?`<div class="callout" style="margin-top:10px">🎁 Winner confirmed: <b>${esc(wildName(D.win))}</b></div>`:closed&&rank.length?'<p class="muted" style="font-size:.85rem">Check the top entries (open a name\'s answers below), then confirm the winner.</p>':''}</div>
       <div class="card"><h2 style="margin:0 0 6px">This week's top 5</h2>${(D.t5||[]).map((s,i)=>`<div class="rdrow"><span class="rdl">${i+1}. ${esc(wildName(s))}</span><b>${(D.t5x||[])[i]|0} XP</b></div>`).join('')||'<p class="muted" style="margin:0">No one earned XP this week.</p>'}</div></div>
      ${rank.length?`<details class="card" style="margin-top:12px"><summary><b>Answers of the top entries</b></summary>${rank.slice(0,3).map(e=>`<h3>${esc(wildName(e.id))} · ${e.s}/${e.mx}</h3>${wildReviewHTML(D,e.a)}`).join('')}</details>`:''}`;
    const tk=()=>{const c=$('#wlc');if(!c)return clearInterval(WILDT);const l=D.closes-Date.now();c.textContent=l>0?Math.floor(l/3600e3)+':'+String(Math.floor(l/60e3)%60).padStart(2,'0')+':'+String(Math.floor(l/1e3)%60).padStart(2,'0'):'⏰';if(l<=0&&!closed){clearInterval(WILDT);draw()}};tk();WILDT=setInterval(tk,1000);
    el.querySelectorAll('[data-win]').forEach(b=>b.onclick=async()=>{const sid=b.dataset.win;if(!confirm('Confirm '+wildName(sid)+' as this week\'s 6th-spot winner? Everyone who took part is told.'))return;
      const res={};rank.forEach((e,i)=>res[e.id]={r:i+1,s:e.s,mx:e.mx,ms:e.ms,f:wildFlags(e,D.items).join('; ').slice(0,80)});
      try{await CLOUD.put('wild/'+D.id,{win:sid,st:'done',res},true);await Promise.all(done.map(e=>notify(e.id,'result','wild:'+D.id,e.id===sid?'🎁 You won the 6th spot this week! Collect your gift in class.':`This week's 6th spot went to ${wildName(sid)}. Thanks for taking part!`).catch(()=>{})));toast('🎁','Winner confirmed','')}
      catch(e){toast('⚠️','Not saved',CLOUD.say(e))}})};
  const watch=()=>{CLOUD.watchOne('wild/'+id,d=>{D=d;draw()},e=>{const el=$('#wlv');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});if(stopE)stopE();stopE=CLOUD.watch('wild/'+id+'/e',{},d=>{E=d;draw()},()=>{})};watch()}

/* ---------- the lecturer's card: next topics, open now, history ---------- */
LF_META.wildc=['🎁 6th-spot challenge','Topics, the live screen and past winners'];
lcard('wildc',el=>{rulesOK().then(async ok=>{if(!ok)return;el.hidden=false;const win=wildWin(),L=wildTopicList();let P=null;try{P=await CLOUD.get('wild/'+win.id)}catch(e){}
  const cur=(P&&P.top)||(CRS.wildPlan||{})[win.id]||wildDefTopics(win),locked=P&&P.st!=='plan';
  el.innerHTML=`<h2 style="margin:0">🎁 6th-spot challenge</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Opens ${esc(wildWhen(win.opens))} · closes at class start, ${esc(wildWhen(win.closes))}. Students ranked 6th or lower by XP this week get one 20-minute attempt.</p>
   <p style="margin:0 0 4px"><b>Topics for ${esc(win.id.slice(1))}</b>${locked?' (open now: locked)':''}</p>
   <div class="row">${[0,1].map(i=>`<select data-wt="${i}" ${locked?'disabled':''} aria-label="Topic ${i+1}">${L.map(([k,l])=>`<option value="${esc(String(k))}" ${String(cur[i])===String(k)?'selected':''}>${esc(l)}</option>`).join('')}</select>`).join('')}</div>
   ${P&&P.st==='plan'||!P?`<p class="muted" style="font-size:.82rem">${P||(CRS.wildPlan||{})[win.id]?'Saved.':'Not picked yet: if none are picked, the two weakest topics across the class are used.'}</p>`:''}
   <div class="row" style="margin-top:8px">${locked?'':'<button class="btn ghost" id="wsv">Save topics</button>'}${win.open&&!locked?'<button class="btn gold" id="wop">Open now</button>':''}<a class="btn" href="#/wild/live">📺 Live screen</a></div>
   <h3 style="margin:14px 0 6px">Past weeks</h3><div id="whist"><p class="muted">Loading…</p></div>`;
  const pick=()=>[0,1].map(i=>el.querySelector(`[data-wt="${i}"]`).value);
  $('#wsv')&&($('#wsv').onclick=async()=>{const t=pick();if(t[0]===t[1])return toast('🎁','Pick two different topics','');try{await wildPlan(win,t);toast('🎁','Topics saved','')}catch(e){toast('⚠️','Not saved',CLOUD.say(e))}});
  $('#wop')&&($('#wop').onclick=async()=>{const t=pick();if(t[0]===t[1])return toast('🎁','Pick two different topics','');$('#wop').disabled=true;try{await wildOpen(win,t);location.hash='#/wild/live'}catch(e){$('#wop').disabled=false;toast('⚠️','Not opened',CLOUD.say(e))}});
  try{const H=(await CLOUD.docs('wild')).filter(d=>d.st==='done'||d.st==='closed').sort((a,b)=>a.id<b.id?1:-1);await wildDir();
    $('#whist').innerHTML=H.length?H.map(d=>`<div class="rdrow"><span class="rdl">${esc(d.id.slice(1))} · ${esc((d.tl||d.top||[]).join(', '))}</span><span class="muted">${Object.keys(d.res||{}).length} entries</span><b>${d.win?'🎁 '+esc(wildName(d.win)):'–'}</b></div>`).join(''):'<p class="muted" style="margin:0">None yet.</p>';lfTrim&&lfTrim($('#whist'),'whist')}
  catch(e){$('#whist').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`}})});

/* ---------- home: a card while a challenge is open (students), and the live screen (lecturer) ---------- */
async function wildHome(){const el=$('#twild');if(el)el.innerHTML='';if(!el||!ME||!wildCfg())return;if(!(await rulesOK()))return;const win=wildWin();let D=null;try{D=await CLOUD.get('wild/'+win.id)}catch(e){return}
  const box=$('#twild');if(!box)return;const L=ME.sid===LECTURER;
  if(L){box.innerHTML=`<a class="card zone tinv" href="#/wild/live" data-lect><span class="em">🎁</span><span style="flex:1"><b class="lex">6th-spot challenge</b><br><span class="muted" style="font-size:.85rem">${win.open?(D&&D.st!=='plan'?'Open now · closes '+esc(wildWhen(win.closes)):'Window open: tap to open this week\'s challenge'):'Next opens '+esc(wildWhen(win.opens))}</span></span><span class="btn sm">${win.open?'Live':'Open'}</span></a>`;return}
  if(!D||D.st==='plan'&&!win.open)return;const mine=(U.wild||{})[win.id],t5=(D.t5||[]).includes(ME.sid);if(!win.open||D.st!=='open')return;
  box.innerHTML=`<a class="card zone tinv" href="#/wild" id="twc"><span class="em">🎁</span><span style="flex:1"><b class="lex">${t5?"You're in this week's top 5":'6th-spot challenge open'}</b><br><span class="muted" style="font-size:.85rem">${t5?'Hold your place 🎁':mine&&mine.done?'You scored '+mine.s+'/'+mine.mx+'. Results at class start.':'Closes '+esc(wildWhen(win.closes))+' · one 20-minute attempt'}</span></span><span class="btn sm">${t5||mine&&mine.done?'View':'Play'}</span></a>`}
/* a running attempt locks the notes; an attempt whose 20 minutes ended while away is handed in on the next visit */
const wildBusy=()=>!!U&&Object.values(U.wild||{}).some(A=>!A.done&&Date.now()-A.at<WILD_MS);
onHook('afterLoad',()=>{if(!U||!ME||ME.sid===LECTURER)return;document.body.classList.toggle('wlock',wildBusy());
  Object.entries(U.wild||{}).forEach(([id,A])=>{if(!A.done&&Date.now()-A.at>=WILD_MS||A.done&&!A.up)rulesOK().then(ok=>ok&&CLOUD.get('wild/'+id)).then(D=>{if(D&&D.items)wildSubmit(D,A)}).catch(()=>{})})});
