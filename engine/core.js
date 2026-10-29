/* MKT Arena engine: shared by MKT101 and MKT301. Course details come from CRS (course-config.js) and course.js.
   Keep this file identical in both repos: edit it in one, then run node tools/sync-engine.mjs. */
/* ---------- engine hooks: course.js and engine modules plug in here ---------- */
const HOOKS={},ROUTES={};
function onHook(name,f){(HOOKS[name]=HOOKS[name]||[]).push(f)}
function hook(name,...a){(HOOKS[name]||[]).forEach(f=>{try{f(...a)}catch(e){console.error(e)}})}
async function hookA(name,...a){for(const f of HOOKS[name]||[])try{await f(...a)}catch(e){console.error(e)}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(CRS.ls+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(CRS.ls+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(CRS.ls+k)}catch(e){}}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const LECTURER='S000001', SCORE_EMAIL='abdulla.muiz@mnu.edu.mv';
const MBONUS=[25,35,50],TIERS=['Starter','Pro','Elite'];
function seeded(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return ()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);return ((h^=h>>>16)>>>0)/4294967296}}
function pickMissions(t){const r=seeded(today()+'|'+ME.sid),used=new Set(),out=[];
  const pool=MPOOL.filter(m=>m.t===t).concat(t?MPOOL.filter(m=>m.t===t-1):[]);
  const order=pool.map(m=>[m,r()+(m.t===t?0:.6)]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  for(const m of order){if(out.length===3)break;if(!used.has(m.k)){used.add(m.k);out.push(m.id)}}return out}
function missions(){rollDay();return U.day.m.map(id=>MPOOL.find(m=>m.id===id)).filter(Boolean)}
let ME=null, U=null, LOAD_T=-1;
function me(){const r=LS.get('session',null);return r&&/^S0\d{5}$/.test(r.sid||'')?r:null}
function load(){const st=LS.get('u_'+ME.sid,null);LOAD_T=st?(st._t||0):-1;U=Object.assign(blank(),st||{});U.n=Object.assign(blank().n,U.n);if(!U.nick)U.nick=defaultNick(ME.name)}
function save(){U._t=Date.now();LS.set('u_'+ME.sid,U);if(ME&&ME.cloud)CLOUD.push()}
const cloudOn=()=>!!(ME&&ME.cloud&&CLOUD.ok);
function defaultNick(n){const p=String(n||'').trim().split(/\s+/);return p.length>1?p[0]+' '+p[p.length-1][0]+'.':(p[0]||'Player')}
function level(xp){let i=0;LEVELS.forEach((l,j)=>{if(xp>=l[0])i=j});const nx=LEVELS[i+1];return {i,name:LEVELS[i][1],from:LEVELS[i][0],to:nx?nx[0]:null,pct:nx?Math.round((xp-LEVELS[i][0])/(nx[0]-LEVELS[i][0])*100):100}}
function streak(u){const s=new Set(u.days),fz=(u.frz&&u.frz.d)||{};let n=0,d=new Date();const f=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');if(!s.has(f(d)))d.setDate(d.getDate()-1);while(s.has(f(d))||fz[f(d)]){if(s.has(f(d)))n++;d.setDate(d.getDate()-1)}return n}
function rollDay(){if(U.day.d!==today()||!U.day.c||!U.day.m){const t=tier(U.xp);U.day={d:today(),c:{},m:pickMissions(t),t,done:0}}}
function count(k){rollDay();U.n[k]=(U.n[k]||0)+1;U.day.c[k]=(U.day.c[k]||0)+1;
  const ms=missions();if(!U.day.done&&ms.length&&ms.every(m=>(U.day.c[m.k]||0)>=m.n)){U.day.done=1;U.n.missions++;save();award(null,MBONUS[U.day.t],'Daily mission complete')}
  checkBadges();save()}
function countOnce(key,...ks){U.cnt=U.cnt||{};if(U.cnt[key])return;U.cnt[key]={d:today(),k:ks.filter(Boolean)};U.cnt[key].k.forEach(count)}
function uncount(test){U.cnt=U.cnt||{};rollDay();Object.keys(U.cnt).filter(test).forEach(key=>{const c=U.cnt[key];
  c.k.forEach(k=>{U.n[k]=Math.max(0,(U.n[k]||0)-1);if(c.d===today()&&U.day.c[k])U.day.c[k]--});delete U.cnt[key]})}
const MINPCT=.4,minMins=t=>Math.ceil(t*MINPCT/60);
function checkBadges(){BADGES.forEach(b=>{if(!U.badges[b.id]&&b.t(U)){U.badges[b.id]=today();toast(b.ico,'Badge unlocked: '+b.name,b.d)}})}
function toast(em,t,s){const el=document.createElement('div');el.className='toast';el.innerHTML=`<span class="em">${em}</span><div><b class="lex">${esc(t)}</b><div class="muted" style="font-size:.85rem">${esc(s)}</div></div>`;const box=$('#toasts');box.append(el);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>el.remove(),2800)}
function hud(){if(!ME){$('#hud').innerHTML='';return}const L=level(U.xp);
  $('#hud').innerHTML=`${typeof avatarSVG==='function'&&ME.sid!==LECTURER?`<a class="avpill" href="#/avatar" title="My avatar" aria-label="My avatar">${avatarSVG(myAv(),30,'')}</a>`:''}${typeof bellHTML==='function'?bellHTML():''}<button class="pill save" id="svb" title="Save my progress" aria-label="Save my progress">💾<span class="lbl">&nbsp;Save</span></button><span class="pill fire" title="Day streak">🔥 ${streak(U)}</span><span class="pill gold" title="XP">✨ ${U.xp}</span><span class="pill lvl">${esc(L.name)}</span><span class="xpmini" title="${L.pct}% to next level"><i style="width:${L.pct}%"></i></span>`}
async function signOut(){if(ME&&U)presOff();hook('signout');if(ME&&ME.cloud){await CLOUD.flush();await CLOUD.signOut()}LS.del('session');ME=null;U=null;hud();location.hash='#/';gate()}
function shell(active,body){
  const nav=NAV.concat(ME.sid===LECTURER?[['#/lecturer','Lecturer']]:[]).map(n=>`<a href="${n[0]}" class="${n[0]===active?'on':''}">${n[1]}</a>`).join('');
  app.innerHTML=`<div class="wrap"><nav class="tabs" aria-label="Sections">${nav}</nav><main id="main" tabindex="-1">${body}</main>
  <footer><div class="row"><span>Signed in as <b>${esc(ME.name)}</b> · ${esc(ME.sid)}</span><button class="btn ghost sm" id="so">Sign out</button></div>
  <p style="margin-top:10px">Practice material only. Write your full answers on paper. · <a href="javascript:void 0" id="help">? How it works</a> · <a href="#/whatsnew">✨ What's new</a> · <a href="javascript:void 0" id="inst">📲 Install the app</a> · <a href="#/privacy">Privacy</a></p></footer></div>`;
  $('#so').onclick=signOut;$('#help').onclick=()=>tour(0);$('#inst').onclick=()=>installPop(0);scrollTo(0,0)}
function xpFor(test){U.gain=U.gain||{};return Object.keys(U.log).filter(test).reduce((t,k)=>t+(k in U.gain?U.gain[k]:(XP_DEFAULT[k.split(':')[0]]||0)),0)}
function restartItem(test,what,clear){const x=Math.min(xpFor(test),U.xp);
  if(!confirm(`Restart ${what}?\n\nYour plan, timer and answers for it will be cleared${x?`, and the ${x} XP it earned will be removed`:''}. Badges you already have are kept.`))return false;
  Object.keys(U.log).filter(test).forEach(k=>{delete U.log[k];delete U.gain[k]});uncount(test);U.xp-=x;clear();save();hud();
  toast('↺','Restarted',x?'−'+x+' XP · start fresh':'Start fresh');return true}
const qKeys=id=>k=>k.startsWith('plan:'+id+':')||k.startsWith('typed:'+id+':')||k==='perfect:'+id||k.startsWith('timed:'+id+':')||k.startsWith('check:'+id+':');
const b64e=t=>btoa(unescape(encodeURIComponent(t))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=t=>decodeURIComponent(escape(atob(t.replace(/-/g,'+').replace(/_/g,'/'))));
const bytesB64=u=>{let t='';for(let i=0;i<u.length;i+=8192)t+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(t).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const b64Bytes=t=>Uint8Array.from(atob(t.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const pipe=async(data,S)=>new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(S)).arrayBuffer());
async function backupCode(){const json=JSON.stringify({v:1,s:ME.sid,at:today(),u:U});let tag=CRS.CODE+'B',j;
  if(window.CompressionStream){try{j=bytesB64(await pipe(new TextEncoder().encode(json),new CompressionStream('gzip')));tag=CRS.CODE+'Z'}catch(e){}}
  if(!j)j=b64e(json);return tag+'-'+j+'-'+(await sha(CRS.id+'-backup|'+j)).slice(0,10)}
async function restore(text){const m=String(text).replace(/\s+/g,'').match(new RegExp('('+CRS.CODE+'[BZ])-([A-Za-z0-9_-]+)-([0-9a-f]{10})'));
  if(!m)return 'That doesn\'t look like an '+CRS.CODE+' backup code.';
  if((await sha(CRS.id+'-backup|'+m[2])).slice(0,10)!==m[3])return 'This backup is damaged or incomplete. Copy the whole code, or use the backup file.';
  let p;try{p=JSON.parse(m[1]===CRS.CODE+'Z'?new TextDecoder().decode(await pipe(b64Bytes(m[2]),new DecompressionStream('gzip'))):b64d(m[2]))}catch(e){return 'This backup could not be read on this browser. Try Chrome or Safari, or use the backup file.'}
  if(p.s!==ME.sid)return 'This backup belongs to a different student ID ('+esc(p.s)+'). Sign in with that ID to restore it.';
  if(!confirm(`Restore your backup from ${p.at}?\n\nBackup: ${p.u.xp} XP\nThis device now: ${U.xp} XP\n\nYour progress on this device will be replaced.`))return '';
  U=Object.assign(blank(),p.u);U.n=Object.assign(blank().n,U.n);save();closeModal();hud();home();toast('💾','Progress restored',U.xp+' XP · '+level(U.xp).name);return ''}
const markSaved=()=>LS.set('bk_'+ME.sid,today());
async function downloadBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([await backupCode()],{type:'text/plain'}));a.download=CRS.id+'-progress-'+ME.sid+'-'+today()+'.txt';a.click();markSaved();toast('💾','Backup saved','Keep the file somewhere safe')}
async function emailBackup(){const c=await backupCode();markSaved();
  location.href='mailto:'+SCORE_EMAIL+'?subject='+encodeURIComponent(CRS.CODE+' progress backup: '+ME.name+' ('+ME.sid+')')+'&body='+encodeURIComponent(`Hello,\n\nHere is my ${CRS.name} progress backup (${U.xp} XP, ${level(U.xp).name}, ${today()}).\n\n${c}\n\nThank you,\n${ME.name}\n`);
  return c.length}
function closeModal(){document.querySelector('.modal')?.remove()}
function openSave(){closeModal();const last=LS.get('bk_'+ME.sid,''),L=level(U.xp);
  const m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Save my progress');
  m.innerHTML=`<div class="card"><button class="x" aria-label="Close">✕</button><h2 style="margin-right:40px">💾 Save my progress</h2>
  <p class="muted" style="font-size:.9rem;margin:0">${U.xp} XP · ${esc(L.name)} · ${Object.keys(U.badges).length} badge${Object.keys(U.badges).length===1?'':'s'} · 🔥 ${streak(U)}<br>${last?'Last saved '+last:'Not saved yet'}</p>
  ${cloudOn()?`<p style="margin:10px 0 0">${syncChip()}</p><p style="font-size:.92rem;margin:10px 0 0">Your progress saves to your account automatically. These copies are an extra backup.</p>`:'<p style="font-size:.92rem;margin:12px 0 0">Your progress lives on this device only. Keep a copy so you never lose it.</p>'}
  <button class="opt" id="mem"><span class="em">📧</span><span><b>Email a copy to my lecturer</b><small>Opens your email app with your backup ready to send to ${SCORE_EMAIL}. If you ever lose your progress, your lecturer can send it back.</small></span></button>
  <button class="opt" id="mdl"><span class="em">⬇️</span><span><b>Download a copy to this device</b><small>Saves a small .txt file. Open it on another device to carry on.</small></span></button>
  <button class="opt" id="mcp"><span class="em">📋</span><span><b>Copy backup code</b><small>Paste it into a note or a message to yourself.</small></span></button>
  <p style="margin:14px 0 0"><a href="javascript:void 0" id="mrs">Restore a backup on this device →</a></p>
  <div id="mrp" class="hide"><textarea id="mrt" style="min-height:80px;margin-top:8px" placeholder="${CRS.CODE}Z-..."></textarea>
  <div class="row" style="margin-top:8px"><input type="file" id="mrf" accept=".txt,text/plain" style="max-width:100%;color:var(--ink2)"><button class="btn gold sm" id="mrgo">Restore</button></div></div>
  <div class="err" id="mer"></div></div>`;
  document.body.append(m);const k=e=>{if(e.key==='Escape'){closeModal();removeEventListener('keydown',k)}};addEventListener('keydown',k);
  m.onclick=e=>{if(e.target===m)closeModal()};m.querySelector('.x').onclick=closeModal;m.querySelector('#mem').focus();
  $('#mem').onclick=async()=>{const n=await emailBackup();$('#mer').style.color='var(--muted)';$('#mer').textContent=n>1800?'Your email app should open with the backup inside. If the code arrives cut off, download a copy and attach the file instead.':'Your email app should open. Press send to finish.'};
  $('#mdl').onclick=downloadBackup;
  $('#mcp').onclick=async()=>{const c=await backupCode();try{await navigator.clipboard.writeText(c);markSaved();toast('📋','Backup code copied','Keep it somewhere safe')}catch(e){$('#mrp').classList.remove('hide');$('#mrt').value=c;$('#mer').textContent='Copy the code above and keep it somewhere safe.'}};
  $('#mrs').onclick=()=>$('#mrp').classList.toggle('hide');
  $('#mrf').onchange=async e=>{const f=e.target.files[0];if(f)$('#mrt').value=(await f.text()).trim()};
  $('#mrgo').onclick=async()=>{$('#mer').style.color='';$('#mer').textContent=await restore($('#mrt').value)}}
function backupCard(){
  const last=LS.get('bk_'+ME.sid,'');$('#bkl').textContent=last?'Last saved '+last:'Not saved yet';
  $('#bkd').onclick=async()=>{await downloadBackup();$('#bkl').textContent='Last saved '+today()};
  $('#bkc').onclick=openSave;
  $('#bkr').onclick=()=>$('#bkp').classList.toggle('hide');
  $('#bkf').onchange=async e=>{const f=e.target.files[0];if(f)$('#bkt').value=(await f.text()).trim()};
  $('#bkgo').onclick=async()=>{$('#bke').textContent=await restore($('#bkt').value)}}
function inboxHTML(){return annHTML()+frzHTML()+notesHTML()}
function notesHTML(){const N=U.notes||{},R=U.notesRead||{},ks=Object.keys(N).filter(k=>!R[k]).sort((a,b)=>String(N[a].at)<String(N[b].at)?1:-1);if(!ks.length)return '';
  return `<div class="card inbox" style="margin-bottom:16px"><h2 style="margin:0 0 6px">✉️ Message${ks.length>1?'s':''} from your lecturer</h2>${ks.slice(0,5).map(k=>`<div class="note"><p style="margin:0">${esc(N[k].fb).replace(/\n/g,'<br>')}</p><div class="row" style="justify-content:space-between;margin-top:6px"><span class="muted" style="font-size:.8rem">${esc(String(N[k].at).slice(0,10))}</span><button class="btn ghost sm" data-noteread="${esc(k)}">Got it</button></div></div>`).join('')}</div>`}
function argCard(c,a,i,col){const k=c.id+':'+i,mine=U.verd[k],L={strong:'Strong',mixed:'Partly right',weak:'Weak'};
  return `<div class="card arg" style="margin-bottom:12px"><div class="avatar" style="background:${col}">${esc(a.who[0])}</div><div>
  <b class="lex">${esc(a.who)}</b> <span class="muted" style="font-size:.85rem">· ${esc(a.role)}</span><q>${esc(a.say)}</q>
  <div class="verdicts">${['strong','mixed','weak'].map(v=>`<button data-v="${i}|${v}" class="${mine===v?'pick-'+v:''}" ${mine?'disabled':''}>${L[v]}</button>`).join('')}</div>
  ${mine?`<div class="fb ${mine===a.v?'ok':'no'}"><b>${mine===a.v?'✓ Agreed':'Our reading: '+L[a.v]}.</b> ${esc(a.why)}</div>`:''}</div></div>`}
function newSet(c){const slots=[...new Set(c.questions.map(q=>q.slot))].sort();const prev=U.sets[c.id]||[];
  return slots.map(s=>{const pool=c.questions.filter(q=>q.slot===s);const fresh=pool.filter(q=>!prev.includes(q.id));return shuffle(fresh.length?fresh:pool)[0].id})}
function practicePane(c){
  if(!U.sets[c.id]){U.sets[c.id]=newSet(c);save()}
  const qs=U.sets[c.id].map(id=>c.questions.find(q=>q.id===id)).filter(Boolean),O=()=>({cid:c.id});
  $('#pane').innerHTML=`<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><div><h2 style="margin:0">Practice set</h2><p class="muted" style="margin:4px 0 0">${qs.length} questions · 6 marks each. Plan with chips, then finish your way: plan only, write on paper, or type.</p></div>
  <button class="btn gold" id="ns">🎲 New set</button></div></div><div id="qs"></div>`;
  const fresh=ids=>{clearPlans(U.sets[c.id]);U.sets[c.id]=ids;U.focus=U.focus||{};U.focus['c:'+c.id]=0;save();practicePane(c);$('#pane').scrollIntoView()};
  $('#ns').onclick=()=>{if(confirm('Start a new random set? Your current plans and timers will be cleared.'))fresh(newSet(c))};
  player({key:'c:'+c.id,qs,o:O,next:()=>fresh(newSet(c)),weak:()=>fresh(weakSet(c.questions,qs.length,q=>tk(q,O()),U.sets[c.id]))})}
function clearPlans(ids){(ids||[]).forEach(id=>{delete U.plansSaved[id];LS.del('tm_'+id)})}
function weakMark(q,o,pts,attempt){U.wk=U.wk||{q:{},t:{}};const t=tk(q,o),r=U.wk.t[t]||(U.wk.t[t]=[0,0]);
  if(attempt)r[0]++;r[1]=Math.round((r[1]+pts)*10)/10;U.wk.q[q.id]=Math.round(((U.wk.q[q.id]||0)+pts)*10)/10}
function weakTopics(){const t=(U.wk||{}).t||{};return Object.keys(t).filter(k=>t[k][1]>0).sort((a,b)=>t[b][1]/Math.max(1,t[b][0])-t[a][1]/Math.max(1,t[a][0]))}
function weakSet(pool,size,tkOf,prev){const W=U.wk||{q:{},t:{}},T=W.t||{},Q=W.q||{};
  const sc=q=>{const r=T[tkOf(q)];return (Q[q.id]||0)*2+(r?r[1]/Math.max(1,r[0]):0)};
  if(!pool.some(q=>sc(q)>0)){toast('🎯','No weak spots yet','Practise a few questions first. Here is a fresh set.');return shuffle(pool).slice(0,size).map(q=>q.id)}
  return pool.map(q=>[q,sc(q)+Math.random()*.3]).sort((a,b)=>b[1]-a[1]).slice(0,size).map(x=>x[0].id)}
function player(P){
  U.focus=U.focus||{};let i=U.focus[P.key];if(i!=='sum'&&!(i>=0&&i<P.qs.length))i=0;
  const host=$('#qs'),stOf=q=>U.plansSaved[q.id]||{},isDone=q=>{const s=stOf(q);return !!(s.done||s.final)};
  const go=n=>{i=n;U.focus[P.key]=i;save();draw();host.scrollIntoView({block:'start'})};
  const head=()=>{const h=$('#fh');if(!h||i==='sum')return;const dn=P.qs.filter(isDone).length;
    h.innerHTML=`<div class="row" style="justify-content:space-between"><b class="lex">Question ${i+1} of ${P.qs.length}</b><span class="muted" style="font-size:.85rem">${dn}/${P.qs.length} finished</span></div>
    <div class="bar" style="margin:8px 0 10px"><i style="width:${dn/P.qs.length*100}%;background:var(--teal)"></i></div>
    <div class="dots">${P.qs.map((x,j)=>`<button data-dot="${j}" class="dot ${j===i?'on':''} ${isDone(x)?'done':stOf(x).checked?'part':''}" aria-label="Question ${j+1}${isDone(x)?', finished':''}">${isDone(x)?'✓':j+1}</button>`).join('')}<button data-dot="sum" class="dot" aria-label="Set summary" title="Set summary">🏁</button></div>`;
    h.querySelectorAll('[data-dot]').forEach(b=>b.onclick=()=>go(b.dataset.dot==='sum'?'sum':+b.dataset.dot))};
  const draw=()=>{if(i==='sum')return setSummary(P,go);const q=P.qs[i],last=i===P.qs.length-1;
    host.innerHTML=`<div class="card" id="fh" style="margin-bottom:12px;padding:14px 16px"></div><div class="card qcard" id="q-${q.id}"></div>
    <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn ghost" id="pv" ${i===0?'disabled':''}>← Previous</button><button class="btn ghost" id="nx">${last?'Set summary 🏁':'Next →'}</button></div>`;
    $('#pv').onclick=()=>go(i-1);$('#nx').onclick=()=>go(last?'sum':i+1);
    qCard(q,i,Object.assign(P.o(q),{refresh:head,next:()=>go(last?'sum':i+1),last}))};
  draw()}
function setSummary(P,go){const host=$('#qs'),sts=P.qs.map(q=>[q,U.plansSaved[q.id]||{}]);
  const xp=P.qs.reduce((t,q)=>t+xpFor(qKeys(q.id)),0),R={plan:0,paper:0,typed:0};let open=0;
  sts.forEach(([q,s])=>{if(s.done||s.final)R[s.route||'paper']++;else open++});
  const miss={},bad={};sts.forEach(([q,s])=>{if(!s.checked)return;q.chips.forEach((c,j)=>{const sel=(s.sel||[]).includes(j);if(c.g&&!sel)miss[c.t]=(miss[c.t]||0)+1;if(!c.g&&sel)bad[c.t]=c.why||''})});
  const mk=Object.keys(miss).slice(0,5),bk=Object.keys(bad).slice(0,4);
  const setT=P.qs.map(q=>tk(q,P.o(q))),wt=weakTopics(),sug=wt.find(t=>setT.includes(t))||wt[0];
  host.innerHTML=`<div class="card"><div style="font-size:2.4rem">🏁</div><h2 style="margin:4px 0">Set summary</h2>
  <div class="stats"><div class="stat"><b>${xp}</b><span>XP from this set</span></div><div class="stat"><b>${R.paper}</b><span>✍️ on paper</span></div><div class="stat"><b>${R.typed}</b><span>⌨️ typed</span></div><div class="stat"><b>${R.plan}</b><span>📝 plan only</span></div></div>
  ${(()=>{const T=sts.filter(([q,s])=>s.route==='typed'&&s.done);return T.length?`<h3 style="margin-top:16px">Typed answers</h3><ul class="sumlist">${T.map(([q,s])=>{const r=s.ak&&U.rev&&U.rev[s.ak],c=s.chk;return `<li>${esc(q.skill||q.topic)}: automatic ${c?c.band:'–'}/6${r?` · <b>marked ${r.band}/6</b>${r.fb?`<div class="muted" style="font-size:.85rem">${esc(r.fb)}</div>`:''}`:cloudOn()?' · <span class="muted">waiting to be marked</span>':''}</li>`}).join('')}</ul>`:''})()}
  ${open?`<p class="muted" style="margin-top:12px">${open} question${open===1?' is':'s are'} not finished yet. <a href="javascript:void 0" id="sfo">Go back to ${open===1?'it':'them'}</a>.</p>`:''}
  ${mk.length?`<h3 style="margin-top:16px">Key ideas you left out</h3><ul class="sumlist">${mk.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
  ${bk.length?`<h3 style="margin-top:12px">Decoys you picked</h3><ul class="sumlist">${bk.map(t=>`<li><b>${esc(t)}</b>${bad[t]?`: <span class="muted">${esc(bad[t])}</span>`:''}</li>`).join('')}</ul>`:''}
  ${!mk.length&&!bk.length&&sts.some(([q,s])=>s.checked)?'<div class="fb ok">Every plan hit the key ideas with no decoys. Excellent.</div>':''}
  <div class="callout" style="margin-top:14px">🎯 <b>Practise next:</b> ${sug?esc(tkLabel(sug)):'Try a new set to build up your practice record.'}</div>
  <div class="row" style="margin-top:14px"><button class="btn gold" id="snx">🎲 Next set</button><button class="btn" id="swk">Practise my weak spots</button><button class="btn ghost sm" id="sbk">← Back to questions</button></div></div>`;
  $('#sbk').onclick=()=>go(0);$('#sfo')&&($('#sfo').onclick=()=>go(sts.findIndex(([q,s])=>!(s.done||s.final))));
  $('#snx').onclick=()=>{if(!open||confirm('Some questions are unfinished. Start a new set anyway?'))P.next()};
  $('#swk').onclick=()=>{if(!open||confirm('Some questions are unfinished. Start a weak-spots set anyway?'))P.weak()}}
const TIMERS={},BANDS6=[[0,'Off topic or missing'],[1,'Lists a term or two'],[2,'Lists several terms with little explanation'],[3,'Explains the idea with some application'],[4,'Explains clearly and applies it to the example'],[5,'Applies well and starts to evaluate'],[6,'Applies to the case or example throughout and evaluates with a clear judgement']];
const MINWORDS=40,words=t=>(String(t||'').trim().match(/\S+/g)||[]).length;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition,TYPE_SPW=.5,SPEAK_SPW=1/3,BIG=15;
let MIC=null;
function stopMic(){if(MIC){const m=MIC;MIC=null;try{m.rec.stop()}catch(e){}m.done()}}
function typedNoXP(st,C){if(st.noxp||C.words<MINWORDS)return 'typed XP needs at least '+MINWORDS+' words.';if(!C.found.length)return 'no key ideas were found. Use your plan and try again.';
  if(st.fast)return 'this was entered faster than typing allows. Type or speak your own answer to earn XP.';return ''}
function typingBox(q,st,ta,el){let prev=ta.value,last=0,tmo,comp=0,cst=0;st.fl=st.fl||{};const wc=$('#wc-'+q.id),fn=$('#fn-'+q.id);
  const sync=()=>{st.txt=ta.value;prev=ta.value;wc.textContent=words(ta.value)+' words · aim for 150–250';clearTimeout(tmo);tmo=setTimeout(save,400)};
  const tick=cap=>{const t=Date.now();if(last)st.act=(st.act||0)+Math.min(t-last,cap||15000);last=t};
  /* integrity record: a count plus the newest 5 events per answer (kind, first 120 characters, input type, composing?, time) */
  const rec=(k,txt,type,c)=>{st.fl[k]=(st.fl[k]||0)+1;U.integ=U.integ||{};U.integ[k]=(U.integ[k]||0)+1;
    st.fl.ev=(st.fl.ev||[]).concat({k,s:String(txt||'').replace(/\s+/g,' ').trim().slice(0,120),t:type||'unknown',c:c?1:0,at:new Date().toISOString()}).slice(-5)};
  const blocked=(txt,type)=>{rec('paste',txt,type,0);fn.textContent='⚠️ Paste blocked. Type or speak your own answer.';toast('🚫','Pasting is turned off','Type or speak your own answer');save()};
  ta.addEventListener('paste',e=>{e.preventDefault();blocked(e.clipboardData&&e.clipboardData.getData('text'),'paste')});
  ta.addEventListener('drop',e=>{e.preventDefault();blocked(e.dataTransfer&&e.dataTransfer.getData('text'),'drop')});
  ta.addEventListener('beforeinput',e=>{const t=e.inputType||'';
    if(/^insertFrom(Paste|Drop|Yank|PasteAsQuotation)$/.test(t)){e.preventDefault();blocked(e.data||(e.dataTransfer&&e.dataTransfer.getData('text')),t)}});
  /* keyboards that compose (predictive text, voice typing): the time spent composing counts as active time */
  ta.addEventListener('compositionstart',()=>{comp=1;cst=Date.now()});
  ta.addEventListener('compositionend',()=>{if(cst){st.act=(st.act||0)+Math.min(Date.now()-cst,120000);last=Date.now()}comp=0;cst=0});
  ta.addEventListener('input',e=>{const t=e.inputType||'',v=ta.value,d=words(v)-words(prev),spoken=t==='insertFromDictation'||!!comp||!!e.isComposing;
    if(d>BIG){/* a large block in one go (often the phone keyboard's voice typing): keep it, note it for the lecturer, time it as speech */
      let a=0;while(a<prev.length&&a<v.length&&prev[a]===v[a])a++;const ins=e.data||v.slice(a,a+Math.max(0,v.length-prev.length));
      rec('bigKept',ins,t||'unknown',spoken);st.dw=(st.dw||0)+d;tick(120000);fn.textContent='ℹ️ A large insert was kept and noted for your lecturer (that\'s fine for voice typing).';sync();save();return}
    if(spoken&&d>0)st.dw=(st.dw||0)+d;
    tick();sync()});
  ta.addEventListener('focus',()=>{last=Date.now()});
  const swp=()=>{const s=$('#sw-'+q.id);if(!s)return clearInterval(TIMERS['sw'+q.id]);if(st.sw){const t=Math.floor((Date.now()-st.sw)/1000);s.textContent='⏱ '+Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}};
  if(st.sw){clearInterval(TIMERS['sw'+q.id]);TIMERS['sw'+q.id]=setInterval(swp,1000);swp()}
  const mb=el.querySelector('[data-a="mic"]');if(!mb)return;
  mb.onclick=()=>{if(MIC)return stopMic();
    if(!LS.get('micnote',0)){LS.set('micnote',1);toast('🎤','Speech to text','Your speech is converted by Google or Apple and is not stored by '+CRS.name+'.')}
    let rec;try{rec=new SR()}catch(e){return toast('🎤','Speech not available','Your browser does not support speech to text.')}
    rec.lang='en-GB';rec.continuous=true;rec.interimResults=true;const im=$('#im-'+q.id),t0=Date.now();
    MIC={rec,done:()=>{st.act=(st.act||0)+(Date.now()-t0);mb.classList.remove('on');mb.textContent='🎤 Speak';mb.setAttribute('aria-pressed','false');if(im)im.textContent='';save()}};
    rec.onresult=e=>{let tmp='';for(let k=e.resultIndex;k<e.results.length;k++){const r=e.results[k],t=r[0].transcript.trim();
        if(r.isFinal){if(t){ta.value=(ta.value&&!/\s$/.test(ta.value)?ta.value+' ':ta.value)+t;st.dw=(st.dw||0)+words(t);sync()}}else tmp+=t+' '}if(im)im.textContent=tmp?'🎤 '+tmp:''};
    rec.onerror=e=>{if(e.error==='not-allowed')toast('🎤','Microphone blocked','Allow the microphone for this site in your browser settings.');stopMic()};
    rec.onend=()=>{if(MIC&&MIC.rec===rec){MIC=null;st.act=(st.act||0)+(Date.now()-t0);mb.classList.remove('on');mb.textContent='🎤 Speak';if(im)im.textContent='';save()}};
    try{rec.start();mb.classList.add('on');mb.textContent='⏹ Stop';mb.setAttribute('aria-pressed','true')}catch(e){MIC=null}}}
function reviewHTML_(key){const r=key&&U.rev&&U.rev[key];if(!r)return '';
  return `<div class="mark"><div class="row" style="justify-content:space-between"><span><b class="big">✓ Marked ${r.band}/6</b></span><span class="tag">+${r.xp} XP</span></div>${r.fb?`<p style="margin:8px 0 0">${esc(r.fb)}</p>`:''}<p class="muted" style="font-size:.8rem;margin:6px 0 0">${r.by==='claude'?'Marked with AI assistance for your lecturer':'Marked by your lecturer'} · ${esc(String(r.at||'').slice(0,10))}</p></div>`}
function timer(id,total,el,done,tick){
  const key='tm_'+id,T=LS.get(key,{left:total,end:null}),disp=el.querySelector('#t-'+id),go=el.querySelector('[data-a="tgo"]');
  const left=()=>T.end?Math.round((T.end-Date.now())/1000):T.left;
  const fmt=s=>{const a=Math.abs(s);return (s<0?'+':'')+Math.floor(a/60)+':'+String(a%60).padStart(2,'0')};
  const paint=()=>{const s=left();disp.textContent=fmt(s);disp.className='timer'+(s<0?' over':s<=60?' warn':'');go.textContent=T.end?'Pause':(T.left<total?'Resume':'Start');tick&&tick(s)};
  clearInterval(TIMERS[id]);TIMERS[id]=setInterval(()=>{if(!document.body.contains(disp))return clearInterval(TIMERS[id]);paint()},500);paint();
  go.onclick=()=>{if(T.end){T.left=left();T.end=null}else T.end=Date.now()+T.left*1000;LS.set(key,T);paint()};
  el.querySelector('[data-a="tstop"]').onclick=()=>{T.left=total;T.end=null;LS.set(key,T);paint()};
  el.querySelector('[data-a="done"]').onclick=()=>{const used=total-left(),ok=used>=total*MINPCT;
    if(!ok&&!confirm(`Only ${Math.floor(used/60)} min ${used%60} s on the clock.\n\nTimed XP needs at least ${minMins(total)} minutes of writing. Finish without XP?`))return;
    LS.del(key);clearInterval(TIMERS[id]);done(ok)}}
const noTimeXP=t=>toast('⏱️','No XP this time','Write for at least '+minMins(t)+' minutes to earn timed XP');
async function scoreCode(){const p={v:1,s:ME.sid,n:String(U.dn||defaultNick(ME.name)).slice(0,24),x:U.xp,l:level(U.xp).i,b:Object.keys(U.badges).length,d:today()};
  const j=btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return CRS.CODE+'-'+j+'-'+(await sha(CRS.id+'-score|'+j)).slice(0,8)}
async function rowKey(sid){return (await sha(ROSTER.salt+'|'+sid)).slice(0,12)}
function liveBoard(){
  shell('#/board',`<div class="row" style="justify-content:space-between"><h1 style="margin:0">Leaderboard</h1><span class="live"><i></i>LIVE</span></div>
  <p class="muted">Scores update as classmates earn XP. Everyone appears under their name from the class list.${ME.sid===LECTURER?' <b>Lecturer: tap a student to open their profile.</b>':''}</p>
  <div class="grid g2"><div class="card lb" id="lbl"><p class="muted">Loading the class…</p></div>
  <div class="card"><h2>You on the board</h2><p style="margin:0 0 6px">Your score: <b>${U.xp} XP</b> · ${esc(level(U.xp).name)} · ${Object.keys(U.badges).length} badges</p>
   ${ME.sid===LECTURER?'<p class="muted" style="font-size:.9rem">The lecturer account is not shown on the board.</p>':`
   <p style="margin:6px 0">You appear as <b>${CLOUD.rules2?nameLine(U.dn,U.un,ME.sid):esc(defaultNick(ME.name))}</b></p>
   ${CLOUD.rules2&&U.dn?`<button class="btn ghost sm" id="nkun">🪪 ${U.un?'Change my @username':'Pick my @username'}</button>`:''}
   <p class="muted" style="font-size:.85rem;margin-top:12px">No need to send anything: your score updates automatically. ${syncChip()}</p>`}</div></div>`);
  $('#nkun')&&($('#nkun').onclick=()=>namePrompt(true));
  CLOUD.watchBoard(rows=>{const el=$('#lbl');if(!el)return;rows=rows.filter(r=>r.id!==LECTURER&&termNow(r));
    const lec=ME.sid===LECTURER;el.innerHTML=rows.length?rows.map((r,i)=>`<div class="r av ${r.id===ME.sid?'me':''}${lec?' click':''}"${lec?` data-sid="${esc(r.id)}" role="button" tabindex="0" aria-label="Open the profile of ${esc(showName(r.n,r.id))}"`:''}><span class="pos ${i<3?'p'+(i+1):''}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span>${typeof avatarSVG==='function'?avatarSVG(r.a||avFor(r.id),36,''):''}<div style="flex:1;min-width:0"><b>${nameLine(r.n,r.u,r.id)}${r.id===ME.sid?' <span class="tag">You</span>':''}</b><div class="muted" style="font-size:.8rem">${esc(LEVELS[r.l]?.[1]||'')} · ${r.b} badge${r.b===1?'':'s'} · 🔥 ${r.s}</div></div><b class="lex" style="color:var(--gold)">${r.x} XP</b></div>`).join(''):'<p class="muted">No scores yet. Earn some XP and you will appear here.</p>';
    if(lec)el.querySelectorAll('[data-sid]').forEach(r=>{r.onclick=()=>openStudent(r.dataset.sid);r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openStudent(r.dataset.sid)}}})},
    e=>{const el=$('#lbl');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})}
