/* MKT301 course: content, pages and hooks that only this course has. The shared engine is in engine/. */
const LEVELS=[[0,'Intern'],[150,'Market Analyst'],[400,'Brand Manager'],[800,'Country Manager'],[1400,'Regional Director'],[2200,'Global CMO']];
const BADGES=[
 {id:'boarding',ico:'🎫',name:'Boarding Pass',d:'Sign in for the first time',t:u=>true},
 {id:'reader',ico:'📖',name:'Case Cracker',d:'Read every section of a case',t:u=>CASES.some(c=>c.sections.every(s=>u.log['read:'+c.id+':'+s.id]))},
 {id:'voice',ico:'🎙️',name:'Boardroom Voice',d:'Judge 10 boardroom arguments',t:u=>u.n.verdicts>=10},
 {id:'devil',ico:'😈',name:"Devil's Advocate",d:'Spot 5 weak arguments correctly',t:u=>u.n.weakSpotted>=5},
 {id:'sharp',ico:'🎯',name:'Sharp Judge',d:'15 correct boardroom verdicts',t:u=>u.n.verdictsRight>=15},
 {id:'architect',ico:'🧱',name:'Architect',d:'Build 5 answer plans',t:u=>u.n.plans>=5},
 {id:'flawless',ico:'💎',name:'Flawless Plan',d:'3 plans with no decoys and every key idea',t:u=>u.n.perfect>=3},
 {id:'pressure',ico:'⏱️',name:'Under Pressure',d:'Finish 3 timed answers on paper',t:u=>u.n.timed>=3},
 {id:'marathon',ico:'🏃',name:'Marathon',d:'Finish 15 timed answers',t:u=>u.n.timed>=15},
 {id:'fire3',ico:'🔥',name:'On Fire',d:'Practise 3 days in a row',t:u=>streak(u)>=3},
 {id:'fire7',ico:'☄️',name:'Unstoppable',d:'Practise 7 days in a row',t:u=>streak(u)>=7},
 {id:'mission',ico:'✅',name:'Mission Ready',d:'Complete a daily mission',t:u=>u.n.missions>=1},
 {id:'star',ico:'⭐',name:'Rising Star',d:'Reach Brand Manager level',t:u=>u.xp>=400},
 {id:'strategist',ico:'🏰',name:'Strategist',d:'Complete all three parts of a competitive-advantage scenario',t:u=>u.n.strat>=1},
 {id:'blueocean',ico:'🌊',name:'Blue Ocean Explorer',d:'Complete 3 Blue Ocean canvases',t:u=>u.n.errc>=3},
 {id:'planner',ico:'🗺️',name:'Grand Planner',d:'Complete 3 essay plans',t:u=>u.n.eplans>=3},
 {id:'essayist',ico:'🖋️',name:'Essayist',d:'Write a full 40-minute essay on paper',t:u=>u.n.essays>=1},
 {id:'wordsmith',ico:'⌨️',name:'Wordsmith',d:'Type 5 answers that hit key ideas',t:u=>(u.n.typed||0)>=5},
 {id:'marked',ico:'🧑‍🏫',name:'Marked by the Pro',d:'Get a typed answer marked by your lecturer',t:u=>(u.n.reviewed||0)>=1},
 {id:'regional',ico:'🌏',name:'Regional Director',d:'Reach Regional Director level',t:u=>u.xp>=1400},
 ...PRES_BADGES
];
const MPOOL=[
 {id:'read2',t:0,k:'read',n:2,x:'Read 2 case sections'},{id:'verd3',t:0,k:'verdicts',n:3,x:'Judge 3 Boardroom arguments'},
 {id:'right2',t:0,k:'verdictsRight',n:2,x:'Make 2 Boardroom calls that match our reading'},{id:'plan1',t:0,k:'plans',n:1,x:'Build 1 answer plan'},
 {id:'bplan1',t:0,k:'bplans',n:1,x:'Plan 1 Section B short answer'},{id:'timed1',t:0,k:'timed',n:1,x:'Finish 1 timed answer on paper'},
 {id:'typed1',t:0,k:'typed',n:1,x:'Type 1 answer and check it'},{id:'esstool1',t:0,k:'esstool',n:1,x:'Check 1 Essay Coach planning tool'},
 {id:'read4',t:1,k:'read',n:4,x:'Read 4 case sections'},{id:'verd6',t:1,k:'verdicts',n:6,x:'Judge 6 Boardroom arguments'},
 {id:'right4',t:1,k:'verdictsRight',n:4,x:'Make 4 Boardroom calls that match our reading'},{id:'plan3',t:1,k:'plans',n:3,x:'Build 3 answer plans'},
 {id:'perfect1',t:1,k:'perfect',n:1,x:'Build 1 flawless plan (every key idea, no decoys)'},{id:'timed2',t:1,k:'timed',n:2,x:'Finish 2 timed answers on paper'},
 {id:'btimed1',t:1,k:'btimed',n:1,x:'Write 1 Section B answer against the clock'},{id:'catool1',t:1,k:'catool',n:1,x:'Complete 1 Section C strategy tool'},
 {id:'typed2',t:1,k:'typed',n:2,x:'Type and check 2 answers'},{id:'esstool3',t:1,k:'esstool',n:3,x:'Check 3 Essay Coach planning tools'},
 {id:'right6',t:2,k:'verdictsRight',n:6,x:'Make 6 Boardroom calls that match our reading'},{id:'perfect2',t:2,k:'perfect',n:2,x:'Build 2 flawless plans'},
 {id:'timed3',t:2,k:'timed',n:3,x:'Finish 3 timed answers on paper'},{id:'btimed2',t:2,k:'btimed',n:2,x:'Write 2 Section B answers against the clock'},
 {id:'catimed1',t:2,k:'catimed',n:1,x:'Write 1 Section C part on paper, timed'},{id:'ecplan1',t:2,k:'ecplan',n:1,x:'Complete a full Essay Coach plan'},
 {id:'essay1',t:2,k:'essays',n:1,x:'Write a full 40-minute essay on paper'},
 ...PRES_MISSIONS];
const FLY=[['📈','-170px','-120px'],['🌏','160px','-110px'],['🏷️','-190px','40px'],['💱','185px','60px'],['🛳️','-120px','-150px'],['🎯','120px','-150px'],['📊','-200px','-40px'],['🏆','200px','-20px'],['','-150px','110px'],['','150px','120px']];
const MOTTOS=['Every case you crack today is one less surprise tomorrow.','Think global. Plan smart. Write with confidence.','Small steps every day add up to big results.','Your next level is one practice set away.','Great marketers are made, not born. Start now.'];
const SCENE=`<div class="scene" aria-hidden="true">${FLY.map((f,i)=>`<span class="fly ${f[0]?'':'w'}" style="--x:${f[1]};--y:${f[2]};--d:${(i*.36).toFixed(2)}s">${f[0]}</span>`).join('')}
<svg class="hero-svg" viewBox="0 0 200 170"><ellipse cx="100" cy="62" rx="34" ry="36" fill="#1b1430"/>
<path d="M46 170c4-40 22-58 54-58s50 18 54 58z" fill="#3456d1"/><path d="M88 112l12 26 12-26z" fill="#fff"/>
<rect x="93" y="86" width="14" height="16" rx="5" fill="#f2b98d"/><circle cx="100" cy="64" r="25" fill="#f6c39b"/>
<path d="M72 60c0-24 16-34 30-34s28 10 28 32c-6-10-16-14-24-14-10 0-24 4-34 16z" fill="#1b1430"/>
<g class="blink"><circle cx="91" cy="66" r="2.6" fill="#1b1430"/><circle cx="111" cy="66" r="2.6" fill="#1b1430"/></g>
<g fill="none" stroke="#6f5bd8" stroke-width="2.4"><circle cx="91" cy="66" r="8"/><circle cx="111" cy="66" r="8"/><path d="M99 66h4"/></g>
<path d="M94 78q6 4 12 0" stroke="#b5654a" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M18 170l22-44h120l22 44z" fill="#2a2f55"/>
<rect x="52" y="104" width="96" height="62" rx="8" fill="#e9ecf6"/><rect x="52" y="104" width="96" height="62" rx="8" fill="#3ee6c1" fill-opacity=".14" class="glow"/>
<rect x="112" y="116" width="9" height="9" rx="2" fill="#ff5a6e" transform="rotate(-8 116 120)"/><rect x="126" y="115" width="9" height="9" rx="2" fill="#35c46a"/>
<text x="100" y="146" text-anchor="middle" font-family="Lexend,sans-serif" font-weight="800" font-size="11" fill="#9aa3c8">MKT301</text>
<ellipse cx="50" cy="140" rx="10" ry="15" fill="#f6c39b"/><ellipse cx="150" cy="140" rx="10" ry="15" fill="#f6c39b"/></svg></div>`;
function gate(msg){
  app.innerHTML=`<div class="gate2"><section class="intro">${SCENE}
  <h1>Welcome to the <span>MKT301 Arena</span></h1>
  <p class="lead">Your practice ground for International Marketing. Work through real-world cases, from Malé to Milan, and build the skills to analyse a market, choose how to enter it and argue your plan with confidence.</p>
  </section><section class="more"><ul class="perks"><li>📖 <span><b>Cases you can explore</b>: read the full story, check the exhibits and judge the boardroom.</span></li>
  <li>🧩 <span><b>Plan smarter answers</b>: build your structure with chips, then write on paper against the clock.</span></li>
  <li>🏆 <span><b>Level up</b>: earn XP, unlock badges, keep your streak and climb the class leaderboard.</span></li></ul>
  <p class="motto" id="motto">${MOTTOS[0]}</p></section>
  <div class="card signcard"><h2 style="margin-top:6px">Sign in</h2>
  <form id="f" novalidate><label for="nm">Full name</label><input type="text" id="nm" autocomplete="name" required>
  <label for="sid">Student ID</label><div class="idrow"><span class="pre">S</span><input type="text" id="sid" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="0·····" aria-describedby="hn"></div>
  <div class="hint" id="hn">Type the 6 numbers after the S. They start with 0.</div>
  <div class="mail" id="ml"><span style="font-size:1.2rem">✉️</span><div><small><span id="mll">Your student email</span><span class="st" id="mst"></span></small><b id="mla">s0·····@student.mnu.edu.mv</b></div></div>
  <div class="err" id="er">${msg||''}</div>
  <button class="btn" id="go" disabled>${CLOUD.ok?'Continue':'Verify and start'}</button></form>
  <p class="muted" style="font-size:.8rem;margin-top:14px">${CLOUD.ok?'Sign in with your own 6-digit PIN. Your progress saves to your account, so you can carry on from any phone or laptop.':'Your progress is saved on this device. To move it to another device, use <b>Save my progress</b>.'}</p></div></div>`;
  let mi=0;const mt=setInterval(()=>{const m=$('#motto');if(!m)return clearInterval(mt);m.style.opacity=0;setTimeout(()=>{mi=(mi+1)%MOTTOS.length;m.textContent=MOTTOS[mi];m.style.opacity=1},500)},4500);
  let ok=false,seq=0;const sidIn=$('#sid'),nmIn=$('#nm');
  const ready=()=>{$('#go').disabled=!(ok&&nmIn.value.trim().length>1)};
  const check=async()=>{const d=sidIn.value.replace(/\D/g,'').slice(0,6);if(sidIn.value!==d)sidIn.value=d;
    const ml=$('#ml'),me=++seq;ok=false;ml.className='mail';$('#mst').textContent='';$('#er').textContent='';
    if(d&&d[0]!=='0'){ml.className='mail no';$('#mst').textContent='Starts with 0';ready();return}
    const sid='S'+d;$('#mla').textContent=(sid.toLowerCase()+'·'.repeat(6-d.length))+'@student.mnu.edu.mv';$('#mll').textContent='Your student email';
    if(d.length<6){ready();return}
    if(sid===LECTURER){$('#mla').textContent='Lecturer access';}
    $('#mst').textContent='Checking…';
    let listed=true;if(typeof ROSTER!=='undefined'&&ROSTER.hashes&&ROSTER.hashes.length){
      if(!(window.crypto&&crypto.subtle)){$('#mst').textContent='';$('#er').textContent='This browser cannot check your ID. Try Chrome or Safari.';return}
      listed=ROSTER.hashes.includes(await sha(ROSTER.salt+'|'+sid))}
    if(me!==seq)return;ok=listed;ml.className='mail '+(listed?'ok':'no');$('#mst').textContent=listed?'✓ Verified':'✗ Not found';
    if(!listed)$('#er').textContent='That ID is not on the MKT301 class list. Check the numbers, or ask your lecturer.';
    else if(!nmIn.value.trim())nmIn.focus();ready()};
  sidIn.oninput=check;nmIn.oninput=ready;
  $('#f').onsubmit=e=>{e.preventDefault();if(!ok){check();return}const name=nmIn.value.trim();if(name.length<2){$('#er').textContent='Please type your full name.';nmIn.focus();return}
    const sid='S'+sidIn.value;if(CLOUD.ok)return pinStep(sid,name,mt);
    clearInterval(mt);LS.set('session',{sid,name});start()}}
