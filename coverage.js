/* Question coverage (lecturer, cloud): every question in the banks with how many students attempted it,
   so the lecturer can see what nobody has tried yet and where fresh questions are needed.
   Identical in MKT101 and MKT301: the catalogue adapts to whichever question banks the site has.
   Counted from what each student's progress already records:
   - MCQs: once per question per day a student answers it fresh (the countOnce 'mcq:<id>:<day>' keys; retries of mistakes don't count).
   - Written questions: the days a plan, a timed answer, a typed answer or a self-check was saved (plan/timed/typed/check log keys),
     plus typed answers kept for marking (band and mark). Restarting a question removes its keys, so restarted work drops out.
   - Long answers / Section C parts / Essay Coach: their own log keys and saved work. */
const COV_CSS='.cov0 td{color:var(--gold)}.cov0 td:first-child b{color:var(--gold)}.covsum{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.covg{margin:8px 0;border:1px solid var(--line);border-radius:12px;padding:0 12px}.covg>summary{cursor:pointer;padding:10px 0;font:600 .95rem Lexend;list-style-position:inside}.covg>summary .tag{margin-left:6px}.covf{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.covf label.inl{display:flex;gap:6px;align-items:center;margin:0;font:400 .9rem Inter;color:var(--ink)}.covf input[type=checkbox]{width:18px;height:18px;accent-color:var(--teal)}';
function covLabel(s){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>96?s.slice(0,94)+'…':s}
function covCatalogue(){const G=[];
  if(typeof BANK!=='undefined'&&BANK.mcq){ /* MKT101 */
    TOPICS.forEach(t=>{const nm='Topic '+t+' · '+((typeof TERM!=='undefined'&&TERM.topics&&TERM.topics[t])||'');
      G.push({k:'t'+t+'m',sec:'Topic '+t,title:nm+' · MCQs',kind:'mcq',items:BANK.mcq.filter(q=>q.t===t).map(q=>({id:q.id,label:covLabel(q.q)}))});
      G.push({k:'t'+t+'s',sec:'Topic '+t,title:nm+' · Short answers',kind:'written',items:BANK_S.filter(q=>q.t===t).map(q=>({id:q.id,label:covLabel(q.q)}))});
      G.push({k:'t'+t+'l',sec:'Topic '+t,title:nm+' · Long answers',kind:'long',items:(BANK.essays||[]).filter(e=>e.t===t).map(e=>({id:e.id,label:covLabel(e.q)}))})});
    CASEL.forEach(c=>G.push({k:'c'+c.id,sec:c.short,title:c.short+' · Case practice questions',kind:'written',items:c.questions.map(q=>({id:q.id,label:covLabel((q.skill?q.skill+': ':'')+q.q)}))}));
  }else{ /* MKT301 */
    CASES.forEach(c=>G.push({k:'c'+c.id,sec:c.title,title:c.title+' · Case practice questions',kind:'written',items:c.questions.map(q=>({id:q.id,label:covLabel((q.skill?q.skill+': ':'')+q.q)}))}));
    [...new Set(BANK_B.map(q=>q.week))].sort((a,b)=>a-b).forEach(w=>G.push({k:'w'+w,sec:'Section B · Week '+w,title:'Section B · '+tkLabel('w'+w),kind:'written',items:BANK_B.filter(q=>q.week===w).map(q=>({id:q.id,label:covLabel(q.q)}))}));
    G.push({k:'ca',sec:'Section C',title:'Section C · Competitive advantage (parts a, b, c)',kind:'ca',items:BANK_C.structured.flatMap(s=>['a','b','c'].map(p=>({id:s.id+':'+p,label:s.name+' · part ('+p+')'})))});
    G.push({k:'es',sec:'Section C',title:'Section C · Essay Coach',kind:'essay',items:BANK_C.essays.map(s=>({id:s.id,label:s.name}))});
  }
  return G.filter(g=>g.items.length)}
