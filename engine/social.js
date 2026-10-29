/* MKT Arena engine: playing together. Needs the combined rules (everything checks rulesOK() and hides until they are published).
   - Notifications (bell in the top bar, #/notifs): notifs/{id} {to, fr, k, ref, tx, t, seen} written by classmates (invites, results),
     plus "studying now" from studying/{SID} {n, at} for students who opted in to share (U.shSt) and to see it (U.seeSt).
   - Challenges (#/challenges, #/challenge/<id>): challenges/{id} {by, p:[up to 6 SIDs], mode live|open, items, t, exp, st, go};
     results in challenges/{id}/r/{SID} {s, n, ms, at}, written once by each player.
     XP (key ch:<id>, claimed by each player's own portal once the challenge is over; at most CH_DAY a day):
     challenger wins +50 and each challengee who played +15; challenger loses: each challengee who played +25, challenger +5; tie: +15 each.
   - Weekend challenge (#/weekend): Friday and Saturday (GMT+5) only, one play per weekend: weekend/{Friday}_{SID} {w, sid, g, s, n, at}.
     Teams are the class sections (directory g). XP: +15 for playing (wk:<Friday>), +20 for the members of the top team (wkteam:<Friday>).
   - Live quiz battle (#/battle): the lecturer runs it; battles/{id} {name, items, i, st lobby|q|rev|end, qt, t}; players battles/{id}/a/{SID} {n, a, sc, t}.
     XP: +10 for taking part (bt:<id>), +20/+15/+10 for the top three (btp:<id>).
   Course hooks: quizItems(rng, n) → [{id, q, o:[correct first], why, label}], quizItem(id) → the same shape or null. */
const CH_MAX=6,CH_N=10,CH_SECS=300,CH_DAY=5,CH_LIVE_MS=10*60e3,WK_N=15,BT_SECS=20;
let BTT=null;onHook('leave',()=>clearInterval(BTT));
let SDIR=null,NOTE=[],STUDY=[],noteStop=null,studyStop=null,lastStudy=0;
const sidOK=s=>/^S0\d{5}$/.test(s);
async function socDir(){if(SDIR)return SDIR;try{const d=await CLOUD.docs('directory');SDIR={};d.forEach(x=>SDIR[x.id]={n:x.n||'',g:x.g||'',u:x.u||''})}catch(e){SDIR={}}return SDIR}
const nameOf=sid=>sid===(ME&&ME.sid)?'You':(SDIR&&SDIR[sid]&&SDIR[sid].n)||sid;
const mvNow=()=>mvDay(),dowNow=()=>dowOf(mvNow());
const qmix=(rng,a)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- a short quiz run (challenges, the weekend challenge): one question at a time ---------- */
function quizRun(host,ids,secs,done,seed){const items=ids.map(id=>quizItem(id)).filter(Boolean),rng=seeded(seed||ids.join('|'));let i=0,s=0,t0=Date.now(),dead=t0+secs*1000,tm=null,fin=false;
  const end=()=>{if(fin)return;fin=true;clearInterval(tm);done({s,n:items.length,ms:Math.min(Date.now()-t0,secs*1000)})};
  const one=()=>{if(i>=items.length||Date.now()>=dead)return end();const it=items[i],ord=qmix(rng,it.o.map((x,j)=>j));
    host.innerHTML=`<div class="row" style="justify-content:space-between"><span class="tag">${i+1} of ${items.length}</span><b class="lex" id="qrt"></b></div><h2 style="font-weight:600;margin:10px 0">${esc(it.q)}</h2>
    <div class="mopts">${ord.map(j=>`<button class="mopt" data-qo="${j}">${esc(it.o[j])}</button>`).join('')}</div><div id="qrw"></div>`;
    host.querySelectorAll('[data-qo]').forEach(b=>b.onclick=()=>{if(b.disabled)return;const ok=+b.dataset.qo===0;if(ok)s++;
      host.querySelectorAll('[data-qo]').forEach(x=>{x.disabled=true;if(+x.dataset.qo===0)x.classList.add('good');else if(x===b)x.classList.add('bad')});
      $('#qrw').innerHTML=`<div class="fb ${ok?'ok':'bad'}" style="margin-top:10px">${ok?'✓ Correct.':'✗ Not quite.'} ${esc(it.why||'')}</div>`;i++;setTimeout(one,ok?700:1600)})};
  const tick=()=>{const e=$('#qrt');if(!document.body.contains(host))return clearInterval(tm);const l=dead-Date.now();if(l<=0)return end();if(e)e.textContent='⏱ '+Math.floor(l/60000)+':'+String(Math.floor(l/1000)%60).padStart(2,'0')};
  one();tick();tm=setInterval(tick,500);return end}