const NAV=[['#/','Home'],['#/cases','Section A · Cases'],['#/short','Section B · Short answers'],['#/essay','Section C · Strategy & essay'],['#/badges','Badges'],['#/board','Leaderboard']];
const XP_DEFAULT={typed:20,plan:15,perfect:10,timed:30,check:0,ca:15,catimed:30,cacheck:0,cadone:40,ess:5,eplan:40,script:10,essay:60,emark:20};
const partKeys=(sid,p)=>k=>['ca:','catimed:','cacheck:'].some(x=>k.startsWith(x+sid+':'+p+':'))||k==='cadone:'+sid;
const essKeys=sid=>k=>(k.startsWith('ess:')&&k.split(':')[2]===sid)||k==='eplan:'+sid||k==='script:'+sid||k.startsWith('essay:'+sid+':')||k.startsWith('emark:'+sid+':');
function presWhere(){const h=location.hash.replace(/^#\/?/,'').split('/'),m=((document.querySelector('main')||{}).textContent||'').match(/Question (\d+) of \d+/),q=m?' · Q'+m[1]:'';
  if(h[0]==='case'){const c=CASES.find(x=>x.id===h[1]);return (c?c.title:'Case')+' · '+({read:'Read',board:'Boardroom',practice:'Practice',exhibits:'Exhibits'}[h[2]||'read']||'Read')+(h[2]==='practice'?q:'')}
  if(h[0]==='short')return 'Section B · Short answers';
  if(h[0]==='essay'){const B=typeof BANK_C!=='undefined'?BANK_C:{},L=h[1]==='ca'?B.structured:h[1]==='coach'?B.essays:null,x=L&&L.find(y=>y.id===h[2]);return 'Section C'+(h[1]==='ca'?' · Competitive advantage':h[1]==='coach'?' · Essay Coach':'')+(x?' · '+x.name:'')}
  const lect=typeof ME!=='undefined'&&ME&&ME.sid===LECTURER;return ({'':'Home',cases:'Section A · Cases',badges:'Badges',board:'Leaderboard'}[h[0]])||(lect&&['lecturer','live','session','student'].includes(h[0])?'Lecturer':'Home')}
const TOUR=[['🧩','Plan with chips','Every question starts with a plan. Tap the ideas you would use, then check your plan. Some chips are decoys, and the feedback explains why.'],
 ['🏁','Finish your way','After planning, choose: <b>📝 Plan only</b> to move on, <b>✍️ Write on paper</b> against the clock, or <b>⌨️ Type my answer</b> (or speak it with 🎤) for an automatic check of the key ideas. Your lecturer may mark typed answers too.'],
 ['✨','XP, missions and badges','Earn XP for reading, planning and writing. Three daily missions change every day and get tougher as you level up. <b>⏱️ Screen time</b> counts your active minutes: 20 a day meets your daily goal. In class, tap <b>Join</b> when your lecturer starts a live session.'],
 ['💾','Keep your progress safe','Your progress lives on this device. Tap <b>💾 Save</b> in the top bar to email a copy to your lecturer or download it.']];
CRS.missionGo={read:'#/cases',verdicts:'#/cases',verdictsRight:'#/cases',plans:'#/cases',timed:'#/cases',perfect:'#/short',bplans:'#/short',btimed:'#/short',catool:'#/essay',catimed:'#/essay',esstool:'#/essay',ecplan:'#/essay',essays:'#/essay',typed:'#/short',stgoal:'#/short'};
/* the four big practice tiles on home and on #/practice (engine/simple.js) */
function homeTiles(){return [['📚','Section A · Cases',CASES.length+' cases: read, judge, practise','#/cases'],['🧩','Section B · Short answers',BANK_B.length+' questions','#/short'],
  ['🏆','Section C · Strategy & essay',BANK_C.structured.length+' scenarios · '+BANK_C.essays.length+' essays','#/essay'],['🃏','Flashcards','Key terms by week','#/cards']]}
function soon(active,title,em,text){shell(active,`<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:3rem">${em}</div><h1>${title}</h1><p class="muted">${text}</p><a class="btn" href="#/cases">Practise a case meanwhile</a></div>`)}
function caseList(){shell('#/cases',`<h1>Section A · Case studies</h1><p class="muted">Read each case in full, judge the boardroom, then practise answers on paper. Any of these cases could be the one you meet later, so practise them all.</p>
 <div class="grid g3">${CASES.map(c=>`<a class="card zone" href="#/case/${c.id}/read"><div class="em">${c.icon}</div><h3>${esc(c.title)}</h3><p class="muted" style="font-size:.9rem">${esc(c.subtitle)}</p><div class="chipline"><span class="tag">${esc(c.tag)}</span></div></a>`).join('')}</div>`)}
const COLORS=['#3ee6c1','#ffc94d','#ff6b9a','#6aa8ff','#a98bff','#4fd88a','#ff9f43'];
function caseView(id,tab){
  const c=CASES.find(x=>x.id===id);if(!c)return caseList();
  const tabs=[['read','📖 Read'],['board','🎙️ Boardroom'],['practice','✍️ Practice'],['exhibits','📊 Exhibits']];
  shell('#/cases',`<div class="casehead" style="--c:${c.color}"><div class="row"><span style="font-size:2.4rem">${c.icon}</span><div><h1 style="margin:0">${esc(c.title)}</h1><p class="muted" style="margin:0">${esc(c.subtitle)}</p></div></div></div>
  <div class="subnav">${tabs.map(t=>`<button data-t="${t[0]}" class="${t[0]===tab?'on':''}">${t[1]}</button>`).join('')}</div><div id="pane"></div>`);
  document.querySelectorAll('.subnav button').forEach(b=>b.onclick=()=>location.hash='#/case/'+id+'/'+b.dataset.t);
  ({read:readPane,board:boardPane,practice:practicePane,exhibits:exhibitPane}[tab]||readPane)(c)}
function readPane(c){
  const P=$('#pane');
  P.innerHTML=`<div class="reader"><div class="card toc">${c.sections.map((s,i)=>`<a href="javascript:void 0" data-s="${s.id}" class="${U.log['read:'+c.id+':'+s.id]?'read':''}"><span class="d"></span>${i+1}. ${esc(s.title)}</a>`).join('')}</div>
  <div>${c.sections.map((s,i)=>`<article class="card sec" id="s-${s.id}"><div class="num">PART ${i+1}</div><h2>${esc(s.title)}</h2>${s.html}
  <div class="row" style="margin-top:12px">${U.log['read:'+c.id+':'+s.id]?'<span class="tag">✓ Read</span>':`<button class="btn sm" data-r="${s.id}">Mark as read · +5 XP</button>`}</div></article>`).join('')}
  <p class="muted" style="font-size:.8rem">${esc(c.note)}</p></div></div>`;
  P.querySelectorAll('.toc a').forEach(a=>a.onclick=()=>$('#s-'+a.dataset.s).scrollIntoView({behavior:'smooth'}));
  P.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{if(award('read:'+c.id+':'+b.dataset.r,5,'Section read'))count('read');b.outerHTML='<span class="tag">✓ Read</span>';
    P.querySelector(`.toc a[data-s="${b.dataset.r}"]`)?.classList.add('read');
    if(c.sections.every(s=>U.log['read:'+c.id+':'+s.id]))award('readall:'+c.id,30,'Whole case read')})}
function exhibitPane(c){$('#pane').innerHTML=c.exhibits.map(x=>`<div class="card" style="margin-bottom:14px"><h3>${esc(x.title)}</h3><div class="tablewrap"><table class="${x.head&&x.head.length>3?'wide':''}">${x.head?`<tr>${x.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>`:''}${x.rows.map(r=>`<tr>${r.map((d,i)=>`<td>${i===0&&!x.head?'<b>'+esc(d)+'</b>':esc(d)}</td>`).join('')}</tr>`).join('')}</table></div></div>`).join('')}
function boardPane(c){
  const topics=[...new Set(c.boardroom.map(a=>a.topic))];let cur=LS.get('bt_'+c.id,topics[0]);if(!topics.includes(cur))cur=topics[0];
  const who=[...new Set(c.boardroom.map(a=>a.who))];
  const draw=()=>{const done=c.boardroom.filter((a,i)=>U.verd[c.id+':'+i]).length;
    $('#pane').innerHTML=`<div class="card" style="margin-bottom:14px"><h2>The Boardroom</h2><p class="muted">Each person argues a position. Some arguments are strong, some are weak, some are partly right. Judge each one, then read why. Use the strong points, and your own ideas, to build answers.</p>
    <div class="bar"><i style="width:${done/c.boardroom.length*100}%;background:var(--teal)"></i></div><p class="muted" style="font-size:.8rem;margin:6px 0 0">${done}/${c.boardroom.length} judged</p></div>
    <div class="subnav">${topics.map(t=>`<button data-tp="${esc(t)}" class="${t===cur?'on':''}">${esc(t)}</button>`).join('')}</div>
    ${c.boardroom.map((a,i)=>a.topic!==cur?'':argCard(c,a,i,COLORS[who.indexOf(a.who)%COLORS.length])).join('')}
    <div class="card"><h3>Now build your own position</h3><p class="muted" style="margin:0">On paper, write 3–4 sentences on "${esc(cur)}": pick the strongest point, challenge the weakest one with theory, and add one idea nobody in the room suggested.</p></div>`;
    document.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{cur=b.dataset.tp;LS.set('bt_'+c.id,cur);draw()});
    document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{const [i,v]=b.dataset.v.split('|');const a=c.boardroom[+i],k=c.id+':'+i;if(U.verd[k])return;
      U.verd[k]=v;count('verdicts');const right=v===a.v;if(right){count('verdictsRight');if(a.v==='weak')count('weakSpotted')}
      award('verdict:'+k,right?10:3,right?'Good call':'Verdict recorded');draw()})};
  draw()}
