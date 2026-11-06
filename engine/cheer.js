/* MKT Arena engine: celebrations, the daily streak fire, secret levels and the lecturer's encouragement.
   - celebrate({id, ico, title, sub, next, gold}): a centred popup with a canvas confetti burst (none with prefers-reduced-motion) and an
     OK button. Several queue up one after another. Never for the lecturer or in View as student, and never twice for the same id
     (U.cel = {id: date}, additive). Level-ups (lvl<i>) and new badges (b:<id>) use it instead of the plain toast (core.js award/checkBadges).
   - Streak fire: on the first visit of the day a popup says how to keep the streak (U.fire.d); the day counts once the student earns XP
     from any practice (the daily check-in) or has 5 minutes of active study time (presence screen time with the 2-minute idle rule, stFlush
     → stDay()). The moment it counts: "🔥 Streak saved! Day N" (once a day, U.fire.s). Streak freezes work as before.
   - Secret levels: CRS.secretFrom = the first secret level's index. Below the level before it, those levels show as "🔒 ??? Secret level";
     reaching it reveals them with a celebration (id 'secret').
   - Encouragement: the lecturer's "🌟 Encourage top students" card writes a note (reviews/{SID}.m.note_enc_<time>, no rules change);
     the student sees a gold celebration on their next open (applyMarks → cheerNote), then the message stays in their messages. */
const CHEER={STUDY:300};
const cheerOK=()=>typeof ME!=='undefined'&&ME&&ME.sid!==LECTURER&&!VIEWAS&&typeof U!=='undefined'&&U;
const calm=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
let CELQ=[],CELON=false;
function celebrate(c){if(!cheerOK()||!c||window.__noCeleb)return false;/* tests turn celebrations off like the break reminders */U.cel=U.cel||{};if(c.id&&U.cel[c.id])return false;if(c.id){U.cel[c.id]=today();save()}
  if(CELQ.some(x=>x.id&&x.id===c.id))return true;CELQ.push(c);celNext();return true}
function celNext(){if(CELON||!CELQ.length)return;if(document.querySelector('.modal')||document.querySelector('.celeb')){setTimeout(celNext,1200);return}
  const c=CELQ.shift();CELON=true;const el=document.createElement('div');el.className='celeb'+(c.gold?' gold':'')+(c.fire?' fire':'');el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',c.title);
  el.innerHTML=`<canvas class="confetti" aria-hidden="true"></canvas><div class="card celc"><div class="celi${c.fire&&!calm()?' flame':''}" aria-hidden="true">${c.ico||'🎉'}</div><h2>${esc(c.title)}</h2>${c.sub?`<p>${esc(c.sub)}</p>`:''}${c.next?`<p class="muted celn">${esc(c.next)}</p>`:''}
    <button class="btn${c.gold?' gold':''}" id="celok">OK</button></div>`;document.body.append(el);
  if(!calm()&&c.confetti!==false)confetti(el.querySelector('canvas'),c.gold);
  const close=()=>{el.remove();CELON=false;setTimeout(celNext,250)};$('#celok').onclick=close;$('#celok').focus();el.onkeydown=e=>{if(e.key==='Escape')close()}}
/* a small canvas confetti burst (no library) */
function confetti(cv,gold){const ctx=cv.getContext&&cv.getContext('2d');if(!ctx)return;const W=cv.width=innerWidth,H=cv.height=innerHeight,cols=gold?['#f5c518','#ffd95e','#fff2b3','#e0a800']:['#22c55e','#8b5cf6','#f5c518','#3b82f6','#ef4444','#ec4899'];
  const P=Array.from({length:120},()=>({x:W/2,y:H*.42,vx:(Math.random()-.5)*12,vy:-Math.random()*11-4,s:4+Math.random()*5,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[Math.floor(Math.random()*cols.length)]}));let t0=null;
  const step=t=>{if(!document.body.contains(cv))return;t0=t0||t;const age=t-t0;ctx.clearRect(0,0,W,H);P.forEach(p=>{p.vy+=.3;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.globalAlpha=Math.max(0,1-age/2600);ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);ctx.restore()});
    if(age<2600)requestAnimationFrame(step);else ctx.clearRect(0,0,W,H)};requestAnimationFrame(step)}

