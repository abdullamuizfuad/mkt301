/* MKT Arena engine: Replacement Tutorial Sessions (#/rts). Shared by MKT101 and MKT301; the questions are course data (rts.js:
   RTS_SESSIONS and RTS_Q). A session replaces a 2-hour tutorial missed through a public holiday: students who finish it keep that attendance.
   - Home: a caution-tape block with SAVE MY ATTENDANCE while a session is open (from/to, GMT+5). Green once done.
   - Nothing locks the app: students can leave the session page any time ("Save and continue later", or just close it) and carry on
     from the home block. The clock only runs on #/rts. (Until 18 Nov 2026 starting locked the arena onto #/rts; the lecturer lifted it.)
   - Timer: active time only (idle over 2 minutes and time away do not count). The block is s.mins; two extensions of 15 minutes each.
     During extension time, study-time block XP is not earned (presence.js asks rtsNoXP). The break reminder is paused (presence.js asks rtsActive).
   - Finish needs every question answered (written answers at least minW words), except after both extensions run out.
   - XP (keys rts:<id>:…): 300 for finishing (600 with the secret question), 10 per minute saved inside the block (doubled with the secret
     question), 5 per correct MCQ. Written answers go to the marking queue (U.ans keys rts_<id>_<q>_<t>) and earn XP when marked.
   - Restart from the beginning (any time before finishing): the attempt's answers are dropped and voided (U.rtsVoid), so marks for them give no XP.
   - U.rts[id] = {st go|done, n attempt, act ms, ext, a:{q:answer}, pick:{part:q}, fl:{paste}, saved, ph main|bonus, keys:[], at, res}.
   - Lecturer: the "Replacement tutorial" card lists who finished. The lecturer never takes it. */
const RTS_EXT=15*60e3,RTS_XP_DONE=300,RTS_XP_MIN=10,RTS_XP_MCQ=5;
let RTST=null,RTSL=Date.now();
const rtsSessions=()=>typeof RTS_SESSIONS!=='undefined'?RTS_SESSIONS:[];
function rtsCur(now){if(window.__noRts)return null;/* site tests turn sessions off unless they test them */now=now||Date.now();return rtsSessions().find(s=>now>=Date.parse(s.from)&&now<rtsEnd(s))||null}
/* when the session closes for this student: s.to, or later if the lecturer reopened it for them (U.rtsLate[id], set from a note with rts/rtsTo in engine/core.js applyMarks) */
function rtsEnd(s){const t=Date.parse(s.to),l=typeof U!=='undefined'&&U&&U.rtsLate&&U.rtsLate[s.id]?Date.parse(U.rtsLate[s.id]):0;return Math.max(t,l||0)}
const rtsPlayer=()=>!!(typeof ME!=='undefined'&&ME&&U&&ME.sid!==LECTURER);
function rtsSt(s){U.rts=U.rts||{};return U.rts[s.id]||null}
function rtsActive(){const s=rtsCur();if(!s||!rtsPlayer()||VIEWAS)return null;const st=rtsSt(s);return st&&st.st==='go'?{s,st}:null}
/* a live session (any kind, joined or not) is running (kept for course code; the session no longer locks the app) */
const rtsLiveNow=()=>!!((typeof sessLive==='function'&&sessLive())||(typeof tutOn==='function'&&tutOn()));
const rtsBase=s=>s.mins*60e3,rtsLimit=(s,st)=>s.noLimit?Infinity:rtsBase(s)+(st.ext|0)*RTS_EXT;/* noLimit: s.mins is only a guide */
function rtsNoXP(){const a=rtsActive();return !!(a&&(a.st.ext|0)>0&&location.hash.indexOf('#/rts')===0&&a.st.act>=rtsBase(a.s))}/* extra time: no study-time XP */
const rtsQ=id=>RTS_Q[id];
const rtsWords=t=>String(t||'').trim().split(/\s+/).filter(Boolean).length;
const rtsWhen=iso=>new Date(iso).toLocaleString('en-GB',{timeZone:'Indian/Maldives',weekday:'long',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
function rtsRand(seed){let h=1779033703;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}return ()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return ((h^=h>>>16)>>>0)/4294967296}}
function rtsOpts(qid){const q=rtsQ(qid),r=rtsRand(ME.sid+'|'+qid),o=q[2].slice();for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}return o}
/* the written questions a student must answer: every item of an "answer all" part, the chosen item of a "choose" part */
/* pick: how many to choose (1 = st.pick[pi] is one id; 2+ = an array of ids) */
const rtsPicks=(st,pi)=>{const v=(st.pick||{})[pi];return Array.isArray(v)?v:v?[v]:[]};
function rtsWritten(s,st){const L=[];s.parts.forEach((p,pi)=>{if(p.kind!=='write')return;if(p.pick){const c=rtsPicks(st,pi);for(let k=0;k<p.pick;k++)L.push({pi,id:c[k]||null,p})}else p.items.forEach(id=>L.push({pi,id,p}))});return L}
function rtsMcqs(s){return s.parts.filter(p=>p.kind==='mcq').flatMap(p=>p.items)}
function rtsTodo(s,st){const a=st.a||{};let n=0,d=0;
  rtsMcqs(s).forEach(id=>{n++;if(a[id])d++});
  rtsWritten(s,st).forEach(w=>{n++;if(w.id&&rtsWords(a[w.id])>=(rtsQ(w.id).minW||60))d++});return {n,d,all:n===d}}

