/* Site tests for celebrations, the daily streak fire, secret levels and encouragement (engine/cheer.js; shared by both courses).
   Other tests run with celebrations off (window.__noCeleb); these turn them on (page({celeb:1})). */
module.exports=({page,ok,STUDENT,LECT,shot})=>{
const okBtn=async p=>{await p.waitForSelector('.celeb #celok');await p.click('#celok');await p.waitForTimeout(350)};
const quiet=p=>p.evaluate(()=>{window.__noStreakHello=1;U.fire={d:today(),s:today()};if(!U.days.includes(today()))U.days.push(today());save()});
return {
/* level-ups and badges queue one after another, each once; never for the lecturer */
async celebqueue(){const p=await page({sid:STUDENT,celeb:1});await quiet(p);await p.evaluate(()=>{document.querySelectorAll('.celeb').forEach(x=>x.remove());CELQ=[];CELON=false});
  await p.evaluate(()=>award('test:big',LEVELS[2][0]+5,'x',1));await p.waitForSelector('.celeb');ok((await p.textContent('.celeb')).includes('Level up! '+(await p.evaluate(()=>LEVELS[1][1]))),'first level-up');
  await p.waitForTimeout(600);await shot(p,'celebrate-level');await okBtn(p);ok((await p.textContent('.celeb')).includes(await p.evaluate(()=>LEVELS[2][1])),'second level-up not queued');await okBtn(p);
  while(await p.$('.celeb'))await okBtn(p);
  const again=await p.evaluate(()=>[celebLevel(1),celebLevel(2),Object.keys(U.cel).filter(k=>/^lvl/.test(k)).length]);ok(again[0]===false&&again[1]===false&&again[2]>=2,'shown twice: '+again);
  await p.evaluate(()=>{BADGES.push({id:'tcel',ico:'🧪',name:'Test badge',d:'A test',t:()=>true});checkBadges()});await p.waitForSelector('.celeb');ok((await p.textContent('.celeb')).includes('Badge unlocked: Test badge'),'badge celebration');
  await p.waitForTimeout(600);await shot(p,'celebrate-badge');await okBtn(p);await p.done();
  const l=await page({sid:LECT,celeb:1});ok(await l.evaluate(()=>celebrate({id:'x',title:'x'}))===false,'celebration for the lecturer');await l.done()},
/* reduced motion: the popup without confetti */
async celebcalm(){const p=await page({sid:STUDENT,celeb:1});await p.emulateMedia({reducedMotion:'reduce'});await quiet(p);
  await p.evaluate(()=>{window.__cn=0;const f=confetti;window.confetti=(...a)=>{window.__cn++;return f(...a)};document.querySelectorAll('.celeb').forEach(x=>x.remove());CELQ=[];CELON=false;celebrate({id:'calm1',ico:'🎉',title:'Calm'})});
  await p.waitForSelector('.celeb');ok(await p.evaluate(()=>window.__cn)===0,'confetti with reduced motion');await okBtn(p);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>celebrate({id:'calm2',ico:'🎉',title:'Party'}));await p.waitForSelector('.celeb');ok(await p.evaluate(()=>window.__cn)===1,'no confetti normally');await p.done()},
/* the first visit of the day asks to keep the streak; one activity saves it; once a day */
async streakfire(){const p=await page({sid:STUDENT,celeb:1});
  await p.evaluate(()=>{const y=addDays(today(),-1),y2=addDays(today(),-2);U.days=[y2,y];U.fire={};U.cel={};U.xp=U.xp||0;save()});await p.reload();await p.waitForSelector('.celeb',{timeout:6000});
  const t=await p.textContent('.celeb');ok(t.includes('Day 2 streak')&&t.includes('keep it alive'),'hello: '+t);await p.waitForTimeout(600);await shot(p,'celebrate-streak-hello');await okBtn(p);
  await p.evaluate(()=>award('mcq:sf:'+today(),2,'x',1));await p.waitForSelector('.celeb');ok((await p.textContent('.celeb')).includes('Streak saved! Day 3'),'saved popup');await p.waitForTimeout(600);await shot(p,'celebrate-streak-saved');await okBtn(p);
  await p.reload();await p.waitForTimeout(2200);ok(!await p.$('.celeb'),'streak popup shown twice in a day');await p.done()},
/* 5 minutes of active study also saves the day; idle time doesn't count */
async streakstudy(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{U.days=U.days.filter(d=>d!==today());const k=stYmd(new Date());U.st=U.st||{};U.st[k]=0;
    PR.pend=0;PR.last=Date.now()-130000;PR.lt=Date.now()-3000;presTick();const idle=PR.pend;
    U.st[k]=297;PR.pend=2;stFlush(false);const before=U.days.includes(today());PR.pend=1;stFlush(false);return [idle,before,U.days.includes(today()),!!U.log['stday:'+today()]]});
  ok(r[0]===0&&r[1]===false&&r[2]===true&&r[3],'5 active minutes: '+r);await p.done()},
/* secret levels: hidden below the reveal level, shown from it, with a celebration */
async secretlvl(){const p=await page({sid:STUDENT,celeb:1});const f=await p.evaluate(()=>CRS.secretFrom|0);if(!f){await p.go('#/badges');ok(!(await p.textContent('main')).includes('Secret level'),'secret levels on a course without them');return p.done()}
  await quiet(p);await p.evaluate(()=>{U.xp=0;save()});await p.go('#/badges');let t=await p.textContent('main');const names=await p.evaluate(f=>LEVELS.slice(f).map(l=>l[1]),f);
  ok((t.match(/\?\?\? Secret level/g)||[]).length>=6&&names.every(n=>!t.includes(n)),'not masked');
  await p.evaluate(f=>{document.querySelectorAll('.celeb').forEach(x=>x.remove());CELQ=[];CELON=false;U.cel={};award('test:sec',LEVELS[f-1][0]-U.xp,'x',1)},f);
  let seen=false;for(let i=0;i<15&&await p.$('.celeb');i++){if((await p.textContent('.celeb')).includes('Secret levels unlocked!')){seen=true;await p.waitForTimeout(600);await shot(p,'celebrate-secret')}await okBtn(p)}ok(seen,'no secret-level celebration');
  await p.go('#/');await p.go('#/badges');t=await p.textContent('main');ok(names.every(n=>t.includes(n))&&!t.includes('??? Secret level'),'not revealed');await p.done()},
/* an encouragement note opens as a gold celebration once, and stays in the messages */
async encnote(){const p=await page({sid:STUDENT,celeb:1});await quiet(p);await p.evaluate(()=>{document.querySelectorAll('.celeb').forEach(x=>x.remove());CELQ=[];CELON=false;applyMarks({note_enc_1:{q:'note',fb:ENC_DEF,at:'2026-11-06',by:'lecturer'}})});
  await p.waitForSelector('.celeb.gold');ok((await p.textContent('.celeb')).includes('Secret levels and Expert sets'),'gold message');await p.waitForTimeout(600);await shot(p,'celebrate-encourage');await okBtn(p);
  await p.evaluate(()=>applyMarks({note_enc_1:{q:'note',fb:ENC_DEF,at:'2026-11-06',by:'lecturer'}}));await p.waitForTimeout(400);ok(!await p.$('.celeb'),'shown twice');ok(await p.evaluate(()=>!!U.notes.note_enc_1),'not kept in messages');await p.done()},
};};