/* ---------- levels and badges ---------- */
function celebLevel(i){const L=LEVELS[i];if(!L)return false;const nx=LEVELS[i+1];const ok=celebrate({id:'lvl'+i,ico:(typeof LVL_ICO!=='undefined'&&LVL_ICO[i])||'🚀',title:'Level up! '+L[1],sub:'You reached level '+(i+1)+'.',
  next:nx?(secretLvl(i+1,{xp:L[0]})?'Next: a secret level. Keep going to find out what it is.':'Next: '+nx[1]+' at '+nx[0]+' XP.'):'You are at the top level. Try the Expert sets and Boss rounds.'});
  if(CRS.secretFrom&&i===CRS.secretFrom-1)celebrate({id:'secret',ico:'🗝️',gold:true,title:'Secret levels unlocked!',sub:LEVELS.slice(CRS.secretFrom).map(l=>l[1]).join(' · '),next:'Expert sets and Boss rounds in Practice help you climb them.'});return ok}
function celebBadge(b){if(!b)return false;if(/^lvl\d+$/.test(b.id))return true;/* level badges come with the level-up celebration */
  return celebrate({id:'b:'+b.id,ico:b.ico,title:'Badge unlocked: '+b.name,sub:b.d,next:'See all your badges under My progress.'})}

/* ---------- secret levels ---------- */
function secretLvl(i,u){const f=typeof CRS!=='undefined'&&CRS.secretFrom;if(!f||i<f)return false;u=u||(typeof U!=='undefined'?U:null);if(!u)return true;if(typeof ME!=='undefined'&&ME&&ME.sid===LECTURER&&!VIEWAS)return false;return level(u.xp|0).i<f-1}
const lvlName=(i,u)=>secretLvl(i,u)?'🔒 ??? Secret level':(LEVELS[i]||[0,''])[1];
/* students already past the reveal when this arrived see it once */
onHook('afterLoad',()=>{if(cheerOK()&&CRS.secretFrom&&level(U.xp|0).i>=CRS.secretFrom-1)setTimeout(()=>celebrate({id:'secret',ico:'🗝️',gold:true,title:'Secret levels unlocked!',sub:LEVELS.slice(CRS.secretFrom).map(l=>l[1]).join(' · '),next:'Expert sets and Boss rounds in Practice help you climb them.'}),1500)});

/* ---------- the daily streak fire ---------- */
function streakHello(){if(!cheerOK()||window.__noStreakHello)return;const t=today();U.fire=U.fire||{};if(U.fire.d===t)return;
  if(!(U.days||[]).length){U.fire.d=t;return save()}/* brand-new students get the tour instead */
  U.fire.d=t;save();if((U.days||[]).includes(t))return;const n=streak(U);
  celebrate({ico:'🔥',fire:true,confetti:false,title:n?'Day '+n+' streak':'Start a new streak today',sub:n?'Do one activity, or spend 5 minutes studying, to keep it alive today.':'Do one activity, or spend 5 minutes studying, and day 1 is yours.',next:'Your streak counts the days you practise in a row.'})}
onHook('afterLoad',()=>setTimeout(streakHello,900));onHook('cloud',()=>setTimeout(streakHello,1200));
/* the moment today counts (core.js award → the daily check-in) */
function streakSaved(){if(!cheerOK())return false;const t=today();U.fire=U.fire||{};if(U.fire.s===t)return true;U.fire.s=t;const n=streak(U);
  return celebrate({ico:'🔥',fire:true,title:'Streak saved! Day '+n,sub:'+10 XP daily check-in.',next:n>=3?'Keep it going tomorrow.':'Come back tomorrow to make it '+(n+1)+'.'})}
/* 5 minutes of active study time also counts the day (presence.js stFlush) */
function stDay(){if(!cheerOK())return;const t=today();if((U.days||[]).includes(t))return;if((((U.st||{})[stYmd(new Date())])|0)>=CHEER.STUDY)award('stday:'+t,0,'',1)}

