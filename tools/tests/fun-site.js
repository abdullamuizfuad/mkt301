/* Site tests for fun and tutors (engine/fun.js, engine/agg.js; shared by MKT101 and MKT301, required by run.js):
   Boss rounds and story mode (MKT101 only), speed runs, hard mode, term cards, the Monday recap, class figures and their rewards,
   mentor bonuses, tutors and the lecturer's previews. Cloud-only parts (Ask a tutor, duels, teach-back) are in fun-cloud.js. */
module.exports=({page,ok,STUDENT,LECT,shot})=>{
const boss=p=>p.evaluate(()=>BOSS_ON());
const day=p=>p.evaluate(()=>{if(!U.days.includes(today()))U.days.push(today());save()});/* the day's check-in is done, so XP counts are exact */
const xp=p=>p.evaluate(()=>U.xp);
return {
/* the Practice page shows the fun tiles to every student, with no lecturer-only parts */
async funtiles(){const p=await page({sid:STUDENT});await p.go('#/practice');const t=await p.textContent('.funtiles');const B=await boss(p);
  ok(t.includes('Speed run')&&t.includes('Topic territories')&&t.includes('Ask a tutor')&&t.includes('Streak duels'),'tiles missing: '+t);
  ok(B===t.includes('Boss rounds')&&B===t.includes('Story mode'),'Boss/story tiles wrong for this course');ok(await p.$('#hardt'),'hard mode switch missing');
  ok(!await p.$('main [data-lect]'),'lecturer-only element on Practice');for(const h of ['#/speed','#/collection','#/territories','#/help','#/duels','#/teach','#/write'].concat(B?['#/boss','#/story']:[])){await p.go(h);ok(!await p.$('main [data-lect]'),'lecturer-only element on '+h)}
  await shot(p,'fun-practice',true);await p.done()},
/* Boss rounds: every student sees them; locked until the Expert set is finished; Coming soon until approved; a passed round pays once */
async bossround(){const p=await page({sid:STUDENT});if(!await boss(p))return p.done();await day(p);
  await p.evaluate(()=>{const S=exSet(8);U.exs={8:{m:Object.fromEntries(S.mcq.map(q=>[q.id,1])),c:Object.fromEntries(S.chips.map(q=>[q.id,1]))}};U.fin=Object.assign({},U.fin,{[S.essay.id]:1});EXA={b8:true,b9:true,t8:true};save()});
  await p.go('#/boss');const st=await p.$$eval('[data-boss]',e=>Object.fromEntries(e.map(x=>[x.dataset.boss,x.dataset.st])));
  ok(st[8]==='open'&&st[9]==='locked'&&st[10]==='soon','states: '+JSON.stringify(st));ok((await p.textContent('[data-boss="9"]')).includes('Finish the Topic 9'),'lock text');
  await p.go('#/boss/9');ok(!await p.$('#bgo'),'a locked round opened');await shot(p,'fun-boss-list');
  const x0=await xp(p);await p.go('#/boss/8');await p.click('#bgo');await p.waitForTimeout(150);ok(await p.$('#btm'),'no timer');
  for(const q of await p.$$('[data-bq]')){await (await q.$('[data-o="0"]')).click()}await shot(p,'fun-boss-run',true);await p.click('#bsub');await p.waitForTimeout(200);
  const r=await p.evaluate(()=>[U.boss[8].sc,U.boss[8].pass,!!U.badges.boss8,document.body.textContent.includes('Boss beaten')]);ok(r[0]===75&&r[1]&&r[2]&&r[3],'result: '+r);
  ok(await xp(p)-x0===35,'XP for a passed round: '+(await xp(p)-x0));await shot(p,'fun-boss-result',true);
  await p.click('#bagain');await p.click('#bgo');for(const q of await p.$$('[data-bq]')){await (await q.$('[data-o="0"]')).click()}await p.click('#bsub');await p.waitForTimeout(200);
  ok(await xp(p)-x0===35,'practice try paid XP');ok(await p.evaluate(()=>U.boss[8].sc===75),'first score changed');await p.done()},
/* the 10-minute clock keeps running: an old start is handed in on the next visit */
async bosstimer(){const p=await page({sid:STUDENT});if(!await boss(p))return p.done();
  await p.evaluate(()=>{const S=exSet(10);U.exs={10:{m:Object.fromEntries(S.mcq.map(q=>[q.id,1])),c:Object.fromEntries(S.chips.map(q=>[q.id,1]))}};U.fin={[S.essay.id]:1};EXA={b10:true};U.boss={10:{st:Date.now()-11*60e3,a:{},c:null}};save()});
  await p.go('#/boss/10');await p.waitForTimeout(300);ok(await p.evaluate(()=>U.boss[10].sc===0&&!U.boss[10].pass),'expired round not handed in');await p.done()},
/* story mode: released by the lecturer; a chapter opens after 10 MCQs in its topic; each right decision pays once */
async storymode(){const p=await page({sid:STUDENT});if(!await boss(p))return p.done();await day(p);
  await p.evaluate(()=>{EXA={};save()});await p.go('#/story');ok((await p.textContent('main')).includes('Coming soon'),'story shown before release');
  await p.evaluate(()=>{EXA={story:true};LS.set('exa',EXA);U.mt={8:[10,7]};save()});await p.go('#/');await p.go('#/story');
  const st=await p.$$eval('[data-sch]',e=>e.map(x=>x.dataset.st||'open'));ok(st[0]==='open'&&st[1]==='locked','chapters: '+st);
  const x0=await xp(p);await p.go('#/story/8');await p.click('[data-sq="s8-1"] [data-o="0"]');await p.waitForTimeout(150);ok(await xp(p)-x0===5,'story XP');
  await p.go('#/story/8');ok(await p.$('[data-sq="s8-1"] [data-o="0"][disabled]'),'answered decision not locked');await p.go('#/story/9');ok(!(await p.$('[data-sq]')),'a locked chapter opened');await p.done()},
/* speed run: score, personal best, XP once a day */
async speedrun(){const p=await page({sid:STUDENT});await day(p);await p.evaluate(()=>{FUN.SP_N=3});const x0=await xp(p);await p.go('#/speed');await p.click('#spgo');
  for(let i=0;i<3;i++){await p.waitForSelector('[data-qo="0"]:not([disabled])');await p.click('[data-qo="0"]');await p.waitForTimeout(800)}await p.waitForSelector('#spc h2');
  const r=await p.evaluate(()=>[U.sp.best,U.sp.runs,U.sp.perf]);ok(r[0]>=30&&r[1]===1,'speed run record: '+r);ok(await xp(p)-x0===8,'speed XP (3 right + 5 best): '+(await xp(p)-x0));
  await p.evaluate(()=>ROUTES.speed());await p.click('#spgo');for(let i=0;i<3;i++){await p.waitForSelector('[data-qo="0"]:not([disabled])');await p.click('[data-qo="0"]');await p.waitForTimeout(800)}await p.waitForSelector('#spc h2');
  ok(await xp(p)-x0<=13,'second run paid again');await p.done()},
/* hard mode doubles XP on correct answers, up to +60 extra a day, and hides hints and notes links */
async hardmode(){const p=await page({sid:STUDENT});await day(p);await p.go('#/practice');await p.click('#hardt');ok(await p.evaluate(()=>U.hard&&document.body.classList.contains('hard')),'hard mode not on');
  const r=await p.evaluate(()=>{const a=U.xp;award('mcq:hm1:'+today(),2,'x',1);const b=U.xp;U.hardd.x=59;award('mcq:hm2:'+today(),2,'x',1);const c=U.xp;award('ltimed:hm3:'+today(),5,'x',1);return [b-a,c-b,U.xp-c]});
  ok(r[0]===4&&r[1]===3&&r[2]===5,'hard XP: '+r);await p.go('#/notes/'+(await p.evaluate(()=>funTops()[0][0])));const n=await p.$('.nref');ok(!n||!(await n.isVisible()),'notes link visible in hard mode');
  await p.go('#/practice');await p.click('#hardt');ok(await p.evaluate(()=>!U.hard&&!document.body.classList.contains('hard')),'hard mode not off');await p.done()},
/* term cards: known twice → collected; a whole deck → rare card and badges */
async termcards(){const p=await page({sid:STUDENT});const ok0=await p.evaluate(()=>typeof flashDecks==='function'&&flashDecks().length);if(!ok0)return p.done();
  await p.evaluate(()=>{const d=flashDecks()[0];U.fc=U.fc||{};d.cards.forEach(c=>U.fc[fcId(d.k,c[0])]={s:2,due:'2099-01-01'});checkBadges();save()});
  await p.go('#/collection');ok(await p.$('.tcard.rare'),'no rare card');ok(await p.evaluate(()=>!!U.badges.carddeck),'no Rare card badge');await shot(p,'fun-cards',true);await p.done()},
/* the Monday recap: best day, weakest area and one task; dismissed for the week */
async recap(){const p=await page({sid:STUDENT,clock:1});await p.clock.setFixedTime(new Date('2026-11-09T06:00:00Z'));await p.reload();await p.waitForTimeout(300);
  await p.evaluate(()=>{U.xpd={'2026-11-05':40,'2026-11-06':85};save()});await p.go('#/');const t=await p.textContent('#recap');ok(t.includes('Friday')&&t.includes('+85 XP')&&t.includes('One task'),'recap: '+t);
  await shot(p,'fun-recap');await p.click('#recx');await p.go('#/');ok(!await p.$('#recap'),'recap came back after dismissing');await p.done()},
/* the class figures are worked out the same way everywhere (engine/agg.js) */
async aggfig(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const now=Date.parse('2026-11-11T12:00:00+05:00'),s=t=>Math.round(Date.parse(t)/1000),qa=(t,n,ok)=>Array.from({length:n},(_,i)=>[s(t)+i,'q'+i,i<ok?1:0,0]);
    const users=[{id:'S1',n:'One',u:{qa:qa('2026-11-04T10:00:00+05:00',20,18).concat(qa('2026-10-28T10:00:00+05:00',20,10),qa('2026-11-10T10:00:00+05:00',30,20)),mt:{8:[10,9]}}},
      {id:'S2',n:'Two',u:{qa:qa('2026-11-04T10:00:00+05:00',20,10).concat(qa('2026-10-28T10:00:00+05:00',20,12)),mt:{8:[10,5]}}},{id:'S3',n:'Three',u:{mt:{8:[10,8]}}},{id:'S4',n:'Four',u:{mt:{8:[6,3]}}}];
    const A=aggCompute(users,{S1:'Session 1',S3:'Session 1',S2:'Session 2',S4:'Session 2'},{now,target:25});return [A.wk,A.goal.n,A.goal.done,A.imp.top.map(x=>x.sid).join(),A.imp.top[0]&&A.imp.top[0].d,A.terr[8]&&A.terr[8].own,
      aggSessGroups([{name:'Week 11 tutorial',startedAt:1,p:['X','Y']},{name:'Week 11 tutorial · Session 2',startedAt:2,p:['Y']}]).Y]});
  ok(r[0]==='2026-11-09'&&r[1]===30&&r[2]===true&&r[3]==='S1'&&r[4]===40&&r[5]==='Session 1'&&r[6]==='Session 2','agg: '+JSON.stringify(r));await p.done()},
