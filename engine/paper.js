/* MKT Arena engine: the practice paper (#/paper).
   Unlocks Sun 22 Nov 2026, 00:00 GMT+5 (PAPER_AT in dash.js); the lecturer (S000001) can preview it at any time.
   3 hours, section by section. Time left over in a section carries forward as bonus minutes to the next one; the clock keeps
   running if the page is closed (it is a real sitting), and a section whose time runs out is submitted as it stands, with a buzzer.
   Answers are typed, spoken (speech to text) or written on paper; nothing can be changed after a section is submitted.
   After the paper: a self-check against the key ideas (XP only, no marks) and a report.
   Course hook (course.js): paperSpec(rng) → [{k, title, mins, note, items:[{id, kind:'written'|'mcq', q, html?, ideas:[...], o?:[correct first], label}]}]
   with the minutes adding up to 180. Progress field (additive): U.pp {n, cur, hist:[...]}. XP keys pp:<paper>:<question> and pp:<paper>:mcq,
   for the first PP_XP papers only. */
const PP_XP=3,PP_MIN=60e3;
let PPT=null;onHook('leave',()=>{clearInterval(PPT);PPT=null;stopMic()});
const ppOpen=()=>Date.now()>=PAPER_AT||(ME&&ME.sid===LECTURER);
const ppFmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s%60).padStart(2,'0')};
const ppMins=ms=>Math.round(ms/PP_MIN);
/* the questions come from a seed (course, student, paper), so they are the same on every device and nothing big is stored */
const PP_SPEC={};
function ppSpec(P){const k=ME.sid+'|'+P.id;if(PP_SPEC[k])return PP_SPEC[k];const rng=seeded(CRS.id+'|'+k),S=paperSpec(rng);
  const mix=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  return PP_SPEC[k]=S.map(s=>({k:s.k,title:s.title,mins:s.mins,note:s.note||'',items:s.items.map(it=>Object.assign({},it,{ord:it.kind==='mcq'?mix(it.o.map((x,j)=>j)):null}))}))}
/* the deadline of the current section */
const ppDue=P=>P.ss+ppSpec(P)[P.si].mins*PP_MIN+(P.bonus|0);
/* submit the current section (by the student, or because its time ran out at `at`) */
function ppSubmit(P,at,auto){const S=ppSpec(P),due=ppDue(P),t=Math.min(at,due),left=Math.max(0,due-t);
  P.sub.push({at:t,used:t-P.ss,al:due-P.ss,left,auto:auto?1:0});if(!auto)P.bonus=left;else P.bonus=0;
  if(P.si+1<S.length){P.si++;P.ss=t}else{P.end=t;P.si=S.length}}
/* catch up after the page was closed: sections whose time ran out are submitted in turn */
function ppCatchUp(P){let n=0;while(!P.end&&Date.now()>=ppDue(P)){ppSubmit(P,ppDue(P),1);n++}return n}
function ppBuzz(){try{const A=window.AudioContext||window.webkitAudioContext,ac=new A();[0,.45,.9].forEach(t=>{const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=660;
    g.gain.setValueAtTime(.0001,ac.currentTime+t);g.gain.exponentialRampToValueAtTime(.25,ac.currentTime+t+.02);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+t+.35);o.connect(g).connect(ac.destination);o.start(ac.currentTime+t);o.stop(ac.currentTime+t+.4)});
    setTimeout(()=>ac.close(),1800)}catch(e){}try{navigator.vibrate&&navigator.vibrate([300,150,300,150,300])}catch(e){}}
const ppAns=(P,id)=>P.a[id]||(P.a[id]={txt:'',mode:'typed'});
const ppDone=(it,a)=>a&&(it.kind==='mcq'?a.oi!=null:a.mode==='paper'?!!a.paper:words(a.txt)>0);

/* the paper's state in a few words (home dashboard) */
function ppLine(){const P=U&&U.pp&&U.pp.cur;return P&&!P.end?'in progress: carry on':P&&P.end&&!P.ck?'finished: do your self-check':ppOpen()?'3 hours, section by section':'unlocks Sun 22 Nov 2026, 00:00'}
const ppBusy=()=>{const P=U&&U.pp&&U.pp.cur;return !!(P&&(!P.end||!P.ck))};