async function boardPage(){if(cloudOn())return liveBoard();
  const rows=(LEADERBOARD.rows||[]).slice().sort((a,b)=>b.x-a.x),mine=await rowKey(ME.sid);
  shell('#/board',`<h1>Leaderboard</h1><p class="muted">${LEADERBOARD.updated?'Updated '+esc(LEADERBOARD.updated)+'. ':''}The board is updated weekly from the scores students send in.</p>
  <div class="grid g2"><div class="card lb">${rows.length?rows.map((r,i)=>`<div class="r ${r.k===mine?'me':''}"><span class="pos ${i<3?'p'+(i+1):''}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><div><b>${esc(r.n||'Student')}</b><div class="muted" style="font-size:.8rem">${esc(LEVELS[r.l]?.[1]||'')} · ${r.b} badges</div></div><b class="lex" style="color:var(--gold)">${r.x} XP</b></div>`).join(''):'<p class="muted">No scores yet. Be the first: send your score →</p>'}</div>
  <div class="card"><h2>Send my score</h2><p class="muted" style="font-size:.9rem">Send your score each week to appear on the board. Your student ID is never shown.</p>
   <p style="margin:6px 0">You appear as <b>${esc(U.dn||defaultNick(ME.name))}</b></p>
   <p style="margin-top:14px">Your score: <b>${U.xp} XP</b> · ${esc(level(U.xp).name)} · ${Object.keys(U.badges).length} badges</p>
   <div class="row"><a class="btn" id="em">📧 Email my score</a><button class="btn ghost" id="cp">Copy code</button></div>
   <p class="muted" style="font-size:.8rem;margin-top:10px">If email doesn't open, copy the code and send it to your lecturer.</p><div class="code hide" id="cd"></div></div></div>`);
  const upd=async()=>{const code=await scoreCode();
    $('#em').href='mailto:'+SCORE_EMAIL+'?subject='+encodeURIComponent(CRS.CODE+' score: '+(U.dn||defaultNick(ME.name)))+'&body='+encodeURIComponent('My '+CRS.name+' score code:\n\n'+code+'\n');return code};
  await upd();
  $('#cp').onclick=async()=>{const code=await upd();$('#cd').textContent=code;$('#cd').classList.remove('hide');try{await navigator.clipboard.writeText(code);toast('📋','Copied','Paste it into a message to your lecturer')}catch(e){}}}
function demoXP(i){return DEMO_ROWS.reduce((t,r)=>t+r[1]*r[2+i],0)}
const REAL=['Naver','World Bank','WTO','Starbucks','Global Exchange','Magnum','7-Eleven','Jollibee','McDonald','Coca-Cola','KFC','IKEA','Toyota','Unilever','Nestlé','Samsung','Apple','Google','Amazon','Alibaba','Netflix','Uber','Airbnb','Nike','Zara','Dhiraagu','Ooredoo','Bank of Maldives','MIFCO','STO','Facebook','Instagram','TikTok','WhatsApp','Visa','Mastercard','DHL','Maersk','Emirates','SriLankan'];
let QIDX=null;
const practised=u=>new Set(Object.keys((u&&u.log)||{}).map(k=>(k.match(/^(?:plan|timed|typed|check):([^:]+):/)||[])[1]).filter(Boolean));
function weakOf(u){const t=((u&&u.wk)||{}).t||{};return Object.keys(t).filter(k=>t[k][1]>0).sort((a,b)=>t[b][1]/Math.max(1,t[b][0])-t[a][1]/Math.max(1,t[a][0])).slice(0,2).map(tkLabel)}
function ago(d){if(!d)return '–';const m=Math.round((Date.now()-d)/60000);return m<2?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'}
function markQueue(){let US=null,RV=null,tab='q',open=null;const drafts={},I=qIndex();
  $('#mq').innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Marking</h2><span class="live"><i></i>LIVE</span></div>
  <p class="muted" style="font-size:.88rem;margin:6px 0 10px">Typed answers students have submitted. Mark them here, or ask Claude to mark the queue (see CLAUDE.md in the repo). Students see the mark, feedback and XP straight away.</p><div id="mqb"><p class="muted">Loading answers…</p></div>`;
  const flags=a=>flagText(a.fl);
  const draw=force=>{const el=$('#mqb');if(!el||!US||!RV)return;const ae=document.activeElement;if(!force&&ae&&el.contains(ae)&&/TEXTAREA|INPUT|SELECT/.test(ae.tagName))return;
    const all=[];US.forEach(x=>{if(x.id===LECTURER||!x.u||!x.u.ans)return;Object.entries(x.u.ans).forEach(([k,a])=>{if(a&&a.q)all.push({sid:x.id,name:x.name||'',k,a,r:(RV[x.id]||{})[k]})})});
    all.sort((p,q)=>String(p.a.at)<String(q.a.at)?1:-1);const pend=all.filter(x=>!x.r),done=all.filter(x=>x.r),list=(tab==='q'?pend:done).slice(0,40);
    const item=x=>{const e=I[x.a.q],qt=e?e.q.q:x.a.q,d=drafts[x.k]||{band:x.r?x.r.band:x.a.b|0,xp:x.r?x.r.xp:Math.min(30,(x.a.b|0)*4),fb:x.r?x.r.fb:''},fl=flags(x.a);
      return `<div class="mqi" data-k="${esc(x.k)}"><div class="row" style="justify-content:space-between"><b>${esc(x.name||x.sid)}</b><span class="muted" style="font-size:.8rem">${esc(x.sid)} · ${esc(String(x.a.at||'').slice(0,16).replace('T',' '))}</span></div>
      <div class="muted" style="font-size:.85rem">${esc(e?e.label:x.a.q)}: ${esc(qt.slice(0,150))}${qt.length>150?'…':''}</div>
      <div style="font-size:.85rem;margin:4px 0">Automatic ${x.a.b|0}/6 · ${x.a.w|0} words${fl?` · <span style="color:var(--gold)">⚠️ ${esc(fl)}</span>`:''}${x.r?` · <b>marked ${x.r.band}/6, +${x.r.xp} XP</b> <span class="muted">(${x.r.by==='lecturer'?'you':'Claude'})</span>`:''}</div>
      ${open===x.k?`<div class="answerprev">${esc(x.a.t||'').replace(/\n/g,'<br>')}</div>${flagEvHTML(x.a.fl)}
      <div class="row" style="margin-top:8px"><label class="inl">Band <select data-f="band">${[0,1,2,3,4,5,6].map(b=>`<option value="${b}" ${b===d.band?'selected':''}>${b}</option>`).join('')}</select></label><label class="inl">XP <input type="number" min="0" max="30" data-f="xp" value="${d.xp}"></label></div>
      <textarea data-f="fb" maxlength="600" style="min-height:80px;margin-top:8px" placeholder="Feedback: one strength, the most important missing point, one tip">${esc(d.fb||'')}</textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-save>Save mark</button><button class="btn ghost sm" data-close>Close</button></div><div class="err" data-er></div>`
      :`<button class="btn ghost sm" data-open style="margin-top:4px">${x.r?'Edit mark':'Read and mark'}</button>`}</div>`};
    el.innerHTML=`<div class="subnav"><button data-t="q" class="${tab==='q'?'on':''}">⏳ To mark (${pend.length})</button><button data-t="d" class="${tab==='d'?'on':''}">✅ Marked (${done.length})</button></div>
    ${list.map(item).join('')||`<p class="muted">${tab==='q'?'Nothing waiting. New typed answers appear here.':'No marks yet.'}</p>`}${(tab==='q'?pend:done).length>40?'<p class="muted" style="font-size:.85rem">Showing the newest 40.</p>':''}`;
    el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;open=null;draw(1)});
    el.querySelectorAll('.mqi').forEach(box=>{const k=box.dataset.k,x=all.find(y=>y.k===k);
      box.querySelector('[data-open]')&&(box.querySelector('[data-open]').onclick=()=>{open=k;draw(1)});
      box.querySelector('[data-close]')&&(box.querySelector('[data-close]').onclick=()=>{open=null;delete drafts[k];draw(1)});
      box.querySelectorAll('[data-f]').forEach(f=>f.oninput=f.onchange=()=>{const d=drafts[k]||(drafts[k]={band:x.r?x.r.band:x.a.b|0,xp:x.r?x.r.xp:Math.min(30,(x.a.b|0)*4),fb:x.r?x.r.fb:''});
        d[f.dataset.f]=f.dataset.f==='fb'?f.value:+f.value;if(f.dataset.f==='band'&&!x.r&&!d.xpSet){d.xp=Math.min(30,d.band*4);box.querySelector('[data-f="xp"]').value=d.xp}if(f.dataset.f==='xp')d.xpSet=1});
      box.querySelector('[data-save]')&&(box.querySelector('[data-save]').onclick=async()=>{const g=n=>box.querySelector(`[data-f="${n}"]`);
        const v={q:x.a.q,band:Math.max(0,Math.min(6,+g('band').value|0)),xp:Math.max(0,Math.min(30,+g('xp').value|0)),fb:g('fb').value.trim().slice(0,600),at:new Date().toISOString(),by:'lecturer'};
        const b=box.querySelector('[data-save]');b.disabled=true;b.textContent='Saving…';
        try{await CLOUD.saveReview(x.sid,k,v);delete drafts[k];open=null;toast('✅','Mark saved',(x.name||x.sid)+': '+v.band+'/6, +'+v.xp+' XP');draw(1)}
        catch(e){b.disabled=false;b.textContent='Save mark';box.querySelector('[data-er]').textContent=CLOUD.say(e)}})})};
  const err=e=>{const el=$('#mqb');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`};
  CLOUD.watchUsers(l=>{US=l;draw()},err);CLOUD.watchReviews(r=>{RV=r;draw()},err)}
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function decoyStats(u){const I=qIndex(),dec={},miss={};Object.entries(u.plansSaved||{}).forEach(([id,p])=>{const e=I[id];if(!e||!p.checked)return;const sel=p.sel||[];
  e.q.chips.forEach((c,j)=>{const k=id+'|'+j;if(!c.g&&sel.includes(j))dec[k]={t:c.t,why:c.why,where:e.label};if(c.g&&!sel.includes(j))miss[k]={t:c.t,where:e.label}})});
  return {dec:Object.values(dec),miss:Object.values(miss)}}
let PFROM='';
const openStudent=sid=>{PFROM=location.hash||'#/lecturer';location.hash='#/student/'+sid};
const SYNC={synced:['ok','☁️ Saved to your account'],saving:['','⏳ Saving…'],syncing:['','⏳ Syncing…'],offline:['bad','📴 Offline: saves when you reconnect'],error:['bad','⚠️ Couldn\'t save, will retry'],off:['','']};
const syncChip=()=>{const v=SYNC[CLOUD.state]||SYNC.off;return v[1]?`<span class="sync ${v[0]}" id="sync">${v[1]}</span>`:''};
/* leaderboard row: everyone appears under their official name (directory) once the combined rules are published; until then a short form of the sign-in name */
const rowOf=sid=>sid===LECTURER?null:{n:CLOUD.rules2?(U.dn||''):defaultNick(ME.name).slice(0,24),u:U.un||'',a:U.av||'',x:U.xp,l:level(U.xp).i,b:Object.keys(U.badges).length,s:streak(U)};
async function cloudSync(){const sid=ME.sid;
  if(!CLOUD.ok){toast('📴','Saving on this device only','Your account could not be reached. Sign in again when you are online.');return}
  const u=await CLOUD.current();if(!ME||ME.sid!==sid)return;
  if(!u||!CLOUD.mine(sid)){LS.del('session');ME=null;U=null;hud();gate('Please sign in again with your PIN.');return}
  let r;try{r=await CLOUD.pull(sid)}catch(e){if(!ME||ME.sid!==sid)return;console.warn('Pull failed',e);addEventListener('online',()=>ME&&ME.sid===sid&&cloudSync(),{once:true});
    toast('📴','Offline for now','Your progress is saved on this device and will sync when you reconnect.');return}
  if(!ME||ME.sid!==sid)return;const R=r&&r.u;
  if(R&&(R._t||0)>LOAD_T){U=Object.assign(blank(),R);U.n=Object.assign(blank().n,U.n);LS.set('u_'+sid,U);hud();route();toast('☁️','Progress loaded',U.xp+' XP from your account')}
  await hookA('preSync',sid);if(!ME||ME.sid!==sid)return;
  CLOUD.ready(sid,()=>ME&&ME.sid===sid?{sid,name:ME.name,U,row:rowOf(sid)}:null);CLOUD.flush();
  if(sid!==LECTURER)CLOUD.watchMine(sid,m=>{if(ME&&ME.sid===sid)applyMarks(m)});presCloud();hook('cloud')}
function flagText(f){f=f||{};return [f.paste?'paste blocked ×'+f.paste:'',f.bigKept?'large insert (kept) ×'+f.bigKept:'',f.big?'big insert removed ×'+f.big:'',f.fast?'too fast':''].filter(Boolean).join(' · ')}
function flagEvHTML(f){const ev=(f&&f.ev)||[];return ev.length?`<ul class="sumlist" style="font-size:.82rem;margin:8px 0 0">${ev.map(x=>`<li><b>${x.k==='paste'?'Paste blocked':'Large insert (kept)'}</b> · ${esc(x.t)}${x.c?' · while composing':''} · ${esc(String(x.at).slice(0,16).replace('T',' '))}<div class="muted">“${esc(x.s)}${String(x.s).length>=120?'…':''}”</div></li>`).join('')}</ul>`:''}
const isNote=k=>/^note_/.test(k);
function applyMarks(m){U.rev=U.rev||{};U.gain=U.gain||{};let n=0,ch=0;
  let nn=0,first='';U.notes=U.notes||{};
  for(const [key,v] of Object.entries(m||{})){if(!v||typeof v!=='object')continue;
    if(isNote(key)){if(!U.notes[key]){U.notes[key]={fb:String(v.fb||'').slice(0,600),at:String(v.at||'')};nn++;first=first||U.notes[key].fb}continue}
    const r={q:String(v.q||''),band:Math.max(0,Math.min(6,v.band|0)),xp:Math.max(0,Math.min(30,v.xp|0)),fb:String(v.fb||'').slice(0,600),at:String(v.at||''),by:v.by==='lecturer'?'lecturer':'claude'},k='review:'+key;
    const old=U.rev[key];U.rev[key]=r;
    if(!U.log[k]){countOnce(k,'reviewed');award(k,r.xp,'Marked by your lecturer');n++}
    else if((U.gain[k]|0)!==r.xp){U.xp=Math.max(0,U.xp+r.xp-(U.gain[k]|0));U.gain[k]=r.xp;ch++}
    else if(old&&(old.band!==r.band||old.fb!==r.fb))ch++}
  if(nn){save();toast('✉️','Message from your lecturer',first.length>90?first.slice(0,90)+'…':first);if(!n&&!ch&&!location.hash.replace(/^#\/?/,''))route()}
  if(n||ch){save();hud();if(n)toast('🧑‍🏫',n===1?'An answer was marked':n+' answers were marked','Open the question to read the feedback');else toast('🧑‍🏫','A mark was updated','Open the question to see it');
    const ae=document.activeElement;if(!(ae&&ae.tagName==='TEXTAREA'))route()}}
const ACT=(()=>{const q=new URLSearchParams(location.search);return q.get('oobCode')&&q.get('mode')?{mode:q.get('mode'),code:q.get('oobCode')}:null})();
function clearAct(){const q=new URLSearchParams(location.search);['mode','oobCode','apiKey','lang','continueUrl'].forEach(k=>q.delete(k));
  history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash)}
function signInWith(sid,msg){clearAct();gate();if(msg)$('#f').insertAdjacentHTML('beforebegin',`<div class="fb ok" id="gmsg" style="margin-bottom:10px">${esc(msg)}</div>`);const d=String(sid||'').replace(/^S/i,'');if(/^0\d{5}$/.test(d)){$('#sid').value=d;$('#sid').dispatchEvent(new Event('input'))}}
async function actionPage(a){
  const box=h=>{app.innerHTML=`<div class="gate"><div class="card signcard" id="act">${h}</div></div>`};
  const fail=e=>box(`<div style="font-size:2.4rem">⚠️</div><h2>That link didn't work</h2><p class="muted">${esc(CLOUD.say(e))}</p><button class="btn" id="ab">Go to sign in</button>`)||($('#ab').onclick=()=>signInWith(''));
  if(!CLOUD.ok)return box(`<h2>Can't open this link right now</h2><p class="muted">Check your internet connection and open the link again.</p>`);
  box('<p class="muted">Checking your link…</p>');
  if(a.mode==='resetPassword'){let email;try{email=await CLOUD.verifyReset(a.code)}catch(e){return fail(e)}
    const sid=email.split('@')[0].toUpperCase();
    box(`<div style="font-size:2.4rem">🔐</div><h2 style="margin-top:6px">Choose a new PIN</h2><p class="muted" style="font-size:.88rem;margin:0 0 6px">${esc(sid)} · ${esc(email)}</p>
    <form id="rf" novalidate><input type="text" autocomplete="username" value="${esc(email)}" hidden>
    <label for="np">New 6-digit PIN</label><input type="password" id="np" inputmode="numeric" maxlength="6" autocomplete="new-password" class="pinbox">
    <label for="np2">Type it again</label><input type="password" id="np2" inputmode="numeric" maxlength="6" autocomplete="new-password" class="pinbox">
    <p class="hint">Pick something you will remember but others can't guess. Not 123456 or your birthday.</p>
    <div class="err" id="rer"></div><button class="btn" id="rgo">Save my new PIN</button></form>`);
    $('#np').focus();
    $('#rf').onsubmit=async e=>{e.preventDefault();const p=$('#np').value.trim(),er=t=>{$('#rer').textContent=t};
      if(!/^\d{6}$/.test(p))return er('Your PIN must be exactly 6 digits.');if(p!==$('#np2').value.trim())return er("The two PINs don't match.");
      if(/^(\d)\1{5}$|^(123456|654321|012345)$/.test(p))return er('That PIN is too easy to guess. Choose another.');
      $('#rgo').disabled=true;$('#rgo').textContent='Saving…';
      try{await CLOUD.confirmReset(a.code,p);signInWith(sid,'✅ Your PIN has been changed. Sign in with your new PIN.')}
      catch(e){$('#rgo').disabled=false;$('#rgo').textContent='Save my new PIN';er(CLOUD.say(e))}};return}
  if(a.mode==='verifyEmail'||a.mode==='recoverEmail'){try{const info=a.mode==='recoverEmail'?await CLOUD.checkCode(a.code):null;await CLOUD.applyCode(a.code);
      box(`<div style="font-size:2.4rem">✅</div><h2>${a.mode==='verifyEmail'?'Email confirmed':'Email restored'}</h2><p class="muted">${a.mode==='verifyEmail'?'Thanks, your student email is confirmed.':'Your account email has been changed back'+(info&&info.data&&info.data.email?' to '+esc(info.data.email):'')+'. If you did not ask for a change, reset your PIN to be safe.'}</p><button class="btn" id="ab">Go to sign in</button>`);
      $('#ab').onclick=()=>signInWith('')}catch(e){fail(e)}return}
  box(`<h2>Unknown link</h2><p class="muted">This link isn't one the ${CRS.name} understands.</p><button class="btn" id="ab">Go to sign in</button>`);$('#ab').onclick=()=>signInWith('')}
/* ---------- unified from both courses ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)], app=$('#app');
function theme(t){if(t)LS.set('theme',t);const cur=LS.get('theme','dark');document.documentElement.dataset.theme=cur;
  $('#tbtn').textContent=cur==='light'?'🌙':'☀️';$('#tbtn').setAttribute('aria-label',cur==='light'?'Switch to dark mode':'Switch to light mode');
  document.querySelector('meta[name=theme-color]').content=CRS.themeColor[cur==='light'?'light':'dark']}
function tier(xp){const i=level(xp).i;return i<=CRS.tierCut[0]?0:i<=CRS.tierCut[1]?1:2}
function blank(){return Object.assign({xp:0,log:{},days:[],badges:{},n:Object.assign({verdicts:0,verdictsRight:0,weakSpotted:0,plans:0,perfect:0,timed:0,missions:0},CRS.blankN),day:{d:'',c:{},m:[],t:0,done:0},nick:'',hide:false,sets:{},focus:{},verd:{},plansSaved:{}},JSON.parse(JSON.stringify(CRS.blankX)))}
function award(key,xp,label,quiet){
  if(key&&U.log[key])return false;
  if(key){U.log[key]=1;U.gain=U.gain||{};U.gain[key]=xp}
  rollDay();
  if(!U.days.includes(today())){U.days.push(today());U.days=U.days.slice(-60);U.xp+=10;toast('📅','Daily check-in','+10 XP · streak '+streak(U))}
  const before=level(U.xp).i;U.xp+=xp;
  if(xp&&!quiet)toast('✨',label,'+'+xp+' XP');
  if(level(U.xp).i>before)toast('🚀','Level up!','You are now '+level(U.xp).name);
  checkBadges();save();hud();hook('award',key,xp);return true}
function pinStep(sid,name,mt,mode){mode=mode||'in';const card=document.querySelector('.signcard'),em=CLOUD.email(sid);
  card.innerHTML=`<h2 style="margin-top:6px">${mode==='in'?'Enter your PIN':'Create your PIN'}</h2>
  <p class="muted" style="font-size:.88rem;margin:0 0 10px">${esc(sid)} · ${esc(sid===LECTURER?'Lecturer access':em)} · <a href="javascript:void 0" id="chg">Change</a></p>
  <div class="subnav" role="tablist"><button type="button" data-pm="in" class="${mode==='in'?'on':''}">Sign in</button><button type="button" data-pm="new" class="${mode==='new'?'on':''}">First time? Create PIN</button></div>
  <form id="pf" novalidate><input type="text" autocomplete="username" value="${esc(em)}" hidden>
  <label for="pin">${mode==='in'?'Your 6-digit PIN':'Choose a 6-digit PIN'}</label><input type="password" id="pin" inputmode="numeric" maxlength="32" autocomplete="${mode==='in'?'current-password':'new-password'}" class="pinbox">
  ${mode==='new'?'<label for="pin2">Type it again</label><input type="password" id="pin2" inputmode="numeric" maxlength="6" autocomplete="new-password" class="pinbox"><p class="hint">Pick something you will remember but others can\'t guess. Not 123456 or your birthday.</p>':''}
  <div class="err" id="per"></div><button class="btn" id="pgo">${mode==='in'?'Sign in':'Create PIN and start'}</button></form>
  ${mode==='in'?'<p class="row" style="margin:12px 0 0;justify-content:space-between"><a href="javascript:void 0" id="fgt">Forgot PIN?</a><a href="javascript:void 0" id="abc" style="font-size:.85rem">My PIN has letters</a></p>':''}
  <div id="pof"></div>
  <p class="muted" style="font-size:.8rem;margin-top:14px">Your PIN protects your progress and lets you carry on from any device.</p>`;
  const er=t=>{$('#per').textContent=t},pin=$('#pin');pin.focus();
  card.querySelectorAll('[data-pm]').forEach(b=>b.onclick=()=>pinStep(sid,name,mt,b.dataset.pm));
  $('#abc')&&($('#abc').onclick=()=>{const t=pin.inputMode==='numeric';pin.inputMode=t?'text':'numeric';pin.classList.toggle('pinbox',!t);$('#abc').textContent=t?'My PIN is only numbers':'My PIN has letters';pin.focus()});
  $('#chg').onclick=()=>{clearInterval(mt);gate()};
  const offline=()=>{$('#pof').innerHTML=`<div class="fb no" style="margin-top:12px">No connection to your account right now. <a href="javascript:void 0" id="loc">Use this device only for now</a>: your progress will stay on this phone or laptop until you sign in with your PIN again.</div>`;
    $('#loc').onclick=()=>{clearInterval(mt);LS.set('session',{sid,name});start()}};
  $('#fgt')&&($('#fgt').onclick=async()=>{if(sid===LECTURER)return er('The lecturer PIN can be reset in the Firebase console (Authentication → Users).');
    er('');try{await CLOUD.reset(sid);$('#per').style.color='var(--green)';$('#per').innerHTML=`📧 We sent a reset link to <b>${esc(em)}</b>.<br>Check your MNU student inbox and the <b>spam / junk</b> folder for an email from <b>${CRS.noreply}</b>. It may say <i>password</i>: that means your PIN.<br>Open the link and choose a new PIN of at least 6 characters (6 digits recommended), then come back and sign in.`}
    catch(e){$('#per').style.color='';er(CLOUD.say(e));if(CLOUD.isNetwork(e))offline()}});
  $('#pf').onsubmit=async e=>{e.preventDefault();$('#per').style.color='';const p=pin.value.trim();
    if(mode==='new'){if(!/^\d{6}$/.test(p))return er('Your PIN must be exactly 6 digits.');if(p!==$('#pin2').value.trim())return er('The two PINs don\'t match.');if(/^(\d)\1{5}$|^(123456|654321|012345)$/.test(p))return er('That PIN is too easy to guess. Choose another.')}
    else if(p.length<6)return er('Type your 6-digit PIN.');
    $('#pgo').disabled=true;$('#pgo').textContent=mode==='in'?'Signing in…':'Creating…';
    try{await (mode==='in'?CLOUD.signIn(sid,p):CLOUD.create(sid,p));clearInterval(mt);LS.set('session',{sid,name,cloud:true});start()}
    catch(e){$('#pgo').disabled=false;$('#pgo').textContent=mode==='in'?'Sign in':'Create PIN and start';er(CLOUD.say(e));if(CLOUD.isNetwork(e))offline()}}}
function tour(n){closeModal();const t=n===TOUR.length-1&&cloudOn()?['☁️','Your progress follows you','You signed in with your PIN, so your progress saves to your account automatically. Carry on from any phone or laptop. Tap <b>💾 Save</b> any time for an extra backup copy.']:TOUR[n],m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','How it works');
  const done=()=>{U.tour=1;save();closeModal();setTimeout(()=>installPop(1),350)};
  m.innerHTML=`<div class="card" style="text-align:center"><button class="x" aria-label="Close">✕</button><div style="font-size:2.6rem;margin-top:6px">${t[0]}</div>
  <p class="muted" style="font:700 .75rem Lexend;letter-spacing:.08em;margin:6px 0 2px">STEP ${n+1} OF ${TOUR.length}</p><h2 style="margin:0 0 8px">${t[1]}</h2><p style="color:var(--ink2)">${t[2]}</p>
  <div class="dots" style="justify-content:center;margin:6px 0 14px">${TOUR.map((_,j)=>`<span class="dot ${j===n?'on':j<n?'done':''}" style="width:12px;height:12px"></span>`).join('')}</div>
  <div class="row" style="justify-content:center">${n?'<button class="btn ghost" id="tb">← Back</button>':'<button class="btn ghost" id="ts">Skip</button>'}<button class="btn" id="tn">${n<TOUR.length-1?'Next →':'Let\'s go 🚀'}</button></div></div>`;
  document.body.append(m);m.querySelector('.x').onclick=done;m.onclick=e=>{if(e.target===m)done()};$('#tn').focus();
  $('#tn').onclick=()=>n<TOUR.length-1?tour(n+1):done();$('#tb')&&($('#tb').onclick=()=>tour(n-1));$('#ts')&&($('#ts').onclick=done)}
const tk=(q,o)=>isB(o)?bArea(q):o.cid+'|'+(q.skill||q.topic);
function tkLabel(k){if(k[0]===CRS.bPfx)return bLabel(k);
  const [cid,sk]=k.split('|'),c=CASE_ALL.find(x=>x.id===cid);return sk+(c?' ('+caseName(c)+')':'')}
function qIndex(){if(QIDX)return QIDX;QIDX={};CASE_ALL.forEach(c=>c.questions.forEach(q=>QIDX[q.id]={q,area:'c:'+c.id,label:caseName(c)+': '+q.skill}));
  BANK_B_ALL.forEach(q=>QIDX[q.id]={q,area:bArea(q),label:bQLabel(q)});return QIDX}
function namesFor(q,o){const c=o&&o.cid?CASE_ALL.find(x=>x.id===o.cid):null,n=[];
  if(c){n.push(...caseNames(c),...c.title.split(/\s+/).filter(w=>w.length>3));(c.boardroom||[]).forEach(a=>n.push(a.who))}
  (String(q.q).match(/\b[A-Z][a-zA-Z]{2,}(?:\s[A-Z][a-zA-Z]+)*/g)||[]).slice(1).forEach(x=>n.push(x));return [...new Set(n)]}
