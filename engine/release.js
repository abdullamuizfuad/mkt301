/* MKT Arena engine: Version 2.1.
   - One sign-out per device after the update, so everyone starts 2.1 cleanly. Progress is never deleted: the cloud copy is saved first
     (and if it can't be saved, e.g. offline, the sign-out waits for a later visit), and a copy of the device's progress is kept in
     localStorage (u_bak21_<SID>). Device-only progress stays on the device and comes back when the student signs in again.
   - Then the What's new popup (once per student, U.seen21), with "Read more" → #/whatsnew (also in the footer).
   - Then the name confirmation (names.js waits for any open popup, so it follows). */
const APP_VERSION='2.1';
function verBanner(){if(document.getElementById('verban'))return;document.body.insertAdjacentHTML('afterbegin',`<div class="verban" id="verban" role="status"><b>✨ Version ${APP_VERSION} is here.</b> Please sign in again. Your progress is safe.<button class="x" aria-label="Close" onclick="verClose()">✕</button></div>`)}
function verClose(){LS.del('vermsg');const b=document.getElementById('verban');if(b)b.remove()}
onHook('beforeMe',()=>{if(LS.get('vermsg',0)&&!LS.get('session',null))setTimeout(verBanner,0)});
onHook('afterLoad',()=>{if(LS.get('ver','')===APP_VERSION)return;const sid=ME&&ME.sid;
  /* a first visit or a new device: nothing to sign out of */
  if(!sid||!U){LS.set('ver',APP_VERSION);return}
  if(!(U.days||[]).length&&!U.xp){LS.set('ver',APP_VERSION);U.seen21=1;save();return}
  setTimeout(async()=>{if(!ME||ME.sid!==sid||LS.get('ver','')===APP_VERSION)return;
    try{LS.set('u_bak21_'+sid,JSON.parse(JSON.stringify(U)))}catch(e){}
    if(ME.cloud){const t0=Date.now();while(Date.now()-t0<20000&&CLOUD.state!=='synced')await new Promise(r=>setTimeout(r,400));if(CLOUD.state!=='synced')return;/* try again next visit */
      try{save();await CLOUD.flush()}catch(e){return}if(CLOUD.state!=='synced')return}
    LS.set('ver',APP_VERSION);LS.set('vermsg',1);closeModal();await signOut();verBanner()},1500)});
onHook('afterLoad',()=>{if(LS.get('ver','')!==APP_VERSION)return;verClose();if(!U||U.seen21||!ME||ME.sid===LECTURER)return;
  if(!(U.days||[]).length&&!U.xp){U.seen21=1;save();return}/* brand-new students get the tour instead */
  const show=()=>{if(!U||U.seen21||!ME)return;if(document.querySelector('.modal'))return setTimeout(show,1500);U.seen21=1;save();
    const m=modal("What's new",`<div style="text-align:center"><div style="font-size:2.4rem">✨</div><h2 style="margin:4px 0">What's new in Version ${APP_VERSION}</h2></div>
    <ul class="sumlist">${WHATSNEW.slice(0,5).map(w=>`<li>${w[0]} <b>${esc(w[1])}</b></li>`).join('')}</ul>
    <div class="row" style="justify-content:center;margin-top:12px"><a class="btn ghost" href="#/whatsnew" id="wnmore">Read more</a><button class="btn" id="wnok">Let's go</button></div>`);
    $('#wnok').onclick=closeModal;$('#wnmore').onclick=()=>closeModal()};setTimeout(show,900)});
const WHATSNEW=[
  ['🏠','Your own dashboard','Home now shows your level, streak, what to do next, a day-by-day countdown, your readiness for each area and your weak spots.'],
  ['🧑‍🎨','Build your avatar','Pick your character, skin, hair, eyes, expression, outfit and headgear (headphones and a veil can go together). Tap your avatar on Home.'],
  ['🧠','Review and flashcards','Questions you practise come back after 1, 3, 7 and 14 days. Say how sure you are first: the 😬 sure-but-wrong ones are worth a second look.'],
  ['❄️','Streak freezes','Every 4 days in a row earns a freeze that covers a missed day.'],
  ['📝','Practice paper','From Sun 22 Nov: 3 hours, section by section. Finish a section early and the time carries forward. Then check yourself against the key ideas and see your report.'],
  ['🪪','Your official name and @username','The leaderboard shows your official name. Confirm it and pick your @username.'],
  ['⚔️','Challenges, weekend teams and quiz battles','Challenge up to 5 classmates, play for your section on Fridays and Saturdays, and join live quiz battles in class. These appear when your lecturer switches them on.'],
  ['🔔','Notifications','Invites and results in the 🔔 bell, and you can choose to see when classmates are studying.'],
  ['💡','Hints','Stuck on a plan? A hint shows the start of a key idea you haven\'t picked.'],
  ['🚩','Report a problem','Spotted a mistake in a question? Report it from the question and your lecturer will see it.']];
ROUTES.whatsnew=()=>shell('#/',`<p><a href="#/">← Home</a></p><h1>✨ What's new in Version ${APP_VERSION}</h1>
  <div class="grid g2">${WHATSNEW.map(w=>`<div class="card"><div class="em">${w[0]}</div><h3 style="margin:4px 0">${esc(w[1])}</h3><p class="muted" style="margin:0">${esc(w[2])}</p></div>`).join('')}</div>
  <p class="muted" style="margin-top:16px">Your progress, XP and badges came with you. <a href="javascript:void 0" onclick="tour(0)">? How it works</a></p>`);