/* ---------- home block ---------- */
function rtsCss(){if(document.getElementById('rtscss'))return;const st=document.createElement('style');st.id='rtscss';st.textContent=
 '.rtsb{position:relative;margin:0 0 16px;padding:9px;border-radius:20px;background:#111;isolation:isolate}'+
 '.rtsb::before{content:"";position:absolute;inset:0;border-radius:20px;background:repeating-linear-gradient(-45deg,#111 0 16px,#ffd400 16px 32px);background-size:45px 45px;animation:rtsTape 1.6s linear infinite,rtsBlink 1.4s ease-in-out infinite;z-index:-1}'+
 '.rtsb.done::before{animation:none;background:repeating-linear-gradient(-45deg,#14532d 0 16px,#22c55e 16px 32px)}'+
 '@keyframes rtsTape{to{background-position:45px 0}}@keyframes rtsBlink{50%{opacity:.45}}'+
 '.rtsin{background:#ffd400;color:#111;border-radius:13px;padding:18px 18px 20px}:root[data-theme="light"] .rtsin{background:#c99a06;color:#111}.rtsb.done .rtsin{background:#dcfce7;color:#052e16}'+
 '.rtsin h2{color:inherit;margin:2px 0 6px;font-size:1.35rem}.rtsin p{color:inherit;margin:0 0 8px}.rtsk{font:800 .75rem Lexend,sans-serif;letter-spacing:.08em;text-transform:uppercase}.rtsm{font-weight:700}'+
 '.rtsgo{display:block;width:100%;margin-top:12px;padding:16px 18px;border:0;border-radius:14px;background:#dc2626;color:#fff;font:800 1.15rem Lexend,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 6px 0 #7f1d1d;transition:transform .1s}'+
 '.rtsgo:active{transform:translateY(3px);box-shadow:0 3px 0 #7f1d1d}.rtsgo.ok,.rtsgo.ok:disabled{background:#16a34a;box-shadow:0 6px 0 #14532d;opacity:1;cursor:default}.rtsgo:disabled{opacity:.6;cursor:not-allowed}'+
 '.rtsp .rtsq{margin:0 0 14px}.rtsp .rtsq h3{font-size:1rem;margin:0 0 8px}.rtsp .rtso{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--line);border-radius:12px;margin:6px 0;cursor:pointer}'+
 '.rtsp .rtso.on{border-color:var(--gold);background:rgba(245,197,24,.12)}.rtsp textarea{width:100%;min-height:180px}.rtsp .rtswc{font-size:.82rem}.rtsp .rtswc.ok{color:var(--green)}'+
 '.rtstop{position:sticky;top:0;z-index:30;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between;padding:10px 14px;margin:0 0 14px;border-radius:14px;background:#ffd400;color:#111;font-weight:700}'+
 '.rtstop .rtsclk{font:800 1.3rem Lexend,sans-serif}.rtstop.over{background:#dc2626;color:#fff}.rtsscn{white-space:pre-line}.rtspick{display:flex;flex-direction:column;gap:6px}'+
 '.rtsbar{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 30px}.rtslbl{font-size:.8rem;font-style:italic}'+
 '@media (prefers-reduced-motion:reduce){.rtsb::before{animation:none}}';document.head.appendChild(st)}