ROUTES.paper=()=>{clearInterval(PPT);U.pp=U.pp||{n:0,cur:null,hist:[]};const PP=U.pp,P=PP.cur;
  if(P&&!P.end){if(ppCatchUp(P)){save();toast('⏰','Time ran out','Sections whose time ended were submitted as they stood')}if(!P.end)return ppSitting(P)}
  if(P&&P.end&&!P.ck)return ppCheck(P);
  if(P&&P.ck&&location.hash.includes('report'))return ppReport(P);
  ppStart()};

function ppStart(){const PP=U.pp,open=ppOpen(),last=PP.cur&&PP.cur.ck?PP.cur:null,lect=ME.sid===LECTURER;
  const ex=paperSpec(seeded('preview'));
  shell('#/',`<p><a href="#/">← Home</a></p><h1>📝 Practice paper</h1>
  ${!open?`<div class="card" style="text-align:center;padding:26px 18px"><div style="font-size:2.6rem">🔒</div><h2 style="margin:6px 0">Unlocks Sun 22 Nov 2026, 00:00</h2><p class="muted">Maldives time (GMT+5). <span id="ppcd"></span></p></div>`:''}
  <div class="card" style="margin-top:14px"><h2 style="margin:0 0 6px">How it works</h2><ul class="sumlist">
   <li><b>3 hours</b>, one section at a time: ${ex.map(s=>`${esc(s.title)} (${s.mins} min)`).join(', ')}.</li>
   <li>Finish a section early and the time you have left is <b>added to the next section</b>.</li>
   <li>When a section's time runs out, a buzzer sounds and it is submitted as it stands. The clock keeps running if you close the page.</li>
   <li>Type your answers, speak them (🎤), or write them on paper and tick “I wrote this on paper”.</li>
   <li>Once you submit a section you can't change it.</li>
   <li>Afterwards, check your answers against the key ideas for XP and see your report. The check is not timed.</li></ul>
   <p class="muted" style="font-size:.88rem">Find a quiet place, keep paper and a pen ready, and put your phone on silent.</p>
   ${open?`<button class="btn gold" id="ppgo">${PP.n?'Start a new practice paper':'Start the practice paper'}</button>${lect&&Date.now()<PAPER_AT?' <span class="tag">Lecturer preview</span>':''}`:''}
   ${last?` <a class="btn ghost" href="#/paper/report">Last report</a>`:''}</div>
  ${PP.hist.length?`<div class="card" style="margin-top:14px"><h2 style="margin:0 0 6px">Your papers</h2>${PP.hist.slice().reverse().map(h=>`<div class="rdrow"><span class="rdl">Paper ${h.n} · ${esc(h.d)}</span><span class="muted">${h.ideas}% of key ideas${h.mcq!=null?' · MCQ '+h.mcq+'%':''}</span></div>`).join('')}</div>`:''}`);
  if(!open){const cd=()=>{const e=$('#ppcd');if(!e)return clearInterval(PPT);const ms=PAPER_AT-Date.now();if(ms<=0){clearInterval(PPT);return route()}const d=Math.floor(ms/864e5);e.textContent=(d?d+' day'+(d===1?'':'s')+' ':'')+ppFmt(ms%864e5)+' to go.'};cd();PPT=setInterval(cd,1000);return}
  $('#ppgo').onclick=()=>{if(!confirm('Start the 3-hour practice paper now?\n\nThe clock starts straight away and keeps running if you close the page.'))return;
    PP.n++;PP.cur={id:'p'+PP.n,n:PP.n,at:Date.now(),si:0,ss:Date.now(),bonus:0,sub:[],a:{},end:null,chk:{},ck:0,pre:Date.now()<PAPER_AT?1:0};save();route()}}