function qCard(q,i,o={}){
  const secs=o.secs||600,mins=Math.round(secs/60),re=()=>qCard(q,i,o);
  const el=$('#q-'+q.id),st=U.plansSaved[q.id]||(U.plansSaved[q.id]={step:0,sel:[],checked:false,ticks:[]});
  if(!st.order)st.order=shuffle(q.chips.map((_,j)=>j));
  if(!st.route&&st.step>0)st.route='paper';if(st.final)st.done=true;
  const good=q.chips.map((c,j)=>c.g?j:-1).filter(j=>j>=0),planHTML=`<div class="plan"><b class="lex" style="font-size:.85rem">Your plan</b><ol>${st.sel.filter(j=>q.chips[j].g).map(j=>`<li>${esc(q.chips[j].t)}</li>`).join('')||'<li class="muted">No key ideas picked</li>'}</ol></div>`;
  const steps=st.route==='typed'?['1 · Plan','2 · Type','3 · Mark']:st.route==='plan'?['1 · Plan','✓ Plan only']:['1 · Plan','2 · Write','3 · Check'];
  const nextBtn=`<div class="row" style="margin-top:12px"><button class="btn" data-a="next">${o.last?'See set summary 🏁':'Next question →'}</button></div>`;
  let h=`<div class="qmeta"><span class="tag">Question ${i+1}</span><span class="tag">${esc(q.skill||q.topic)}</span>${o.week?`<span class="tag">Week ${o.week}</span>`:''}<span class="tag">${q.marks||6} marks</span><button class="btn ghost sm rst" data-a="restart" title="Restart this question">↺ Restart</button>${rptBtn(q.id,(qIndex()[q.id]||{}).label||q.skill||q.topic)}</div>
  <h3 style="font-weight:600">${esc(q.q)}</h3><div class="steps">${steps.map((s,j)=>`<span class="${st.done&&j===steps.length-1||j===st.step?'on':j<st.step||st.done?'done':''}">${j<st.step||st.done&&j<steps.length-1?'✓ ':''}${s}</span>`).join('')}</div>`;
  if(st.step===0&&!(st.done&&st.route==='plan')){
    h+=`<p class="muted" style="font-size:.9rem">Tap the ideas you would use in your answer. Some are decoys.</p><div class="chips">${st.order.map(j=>{const ch=q.chips[j],s=st.sel.includes(j);
      let cls=s?'sel':'';if(st.checked)cls=ch.g?(s?'good':'miss'):(s?'bad':'');return `<button class="chip ${cls}" data-j="${j}" ${st.checked?'disabled':''}>${esc(ch.t)}</button>`}).join('')}</div>`;
    if(st.checked){const hit=st.sel.filter(j=>q.chips[j].g).length,bad=st.sel.filter(j=>!q.chips[j].g);
      h+=`<div class="fb ${bad.length?'no':'ok'}"><b>${hit}/${good.length} key ideas · ${bad.length} decoy${bad.length===1?'':'s'}</b>${bad.map(j=>`<div>✗ <i>${esc(q.chips[j].t)}</i>: ${esc(q.chips[j].why||'')}</div>`).join('')}${hit<good.length?'<div>Dashed chips are ideas you left out. You don\'t need all of them, but they could earn marks.</div>':''}</div>
      ${planHTML}<h4 style="margin-bottom:8px">How do you want to finish?</h4><div class="routes">
      <button class="route" data-a="rplan"><span>📝</span><b>Plan only</b><small>Move on now. Keeps your plan XP.</small></button>
      <button class="route" data-a="rpaper"><span>✍️</span><b>Write on paper</b><small>Timed, about ${mins} min. Full XP.</small></button>
      <button class="route" data-a="rtyped"><span>⌨️</span><b>Type my answer</b><small>Type or speak it. Automatic check of key ideas.</small></button></div>
      <div class="row" style="margin-top:10px"><button class="btn ghost sm" data-a="replan">Re-plan</button></div>`}
    else h+=`${typeof hintHTML==='function'&&st.sel?hintHTML(q,st):''}<div class="row" style="margin-top:14px"><button class="btn" data-a="check" ${st.sel.length?'':'disabled'}>Check my plan</button><span class="muted" style="font-size:.85rem">${st.sel.length} selected</span></div>`}
  else if(st.route==='plan'){
    h+=`${planHTML}<div class="fb ok"><b>✓ Finished with your plan.</b> Want more practice and XP? You can still write or type it.</div>
    <div class="row" style="margin-top:10px"><button class="btn ghost sm" data-a="rpaper">✍️ Write on paper</button><button class="btn ghost sm" data-a="rtyped">⌨️ Type my answer</button></div>${nextBtn}`}
  else if(st.route==='paper'&&st.step===1){
    h+=`${planHTML}<div class="timer" id="t-${q.id}">${mins}:00</div><div class="row" style="justify-content:center"><button class="btn" data-a="tgo">Start</button><button class="btn ghost" data-a="tstop">Stop</button><button class="btn gold" data-a="done">I've finished writing</button></div>
    <p class="muted" style="text-align:center;font-size:.85rem;margin-top:10px">Write your full answer on paper. Aim for about ${mins} minutes. <a href="javascript:void 0" data-a="back">Choose another way</a></p>`}
  else if(st.route==='paper'){
    h+=`<p>Read your answer on paper and tick what is true:</p><div class="checks">${q.checks.map((t,j)=>`<label><input type="checkbox" data-k="${j}" ${st.ticks.includes(j)?'checked':''} ${st.done?'disabled':''}> ${esc(t)}</label>`).join('')}</div>
    ${st.done?`<div class="fb ok"><b>Done.</b> ${st.ticks.length}/${q.checks.length} checks met. ${st.ticks.length<q.checks.length?'Try the missing ones next time.':'Excellent work.'}</div>${nextBtn}`:`<button class="btn" data-a="fin">Finish</button>`}`}
  else if(st.route==='typed'&&st.step===1){const w=words(st.txt);
    h+=`${planHTML}<label for="ta-${q.id}">Type your answer</label><textarea id="ta-${q.id}" class="answer" placeholder="Use your plan: define, explain, apply to the example, then evaluate. Pasting is turned off: type or speak your own answer.">${esc(st.txt||'')}</textarea>
    <div class="interim" id="im-${q.id}"></div><div class="row" style="justify-content:space-between;margin-top:2px"><span class="muted" style="font-size:.85rem" id="wc-${q.id}">${w} words · aim for 150–250</span><span class="muted" style="font-size:.85rem" id="sw-${q.id}"></span></div>
    <div class="flagnote" id="fn-${q.id}">${st.fl&&st.fl.paste?'⚠️ Paste blocked. Type or speak your own answer.':st.fl&&st.fl.bigKept?'ℹ️ A large insert was kept and noted for your lecturer.':''}</div>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">Pasting is turned off. Typing and speaking are welcome: use 🎤 Speak or your keyboard's voice typing. Large inserts are kept but recorded for your lecturer.</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-a="tdone">Check my answer →</button>${SR?`<button class="btn ghost sm mic" data-a="mic" aria-pressed="false">🎤 Speak</button>`:''}${st.sw?'':'<button class="btn ghost sm" data-a="sw">⏱ Show a timer</button>'}<button class="btn ghost sm" data-a="back">Choose another way</button></div>`}
  else if(st.route==='typed'){const C=st.chk||CONCEPT.checkAnswer(q,st.txt||'',namesFor(q,o)),SL={def:'Defines the key term',ex:'Gives an example or names the case/company',ev:'Evaluates (however, but, therefore…)',rec:'Makes a recommendation or judgement'};
    const why=typedNoXP(st,C);
    h+=`<details class="mine"><summary>Your answer (${C.words} words)</summary><p>${esc(st.txt||'').replace(/\n/g,'<br>')}</p></details>
    <div class="autob"><b class="big">${C.band}/6</b><div><b>Automatic check</b><div class="muted" style="font-size:.85rem">${esc(BANDS6[C.band][1])} · ${C.found.length} of ${C.need} key ideas · ${Object.values(C.struct).filter(Boolean).length}/4 structure</div></div></div>
    <h4>Key ideas in a strong answer</h4><ul class="ck">${good.map(j=>{const f=C.found.includes(j);return `<li class="${f?'':'no'}"><i>${f?'✅':'○'}</i><span>${esc(q.chips[j].t)}${f?'':' <span class="tag">not found</span>'}</span></li>`}).join('')}</ul>
    <h4>Structure</h4><ul class="ck">${Object.keys(SL).map(k=>`<li class="${C.struct[k]?'':'no'}"><i>${C.struct[k]?'✅':'○'}</i><span>${SL[k]}</span></li>`).join('')}</ul>
    <p class="muted" style="font-size:.82rem">The check looks for key words and phrases, so it can miss ideas written in very different words. ${cloudOn()?'Your lecturer may also mark this answer.':''}</p>
    ${reviewHTML_(st.ak)}
    <h4>How do you rate it? <span class="muted" style="font-weight:400;font-size:.85rem">(optional, for your own reflection)</span></h4><div class="bands">${BANDS6.map(b=>`<label class="band ${st.band===b[0]?'on':''}"><input type="radio" name="bd-${q.id}" value="${b[0]}" ${st.band===b[0]?'checked':''} ${st.done?'disabled':''}><b>${b[0]}</b><span>${esc(b[1])}</span></label>`).join('')}</div>
    ${st.done?`<div class="fb ${why?'no':'ok'}"><b>Done.</b> ${why?'No XP this time: '+why:'+'+(st.xpGot||C.xp)+' XP from the automatic check.'}</div>${nextBtn}`:`<div class="fb ${why?'no':'ok'}">${why?'No XP this time: '+why:'This answer earns <b>+'+C.xp+' XP</b> when you finish.'}</div><div class="row" style="margin-top:10px"><button class="btn" data-a="tfin">Finish and submit</button><button class="btn ghost sm" data-a="tedit">← Keep editing</button></div>`}`}
  el.innerHTML=h;o.refresh&&o.refresh();
  el.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{const j=+b.dataset.j;st.sel=st.sel.includes(j)?st.sel.filter(x=>x!==j):st.sel.concat(j);save();re()});
  el.querySelector('[data-a="restart"]').onclick=()=>restartItem(qKeys(q.id),'this question',()=>{stopMic();delete U.plansSaved[q.id];LS.del('tm_'+q.id);clearInterval(TIMERS[q.id]);clearInterval(TIMERS['sw'+q.id])})&&re();
  const A=a=>el.querySelector(`[data-a="${a}"]`),on=(a,f)=>el.querySelectorAll(`[data-a="${a}"]`).forEach(b=>b.onclick=f);
  A('check')&&(A('check').onclick=()=>{st.checked=true;const hit=st.sel.filter(j=>q.chips[j].g).length,bad=st.sel.filter(j=>!q.chips[j].g).length;
    countOnce('plan:'+q.id+':'+today(),'plans',o.week&&'bplans');award('plan:'+q.id+':'+today(),15,'Answer plan built');if(!bad&&hit===good.length){countOnce('perfect:'+q.id,'perfect');award('perfect:'+q.id,10,'Flawless plan')}
    weakMark(q,o,bad+(good.length-hit)*.5,true);save();re()});
  on('replan',()=>{st.checked=false;st.sel=[];save();re()});
  on('rplan',()=>{st.route='plan';st.done=true;st.step=0;save();toast('📝','Finished with your plan','Plan XP kept');o.next?o.next():re()});
  on('rpaper',()=>{st.route='paper';st.done=false;st.step=1;save();re()});
  on('rtyped',()=>{st.route='typed';st.done=false;st.step=1;save();re()});
  on('back',()=>{stopMic();LS.del('tm_'+q.id);clearInterval(TIMERS[q.id]);clearInterval(TIMERS['sw'+q.id]);st.route=null;st.step=0;save();re()});
  on('next',()=>o.next?o.next():0);
  if(st.route==='paper'&&st.step===1)timer(q.id,secs,el,ok=>{st.step=2;if(ok){countOnce('timed:'+q.id+':'+today(),'timed',o.week&&'btimed');award('timed:'+q.id+':'+today(),30,'Timed answer finished')}else noTimeXP(secs);save();re()});
  el.querySelectorAll('[data-k]').forEach(b=>b.onchange=()=>{const j=+b.dataset.k;st.ticks=b.checked?st.ticks.concat(j):st.ticks.filter(x=>x!==j);save()});
  A('fin')&&(A('fin').onclick=()=>{st.final=st.done=true;award('check:'+q.id+':'+today(),st.ticks.length*3,'Self-check');if(st.ticks.length<q.checks.length/2)weakMark(q,o,1);save();re()});
  /* typed route */
  const ta=$('#ta-'+q.id);if(ta)typingBox(q,st,ta,el);
  on('sw',()=>{st.sw=Date.now();save();re()});
  on('tdone',()=>{stopMic();st.txt=ta.value;const w=words(st.txt);if(!w){toast('⌨️','Nothing typed yet','Type or speak your answer first');return}
    st.noxp=w<MINWORDS;if(st.noxp&&!confirm(`Only ${w} words.\n\nTyped XP needs at least ${MINWORDS} words. Check it anyway, without XP?`))return;
    const sp=Math.min(st.dw||0,w);st.fast=(st.act||0)/1000<(w-sp)*TYPE_SPW+sp*SPEAK_SPW;st.chk=CONCEPT.checkAnswer(q,st.txt,namesFor(q,o));clearInterval(TIMERS['sw'+q.id]);st.step=2;save();re()});
  on('tedit',()=>{st.step=1;st.chk=null;save();re()});
  el.querySelectorAll(`[name="bd-${q.id}"]`).forEach(b=>b.onchange=()=>{st.band=+b.value;save();re()});
  A('tfin')&&(A('tfin').onclick=()=>{const C=st.chk||CONCEPT.checkAnswer(q,st.txt||'',namesFor(q,o)),why=typedNoXP(st,C);st.done=true;st.xpGot=why?0:C.xp;
    if(st.fast){U.integ=U.integ||{};U.integ.fast=(U.integ.fast||0)+1}
    st.ak=submitAnswer(q,o,st,C);
    if(!why){countOnce('typed:'+q.id+':'+today(),'typed',o.week&&'btyped');award('typed:'+q.id+':'+today(),C.xp,'Typed answer checked')}
    weakMark(q,o,(C.band<=2?2:C.band<=4?1:0)+(C.found.length<C.need/2?1:0));save();re()})}
function shortPage(){
  const weeks=[...new Set(BANK_B.map(q=>q.week))].sort((a,b)=>a-b);let wk=U.bweek||0;if(wk&&!weeks.includes(wk))wk=0;
  const pool=BANK_B.filter(q=>!wk||q.week===wk);
  if(!U.sets._b||!U.sets._b.every(id=>pool.some(q=>q.id===id))){U.sets._b=drawB(pool,[]);save()}
  const qs=U.sets._b.map(id=>BANK_B.find(q=>q.id===id)).filter(Boolean);
  const done=BANK_B.filter(q=>U.log['timed:'+q.id+':'+today()]||Object.keys(U.log).some(k=>k.startsWith('timed:'+q.id+':'))).length;
  shell('#/short',`<h1>Section B · Short answers</h1><p class="muted">${BANK_B.length} practice questions across the subject. Each set has up to 6 questions worth 6 marks: plan with chips, then finish your way: plan only, write on paper (about 10 minutes), or type your answer.</p>
  <div class="card" style="margin-bottom:14px"><div class="bar"><i style="width:${done/BANK_B.length*100}%;background:var(--teal)"></i></div><p class="muted" style="font-size:.8rem;margin:6px 0 12px">${done}/${BANK_B.length} questions answered on paper so far</p>
  <label for="wk" style="margin-top:0">Topic week</label><div class="row"><select id="wk"><option value="0">All weeks</option>${weeks.map(w=>`<option value="${w}" ${w===wk?'selected':''}>Week ${w}: ${esc([...new Set(BANK_B.filter(q=>q.week===w).map(q=>q.topic))].join(', '))}</option>`).join('')}</select>
  <button class="btn gold" id="ns">🎲 New set</button></div></div><div id="qs"></div>`);
  $('#wk').onchange=()=>{U.bweek=+$('#wk').value;clearPlans(U.sets._b);U.sets._b=drawB(BANK_B.filter(q=>!U.bweek||q.week===U.bweek),U.sets._b);U.focus=U.focus||{};U.focus._b=0;save();shortPage()};
  const fresh=ids=>{clearPlans(U.sets._b);U.sets._b=ids;U.focus=U.focus||{};U.focus._b=0;save();shortPage()};
  $('#ns').onclick=()=>{if(confirm('Start a new random set? Your current plans and timers will be cleared.'))fresh(drawB(pool,U.sets._b))};
  player({key:'_b',qs,o:q=>({week:q.week}),next:()=>fresh(drawB(pool,U.sets._b)),weak:()=>{U.bweek=0;fresh(weakSet(BANK_B,6,q=>tk(q,{week:q.week}),U.sets._b))}})}
