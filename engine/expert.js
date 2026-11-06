/* MKT Arena engine: Expert sets (#/expert, #/expert/<topic>, #/expert/<topic>/<m|c|e>).
   One set per topic, always visible to every student: locked until they master the topic's MCQs (80%+ on 15), then open,
   once the lecturer has approved that topic's set on the Lecturer tab (meta/expert = {t8:true,…}; "Coming soon" until then).
   Each set: harder case MCQs (+4 XP each, once a question a day, key xmcq:<id>:<day>), paragraph builders (up to +10, xchip:<id>:<day>)
   and one short essay that goes through the typed-answer path into the marking queue (marks give up to +30; xessay:<id> counts it once).
   Progress: U.exs[topic] = {m:{id:1|0 first try}, c:{id: best share 0–1}}; unlock toasts remembered in U.exu[topic].
   Course data: EXPERT (bank-expert.js) {sets:{<topic>:{mcq:[{id,t,q,o:[right,…],why}],chips:[chips items],essay:{written question}}},review:[…]}.
   Course hooks: expertTopics() → [[topic,label]], expertProg(u,t) → {att,acc,ok}, expertEssayUI(host,q,done). Switched on by CRS.expert. */
const EX_ON=()=>!!(typeof CRS!=='undefined'&&CRS.expert&&typeof EXPERT!=='undefined'&&EXPERT.sets);
const EX_NEED=15,EX_XP={m:4,c:10,e:30};
let EXA=null;/* the lecturer's approvals, cached on this device */
function exA(){if(EXA)return EXA;EXA=LS.get('exa',{})||{};return EXA}
async function exLoadA(){if(!EX_ON()||!cloudOn())return exA();try{const d=await CLOUD.get('meta/expert');EXA=Object.assign({},d||{});delete EXA.id;LS.set('exa',EXA)}catch(e){exA()}return EXA}
const exOK=t=>!!exA()['t'+t];
const exSet=t=>EX_ON()&&EXPERT.sets[t]||null;
const exTops=()=>EX_ON()?(typeof expertTopics==='function'?expertTopics():Object.keys(EXPERT.sets).map(t=>[+t,'Topic '+t])).filter(([t])=>EXPERT.sets[t]):[];
const exLabel=t=>(exTops().find(([x])=>String(x)===String(t))||[t,'Topic '+t])[1];
function exProg(u,t){const p=typeof expertProg==='function'?expertProg(u,t):{att:0,acc:0,ok:false};return {att:p.att|0,acc:p.acc|0,ok:!!p.ok}}
function exMax(S){return S.mcq.length*EX_XP.m+S.chips.length*EX_XP.c+(S.essay?EX_XP.e:0)}
/* where a student is in a set */
function exStat(u,t){const S=exSet(t),x=((u&&u.exs)||{})[t]||{},m=x.m||{},c=x.c||{};
  const mA=S.mcq.filter(q=>q.id in m).length,mR=S.mcq.filter(q=>m[q.id]===1).length,cA=S.chips.filter(q=>q.id in c).length,cS=S.chips.reduce((a,q)=>a+(+c[q.id]||0),0),
    e=!!(S.essay&&((u&&u.fin)||{})[S.essay.id]),total=S.mcq.length+S.chips.length+(S.essay?1:0),n=mA+cA+(e?1:0),base=S.mcq.length+S.chips.length;
  return {mA,mR,cA,cS,e,n,total,done:n===total,pct:base?Math.round((mR+cS)/base*100):0}}
/* badges: "Expert: Topic N" for finishing a set at 70%+, "Grand Expert" for all of them */
const exBadge=(u,t)=>{if(!exSet(t))return false;const s=exStat(u,t);return s.done&&s.pct>=70};
function exBadges(){return exTops().map(([t])=>({id:'ex'+t,ico:'🎓',name:'Expert: Topic '+t,d:'Finish the Topic '+t+' Expert set with 70% or more',t:u=>exBadge(u,t)}))
  .concat(exTops().length?[{id:'exall',ico:'🏛️',name:'Grand Expert',d:'Finish every Expert set with 70% or more',t:u=>exTops().every(([t])=>exBadge(u,t))}]:[])}