/* ---------- notifications ---------- */
function bellHTML(){if(!ME||ME.sid===LECTURER||!document.body.classList.contains('rules2'))return '';const n=NOTE.filter(x=>!x.seen).length+STUDY.filter(x=>!(U.stSeen||{})[x.id+':'+x.at]).length;
  return `<a class="pill bell" href="#/notifs" id="bell" aria-label="Notifications${n?', '+n+' new':''}" title="Notifications">🔔${n?`<b>${n>9?'9+':n}</b>`:''}</a>`}
async function noteWatch(){if(noteStop||!ME||ME.sid===LECTURER||!(await rulesOK()))return;await socDir();
  noteStop=CLOUD.watch('notifs',{where:[['to','==',ME.sid]],limit:60},d=>{d.sort((a,b)=>(b.t|0)-(a.t|0));
    /* tidy up: read notifications older than 14 days go */
    d.filter(x=>x.seen&&x.t&&Date.now()-x.t>14*864e5).forEach(x=>CLOUD.del('notifs/'+x.id).catch(()=>{}));const fresh=d.filter(x=>!x.seen&&!NOTE.some(y=>y.id===x.id));NOTE=d;hud();
    if(fresh.length&&NOTE.length)fresh.slice(0,2).forEach(x=>toast(x.k==='invite'?'⚔️':'🔔',x.k==='invite'?'New challenge':'Notification',x.tx||''));if(location.hash==='#/notifs')ROUTES.notifs()},e=>console.warn('Notifications unavailable',e),true);
  studyWatch();hud()}
function studyWatch(){if(studyStop){studyStop();studyStop=null}STUDY=[];if(!U.seeSt)return hud();
  studyStop=CLOUD.watch('studying',{where:[['at','>',CLOUD.when(Date.now()-30*60e3)]],order:['at','desc'],limit:20},d=>{STUDY=d.filter(x=>x.id!==ME.sid);hud();if(location.hash==='#/notifs')ROUTES.notifs()},e=>console.warn('Studying now unavailable',e),true)}
onHook('cloud',noteWatch);
onHook('signout',()=>{if(noteStop)noteStop();if(studyStop)studyStop();noteStop=studyStop=null;NOTE=[];STUDY=[];SDIR=null});
/* "studying now": shared at most every 20 minutes while the student earns XP, only if they opted in */
onHook('award',()=>{if(!U||!U.shSt||!ME||ME.sid===LECTURER||!document.body.classList.contains('rules2')||Date.now()-lastStudy<20*60e3)return;lastStudy=Date.now();
  CLOUD.put('studying/'+ME.sid,{n:String(U.dn||'').slice(0,80),at:CLOUD.ts()}).catch(e=>console.warn('Studying now not shared',e))});