function drawB(pool,prev){const fresh=pool.filter(q=>!prev.includes(q.id));return shuffle(fresh.length>=Math.min(6,pool.length)?fresh:pool).slice(0,6).map(q=>q.id)}
const FORCES={entrants:'Threat of new entrants',buyers:'Bargaining power of buyers',suppliers:'Bargaining power of suppliers',substitutes:'Threat of substitutes',rivalry:'Rivalry among competitors'};
const DIAMOND={factor:'Factor conditions',demand:'Demand conditions',related:'Related and supporting industries',strategy:'Firm strategy, structure and rivalry',gov:'Government',chance:'Chance'};
const ERRC={E:'Eliminate',R:'Reduce',Ra:'Raise',C:'Create'};
const ENTRY_MODES=['Not entering yet','Exporting through a distributor','Online direct sales','Licensing','Franchising','Management contract','Joint venture','Wholly owned operation'];
const BANDS=[[0,5,'Limited','Describes the business but makes few clear decisions. Little use of the market data or of international marketing concepts.'],[6,11,'Developing','Makes some decisions, but several tasks are missing or only stated. Concepts are named rather than applied.'],[12,15,'Good','A clear decision for every task, backed by data from the table and relevant concepts. Some weighing of options.'],[16,20,'Excellent','A coherent plan where every decision is justified with data and theory, trade-offs are evaluated, the biggest risk has a realistic answer, and the essay is clearly structured.']];
const RUBRIC=['Market choice, order and pace','Entry mode for each market','Supply chain and quality','How the business earns money','Biggest risk and overall justification'];
function sortRows(key,items,opts,sel,checked,ansKey){return items.map((it,j)=>{const v=sel[j]||'',ok=v===it[ansKey];
  return `<div class="sortrow"><div>${esc(it.t)}${checked?`<div class="${ok?'ok-t':'no-t'}" style="font-size:.85rem">${ok?'✓ ':'Our reading: '}${esc(opts[it[ansKey]])}</div>`:''}</div>
  <select data-s="${key}|${j}" ${checked?'disabled':''}><option value="">Choose…</option>${Object.entries(opts).map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`}).join('')}
function chipSet(key,list,sel,checked,single){return `<div class="chips">${list.map((c,j)=>{const s=sel.includes(j);let cls=s?'sel':'';if(checked)cls=c.g?(s?'good':'miss'):(s?'bad':'');
  return `<button class="chip ${cls}" data-c="${key}|${j}|${single?1:0}" ${checked?'disabled':''}>${esc(c.t)}</button>`}).join('')}</div>${checked?list.map((c,j)=>!c.g&&sel.includes(j)?`<div class="fb no">✗ <i>${esc(c.t)}</i>: ${esc(c.why||'')}</div>`:'').join(''):''}`}
function bindTools(el,st,redraw){
  el.querySelectorAll('[data-s]').forEach(s=>s.onchange=()=>{const [k,j]=s.dataset.s.split('|');(st[k]=st[k]||{})[j]=s.value;save()});
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const [k,j,one]=b.dataset.c.split('|'),n=+j;let a=st[k]||[];a=one==='1'?[n]:(a.includes(n)?a.filter(x=>x!==n):a.concat(n));st[k]=a;save();redraw()})}
function score(items,sel,key){return items.filter((it,j)=>(sel||{})[j]===it[key]).length}
function essayPage(){
  shell('#/essay',`<h1>Section C · Strategy & essay</h1><p class="muted">Two kinds of 20-mark practice: structured competitive-advantage questions in three parts, and the Essay Coach for long expansion essays.</p>
  <h2 style="margin-top:20px">🏰 Competitive advantage (a · b · c)</h2><div class="grid g2">${BANK_C.structured.map(s=>{const d=['a','b','c'].filter(p=>(U.cw[s.id+':'+p]||{}).final).length;
    return `<a class="card zone" href="#/essay/ca/${s.id}"><div class="em">${s.icon}</div><h3>${esc(s.name)}</h3><div class="chipline"><span class="tag">${esc(s.tag)}</span><span class="tag">${d}/3 parts done</span></div></a>`}).join('')}</div>
  <h2 style="margin-top:26px">✍️ Essay Coach</h2><p class="muted">Plan an international expansion strategy step by step, then write the essay on paper in 40 minutes.</p><div class="grid g2">${BANK_C.essays.map(s=>{const E=U.ess[s.id]||{};
    return `<a class="card zone" href="#/essay/coach/${s.id}"><div class="em">${s.icon}</div><h3>${esc(s.name)}</h3><div class="chipline"><span class="tag">${esc(s.tag)}</span><span class="tag">${E.final?'✓ Completed':E.planDone?'Plan ready':'Not started'}</span></div></a>`}).join('')}</div>`)}
const PARTS={a:{m:4,mins:7,t:'Definitions and Five Forces'},b:{m:6,mins:11,t:'National advantage: the Diamond'},c:{m:10,mins:18,t:'Strategic Intent and Blue Ocean'}};
function caView(id){
  const s=BANK_C.structured.find(x=>x.id===id);if(!s)return essayPage();
  shell('#/essay',`<p><a href="#/essay">← Section C</a></p><div class="casehead" style="--c:#a98bff"><div class="row"><span style="font-size:2.4rem">${s.icon}</span><div><h1 style="margin:0">${esc(s.name)}</h1><p class="muted" style="margin:0">Competitive advantage · 20 marks</p></div>${rptBtn(s.id,s.name+' (competitive advantage)')}</div></div>
  <div class="card" style="margin-bottom:14px">${s.brief}</div>${['a','b','c'].map(p=>`<div class="card qcard" id="cp-${p}"></div>`).join('')}`);
  ['a','b','c'].forEach(p=>partCard(s,p))}
function partCard(s,p){
  const el=$('#cp-'+p),k=s.id+':'+p,st=U.cw[k]||(U.cw[k]={step:0,ticks:[]}),P=PARTS[p],T=s[p],redraw=()=>partCard(s,p);
  const prompt={a:`Define "competitive advantage" and identify TWO of Porter's Five Forces that affect ${s.name} in its new markets.`,
    b:`Apply Porter's Diamond to analyse whether the Maldives gives ${s.name} a national competitive advantage. Discuss THREE determinants.`,
    c:`Evaluate how ${s.name} could use Strategic Intent and Blue Ocean Strategy to stand out from bigger rivals. Recommend ONE strategic move and justify why competitors would find it hard to copy.`}[p];
  let h=`<div class="qmeta"><span class="tag">Part (${p})</span><span class="tag">${esc(P.t)}</span><span class="tag">${P.m} marks</span><button class="btn ghost sm rst" data-a="restart" title="Restart this part">↺ Restart</button></div><h3 style="font-weight:600">${esc(prompt)}</h3>
  <div class="steps">${['1 · Tool','2 · Write','3 · Check'].map((x,j)=>`<span class="${j===st.step?'on':j<st.step?'done':''}">${j<st.step?'✓ ':''}${x}</span>`).join('')}</div>`;
  if(st.step===0){
    if(p==='a')h+=`<h4>Which is the best definition?</h4>${chipSet('def',T.defs,st.def||[],st.checked,1)}<h4>Sort each fact into a force</h4>${sortRows('f',T.facts,FORCES,st.f||{},st.checked,'f')}`;
    if(p==='b')h+=`<h4>Sort each fact into a Diamond determinant</h4><p class="muted" style="font-size:.88rem">Some facts are strengths, some are weaknesses. Both count in an analysis.</p>${sortRows('d',T.facts,DIAMOND,st.d||{},st.checked,'d')}`;
    if(p==='c')h+=`<h4>Strategic intent: which statements are ambitious, long-term intents?</h4>${chipSet('in',T.intents,st.in||[],st.checked)}
      <h4>Blue Ocean canvas: Eliminate, Reduce, Raise or Create?</h4>${sortRows('e',T.errc,ERRC,st.e||{},st.checked,'z')}
      <h4>Pick ONE strategic move to recommend</h4>${chipSet('mv',T.moves,st.mv||[],st.checked,1)}
      <h4>Why would rivals find it hard to copy?</h4>${chipSet('cp',T.copy,st.cp||[],st.checked)}`;
    if(st.checked){const r=p==='a'?[score(T.facts,st.f,'f'),T.facts.length]:p==='b'?[score(T.facts,st.d,'d'),T.facts.length]:[score(T.errc,st.e,'z'),T.errc.length];
      h+=`<div class="fb ${r[0]===r[1]?'ok':'no'}"><b>${r[0]}/${r[1]} sorted as we would.</b> ${p==='c'?'There is more than one good canvas. Use ours as a check, then decide what you can defend.':'Where you differ, read our reading and decide whether you can justify yours.'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" data-a="go">Write part (${p}) on paper →</button><button class="btn ghost sm" data-a="redo">Redo</button></div>`}
    else h+=`<div class="row" style="margin-top:14px"><button class="btn" data-a="check">Check</button></div>`}
  else if(st.step===1)h+=`<div class="timer" id="t-c_${s.id}_${p}">${P.mins}:00</div><div class="row" style="justify-content:center"><button class="btn" data-a="tgo">Start</button><button class="btn ghost" data-a="tstop">Stop</button><button class="btn gold" data-a="done">I've finished writing</button></div><p class="muted" style="text-align:center;font-size:.85rem;margin-top:10px">Write part (${p}) on paper. Aim for about ${P.mins} minutes.</p>`;
  else{const cl=s.checks[p];h+=`<p>Read part (${p}) on paper and tick what is true:</p><div class="checks">${cl.map((t,j)=>`<label><input type="checkbox" data-k="${j}" ${st.ticks.includes(j)?'checked':''} ${st.final?'disabled':''}> ${esc(t)}</label>`).join('')}</div>
    ${st.final?`<div class="fb ok"><b>Part (${p}) done.</b> ${st.ticks.length}/${cl.length} checks met.</div>`:`<button class="btn" data-a="fin">Finish part (${p})</button>`}`}
  el.innerHTML=h;bindTools(el,st,redraw);
  const A=a=>el.querySelector(`[data-a="${a}"]`);
  A('restart').onclick=()=>restartItem(partKeys(s.id,p),'part ('+p+')',()=>{delete U.cw[k];LS.del('tm_c_'+s.id+'_'+p);clearInterval(TIMERS['c_'+s.id+'_'+p])})&&redraw();
  A('check')&&(A('check').onclick=()=>{st.checked=true;countOnce('ca:'+k+':'+today(),'plans','catool',p==='c'&&'errc');award('ca:'+k+':'+today(),15,'Tool completed');save();redraw()});
  A('redo')&&(A('redo').onclick=()=>{Object.assign(st,{checked:false,def:[],f:{},d:{},in:[],e:{},mv:[],cp:[]});save();redraw()});
  A('go')&&(A('go').onclick=()=>{st.step=1;save();redraw()});
  if(st.step===1)timer('c_'+s.id+'_'+p,P.mins*60,el,ok=>{st.step=2;if(ok){countOnce('catimed:'+k+':'+today(),'timed','catimed');award('catimed:'+k+':'+today(),30,'Part written on paper')}else noTimeXP(P.mins*60);save();redraw()});
  el.querySelectorAll('[data-k]').forEach(b=>b.onchange=()=>{const j=+b.dataset.k;st.ticks=b.checked?st.ticks.concat(j):st.ticks.filter(x=>x!==j);save()});
  A('fin')&&(A('fin').onclick=()=>{st.final=true;award('cacheck:'+k+':'+today(),st.ticks.length*3,'Self-check');
    if(['a','b','c'].every(q=>(U.cw[s.id+':'+q]||{}).final)&&award('cadone:'+s.id,40,'Scenario complete'))countOnce('cadone:'+s.id,'strat');save();redraw()})}
const COACH=['1 · Brief','2 · Plan','3 · Script','4 · Write','5 · Mark'];
function coachView(id){
  const s=BANK_C.essays.find(x=>x.id===id);if(!s)return essayPage();
  const E=U.ess[id]||(U.ess[id]={step:0,sc:{},w:{},ord:{},yr:{},mode:{},marks:{}});
  shell('#/essay',`<p><a href="#/essay">← Section C</a></p><div class="casehead" style="--c:#ffc94d"><div class="row"><span style="font-size:2.4rem">${s.icon}</span><div><h1 style="margin:0">${esc(s.name)}</h1><p class="muted" style="margin:0">Essay Coach · 20 marks · 40 minutes</p></div>${rptBtn(s.id,s.name+' (Essay Coach)')}<button class="btn ghost sm rst" id="erst" title="Restart this essay">↺ Restart</button></div></div>
  <div class="subnav">${COACH.map((t,j)=>`<button data-st="${j}" class="${j===E.step?'on':''}" ${j>1&&!E.planDone?'disabled style="opacity:.45"':''}>${t}</button>`).join('')}</div><div id="pane"></div>`);
  document.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{if(b.disabled)return;E.step=+b.dataset.st;save();coachView(id)});
  $('#erst').onclick=()=>restartItem(essKeys(id),'this essay (plan, script, timer and marks)',()=>{delete U.ess[id];LS.del('tm_e_'+id);clearInterval(TIMERS['e_'+id])})&&coachView(id);
  [coachBrief,coachPlan,coachScript,coachWrite,coachMark][E.step](s,E)}
