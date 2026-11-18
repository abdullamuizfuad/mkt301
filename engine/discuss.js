/* MKT Arena engine: the discussion panel (#/discuss, lecturer only). Shared by MKT101 and MKT301.
   For a live (or past) session, it gathers what the class did during the session window and groups it into activity areas:
   - written answers (U.ans with `at` in the window): per question, the 3 best and 3 weakest answers. Best = the lecturer's or Claude's band
     once marked (reviews/{SID}), otherwise the automatic check's band (a.b), then length. Answers show as "Student A, B…"; 👁 shows the name
     to the lecturer. The lecturer can move an answer between the lists, hide it, or pick any other answer from "All answers".
   - choices (U.qa entries in the window: MCQs, quick questions, Boardroom verdicts): how the class split, the share right, the answer.
   The lecturer ticks which areas to show; the choice and any changes to the lists are kept in the lecturer's own progress
   (U.disc[sessionId], users/S000001), so no new Firestore rules are needed: the lecturer can already read users and reviews.
   Shown on the lecturer's (projected) screen only; nothing is written where students can read it.
   Claude's discussion notes: when the lecturer asks Claude to prepare a discussion, Claude writes reviews/S000001.m['disc_'+sessionId] =
   {q:'disc', fb:text, at, by:'claude'} (only the lecturer can read their own reviews doc; no new rules). Shown as a 🤖 box at the top. */
const DISC_N=3;
function discRoute(h){if(!ME||ME.sid!==LECTURER)return home();if(!cloudOn())return shell('#/lecturer','<div class="callout">The discussion panel needs the live connection.</div>');
  shell('#/lecturer',`<div class="row" style="justify-content:space-between;align-items:center;gap:8px"><a href="#/live">← Live session</a><span class="row" style="gap:6px"><button class="btn ghost sm" id="dsref" data-lect>↻ Refresh</button><button class="btn ghost sm" id="dsproj" data-lect>⛶ Projector view</button></span></div>
  <div id="dsb" data-lect style="margin-top:10px"><p class="muted">Loading the class…</p></div>`);
  $('#dsproj').onclick=()=>{const on=document.body.classList.toggle('proj');document.body.classList.toggle('dproj',on);$('#dsproj').textContent=on?'✕ Exit projector view':'⛶ Projector view'};
  addEventListener('hashchange',function off(){document.body.classList.remove('proj','dproj');removeEventListener('hashchange',off)});
  let D=null;const load=async()=>{const el=$('#dsb');if(el&&!D)el.innerHTML='<p class="muted">Loading the class…</p>';
    const [users,revs]=await Promise.all([usersOnce(),CLOUD.docs('reviews').catch(()=>[])]);const RV={};revs.forEach(r=>RV[r.id]=r.m||{});
    const list=(PR.sessList||[]).slice().sort((a,b)=>(b.startedAt||0)-(a.startedAt||0));
    const S=(h[1]&&(list.find(s=>s.id===h[1])||(PR.sess&&PR.sess.id===h[1]&&PR.sess)))||PR.sess||list[0]||null;
    D={users,RV,S,list};discDraw(D)};
  $('#dsref').onclick=()=>{D=null;load()};load()}