function rtsHomeHTML(){const s=rtsCur();if(!s||!ME||!U||(ME.sid===LECTURER&&!VIEWAS))return '';rtsCss();const st=rtsSt(s),done=st&&st.st==='done',go=st&&st.st==='go';
  return `<div class="rtsb${done?' done':''}" id="rtsb" role="region" aria-label="${esc(s.title)}"><div class="rtsin">
  <p class="rtsk">⚠️ ${esc(CRS.CODE||'')} · ${esc(s.topics)}</p><h2>${esc(s.title)}</h2>
  <p>${esc(s.blurb||'This is extra tutorial work you can complete to save the attendance of a class you missed because of the public holiday. It replaces a 2-hour tutorial session.')}</p>
  <p class="rtsm">⏱️ ${s.noLimit?'About '+s.mins+' minutes, no time limit':s.mins+' minutes'} · open until ${esc(rtsWhen(new Date(rtsEnd(s)).toISOString()))}</p>
  ${done?`<p style="margin:0">Done ${esc(ymd(new Date(st.at)))}: ${st.res?st.res.xp:0} XP earned.</p>`:''}
  <button type="button" class="rtsgo${done?' ok':''}" id="rtsgo"${done||VIEWAS?' disabled':''}>${done?'✅ ATTENDANCE SAVED':go?'▶ CONTINUE: SAVE MY ATTENDANCE':'SAVE MY ATTENDANCE'}</button></div></div>`}
function rtsHomeBind(){const b=$('#rtsgo');if(!b||b.disabled)return;b.onclick=()=>{const s=rtsCur();if(!s)return;const st=rtsSt(s);if(st&&st.st==='go'){location.hash='#/rts';return}rtsAsk(s)}}
function rtsModal(h){closeModal();const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.innerHTML=`<div class="card" style="max-width:520px">${h}</div>`;document.body.append(m);return m}
function rtsAsk(s){const m=rtsModal(`<div style="font-size:2.4rem;text-align:center">🚧</div><h2 style="text-align:center;margin:4px 0 10px">Before you start</h2>
  <p><b>You can leave any time.</b> Tap <b>Save and continue later</b>, or just close the app: your answers and your time are kept, and you carry on from the button on Today. The clock only runs while this session is open.</p>
  ${s.noLimit?'<p><b>No time limit.</b> It is designed to take about '+s.mins+' minutes, but take as long as you need before the deadline.</p>':''}
  <p>Real talk: it's ${s.noLimit?'about ':'literally '}${s.mins} minutes. No cap 🧢. Put your phone on Do Not Disturb, close TikTok for a bit, and secure that attendance. You've got this 💅</p>
  <div class="row" style="justify-content:center;margin-top:14px"><button type="button" class="btn ghost" id="rtsno">Not now</button><button type="button" class="btn" id="rtsyes">Let's Go! 🏁</button></div>`);
  $('#rtsno').onclick=closeModal;m.onclick=e=>{if(e.target===m)closeModal()};$('#rtsyes').focus();
  $('#rtsyes').onclick=()=>{U.rts=U.rts||{};const old=U.rts[s.id];U.rts[s.id]={st:'go',n:((old&&old.n)|0)+1,act:0,ext:0,a:{},pick:{},fl:{paste:0},ph:'main',started:new Date().toISOString()};save();closeModal();location.hash='#/rts'}}