const next=(s,E,n)=>{E.step=n;save();coachView(s.id);scrollTo(0,0)};
function bandsHTML(){return `<div class="tablewrap"><table><tr><th>Marks</th><th>Level</th><th>What it looks like</th></tr>${BANDS.map(b=>`<tr><td><b>${b[0]}–${b[1]}</b></td><td>${b[2]}</td><td>${b[3]}</td></tr>`).join('')}</table></div>`}
function coachBrief(s,E){
  $('#pane').innerHTML=`<div class="card" style="margin-bottom:14px"><h2>The brief</h2>${s.brief}
  <div class="tablewrap"><table><tr><th>Market</th><th>What you need to know</th></tr>${s.table.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join('')}</table></div>
  <h4>Task</h4><p>Write an essay presenting your international expansion strategy for ${esc(s.name)}. You may focus on one market or several, but your plan must help build a regional brand. Your essay should:</p><ul>${s.tasks.map(t=>`<li>${esc(t)};</li>`).join('')}</ul><p>Justify your decisions using the market information and international marketing concepts.</p></div>
  <div class="card" style="margin-bottom:14px"><h2>How 20 marks are earned</h2><p class="muted">Each of the five tasks is worth about 4 marks. Marks come from <b>decisions + data + concepts + evaluation</b>, not from length.</p>${bandsHTML()}</div>
  <button class="btn" id="nx">Start planning →</button>`;$('#nx').onclick=()=>next(s,E,1)}