const notify=(to,k,ref,tx)=>CLOUD.add('notifs',{to,fr:ME.sid,k,ref:String(ref||'').slice(0,40),tx:String(tx||'').slice(0,200),t:CLOUD.ts(),seen:false});
ROUTES.notifs=async()=>{if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>Notifications</h1><p class="muted">Notifications switch on soon.</p>`);await socDir();
  U.stSeen=U.stSeen||{};const row=(ic,tx,href,when,unseen)=>`<a class="rdrow note${unseen?' new':''}" href="${href}"><span class="em" style="font-size:1.3rem">${ic}</span><span class="rdl">${esc(tx)}</span><span class="muted" style="font-size:.78rem">${when?ago(when):''}</span></a>`;
  shell('#/',`<p><a href="#/">← Home</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0">🔔 Notifications</h1>${NOTE.some(x=>!x.seen)?'<button class="btn ghost sm" id="nall">Mark all as read</button>':''}</div>
  <div class="card" style="margin-top:12px">${STUDY.map(x=>row('📚',`${x.n||nameOf(x.id)} is studying now. Challenge them?`,'#/challenges/new/'+x.id,x.at,!U.stSeen[x.id+':'+x.at])).join('')}
   ${NOTE.map(x=>row(x.k==='invite'?'⚔️':x.k==='result'?'🏁':'🔔',x.tx||'',x.ref?'#/challenge/'+x.ref:'#/notifs',x.t,!x.seen)).join('')||(!STUDY.length?'<p class="muted" style="margin:0">Nothing new.</p>':'')}</div>
  <div class="card" style="margin-top:12px"><h2 style="margin:0 0 6px">Studying now</h2>
   <label class="row ppchk"><input type="checkbox" id="shst" ${U.shSt?'checked':''}> Let classmates know when I'm studying</label>
   <label class="row ppchk"><input type="checkbox" id="seest" ${U.seeSt?'checked':''}> Tell me when classmates are studying</label>
   <p class="muted" style="font-size:.84rem;margin:6px 0 0">Only your name and the time are shared, and only while you practise. You can turn this off at any time.</p></div>${pushCardHTML()}`);
  $('#pushb')&&($('#pushb').onclick=async()=>{$('#pushb').disabled=true;try{if(U.push)await pushOff();else{await pushSub();toast('📱','Phone notifications on','')}}catch(e){toast('⚠️','Not turned on',e.message||CLOUD.say(e))}ROUTES.notifs()});
  STUDY.forEach(x=>U.stSeen[x.id+':'+x.at]=1);const ks=Object.keys(U.stSeen);if(ks.length>60)ks.slice(0,ks.length-60).forEach(k=>delete U.stSeen[k]);save();hud();
  $('#shst').onchange=e=>{U.shSt=e.target.checked?1:0;lastStudy=0;save();if(!U.shSt)CLOUD.del('studying/'+ME.sid).catch(()=>{})};
  $('#seest').onchange=e=>{U.seeSt=e.target.checked?1:0;save();studyWatch()};
  $('#nall')&&($('#nall').onclick=()=>{NOTE.filter(x=>!x.seen).forEach(x=>CLOUD.put('notifs/'+x.id,{seen:true},true).catch(()=>{}))});
  NOTE.filter(x=>!x.seen&&x.k!=='invite').forEach(x=>CLOUD.put('notifs/'+x.id,{seen:true},true).catch(()=>{}))};

/* ---------- challenges ---------- */
function chOutcome(c,R){const by=R[c.by],others=c.p.filter(s=>s!==c.by&&R[s]);if(!by||!others.length)return {k:'none'};
  const top=Math.max(...others.map(s=>R[s].s));return by.s>top?{k:'win'}:by.s<top?{k:'lose'}:{k:'tie'}}
function chXP(c,R,sid){const o=chOutcome(c,R);if(o.k==='none'||!R[sid])return 0;const me=sid===c.by;return o.k==='win'?(me?50:15):o.k==='lose'?(me?5:25):15}
const chOver=(c,R)=>c.p.every(s=>R[s])||Date.now()>c.exp||(c.mode==='live'&&c.go&&Date.now()>c.go+CH_LIVE_MS);
function chClaim(c,R){if(!chOver(c,R)||U.log['ch:'+c.id])return;const xp=chXP(c,R,ME.sid);if(!xp)return;U.chd=U.chd||{};const d=today(),n=U.chd[d]|0;
  if(n>=CH_DAY){if(!U.log['chcap:'+c.id]){U.log['chcap:'+c.id]=1;toast('⚔️','Challenge finished','No XP: you have had '+CH_DAY+' challenge rewards today');save()}return}
  if(award('ch:'+c.id,xp,'Challenge'))U.chd={[d]:n+1}}
ROUTES.challenges=async h=>{if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>Challenges</h1><p class="muted">Challenges switch on soon.</p>`);await socDir();
  if(h[1]==='new')return chNew(h[2]);
  shell('#/',`<p><a href="#/">← Home</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0">⚔️ Challenges</h1><a class="btn" href="#/challenges/new">New challenge</a></div>
  <p class="muted">Challenge up to ${CH_MAX-1} classmates to ${CH_N} quick questions. <b>Live</b>: everyone plays together when you start. <b>Open</b>: everyone has 24 hours.</p>
  <div class="card" id="chl" style="margin-top:12px"><p class="muted" style="margin:0">Loading…</p></div>
  <div class="card" style="margin-top:12px"><h2 style="margin:0 0 6px">XP</h2><ul class="sumlist"><li>You win: +50 for you, +15 for each classmate who played.</li><li>You lose: +25 for each classmate who played, +5 for you.</li><li>Tie: +15 for everyone.</li><li>Rewards from up to ${CH_DAY} challenges a day.</li></ul></div>`);
  CLOUD.watch('challenges',{where:[['p','array-contains',ME.sid]],limit:60},d=>{const el=$('#chl');if(!el)return;d.sort((a,b)=>(b.t|0)-(a.t|0));d=d.slice(0,30);
    el.innerHTML=d.length?d.map(c=>{const over=Date.now()>c.exp||c.st==='done';return `<a class="rdrow" href="#/challenge/${c.id}"><span class="em">${c.mode==='live'?'⚡':'⏳'}</span><span class="rdl">${c.by===ME.sid?'You challenged '+c.p.filter(s=>s!==ME.sid).map(nameOf).join(', '):nameOf(c.by)+' challenged you'+(c.p.length>2?' and '+(c.p.length-2)+' more':'')}</span><span class="tag">${over?'Finished':c.mode==='live'?(c.st==='live'?'Live now':'Waiting'):'Open'}</span></a>`}).join(''):'<p class="muted" style="margin:0">No challenges yet. Start one!</p>'},e=>{const el=$('#chl');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})};