function ppSitting(P){const S=ppSpec(P),sec=S[P.si];
  const item=(it,i)=>{const a=ppAns(P,it.id),qn=`${i+1}.`;
    if(it.kind==='mcq')return `<div class="card qcard ppq" id="pq-${it.id}"><h3 style="font-weight:600;margin:0 0 8px">${qn} ${esc(it.q)}</h3><div class="mopts">${it.ord.map(j=>`<button class="mopt${a.oi===j?' on':''}" data-pm="${it.id}" data-oi="${j}" aria-pressed="${a.oi===j}">${esc(it.o[j])}</button>`).join('')}</div></div>`;
    return `<div class="card qcard ppq" id="pq-${it.id}"><div class="qmeta"><span class="tag">${esc(it.label||'')}</span></div>${it.html?`<details class="ppbrief"><summary class="click">Read the brief</summary><div>${it.html}</div></details>`:''}<h3 style="font-weight:600;margin:6px 0 8px">${qn} ${esc(it.q)}</h3>
     <div class="row" role="group" aria-label="How you answer"><button class="btn ghost sm${a.mode!=='paper'?' on':''}" data-mode="typed" data-q="${it.id}">⌨️ Type or speak</button><button class="btn ghost sm${a.mode==='paper'?' on':''}" data-mode="paper" data-q="${it.id}">✍️ On paper</button></div>
     ${a.mode==='paper'?`<label class="row ppchk"><input type="checkbox" data-paper="${it.id}" ${a.paper?'checked':''}> I wrote this answer on paper</label>`
      :`<textarea id="ta-${it.id}" rows="8" placeholder="Type your answer, or tap 🎤 Speak" aria-label="Answer to question ${i+1}">${esc(a.txt||'')}</textarea>
     <div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted" id="wc-${it.id}" style="font-size:.82rem">${words(a.txt)} words</span>${SR?`<button class="btn ghost sm" data-a="mic" aria-pressed="false">🎤 Speak</button>`:''}</div><p class="muted" id="im-${it.id}" style="font-size:.85rem;margin:4px 0 0"></p><p class="muted" id="fn-${it.id}" style="font-size:.82rem;margin:4px 0 0"></p>`}</div>`};
  shell('#/',`<div class="pphead" id="pphead"><div><b class="lex">${esc(sec.title)}</b><span class="muted"> · section ${P.si+1} of ${S.length}</span></div><div class="row" style="gap:8px">${P.bonus?`<span class="tag" title="Time carried forward">+${ppMins(P.bonus)} min carried</span>`:''}<b class="timer lex" id="pptm" aria-live="off"></b></div></div>
  ${sec.note?`<p class="muted" style="margin:10px 0">${esc(sec.note)}</p>`:''}
  <div id="ppitems">${sec.items.map(item).join('')}</div>
  <div class="card" style="margin-top:14px;text-align:center"><p class="muted" id="ppleft" style="margin:0 0 10px"></p><button class="btn gold" id="ppsub">Submit this section${P.si+1<S.length?' and go on':''}</button>
  <p class="muted" style="font-size:.82rem;margin:10px 0 0">The paper ends at ${new Date(P.at+180*PP_MIN+MV).toISOString().slice(11,16)} (Maldives time) at the latest. <a href="javascript:void 0" id="ppquit">End the paper now</a></p></div>`);
  const left=()=>{const n=sec.items.filter(it=>!ppDone(it,P.a[it.id])).length;$('#ppleft').textContent=n?n+' of '+sec.items.length+' not answered yet.':'All '+sec.items.length+' answered.'};left();
  sec.items.forEach(it=>{if(it.kind==='mcq'||ppAns(P,it.id).mode==='paper')return;const ta=$('#ta-'+it.id),card=$('#pq-'+it.id),st=ppAns(P,it.id);typingBox({id:it.id},st,ta,card);ta.addEventListener('input',left)});
  document.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>{const a=ppAns(P,b.dataset.pm);a.oi=+b.dataset.oi;b.parentNode.querySelectorAll('.mopt').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});save();left()});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{const a=ppAns(P,b.dataset.q);if(a.mode===b.dataset.mode)return;stopMic();a.mode=b.dataset.mode;save();ppSitting(P);const e=$('#pq-'+b.dataset.q);e&&e.scrollIntoView({block:'center'})});
  document.querySelectorAll('[data-paper]').forEach(c=>c.onchange=()=>{ppAns(P,c.dataset.paper).paper=c.checked?1:0;save();left()});
  let warned=Date.now()>ppDue(P)-5*PP_MIN;
  const tick=()=>{if(!$('#pptm'))return clearInterval(PPT);const ms=ppDue(P)-Date.now();
    if(ms<=0){clearInterval(PPT);stopMic();ppSubmit(P,ppDue(P),1);ppCatchUp(P);save();ppBuzz();route();
      modal('Time is up',`<div style="text-align:center"><div style="font-size:2.6rem">⏰</div><h2 style="margin:6px 0">Time is up</h2><p>${esc(sec.title)} was submitted as it stood.${P.end?' That was the last section.':' The next section has started.'}</p><button class="btn" id="ppok">OK</button></div>`);$('#ppok').onclick=closeModal;return}
    $('#pptm').textContent=ppFmt(ms);$('#pptm').className='timer lex'+(ms<=60e3?' over':ms<=5*PP_MIN?' warn':'');
    if(!warned&&ms<=5*PP_MIN){warned=true;toast('⏳','5 minutes left',sec.title)}};
  tick();PPT=setInterval(tick,500);
  $('#ppsub').onclick=()=>{const n=sec.items.filter(it=>!ppDone(it,P.a[it.id])).length,carry=ppDue(P)-Date.now();
    if(!confirm(`${n?n+' question'+(n===1?' is':'s are')+' not answered. ':''}Submit ${sec.title}? You can't change these answers afterwards.${P.si+1<S.length?`\n\n${ppMins(carry)} minute${ppMins(carry)===1?'':'s'} will be added to the next section.`:''}`))return;
    clearInterval(PPT);stopMic();ppSubmit(P,Date.now(),0);save();if(P.end)toast('🏁','Paper finished','Now check your answers');route();scrollTo(0,0)};
  $('#ppquit').onclick=()=>{if(!confirm('End the whole paper now? Every section left is submitted as it stands.'))return;clearInterval(PPT);stopMic();
    while(!P.end)ppSubmit(P,Date.now(),1);save();route()}}