/* ---------- encouragement from the lecturer ---------- */
const ENC_DEF="You've been doing brilliantly! 🌟 Secret levels and Expert sets are now open for you to unlock in Practice. Keep going!";
function cheerNote(key,fb){if(!/^note_enc_/.test(key))return;celebrate({id:'n:'+key,ico:'🌟',gold:true,title:'A message from your lecturer',sub:fb,next:'You can read it again in your messages.'})}
if(typeof LF_META!=='undefined')LF_META.encc=['🌟 Encourage top students','Send a gold celebration message'];
if(typeof lcard==='function')lcard('encc',el=>{el.hidden=false;let mode='w',rows=[],sel=new Set();const W=typeof wildWin==='function'?wildWin():null;
  const top=()=>{const r=rows.map(x=>Object.assign({},x,{v:mode==='w'?(W&&x.wk===W.id?x.w|0:0):x.x|0})).sort((a,b)=>b.v-a.v);return r};
  const draw=()=>{const r=top();el.innerHTML=`<h2 style="margin:0">🌟 Encourage top students</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Send a message that opens as a gold celebration with confetti the next time each student opens the app, then stays in their messages.
    ${typeof PUSH_ON!=='undefined'&&PUSH_ON?'It also goes to their phone with your next push run.':'Phone notifications are not set up, so it is in-app only.'}</p>
    <div class="row"><button class="btn ghost sm${mode==='w'?' on':''}" data-em="w">This week</button><button class="btn ghost sm${mode==='a'?' on':''}" data-em="a">All time</button><button class="btn ghost sm" id="entop">Select the top 3</button></div>
    <div id="enl" style="margin-top:8px">${r.length?r.map((x,i)=>`<label class="row ppchk" style="justify-content:space-between"><span><input type="checkbox" data-es="${esc(x.id)}"${sel.has(x.id)?' checked':''}> ${i+1}. ${esc(showName(x.n,x.id))}</span><span class="muted">${x.v} XP</span></label>`).join(''):'<p class="muted">No leaderboard rows yet.</p>'}</div>
    <label for="entx" style="margin-top:8px">Message</label><textarea id="entx" maxlength="500">${esc(LS.get('enctx',ENC_DEF))}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn gold" id="engo">Send to ${sel.size} student${sel.size===1?'':'s'}</button><button class="btn ghost sm" id="endef">Reset the message</button></div><p class="muted" id="enmsg"></p>`;
    lfTrim($('#enl'),'encc');el.querySelectorAll('[data-em]').forEach(b=>b.onclick=()=>{mode=b.dataset.em;sel=new Set(top().slice(0,3).filter(x=>x.v>0).map(x=>x.id));draw()});
    $('#entop').onclick=()=>{sel=new Set(top().slice(0,3).filter(x=>x.v>0).map(x=>x.id));draw()};$('#endef').onclick=()=>{LS.del('enctx');draw()};
    el.querySelectorAll('[data-es]').forEach(c=>c.onchange=()=>{if(c.checked)sel.add(c.dataset.es);else sel.delete(c.dataset.es);$('#engo').textContent='Send to '+sel.size+' student'+(sel.size===1?'':'s')});
    $('#entx').oninput=e=>LS.set('enctx',e.target.value);
    $('#engo').onclick=async()=>{const tx=$('#entx').value.trim().slice(0,500);if(!sel.size||!tx)return;if(!confirm('Send this message to '+sel.size+' student'+(sel.size===1?'':'s')+'?'))return;$('#engo').disabled=true;
      const k='note_enc_'+Date.now();let n=0;try{for(const s of sel){await CLOUD.put('reviews/'+s,{m:{[k]:{q:'note',fb:tx,at:isoNow(),by:'lecturer'}}},true);n++;
          if(typeof PUSH_ON!=='undefined'&&PUSH_ON&&typeof notify==='function')notify(s,'result','enc','🌟 A message from your lecturer').catch(()=>{})}
        $('#enmsg').textContent='Sent to '+n+' student'+(n===1?'':'s')+'.'}catch(e){$('#enmsg').textContent=CLOUD.say(e)}$('#engo').disabled=false}};
  el.innerHTML='<p class="muted">Loading…</p>';CLOUD.docs('board').then(d=>{rows=d.filter(x=>x.id!==LECTURER);sel=new Set(top().slice(0,3).filter(x=>x.v>0).map(x=>x.id));draw()}).catch(e=>{el.innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`})});
/* a badge as a student sees it: the level badges of secret levels stay hidden */
function badgeShown(b,u){const m=/^lvl(\d+)$/.exec(b.id),i=m?+m[1]-1:-1;if(i>=0&&secretLvl(i,u)&&!((u||U).badges||{})[b.id])return {ico:'🔒',name:'??? Secret level',d:'Reach '+((LEVELS[(CRS.secretFrom||1)-1]||[0,''])[1])+' to reveal it'};
  /* other badges that name a secret level (e.g. the Tutor badge) don't give it away */
  let d=b.d;LEVELS.forEach((l,j)=>{if(secretLvl(j,u)&&d.includes(l[1]))d=d.split(l[1]).join('a secret level')});return d===b.d?b:Object.assign({},b,{d})}