function chNew(pre){const all=Object.entries(SDIR).filter(([s])=>s!==ME.sid&&s!==LECTURER).sort((a,b)=>a[1].n<b[1].n?-1:1),sel=new Set(pre&&SDIR[pre]?[pre]:[]);
  shell('#/',`<p><a href="#/challenges">← Challenges</a></p><h1>New challenge</h1>
  <div class="card"><h2 style="margin:0 0 6px">Who? <span class="muted" id="chn" style="font-size:.9rem"></span></h2><input id="chq" placeholder="Search names" aria-label="Search names" style="width:100%;margin-bottom:8px">
   <div id="chp" class="chpick">${all.length?all.map(([s,x])=>`<button type="button" class="chip${sel.has(s)?' on':''}" data-s="${s}" aria-pressed="${sel.has(s)}">${esc(x.n||s)}</button>`).join(''):'<p class="muted">Your lecturer has not added the class names yet.</p>'}</div></div>
  <div class="card" style="margin-top:12px"><h2 style="margin:0 0 6px">How?</h2><label class="row ppchk"><input type="radio" name="chm" value="open" checked> ⏳ Open: everyone plays within 24 hours</label><label class="row ppchk"><input type="radio" name="chm" value="live"> ⚡ Live: you start it and everyone plays at the same time</label>
   <button class="btn gold" id="chgo" style="margin-top:10px" disabled>Send the challenge</button></div>`);
  const upd=()=>{$('#chn').textContent=sel.size+' of '+(CH_MAX-1)+' picked';$('#chgo').disabled=!sel.size};upd();
  $('#chq').oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#chp [data-s]').forEach(b=>b.hidden=!!q&&!b.textContent.toLowerCase().includes(q))};
  document.querySelectorAll('#chp [data-s]').forEach(b=>b.onclick=()=>{const s=b.dataset.s;if(sel.has(s))sel.delete(s);else{if(sel.size>=CH_MAX-1)return toast('⚔️','That is the most',`Up to ${CH_MAX-1} classmates`);sel.add(s)}b.classList.toggle('on',sel.has(s));b.setAttribute('aria-pressed',sel.has(s));upd()});
  $('#chgo').onclick=async()=>{const mode=document.querySelector('[name=chm]:checked').value,p=[ME.sid,...sel],rng=seeded(ME.sid+'|'+Date.now()),items=quizItems(rng,CH_N).map(x=>x.id);$('#chgo').disabled=true;
    try{const id=await CLOUD.add('challenges',{by:ME.sid,p,mode,items,t:CLOUD.ts(),exp:CLOUD.when(Date.now()+24*3600e3),st:'wait'});
      await Promise.all([...sel].map(s=>notify(s,'invite',id,`${U.dn||ME.name} challenged you (${mode==='live'?'live':'24 hours'})`)));
      toast('⚔️','Challenge sent',sel.size+' classmate'+(sel.size===1?'':'s'));location.hash='#/challenge/'+id}
    catch(e){$('#chgo').disabled=false;toast('⚠️','Not sent',CLOUD.say(e))}}}