/* ---------- the card every student sees ---------- */
function exCardHTML(t,o){o=o||{};const S=exSet(t);if(!S)return '';const L=ME&&ME.sid===LECTURER,u=U||{},p=exProg(u,t),ok=exOK(t),st=exStat(u,t);
  const state=L?'preview':!ok?'soon':!p.ok?'locked':st.done?'done':'open';
  const inside=`${S.mcq.length} tougher case MCQs · ${S.chips.length} paragraph builders${S.essay?' · 1 short essay':''} · up to <b>+${exMax(S)} XP</b>`;
  const bar=Math.min(100,Math.round(Math.min(p.att,EX_NEED)/EX_NEED*100));
  const lock=`<p class="exlock">🔒 Unlocks when you master Topic ${esc(t)}: 80%+ on ${EX_NEED} MCQs.</p>
    <div class="bar"><i style="width:${bar}%;background:${p.att>=EX_NEED&&p.acc>=80?'var(--green)':'var(--gold)'}"></i></div>
    <p class="muted exprog">Your progress: ${Math.min(p.att,EX_NEED)} / ${EX_NEED} answered · ${p.att?p.acc+'% correct':'not started'}${p.att>=EX_NEED&&p.acc<80?' · reach 80% to unlock':''}</p>`;
  const tag={locked:'<span class="tag">🔒 Locked</span>',soon:'<span class="tag">Coming soon</span>',open:'<span class="tag good">✅ Unlocked</span>',done:'<span class="tag good">🏅 Finished · '+st.pct+'%</span>',preview:'<span class="tag" data-lect>'+(ok?'Approved':'Not approved yet')+'</span>'}[state];
  const act=state==='open'||state==='done'||state==='preview'?`<a class="btn${o.sm?' sm':''}" href="#/expert/${esc(t)}">${state==='preview'?'Preview':st.n?'Continue':'Start'} →</a>${state!=='preview'?` <span class="muted" style="font-size:.85rem">${st.n}/${st.total} done</span>`:''}`
    :state==='soon'&&p.ok?`<p class="muted" style="font-size:.85rem;margin:6px 0 0">You've unlocked it. Your lecturer is preparing this set; it opens here soon.</p>`:'';
  return `<div class="card exc ex-${state}" data-ex="${esc(t)}" data-st="${state}"><div class="row" style="justify-content:space-between"><h3 style="margin:0">🎓 Expert set · ${esc(exLabel(t))}</h3>${tag}</div>
    <p class="muted" style="font-size:.86rem;margin:6px 0">${inside}</p>${state==='locked'||state==='soon'&&!p.ok?lock:''}${act}</div>`}
/* the practice page and a topic's notes page */
function exPracticeHTML(){if(!EX_ON())return '';return `<h2 style="margin-top:22px">🎓 Expert sets</h2><p class="muted" style="margin-top:-4px;font-size:.9rem">Harder case questions, paragraph builders and a short essay for each topic. Master a topic's MCQs to unlock its set.</p>
  <div class="grid g2 exgrid">${exTops().map(([t])=>exCardHTML(t,{sm:1})).join('')}</div><p style="margin:8px 0 0"><a href="#/expert">All Expert sets →</a></p>`}
const exNoteHTML=t=>EX_ON()&&exSet(t)?`<div style="margin-top:18px">${exCardHTML(t)}</div>`:'';

/* ---------- unlock celebration: once per topic ---------- */
function exUnlockCheck(){if(!EX_ON()||!U||!ME||ME.sid===LECTURER||VIEWAS)return;U.exu=U.exu||{};let ch=false;
  exTops().forEach(([t])=>{if(!U.exu[t]&&exProg(U,t).ok){U.exu[t]=today();ch=true;toast('🎓','Expert set unlocked: Topic '+t,exOK(t)?'Open it from Practice → Expert sets':'It opens as soon as your lecturer releases it')}});if(ch)save()}