/* ---------- the session page ---------- */
function rtsPage(){const s=rtsCur();if(!s||!rtsPlayer()){location.replace('#/');return}const st=rtsSt(s);if(!st){location.replace('#/');return}
  if(st.st==='done'){location.replace('#/');return}rtsCss();
  const lim=rtsLimit(s,st),over=st.act>=lim,lock=over&&!(st.ph==='bonus'),a=st.a||{};
  const mcq=p=>`<div class="card"><h2 style="margin-top:0">${esc(p.title)}</h2><p class="muted">${esc(p.sub||'')}</p>${p.items.map((id,i)=>{const q=rtsQ(id);return `<fieldset class="rtsq" style="border:0;padding:0"><legend><h3>${i+1}. ${esc(q[1])}</h3></legend>${rtsOpts(id).map(o=>`<label class="rtso${a[id]===o?' on':''}"><input type="radio" name="m_${id}" data-mq="${esc(id)}" value="${esc(o)}"${a[id]===o?' checked':''}${lock?' disabled':''}><span>${esc(o)}</span></label>`).join('')}</fieldset>`}).join('')}</div>`;
  const wq=(id)=>{const q=rtsQ(id),w=rtsWords(a[id]),mn=q.minW||60;return `${q.label?`<p class="rtslbl muted">${esc(q.label)}</p>`:''}${q.scenario?`<p class="rtsscn">${esc(q.scenario)}</p>`:''}<h3>${esc(q.q)}</h3>
    <textarea data-wq="${esc(id)}" aria-label="Your answer" spellcheck="true"${lock?' disabled':''}>${esc(a[id]||'')}</textarea><p class="rtswc ${w>=mn?'ok':'muted'}" id="wc_${esc(id)}">${w} words (at least ${mn})</p>`};
  const wr=(p,pi)=>`<div class="card"><h2 style="margin-top:0">${esc(p.title)}</h2><p class="muted">${esc(p.sub||'')}</p>${p.label?`<p class="rtslbl muted">${esc(p.label)}</p>`:''}${p.scenario?`<p class="rtsscn">${esc(p.scenario)}</p>`:''}
    ${p.pick>1?(()=>{const c=rtsPicks(st,pi);return `<p><b>Choose ${p.pick}:</b> ${c.length}/${p.pick} chosen</p><div class="rtspick" role="group" aria-label="Choose ${p.pick} questions">${p.items.map(id=>{const q=rtsQ(id),on=c.includes(id);return `<label class="rtso${on?' on':''}"><input type="checkbox" data-pkm="${pi}" value="${esc(id)}"${on?' checked':''}${!on&&c.length>=p.pick?' disabled':''}${lock?' disabled':''}><span><b>${esc(q.topic)}</b><br><small>${esc(q.q)}</small></span></label>`}).join('')}</div>${c.map(id=>'<div style="margin-top:14px" class="rtsq">'+wq(id)+'</div>').join('')||'<p class="muted">Choose two questions above to see them.</p>'}`})()
     :p.pick?`<div class="rtspick" role="radiogroup" aria-label="Choose a question">${p.items.map(id=>{const q=rtsQ(id);return `<label class="rtso${(st.pick||{})[pi]===id?' on':''}"><input type="radio" name="pk_${pi}" data-pk="${pi}" value="${esc(id)}"${(st.pick||{})[pi]===id?' checked':''}${lock?' disabled':''}><span><b>${esc(q.topic)}</b></span></label>`}).join('')}</div>${(st.pick||{})[pi]?'<div style="margin-top:14px">'+wq(st.pick[pi])+'</div>':'<p class="muted">Choose one question above to see it.</p>'}`
      :p.items.map(id=>`<div class="rtsq">${wq(id)}</div>`).join('')}</div>`;
  const T=rtsTodo(s,st);
  const body=st.ph==='bonus'?`<div class="card"><h2 style="margin-top:0">🤫 The secret question</h2><p class="muted">Answer it to double your finishing XP and your time bonus. At least ${rtsQ(s.bonus).minW||100} words.</p><div class="rtsq">${wq(s.bonus)}</div></div>
     <div class="rtsbar"><button type="button" class="btn" id="rtsbsub">Submit the secret answer</button><button type="button" class="btn ghost" id="rtsbskip">Skip it and finish</button></div>`
    :s.parts.map((p,pi)=>p.kind==='mcq'?mcq(p):wr(p,pi)).join('')+`<div class="rtsbar">
     <button type="button" class="btn" id="rtsfin"${T.all||(over&&(st.ext|0)>=2)?'':' disabled'}>${over&&(st.ext|0)>=2&&!T.all?'Finish':'Finish tutorial session'}</button>
     ${over&&(st.ext|0)<2?`<button type="button" class="btn gold" id="rtsext">⏳ I need more time (+15 min)</button>`:''}
     <button type="button" class="btn ghost" id="rtssave">💾 Save and continue later</button><button type="button" class="btn ghost" id="rtsrst">↺ Restart from the beginning</button></div>`;
  shell('#/rts',`<div class="rtsp"><div class="rtstop${over&&st.ph!=='bonus'?' over':''}" id="rtstop"><span>${esc(s.title)} · ${esc(s.topics)}</span><span id="rtsprog">${T.d}/${T.n} answered</span><span class="rtsclk" id="rtsclk"></span></div>
    <h1 style="margin:0 0 6px">${esc(s.title)}</h1><p class="muted">Your answers save as you go, and you can leave and come back any time from Today. Only active time counts: if you stop for more than 2 minutes, the clock waits for you.</p>
    ${over&&st.ph!=='bonus'?`<div class="callout" style="margin-bottom:14px">${(st.ext|0)<2?'⏰ Time is up. Tap <b>I need more time</b> for 15 more minutes (you can do this twice), or restart from the beginning.':'⏰ Time is up, and both extra times are used. Tap <b>Finish</b> to complete the session with what you have.'}</div>`:''}
    ${body}</div>`);
  rtsBind(s);rtsClock(s)}
function rtsClock(s){const el=$('#rtsclk');if(!el)return;const st=rtsSt(s);if(st.ph==='bonus'){el.textContent='🤫 Bonus round';return}
  if(s.noLimit){el.textContent='⏱️ '+Math.floor(st.act/60000)+' min · about '+s.mins+' suggested';return}const left=rtsLimit(s,st)-st.act;
  el.textContent=left>0?'⏱️ '+Math.floor(left/60000)+':'+String(Math.floor(left%60000/1000)).padStart(2,'0')+' left':'⏰ Time is up';}
