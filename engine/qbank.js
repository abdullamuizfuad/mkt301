/* MKT Arena engine: the question bank overlay and the lecturer's question editor.
   qbank/{id} = {kind, data (JSON text), st draft|live|hidden, by lecturer|claude, t, note}. Live entries change or add practice questions for
   everyone; hidden ones take a question out; drafts (for example from Claude, tools/qgen) wait for the lecturer. The data files stay as they are.
   Course hooks (course.js): qbankKinds() → {kind: {label, template, check(data) → error text or '', find(id) → data or null}},
   qbankApply(list) → applies [{id, kind, data, st}] to the course banks (called once after sign-in, before the page is drawn again). */
let QB_DONE=false;
async function qbankLoad(){if(QB_DONE||!ME||typeof qbankApply!=='function'||!(await rulesOK()))return;QB_DONE=true;
  try{const d=await CLOUD.docs('qbank',ME.sid===LECTURER?{}:{where:[['st','in',['live','hidden']]]});const L=[];
    d.forEach(x=>{if(x.st!=='live'&&x.st!=='hidden')return;try{L.push({id:x.id,kind:x.kind,st:x.st,data:JSON.parse(x.data)})}catch(e){}});
    if(!L.length)return;qbankApply(L);QIDX=null;hook('qbank');route()}catch(e){console.warn('Question updates not loaded',e)}}
onHook('cloud',qbankLoad);onHook('signout',()=>{QB_DONE=false});

lcard('qbc',el=>{if(typeof qbankKinds!=='function')return;rulesOK().then(ok=>{if(!ok)return;el.hidden=false;const K=qbankKinds();let tab='draft',rows=[];
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Question editor</h2><span class="tag" id="qbn"></span></div>
  <p class="muted" style="font-size:.88rem;margin:6px 0 8px">Change or add practice questions without touching the data files. <b>Live</b> changes reach students at their next sign-in; <b>Hidden</b> takes a question out; <b>Drafts</b> (yours, or Claude's from tools/qgen) wait for you.</p>
  <div class="row" role="tablist">${['draft','live','hidden'].map(t=>`<button class="btn ghost sm" data-qt="${t}" role="tab">${{draft:'Drafts',live:'Live',hidden:'Hidden'}[t]}</button>`).join('')}</div>
  <div id="qbl" style="margin-top:8px"></div>
  <details style="margin-top:12px"><summary class="click"><b>Edit or add a question</b></summary>
   <div class="row" style="margin-top:8px"><select id="qbk" aria-label="Kind">${Object.entries(K).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select>
   <input id="qbid" placeholder="Question ID (e.g. b10), or blank for new" aria-label="Question ID" style="flex:1;min-width:160px"><button class="btn ghost sm" id="qbload">Load</button></div>
   <textarea id="qbj" rows="14" spellcheck="false" aria-label="Question data (JSON)" style="width:100%;margin-top:8px;font:13px/1.45 ui-monospace,Menlo,monospace"></textarea>
   <input id="qbnote" placeholder="Note (optional, e.g. why it changed)" aria-label="Note" style="width:100%;margin-top:6px">
   <p class="err" id="qberr" style="margin:6px 0"></p>
   <div class="row"><button class="btn ghost" data-qs="draft">Save as draft</button><button class="btn" data-qs="live">Publish</button><button class="btn ghost" data-qs="hidden">Hide this question</button></div></details>`;
  const draw=()=>{el.querySelectorAll('[data-qt]').forEach(b=>b.classList.toggle('on',b.dataset.qt===tab));const R=rows.filter(r=>r.st===tab);$('#qbn').textContent=rows.filter(r=>r.st==='draft').length+' draft(s)';
    $('#qbl').innerHTML=R.length?`<div class="tablewrap"><table><tr><th>ID</th><th>Question</th><th>By</th><th></th></tr>${R.map(r=>{let q='';try{q=JSON.parse(r.data).q||''}catch(e){}
      return `<tr><td><b>${esc(r.id)}</b><br><span class="muted">${esc((K[r.kind]||{}).label||r.kind)}</span></td><td style="max-width:460px">${esc(String(q).slice(0,220))}${r.note?`<div class="muted" style="font-size:.8rem">${esc(r.note)}</div>`:''}</td><td>${esc(r.by||'')}</td>
      <td><button class="btn ghost sm" data-qe="${esc(r.id)}">Edit</button>${r.st!=='live'?` <button class="btn sm" data-qp="${esc(r.id)}">Publish</button>`:''}${r.st==='draft'?` <button class="btn ghost sm" data-qd="${esc(r.id)}">Delete</button>`:''}</td></tr>`}).join('')}</table></div>`:'<p class="muted" style="margin:0">None.</p>';
    el.querySelectorAll('[data-qe]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.qe);$('#qbk').value=r.kind;$('#qbid').value=r.id;$('#qbj').value=JSON.stringify(JSON.parse(r.data),null,1);$('#qbnote').value=r.note||'';el.querySelector('details').open=true;$('#qbj').focus()});
    el.querySelectorAll('[data-qp]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.id===b.dataset.qp);let e='';try{e=K[r.kind].check(JSON.parse(r.data))}catch(x){e='The data is not valid JSON.'}if(e)return toast('⚠️','Not published',e);
      CLOUD.put('qbank/'+r.id,{st:'live',t:CLOUD.ts()},true).then(()=>toast('✅','Published',r.id)).catch(x=>toast('⚠️','Not published',CLOUD.say(x)))});
    el.querySelectorAll('[data-qd]').forEach(b=>b.onclick=()=>{if(confirm('Delete this draft?'))CLOUD.del('qbank/'+b.dataset.qd).catch(x=>toast('⚠️','Not deleted',CLOUD.say(x)))})};
  el.querySelectorAll('[data-qt]').forEach(b=>b.onclick=()=>{tab=b.dataset.qt;draw()});
  $('#qbload').onclick=()=>{const k=$('#qbk').value,id=$('#qbid').value.trim(),r=rows.find(x=>x.id===id),d=r?JSON.parse(r.data):id?K[k].find(id):null;
    if(id&&!d){$('#qberr').textContent='No question with that ID.';return}$('#qberr').textContent='';$('#qbj').value=JSON.stringify(d||K[k].template,null,1)};
  el.querySelectorAll('[data-qs]').forEach(b=>b.onclick=async()=>{const k=$('#qbk').value,st=b.dataset.qs;let d;try{d=JSON.parse($('#qbj').value)}catch(e){$('#qberr').textContent='That is not valid JSON: '+e.message;return}
    let id=$('#qbid').value.trim()||d.id||'';if(!id){id='x'+Date.now().toString(36);}if(!/^[A-Za-z0-9_-]{1,40}$/.test(id)){$('#qberr').textContent='IDs use letters, numbers, - and _ only.';return}d.id=id;
    const e=st==='hidden'?'':K[k].check(d);if(e){$('#qberr').textContent=e;return}$('#qberr').textContent='';
    try{await CLOUD.put('qbank/'+id,{kind:k,data:JSON.stringify(d),st,by:'lecturer',t:CLOUD.ts(),note:String($('#qbnote').value||'').slice(0,200)});$('#qbid').value=id;tab=st;toast('✅',st==='live'?'Published':st==='hidden'?'Hidden':'Draft saved',id)}
    catch(x){$('#qberr').textContent=CLOUD.say(x)}});
  $('#qbj').value=JSON.stringify(Object.values(K)[0].template,null,1);
  CLOUD.watch('qbank',{},d=>{rows=d.sort((a,b)=>(b.t|0)-(a.t|0));draw()},e=>{$('#qbl').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})})});