/* rewards from the class figures and from tutor help are paid once */
async funrewards(){const p=await page({sid:STUDENT});await day(p);const r=await p.evaluate(async()=>{const a=U.xp,wk=aggWeek(Date.now());U.qa=(U.qa||[]).concat([[Math.round(Date.now()/1000),'x',1,0]]);
    FU_AGG={_t:Date.now(),goal:{wk,target:10,n:20,done:true},imp:{wk:'2026-01-05',top:[{sid:ME.sid,n:'Me',d:9}]}};
    window.NOTE=undefined;await funCredit();const b=U.xp;await funCredit();return [b-a,U.xp-b,!!U.badges.goal,!!U.badges.imp]});
  ok(r[0]===40&&r[1]===0&&r[2]&&r[3],'figure rewards: '+r);await p.done()},
/* a mentor bonus arrives as a mark: +15 XP once and the Mentor badge */
async mentbonus(){const p=await page({sid:STUDENT});await day(p);const r=await p.evaluate(()=>{const a=U.xp,m={bonus_ment_s1:{q:'mentor',xp:15,fb:'Mentor bonus: thanks',at:'2026-11-10',by:'lecturer'}};applyMarks(m);const b=U.xp;applyMarks(m);
    return [b-a,U.xp-b,U.fun.ment,!!U.badges.mentor,!!U.notes.bonus_ment_s1]});ok(r[0]===15&&r[1]===0&&r[2]===1&&r[3]&&r[4],'mentor bonus: '+r);await p.done()},