function submitAnswer(q,o,st,C){U.ans=U.ans||{};const key=q.id+'_'+Date.now().toString(36);
  U.ans[key]={q:q.id,sec:isB(o)?'B':o.cid||'',t:String(st.txt||'').slice(0,3000),at:new Date().toISOString(),b:C.band,f:C.found,s:Object.keys(C.struct).filter(k=>C.struct[k]),w:C.words,x:st.xpGot||0,
    fl:{paste:(st.fl&&st.fl.paste)||0,bigKept:(st.fl&&st.fl.bigKept)||0,big:(st.fl&&st.fl.big)||0,fast:st.fast?1:0,ev:((st.fl&&st.fl.ev)||[]).slice(-5)}};
  /* keep the newest 80: drop the oldest already-marked answers first, then the oldest */
  const old=()=>Object.keys(U.ans).sort((a,b)=>U.ans[a].at<U.ans[b].at?-1:1);
  for(const k of old()){if(Object.keys(U.ans).length<=80)break;if(U.rev&&U.rev[k]&&k!==key)delete U.ans[k]}
  for(const k of old()){if(Object.keys(U.ans).length<=80)break;if(k!==key)delete U.ans[k]}
  return key}
const LOGW=CRS.logw;
/* "3 MCQs answered", "2 MCQ retries", "2 typed answers" */
function plural(w,n){if(n<2)return w;const p=w.split(' '),i=p.length>1&&/(ed|written)$/.test(p[p.length-1])?p.length-2:p.length-1;p[i]=/[^aeiou]y$/.test(p[i])?p[i].slice(0,-1)+'ies':p[i]+'s';return p.join(' ')}
function heatHTML(days){const on=new Set(days||[]),end=new Date();end.setHours(0,0,0,0);const st=new Date(end);st.setDate(end.getDate()-7*7-((end.getDay()+6)%7));const cells=[];
  for(const d=new Date(st);d<=end;d.setDate(d.getDate()+1)){const k=ymd(d);cells.push(`<i class="${on.has(k)?'on':''} ${k===ymd(end)?'today':''}" title="${k}${on.has(k)?' · practised':''}"></i>`)}
  return `<div class="heat" aria-label="Practice days, last 8 weeks">${cells.join('')}</div><p class="muted" style="font-size:.8rem;margin:0">Each square is a day (weeks run top to bottom, Monday first). ${CRS.heatWord} = practised. Gold outline = today.</p>`}