function coachPlan(s,E){
  const M=s.table.map(r=>r[0]),tot=M.map((m,i)=>s.criteria.reduce((a,c,j)=>a+(+(E.sc[i+'_'+j]||0))*(+(E.w[j]||1)),0));
  if(!E.chainOrd)E.chainOrd=shuffle(s.chain.concat(s.chainDecoys));if(!E.chain)E.chain=[];
  const redraw=()=>coachView(s.id),tools=[E.entryChk,E.chainChk,E.revChk,E.riskChk,M.some((m,i)=>E.ord[i]&&E.ord[i]!=='0')],ready=tools.every(Boolean);
  const chainOk=E.chain.length===s.chain.length&&E.chain.every((t,i)=>t===s.chain[i]);
  const R=E.risk!=null?s.risks[E.risk]:null;if(R&&!E.mitOrd)E.mitOrd=shuffle(R.m.map(t=>({t,g:1})).concat(R.bad.map(t=>({t,g:0,why:'Does not reduce the risk in a realistic way.'}))));
  $('#pane').innerHTML=`<div class="card" style="margin-bottom:14px"><h2>① Score the markets</h2><p class="muted" style="font-size:.9rem">Score each market 1–5 using the table, and give each factor a weight (×1 to ×3).</p>
  <div class="tablewrap"><table class="wide"><tr><th>Factor</th><th>Weight</th>${M.map(m=>`<th>${esc(m)}</th>`).join('')}</tr>
  ${s.criteria.map((c,j)=>`<tr><td>${esc(c)}</td><td><select data-w="${j}">${[1,2,3].map(n=>`<option ${+(E.w[j]||1)===n?'selected':''}>${n}</option>`).join('')}</select></td>${M.map((m,i)=>`<td><select data-sc="${i}_${j}"><option value="">–</option>${[1,2,3,4,5].map(n=>`<option ${+E.sc[i+'_'+j]===n?'selected':''}>${n}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}
  <tr><th>Total</th><th></th>${tot.map(t=>`<th style="color:var(--gold)">${t}</th>`).join('')}</tr></table></div></div>
  <div class="card" style="margin-bottom:14px"><h2>② Order, pace and entry mode</h2>${M.map((m,i)=>`<div class="sortrow"><b>${esc(m)}</b><div class="row">
    <select data-o="${i}"><option value="">Order…</option>${['1st','2nd','3rd'].map((o,n)=>`<option value="${n+1}" ${E.ord[i]==n+1?'selected':''}>${o}</option>`).join('')}<option value="0" ${E.ord[i]==='0'?'selected':''}>Not in 5 years</option></select>
    <select data-y="${i}"><option value="">Year…</option>${[1,2,3,4,5].map(y=>`<option value="${y}" ${E.yr[i]==y?'selected':''}>Year ${y}</option>`).join('')}</select>
    <select data-m="${i}">${ENTRY_MODES.map(x=>`<option ${E.mode[i]===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div>`).join('')}
    <h4>Which reasons would strengthen your entry choices?</h4>${chipSet('entry',s.entryChips,E.entry||[],E.entryChk)}${E.entryChk?'':'<button class="btn sm" data-a="entry" style="margin-top:10px">Check reasons</button>'}</div>
  <div class="card" style="margin-bottom:14px"><h2>③ Build the supply chain</h2><p class="muted" style="font-size:.9rem">Tap the steps in order. Leave out steps that would harm quality.</p>
  <div class="chips">${E.chainOrd.map(t=>`<button class="chip ${E.chain.includes(t)?'sel':''}" data-ch="${esc(t)}" ${E.chainChk?'disabled':''}>${esc(t)}</button>`).join('')}</div>
  <div class="plan"><ol>${E.chain.map(t=>`<li class="${E.chainChk?(s.chain.includes(t)?'ok-t':'no-t'):''}">${esc(t)}</li>`).join('')||'<li class="muted">Tap steps above</li>'}</ol></div>
  ${E.chainChk?`<div class="fb ${chainOk?'ok':'no'}">${chainOk?'<b>✓ A clean, logical flow.</b>':'<b>One suggested order:</b><ol>'+s.chain.map(t=>`<li>${esc(t)}</li>`).join('')+'</ol>'}</div>`:`<div class="row"><button class="btn sm" data-a="chain" ${E.chain.length?'':'disabled'}>Check flow</button><button class="btn ghost sm" data-a="chclear">Clear</button></div>`}</div>
  <div class="card" style="margin-bottom:14px"><h2>④ How will it earn money?</h2>${chipSet('rev',s.revenue,E.rev||[],E.revChk)}${E.revChk?'':'<button class="btn sm" data-a="rev" style="margin-top:10px">Check revenue streams</button>'}</div>
  <div class="card" style="margin-bottom:14px"><h2>⑤ Biggest risk and how to manage it</h2>
  <div class="chips">${s.risks.map((r,i)=>`<button class="chip ${E.risk===i?'sel':''}" data-rk="${i}" ${E.riskChk?'disabled':''}>${esc(r.r)}</button>`).join('')}</div>
  ${R?`<h4>Ways to manage "${esc(R.r)}"</h4>${chipSet('mit',E.mitOrd,E.mit||[],E.riskChk)}${E.riskChk?'':'<button class="btn sm" data-a="risk" style="margin-top:10px">Check</button>'}`:''}</div>
  <div class="card"><h2>Your plan</h2>${ready?`<ul>${M.map((m,i)=>E.ord[i]&&E.ord[i]!=='0'?`<li><b>${esc(m)}</b>: ${['','1st','2nd','3rd'][E.ord[i]]}${E.yr[i]?', year '+E.yr[i]:''} · ${esc(E.mode[i]||ENTRY_MODES[0])} · score ${tot[i]}</li>`:'').join('')}</ul>
    <p>Revenue: ${(E.rev||[]).filter(j=>s.revenue[j].g).map(j=>esc(s.revenue[j].t)).join('; ')||'none chosen'}.</p><p>Biggest risk: ${esc(R?R.r:'')}.</p>
    ${E.planDone?'':'<button class="btn gold" data-a="plandone">Plan complete · +40 XP</button>'} <button class="btn" data-a="toscript">Go to the essay script →</button>`
    :`<p class="muted">Complete all five tools (choose at least one market to enter, and check each tool) to unlock the next steps.</p>`}</div>`;
  const el=$('#pane');bindTools(el,E,redraw);
  el.querySelectorAll('[data-sc]').forEach(x=>x.onchange=()=>{E.sc[x.dataset.sc]=x.value;save();redraw()});
  el.querySelectorAll('[data-w]').forEach(x=>x.onchange=()=>{E.w[x.dataset.w]=x.value;save();redraw()});
  el.querySelectorAll('[data-o]').forEach(x=>x.onchange=()=>{E.ord[x.dataset.o]=x.value;save();redraw()});
  el.querySelectorAll('[data-y]').forEach(x=>x.onchange=()=>{E.yr[x.dataset.y]=x.value;save()});
  el.querySelectorAll('[data-m]').forEach(x=>x.onchange=()=>{E.mode[x.dataset.m]=x.value;save()});
  el.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{const t=b.dataset.ch;E.chain=E.chain.includes(t)?E.chain.filter(x=>x!==t):E.chain.concat(t);save();redraw()});
  el.querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>{E.risk=+b.dataset.rk;E.mitOrd=null;E.mit=[];save();redraw()});
  const A=a=>el.querySelector(`[data-a="${a}"]`),chk=(f,lbl)=>()=>{E[f]=true;if(award('ess:'+f+':'+s.id+':'+today(),5,lbl))countOnce('ess:'+f+':'+s.id+':'+today(),'esstool');save();redraw()};
  A('entry')&&(A('entry').onclick=chk('entryChk','Entry reasons checked'));A('rev')&&(A('rev').onclick=chk('revChk','Revenue checked'));
  A('risk')&&(A('risk').onclick=chk('riskChk','Risk plan checked'));A('chain')&&(A('chain').onclick=chk('chainChk','Supply chain checked'));
  A('chclear')&&(A('chclear').onclick=()=>{E.chain=[];save();redraw()});
  A('plandone')&&(A('plandone').onclick=()=>{E.planDone=true;countOnce('eplan:'+s.id,'plans','ecplan','eplans');award('eplan:'+s.id,40,'Essay plan complete');save();redraw()});
  A('toscript')&&(A('toscript').onclick=()=>{if(!E.planDone){E.planDone=true;countOnce('eplan:'+s.id,'plans','ecplan','eplans');award('eplan:'+s.id,40,'Essay plan complete')}next(s,E,2)})}
const SCRIPT=[['Introduction','State your overall recommendation in one or two sentences and preview your main decisions.',['This essay recommends that ___ expands into ___ by ___.','The plan rests on three decisions: ___, ___ and ___.']],
 ['Market choice, order and pace','Name the first market and justify it with data from the table. Compare it with the others. Explain the order and timing.',['I recommend entering ___ first because the data shows ___.','Compared with ___, it offers ___, although ___.','___ should follow in year ___ once ___.']],
 ['Entry mode','Give the entry mode for each market and justify it with control, cost and risk.',['In ___, the most suitable entry mode is ___ because ___.','This gives ___ control at ___ cost.','An alternative would be ___, but ___.']],
 ['Supply chain and quality','Describe how the product or service reaches customers and how quality is protected.',['Products will flow from ___ to ___ through ___.','To keep quality consistent, ___.','This matters because ___.']],
 ['Earning money','Explain each revenue stream and why it suits the market.',['___ will earn money through ___ and ___.','The first gives ___; the second ___.']],
 ['Biggest risk','Name the single biggest risk, explain why, and give a realistic way to manage it.',['The biggest risk in this plan is ___, because ___.','To manage it, ___.','If this does not work, ___.']],
 ['Conclusion','Bring the decisions together and link them to building a regional brand.',['Overall, by ___, ___ can become a regional brand because ___.']]];
function coachScript(s,E){
  $('#pane').innerHTML=`<div class="card" style="margin-bottom:14px"><h2>Essay script</h2><p class="muted">Use this structure on paper. The starters give you the shape; the content must be yours, built from your plan.</p></div>
  ${SCRIPT.map((p,i)=>`<div class="card" style="margin-bottom:12px"><div class="num" style="font:800 .8rem Lexend;color:var(--teal)">PARAGRAPH ${i+1}</div><h3>${p[0]}</h3><p class="muted">${p[1]}</p><div class="plan">${p[2].map(x=>`<div>“${esc(x)}”</div>`).join('')}</div></div>`).join('')}
  <div class="card" style="margin-bottom:14px"><h3>Linking words that show analysis</h3><div class="chipline">${['Therefore','However','As a result','Compared with','This suggests','On the other hand','This is supported by','For example','In contrast','Overall'].map(w=>`<span class="tag">${w}</span>`).join('')}</div>
  <p class="muted" style="margin-top:10px">Time guide: about 8 minutes planning, 30 minutes writing, 2 minutes checking.</p></div>
  <button class="btn" id="nx">Start the 40-minute essay →</button>`;$('#nx').onclick=()=>{award('script:'+s.id,10,'Script reviewed');next(s,E,3)}}
function coachWrite(s,E){
  $('#pane').innerHTML=`<div class="card qcard" id="ew"><h2>Write the essay on paper</h2><p class="muted">The first 8 minutes are for planning on paper, using your plan. Then write.</p>
  <div class="tag" id="ph" style="display:block;text-align:center;font-size:.9rem;padding:8px">Planning phase</div><div class="timer" id="t-e_${s.id}">40:00</div>
  <div class="row" style="justify-content:center"><button class="btn" data-a="tgo">Start</button><button class="btn ghost" data-a="tstop">Stop</button><button class="btn gold" data-a="done">I've finished writing</button></div></div>`;
  timer('e_'+s.id,2400,$('#ew'),ok=>{E.written=true;if(ok){countOnce('essay:'+s.id+':'+today(),'timed','essays');award('essay:'+s.id+':'+today(),60,'Essay written on paper')}else noTimeXP(2400);next(s,E,4)},
    left=>{const used=2400-left,ph=$('#ph');if(ph)ph.textContent=used<480?`📝 Planning phase · ${Math.max(0,Math.ceil((480-used)/60))} min left to plan`:left>120?'✍️ Writing phase':'🔎 Check your essay'})}
function coachMark(s,E){
  const tot=RUBRIC.reduce((a,r,i)=>a+(+(E.marks[i]||0)),0),band=BANDS.find(b=>tot>=b[0]&&tot<=b[1]);
  $('#pane').innerHTML=`<div class="card" style="margin-bottom:14px"><h2>Mark your essay</h2><p class="muted">Give yourself 0–4 for each part. Be honest: a decision without data or a concept is worth 1–2 at most.</p>
  ${RUBRIC.map((r,i)=>`<div class="sortrow"><div>${esc(r)}</div><select data-mk="${i}" ${E.final?'disabled':''}>${[0,1,2,3,4].map(n=>`<option ${+(E.marks[i]||0)===n?'selected':''}>${n}</option>`).join('')}</select></div>`).join('')}
  <p style="margin-top:14px;font:700 1.2rem Lexend">${tot}/20 · <span style="color:var(--gold)">${band[2]}</span></p><p class="muted">${band[3]}</p>
  ${E.final?'<div class="fb ok"><b>Essay complete.</b> Try another scenario, or rewrite this one aiming for the next band.</div>':'<button class="btn" id="fin">Save my mark</button>'}</div>
  <div class="card" style="margin-bottom:14px"><h2>Compare with a strong paragraph</h2><p class="muted">One example of the standard to aim for. Yours can reach different decisions; what matters is the decision + data + concept + evaluation.</p><div class="plan">${esc(s.sample)}</div></div>
  <div class="card"><h3>The bands</h3>${bandsHTML()}</div>`;
  document.querySelectorAll('[data-mk]').forEach(x=>x.onchange=()=>{E.marks[x.dataset.mk]=x.value;save();coachMark(s,E)});
  $('#fin')&&($('#fin').onclick=()=>{E.final=true;award('emark:'+s.id+':'+today(),20,'Essay self-marked');save();coachMark(s,E)})}
function badgesPage(){shell('#/badges',`<h1>Badges</h1><p class="muted">${Object.keys(U.badges).length} of ${BADGES.length} unlocked.</p>
 <div class="badges">${BADGES.map(b=>`<div class="badge ${U.badges[b.id]?'got':''}"><div class="ico">${b.ico}</div><b>${b.name}</b><span>${b.d}</span></div>`).join('')}</div>
 <h2 style="margin-top:26px">Levels</h2><div class="card"><div class="tablewrap"><table><tr><th>Level</th><th>Title</th><th>XP needed</th></tr>${LEVELS.map((l,i)=>`<tr style="${level(U.xp).i===i?'color:var(--teal);font-weight:700':''}"><td>${i+1}</td><td>${l[1]}</td><td>${l[0]}</td></tr>`).join('')}</table></div></div>
 <h2 style="margin-top:26px">How to earn XP</h2><div class="card"><div class="tablewrap"><table>
 <tr><td>Read a case section</td><td>+5</td></tr><tr><td>Read a whole case</td><td>+30</td></tr><tr><td>Judge a boardroom argument</td><td>+10 if you agree with our reading, +3 otherwise</td></tr>
 <tr><td>Build an answer plan</td><td>+15 (+10 bonus for a flawless plan). Choosing <b>Plan only</b> keeps this XP and moves on.</td></tr><tr><td>Type (or speak) an answer and check it</td><td>+10, plus +3 for each key idea and +2 for each structure point the automatic check finds, up to +32. Needs at least 40 words, at least one key idea, and your own typing or speech: pasting is turned off.</td></tr><tr><td>Answer marked by your lecturer</td><td>Up to +30, depending on the mark. It stays even if you restart the question.</td></tr><tr><td>Finish a timed answer on paper</td><td>+30 (write for at least 4 of the 10 minutes; any timed task needs 40% of its time on the clock)</td></tr><tr><td>Practise the same question again</td><td>XP and badge progress count once per question per day</td></tr><tr><td>Self-check</td><td>+3 per check met</td></tr>
 <tr><td>Section C: complete a part's tool</td><td>+15</td></tr><tr><td>Section C: write a part on paper</td><td>+30</td></tr><tr><td>Section C: finish a whole scenario</td><td>+40</td></tr>
 <tr><td>Essay Coach: check a planning tool</td><td>+5 each</td></tr><tr><td>Essay Coach: complete a plan</td><td>+40</td></tr><tr><td>Essay Coach: write the 40-minute essay</td><td>+60</td></tr><tr><td>Essay Coach: self-mark</td><td>+20</td></tr>
 <tr><td>Screen time: daily goal (20 active minutes)</td><td>+15 once a day</td></tr><tr><td>Screen time: every 20 active minutes outside live sessions</td><td>+10, up to 6 times a day (+60). Only counts while the portal is on screen and you're active: it pauses after 2 minutes idle, except while a writing timer runs.</td></tr>
 <tr><td>Live session: on screen 85%+ (at least 10 minutes joined)</td><td>+20 once per session</td></tr><tr><td>Hours logged</td><td>Badges at 5, 10 and 20 hours of active screen time</td></tr>
 <tr><td>Practise on a new day</td><td>+10</td></tr><tr><td>Complete the daily mission</td><td>+25 Starter · +35 Pro · +50 Elite (missions get tougher as you level up)</td></tr></table></div></div>`)}
const DEMO_ROWS=[ // [activity, XP each, Student 1 count, Student 2 count]
 ['Practise on a new day',10,6,1],['Daily missions completed (Starter)',25,2,1],['Daily missions completed (Pro)',35,3,0],['Case sections read',5,23,12],['Whole case read',30,2,1],
 ['Boardroom verdicts that match our reading',10,22,11],['Other boardroom verdicts',3,8,9],['Answer plans built',15,12,6],['Flawless plans (bonus)',10,4,0],
 ['Timed answers written on paper',30,8,2],['Self-check points met',3,24,4],['Essay Coach tools checked',5,6,0],['Essay Coach plan completed',40,1,0]];
const DEMO_P=[{n:'Student 1',who:'Practises about 35 minutes a day, 6 days a week',em:'🐢',time:'≈ 3.5 hours',streak:6,
   badges:['🎫','📖','🎙️','😈','🎯','🧱','💎','⏱️','🔥','✅','⭐']},
 {n:'Student 2',who:'Crams in one 4-hour session the night before',em:'🐇',time:'≈ 4 hours',streak:1,badges:['🎫','📖','🎙️','🧱','✅','⭐']}];
function demo(){
  let mode='board';
  const draw=()=>{document.querySelectorAll('[data-dm]').forEach(b=>b.classList.toggle('on',b.dataset.dm===mode));const x1=demoXP(0),x2=demoXP(1);let h='';
    if(mode==='board'){const rows=[['Student 1',x1,11],['Student 3',1010,10],['Student 4',860,9],['Student 5',655,8],['Student 6',540,7],['Student 2',x2,6],['Student 7',310,4],['Student 8',150,2]].sort((a,b)=>b[1]-a[1]);
      h=`<div class="lb">${rows.map((r,i)=>`<div class="r ${r[0]==='Student 1'||r[0]==='Student 2'?'me':''}"><span class="pos ${i<3?'p'+(i+1):''}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><div><b>${r[0]}</b><div class="muted" style="font-size:.8rem">${LEVELS[level(r[1]).i][1]} · ${r[2]} badges</div></div><b class="lex" style="color:var(--gold)">${r[1]} XP</b></div>`).join('')}</div>
      <p class="muted" style="font-size:.85rem;margin-top:10px">Students 1 and 2 are highlighted. Open <b>Student 1 vs Student 2</b> to see why they are so far apart.</p>`}
    else if(mode==='vs'){
      h=`<div class="grid g2">${DEMO_P.map((p,i)=>{const x=demoXP(i),L=level(x);return `<div class="card" style="text-align:center;box-shadow:none"><div style="font-size:2.4rem">${p.em}</div><h3 style="margin:4px 0">${p.n}</h3><p class="muted" style="font-size:.88rem">${p.who}</p>
        <div class="ring" style="--p:${L.pct};margin:0 auto;width:110px;height:110px"><div><b style="font-size:1.5rem">${x}</b><small>XP</small></div></div>
        <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><b style="font-size:1rem">${esc(L.name)}</b><span>level</span></div><div class="stat"><b>🔥 ${p.streak}</b><span>streak</span></div><div class="stat"><b>${p.badges.length}</b><span>badges</span></div></div>
        <p style="font-size:1.3rem;letter-spacing:2px;margin:12px 0 4px">${p.badges.join('')}</p><p class="muted" style="font-size:.8rem;margin:0">Time spent: ${p.time}</p></div>`}).join('')}</div>
      <h3 style="margin-top:18px">Where the XP came from</h3><div class="tablewrap"><table class="wide"><tr><th>Activity</th><th>XP each</th><th>Student 1</th><th>Student 2</th></tr>
      ${DEMO_ROWS.map(r=>`<tr><td>${r[0]}</td><td>+${r[1]}</td><td>${r[2]} × ${r[1]} = <b>${r[1]*r[2]}</b></td><td>${r[3]} × ${r[1]} = <b>${r[1]*r[3]}</b></td></tr>`).join('')}
      <tr><th>Total</th><th></th><th style="color:var(--gold)">${x1} XP</th><th style="color:var(--gold)">${x2} XP</th></tr></table></div>
      <div class="callout" style="margin-top:14px"><b>Less time, ${(x1/x2).toFixed(1)}× the XP.</b> Student 1 spent about the same time but practised a little every day: daily check-ins and missions add up, timed writing on paper earns the most, and repeat practice makes plans flawless.</div>`}
    else h=`<div class="grid g2">${[
      ['📅','Show up daily','+10 for each new day and +25 to +50 for the daily mission. Six short days beat one long night.'],
      ['✍️','Write on paper, timed','+30 per timed answer: the biggest single reward, and the habit that matters most.'],
      ['🎯','Judge the boardroom carefully','+10 when your verdict matches our reading, +3 otherwise. Read the reasons; they teach the theory.'],
      ['💎','Plan without decoys','+15 per plan, +10 more when it has every key idea and no decoys.'],
      ['📖','Read every case in full','+5 a section, +30 for the whole case. Any case could be the one that matters.'],
      ['🏆','Take on the Essay Coach','Up to +60 for the 40-minute essay, plus XP for every planning tool.']
     ].map(t=>`<div class="card" style="box-shadow:none"><div style="font-size:1.8rem">${t[0]}</div><h3 style="margin:6px 0 4px">${t[1]}</h3><p class="muted" style="margin:0;font-size:.92rem">${t[2]}</p></div>`).join('')}</div>`;
    $('#dm').innerHTML=h};
  document.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>{mode=b.dataset.dm;draw()});
  $('#fs').onclick=()=>{const d=$('#demo');if(document.fullscreenElement)document.exitFullscreen();else if(d.requestFullscreen)d.requestFullscreen()};
  draw()}
const REVIEW_NOTES={
 iceto:['Founders\' surnames (Rasheed, Nadha, Zahir) and the four other people are invented','Flagship cost estimate: about USD 450,000, more than half of available cash','7-Eleven Singapore sales peaks: 2–5 pm near schools and universities, after 9 pm near offices and housing','Exhibit 4 (market snapshot), Exhibit 6 (freezer price ladder) and Exhibit 7 (brand calendar) were added for the extended case','Magnum pop-up description is simplified from public information'],
 cbtl:['All seven people are invented','Survey of 400 people: 62% visit a café at least 3 times a week; only 18% would regularly pay more than MVR 70','Exhibit 2 cost shares, Exhibit 4 price ranges and Exhibit 6 first-months results are invented','Hulhumalé café details: about 60 seats, two trainer visits, equipment held at the port','Waterscape\'s Maldivian black tea test (six months) is invented','CBTL history (Brentwood 1963, Ice Blended 1987, Singapore 1996, Jollibee 2019, ~1,200 cafés) is from public information, simplified'],
 tuna:['Kandu Bites, its founder and every person in the case are invented','Exhibit 1 figures: ~180,000 packs, MVR 11 million, capacity ~400,000 packs, USD 60,000 budget','Import duties: about 20% into the EU and a "modest" duty into Japan are case assumptions','Exhibit 3 margins and freight costs, Exhibit 5 tasting scores and Exhibit 6 price escalation are invented','Population figures for Japan (~124 million) and Italy (~59 million) are approximate']};
function reviewHTML(){const rv=LS.get('review',{}),num=t=>esc(t).replace(/(\b(?:MVR|USD|SGD|MYR|THB|EUR|JPY)\s?)?\d[\d,.]*\s?(%|percent|million|billion|years?|divers|boats|users|craftspeople|followers|outlets|stores)?/g,m=>`<mark>${m}</mark>`);
  const strip=h=>String(h).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),box=(id,html)=>`<label class="rv"><input type="checkbox" data-rv="${id}" ${rv[id]?'checked':''}><span>${html}</span></label>`;
  const cases=CASES.map(c=>{const ppl=[...(c.sections.find(x=>x.id==='people')||{html:''}).html.matchAll(/<b>([^<]+)<\/b><span>([^<]+)<\/span>/g)].map(m=>m[1]+' ('+m[2]+')');
    return `<details class="mine"><summary>${c.icon} ${esc(c.title)}</summary><p class="muted" style="font-size:.85rem">${esc(c.note)}</p>
    <h4>Check these</h4>${(REVIEW_NOTES[c.id]||[]).map((t,j)=>box(c.id+':n'+j,esc(t))).join('')}
    <h4>People</h4>${box(c.id+':ppl',esc(ppl.join(' · ')))}
    <h4>Exhibits</h4>${c.exhibits.map((x,j)=>box(c.id+':x'+j,`<b>${esc(x.title)}</b><br><span class="muted" style="font-size:.85rem">${x.rows.map(r=>num(r.join(': '))).join(' · ')}</span>`)).join('')}</details>`}).join('');
  const sc=BANK_C.structured.concat(BANK_C.essays).map(x=>box('c:'+x.id,`<b>${x.icon} ${esc(x.name)}</b> <span class="muted">· ${esc(x.tag)}</span><br><span style="font-size:.88rem">${num(strip(x.brief))}</span>${x.table?`<br><span class="muted" style="font-size:.82rem">${x.table.map(r=>num(r.join(': '))).join('<br>')}</span>`:''}`)).join('');
  const named=BANK_B.map(q=>[q,REAL.filter(n=>JSON.stringify(q).includes(n))]).filter(x=>x[1].length);
  const bq=named.map(([q,n])=>box('b:'+q.id,`<b>${esc(n.join(', '))}</b> in ${esc(q.id)} (Week ${q.week}, ${esc(q.topic)}): <span class="muted" style="font-size:.85rem">${esc(q.q)}</span>`)).join('');
  return `<p class="muted" style="font-size:.9rem;margin-top:0">Everything below was created or simplified for practice. Tick each item once you've checked it. Ticks are saved on this device. Numbers are highlighted.</p>
  <h3>Section A cases</h3>${cases}<h3 style="margin-top:16px">Section C companies</h3><details class="mine"><summary>All ${BANK_C.structured.length+BANK_C.essays.length} Section C scenarios (all invented)</summary>${sc}</details>
  <h3 style="margin-top:16px">Section B: real organisations named</h3><details class="mine"><summary>${named.length} question${named.length===1?'':'s'} name real organisations: check the claims</summary>${bq||'<p class="muted">None found.</p>'}</details>`}
function studentPage(sid){
  if(ME.sid!==LECTURER)return home();
  if(!cloudOn())return shell('#/lecturer',`<p><a href="#/lecturer">← Lecturer</a></p><div class="callout">Student profiles need the live connection. Sign in with your PIN while online to open them.</div>`);
  if(!/^S0\d{5}$/.test(sid||''))return lecturer();
  shell('#/lecturer',`<p><a href="${esc(PFROM||'#/lecturer')}" id="pback">← Back</a></p><div id="prof"><p class="muted">Loading ${esc(sid)}…</p></div>`);
  let X,RV,open=null,tab='ans';const drafts={},OPEN=new Set();
  const draw=force=>{const el=$('#prof');if(!el||X===undefined||RV===undefined)return;const ae=document.activeElement;if(!force&&ae&&el.contains(ae)&&/TEXTAREA|INPUT|SELECT/.test(ae.tagName))return;
    if(!X||!X.u){el.innerHTML=`<div class="card"><h2>${esc(sid)}</h2><p class="muted">This student hasn't signed in with a PIN yet, so there is no saved progress. (Email: ${esc(CLOUD.email(sid))})</p></div>${actionsHTML()}`;bindActions();return}
    const u=Object.assign({log:{},days:[],badges:{},n:{}},X.u),L=level(u.xp|0),I=qIndex();
    const ans=Object.entries(u.ans||{}).sort((a,b)=>String(a[1].at)<String(b[1].at)?1:-1),notes=Object.entries(RV).filter(([k])=>isNote(k)).sort((a,b)=>String(a[1].at)<String(b[1].at)?1:-1);
    const marked=ans.filter(([k])=>RV[k]).length,first=[...(u.days||[])].sort()[0];
    if(!OPEN.init){OPEN.init=1;if(ans.some(([k])=>!RV[k]))OPEN.add('ans')}
    const ansItem=([k,a])=>{const e=I[a.q],r=RV[k],good=e?e.q.chips.filter(c=>c.g).length:0,fl=a.fl||{},flt=flagText(fl);
      const d=drafts[k]||{band:r?r.band:a.b|0,xp:r?r.xp:Math.min(30,(a.b|0)*4),fb:r?r.fb:''};
      return `<div class="mqi" data-k="${esc(k)}"><div class="row" style="justify-content:space-between"><b style="font-size:.9rem">${esc(e?e.label:a.q)}</b><span class="muted" style="font-size:.8rem">${esc(String(a.at||'').slice(0,16).replace('T',' '))}</span></div>
      <div class="muted" style="font-size:.85rem">${esc(e?e.q.q.slice(0,140):'')}${e&&e.q.q.length>140?'…':''}</div>
      <div style="font-size:.85rem;margin:4px 0">${a.w|0} words · automatic ${a.b|0}/6 · key ideas ${(a.f||[]).length}/${good}${flt?` · <span style="color:var(--gold)">⚠️ ${esc(flt)}</span>`:''}${r?` · <b>marked ${r.band}/6, +${r.xp} XP</b> <span class="muted">(${r.by==='lecturer'?'you':'Claude'})</span>`:' · <span class="tag">not marked</span>'}</div>
      ${r&&r.fb&&open!==k?`<p class="muted" style="font-size:.85rem;margin:4px 0">“${esc(r.fb)}”</p>`:''}
      ${open===k?`<div class="answerprev">${esc(a.t||'').replace(/\n/g,'<br>')}</div>${flagEvHTML(fl)}
      <div class="row" style="margin-top:8px"><label class="inl">Band <select data-f="band">${[0,1,2,3,4,5,6].map(b=>`<option value="${b}" ${b===d.band?'selected':''}>${b}</option>`).join('')}</select></label><label class="inl">XP <input type="number" min="0" max="30" data-f="xp" value="${d.xp}"></label></div>
      <textarea data-f="fb" maxlength="600" style="min-height:80px;margin-top:8px" placeholder="Feedback: one strength, the most important missing point, one tip">${esc(d.fb||'')}</textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-save>Save mark</button><button class="btn ghost sm" data-close>Close</button></div><div class="err" data-er></div>`
      :`<button class="btn ghost sm" data-open style="margin-top:4px">${r?'Read · edit mark':'Read and mark'}</button>`}</div>`};
    el.innerHTML=`<div class="card psec"><div class="prof-h"><div class="av">${esc((X.name||sid).trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase())}</div>
      <div><h1 style="margin:0">${esc(X.name||sid)}</h1><p class="muted" style="margin:2px 0 0">🎓 ${esc(L.name)} · <b>${u.xp|0} XP</b>${L.to?' · '+(L.to-(u.xp|0))+' XP to '+esc(LEVELS[L.i+1][1]):' · top level'}</p>
      <div class="bar" style="margin-top:8px"><i style="width:${L.pct}%;background:var(--teal)"></i></div></div></div>
      <div class="kv"><div>ID<b>${esc(sid)}</b></div><div>Student email<b>${esc(CLOUD.email(sid))}</b></div><div>Name (class list)<b>${u.dn?esc(u.dn):'not added yet'}</b></div><div>Username<b>${u.un?esc(u.un):'not picked yet'}</b></div>
      <div>Streak<b>🔥 ${streak(u)} day${streak(u)===1?'':'s'}</b></div><div>Last active<b>${ago(X.ts)}</b></div><div>First practised<b>${esc(first||'–')}</b></div></div>
      ${profSumHTML(u,{last:X.ts,risk:riskOf(X)})}<div class="row" style="margin-top:10px"><button type="button" class="btn sm" data-va="${esc(sid)}">👁 View as student</button></div></div>
    ${secsHTML(profSections(u,{sid,lect:1,marked}),OPEN)}${integSecHTML(u,OPEN)}
    ${secsHTML([{id:'ans',ico:'✍️',t:'Typed answers',sum:`${ans.length} answer${ans.length===1?'':'s'} · ${marked} marked`,html:(ans.length?ans.slice(0,30).map(ansItem).join(''):'<p class="muted">No typed answers yet.</p>')+(ans.length>30?'<p class="muted" style="font-size:.85rem">Showing the newest 30.</p>':'')},
      {id:'msgs',ico:'✉️',t:"Messages you've sent",sum:notes.length?notes.length+' sent':'None yet',html:notes.length?notes.map(([k,v])=>`<div class="note" style="border-left:3px solid var(--teal);padding:6px 10px;margin-top:6px"><p style="margin:0">${esc(v.fb)}</p><span class="muted" style="font-size:.8rem">${esc(String(v.at).slice(0,16).replace('T',' '))} · ${u.notes&&u.notes[k]?(u.notesRead&&u.notesRead[k]?'read':'delivered'):'not opened yet'}</span></div>`).join(''):'<p class="muted">None yet.</p>'}],OPEN)}
    ${profileXHTML(sid,u)}${nameEditHTML(sid,u)}${actionsHTML()}`;
    secsBind(el,OPEN);bindActions();
    el.querySelectorAll('.mqi').forEach(box=>{const k=box.dataset.k,a=(u.ans||{})[k],r=RV[k];
      box.querySelector('[data-open]')&&(box.querySelector('[data-open]').onclick=()=>{open=k;draw(1)});
      box.querySelector('[data-close]')&&(box.querySelector('[data-close]').onclick=()=>{open=null;delete drafts[k];draw(1)});
      box.querySelectorAll('[data-f]').forEach(f=>f.oninput=f.onchange=()=>{const d=drafts[k]||(drafts[k]={band:r?r.band:a.b|0,xp:r?r.xp:Math.min(30,(a.b|0)*4),fb:r?r.fb:''});
        d[f.dataset.f]=f.dataset.f==='fb'?f.value:+f.value;if(f.dataset.f==='band'&&!r&&!d.xpSet){d.xp=Math.min(30,d.band*4);box.querySelector('[data-f="xp"]').value=d.xp}if(f.dataset.f==='xp')d.xpSet=1});
      box.querySelector('[data-save]')&&(box.querySelector('[data-save]').onclick=async()=>{const g=x=>box.querySelector(`[data-f="${x}"]`);
        const v={q:a.q,band:Math.max(0,Math.min(6,+g('band').value|0)),xp:Math.max(0,Math.min(30,+g('xp').value|0)),fb:g('fb').value.trim().slice(0,600),at:new Date().toISOString(),by:'lecturer'};
        const b=box.querySelector('[data-save]');b.disabled=true;b.textContent='Saving…';
        try{await CLOUD.saveReview(sid,k,v);delete drafts[k];open=null;toast('✅','Mark saved',v.band+'/6, +'+v.xp+' XP');draw(1)}catch(e){b.disabled=false;b.textContent='Save mark';box.querySelector('[data-er]').textContent=CLOUD.say(e)}})})};
  function actionsHTML(){return `<div class="card psec"><h2>Actions</h2>
    <label for="pnote">Send a message</label><textarea id="pnote" maxlength="600" style="min-height:80px" placeholder="E.g. Great progress this week! Try the Essay Coach next."></textarea>
    <div class="row" style="margin-top:8px"><button class="btn sm" id="psend">✉️ Send message</button><span class="muted" style="font-size:.82rem">They see it on their Home page next time they open the portal. No XP.</span></div>
    <div class="row" style="margin-top:14px"><button class="btn ghost sm" id="preset">🔑 Send PIN reset email</button><button class="btn ghost sm" id="pdl">⬇ Download data (JSON)</button></div><div class="err" id="perr"></div></div>`}
  function bindActions(){
    $('#psend').onclick=async()=>{const t=$('#pnote').value.trim().slice(0,600);if(!t){$('#perr').textContent='Write a message first.';return}const b=$('#psend');b.disabled=true;
      try{await CLOUD.saveReview(sid,'note_'+Date.now().toString(36),{q:'note',band:0,xp:0,fb:t,at:new Date().toISOString(),by:'lecturer'});$('#pnote').value='';$('#perr').textContent='';toast('✉️','Message sent',(X&&X.name)||sid);draw(1)}
      catch(e){$('#perr').textContent=CLOUD.say(e)}b.disabled=false};
    $('#preset').onclick=async()=>{if(!confirm(`Send a PIN reset email to ${CLOUD.email(sid)}?\n\nThe student chooses a new PIN from the link. Their progress is kept.`))return;
      try{await CLOUD.reset(sid);toast('🔑','Reset email sent',CLOUD.email(sid))}catch(e){$('#perr').textContent=CLOUD.say(e)}};
    $('#pdl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({sid,name:X&&X.name,lastActive:X&&X.ts,progress:X&&X.u,reviews:RV},null,1)],{type:'application/json'}));a.download='mkt301-'+sid+'-'+today()+'.json';a.click()}}
  const err=e=>{const el=$('#prof');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`};
  CLOUD.watchStudent(sid,x=>{X=x;draw()},err);CLOUD.watchReview(sid,r=>{RV=r;draw()},err);presProfileWatch(()=>draw())}

/* the course's parts of a profile (engine/simple.js): shared by the lecturer's view of a student and the student's own My progress */
function profCourse(u,ctx){const n=u.n||{},done=practised(u);
  const weeks=[...new Set(BANK_B.map(q=>q.week))].sort((a,b)=>a-b),W=((u.wk||{}).t)||{};
  const topicRows=weeks.map(w=>{const qs=BANK_B.filter(q=>q.week===w),d=qs.filter(q=>done.has(q.id)).length,wk=W['w'+w];
  return `<div class="pb"><span><b>Week ${w}</b><br><span class="muted" style="font-size:.8rem">${esc([...new Set(qs.map(q=>q.topic))].slice(0,3).join(', '))}</span></span>
  <div class="bar"><i style="width:${(d/qs.length*100)|0}%;background:var(--teal)"></i></div><span style="text-align:right;font-size:.82rem">${d}/${qs.length} practised${wk&&wk[1]?'<br>⚠️ weak-spot '+wk[1]:''}</span></div>`}).join('');
  const scRows=BANK_C.structured.map(sc=>{const ps=['a','b','c'].map(p=>[p,(u.cw||{})[sc.id+':'+p]||{}]);
  return `<div class="pb"><span>${sc.icon||'🏰'} <b>${esc(sc.name)}</b></span><div class="bar"><i style="width:${(ps.filter(x=>x[1].final).length/3*100)|0}%"></i></div>
  <span style="text-align:right;font-size:.82rem">${ps.map(([p,st])=>'('+p+') '+(st.final?'✓ '+((st.ticks||[]).length)+' checks':st.step>=1?'writing':st.checked?'tool done':'–')).join(' · ')}</span></div>`}).join('');
  const esRows=BANK_C.essays.map(e=>{const E=(u.ess||{})[e.id]||{},tot=RUBRIC.reduce((a,r,i)=>a+(+((E.marks||{})[i]||0)),0);
  return `<div class="pb"><span>${e.icon||'✍️'} <b>${esc(e.name)}</b></span><div class="bar"><i style="width:${Math.min(100,((E.step|0)/4)*100)}%"></i></div>
  <span style="text-align:right;font-size:.82rem">${E.final?'self-marked <b>'+tot+'/20</b>':E.written?'written, not marked':E.planDone?'plan done':E.step?'step '+((E.step|0)+1)+' of 5':'not started'}</span></div>`}).join('');
  const caseRows=CASES.map(c=>{const rd=c.sections.filter(s=>u.log['read:'+c.id+':'+s.id]).length,vs=c.boardroom.map((a,i)=>[a,(u.verd||{})[c.id+':'+i]]).filter(x=>x[1]),ok=vs.filter(x=>x[1]===x[0].v).length,
  qd=c.questions.filter(q=>done.has(q.id)).length;
  return `<div class="pb"><span>${c.icon} <b>${esc(c.title)}</b></span><div class="bar"><i style="width:${(rd/c.sections.length*100)|0}%"></i></div>
  <span style="text-align:right;font-size:.82rem">read ${rd}/${c.sections.length} · Boardroom ${vs.length}/${c.boardroom.length}${vs.length?' ('+Math.round(ok/vs.length*100)+'% match)':''}<br>practice ${qd}/${c.questions.length}</span></div>`}).join('');
  const bDone=BANK_B.filter(q=>done.has(q.id)).length,sDone=BANK_C.structured.filter(sc=>['a','b','c'].every(p=>((u.cw||{})[sc.id+':'+p]||{}).final)).length,eDone=BANK_C.essays.filter(e=>((u.ess||{})[e.id]||{}).final).length;
  const rd=CASES.reduce((t,c)=>t+c.sections.filter(s=>u.log['read:'+c.id+':'+s.id]).length,0),all=CASES.reduce((t,c)=>t+c.sections.length,0);
  return {stats:[[n.plans|0,'plans'],[n.verdicts|0,'Boardroom calls'],[n.catool|0,'strategy tools'],[n.timed|0,'timed'],[n.typed|0,'typed'],[ctx.marked|0,'marked'],[n.strat|0,'strategy scenarios'],[n.essays|0,'essays'],[n.missions|0,'missions']],
    secs:[{id:'secb',ico:'🧩',t:'Section B by week',sum:bDone+'/'+BANK_B.length+' short answers practised',html:'<p class="muted" style="font-size:.82rem;margin-top:0">Bar: short-answer questions practised. ⚠️ weak-spot score.</p>'+topicRows},
      {id:'secc',ico:'🏆',t:'Section C',sum:sDone+'/'+BANK_C.structured.length+' scenarios · '+eDone+'/'+BANK_C.essays.length+' essays finished',html:`<h3 style="margin-top:0">Competitive advantage</h3>${scRows}<h3 style="margin-top:12px">Essay Coach</h3>${esRows}`}],
    cases:{sum:rd+'/'+all+' case sections read',html:caseRows}}}

/* ---------- course hooks for the engine ---------- */
const CASE_ALL=CASES,BANK_B_ALL=BANK_B;
const caseName=c=>c.title,caseNames=c=>[c.title];
const isB=o=>!!o.week,bArea=q=>'w'+q.week,bQLabel=q=>'Week '+q.week+': '+q.topic,bLabel=k=>{const w=+k.slice(1);return 'Week '+w+': '+[...new Set(BANK_B.filter(q=>q.week===w).map(q=>q.topic))].join(', ')};
ROUTES.case=h=>caseView(h[1],h[2]||'read');
ROUTES.short=()=>shortPage();
ROUTES.essay=h=>h[1]==='ca'?caView(h[2]):h[1]==='coach'?coachView(h[2]):essayPage();

/* ---------- dashboard hooks (engine/dash.js): readiness areas and flashcard decks ---------- */
function readyAreas(u){const P=practised(u),W=((u.wk||{}).t)||{},acc=ks=>{let a=0,m=0;ks.forEach(k=>{const r=W[k];if(r){a+=r[0];m+=r[1]}});return a?Math.max(0,1-m/a):null};
  const out=CASE_ALL.map(c=>({k:'c:'+c.id,label:caseName(c),href:'#/case/'+c.id+'/practice',cov:c.questions.filter(q=>P.has(q.id)).length/Math.max(1,c.questions.length),acc:acc(Object.keys(W).filter(k=>k.startsWith(c.id+'|')))}));
  [...new Set(BANK_B.map(q=>q.week))].sort((a,b)=>a-b).forEach(w=>{const qs=BANK_B.filter(q=>q.week===w);out.push({k:'w'+w,label:'Week '+w+': '+[...new Set(qs.map(q=>q.topic))].slice(0,2).join(', '),href:'#/short',cov:qs.filter(q=>P.has(q.id)).length/qs.length,acc:acc(['w'+w])})});
  return out}
/* "Term: meaning" key ideas from the Section B plans, one deck per week */
function flashDecks(){const D={};BANK_B.forEach(q=>q.chips.forEach(c=>{const m=c.g&&/^([^:]{2,40}): (.+)$/.exec(c.t);if(!m)return;const d=D[q.week]||(D[q.week]={k:'w'+q.week,label:'Week '+q.week,cards:[],seen:new Set()});
  if(!d.seen.has(m[1].toLowerCase())){d.seen.add(m[1].toLowerCase());d.cards.push([m[1],m[2]])}}));
  return Object.keys(D).sort((a,b)=>a-b).map(w=>({k:D[w].k,label:D[w].label+' · '+[...new Set(BANK_B.filter(q=>q.week===+w).map(q=>q.topic))].slice(0,2).join(', '),cards:D[w].cards})).filter(d=>d.cards.length>=3)}

/* practice paper (engine/paper.js): a case, short answers and a strategy essay, 180 minutes in all */
function paperSpec(rng){const pick=(a,n)=>{a=a.slice();const o=[];while(a.length&&o.length<n)o.push(a.splice(Math.floor(rng()*a.length),1)[0]);return o};
  const ideas=q=>q.chips.filter(c=>c.g).map(c=>c.t);
  const c=pick(CASES,1)[0],slots=[...new Set(c.questions.map(q=>q.slot))].sort();
  const A=slots.map(s=>pick(c.questions.filter(q=>q.slot===s),1)[0]).map(q=>({id:q.id,kind:'written',q:q.q,ideas:ideas(q),label:c.title+': '+q.skill}));
  const wk=pick([...new Set(BANK_B.map(q=>q.week))],4),B=wk.map(w=>pick(BANK_B.filter(q=>q.week===w),1)[0]).map(q=>({id:q.id,kind:'written',q:q.q,ideas:ideas(q),label:'Week '+q.week+' · '+q.topic}));
  const e=pick(BANK_C.essays,1)[0],cap=t=>t[0].toUpperCase()+t.slice(1);
  return [{k:'a',title:'Case study: '+c.title,mins:70,note:'Answer every question about the case. You can open the case in a new tab.',items:A.map((x,i)=>i?x:Object.assign(x,{html:`<p><a href="#/case/${c.id}/read" target="_blank" rel="noopener">📖 Open ${esc(c.title)} in a new tab</a></p>`}))},
    {k:'b',title:'Short answers',mins:50,note:'Four short answers. Explain each idea and use an example.',items:B},
    {k:'c',title:'Strategy essay: '+e.name,mins:60,note:'Read the brief, plan for a few minutes, then write.',items:[{id:'pc_'+e.id,kind:'written',q:'Write a strategy report for '+e.name+'. In it, '+e.tasks.join('; ')+'.',html:e.brief,ideas:e.tasks.map(cap).concat(['Used evidence from the brief','Ended with a clear recommendation and its main risk']),label:e.tag}]}]}

/* quick quiz items (engine/social.js: challenges, the weekend challenge, quiz battles): "which of these is NOT right?" from each plan's decoys */
let QZ=null;
function quizAll(){if(QZ)return QZ;QZ={};CASES.forEach(c=>c.questions.forEach(q=>qzAdd(q,c.title+': '+q.skill)));BANK_B.forEach(q=>qzAdd(q,'Week '+q.week+' · '+q.topic));return QZ}
function qzAdd(q,label){const good=q.chips.filter(c=>c.g);q.chips.forEach((c,j)=>{if(c.g||good.length<3)return;const r=seeded(q.id+'~'+j),gs=good.slice();for(let i=gs.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[gs[i],gs[k]]=[gs[k],gs[i]]}
  QZ[q.id+'~'+j]={id:q.id+'~'+j,q:label+'. Which of these is NOT right?',o:[c.t].concat(gs.slice(0,3).map(x=>x.t)),why:c.why||'',label}})}
function quizItem(id){return quizAll()[id]||null}
function quizItems(rng,n){const all=Object.values(quizAll()),o=[],used=new Set();while(o.length<n&&o.length<all.length){const x=all[Math.floor(rng()*all.length)],k=x.id.split('~')[0];if(used.has(x.id)||used.has(k)&&o.length<all.length/2)continue;used.add(x.id);used.add(k);o.push(x)}return o}

/* question editor (engine/qbank.js): Section B short answers */
const qbChips=d=>!Array.isArray(d.chips)?'chips must be a list.':d.chips.some(c=>!c||typeof c.t!=='string'||!c.t.trim())?'Every chip needs its text (t).':d.chips.filter(c=>c.g).length<3?'Give at least 3 key ideas (g: 1).':d.chips.filter(c=>!c.g).length<1?'Give at least one decoy (g: 0, with why).':d.chips.some(c=>!c.g&&!c.why)?'Every decoy needs a why.':'';
const qbText=(d,n)=>typeof d.q!=='string'||d.q.trim().length<n?'Write the question (q).':/\bexams?\b|\bmidterms?\b|\bresits?\b/i.test(JSON.stringify(d))?'Practice questions must not mention exams, midterms or resits.':'';
function qbPut(arr,L,kind,fix){L.filter(x=>x.kind===kind).forEach(x=>{const i=arr.findIndex(q=>q.id===x.id);if(x.st==='hidden'){if(i>=0)arr.splice(i,1);return}const q=fix?fix(x.data):x.data;if(i>=0)arr[i]=Object.assign({},arr[i],q);else arr.push(q)})}
function qbankKinds(){return {short:{label:'Section B short answer',template:{id:'',week:1,topic:'',skill:'',q:'',chips:[{t:'Define: …',g:1},{t:'Apply: …',g:1},{t:'Evaluate: …',g:1},{t:'A common mistake …',g:0,why:'Why it is wrong'}],checks:['I defined the key idea','I applied it to the example','I evaluated']},
  check:d=>qbText(d,20)||(!(d.week>=1&&d.week<=14)?'week must be 1 to 14.':typeof d.topic!=='string'||!d.topic?'Give the topic.':'')||qbChips(d),find:id=>BANK_B.find(q=>q.id===id)||null}}}
function qbankApply(L){qbPut(BANK_B,L,'short',d=>Object.assign({skill:d.topic,checks:[]},d));QZ=null}