/* one pass over every student: stats per question id */
function covCompute(users,reviews){const S={},st=id=>S[id]||(S[id]={st:new Set(),days:0,c:0,n:0,plan:new Set(),wrote:new Set(),typed:new Set(),marked:new Set(),bands:[]});
  const isDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s);
  (users||[]).forEach(x=>{const u=x.u,sid=x.id;if(!u||(typeof LECTURER!=='undefined'&&sid===LECTURER))return;const seen={},mark=(id,stage,day)=>{const r=st(id);r.st.add(sid);if(stage)r[stage].add(sid);const d=seen[id]||(seen[id]=new Set());d.add(day||'-')};
    Object.keys(u.log||{}).forEach(k=>{const p=k.split(':'),a=p[0],last=p[p.length-1],day=isDay(last)?last:'';
      if(a==='plan'||a==='check')mark(p[1],a==='plan'?'plan':'',day);else if(a==='timed')mark(p[1],'wrote',day);else if(a==='typed')mark(p[1],'typed',day);
      else if(a==='ltimed')mark(p[1],'wrote',day);else if(a==='lmark')mark(p[1],'marked',day);
      else if(a==='ca'||a==='cacheck')mark(p[1]+':'+p[2],a==='ca'?'plan':'',day);else if(a==='catimed')mark(p[1]+':'+p[2],'wrote',day);
      else if(a==='ess')mark(p[2],'plan',day);else if(a==='eplan'||a==='script')mark(p[1],'plan',day);else if(a==='essay')mark(p[1],'wrote',day);else if(a==='emark')mark(p[1],'marked',day)});
    Object.keys(u.cnt||{}).forEach(k=>{const p=k.split(':');if(p[0]!=='mcq'||p.length!==3)return;const r=st(p[1]);r.st.add(sid);r.n++;if((u.cnt[k].k||[]).includes('mcqRight'))r.c++;(seen[p[1]]||(seen[p[1]]=new Set())).add(p[2])});
    Object.entries(u.long||{}).forEach(([id,s])=>{if(s&&(s.step||s.done))mark(id,'plan',s.done?'':'')});
    Object.entries(u.cw||{}).forEach(([id,s])=>{if(s&&(s.checked||s.step))mark(id,'plan','')});
    Object.entries(u.ess||{}).forEach(([id,s])=>{if(s&&(s.step||s.planDone))mark(id,'plan','')});
    const rv=(reviews||{})[sid]||{};Object.entries(u.ans||{}).forEach(([k,a])=>{if(!a||!a.q)return;const r=st(a.q);mark(a.q,'typed',String(a.at||'').slice(0,10));if(typeof a.b==='number')r.bands.push(a.b);if(rv[k]&&!String(k).startsWith('note_'))r.marked.add(sid)});
    Object.entries(seen).forEach(([id,d])=>{const r=st(id);r.days+=[...d].filter(x=>x&&x!=='-').length||1})});
  return S}
