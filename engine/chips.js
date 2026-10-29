/* MKT Arena engine: the chip paragraph builder (question kind 'chips'), used in practice (#/chips) and in the weekly challenge (engine/wild.js).
   Data (bank-chips.js, global CHIPS): {id, kind:'chips', topic, q, chips:[{t, ok:1} | {t, w:'why it is wrong'}], paths:[[chip index, …]], partial:[[[index, …], points]], max}
   The student taps chips to build a paragraph in order; tapping a chip in the paragraph takes it out.
   Marking: a full correct path earns max; otherwise the longest correct start of a path earns its share (rounded down), or a listed
   partial path (its chips in that order, gaps allowed) earns its points, whichever is more; each decoy used costs a point (never below 0).
   Course hook: chipTopics() → [[key, label]] for the practice page. XP (practice): 2 per point, once per question per day (chip:<id>:<day>). */
const CHIPS_BY=(()=>{const o={};(typeof CHIPS!=='undefined'?CHIPS:[]).forEach(c=>o[c.id]=c);return o})();
function chipsScore(it,sel){sel=(sel||[]).filter(j=>it.chips[j]);const max=it.max||4,ok=j=>!!it.chips[j].ok,core=sel.filter(ok),dec=sel.filter(j=>!ok(j)).length;
  const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]),inOrder=(need,arr)=>{let i=0;for(const x of arr)if(x===need[i])i++;return i===need.length};
  let base=0,best=it.paths[0];
  for(const p of it.paths){if(eq(core,p)){base=max;best=p;break}let L=0;while(L<core.length&&L<p.length&&core[L]===p[L])L++;const v=Math.floor(max*L/p.length);if(v>base){base=v;best=p}}
  if(base<max)(it.partial||[]).forEach(([ids,pts])=>{if(inOrder(ids,core)&&pts>base)base=pts});
  return {s:Math.max(0,base-dec),max,base,dec,best}}
const chipPara=(it,ids)=>ids.map(j=>it.chips[j].t).join(' ');
/* one chips question in host. o: {seed, sel (start), fb (show feedback after Check), onChange(sel), onDone(sel, score), btn} */
function chipsUI(host,it,o){o=o||{};const sel=(o.sel||[]).slice(),ord=(()=>{const r=seeded(o.seed||it.id),a=it.chips.map((_,j)=>j);for(let i=a.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[a[i],a[k]]=[a[k],a[i]]}return a})();let done=false;
  const draw=()=>{const R=done?chipsScore(it,sel):null;
    host.innerHTML=`<h2 style="font-weight:600;margin:6px 0 4px">${esc(it.q)}</h2><p class="muted" style="font-size:.86rem;margin:0 0 8px">Tap the ideas in the order you would write them to build a paragraph. Some chips are decoys. Tap a chip in your paragraph to take it out.</p>
    <div class="cpara${sel.length?'':' empty'}" aria-live="polite">${sel.length?sel.map((j,k)=>`<button type="button" class="cpc${done?(it.chips[j].ok?' good':' bad'):''}" data-out="${k}" ${done?'disabled':''}>${esc(it.chips[j].t)}</button>`).join(' '):'<span class="muted">Your paragraph appears here.</span>'}</div>
    <div class="chips cpool">${ord.filter(j=>!sel.includes(j)).map(j=>`<button type="button" class="chip" data-in="${j}" ${done?'disabled':''}>${esc(it.chips[j].t)}</button>`).join('')}</div>
    ${done&&o.fb!==false?`<div class="fb ${R.s===R.max?'ok':'no'}" style="margin-top:10px"><b>${R.s}/${R.max} points</b>${R.dec?` · ${R.dec} decoy${R.dec===1?'':'s'} used (−${R.dec})`:''}
      <div style="margin-top:6px"><b>A strong paragraph:</b> ${esc(chipPara(it,R.best))}</div>
      ${it.chips.map((c,j)=>!c.ok&&(sel.includes(j)||o.fb==='all')?`<div style="margin-top:6px">✗ <i>${esc(c.t)}</i><br><span class="muted">Why not: ${esc(c.w||'')}</span></div>`:'').join('')}</div>`:''}
    <div class="row" style="margin-top:10px">${done?'':`<button type="button" class="btn" data-ck ${sel.length?'':'disabled'}>${esc(o.btn||'Check my paragraph')}</button>`}</div>`;
    host.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>{sel.push(+b.dataset.in);o.onChange&&o.onChange(sel.slice());draw()});
    host.querySelectorAll('[data-out]').forEach(b=>b.onclick=()=>{sel.splice(+b.dataset.out,1);o.onChange&&o.onChange(sel.slice());draw()});
    const ck=host.querySelector('[data-ck]');if(ck)ck.onclick=()=>{done=o.fb!==false;const R=chipsScore(it,sel);if(o.fb!==false)draw();o.onDone&&o.onDone(sel.slice(),R)}};
  draw();return {sel:()=>sel.slice()}}
/* practice: #/chips, #/chips/<topic> */
ROUTES.chips=h=>{const T=typeof chipTopics==='function'?chipTopics():[],k=h[1],L=ME&&ME.sid===LECTURER;
  if(!T.length||typeof CHIPS==='undefined')return shell('#/practice',`<h1>Build a paragraph</h1><p class="muted">No questions yet.</p>`);
  const list=k?CHIPS.filter(c=>String(c.topic)===String(k)):[];
  if(!k||!list.length){shell('#/practice',`<p><a href="#/practice">← Practice</a></p><h1>🧱 Build a paragraph</h1><p class="muted">Put the right ideas in the right order to build a strong paragraph, and leave out the decoys. Each question takes about two minutes.</p>
    <div class="ttiles">${T.filter(([x])=>CHIPS.some(c=>String(c.topic)===String(x))).map(([x,l])=>{const n=CHIPS.filter(c=>String(c.topic)===String(x)).length;return `<a class="card zone ttile" href="#/chips/${x}"><span class="em">🧱</span><span><b class="lex">${esc(l)}</b><small class="muted">${n} question${n===1?'':'s'}</small></span></a>`}).join('')}</div>`);return}
  U.chp=U.chp||{};const st=U.chp,pick=list.slice().sort((a,b)=>((st[a.id]||{}).d||'')<((st[b.id]||{}).d||'')?-1:1)[0];let i=list.indexOf(pick);
  const one=()=>{const it=list[i],lab=(T.find(([x])=>String(x)===String(k))||[0,''])[1];
    shell('#/practice',`<p><a href="#/chips">← All topics</a></p><div class="row" style="justify-content:space-between"><h1 style="margin:0;font-size:1.3rem">🧱 ${esc(lab)}</h1><span class="tag">${i+1} of ${list.length}</span></div>
    <div class="card qcard" id="chq" style="margin-top:12px"></div><div class="row" style="justify-content:space-between;margin-top:12px">${notesBtn(it,{topic:k})}<button class="btn ghost" id="chnx">Next →</button></div>`);
    chipsUI($('#chq'),it,{seed:ME.sid+'|'+it.id,onDone:(sel,R)=>{st[it.id]={d:today(),s:R.s};if(!L&&award('chip:'+it.id+':'+today(),R.s*2,'Paragraph built',!R.s))countOnce('chip:'+it.id+':'+today(),'chips');save()}});
    $('#chnx').onclick=()=>{i=(i+1)%list.length;one()}};one()};