onHook('leave',()=>{try{exUnlockCheck()}catch(e){}});
onHook('cloud',()=>{if(EX_ON())exLoadA()});

/* ---------- pages ---------- */
ROUTES.expert=h=>{if(!EX_ON())return shell('#/practice','<h1>Expert sets</h1><p class="muted">No Expert sets for this course yet.</p>');
  const t=h[1],L=ME.sid===LECTURER;
  if(!t||!exSet(t)){shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🎓 Expert sets</h1><p class="muted">For students who have mastered a topic: harder case questions, paragraph builders with more decoys, and a short essay that your lecturer marks. Master a topic's MCQs (80%+ on ${EX_NEED}) to unlock its set.</p>
    ${L?'<p class="muted" data-lect>You see every set as a preview. Approve sets for students on the Lecturer tab (🎓 Expert sets to approve).</p>':''}<div class="grid g2 exgrid">${exTops().map(([x])=>exCardHTML(x)).join('')}</div>`);exLoadA().then(()=>{if(location.hash==='#/expert')ROUTES.expert(['expert'])});return}
  const p=exProg(U,t);
  if(!L&&(!p.ok||!exOK(t))){shell('#/practice',`<p><a href="#/expert">← All Expert sets</a></p>${exCardHTML(t)}`);return}
  const S=exSet(t),st=exStat(U,t),part=h[2];
  if(part==='m')return exMcq(t,S);if(part==='c')return exChips(t,S);if(part==='e'&&S.essay)return exEssay(t,S);
  const row=(k,ico,name,line,n,of)=>`<a class="card zone ttile" href="#/expert/${esc(t)}/${k}"><span class="em">${ico}</span><span><b class="lex">${name}</b><small class="muted">${line} · ${n}/${of} done</small></span></a>`;
  shell('#/practice',`<p><a href="#/expert">← All Expert sets</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0;font-size:1.35rem">🎓 ${esc(exLabel(t))}</h1>${st.done?`<span class="tag good">🏅 ${st.pct}%</span>`:`<span class="tag">${st.n}/${st.total} done</span>`}</div>
    ${L?'<p class="muted" data-lect>Preview: nothing you do here earns XP.</p>':''}<p class="muted">Work through all three parts. Finish the set with 70% or more for the <b>Expert: Topic ${esc(t)}</b> badge.</p>
    <div class="ttiles">${row('m','🎯','Case MCQs','+'+EX_XP.m+' XP each',st.mA,S.mcq.length)}${row('c','🧱','Paragraph builders','up to +'+EX_XP.c+' XP each',st.cA,S.chips.length)}${S.essay?row('e','✍️','Short essay','marked by your lecturer, up to +'+EX_XP.e+' XP',st.e?1:0,1):''}</div>
    <p style="margin-top:12px">${typeof notesHref==='function'&&notesHref({t,week:t},{})?`<a class="btn ghost sm" href="${notesHref({t,week:t},{})}">📖 Refer to notes</a>`:''}</p>`)};
function exRec(t){U.exs=U.exs||{};return U.exs[t]=U.exs[t]||{m:{},c:{}}}
/* case MCQs: one at a time; the first try counts for the set's score */
function exMcq(t,S){const L=ME.sid===LECTURER,R=exRec(t);let i=Math.max(0,S.mcq.findIndex(q=>!(q.id in R.m)));
  const one=()=>{const q=S.mcq[i],ord=(()=>{const r=seeded((ME.sid||'')+'|'+q.id),a=q.o.map((_,j)=>j);for(let k=a.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a})();
    shell('#/practice',`<p><a href="#/expert/${esc(t)}">← ${esc(exLabel(t))}</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0;font-size:1.2rem">🎯 Case MCQs</h1><span class="tag">${i+1} of ${S.mcq.length}</span></div>
    <div class="card qcard" id="exq" style="margin-top:12px"><h2 style="font-weight:600">${esc(q.q)}</h2><div class="mopts">${ord.map(j=>`<button type="button" class="mopt" data-o="${j}">${esc(q.o[j])}</button>`).join('')}</div><div id="exfb"></div></div>
    <div class="row" style="justify-content:space-between;margin-top:12px">${typeof notesBtn==='function'?notesBtn({t,week:t},{topic:t}):''}<button class="btn ghost" id="exnx">${i===S.mcq.length-1?'Finish':'Next →'}</button></div>`);
    $('#exq').querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const pick=+b.dataset.o,ok=pick===0;
      $('#exq').querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;const j=+x.dataset.o;if(j===0)x.classList.add('ok');else if(j===pick)x.classList.add('bad')});
      if(!L&&!(q.id in R.m))R.m[q.id]=ok?1:0;ansLog(q.id,ok?1:0,pick);
      if(ok&&award('xmcq:'+q.id+':'+today(),EX_XP.m,'Expert MCQ',1))countOnce('xmcq:'+q.id+':'+today(),'xmcq');
      $('#exfb').innerHTML=`<div class="fb ${ok?'ok':'no'}" style="margin-top:10px"><b>${ok?'✓ Correct.':'✗ Not quite. The answer is: '+esc(q.o[0])}</b><div style="margin-top:4px">${esc(q.why||'')}</div></div>`;checkBadges();save();hud()});
    $('#exnx').onclick=()=>{if(i<S.mcq.length-1){i++;one()}else location.hash='#/expert/'+t}};one()}
/* paragraph builders: the best score counts for the set */
function exChips(t,S){const L=ME.sid===LECTURER,R=exRec(t);let i=Math.max(0,S.chips.findIndex(q=>!(q.id in R.c)));
  const one=()=>{const it=S.chips[i];
    shell('#/practice',`<p><a href="#/expert/${esc(t)}">← ${esc(exLabel(t))}</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0;font-size:1.2rem">🧱 Paragraph builders</h1><span class="tag">${i+1} of ${S.chips.length}</span></div>
    <div class="card qcard" id="exc" style="margin-top:12px"></div><div class="row" style="justify-content:space-between;margin-top:12px">${typeof notesBtn==='function'?notesBtn({t,week:t},{topic:t}):''}<button class="btn ghost" id="exnx">${i===S.chips.length-1?'Finish':'Next →'}</button></div>`);
    chipsUI($('#exc'),it,{seed:(ME.sid||'')+'|'+it.id,onDone:(sel,r)=>{const sh=r.max?r.s/r.max:0;if(!L)R.c[it.id]=Math.max(+R.c[it.id]||0,sh);ansLog(it.id,sh,sel.length);
      const xp=Math.round(EX_XP.c*sh);if(xp&&award('xchip:'+it.id+':'+today(),xp,'Expert paragraph',1))countOnce('xchip:'+it.id+':'+today(),'xchip');checkBadges();save();hud()}});
    $('#exnx').onclick=()=>{if(i<S.chips.length-1){i++;one()}else location.hash='#/expert/'+t}};one()}
/* the short essay: the course's written-answer card (plan, then type or speak); finished answers join the marking queue */
function exEssay(t,S){const q=S.essay;
  shell('#/practice',`<p><a href="#/expert/${esc(t)}">← ${esc(exLabel(t))}</a></p><h1 style="margin:0 0 6px;font-size:1.2rem">✍️ Short essay</h1>
    <p class="muted" style="font-size:.88rem">Plan with the chips, then type or speak about 150 words. Your lecturer marks Expert essays and adds feedback (up to +${EX_XP.e} XP).</p><div id="exe"></div>`);
  const done=()=>{if((U.fin||{})[q.id])countOnce('xessay:'+q.id,'xessay');checkBadges();save();location.hash='#/expert/'+t};
  if(typeof expertEssayUI==='function')expertEssayUI($('#exe'),q,done)}

/* ---------- tutorial sessions: a student who has mastered the session's topic can take its Expert set instead ---------- */
function exTutHTML(tops){if(!EX_ON()||!U)return '';const ts=(tops||[]).filter(t=>exSet(t)&&exOK(t)&&exProg(U,t).ok);
  return ts.length?`<div class="card exoffer" style="margin-top:14px"><h3 style="margin:0 0 6px">🎓 You've mastered ${ts.map(t=>'Topic '+esc(t)).join(' and ')}</h3><p class="muted" style="margin:0 0 8px;font-size:.9rem">Want a harder challenge? Try the Expert set instead.</p><div class="row">${ts.map(t=>`<a class="btn gold" href="#/expert/${esc(t)}">🎓 Try the Expert set: Topic ${esc(t)}</a>`).join('')}</div></div>`:''}
const exTutAllowed=(h,tops)=>h[0]==='expert'&&(!h[1]||(tops||[]).map(String).includes(String(h[1])))&&(!h[1]||exOK(h[1])&&exProg(U,h[1]).ok);

/* ---------- lecturer: approve each topic's set (meta/expert) ---------- */
if(typeof LF_META!=='undefined')LF_META.expac=['🎓 Expert sets to approve','Release harder sets topic by topic',()=>EX_ON()];
if(typeof lcard==='function')lcard('expac',el=>{if(!EX_ON())return;el.hidden=false;
  const draw=()=>{const A=exA();el.innerHTML=`<h2 style="margin:0">🎓 Expert sets to approve</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Students see every set, locked until they master the topic. A set opens for them only after you approve it here. Preview the questions first; edit wording in the Question editor if needed.</p>
    ${exTops().map(([t])=>{const S=exSet(t),on=!!A['t'+t];return `<details class="exap" data-t="${esc(t)}"><summary><b>${esc(exLabel(t))}</b> · ${S.mcq.length+S.chips.length+(S.essay?1:0)} items · <span class="tag${on?' good':''}">${on?'Approved':'Hidden'}</span></summary>
      <ol style="font-size:.86rem">${S.mcq.map(q=>`<li><b>${esc(q.id)}</b> ${esc(q.q)}<br><span class="muted">✓ ${esc(q.o[0])} · ${esc(q.why||'')}</span></li>`).join('')}${S.chips.map(c=>`<li><b>${esc(c.id)}</b> 🧱 ${esc(c.q)}</li>`).join('')}${S.essay?`<li><b>${esc(S.essay.id)}</b> ✍️ ${esc(S.essay.q)}</li>`:''}</ol>
      <div class="row"><button class="btn${on?' ghost':''} sm" data-exap="${esc(t)}">${on?'Hide from students':'✓ Approve for students'}</button></div></details>`}).join('')}
    ${(EXPERT.review||[]).length?`<details style="margin-top:10px"><summary>Invented scenarios to check (${EXPERT.review.length})</summary><ul style="font-size:.85rem">${EXPERT.review.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></details>`:''}
    <p class="err" id="exaperr"></p>`;
    el.querySelectorAll('[data-exap]').forEach(b=>b.onclick=async()=>{const k='t'+b.dataset.exap,A2=Object.assign({},exA());A2[k]=!A2[k];b.disabled=true;
      try{await CLOUD.put('meta/expert',A2);EXA=A2;LS.set('exa',EXA);toast('🎓',A2[k]?'Expert set approved':'Expert set hidden',exLabel(b.dataset.exap));draw()}catch(e){$('#exaperr').textContent=CLOUD.say(e);b.disabled=false}})};
  el.innerHTML='<p class="muted">Loading…</p>';exLoadA().then(draw)});
/* the Expert badges join the course's badge list */
if(typeof BADGES!=='undefined'&&EX_ON())BADGES.push(...exBadges());