ROUTES.challenge=async h=>{if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>Challenge</h1><p class="muted">Challenges switch on soon.</p>`);await socDir();const id=String(h[1]||'');let C=null,R={},playing=false;
  shell('#/',`<p><a href="#/challenges">← Challenges</a></p><div id="chv"><p class="muted">Loading…</p></div>`);
  const draw=()=>{const el=$('#chv');if(!el||playing)return;if(!C){el.innerHTML='<p class="muted">This challenge was not found.</p>';return}
    const over=chOver(C,R),mine=R[ME.sid],isBy=C.by===ME.sid,o=chOutcome(C,R),canPlay=!mine&&!over&&(C.mode==='open'||C.st==='live');
    const rows=C.p.map(s=>[s,R[s]]).sort((a,b)=>(b[1]?b[1].s:-1)-(a[1]?a[1].s:-1)||((a[1]||{}).ms|0)-((b[1]||{}).ms|0));
    el.innerHTML=`<h1>${C.mode==='live'?'⚡ Live':'⏳ Open'} challenge</h1><p class="muted">${isBy?'You':esc(nameOf(C.by))} challenged ${C.p.filter(s=>s!==C.by).map(s=>esc(nameOf(s))).join(', ')} · ${C.items.length} questions · ${CH_SECS/60} minutes</p>
    <div class="card"><h2 style="margin:0 0 6px">${over?'Final results':'Scores so far'}</h2>${rows.map(([s,r])=>`<div class="rdrow"><span class="rdl">${s===C.by?'⚔️ ':''}${esc(nameOf(s))}</span><span class="muted">${r?Math.round(r.ms/1000)+' s':over?'did not play':'not played yet'}</span><b>${r?r.s+'/'+r.n:'–'}</b></div>`).join('')}
    ${over?`<div class="callout" style="margin-top:10px">${o.k==='none'?'Nobody else played, so there is no winner.':o.k==='tie'?'🤝 A tie: +15 XP for everyone who played.':o.k==='win'?`🏆 ${isBy?'You':esc(nameOf(C.by))} won the challenge.`:`🎉 ${isBy?'You were':esc(nameOf(C.by))+' was'} beaten.`} ${chXP(C,R,ME.sid)?'<b>+'+chXP(C,R,ME.sid)+' XP for you.</b>':''}</div>`:''}</div>
    ${canPlay?`<div class="card" style="margin-top:12px;text-align:center"><button class="btn gold" id="chplay">▶ Play now</button><p class="muted" style="font-size:.84rem;margin:8px 0 0">${C.items.length} questions, ${CH_SECS/60} minutes, one try.</p></div>`:''}
    ${C.mode==='live'&&C.st!=='live'&&!over?(isBy?`<div class="card" style="margin-top:12px;text-align:center"><p class="muted">Start when your classmates have this page open. Everyone plays at the same time.</p><button class="btn gold" id="chstart">⚡ Start now</button></div>`:'<div class="card" style="margin-top:12px;text-align:center"><p class="muted" style="margin:0">Keep this page open: the challenge starts when '+esc(nameOf(C.by))+' presses Start.</p></div>'):''}`;
    if(over)chClaim(C,R);
    $('#chstart')&&($('#chstart').onclick=()=>CLOUD.put('challenges/'+id,{st:'live',go:CLOUD.ts()},true).catch(e=>toast('⚠️','Not started',CLOUD.say(e))));
    $('#chplay')&&($('#chplay').onclick=()=>{playing=true;el.innerHTML='<div class="card qcard" id="chq"></div>';
      quizRun($('#chq'),C.items,CH_SECS,async r=>{playing=false;try{await CLOUD.put('challenges/'+id+'/r/'+ME.sid,{s:r.s,n:r.n,ms:r.ms,at:CLOUD.ts()})}catch(e){toast('⚠️','Score not saved',CLOUD.say(e))}
        R[ME.sid]=r;draw();if(chOver(C,R)&&C.by!==ME.sid)notify(C.by,'result',id,`${U.dn||ME.name} finished your challenge`).catch(()=>{})},id)})};
  CLOUD.watchOne('challenges/'+id,d=>{const was=C&&C.st;C=d;if(d&&d.mode==='live'&&was&&was!=='live'&&d.st==='live'&&!R[ME.sid]){draw();$('#chplay')&&$('#chplay').click()}else draw()},e=>{const el=$('#chv');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});
  CLOUD.watch('challenges/'+id+'/r',{},d=>{R={};d.forEach(x=>R[x.id]=x);draw()},()=>{})};

/* ---------- the weekend challenge (Friday and Saturday, GMT+5) ---------- */
const wkFri=d=>{const w=dowOf(d);return w===5?d:w===6?addDays(d,-1):addDays(d,-((w+2)%7))};/* the Friday of this weekend, or of the last one */
const wkOpen=()=>[5,6].includes(dowNow());
/* teams are class sections (directory g); with no sections at all, everyone plays as one class team */
function wkTeams(rows){const T={},any=rows.some(r=>r.g);rows.forEach(r=>{const g=r.g||'',t=T[g]||(T[g]={g,label:any?secLabel(g)||'No section':'Whole class',n:0,s:0});t.n++;t.s+=r.n?r.s/r.n:0});
  return Object.values(T).map(t=>Object.assign(t,{avg:Math.round(t.s/t.n*100)})).sort((a,b)=>b.avg-a.avg||b.n-a.n)}
ROUTES.weekend=async()=>{if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>Weekend challenge</h1><p class="muted">The weekend challenge switches on soon.</p>`);await socDir();
  const w=wkFri(mvNow()),open=wkOpen(),myG=(SDIR[ME.sid]||{}).g||'';let rows=[],played=false;
  shell('#/',`<p><a href="#/">← Home</a></p><h1>🏝️ Weekend challenge</h1><p class="muted">${open?`Open now until Saturday midnight. ${WK_N} questions, one try. ${myG?`Your team is your class section (${esc(secLabel(myG))}).`:'Everyone plays for one class team.'}`:'Opens on Friday at 00:00 and closes on Saturday at midnight (Maldives time).'}</p>
  <div id="wkp"></div><div class="grid g2" style="margin-top:12px"><div class="card"><h2 style="margin:0 0 6px">Teams</h2><div id="wkt"><p class="muted">Loading…</p></div></div><div class="card"><h2 style="margin:0 0 6px">Top players</h2><div id="wki"></div></div></div>`);
  const draw=()=>{const T=wkTeams(rows),me=rows.find(r=>r.sid===ME.sid);played=!!me;
    $('#wkt').innerHTML=T.length?T.map((t,i)=>`<div class="rdrow"><span class="rdl">${i===0&&T.length>1?'🏆 ':''}${esc(t.label)}${T.length>1&&t.g===myG?' (your team)':''}</span><span class="muted">${t.n} player${t.n===1?'':'s'}</span><b>${t.avg}%</b></div>`).join(''):'<p class="muted" style="margin:0">Nobody has played yet.</p>';
    $('#wki').innerHTML=rows.slice().sort((a,b)=>b.s-a.s||a.ms-b.ms).slice(0,10).map((r,i)=>`<div class="rdrow"><span class="rdl">${i+1}. ${esc(nameOf(r.sid))}</span><span class="muted">${esc(secLabel(r.g))}</span><b>${r.s}/${r.n}</b></div>`).join('')||'<p class="muted" style="margin:0">–</p>';
    $('#wkp').innerHTML=open&&!played?`<div class="card" style="text-align:center"><button class="btn gold" id="wkgo">▶ Play the weekend challenge</button></div>`:me?`<div class="callout">You scored <b>${me.s}/${me.n}</b> this weekend.</div>`:'';
    $('#wkgo')&&($('#wkgo').onclick=()=>{$('#wkp').innerHTML='<div class="card qcard" id="wkq"></div>';const ids=quizItems(seeded(CRS.id+'|weekend|'+w),WK_N).map(x=>x.id);
      quizRun($('#wkq'),ids,WK_N*30,async r=>{try{await CLOUD.put('weekend/'+w+'_'+ME.sid,{w,sid:ME.sid,g:myG,s:r.s,n:r.n,ms:r.ms,at:CLOUD.ts()});award('wk:'+w,15,'Weekend challenge');countOnce('wk:'+w,'weekend')}
        catch(e){toast('⚠️','Score not saved',CLOUD.say(e))}},w)});
    /* after the weekend: the top team's members get a bonus */
    if(!open&&me&&T.length>1&&T[0].g===(me.g||'')&&T[0].n>=2)award('wkteam:'+w,20,'Top weekend team')};
  CLOUD.watch('weekend',{where:[['w','==',w]],limit:300},d=>{rows=d;draw()},e=>{const el=$('#wkt');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})};

