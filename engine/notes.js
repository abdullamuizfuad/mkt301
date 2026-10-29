/* MKT Arena engine: study notes (#/notes, #/notes/<key>) and "📖 Refer to notes" links, shared by both courses.
   Course hook (course.js): notesCfg() → {
     N: {intro, how:[[step, text]], answer (optional)},  keys:[...] in order,  get(k) → entry or null (not written yet: "Coming soon"),
     word: 'Topic' | 'Week',  ico(k), title(k),  egLabel (label for a one-line eg),  badge(k) (optional),
     practice(k) → [[label, href]] (the first is the main button),  last: [label, href] (after the last key) }
   Entry fields (notes.js, notes301.js): sum, big, min, lo, ideas:[{h, p, l, dia, more, eg (text or list), tip}], apply:{h, steps:[[step, text]]},
     terms:[[term, meaning]], mistakes, worked:{q, marks, plan, model:[[tag, text]]}, check:[[q, a]], prompts.
   "I've studied this" earns +20 XP once per key (notes:<key>, counted in "notes").
   notesFor(q, o) (course hook, optional) → the notes link for a question; notesBtn(q, o) draws it on question cards. */
function diagramHTML(d){
 const cap=d.title?`<figcaption>${esc(d.title)}</figcaption>`:'';const sub=x=>x?`<small>${esc(x)}</small>`:'';let body='';
 if(d.type==='flow')body=`<ol class="dflow${d.steps.length>5?' dlong':''}">${d.steps.map(([h,s],i)=>`<li><span class="dn">${i+1}</span><b>${esc(h)}</b>${sub(s)}</li>`).join('')}</ol>${d.loop?`<p class="dloop">↻ ${esc(d.loop)}</p>`:''}`;
 else if(d.type==='grid')body=`<div class="dgrid"><span class="dyl">${esc(d.yl)}</span><div class="dbox"><span class="dyv">${esc(d.y[0])}</span><span class="dyv">${esc(d.y[1])}</span>
   ${d.cells.map(([h,s],i)=>`<div class="dcell c${i}"><b>${esc(h)}</b>${sub(s)}</div>`).join('')}<span></span><span class="dxv">${esc(d.x[0])}</span><span class="dxv">${esc(d.x[1])}</span></div><span class="dxl">${esc(d.xl)}</span></div>`;
 else if(d.type==='pyramid')body=`<div class="dpyr">${d.levels.map(([h,s],i)=>`<div style="width:${Math.round(40+60*i/Math.max(1,d.levels.length-1))}%"><b>${esc(h)}</b>${sub(s)}</div>`).join('')}</div>${d.note?`<p class="dloop">${esc(d.note)}</p>`:''}`;
 else if(d.type==='rings'){const r=k=>k>=d.rings.length?'':`<div class="dring r${k}"><b>${esc(d.rings[k][0])}</b>${sub(d.rings[k][1])}${r(k+1)}</div>`;body=r(0)}
 else if(d.type==='compare')body=`<div class="dcmp">${d.cols.map(([h,items])=>`<div><b>${esc(h)}</b><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>`;
 return `<figure class="dia">${cap}${body}</figure>`}
const listHTML=l=>`<ul>${l.map(x=>`<li>${Array.isArray(x)?`<b>${esc(x[0])}:</b> ${esc(x[1])}`:esc(x)}</li>`).join('')}</ul>`;
let NOTES_EG='Example',NOTES_OPEN='';
function ideaHTML(c,k){const ps=[].concat(c.p||[]),eg=c.eg?(Array.isArray(c.eg)?`<div class="eg"><ul>${c.eg.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:`<p class="eg"><b>${esc(NOTES_EG)}:</b> ${esc(c.eg)}</p>`):'';
 return `<section class="card concept" id="n-i${k}" style="margin-bottom:12px"><h3>${esc(c.h)}</h3>${ps.map(x=>`<p>${esc(x)}</p>`).join('')}${c.l?listHTML(c.l):''}${c.dia?diagramHTML(c.dia):''}${c.more?[].concat(c.more).map(x=>`<p>${esc(x)}</p>`).join(''):''}
  ${eg}${c.tip?`<p class="tip"><b>Tip:</b> ${esc(c.tip)}</p>`:''}</section>`}