function recentHTML(u){const by={};Object.keys(u.log||{}).forEach(k=>{const m=k.match(/^([a-z]+):.*:(\d{4}-\d{2}-\d{2})$/);if(m&&LOGW[m[1]]){const d=by[m[2]]||(by[m[2]]={});d[m[1]]=(d[m[1]]||0)+1}});
  (u.mh||[]).forEach(h=>{const d=by[h.d]||(by[h.d]={});d._sets=(d._sets||0)+1});
  const ds=Object.keys(by).sort().reverse().slice(0,10);if(!ds.length)return '<p class="muted">No dated activity yet.</p>';
  return `<ul class="sumlist">${ds.map(d=>`<li><b>${d}</b>: ${Object.entries(by[d]).map(([k,n])=>k==='_sets'?n+' MCQ set'+(n>1?'s':''):n+' '+plural(LOGW[k],n)).join(', ')}</li>`).join('')}</ul>
  <p class="muted" style="font-size:.8rem">From the dated records the portal keeps (${CRS.recentWhat}). Reading and Boardroom calls are counted below but aren't dated.</p>`}
function lecturer(){
  if(ME.sid!==LECTURER)return home();
  shell('#/lecturer',`<h1>Lecturer</h1>
  ${liveCardHTML()}${cloudOn()?'<div class="card" id="cdash" style="margin-bottom:22px"></div><div class="card" id="mq" style="margin-bottom:22px"></div><div class="card" id="cov" style="margin-bottom:22px"></div>'+lcardsHTML():'<div class="callout" style="margin-bottom:18px">Sign in with your PIN to see the live class dashboard. In device-only mode, use the score-code tools at the bottom of this page.</div>'}
  <div class="card" id="demo" style="margin-bottom:22px"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Show the class</h2><button class="btn ghost sm" id="fs">⛶ Full screen</button></div>
  <p class="muted" style="font-size:.9rem;margin:6px 0 12px">Example students only, made up to explain how scoring works. Real scores appear on the Leaderboard tab.</p>
  <div class="subnav"><button data-dm="board" class="on">🏆 Example leaderboard</button><button data-dm="vs">⚔️ Student 1 vs Student 2</button><button data-dm="tips">💡 How to climb</button></div><div id="dm"></div></div>
  <h2>Content review</h2><div class="card" id="rvw" style="margin-bottom:22px"></div>
  <details class="card"${cloudOn()?'':' open'}><summary class="lex" style="cursor:pointer;font-weight:700">Offline fallback: update the leaderboard from score codes</summary><p class="muted" style="font-size:.88rem">Only needed if the live leaderboard is unavailable.</p><ol style="padding-left:1.2em;margin-top:0"><li>Paste all the score emails or codes below (everything at once is fine).</li><li>Check the preview, then <b>Download leaderboard.js</b>.</li><li>On GitHub, open the <b>${CRS.repo}</b> repo → <b>Add file → Upload files</b> → drop in <code>leaderboard.js</code> → <b>Commit changes</b>.</li></ol>
  <textarea id="tx" placeholder="Paste score emails or codes here"></textarea><div class="row" style="margin-top:12px"><button class="btn" id="go">Read codes</button></div><div id="out" style="margin-top:16px"></div></details>`);
  if(cloudOn()){liveCardInit();classDash();markQueue();covCard();lecturerCards()}
  demo();$('#rvw').innerHTML=reviewHTML();$('#rvw').querySelectorAll('[data-rv]').forEach(b=>b.onchange=()=>{const r=LS.get('review',{});r[b.dataset.rv]=b.checked;LS.set('review',r)});
  $('#go').onclick=async()=>{const found=$('#tx').value.match(new RegExp(CRS.CODE+'-[A-Za-z0-9_-]+-[0-9a-f]{8}','g'))||[];const best={};let bad=0,off=0;
    for(const code of found){const m=code.match(new RegExp('^'+CRS.CODE+'-(.+)-([0-9a-f]{8})$'));if((await sha(CRS.id+'-score|'+m[1])).slice(0,8)!==m[2]){bad++;continue}
      let p;try{p=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){bad++;continue}
      if(!ROSTER.hashes.includes(await sha(ROSTER.salt+'|'+p.s))||p.s===LECTURER){off++;continue}
      const o=best[p.s];if(!o||p.d>o.d||(p.d===o.d&&p.x>o.x))best[p.s]=p}
    const rows=[];for(const p of Object.values(best))rows.push({k:await rowKey(p.s),n:String(p.n||'').slice(0,24),x:+p.x||0,l:+p.l||0,b:+p.b||0});
    const prev=(LEADERBOARD.rows||[]).filter(r=>!rows.some(x=>x.k===r.k));const all=prev.concat(rows).sort((a,b)=>b.x-a.x);
    const file='/* Weekly leaderboard. Made on the lecturer page from students\' score codes, then uploaded here.\n   k = scrambled student ID (no readable IDs), n = nickname, x = XP, l = level, b = badges. */\nconst LEADERBOARD='+JSON.stringify({updated:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}),rows:all})+';\n';
    $('#out').innerHTML=`<p><b>${rows.length}</b> students read from ${found.length} codes${bad?` · ${bad} damaged codes skipped`:''}${off?` · ${off} not on the class list skipped`:''}. Students not in this batch keep their last score.</p>
    <div class="tablewrap"><table><tr><th>#</th><th>Name</th><th>XP</th><th>Badges</th></tr>${all.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.n||'Student')}</td><td>${r.x}</td><td>${r.b}</td></tr>`).join('')}</table></div>
    <button class="btn gold" id="dl" style="margin-top:12px">⬇ Download leaderboard.js</button>`;
    $('#dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([file],{type:'text/javascript'}));a.download='leaderboard.js';a.click()}}}
function classDash(){
  $('#cdash').innerHTML=`<div class="row" style="justify-content:space-between"><h2 style="margin:0">Class dashboard</h2><span class="live"><i></i>LIVE</span></div>
  <p class="muted" style="font-size:.88rem;margin:6px 0 8px">Tap a student to open their full profile.</p><input type="text" id="csq" placeholder="🔎 Search by name or ID" aria-label="Search students" style="max-width:340px"><div class="row" style="margin:8px 0 0;gap:6px" role="group" aria-label="Show">${[['all','All'],['30','🟢 Active in last 30 min'],['day','Today'],['week','This week']].map(([k,l])=>`<button type="button" class="chip${k==='all'?' sel':''}" data-win="${k}">${l}</button>`).join('')}</div><div id="cdb"><p class="muted">Loading students…</p></div>`;
  let LAST=null,SORT={k:'xp',d:-1},WIN='all';$('#csq').oninput=()=>LAST&&drawDash(LAST);
  document.querySelectorAll('[data-win]').forEach(b=>b.onclick=()=>{WIN=b.dataset.win;document.querySelectorAll('[data-win]').forEach(x=>x.classList.toggle('sel',x===b));SORT=WIN==='all'?{k:'xp',d:-1}:{k:'ts',d:-1};LAST&&drawDash(LAST)});
  const DT=setInterval(()=>{if(!$('#cdb'))return clearInterval(DT);LAST&&drawDash(LAST)},60000);
  CLOUD.watchUsers(list=>{LAST=list;drawDash(list)},e=>{const el=$('#cdb');if(el)el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`});
  function drawDash(list){const el=$('#cdb');if(!el)return;const sh=([k,l])=>`<th data-sk="${k}" class="click" aria-sort="${SORT.k===k?(SORT.d>0?'ascending':'descending'):'none'}">${l}${SORT.k===k?(SORT.d>0?' ▲':' ▼'):''}</th>`;const I=qIndex(),q=($('#csq')&&$('#csq').value||'').trim().toLowerCase();
    const st=list.filter(x=>x.id!==LECTURER&&x.u).map(x=>{const u=x.u,n=u.n||{};return {id:x.id,name:x.name||'',xp:u.xp|0,lv:level(u.xp|0).name,str:streak(Object.assign({days:[]},u)),ts:x.ts,
      plans:n.plans|0,timed:n.timed|0,typed:n.typed|0,flags:((u.integ||{}).paste|0)+((u.integ||{}).big|0)+((u.integ||{}).fast|0),badges:Object.keys(u.badges||{}).length,weak:weakOf(u),done:practised(u),wk:stWeek(u),u}}).sort((a,b)=>{const k=SORT.k,va=k==='ts'?(a.ts||0):a[k],vb=k==='ts'?(b.ts||0):b[k];return (k==='name'?String(va).localeCompare(vb):(va>vb?1:va<vb?-1:0))*SORT.d||b.xp-a.xp});
    const day=864e5,now=Date.now(),act=d=>st.filter(x=>x.ts&&now-x.ts<d).length,mid=new Date().setHours(0,0,0,0),WMS={'30':18e5,day:now-mid,week:7*day},total=(typeof ROSTER!=='undefined'?ROSTER.hashes.length-1:st.length);
    const dec={};st.forEach(x=>Object.entries(x.u.plansSaved||{}).forEach(([id,p])=>{const e=I[id];if(!e||!p.checked)return;(p.sel||[]).forEach(j=>{const c=e.q.chips[j];if(c&&!c.g){const k=id+'|'+j;dec[k]=dec[k]||{t:c.t,why:c.why,where:e.label,n:0};dec[k].n++}})}));
    const topDec=Object.values(dec).sort((a,b)=>b.n-a.n).slice(0,8);
    const areas=[...new Set(Object.values(I).map(e=>e.area))].map(a=>({a,label:a[0]===CRS.bPfx?tkLabel(a):caseName(CASE_ALL.find(c=>'c:'+c.id===a))+' (case practice)',n:st.filter(x=>[...x.done].some(id=>I[id]&&I[id].area===a)).length})).sort((a,b)=>a.n-b.n).slice(0,6);
    el.innerHTML=`<div class="stats" style="margin:12px 0"><div class="stat"><b>${st.length}/${total}</b><span>signed up</span></div><div class="stat"><b>${act(18e5)}</b><span>active in last 30 min</span></div><div class="stat"><b>${act(day)}</b><span>active today</span></div><div class="stat"><b>${act(7*day)}</b><span>active this week</span></div><div class="stat"><b>${st.length?Math.round(st.reduce((t,x)=>t+x.xp,0)/st.length):0}</b><span>average XP</span></div></div>
    <div class="tablewrap"><table class="wide"><tr><th>#</th>${[['name','Name']].map(sh).join('')}<th>ID</th>${[['xp','XP']].map(sh).join('')}<th>Level</th><th>🔥</th>${[['ts','Last active'],['wk','This week']].map(sh).join('')}<th>Plans</th><th>Timed</th><th>Typed</th><th title="Pastes blocked and too-fast answers. Large inserts kept (usually voice typing) are listed in each profile.">Flags</th><th>Badges</th><th>Weak topics</th></tr>
    ${st.filter(x=>(WIN==='all'||(x.ts&&now-x.ts<WMS[WIN]))&&(!q||x.name.toLowerCase().includes(q)||x.id.toLowerCase().includes(q))).map((x,i)=>`<tr class="click" data-sid="${esc(x.id)}" tabindex="0"><td>${i+1}</td><td>${esc(x.name)}</td><td>${esc(x.id)}</td><td><b>${x.xp}</b></td><td>${esc(x.lv)}</td><td>${x.str}</td><td>${ago(x.ts)}</td><td>${stFmt(x.wk)}</td><td>${x.plans}</td><td>${x.timed}</td><td>${x.typed}</td><td>${x.flags?'<b style="color:var(--gold)">'+x.flags+'</b>':'0'}</td><td>${x.badges}</td><td style="font-size:.82rem">${esc(x.weak.join('; ')||'–')}</td></tr>`).join('')||`<tr><td colspan="14" class="muted">${st.length?'No students active in this period.':'No students have signed in with a PIN yet.'}</td></tr>`}</table></div>
    <div class="grid g2" style="margin-top:16px"><div><h3>Decoys the class picks most</h3>${topDec.length?`<ol class="sumlist">${topDec.map(d=>`<li><b>${esc(d.t)}</b> <span class="tag">${d.n} student${d.n===1?'':'s'}</span><div class="muted" style="font-size:.82rem">${esc(d.where)}${d.why?' · '+esc(d.why):''}</div></li>`).join('')}</ol>`:'<p class="muted">No decoys picked yet.</p>'}</div>
    <div><h3>Practised by the fewest students</h3><ol class="sumlist">${areas.map(a=>`<li>${esc(a.label)} <span class="tag">${a.n}/${st.length||0}</span></li>`).join('')}</ol></div></div>
    <button class="btn ghost sm" id="csv" style="margin-top:12px">⬇ Download CSV</button>`;
    $('#csv').onclick=()=>{const q=v=>'"'+String(v).replace(/"/g,'""')+'"',rows=[['Name','ID','XP','Level','Streak','Last active','Screen time this week (min)','Plans','Timed','Typed','Integrity flags','Badges','Weak topics']].concat(st.map(x=>[x.name,x.id,x.xp,x.lv,x.str,x.ts?x.ts.toISOString():'',Math.round(x.wk/60),x.plans,x.timed,x.typed,x.flags,x.badges,x.weak.join('; ')]));
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download=CRS.id+'-class-'+today()+'.csv';a.click()};
    el.querySelectorAll('[data-sk]').forEach(h=>h.onclick=()=>{SORT=SORT.k===h.dataset.sk?{k:SORT.k,d:-SORT.d}:{k:h.dataset.sk,d:h.dataset.sk==='name'?1:-1};drawDash(list)});
    el.querySelectorAll('tr[data-sid]').forEach(r=>{r.onclick=()=>openStudent(r.dataset.sid);r.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();openStudent(r.dataset.sid)}}})}}