function rtsBind(s){const st=rtsSt(s);clearInterval(RTST);let lastSave=Date.now(),lt=Date.now();
  RTST=setInterval(()=>{if(location.hash.indexOf('#/rts')!==0){clearInterval(RTST);return}const now=Date.now(),dt=Math.min(now-lt,5000);lt=now;
    if(document.visibilityState==='visible'&&now-RTSL<120000&&st.ph!=='bonus'&&st.act<rtsLimit(s,st)){const was=st.act<rtsLimit(s,st);st.act+=dt;if(was&&st.act>=rtsLimit(s,st)){save();rtsPage();return}}
    rtsClock(s);if(now-lastSave>15000){lastSave=now;save()}},1000);
  const upd=()=>{const T=rtsTodo(s,st),p=$('#rtsprog');if(p)p.textContent=T.d+'/'+T.n+' answered';const f=$('#rtsfin');if(f)f.disabled=!(T.all||(st.act>=rtsLimit(s,st)&&(st.ext|0)>=2))};
  document.querySelectorAll('[data-mq]').forEach(r=>r.onchange=()=>{st.a[r.dataset.mq]=r.value;r.closest('fieldset').querySelectorAll('.rtso').forEach(l=>l.classList.toggle('on',l.contains(r)));save();upd()});
  document.querySelectorAll('[data-pk]').forEach(r=>r.onchange=()=>{st.pick=st.pick||{};st.pick[r.dataset.pk]=r.value;save();rtsPage()});
  document.querySelectorAll('[data-pkm]').forEach(r=>r.onchange=()=>{st.pick=st.pick||{};const pi=r.dataset.pkm,c=rtsPicks(st,pi).filter(x=>x!==r.value);if(r.checked)c.push(r.value);st.pick[pi]=c;save();const y=scrollY;rtsPage();scrollTo(0,y)});
  document.querySelectorAll('[data-wq]').forEach(t=>{t.oninput=()=>{st.a[t.dataset.wq]=t.value.slice(0,6000);const q=rtsQ(t.dataset.wq),w=rtsWords(t.value),mn=q.minW||60,e=$('#wc_'+t.dataset.wq);if(e){e.textContent=w+' words (at least '+mn+')';e.className='rtswc '+(w>=mn?'ok':'muted')}upd()};
    t.onpaste=e=>{e.preventDefault();st.fl=st.fl||{};st.fl.paste=(st.fl.paste|0)+1;toast('✋','Pasting is switched off here','Type your answer, or use your keyboard\'s voice typing.')};t.onblur=()=>save()});
  $('#rtssave')&&($('#rtssave').onclick=()=>{save();rtsModal(`<div style="font-size:2.2rem;text-align:center">💾</div><h2 style="text-align:center">Saved</h2><p>Your answers and your time are saved to your account. You can close the app now and carry on from any device before ${esc(rtsWhen(new Date(rtsEnd(s)).toISOString()))}.</p><div class="row" style="justify-content:center"><button type="button" class="btn ghost" id="rtsout">Leave for now</button><button type="button" class="btn" id="rtsok">Keep going</button></div>`);$('#rtsok').onclick=closeModal;$('#rtsout').onclick=()=>{closeModal();location.hash='#/'}});
  $('#rtsext')&&($('#rtsext').onclick=()=>{st.ext=(st.ext|0)+1;st.extUsed=1;save();toast('⏳','15 more minutes','Extra time earns no study-time XP, but your answers and finishing still count.');rtsPage()});
  $('#rtsrst')&&($('#rtsrst').onclick=()=>rtsRestartAsk(s));
  $('#rtsfin')&&($('#rtsfin').onclick=()=>rtsFinishAsk(s));
  $('#rtsbsub')&&($('#rtsbsub').onclick=()=>{const w=rtsWords(st.a[s.bonus]),mn=rtsQ(s.bonus).minW||100;if(w<mn){toast('✍️','A little more','Write at least '+mn+' words ('+w+' so far).');return}rtsFinal(s,true)});
  $('#rtsbskip')&&($('#rtsbskip').onclick=()=>rtsFinal(s,false))}
document.addEventListener('pointerdown',()=>{RTSL=Date.now()},true);document.addEventListener('keydown',()=>{RTSL=Date.now()},true);document.addEventListener('scroll',()=>{RTSL=Date.now()},true);document.addEventListener('input',()=>{RTSL=Date.now()},true);