const GEMINI='https://gemini.google.com/app';
const notesOK=()=>typeof notesCfg==='function';
function notesPage(sub){if(typeof wildBusy==='function'&&wildBusy())return shell('#/notes',`<div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:2.4rem">🔒</div><h2>Notes are locked during the challenge</h2><p class="muted">Finish your 6th-spot challenge first.</p><a class="btn" href="#/wild">Back to the challenge</a></div>`);if(!notesOK())return shell('#/',`<h1>Study notes</h1><p class="muted">No notes for this course yet.</p>`);
 const C=notesCfg(),N=C.N,ks=C.keys,k=ks.find(x=>String(x)===String(sub)),T=k!=null?C.get(k):null,w=C.word||'Topic';NOTES_EG=C.egLabel||'Example';
 if(k==null){shell('#/notes',`<h1>Study notes</h1><p class="muted">${esc(N.intro)}</p>
  <div class="card" style="margin-bottom:16px"><h3>How to use these notes</h3><div class="nsteps">${N.how.map(([h,s],i)=>`<div><b>${i+1}. ${esc(h)}</b><span>${esc(s)}</span></div>`).join('')}</div></div>
  <div class="ntopics">${ks.map(x=>{const E=C.get(x);return `<a class="ntopic${E?'':' soon'}" href="#/notes/${x}"><span class="kick">${C.ico(x)} ${w} ${x}${U.log['notes:'+x]?' · ✓ studied':E?'':' · coming soon'}</span><b>${esc(C.title(x))}</b><span>${esc(E?E.sum:'These notes are on the way.')}</span></a>`}).join('')}</div>
  ${[].concat(N.answer||[]).map(A=>`<div class="card" style="margin-top:18px"><h3>${esc(A.h)}</h3><p class="muted">${esc(A.p)}</p>${A.dia?diagramHTML(A.dia):''}${listHTML(A.l)}
   ${A.links?`<div class="row">${A.links.map(([n,h])=>`<a class="btn ghost sm" href="${h}">${esc(n)} →</a>`).join('')}</div>`:''}</div>`).join('')}`);return}
 const i=ks.indexOf(k),prev=ks[i-1],next=ks[i+1],dots=`<nav class="dots" aria-label="${w}s" style="margin-bottom:12px">${ks.map(x=>`<a href="#/notes/${x}" class="dot ${x===k?'on':''} ${U.log['notes:'+x]?'done':''}" aria-label="${w} ${x}" style="text-decoration:none">${x}</a>`).join('')}<a href="#/notes" class="btn ghost sm">All ${w.toLowerCase()}s</a></nav>`;
 const head=`<div class="casehead" style="--c:#8b5cf6"><div class="kick lex">${C.ico(k)} ${w} ${k}</div><h1 style="margin:4px 0 0">${esc(C.title(k))}</h1></div>`,P=C.practice(k)||[];
 if(!T){shell('#/notes',`${dots}${head}<div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:2.4rem">🛠️</div><h2>Coming soon</h2><p class="muted">The notes for ${w} ${k} are being written. Practise the questions meanwhile.</p>
  <div class="row" style="justify-content:center">${P.map(([n,h],j)=>`<a class="btn${j?' ghost':''}" href="${h}">${esc(n)}</a>`).join('')}</div></div>`);return}
 const W=T.worked,studied=!!U.log['notes:'+k],fold=!!C.fold,o0=String(NOTES_OPEN||'');NOTES_OPEN='';
 const pracHTML=`<div class="card" id="n-prac" style="margin-top:18px"><h3>${studied?`✓ You have studied this ${w.toLowerCase()}`:'Finished reading?'}</h3>
   ${studied?'<p class="muted" style="margin:0">Now practise it.</p>':`<p class="muted" style="margin:0 0 10px">Mark the ${w.toLowerCase()} as studied to earn XP${C.badge?` and move towards the ${esc(C.badge(k))} badge`:''}.</p><button class="btn gold" id="nst">📖 I've studied this ${w.toLowerCase()} · +20 XP</button>`}
   <div class="row" style="margin-top:12px">${P.map(([n,h],j)=>`<a class="btn${j?' ghost':''}" href="${h}">${esc(n)}</a>`).join('')}</div></div>`;
 const termsHTML=`<div class="terms">${T.terms.map(([a],j)=>`<button type="button" class="term" aria-pressed="false" data-ti="${j}" data-va-ok><b>${esc(a)}</b><span>Tap to reveal</span></button>`).join('')}</div>
  <div class="row" style="margin-top:10px"><button type="button" class="btn ghost sm" data-tall="1" data-va-ok>Show all</button><button type="button" class="btn ghost sm" data-tall="0" data-va-ok>Hide all</button></div>`;
 const ansHTML=W?`<p class="muted">A worked practice question. Plan your own answer first, then open the model.</p><div class="callout"><b>Practice question · ${W.marks||5} marks</b><br>${esc(W.q)}</div>
   <details class="mine"><summary>✍ Plan</summary><ol style="padding-left:1.2em">${W.plan.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details>
   <details class="mine"><summary>Model answer, with what each part does</summary>${W.model.map(([tag,x])=>`<p><span class="tag">${esc(tag)}</span> ${esc(x)}</p>`).join('')}</details>`:'';
 const chkHTML=T.check.map(([q,a],j)=>`<details class="mine"><summary>${j+1}. ${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
 const aiHTML=T.prompts?`${T.prompts.map((x,j)=>`<div class="prompt"><p>${esc(x)}</p><button class="btn ghost sm" type="button" data-copy="${j}" data-va-ok>Copy prompt</button></div>`).join('')}
   <div class="row" style="margin-top:10px"><a class="btn ghost sm" href="${GEMINI}" target="_blank" rel="noopener">Open Gemini ↗</a></div>`:'';
 const applyHTML=T.apply?`<div class="nsteps">${T.apply.steps.map(([h,s],j)=>`<div><b>${j+1}. ${esc(h)}</b><span>${esc(s)}</span></div>`).join('')}</div>`:'';
 const navHTML=`<div class="row" style="justify-content:space-between;margin-top:18px">${prev!=null?`<a class="btn ghost" href="#/notes/${prev}">← ${w} ${prev}</a>`:'<span></span>'}${next!=null?`<a class="btn" href="#/notes/${next}">${w} ${next} →</a>`:C.last?`<a class="btn" href="${C.last[1]}">${esc(C.last[0])} →</a>`:''}</div>`;
 if(fold){/* short and digestible: the big idea and "In one minute" open; everything else taps open; a sticky "Jump to" row */
  const sec=(id,t,html,sub)=>`<details class="nsec" id="n-${id}" data-ns="${id}"${o0===id?' open':''}><summary><b class="lex">${t}</b>${sub?`<span class="muted nsub">${esc(sub)}</span>`:''}</summary><div class="nsb">${html}</div></details>`;
  const S=[['ideas','💡 Key ideas',T.ideas.map((c,j)=>`<details class="nidea" id="n-i${j}"${o0==='i'+j?' open':''}><summary>${esc(c.h)}</summary>${ideaHTML(c,j).replace(/^<section class="card concept"[^>]*>\s*<h3>.*?<\/h3>/,'<div class="concept">').replace(/<\/section>$/,'</div>')}</details>`).join(''),T.ideas.length+' ideas'],
   T.apply&&['apply','🧭 Apply it to a case',applyHTML,T.apply.steps.length+' steps'],['terms','🔤 Key terms',termsHTML,T.terms.length+' terms'],
   T.mistakes&&['mis','⚠️ Common mistakes',listHTML(T.mistakes),T.mistakes.length+''],W&&['ans','✍️ Answer like this',ansHTML,'A worked question'],['chk','✅ Check yourself',chkHTML,T.check.length+' questions'],T.prompts&&['ai','🤖 Explore with AI',aiHTML,'']].filter(Boolean);
  shell('#/notes',`<div class="row nwrow"><a href="#/notes" class="btn ghost sm">All ${w.toLowerCase()}s</a><label class="nweek"><span class="sr">Choose a ${w.toLowerCase()}</span><select id="nwk">${ks.map(x=>`<option value="${x}" ${x===k?'selected':''}>${w} ${x}: ${esc(C.title(x))}</option>`).join('')}</select></label></div>
   <div class="nhead"><span class="kick lex">${C.ico(k)} ${w} ${k}${studied?' · ✓ studied':''}</span><h1>${esc(C.title(k))}</h1></div>
   <nav class="njump" aria-label="Jump to">${[['min','One minute']].concat(S.map(x=>[x[0],x[1].replace(/^\S+\s/,'')])).concat([['prac','Practise']]).map(([id,n])=>`<button type="button" class="chip" data-jump="n-${id}" data-va-ok>${n}</button>`).join('')}</nav>
   ${T.big?`<div class="callout nbig"><b>Big idea:</b> ${esc(T.big)}</div>`:''}
   <div class="card lo" id="n-min"><h3>In one minute</h3><ul class="nmin">${T.min.map((x,j)=>`<li${j>=3?' hidden':''}>${Array.isArray(x)?`<b>${esc(x[0])}:</b> ${esc(x[1])}`:esc(x)}</li>`).join('')}</ul>${T.min.length>3?`<button type="button" class="linkbtn" id="nmore" data-va-ok>Show ${T.min.length-3} more ▾</button>`:''}<details class="nlo"><summary>What you need to be able to do</summary>${Array.isArray(T.lo)?listHTML(T.lo):`<p>${esc(T.lo)}</p>`}</details></div>
   <div class="card nsecs">${S.map(x=>sec(...x)).join('')}</div>
   <div class="card nprac" id="n-prac">${studied?`<span class="tag">✓ Studied</span>`:`<button class="btn gold sm" id="nst">📖 I've studied this ${w.toLowerCase()} · +20 XP</button>`}${P.map(([n,h])=>`<a class="btn ghost sm" href="${h}">${esc(n)}</a>`).join('')}</div>
   <div class="row" style="justify-content:space-between;margin-top:10px">${prev!=null?`<a class="btn ghost sm" href="#/notes/${prev}">← ${w} ${prev}</a>`:'<span></span>'}${next!=null?`<a class="btn ghost sm" href="#/notes/${next}">${w} ${next} →</a>`:''}</div>`);
  $('#nmore')&&($('#nmore').onclick=()=>{document.querySelectorAll('.nmin li[hidden]').forEach(x=>x.hidden=false);$('#nmore').remove()});
  $('#nwk').onchange=e=>{location.hash='#/notes/'+e.target.value};
  if(o0){const x=document.getElementById(/^i\d+$/.test(o0)?'n-'+o0:'n-'+o0);if(x){if(/^i\d+$/.test(o0))$('#n-ideas').open=true;setTimeout(()=>x.scrollIntoView({block:'start'}),40)}}}
 else{const jumps=[['n-min','In one minute'],['n-ideas','Key ideas'],T.apply&&['n-apply','Apply it'],['n-terms','Key terms'],T.mistakes&&['n-mis','Common mistakes'],W&&['n-ans','Answer like this'],['n-chk','Check yourself'],['n-prac','Practise'],T.prompts&&['n-ai','Explore with AI']].filter(Boolean);
 shell('#/notes',`${dots}${head}
  <div class="chipline" style="margin-bottom:12px">${jumps.map(([id,n])=>`<button type="button" class="chip" data-jump="${id}" data-va-ok>${esc(n)}</button>`).join('')}</div>
  ${T.big?`<div class="callout nbig"><b>Big idea:</b> ${esc(T.big)}</div>`:''}
  <div class="card lo" id="n-min"><h3>In one minute</h3>${listHTML(T.min)}<h3>What you need to be able to do</h3>${Array.isArray(T.lo)?listHTML(T.lo):`<p>${esc(T.lo)}</p>`}</div>
  <h2 id="n-ideas" style="margin-top:18px">Key ideas</h2><p class="muted">Read one card at a time. Look at each diagram and try to say it in your own words.</p>
  ${T.ideas.map(ideaHTML).join('')}
  ${T.apply?`<div class="card" id="n-apply" style="margin-top:18px"><h3>${esc(T.apply.h||'How to use this on a case')}</h3>${applyHTML}</div>`:''}
  <h2 id="n-terms" style="margin-top:18px">Key terms</h2><p class="muted">Tap a card to see the meaning. Say the meaning out loud before you tap.</p>
  ${termsHTML}
  ${T.mistakes?`<div class="card mis" id="n-mis" style="margin-top:18px"><h3>Common mistakes</h3>${listHTML(T.mistakes)}</div>`:''}
  ${W?`<div class="card" id="n-ans" style="margin-top:18px"><h3>Answer like this</h3>${ansHTML}</div>`:''}
  <h2 id="n-chk" style="margin-top:18px">Check yourself</h2><p class="muted">Answer in your head or on paper first. Then open the answer.</p>
  ${chkHTML}${pracHTML}
  ${T.prompts?`<div class="card" id="n-ai" style="margin-top:18px"><h3>Explore further with AI</h3><p class="muted">Copy a prompt, open Gemini, and paste it in. Read the reply with care. Check every idea against these notes and your textbook.</p>${aiHTML}</div>`:''}
  ${navHTML}`)}
 const el=$('main');$('#nst')&&($('#nst').onclick=()=>{if(award('notes:'+k,20,w+' studied'))countOnce('notes:'+k,'notes');notesPage(String(k));$('#n-prac').scrollIntoView({block:'center'})});
 const flip=(b,on)=>{b.setAttribute('aria-pressed',on);b.querySelector('span').textContent=on?T.terms[b.dataset.ti][1]:'Tap to reveal'};
 el.onclick=e=>{const j=e.target.closest('[data-jump]');if(j){const x=document.getElementById(j.dataset.jump);if(x){if(x.tagName==='DETAILS')x.open=true;x.scrollIntoView({behavior:'smooth'})}return}
  const tm=e.target.closest('[data-ti]');if(tm){flip(tm,tm.getAttribute('aria-pressed')!=='true');return}
  const ta=e.target.closest('[data-tall]');if(ta){document.querySelectorAll('[data-ti]').forEach(b=>flip(b,ta.dataset.tall==='1'));return}
  const b=e.target.closest('[data-copy]');if(!b||!T.prompts)return;const txt=T.prompts[+b.dataset.copy];
  const ok=()=>{b.textContent='Copied ✓';setTimeout(()=>{b.textContent='Copy prompt'},2000)};
  const old=()=>{const a=document.createElement('textarea');a.value=txt;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();
   try{document.execCommand('copy');ok()}catch(err){b.textContent='Select and copy the text'}a.remove()};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(txt).then(ok,old);else old()}}
/* #/notes/<key>/<section> opens that section (ideas, apply, terms, mis, ans, chk, ai, or i<n> for one idea) */
ROUTES.notes=h=>{NOTES_OPEN=h[2]||'';notesPage(h[1])};
/* "📖 Refer to notes" on a question card. Locked (WILD_LOCK, engine/wild.js) while a weekly challenge attempt is running. */
function notesHref(q,o){if(!notesOK()||typeof notesFor!=='function')return '';return notesFor(q,o||{})||''}
function notesBtn(q,o){const h=notesHref(q,o);return h?`<a class="btn ghost sm nref" href="${h}" data-va-ok title="Open the study notes for this question">📖 Refer to notes</a>`:''}
/* lecturer-only: points in the notes to check against the textbook (notesCfg().review: [[key, note]]) */
if(notesOK()){const R=(notesCfg().review||[]);if(R.length){LF_META.nrevc=['📝 Notes to check ('+R.length+')','Points in the study notes to check against the textbook'];
  lcard('nrevc',el=>{const C=notesCfg(),w=C.word||'Topic';el.hidden=false;el.dataset.lect='';
    el.innerHTML=`<h2 style="margin:0">📝 Notes to check (${R.length})</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Claude marked these points while writing the study notes. Check them against the textbook and your slides; ask Claude to change any that are wrong.</p>
    <ol class="sumlist nrev">${R.map(([k,n])=>`<li><a href="#/notes/${esc(String(k))}">${w} ${esc(String(k))}</a>: ${esc(n)}</li>`).join('')}</ol>`;if(typeof lfTrim==='function')lfTrim(el.querySelector('.nrev'),'nrev')})}}