function start(){if(ACT&&!start.done){start.done=1;return actionPage(ACT)}hook('beforeMe');ME=me();if(!ME)return gate();load();hook('afterLoad');if(!U.badges.boarding){checkBadges();save()}hud();route();presOn();if(ME.cloud)cloudSync();if(!U.tour)setTimeout(()=>{if(ME&&!U.tour&&!document.querySelector('.modal'))tour(0)},700);else if(!U.inst)setTimeout(()=>{if(ME&&!document.querySelector('.modal'))installPop(1)},1200)}
function route(){CLOUD.unwatch();hook('leave');if(!ME)return gate();const h=location.hash.replace(/^#\/?/,'').split('/');
  if(ROUTES[h[0]])return ROUTES[h[0]](h);
  if(h[0]==='student')return studentPage(String(h[1]||'').toUpperCase());
  if(h[0]==='live')return livePage();
  if(h[0]==='session')return sessionReport(String(h[1]||''));
  ({'':home,cases:caseList,badges:badgesPage,board:boardPage,lecturer:lecturer}[h[0]]||home)()}
/* new term (docs/NEW-TERM.md): CRS.termStart hides leaderboard rows nobody has saved since the term began */
const termNow=r=>{const t0=CRS.termStart?Date.parse(CRS.termStart+'T00:00:00+05:00'):0,t=r.t&&r.t.toMillis?r.t.toMillis():+r.t||0;return !t0||t>=t0};
/* accessibility: after moving to another page, keyboard and screen-reader users start at the new content */
window.addEventListener('hashchange',()=>setTimeout(()=>{const m=document.getElementById('main');if(m&&!m.contains(document.activeElement)&&!document.querySelector('.modal'))m.focus({preventScroll:true})},60));