/* everything the class did in the session window, grouped into areas */
function discData(D){const S=D.S,w=sxWin(S,0),A={},letter={},first=[];const I=typeof qIndex==='function'?qIndex():{};
  const area=(k,label)=>A[k]||(A[k]={k,label,qs:{}});
  D.users.forEach(x=>{if(x.id===LECTURER||x.id==='S000000'||!x.u)return;const u=x.u;let t0=Infinity;
    Object.entries(u.ans||{}).forEach(([key,a])=>{const t=Date.parse(a&&a.at);if(!a||!a.q||!(t>=w.a&&t<=w.b))return;t0=Math.min(t0,t);
      const e=I[a.q],lab=e?String(e.label||''):(typeof RTS_Q!=='undefined'&&RTS_Q[a.q]?'Replacement tutorial':'Written answers');
      const ar=area('w:'+lab.split(':')[0],lab.split(':')[0]+' · written answers'),q=ar.qs[a.q]||(ar.qs[a.q]={id:a.q,kind:'w',label:lab,ans:[]});
      const r=(D.RV[x.id]||{})[key];q.ans.push({key,sid:x.id,name:x.name||x.id,t:String(a.t||''),w:a.w|0,band:r?r.band|0:null,auto:a.b|0,f:Array.isArray(a.f)?a.f:[],at:t})});
    const seen={};(u.qa||[]).forEach(([s,id,ok,p])=>{const t=s*1000;if(!(t>=w.a&&t<=w.b)||seen[id])return;seen[id]=1;t0=Math.min(t0,t);
      const info=discChoice(id),ar=area('c:'+info.area,info.area),q=ar.qs[id]||(ar.qs[id]={id,kind:'c',q:info.q,ans:info.ans,opt:info.opt,why:info.why||'',right1:info.right1,n:0,right:0,picks:{}});
      q.n++;if(ok>=.5)q.right++;const pk=p===''||p==null?'(no pick)':String(p);q.picks[pk]=(q.picks[pk]|0)+1});
    if(t0<Infinity)first.push([t0,x.id])});
  first.sort((a,b)=>a[0]-b[0]).forEach(([t,sid],i)=>letter[sid]=discLetter(i));
  return {areas:Object.values(A).sort((a,b)=>a.label.localeCompare(b.label)),letter,n:first.length}}