function rtsRestartAsk(s){const m=rtsModal(`<div style="font-size:2.2rem;text-align:center">↺</div><h2 style="text-align:center">Start again from the beginning?</h2>
  <p><b>You will lose all your progress in this session</b>: every answer and your time so far. Any XP from this attempt goes back to zero. You start again with a fresh ${s.mins} minutes.</p>
  <div class="row" style="justify-content:center"><button type="button" class="btn ghost" id="rtsrn">Keep my work</button><button type="button" class="btn" id="rtsry" style="background:#dc2626">Yes, restart</button></div>`);
  $('#rtsrn').onclick=closeModal;$('#rtsrn').focus();$('#rtsry').onclick=()=>{rtsReset(s);closeModal();rtsPage()}}
function rtsReset(s){const st=rtsSt(s)||{};U.gain=U.gain||{};const pre='rts:'+s.id+':';
  Object.keys(U.log).filter(k=>k.indexOf(pre)===0).forEach(k=>{U.xp=Math.max(0,U.xp-(U.gain[k]|0));delete U.log[k];delete U.gain[k]});
  U.rtsVoid=U.rtsVoid||{};(st.keys||[]).forEach(k=>{U.rtsVoid[k]=1;const rk='review:'+k;if(U.log[rk]){U.xp=Math.max(0,U.xp-(U.gain[rk]|0));U.gain[rk]=0}if(U.ans)delete U.ans[k]});
  U.rts[s.id]={st:'go',n:(st.n|0)+1,act:0,ext:0,a:{},pick:{},fl:{paste:0},ph:'main',started:new Date().toISOString()};save();hud()}

/* the lecturer resets a student's attempt (a note with rtsReset:<session id>, usually with rtsTo): XP and written answers from it are cleared
   as with Restart, a copy of the old attempt is kept in U.rtsOld, and the session goes back to "not started" so the student starts fresh from home */
function rtsLectReset(key,id){const s=rtsSessions().find(x=>x.id===id);U.rtsRs=U.rtsRs||{};U.rtsRs[key]=1;if(!s){save();return}
  const old=rtsSt(s);if(old){U.rtsOld=U.rtsOld||{};(U.rtsOld[id]=U.rtsOld[id]||[]).push(Object.assign(JSON.parse(JSON.stringify(old)),{resetAt:new Date().toISOString()}));
    rtsReset(s);U.rts[id]={st:'new',n:old.n|0}}save();hud()}
/* ---------- finishing ---------- */
function rtsScore(s,st){const ids=rtsMcqs(s);return {ok:ids.filter(id=>st.a[id]===rtsQ(id)[2][0]).length,mx:ids.length}}
function rtsFinishAsk(s){const st=rtsSt(s),T=rtsTodo(s,st),base=rtsBase(s);
  if(T.all&&!(st.ext|0)&&st.act<base&&s.bonus&&rtsQ(s.bonus)){st.saved=Math.floor((base-st.act)/60000);save();
    const tb=st.saved*RTS_XP_MIN,sc=rtsScore(s,st);
    const m=rtsModal(`<div style="font-size:2.4rem;text-align:center">🚀</div><h2 style="text-align:center">Speedrun energy!</h2>
      <p>You answered everything in <b>${Math.ceil(st.act/60000)} minutes</b>, with <b>${st.saved} minute${st.saved===1?'':'s'} to spare</b>.</p>
      <ul class="sumlist">${sc.mx?`<li>Quick-fire questions: <b>${sc.ok}/${sc.mx}</b> correct (+${sc.ok*RTS_XP_MCQ} XP)</li>`:''}<li>Finishing: <b>+${RTS_XP_DONE} XP</b></li><li>Time saved: <b>+${tb} XP</b></li><li>Written answers: XP when your lecturer marks them</li></ul>
      <div class="callout" style="margin-top:10px">🤫 <b>Secret question unlocked.</b> One harder question. Answer it and your finishing XP doubles to <b>${2*RTS_XP_DONE}</b> and your time bonus doubles to <b>${2*tb}</b>.</div>
      <div class="row" style="justify-content:center;margin-top:14px"><button type="button" class="btn ghost" id="rtsfn">Finish now</button><button type="button" class="btn gold" id="rtsfx">Show me the secret question 🤫</button></div>`);
    $('#rtsfn').onclick=()=>{closeModal();rtsFinal(s,false)};$('#rtsfx').onclick=()=>{closeModal();st.ph='bonus';save();rtsPage()};return}
  rtsFinal(s,false)}
