/* Guest preview: visitors (review panels, colleagues) try the whole arena without an account.
   - "Preview as a guest" on the sign-in card, or open the site with ?guest=1.
   - The guest is a device-only player (ID S000000, never on the class list): XP, badges and progress stay in this browser,
     nothing is sent to Firebase, and the guest never appears on any class board or statistic.
   - The leaderboard shows the whole class anonymised ("Student 1", "Student 2"...), read from public/board, which
     tools/agg/run.mjs writes from the board collection with no names, usernames, avatars or IDs. Needs the `public` rules block.
   Shared engine file: identical in MKT101 and MKT301. */
const GUEST='S000000';
const isGuest=()=>!!(typeof ME!=='undefined'&&ME&&ME.sid===GUEST);
function guestGo(){LS.set('session',{sid:GUEST,name:'Guest',guest:true});location.hash='#/';start()}
async function guestLeave(){const b=document.getElementById('gbar');if(b)b.remove();document.body.classList.remove('guest');await signOut();LS.del('u_'+GUEST)}
/* ?guest=1 opens the preview straight away, unless someone is already signed in on this device */
onHook('beforeMe',()=>{if(/[?&]guest=1/.test(location.search)&&!LS.get('session',null))LS.set('session',{sid:GUEST,name:'Guest',guest:true})});
onHook('afterLoad',()=>{if(!isGuest())return;guestBar()});
function guestCss(){
  if(!document.getElementById('gcss')){const st=document.createElement('style');st.id='gcss';st.textContent=
    '#gbar{position:sticky;top:0;z-index:60;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center;padding:8px 14px;background:#1e2742;color:#fff;font-size:.82rem;line-height:1.35;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.25)}'+
    '#gbar b{font-weight:700}#gbar button{font:inherit;font-weight:700;padding:4px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;cursor:pointer}'+
    '.gsplit{display:flex;align-items:center;gap:10px;margin:16px 0 10px;color:var(--muted,#888);font-size:.8rem}.gsplit::before,.gsplit::after{content:"";flex:1;height:1px;background:var(--line,#ddd)}'+
    '.lb .r.gme{outline:2px solid var(--gold,#d4a017);outline-offset:-2px}';document.head.appendChild(st)}}
function guestBar(){if(document.getElementById('gbar'))return;document.body.classList.add('guest');guestCss();
  const b=document.createElement('div');b.id='gbar';b.setAttribute('role','region');b.setAttribute('aria-label','Guest preview');
  b.innerHTML='<span>👀 <b>Guest preview</b>: your progress stays on this device; classmates are shown without names.</span><button type="button" id="gleave">Leave preview</button>';
  document.body.insertBefore(b,document.body.firstChild);document.getElementById('gleave').onclick=guestLeave}
/* the "Preview as a guest" button under the sign-in form (gate() is the course's sign-in page) */
if(typeof gate==='function'){const _gate=gate;gate=function(msg){_gate(msg);const c=document.querySelector('.signcard');if(!c||c.querySelector('#gst'))return;
  const d=document.createElement('div');d.innerHTML='<div class="gsplit">or</div><button type="button" class="btn ghost" id="gst" style="width:100%">👀 Preview as a guest</button><p class="muted" style="font-size:.8rem;margin:8px 0 0">No sign-in needed. For visitors: try every activity and see the class board without names. Progress stays on your device.</p>';
  c.appendChild(d);guestCss();document.getElementById('gst').onclick=guestGo}}

/* The anonymised class board for guests */
let GBOARD=null;
async function guestBoardData(){if(GBOARD&&Date.now()-GBOARD._t<5*60e3)return GBOARD;
  if(!CLOUD.ok)throw new Error('offline');const d=(await CLOUD.docs('public')).find(x=>x.id==='board');
  if(!d||!Array.isArray(d.rows))throw new Error('none');GBOARD={at:d.at||'',rows:d.rows.filter(r=>termNow(r)),_t:Date.now()};return GBOARD}
async function guestBoard(){
  shell('#/board',`<h1>Leaderboard</h1><p class="muted">The whole class, without names. Students see each other's names and avatars here; in the preview everyone is "Student" and a number. You are on it too, with the XP you earn in this preview.</p>
  <div class="grid g2"><div><div class="tabs lbtabs" role="tablist"><button type="button" class="tab" data-lbt="w" role="tab">This week</button><button type="button" class="tab" data-lbt="a" role="tab">All time</button></div><p class="muted" id="lbw" style="font-size:.84rem;margin:6px 0"></p><div class="card lb" id="lbl"><p class="muted">Loading the class…</p></div></div>
  <div class="card"><h2>You in this preview</h2><p style="margin:0 0 6px">Your score: <b>${U.xp} XP</b> · ${esc(level(U.xp).name)} · ${Object.keys(U.badges).length} badges · 🔥 ${streak(U)}</p>
  <p class="muted" style="font-size:.85rem">Earn XP anywhere in the arena and come back: your row moves up the board. It is only on this device, so classmates never see it.</p>
  <p class="muted" style="font-size:.85rem" id="lbat"></p></div></div>`);
  let tab=LS.get('lbtab','a')==='w'?'w':'a',D=null;const W=typeof wildWin==='function'?wildWin():null;
  const draw=()=>{const el=$('#lbl');if(!el||!D)return;document.querySelectorAll('[data-lbt]').forEach(b=>{const on=b.dataset.lbt===tab;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
    const wk=tab==='w'&&W,mineW=wk&&typeof weekXP==='function'?weekXP(U,W.from,Date.now())|0:0;
    let rows=D.rows.map(r=>({x:wk?(r.wk===W.id?r.w|0:0):r.x|0,l:r.l|0,b:r.b|0,s:r.s|0})).filter(r=>!wk||r.x>0).sort((a,b)=>b.x-a.x).map((r,i)=>Object.assign(r,{k:i+1}));
    const me={x:wk?mineW:U.xp,l:level(U.xp).i,b:Object.keys(U.badges).length,s:streak(U),me:1};rows.push(me);rows.sort((a,b)=>b.x-a.x||(a.me?1:0)-(b.me?1:0));
    $('#lbw').textContent=wk?'XP earned since class on '+wildWhen(W.from)+'. Everyone starts again at zero when the next class starts.':'Total XP since the start of term.';
    el.innerHTML=rows.map((r,i)=>`<div class="r ${r.me?'me gme':''}"><span class="pos ${i<3?'p'+(i+1):''}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><div style="flex:1;min-width:0"><b>${r.me?'You (guest)':'Student '+r.k}</b><div class="muted" style="font-size:.8rem">${esc(LEVELS[r.l]?.[1]||'')} · ${r.b} badge${r.b===1?'':'s'} · 🔥 ${r.s}</div></div><b class="lex" style="color:var(--gold)">${r.x} XP</b></div>`).join('')};
  document.querySelectorAll('[data-lbt]').forEach(b=>b.onclick=()=>{tab=b.dataset.lbt;LS.set('lbtab',tab);draw()});
  try{D=await guestBoardData();const at=D.at?new Date(D.at):null;$('#lbat')&&($('#lbat').textContent=at&&!isNaN(at)?'Class figures updated '+at.toLocaleString('en-GB',{timeZone:'Indian/Maldives',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})+' (Maldives time). They refresh a few times a day.':'');draw()}
  catch(e){const el=$('#lbl');if(el)el.innerHTML='<p class="muted">The class board is not available in the preview right now. It appears once the class figures are published.</p>'}}
if(typeof boardPage==='function'){const _bp=boardPage;boardPage=function(){return isGuest()?guestBoard():_bp()}}