/* Claude's notes: plain text; lines starting "## " are headings, "- " bullets, **bold** */
function discNotes(D){const n=((D.RV[LECTURER]||{})['disc_'+D.S.id])||null;if(!n||!n.fb)return '';
  const inl=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');let h='',ul=false;
  String(n.fb).split('\n').forEach(l=>{const t=l.trim();if(/^[-•] /.test(t)){if(!ul){h+='<ul class="sumlist">';ul=true}h+='<li>'+inl(t.slice(2))+'</li>';return}
    if(ul){h+='</ul>';ul=false}if(!t)return;h+=/^#{1,3} /.test(t)?'<h3 style="margin:12px 0 4px">'+inl(t.replace(/^#+ /,''))+'</h3>':'<p style="margin:6px 0">'+inl(t)+'</p>'});if(ul)h+='</ul>';
  return `<details class="card dsnotes" open><summary class="click"><b>🤖 Discussion notes from Claude</b> <span class="muted" style="font-size:.8rem">${n.at?esc(new Date(n.at).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',timeZone:'Indian/Maldives'})):''}</span></summary>${h}</details>`}
const discLetter=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return 'Student '+s};
/* a choice question: Boardroom verdicts (v:<case>:<i>) are read from the case; everything else from qInfo (presence.js) */
function discChoice(id){const m=/^v:([^:]+):(\d+)$/.exec(id);
  if(m&&typeof CASE_ALL!=='undefined'){const c=CASE_ALL.find(x=>x.id===m[1]),a=c&&c.boardroom&&c.boardroom[+m[2]];
    if(a){const L={strong:'Strong',mixed:'Partly right',weak:'Weak'};return {area:(c.short||c.id)+' · Boardroom: '+a.topic,q:a.who+': '+a.say,ans:L[a.v]||a.v,opt:p=>L[p]||p,why:a.why||'',right1:a.v}}}
  const I=qInfo(id);return {area:I.top+' · quick questions',q:I.q,ans:I.ans,opt:p=>{const n=+p;return p!==''&&!isNaN(n)&&I.opt(n)?I.opt(n):p}}}
function discSt(S){U.disc=U.disc||{};const k=S.id;const st=U.disc[k]||(U.disc[k]={sel:null,pin:{},at:Date.now()});
  const ks=Object.keys(U.disc);if(ks.length>12)ks.sort((a,b)=>(U.disc[a].at||0)-(U.disc[b].at||0)).slice(0,ks.length-12).forEach(x=>delete U.disc[x]);return st}
/* best and weakest for one written question, with the lecturer's changes (pin.b / pin.w = keys moved in, pin.x = hidden) */
function discPick(q,pin){pin=pin||{};const score=a=>(a.band!=null?a.band*10+5:a.auto*10)+Math.min(4,a.w/60);
  const pool=q.ans.filter(a=>!(pin.x||[]).includes(a.key)),by=k=>pool.find(a=>a.key===k);
  const B=(pin.b||[]).map(by).filter(Boolean),W=(pin.w||[]).map(by).filter(Boolean).filter(a=>!B.includes(a));
  const rest=pool.filter(a=>!B.includes(a)&&!W.includes(a)).sort((a,b)=>score(b)-score(a));
  while(B.length<DISC_N&&rest.length)B.push(rest.shift());
  if(pool.length>=2){const low=rest.slice().reverse();while(W.length<DISC_N&&low.length)W.push(low.shift())}
  return {B:B.slice(0,Math.max(DISC_N,(pin.b||[]).length)),W,others:pool.filter(a=>!B.includes(a)&&!W.includes(a))}}
function discDraw(D){const el=$('#dsb');if(!el)return;const S=D.S;
  if(!S){el.innerHTML='<div class="card"><h2>No session yet</h2><p class="muted">Start a live session from the Lecturer tab. Its answers appear here for discussion.</p></div>';return}
  const X=discData(D),st=discSt(S),sel=st.sel||X.areas.map(a=>a.k),live=sxWin(S,0).live;
  const opts=D.list.slice(0,15).map(s=>`<option value="${esc(s.id)}"${s.id===S.id?' selected':''}>${esc(s.name)}${s.startedAt?' · '+new Date(s.startedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'Indian/Maldives'}):''}${s.active&&(!s.endsAt||Date.now()<s.endsAt)?' · LIVE':''}</option>`).join('');
  const nameOf={};D.users.forEach(u=>nameOf[u.id]=u.name||u.id);
  const card=(a,q,where)=>`<div class="dsa ${where}" data-k="${esc(a.key)}"><div class="row" style="justify-content:space-between;gap:6px"><b class="dsn">${esc(X.letter[a.sid]||'Student')}</b><span class="dsnm" hidden>${esc(nameOf[a.sid]||a.sid)} · ${esc(a.sid)}</span><span class="tag">${a.band!=null?'Band '+a.band+'/6':'≈ '+a.auto+'/6 (auto)'}</span></div>
    <div class="dst">${esc(a.t).replace(/\n/g,'<br>')}</div><div class="row dsctl" style="gap:6px;margin-top:6px"><button class="btn ghost sm" data-dsv="${esc(a.key)}" title="Show the name to you">👁 Name</button><button class="btn ghost sm" data-dsm="${esc(q.id)}|${esc(a.key)}|${where==='best'?'w':'b'}">${where==='best'?'⬇ To weak':'⬆ To best'}</button><button class="btn ghost sm" data-dsx="${esc(q.id)}|${esc(a.key)}">✕ Hide</button></div></div>`;
  const wq=q=>{const P=discPick(q,st.pin[q.id]),e=(typeof qIndex==='function'?qIndex():{})[q.id],ideas=e&&e.q&&e.q.chips?e.q.chips.filter(c=>c.g).map(c=>c.t):[];
    return `<div class="card dsq"><p class="muted" style="margin:0;font-size:.8rem">${esc(q.label)} · ${q.ans.length} answer${q.ans.length===1?'':'s'}</p><h3 style="margin:4px 0 8px">${esc(e&&e.q?e.q.q:qInfo(q.id).q)}</h3>
    ${ideas.length?`<details><summary class="click muted">Key ideas</summary><ul class="sumlist">${ideas.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`:''}
    <div class="grid g2" style="margin-top:8px"><div><h4 class="dsh">🌟 Best answers</h4>${P.B.map(a=>card(a,q,'best')).join('')||'<p class="muted">None yet.</p>'}</div><div><h4 class="dsh">🛠️ Needs work</h4>${P.W.map(a=>card(a,q,'weak')).join('')||'<p class="muted">Not enough answers to compare yet.</p>'}</div></div>
    ${P.others.length?`<details class="dsoth"><summary class="click muted">All other answers (${P.others.length})</summary>${P.others.map(a=>`<div class="dsa"><div class="row" style="justify-content:space-between"><b class="dsn">${esc(X.letter[a.sid]||'Student')}</b><span class="row" style="gap:6px"><button class="btn ghost sm" data-dsm="${esc(q.id)}|${esc(a.key)}|b">⬆ Best</button><button class="btn ghost sm" data-dsm="${esc(q.id)}|${esc(a.key)}|w">⬇ Weak</button></span></div><div class="dst">${esc(a.t).replace(/\n/g,'<br>')}</div></div>`).join('')}</details>`:''}
    ${(st.pin[q.id]||{}).x&&st.pin[q.id].x.length?`<button class="btn ghost sm" data-dsu="${esc(q.id)}">Show ${st.pin[q.id].x.length} hidden</button>`:''}</div>`};
  const isOk=(q,p)=>q.right1!=null?p===q.right1:!!q.ans&&String(q.opt(p)||p)===String(q.ans);
  const cq=q=>{const pk=Object.entries(q.picks);if(q.right1&&!pk.some(([p])=>p===q.right1))pk.push([q.right1,0]);pk.sort((a,b)=>b[1]-a[1]);const pct=Math.round(q.right/q.n*100);
    return `<div class="card dsq"><h3 style="margin:0 0 8px">${esc(q.q)}</h3><p style="margin:0 0 8px"><b>${pct}% right</b> <span class="muted">· ${q.n} answered</span></p>
    ${pk.map(([p,n])=>{const ok=isOk(q,p),v=Math.round(n/q.n*100);return `<div class="dsbar${ok?' ok':' no'}"><span>${ok?'✅ ':''}${esc(q.opt(p)||p)}${ok?' <small>(correct)</small>':''}</span><i style="width:${v}%"></i><b>${v}%</b></div>`}).join('')}
    ${q.why?`<details class="dswhy"><summary class="click">💡 Why it is ${esc(q.ans)} (open after the class has discussed it)</summary><p style="margin:6px 0 0">${esc(q.why)}</p></details>`:''}</div>`};
  /* points to discuss: the choices most of the class got wrong, and the key ideas few written answers used */
  const points=()=>{const L=[],shown=X.areas.filter(a=>sel.includes(a.k));
    shown.forEach(a=>Object.values(a.qs).forEach(q=>{if(q.kind!=='c'||q.n<2)return;const pct=Math.round(q.right/q.n*100);if(pct>=70)return;
      const wrong=Object.entries(q.picks).filter(([p])=>!isOk(q,p)).sort((x,y)=>y[1]-x[1])[0];
      L.push({s:pct,h:`<b>${esc(q.q.length>110?q.q.slice(0,108)+'…':q.q)}</b><br>Only ${pct}% got it right${wrong?`; ${Math.round(wrong[1]/q.n*100)}% chose “${esc(q.opt(wrong[0])||wrong[0])}”`:''}. Correct: <b>${esc(q.ans)}</b>.${q.why?` <span class="muted">${esc(q.why)}</span>`:''}`})}));
    const I2=typeof qIndex==='function'?qIndex():{};
    shown.forEach(a=>Object.values(a.qs).forEach(q=>{if(q.kind!=='w'||q.ans.length<3)return;const e=I2[q.id],ch=e&&e.q&&e.q.chips||[];
      const few=ch.map((c,j)=>[c,j]).filter(([c,j])=>c.g&&q.ans.filter(x=>x.f.includes(j)).length/q.ans.length<.34).map(([c])=>c.t);
      if(few.length)L.push({s:40,h:`<b>${esc(e&&e.q?(e.q.q.length>110?e.q.q.slice(0,108)+'…':e.q.q):q.id)}</b><br>Few of the ${q.ans.length} answers used: ${few.slice(0,4).map(t=>'<span class="tag">'+esc(t)+'</span>').join(' ')}`})}));
    L.sort((x,y)=>x.s-y.s);
    return `<div class="card dspts"><h2 style="margin:0 0 6px">🗣️ Points to discuss</h2>${L.length?`<ol class="sumlist">${L.slice(0,8).map(x=>`<li>${x.h}</li>`).join('')}</ol>`:'<p class="muted" style="margin:0">Nothing stands out yet: most of the class got the choices right. Press ↻ Refresh as more answers come in.</p>'}</div>`};
  el.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><h1 style="margin:0">💬 Discussion</h1>${live?'<span class="live"><i></i>LIVE</span>':'<span class="tag">Ended</span>'}</div>
    <label for="dssel" class="muted" style="font-size:.85rem">Session</label><select id="dssel">${opts||`<option>${esc(S.name)}</option>`}</select>
    <p class="muted" style="font-size:.85rem;margin:8px 0 0">${X.n} student${X.n===1?'':'s'} answered during this session. Names are hidden: tap 👁 to see who wrote an answer (only on your screen). Best and weakest are picked automatically: use the buttons to change them.</p>
    <div class="dsareas">${X.areas.length?X.areas.map(a=>{const n=Object.values(a.qs).reduce((t,q)=>t+(q.kind==='w'?q.ans.length:q.n),0);return `<label class="row ppchk"><input type="checkbox" data-dsa="${esc(a.k)}"${sel.includes(a.k)?' checked':''}> ${esc(a.label)} <span class="muted">(${Object.keys(a.qs).length} question${Object.keys(a.qs).length===1?'':'s'}, ${n} answer${n===1?'':'s'})</span></label>`}).join(''):'<p class="muted">No answers in this session yet. Press ↻ Refresh as students work.</p>'}</div></div>
  ${discNotes(D)}
  ${X.areas.filter(a=>sel.includes(a.k)).map(a=>`<h2 class="dsah">${esc(a.label)}</h2>${Object.values(a.qs).sort((x,y)=>(y.kind==='w'?y.ans.length:y.n)-(x.kind==='w'?x.ans.length:x.n)).map(q=>q.kind==='w'?wq(q):cq(q)).join('')}`).join('')}
  ${X.areas.length?points():''}`;
  $('#dssel')&&($('#dssel').onchange=e=>{location.hash='#/discuss/'+e.target.value});
  el.querySelectorAll('[data-dsa]').forEach(c=>c.onchange=()=>{st.sel=[...el.querySelectorAll('[data-dsa]')].filter(x=>x.checked).map(x=>x.dataset.dsa);st.at=Date.now();save();discDraw(D)});
  const pin=qid=>st.pin[qid]||(st.pin[qid]={b:[],w:[],x:[]});const drop=(p,k)=>{p.b=p.b.filter(x=>x!==k);p.w=p.w.filter(x=>x!==k)};
  el.querySelectorAll('[data-dsv]').forEach(b=>b.onclick=()=>{const box=b.closest('.dsa'),n=box.querySelector('.dsnm');n.hidden=!n.hidden;b.textContent=n.hidden?'👁 Name':'🙈 Hide name'});
  el.querySelectorAll('[data-dsm]').forEach(b=>b.onclick=()=>{const [qid,k,to]=b.dataset.dsm.split('|'),p=pin(qid);drop(p,k);p[to].push(k);st.at=Date.now();save();discDraw(D)});
  el.querySelectorAll('[data-dsx]').forEach(b=>b.onclick=()=>{const [qid,k]=b.dataset.dsx.split('|'),p=pin(qid);drop(p,k);p.x.push(k);save();discDraw(D)});
  el.querySelectorAll('[data-dsu]').forEach(b=>b.onclick=()=>{pin(b.dataset.dsu).x=[];save();discDraw(D)})}
(function(){const st=document.createElement('style');st.textContent=
  '.dsareas{display:grid;gap:4px;margin-top:10px}.dsah{margin:22px 0 8px}.dsq{margin-bottom:14px}.dsh{margin:4px 0 6px}'+
  '.dsa{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;background:var(--sunk)}.dsa.best{border-left:4px solid var(--green)}.dsa.weak{border-left:4px solid var(--gold)}'+
  '.dst{margin-top:6px;line-height:1.5;max-height:16em;overflow:auto}.dsnm{font-size:.82rem;color:var(--gold)}'+
  '.dsbar{display:grid;grid-template-columns:minmax(0,1fr) 40% 3em;gap:8px;align-items:center;margin:4px 0}.dsbar i{display:block;height:12px;border-radius:6px;background:var(--teal)}.dsbar b{text-align:right}.dsbar.ok i{background:var(--green)}.dsbar.no i{background:var(--pink,#e85d75);opacity:.75}.dsbar.ok span{font-weight:700;color:var(--green)}.dswhy{margin-top:8px}.dsnotes{margin-top:14px;border:2px solid var(--teal)}.dspts{margin-top:22px;border:2px solid var(--gold)}.dspts li{margin-bottom:10px;line-height:1.5}'+
  'body.dproj .dsctl,body.dproj .dsoth,body.dproj [data-dsu]{display:none}body.dproj #dsb{font-size:1.18rem}body.dproj .dst{max-height:none}';
  document.head.appendChild(st)})();
if(typeof ROUTES!=='undefined')ROUTES.discuss=discRoute;