function rtsFinal(s,bonus){const st=rtsSt(s),sc=rtsScore(s,st),pre='rts:'+s.id+':';let xp=0;const before=U.xp;
  rtsMcqs(s).forEach(id=>{if(st.a[id]===rtsQ(id)[2][0])award(pre+'m:'+id,RTS_XP_MCQ,'Correct',true)});
  award(pre+'done',bonus?2*RTS_XP_DONE:RTS_XP_DONE,'Replacement tutorial finished',true);
  if((st.saved|0)>0&&!(st.ext|0))award(pre+'time',(st.saved|0)*RTS_XP_MIN*(bonus?2:1),'Time bonus',true);
  xp=U.xp-before;
  /* written answers go to the marking queue */
  U.ans=U.ans||{};st.keys=st.keys||[];const fl={paste:(st.fl&&st.fl.paste)||0,bigKept:0,big:0,fast:0,ev:[]};
  const ws=rtsWritten(s,st).filter(w=>w.id&&rtsWords(st.a[w.id])>0).map(w=>w.id);if(bonus&&rtsWords(st.a[s.bonus])>0)ws.push(s.bonus);
  ws.forEach((id,i)=>{const k='rts_'+s.id+'_'+id+'_'+(Date.now()+i).toString(36),t=String(st.a[id]||'');U.ans[k]={q:id,sec:'R',t:t.slice(0,6000),at:new Date().toISOString(),b:0,f:[],s:[],w:rtsWords(t),x:0,fl};st.keys.push(k)});
  st.st='done';st.at=new Date().toISOString();st.ph='done';st.res={xp,mcq:sc.ok,mx:sc.mx,mins:Math.ceil(st.act/60000),ext:st.ext|0,bonus:!!bonus,saved:(st.ext|0)?0:(st.saved|0),sent:ws.length,todo:rtsTodo(s,st).n-rtsTodo(s,st).d};
  save();hud();clearInterval(RTST);location.replace('#/');setTimeout(()=>rtsDone(s),300)}
function rtsDone(s){const st=rtsSt(s),r=st.res||{},slow=r.ext>0||r.todo>0;
  const tips=slow?`<div class="callout" style="margin-top:10px"><b>⏳ A friendly tip on speed.</b> You needed extra time, so practise answering faster before a full 3-hour paper:<ul class="sumlist" style="margin:6px 0 0">
     <li>Plan each written answer in 1 minute: 3 or 4 bullet points, then write.</li><li>Spend about a minute per mark, and move on when the time is up.</li><li>Write in short paragraphs: point, explain, example, then a judgement.</li>
     ${r.mx?'<li>Quick-fire questions: under a minute each. Skip a hard one and come back.</li>':''}<li>Use the ⏱️ timed writing in the Arena a few times this week.</li></ul></div>`
    :`<p class="muted" style="margin-top:8px">Great pace. Keep using timed practice so it stays this sharp.</p>`;
  const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Attendance saved');
  m.innerHTML=`<canvas class="confetti" aria-hidden="true" style="position:fixed;inset:0;pointer-events:none"></canvas><div class="card" style="max-width:520px;text-align:center"><div style="font-size:3rem">😜👍</div><h2>Attendance saved!</h2><p style="font-size:1.1rem"><b>Your future self thanks you.</b></p>
    <ul class="sumlist" style="text-align:left">${r.mx?`<li>Quick-fire questions: <b>${r.mcq}/${r.mx}</b> correct</li>`:''}<li>Time: <b>${r.mins} minutes</b>${r.ext?` (with ${r.ext*15} minutes extra)`:''}</li><li>XP earned now: <b>+${r.xp} XP</b>${r.bonus?' (doubled by the secret question 🤫)':''}</li><li>${r.sent} written answer${r.sent===1?'':'s'} sent for marking: more XP when marked</li></ul>${tips}
    <button type="button" class="btn" id="rtsdok" style="margin-top:14px">👍 Nice</button></div>`;
  document.body.append(m);if(typeof confetti==='function'&&!(typeof calm==='function'&&calm()))confetti(m.querySelector('canvas'),true);$('#rtsdok').onclick=()=>{m.remove();route()};$('#rtsdok').focus()}

/* ---------- the session page (no lock: students come and go from the home block) ---------- */
ROUTES.rts=rtsPage;

