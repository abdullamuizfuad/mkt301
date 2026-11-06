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
/* signed in when the page opened (an existing session) → the one-time sign-out; signing in now counts as signing in again */
const VER_BOOT=!!LS.get('session',null);
onHook('afterLoad',()=>{if(LS.get('ver','')===APP_VERSION)return;const sid=ME&&ME.sid;
  if(!sid||!U||!VER_BOOT||start.verDone){LS.set('ver',APP_VERSION);return}start.verDone=1;
  setTimeout(async()=>{if(!ME||ME.sid!==sid||LS.get('ver','')===APP_VERSION)return;
    try{LS.set('u_bak21_'+sid,JSON.parse(JSON.stringify(U)))}catch(e){}
    if(ME.cloud){const t0=Date.now();while(Date.now()-t0<20000&&CLOUD.state!=='synced')await new Promise(r=>setTimeout(r,400));if(CLOUD.state!=='synced')return;/* try again next visit */
      try{save();await CLOUD.flush()}catch(e){return}if(CLOUD.state!=='synced')return}
    LS.set('ver',APP_VERSION);LS.set('vermsg',1);closeModal();await signOut();verBanner()},1500)});
/* true while What's new is still to come for this student (the name confirmation waits for it) */
const whatsNewDue=()=>LS.get('ver','')===APP_VERSION&&!window.__noWhatsNew&&!!U&&!U.seen21&&!!ME&&ME.sid!==LECTURER&&!!((U.days||[]).length||U.xp);
/* What's new: once per student, after their progress is loaded (from the cloud when they use a PIN) */
function whatsNew(){if(LS.get('ver','')!==APP_VERSION||window.__noWhatsNew)return;/* tests turn it off like the break reminders */verClose();if(!U||U.seen21||!ME||ME.sid===LECTURER||VIEWAS)return;
  if(!(U.days||[]).length&&!U.xp)return;/* brand-new students get the tour instead */
  const sid=ME.sid,show=()=>{if(!U||U.seen21||!ME||ME.sid!==sid)return;if(document.querySelector('.modal'))return setTimeout(show,1500);U.seen21=1;save();
    const m=modal("What's new",`<div style="text-align:center"><div style="font-size:2.4rem">✨</div><h2 style="margin:4px 0">What's new in Version ${APP_VERSION}</h2></div>
    <ul class="sumlist">${WHATSNEW.slice(0,5).map(w=>`<li>${w[0]} <b>${esc(w[1])}</b></li>`).join('')}</ul>
    <div class="row" style="justify-content:center;margin-top:12px"><a class="btn ghost" href="#/whatsnew" id="wnmore">Read more</a><button class="btn" id="wnok">Let's go</button></div>`);
    $('#wnok').onclick=closeModal;$('#wnmore').onclick=()=>closeModal()};setTimeout(show,900)}
onHook('afterLoad',()=>{if(ME&&!ME.cloud)whatsNew()});onHook('cloud',whatsNew);
const WHATSNEW=[
  ['🎉','Celebrations and your daily streak fire','New levels and badges now arrive with confetti. Each day, one activity or 5 minutes of study keeps your 🔥 streak alive. And there may be a few secret levels to discover…'],
  ['🙋','Ask a tutor and the Tutor badge','Stuck on an idea? Ask a short question under Practice → Ask a tutor. Classmates with the 🎓 Tutor badge answer, and earn XP when their answer helps. Reach the top levels and earn Expert badges to become a tutor yourself.'],
  ...(typeof BOSS_ON==='function'&&BOSS_ON()?[['👹','Boss rounds and story mode','Finish a topic\'s Expert set to face its 10-minute Boss round: a short case, three decisions and a paragraph. Plus story mode: help a Maldivian juice start-up grow, one chapter per topic.']]:[]),
  ['⚡','Speed runs, hard mode and streak duels','Race 20 questions against the clock for a personal best, switch on hard mode for double XP, or challenge a classmate to a 7-day streak duel.'],
  ['🃏','Term cards, class goal and your Monday recap','Collect a card for every key term you know, help the class reach its weekly goal, see who improved most, and get a short recap of your week every Monday.'],
  ...(typeof EX_ON==='function'&&EX_ON()?[['🎓','Expert sets and new levels','Each topic now has an Expert set: harder case questions, paragraph builders and a short essay your lecturer marks. Master a topic\'s MCQs (80%+ on 15) to unlock its set. Above Marketing Consultant there are three new levels to reach: ⭐ Senior Consultant, ⭐⭐ Principal Consultant and ⭐⭐⭐ Marketing Partner.']]:[]),
  ['🏆','This week\'s leaderboard','The leaderboard now opens on "This week": XP earned since the last class, so everyone starts again at zero each week. "All time" is still one tap away.'],
  ['🧠','Review pays','Questions come back for a quick review after 1, 3, 7 and 14 days. Each one you remember earns +4 XP (up to 25 a day).'],
  ['🎓','Past tutorial sessions','After each live session your lecturer publishes a reflection: what was covered, what the class did well and the questions to look at again, with links to the notes. You also see your own minutes, XP and score. Find it under More.'],
  ['🔴','XP and feedback in live sessions','When you join a live tutorial session, the bar shows the XP you have earned in it and any feedback your lecturer sends.'],
  ['🎁','The 6th-spot challenge','Every week your lecturer brings a gift for the top 5 students by XP earned that week. Everyone else gets one 20-minute challenge in the 24 hours before class: the best score wins the 6th gift. Read the notes on the two topics before you start.'],
  ['🧱','Build a paragraph','A new kind of practice: put the right ideas in the right order and leave out the decoys. Find it under Practice.'],
  ['📖','Refer to notes','Written questions now have a "Refer to notes" button that opens the notes for that topic.'],
  ['🏠','A simpler home','Home now shows just today: what to do next, your screen time, missions and reviews, the days left and your practice areas. Everything else, from readiness to badges, is on My progress. Tap your avatar for My profile.'],
  ['📈','My progress','Your readiness for each area, weak spots, a day-by-day countdown, activity, screen time and badges, all in one place.'],
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