/* ---------- live quiz battle (the lecturer runs it from #/battle) ---------- */
function btScore(B,A){return A.map(a=>{let sc=0;Object.entries(a.a||{}).forEach(([i,v])=>{if(v&&v[0]===0)sc+=500+Math.max(0,Math.round(500*(1-(v[1]|0)/(BT_SECS*1000))))});return {sid:a.id,n:a.n,sc}}).sort((x,y)=>y.sc-x.sc)}
ROUTES.battle=async()=>{if(!(await rulesOK()))return shell('#/',`<p><a href="#/">← Home</a></p><h1>Quiz battle</h1><p class="muted">Quiz battles switch on soon.</p>`);await socDir();
  const lect=ME.sid===LECTURER;let B=null,A=[];
  shell('#/',`<p><a href="#/">← Home</a></p><h1>🎮 Quiz battle</h1><div id="btv"><p class="muted">Looking for a battle…</p></div>`);
  const draw=()=>{const el=$('#btv');if(!el)return;clearInterval(BTT);
    if(!B||B.st==='end'&&!lect&&!A.some(a=>a.id===ME.sid)){el.innerHTML=lect?`<div class="card"><p>Start a battle for everyone who opens this page: ${CH_N} questions, ${BT_SECS} seconds each, faster right answers score more.</p><input id="btn" placeholder="Name (e.g. Week 12 tutorial)" style="width:100%;margin-bottom:8px"><button class="btn gold" id="btnew">Create the battle</button></div>`
      :'<div class="card"><p class="muted" style="margin:0">No battle right now. When your lecturer starts one, it appears here.</p></div>';
      $('#btnew')&&($('#btnew').onclick=async()=>{const items=quizItems(seeded('bt|'+Date.now()),CH_N).map(x=>x.id);try{await CLOUD.add('battles',{name:String($('#btn').value||'Quiz battle').slice(0,80),items,i:-1,st:'lobby',t:CLOUD.ts()})}catch(e){toast('⚠️','Not created',CLOUD.say(e))}});return}
    const it=B.i>=0?quizItem(B.items[B.i]):null,S=btScore(B,A),me=A.find(a=>a.id===ME.sid),mine=me&&me.a&&me.a[B.i];
    const board=n=>`<div class="card" style="margin-top:12px"><h2 style="margin:0 0 6px">Leaderboard</h2>${S.slice(0,n).map((r,i)=>`<div class="rdrow"><span class="rdl">${i+1}. ${esc(r.sid===ME.sid?'You':r.n||nameOf(r.sid))}</span><b>${r.sc}</b></div>`).join('')||'<p class="muted" style="margin:0">–</p>'}</div>`;
    if(lect){const ans=it?A.filter(a=>a.a&&a.a[B.i]).length:0;
      el.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(B.name)}</h2><span class="tag">${A.length} joined</span></div>
      ${B.st==='lobby'?'<p class="muted">Students open 🎮 Quiz battle on their phones and tap Join.</p>':it?`<p class="muted" style="margin:6px 0">Question ${B.i+1} of ${B.items.length} · ${ans}/${A.length} answered</p><h2 style="font-weight:600">${esc(it.q)}</h2>${B.st==='rev'?`<div class="fb ok">✓ ${esc(it.o[0])}</div>`:''}`:''}
      ${B.st==='end'?'<p><b>Finished.</b></p>':`<div class="row" style="margin-top:10px">${B.st==='q'?'<button class="btn" id="btrev">Show the answer</button>':B.i+1<B.items.length?`<button class="btn gold" id="btnext">${B.i<0?'Start':'Next question'}</button>`:''}<button class="btn ghost" id="btend">End the battle</button></div>`}</div>${board(10)}`;
      $('#btnext')&&($('#btnext').onclick=()=>CLOUD.put('battles/'+B.id,{i:B.i+1,st:'q',qt:CLOUD.ts()},true));
      $('#btrev')&&($('#btrev').onclick=()=>CLOUD.put('battles/'+B.id,{st:'rev'},true));
      $('#btend')&&($('#btend').onclick=()=>{if(confirm('End the battle?'))CLOUD.put('battles/'+B.id,{st:'end'},true)});return}
    if(!me){el.innerHTML=`<div class="card" style="text-align:center"><h2>${esc(B.name)}</h2><p class="muted">${A.length} classmate${A.length===1?'':'s'} joined.</p>${B.st==='end'?'<p>This battle has finished.</p>':'<button class="btn gold" id="btjoin">Join</button>'}</div>`;
      $('#btjoin')&&($('#btjoin').onclick=()=>CLOUD.put('battles/'+B.id+'/a/'+ME.sid,{n:String(U.dn||ME.name).slice(0,80),a:{},t:CLOUD.ts()}).catch(e=>toast('⚠️','Could not join',CLOUD.say(e))));return}
    if(B.st==='end'){const rank=S.findIndex(r=>r.sid===ME.sid);el.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:2.4rem">${rank<3?['🥇','🥈','🥉'][rank]:'🎮'}</div><h2>${rank>=0?'You came '+(rank+1)+' of '+S.length:'Finished'}</h2></div>${board(10)}`;
      if(award('bt:'+B.id,10,'Quiz battle'))countOnce('bt:'+B.id,'battles');if(rank>=0&&rank<3&&S[rank].sc>0)award('btp:'+B.id,[20,15,10][rank],'Battle podium');return}
    if(B.st==='lobby'||!it){el.innerHTML=`<div class="card" style="text-align:center"><h2>${esc(B.name)}</h2><p>You're in. Waiting for the first question…</p></div>`;return}
    const ord=qmix(seeded(B.id+'|'+B.i),it.o.map((x,j)=>j)),t0=B.seenAt||Date.now();
    el.innerHTML=`<div class="card qcard"><div class="row" style="justify-content:space-between"><span class="tag">${B.i+1} of ${B.items.length}</span><b class="lex" id="btt"></b></div><h2 style="font-weight:600;margin:10px 0">${esc(it.q)}</h2>
    <div class="mopts">${ord.map(j=>`<button class="mopt${mine&&mine[0]===j?' on':''}${B.st==='rev'&&j===0?' good':''}${B.st==='rev'&&mine&&mine[0]===j&&j!==0?' bad':''}" data-bo="${j}" ${mine||B.st!=='q'?'disabled':''}>${esc(it.o[j])}</button>`).join('')}</div>
    ${B.st==='rev'?`<div class="fb ${mine&&mine[0]===0?'ok':'bad'}" style="margin-top:10px">${mine?mine[0]===0?'✓ Correct.':'✗ Not this time.':'⏱ No answer.'} ${esc(it.why||'')}</div>`:mine?'<p class="muted">Answer locked in. Wait for the reveal.</p>':''}</div>${B.st==='rev'?board(5):''}`;
    document.querySelectorAll('[data-bo]').forEach(b=>b.onclick=()=>{const ms=Math.min(BT_SECS*1000,Date.now()-t0);document.querySelectorAll('[data-bo]').forEach(x=>x.disabled=true);b.classList.add('on');
      CLOUD.put('battles/'+B.id+'/a/'+ME.sid,{a:{[B.i]:[+b.dataset.bo,ms]},t:CLOUD.ts()},true).catch(e=>toast('⚠️','Answer not sent',CLOUD.say(e)))});
    if(B.st==='q'&&!mine){const tk=()=>{const e=$('#btt');if(!e)return clearInterval(BTT);const l=BT_SECS*1000-(Date.now()-t0);e.textContent=l>0?Math.ceil(l/1000)+' s':'⏱ time';if(l<=0){clearInterval(BTT);document.querySelectorAll('[data-bo]').forEach(x=>x.disabled=true)}};tk();BTT=setInterval(tk,250)}};
  let aStop=null;
  CLOUD.watch('battles',{order:['t','desc'],limit:1},d=>{const b=d[0]||null;if(b&&B&&b.id===B.id&&b.i!==B.i)b.seenAt=Date.now();else if(b&&B&&b.id===B.id)b.seenAt=B.seenAt;else if(b)b.seenAt=Date.now();
    const nb=!B||!b||b.id!==B.id;B=b;if(nb){if(aStop)aStop();A=[];if(B)aStop=CLOUD.watch('battles/'+B.id+'/a',{},x=>{A=x;draw()},()=>{})}draw()},e=>{const el=$('#btv');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})};