/* ---------- the lecturer's card ---------- */
/* default end for a reset: a day after the later of now and the session's close, at 23:59 (datetime-local value, Maldives time) */
function rtsDefUntil(s){const t=Math.max(Date.now(),s?Date.parse(s.to):0)+864e5,d=new Date(t+5*3600e3).toISOString().slice(0,10);return d+'T23:59'}
if(typeof LF_META!=='undefined')LF_META.rtsc=['🚧 Replacement tutorial','Who has saved their attendance'];
if(typeof lcard==='function')lcard('rtsc',async el=>{const S=rtsSessions().slice().reverse();if(!S.length)return;el.hidden=false;
  el.innerHTML='<h2>Replacement tutorial sessions</h2><p class="muted" data-lect>Students who finish keep the attendance of the missed class. Written answers are in the marking queue.</p><label for="rtssel">Session</label><select id="rtssel">'+S.map(s=>`<option value="${esc(s.id)}">${esc(s.title)} · ${esc(s.topics)} · closes ${esc(rtsWhen(s.to))}</option>`).join('')+'</select><div id="rtsl" style="margin-top:10px"><p class="muted">Loading…</p></div>';
  const draw=async()=>{const id=$('#rtssel').value,us=await CLOUD.docs('users'),rows=[];
    us.filter(x=>x.id!==LECTURER&&x.id!=='S000000').forEach(x=>{let u={};try{u=JSON.parse(x.u)}catch(e){}const r=(u.rts||{})[id];if(r)rows.push({id:x.id,n:x.name||u.dn||x.id,r})});
    rows.sort((a,b)=>(a.r.st==='done'?0:1)-(b.r.st==='done'?0:1)||String(a.n).localeCompare(String(b.n)));const done=rows.filter(x=>x.r.st==='done').length;
    $('#rtsl').innerHTML=`<p><b>${done}</b> finished · ${rows.length-done} in progress</p>`+(rows.length?`<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Student</th><th>Status</th><th>Active min</th><th>Extra time</th><th>Quick-fire</th><th>Secret Q</th><th>Restarts</th><th>Finished</th><th>Reset</th></tr></thead><tbody>${rows.map(x=>{const r=x.r,s=r.res||{};
      return `<tr><td>${esc(x.n)}<br><small class="muted">${esc(x.id)}</small></td><td>${r.st==='done'?'✅ Done':r.st==='new'?'🔄 Reset, not started':'⏳ In progress'}</td><td>${Math.ceil((r.act|0)/60000)}</td><td>${(r.ext|0)?(r.ext*15)+' min':'–'}</td><td>${s.mx?s.mcq+'/'+s.mx:'–'}</td><td>${s.bonus?'🤫 Yes':'–'}</td><td>${Math.max(0,(r.n|0)-1)}</td><td>${r.at?esc(String(r.at).slice(0,16).replace('T',' ')):'–'}</td><td>${r.st==='new'?'<span class="muted">reset</span>':`<button type="button" class="btn ghost sm" data-rtsrs="${esc(x.id)}" data-lect>↺ Reset</button>`}</td></tr>`}).join('')}</tbody></table></div>`:'<p class="muted">Nobody has started yet.</p>')
    +`<div class="card" data-lect style="margin-top:12px;background:var(--sunk)"><label for="rtsuntil"><b>Reset reopens it until</b></label> <input type="datetime-local" id="rtsuntil" value="${rtsDefUntil(rtsSessions().find(s=>s.id===id))}"><p class="muted" style="font-size:.84rem;margin:6px 0 0">↺ Reset clears the student's attempt and its XP (a copy is kept in their record), reopens the session for them until this time (Maldives time) and pins a message on their home page. It takes effect the next time they open the Arena.</p></div>`;
    document.querySelectorAll('[data-rtsrs]').forEach(b=>b.onclick=async()=>{const sid=b.dataset.rtsrs,v=$('#rtsuntil').value;if(!v)return toast('⚠️','Pick a date first','');const to=v+':59+05:00';
      if(!confirm('Reset '+sid+'\'s Replacement Tutorial and reopen it until '+rtsWhen(to)+'?\n\nTheir attempt and its XP are cleared and they start again.'))return;b.disabled=true;
      const fb="Your Replacement Tutorial Session has been reset so you can do it properly this time 💪 It's open for you until "+rtsWhen(to)+". Your earlier attempt and its XP have been cleared. Open the Arena and tap SAVE MY ATTENDANCE on Today to start fresh. You can save and close it any time and carry on later.";
      try{await CLOUD.saveReview(sid,'note_pin_rtsrs'+Date.now().toString(36),{q:'note',fb,at:isoNow(),by:'lecturer',pin:true,rtsReset:id,rts:id,rtsTo:to});b.textContent='✓ Reset sent';toast('↺','Reset sent',sid)}catch(e){b.disabled=false;toast('⚠️','Not sent',CLOUD.say(e))}})};
  $('#rtssel').onchange=draw;draw()});