/* tutors: the level and Expert badges make a tutor; the board row carries the topics only on the newest rules */
async tutors(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const c=funCfg(),need=LEVELS[c.tutorLvl][0];const before=isTutor(U);U.xp=need;
    (typeof exTops==='function'?exTops():[]).slice(0,c.tutorEx).forEach(([t])=>U.badges['ex'+t]='2026-11-10');const after=isTutor(U),r1=rowOf(ME.sid);FUN_R=true;const r2=rowOf(ME.sid);FUN_R=null;checkBadges();
    return [before,after,'tu' in r1,r2.tu,!!U.badges.tutor]});ok(r[0]===false&&r[1]===true&&!r[2]&&/^\d+(,\d+)*$/.test(r[3])&&r[4],'tutor: '+JSON.stringify(r));await p.done()},
/* the lecturer previews everything and earns nothing; Boss is a session activity on courses that have it */
async funlect(){const p=await page({sid:LECT});await p.go('#/practice');ok(await p.$('.funtiles'),'no fun tiles for the lecturer');ok(!await p.$('#hardt'),'hard mode offered to the lecturer');
  const B=await boss(p);ok(B===await p.evaluate(()=>actKinds().some(([k])=>k==='boss')),'Boss activity');
  if(B){await p.go('#/boss/8');ok((await p.textContent('main')).includes('Preview'),'no preview');await p.click('#bgo');for(const q of await p.$$('[data-bq]')){await (await q.$('[data-o="0"]')).click()}await p.click('#bsub');await p.waitForTimeout(200);
    ok(await p.evaluate(()=>U.xp|0)===0,'the lecturer earned XP')}await p.done()},
};};