function covCard(){const el=$('#cov');if(!el)return;if(!document.getElementById('covcss')){const s=document.createElement('style');s.id='covcss';s.textContent=COV_CSS;document.head.append(s)}
  const G=covCatalogue(),total=G.reduce((t,g)=>t+g.items.length,0),secs=[...new Set(G.map(g=>g.sec))];let US=null,RV=null,S=null;const open=new Set();
  const F={sec:'',zero:false,least:false,q:''};
  el.innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Question coverage</h2><span class="live"><i></i>LIVE</span></div>
  <p class="muted" style="font-size:.88rem;margin:6px 0 4px">Every question in the banks (${total}) and how many students have tried it. Unattempted questions are highlighted, so you can see where fresh questions are needed.</p>
  <details style="font-size:.82rem;color:var(--muted);margin:0 0 6px"><summary>What is counted</summary>MCQs count once per question per day a student answers it fresh (retrying mistakes doesn't count). Written questions count the days a plan, a timed answer, a typed answer or a self-check was saved, plus typed answers kept for marking. Restarting a question removes its record, so restarted work drops out. Counting covers everything students have done since they started using the portal with a PIN.</details>
  <div class="covf"><select id="covsec" aria-label="Topic or section"><option value="">All topics and sections</option>${secs.map(s=>`<option>${esc(s)}</option>`).join('')}</select>
   <label class="inl"><input type="checkbox" id="covzero"> Only not attempted</label><label class="inl"><input type="checkbox" id="covleast"> Least attempted first</label>
   <input type="text" id="covq" placeholder="🔎 Search questions" aria-label="Search questions" style="max-width:260px"><button class="btn ghost sm" id="covcsv">⬇ CSV</button></div>
  <div id="covb"><p class="muted">Loading…</p></div>`;
  const row=(g,it)=>{const r=S[it.id],n=r?r.st.size:0,avg=r&&r.bands.length?(r.bands.reduce((a,b)=>a+b,0)/r.bands.length).toFixed(1):'–';
    const cells=g.kind==='mcq'?`<td>${r&&r.n?Math.round(r.c/r.n*100)+'%':'–'}</td>`:`<td>${r?r.plan.size:0}</td><td>${r?r.wrote.size:0}</td><td>${r?r.typed.size:0}</td><td>${r?r.marked.size:0}</td><td>${avg}</td>`;
    return `<tr class="${n?'':'cov0'}"><td><b>${esc(it.id)}</b> ${esc(it.label)}</td><td>${n}</td><td>${r?r.days:0}</td>${cells}</tr>`};
  const head=g=>g.kind==='mcq'?'<tr><th>Question</th><th>Students</th><th>Times</th><th>% correct</th></tr>':'<tr><th>Question</th><th>Students</th><th>Times</th><th>Planned</th><th>Written</th><th>Typed</th><th>Marked</th><th>Avg band</th></tr>';
  const items=g=>{const q=F.q.toLowerCase();let a=g.items.filter(it=>(!q||(it.id+' '+it.label).toLowerCase().includes(q))&&(!F.zero||!(S[it.id]&&S[it.id].st.size)));
    if(F.least)a=a.slice().sort((x,y)=>(S[x.id]?S[x.id].st.size:0)-(S[y.id]?S[y.id].st.size:0)||(S[x.id]?S[x.id].days:0)-(S[y.id]?S[y.id].days:0));return a};
  const body=g=>{const a=items(g);return a.length?`<div class="tablewrap"><table class="wide">${head(g)}${a.map(it=>row(g,it)).join('')}</table></div>`:'<p class="muted">No questions match.</p>'};
  const draw=()=>{const b=$('#covb');if(!b||!S)return;const gs=G.filter(g=>!F.sec||g.sec===F.sec),force=!!(F.q||F.zero);
    const zeroAll=G.reduce((t,g)=>t+g.items.filter(it=>!(S[it.id]&&S[it.id].st.size)).length,0);
    b.innerHTML=`<div class="covsum"><span class="tag">Not attempted: ${zeroAll} of ${total}</span><span class="tag">${US.filter(x=>x.u&&x.id!==(typeof LECTURER!=='undefined'?LECTURER:'')).length} students counted</span></div>`+gs.map(g=>{const z=g.items.filter(it=>!(S[it.id]&&S[it.id].st.size)).length,shown=items(g).length,isOpen=open.has(g.k)||(force&&shown);
      if(force&&!shown)return '';
      return `<details class="covg" data-g="${g.k}" ${isOpen?'open':''}><summary>${esc(g.title)}<span class="tag">${g.items.length} questions</span><span class="tag" style="${z?'color:var(--gold)':''}">Not attempted: ${z} of ${g.items.length}</span></summary>${isOpen?body(g):''}</details>`}).join('')||'<p class="muted">No questions match.</p>';
    b.querySelectorAll('.covg').forEach(d=>d.addEventListener('toggle',()=>{const g=G.find(x=>x.k===d.dataset.g);if(d.open){open.add(g.k);if(!d.querySelector('table,p'))d.insertAdjacentHTML('beforeend',body(g))}else open.delete(g.k)}))};
  const update=()=>{if(!US||!RV)return;S=covCompute(US,RV);draw()};
  $('#covsec').onchange=e=>{F.sec=e.target.value;draw()};$('#covzero').onchange=e=>{F.zero=e.target.checked;draw()};$('#covleast').onchange=e=>{F.least=e.target.checked;draw()};
  let qt;$('#covq').oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{F.q=e.target.value.trim();draw()},200)};
  $('#covcsv').onclick=()=>{if(!S)return;const q=v=>'"'+String(v).replace(/"/g,'""')+'"',rows=[['Section','Group','Question ID','Question','Students','Times','% correct (MCQ)','Planned','Written','Typed','Marked','Average band']];
    G.forEach(g=>g.items.forEach(it=>{const r=S[it.id];rows.push([g.sec,g.title,it.id,it.label,r?r.st.size:0,r?r.days:0,g.kind==='mcq'&&r&&r.n?Math.round(r.c/r.n*100):'',r?r.plan.size:0,r?r.wrote.size:0,r?r.typed.size:0,r?r.marked.size:0,r&&r.bands.length?(r.bands.reduce((a,b)=>a+b,0)/r.bands.length).toFixed(1):''])}));
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='question-coverage-'+today()+'.csv';a.click()};
  const err=e=>{const b=$('#covb');if(b)b.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`};
  CLOUD.watchUsers(l=>{US=l;update()},err);CLOUD.watchReviews(r=>{RV=r;update()},err)}