/* the self-check: written answers against the key ideas; MCQs are checked automatically */
function ppCheck(P){const S=ppSpec(P);
  shell('#/',`<p><a href="#/">← Home</a></p><h1>Check your paper</h1><p class="muted">For each answer, tick the key ideas you really covered. Be honest: this is for you. XP comes from the check${P.n>PP_XP?' (XP is for your first '+PP_XP+' papers; this one is practice only)':''}.</p>
  ${S.map((s,si)=>`<h2 style="margin-top:22px">${esc(s.title)}</h2>${s.items.map((it,i)=>{const a=P.a[it.id]||{};
    if(it.kind==='mcq'){const ok=a.oi===0;return `<div class="card ppck"><b>${i+1}. ${esc(it.q)}</b><p style="margin:6px 0 0">${a.oi==null?'<span class="muted">Not answered.</span>':ok?'✓ '+esc(it.o[0]):'✗ You chose '+esc(it.o[a.oi])+'. <b>Answer:</b> '+esc(it.o[0])}</p></div>`}
    return `<div class="card ppck" data-ck="${it.id}"><b>${i+1}. ${esc(it.q)}</b>${a.mode==='paper'?`<p class="muted" style="margin:6px 0">${a.paper?'✍️ Written on paper: have it next to you.':'Not answered.'}</p>`:a.txt?`<div class="ppans">${esc(a.txt)}</div>`:'<p class="muted" style="margin:6px 0">Not answered.</p>'}
     ${ppDone(it,a)?`<p class="muted" style="margin:8px 0 4px;font-size:.88rem">Key ideas: tick each one your answer covers.</p>${it.ideas.map((x,j)=>`<label class="row ppchk"><input type="checkbox" data-q="${it.id}" data-j="${j}"> ${esc(x)}</label>`).join('')}`:''}</div>`}).join('')}`).join('')}
  <div class="card" style="margin-top:16px;text-align:center"><button class="btn gold" id="ppfin">Finish the check and see my report</button></div>`);
  $('#ppfin').onclick=()=>{P.chk={};document.querySelectorAll('[data-q][data-j]').forEach(c=>{if(c.checked)(P.chk[c.dataset.q]=P.chk[c.dataset.q]||[]).push(+c.dataset.j)});
    let xp=0;const give=P.n<=PP_XP;
    S.forEach(s=>s.items.forEach(it=>{if(it.kind!=='written'||!ppDone(it,P.a[it.id]))return;const k=(P.chk[it.id]||[]).length,g=Math.min(10,2+Math.round(k/Math.max(1,it.ideas.length)*8));
      if(give&&award('pp:'+P.id+':'+it.id,g,'Practice paper',1))xp+=g}));
    const M=S.flatMap(s=>s.items).filter(it=>it.kind==='mcq');if(M.length){const r=M.filter(it=>(P.a[it.id]||{}).oi===0).length,g=Math.min(15,Math.round(r/2));if(give&&g&&award('pp:'+P.id+':mcq',g,'Practice paper',1))xp+=g}
    P.ck=1;const R=ppStats(P);U.pp.hist.push({n:P.n,d:today(),ideas:R.ideas,mcq:R.mcq,xp});U.pp.hist=U.pp.hist.slice(-20);
    if(give)countOnce('pp:'+P.id,'papers');save();hud();if(xp)toast('📝','Practice paper checked','+'+xp+' XP');location.hash='#/paper/report'}}