/* ---------- home card ---------- */
function socialCardHTML(){if(!ME||ME.sid===LECTURER)return '';const open=wkOpen();
  return `<div class="card" data-need="rules" style="margin-top:16px"><h2 style="margin:0 0 8px">Play together</h2><div class="grid g3" style="gap:10px">
   <a class="card zone" href="#/challenges" style="padding:14px"><div class="em">⚔️</div><h3 style="margin:4px 0">Challenges</h3><p class="muted" style="font-size:.85rem;margin:0">Take on up to ${CH_MAX-1} classmates</p></a>
   <a class="card zone" href="#/weekend" style="padding:14px"><div class="em">🏝️</div><h3 style="margin:4px 0">Weekend challenge</h3><p class="muted" style="font-size:.85rem;margin:0">${open?'Open now':'Fridays and Saturdays'} · team vs team</p></a>
   <a class="card zone" href="#/battle" style="padding:14px"><div class="em">🎮</div><h3 style="margin:4px 0">Quiz battle</h3><p class="muted" style="font-size:.85rem;margin:0">Live in class with your lecturer</p></a></div></div>`}

/* ---------- phone notifications (Web Push; off unless cloud-config.js sets PUSH_ON and PUSH_KEY). See docs/PUSH.md ---------- */
const pushOn=()=>typeof PUSH_ON!=='undefined'&&PUSH_ON===true&&typeof PUSH_KEY==='string'&&PUSH_KEY.length>40&&'serviceWorker' in navigator&&'PushManager' in window;
const b64u=s=>{const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))};
async function pushSub(){const reg=await navigator.serviceWorker.ready;if(await Notification.requestPermission()!=='granted')throw new Error('Notifications are blocked for this site in your browser settings.');
  const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(PUSH_KEY)});
  await CLOUD.put('push/'+ME.sid,{s:JSON.stringify(sub).slice(0,2000),t:CLOUD.ts()});U.push=1;save()}
async function pushOff(){try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe()}catch(e){}
  try{await CLOUD.del('push/'+ME.sid)}catch(e){}U.push=0;save()}
const pushCardHTML=()=>pushOn()?`<div class="card" style="margin-top:12px"><h2 style="margin:0 0 6px">📱 Phone notifications</h2><p class="muted" style="font-size:.88rem;margin:0 0 8px">Get challenge invites and results on this phone or laptop, even when ${esc(CRS.name)} is closed. On iPhone, add the app to your home screen first.</p>
  <button class="btn ${U.push?'ghost':''}" id="pushb">${U.push?'Turn off on this device':'Turn on'}</button></div>`:'';
