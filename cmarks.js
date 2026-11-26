/* MKT301 Arena: course marks card (course code, adapted from the MKT101 card). Shown under the profile block on Home for a student who has marks.
   MKT301 has a group report and a group presentation (coursework), then the final exam. Weights and raw maxima: CMC below.
   Data: the student's own private record reviews/{SID}.m['cm_<term>'] (tools/build-marks.py → tools/marks/upload.mjs). Only that
   student and the lecturer can read it, so nothing is in the public repo and no PIN is needed. engine/core.js applyMarks hands
   cm_ keys to cmSet(); View as student passes the student's record in U._cm (never saved).
   The lecturer's decision: this card may name the final exam (an exception to the no-exam-wording rule).
   Record: {n, g, mk (market), rp, pr (weighted), rpRaw, prRaw, tot (coursework /40), pass (min final for PP), cr, dn, hd (min final
            for each grade, /100, or "NR"), ex 1 = exempt from coursework (exam only), nog 1 = no group submission} */
/* T2 2026 (lecturer's marks sheet): report /100 worth 25%, presentation /50 worth 15%, final exam /100 worth 60% (hurdle 49.445%).
   [record key, label, weight %, raw maximum] */
const CMC={parts:[['rp','Group report',25,100],['pr','Group presentation',15,50]],fin:60,passLine:50,hdLine:85};
const CMW=CMC.parts.reduce((t,p)=>t+p[2],0);
let CM=null;
const cmLS=()=>'mkt301_cm_'+(ME&&ME.sid||'');
function cmSet(key,v){if(!v||typeof v!=='object'||typeof ME==='undefined'||!ME)return;CM=v;try{localStorage.setItem(cmLS(),JSON.stringify(v))}catch(e){}
  const el=document.getElementById('cmcard');if(el)el.outerHTML=cmHTML(v);else if(!location.hash.replace(/^#\/?/,'')&&typeof route==='function')route()}
function cmRec(){if(typeof ME==='undefined'||!ME||ME.sid===LECTURER&&!VIEWAS||ME.sid==='S000000')return null;if(VIEWAS)return U&&U._cm||null;
  if(!CM){try{CM=JSON.parse(localStorage.getItem(cmLS())||'null')}catch(e){}}return CM}
function homeTopHTML(){const r=cmRec();return r?cmHTML(r):''}
/* the highest grade still in reach (the grade mapping's final-minimum %): gold HD, silver DN, bronze CR. The final mark needed
   is (cut-off − total so far) ÷ final weight × 100, and never below the pass target (the other pass rules still apply). */
const CM_TIERS=[['HD',84.445,'g','🏆','For an HD','🎉','★★★','85'],['DN',74.445,'s','🥈','For a Distinction','','★★','75'],['CR',64.445,'b','🥉','For a Credit','','★','65']];
function cmTierHTML(r,tot){const fin=CMC.fin,own={HD:r.hd,DN:r.dn,CR:r.cr};
  for(const [g,cut,cls,ico,lbl,extra,st,pct] of CM_TIERS){const v=own[g],need=typeof v==='number'?v:v==='NR'?101:Math.max(r.pass||0,(cut-tot)/fin*100);
    if(need<=100)return `<div class="cmg h t${cls}"><small>${ico} ${lbl}${extra?' '+extra:''}<span class="stars" aria-hidden="true">${st}</span></small><div><b>${cmR(typeof v==='number'?v:Math.ceil(need*100)/100)}<span> / 100</span></b></div><p>on the final exam (${pct}% overall)</p></div>`}
  return `<div class="cmg h tn"><small>🌱 You've got this 💪</small><div><b>Every mark counts</b></div><p>Each mark on the final lifts your grade. Aim high!</p></div>`}
const cmF=x=>x==null?'–':Number(x).toFixed(2);
const cmR=x=>x==null?'–':String(Math.round(x*100)/100);/* the sheet's own figures, up to 2 decimals (49.45, not 49.5) */
function cmCss(){if(document.getElementById('cmcss'))return;const st=document.createElement('style');st.id='cmcss';st.textContent=
 '#cmcard{margin-bottom:16px;padding:12px 14px}.cmtop{display:flex;align-items:center;gap:8px;width:100%;margin:0 0 4px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}.cmtop small{margin-left:auto}'+
 '.cmarr{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--sunk);font-size:.9rem;transition:transform .2s}#cmcard.open .cmarr{transform:rotate(180deg)}'+
 '.cmhint{margin:6px 0 0;font-size:.74rem;color:var(--blue);font-weight:600;text-align:center;cursor:pointer}#cmcard .cmbar{cursor:pointer}#cmmore{margin-top:8px}'+
 '@media (prefers-reduced-motion:reduce){.cmarr{transition:none}}'+
 '.cmtop b{font:700 1rem Lexend,sans-serif}.cmtop small{color:var(--muted);font-size:.78rem}'+
 '.cm3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.cmm{border:1px solid var(--line);border-radius:10px;padding:7px 8px;min-width:0}'+
 '.cmm small{color:var(--muted);font-size:.72rem}.cmm b{display:block;font:700 1.05rem Lexend,sans-serif;margin:1px 0 4px;white-space:nowrap}.cmm b span{font-size:.68rem;font-weight:500;color:var(--muted)}'+
 '.cmm .bar{height:5px;border-radius:9px;background:var(--sunk);overflow:hidden}.cmm .bar i{display:block;height:100%;border-radius:9px}.cmm .raw{font-size:.7rem;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmm.abs b{color:var(--gold);font-size:.9rem}'+
 '.cmt{margin-top:10px}.cmt .row{justify-content:space-between;align-items:baseline}.cmt .row>b{font-size:.92rem}.cmt b.big{font:800 1.2rem Lexend,sans-serif}'+
 '.cmbar{position:relative;height:14px;border-radius:5px;background:repeating-linear-gradient(135deg,var(--sunk) 0 6px,var(--line) 6px 9px);border:1px solid var(--line);margin:20px 0 4px}'+
 '.cmbar>i{position:absolute;left:0;top:0;bottom:0;border-radius:4px 0 0 4px}.cmbar .gap{position:absolute;top:0;bottom:0;left:0;width:50%;background:var(--card);border-radius:4px 0 0 4px}'+
 '.cmk{position:absolute;top:-3px;bottom:-3px;border-left:2px dashed}.cmk span{position:absolute;top:-17px;transform:translateX(-50%);font-size:.7rem;font-weight:700;white-space:nowrap}'+
 '.cmk.p{border-color:#16a34a;color:#16a34a}.cmk.h{border-color:#d97706;color:#b45309}.cmlbl{display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted)}'+
 '.cm2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.cmg{border-radius:10px;padding:7px 9px;line-height:1.25}.cmg small{font-size:.74rem;font-weight:700}.cmg b{font:800 1.2rem Lexend,sans-serif}.cmg b span{font-size:.72rem;font-weight:500}.cmg p{margin:1px 0 0;font-size:.7rem}'+
 '.cmg.p{background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.35);color:#15803d}.cmg.h{background:linear-gradient(135deg,rgba(250,204,21,.22),rgba(217,119,6,.14));border:1px solid rgba(217,119,6,.55);color:#a16207}.cmg.h.nr b{font-size:.86rem;font-weight:700}'+
 '.cmg .stars{color:#f59e0b;text-shadow:0 0 6px rgba(250,204,21,.6);font-size:.7rem;letter-spacing:1px;margin-left:2px}.gflag{color:#16a34a}'+
 ':root[data-theme="dark"] .cmg.p,:root[data-theme="dark"] .gflag{color:#4ade80}:root[data-theme="dark"] .cmg.h{color:#fcd34d}:root[data-theme="dark"] .cmk.p{color:#4ade80;border-color:#4ade80}:root[data-theme="dark"] .cmk.h{color:#fcd34d;border-color:#fcd34d}'+
 '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cmg.p,:root:not([data-theme="light"]) .gflag{color:#4ade80}:root:not([data-theme="light"]) .cmg.h{color:#fcd34d}:root:not([data-theme="light"]) .cmk.p{color:#4ade80;border-color:#4ade80}:root:not([data-theme="light"]) .cmk.h{color:#fcd34d;border-color:#fcd34d}}'+
 '.cmg.h.ts{background:linear-gradient(135deg,rgba(203,213,225,.45),rgba(148,163,184,.22));border-color:rgba(100,116,139,.6);color:#475569}.cmg.h.ts .stars{color:#94a3b8;text-shadow:0 0 6px rgba(203,213,225,.8)}'+
 '.cmg.h.tb{background:linear-gradient(135deg,rgba(217,151,98,.3),rgba(180,98,40,.16));border-color:rgba(180,98,40,.6);color:#9a4f1c}.cmg.h.tb .stars{color:#c2773a;text-shadow:0 0 6px rgba(217,151,98,.6)}'+
 '.cmg.h.tn{background:linear-gradient(135deg,rgba(56,189,248,.16),rgba(34,197,94,.12));border-color:rgba(14,165,233,.45);color:inherit}.cmg.h.tn b{font-size:.92rem}'+
 ':root[data-theme="dark"] .cmg.h.tn{color:var(--ink)}:root[data-theme="dark"] .cmg.h.ts{color:#e2e8f0}:root[data-theme="dark"] .cmg.h.tb{color:#f0b27a}'+
 '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cmg.h.tn{color:var(--ink)}:root:not([data-theme="light"]) .cmg.h.ts{color:#e2e8f0}:root:not([data-theme="light"]) .cmg.h.tb{color:#f0b27a}}'+
 '.cmex{border-radius:10px;padding:9px 11px;background:var(--sunk);font-size:.88rem;line-height:1.4}'+
 '.cmfoot{font-size:.68rem;color:var(--muted);margin:6px 0 0}';document.head.appendChild(st)}
function cmHTML(r){cmCss();const col=f=>`hsl(${Math.round(48+Math.max(0,Math.min(1,f))*82)},70%,45%)`;
  const mini=(t,v,mx,raw,rawMx,ok,why)=>ok?`<div class="cmm"><small>${t}</small><b>${cmF(v)}<span> /${mx}%</span></b><div class="bar"><i style="width:${Math.max(0,Math.min(100,v/mx*100))}%;background:${col(v/mx)}"></i></div><div class="raw">Raw ${cmR(raw)}/${rawMx}</div></div>`
    :`<div class="cmm abs"><small>${t}</small><b>${why[0]}</b><div class="raw" title="${why[1]}">${why[1]}</div></div>`;
  const tot=r.tot||0,hd=r.hd==='NR'||r.hd==null?null:r.hd;
  const open=cmOpen();
  return `<div class="card${open?' open':''}" id="cmcard" role="region" aria-label="My marks"><button type="button" class="cmtop" id="cmtg" aria-expanded="${open}" aria-controls="cmmore"><b>📊 My marks</b><small>${r.g?'Group '+esc(String(r.g))+(r.mk?' · '+esc(r.mk):'')+' · ':''}${esc(r.term||'T2 2026')}</small><span class="cmarr" aria-hidden="true">▾</span></button>
    ${r.ex?`<div class="cmt"><div class="cmex">📝 <b>Exempt from coursework.</b> Your grade comes from the final exam only.</div></div>`:`<div class="cmt"><div class="row"><b>Subject total so far</b><span><b class="big">${cmF(tot)}</b> <span class="muted">/ 100%</span></span></div>
   <div class="cmbar" role="img" aria-label="Earned ${cmF(tot)} of the ${CMW}% so far; the final exam is the other ${CMC.fin}%. Pass line ${CMC.passLine}, HD line ${CMC.hdLine}."><span class="gap" style="width:${CMW}%"></span><i style="width:${Math.max(0,Math.min(CMW,tot))}%;background:${col(tot/CMW)}"></i>
    <span class="cmk p" style="left:${CMC.passLine}%"><span>Pass ${CMC.passLine}</span></span><span class="cmk h" style="left:${CMC.hdLine}%"><span>HD ${CMC.hdLine}</span></span></div>
   <div class="cmlbl"><span>Earned so far (of ${CMW}%)</span><span>Final exam to come (${CMC.fin}%)</span></div></div>`}
  <p class="cmhint" id="cmhint"${open?' hidden':''}>Tap for your marks and what you need on the final ▾</p>
  <div id="cmmore"${open?'':' hidden'}>${r.ex?'':`<div class="cm3" style="grid-template-columns:repeat(${CMC.parts.length},minmax(0,1fr))">${CMC.parts.map(([k,t,w,mx])=>mini(t,r[k],w,r[k+'Raw']!=null?r[k+'Raw']:(r[k]!=null?r[k]/w*mx:null),mx,!r.nog,['0','No group submission'])).join('')}</div>`}
  <div class="cm2"><div class="cmg p"><small>🎯 To pass <span class="gflag" aria-hidden="true">⚑</span> 😊</small><div><b>${cmR(r.pass)}<span> / 100</span></b></div><p>on the final exam${r.pass!=null&&r.pass<50?'':''}</p></div>
   ${cmTierHTML(r,tot)}</div>
  <p class="cmfoot">ⓘ Provisional until confirmed by the Business School.</p></div></div>`}
/* collapsed by default; the choice is remembered on this device */
const cmOpen=()=>{try{return localStorage.getItem('mkt301_cm_open')==='1'}catch(e){return false}};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#cmtg,#cmhint,#cmcard .cmbar');if(!b)return;const c=document.getElementById('cmcard');if(!c)return;
  const open=!c.classList.contains('open');c.classList.toggle('open',open);const t=document.getElementById('cmtg');if(t)t.setAttribute('aria-expanded',open);
  const m=document.getElementById('cmmore');if(m)m.hidden=!open;const h=document.getElementById('cmhint');if(h)h.hidden=open;try{localStorage.setItem('mkt301_cm_open',open?'1':'0')}catch(err){}});
onHook('signout',()=>{CM=null});