function ppStats(P){const S=ppSpec(P);let ki=0,kt=0;const sec=S.map((s,si)=>{let i=0,t=0,ans=0,mr=0,mn=0;
    s.items.forEach(it=>{const a=P.a[it.id];if(ppDone(it,a))ans++;if(it.kind==='mcq'){mn++;if(a&&a.oi===0)mr++}else{t+=it.ideas.length;i+=(P.chk[it.id]||[]).length}});
    ki+=i;kt+=t;const sb=P.sub[si]||{};return {title:s.title,mins:sb.al?ppMins(sb.al):s.mins,used:sb.used|0,left:sb.left|0,auto:sb.auto,ans,n:s.items.length,ideas:t?Math.round(i/t*100):null,mcq:mn?Math.round(mr/mn*100):null}});
  const mc=sec.filter(s=>s.mcq!=null);return {sec,ideas:kt?Math.round(ki/kt*100):0,mcq:mc.length?mc[0].mcq:null}}

function ppReport(P){const R=ppStats(P),weak=R.sec.filter(s=>s.ideas!=null).sort((a,b)=>a.ideas-b.ideas)[0];
  const tot=R.sec.reduce((t,s)=>t+s.used,0);
  shell('#/',`<p><a href="#/">← Home</a></p><h1>Practice paper ${P.n}: your report</h1>
  <div class="stats" style="margin:12px 0"><div class="stat"><b>${R.ideas}%</b><span>key ideas covered</span></div>${R.mcq!=null?`<div class="stat"><b>${R.mcq}%</b><span>MCQs right</span></div>`:''}<div class="stat"><b>${ppFmt(tot)}</b><span>time used</span></div><div class="stat"><b>${R.sec.reduce((t,s)=>t+s.ans,0)}/${R.sec.reduce((t,s)=>t+s.n,0)}</b><span>answered</span></div></div>
  <div class="card"><h2 style="margin:0 0 8px">By section</h2>${R.sec.map(s=>{const v=s.ideas!=null?s.ideas:s.mcq;return `<div class="ppsec"><div class="row" style="justify-content:space-between;gap:8px"><b>${esc(s.title)}</b><b>${s.ideas!=null?s.ideas+'% of key ideas':s.mcq+'% right'}</b></div>
    <div class="bar"><i style="width:${v}%;background:${v>=70?'var(--green)':v>=40?'var(--gold)':'var(--pink)'}"></i></div>
    <p class="muted" style="font-size:.84rem;margin:4px 0 0">${s.ans}/${s.n} answered · ${ppFmt(s.used)} of ${s.mins} min${s.auto?' · time ran out':s.left?' · '+ppMins(s.left)+' min carried forward':''}</p></div>`}).join('')}</div>
  <div class="callout" style="margin-top:14px">🎯 ${weak&&weak.ideas<70?`<b>Work on next:</b> ${esc(weak.title)}. Go back over the key ideas you left out, then practise similar questions.`:'Strong paper. Keep your timing steady and add more evaluation to every answer.'}</div>
  <div class="row" style="margin-top:14px"><a class="btn" href="#/">Home</a> <a class="btn ghost" href="#/paper">Practice paper page</a></div>`)}
