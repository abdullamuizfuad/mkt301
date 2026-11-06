/* Site tests for the top-students update (shared by MKT101 and MKT301; required by run.js): Expert sets (engine/expert.js),
   the new levels, review XP, the weekly board row and the tutorial offer. Courses without Expert sets (CRS.expert off) skip the set tests. */
module.exports=({page,ok,STUDENT,LECT,shot})=>{
const on=p=>p.evaluate(()=>EX_ON());
const seed=(p,mt,exa)=>p.evaluate(([mt,exa])=>{U.mt=Object.assign({},U.mt||{},mt);EXA=exa;if(!U.days.includes(today()))U.days.push(today());save()},[mt,exa]);/* the day's check-in is done, so XP counts are exact */
return {
/* every student sees every set: locked with progress, "Coming soon" until approved, open once unlocked and approved */
async excards(){const p=await page({sid:STUDENT});if(!await on(p)){await p.go('#/practice');ok(!await p.$('[data-ex]'),'Expert cards on a course without sets');return p.done()}
  await seed(p,{},{});await p.go('#/practice');let st=await p.$$eval('[data-ex]',e=>e.map(x=>x.dataset.st));
  ok(st.length===7&&st.every(s=>s==='soon'),'not approved: '+st);ok((await p.textContent('[data-ex="9"]')).includes('Unlocks when you master Topic 9'),'lock text missing while not approved');
  await seed(p,{8:[15,13],9:[10,9]},{t8:true,t9:true});await p.go('#/expert');st=await p.$$eval('[data-ex]',e=>Object.fromEntries(e.map(x=>[x.dataset.ex,x.dataset.st])));
  ok(st[8]==='open'&&st[9]==='locked'&&st[10]==='soon','states: '+JSON.stringify(st));
  const t9=await p.textContent('[data-ex="9"]');ok(t9.includes('10 / 15 answered')&&t9.includes('90% correct'),'progress line: '+t9);
  ok((await p.textContent('[data-ex="8"]')).includes('up to +90 XP'),'max XP missing');ok(!await p.$('main [data-lect]'),'lecturer-only element on the Expert page');
  await p.go('#/expert/9');ok(!await p.$('#exq')&&await p.$('[data-ex="9"][data-st="locked"]'),'a locked set opened');
  await p.go('#/notes/8');ok(await p.$('[data-ex="8"]'),'no Expert card on the topic notes page');await shot(p,'expert-cards');await p.done()},
/* unlocking celebrates once and is remembered */
async exunlock(){const p=await page({sid:STUDENT});if(!await on(p))return p.done();await seed(p,{11:[15,12]},{t11:true});await p.go('#/practice');await p.go('#/');
  const r=await p.evaluate(()=>[U.exu&&U.exu[11],document.querySelector('#toasts').textContent]);ok(r[0]&&r[1].includes('Expert set unlocked: Topic 11'),'unlock not celebrated: '+r);
  await p.go('#/practice');ok(!(await p.evaluate(()=>document.querySelector('#toasts').textContent.split('Expert set unlocked').length>2)),'unlock celebrated twice');await p.done()},
/* case MCQs: +4 once a question a day, first try counts; paragraph builders: up to +10 */
async exxp(){const p=await page({sid:STUDENT});if(!await on(p))return p.done();await seed(p,{8:[15,13]},{t8:true});
  const x0=await p.evaluate(()=>U.xp);await p.go('#/expert/8/m');await p.click('#exq [data-o="0"]');
  let r=await p.evaluate(()=>[U.xp,U.exs[8].m['x8-1'],!!U.log['xmcq:x8-1:'+today()]]);ok(r[0]===x0+4&&r[1]===1&&r[2],'correct MCQ: '+r);
  await p.go('#/expert/8');await p.go('#/expert/8/m');await p.evaluate(()=>{U.exs[8].m={}});await p.go('#/expert/8');await p.go('#/expert/8/m');await p.click('#exq [data-o="0"]');
  ok(await p.evaluate(()=>U.xp)===x0+4,'the same question paid twice in a day');
  await p.click('#exnx');await p.click('#exq [data-o="1"]');r=await p.evaluate(()=>[U.xp,U.exs[8].m['x8-2']]);ok(r[0]===x0+4&&r[1]===0,'wrong MCQ: '+r);
  await p.go('#/expert/8/c');const it=await p.evaluate(()=>EXPERT.sets[8].chips[0].chips.map((c,j)=>c.ok?j:-1).filter(j=>j>=0));
  for(const j of it)await p.click(`#exc [data-in="${j}"]`);await p.click('#exc [data-ck]');
  r=await p.evaluate(()=>[U.xp,U.exs[8].c['xc8a'],!!U.log['xchip:xc8a:'+today()]]);ok(r[0]===x0+14&&r[1]===1&&r[2],'paragraph builder: '+r);await p.done()},
/* the essay is the written-answer card and joins the marking queue under its own id */
async exessay(){const p=await page({sid:STUDENT});if(!await on(p))return p.done();await seed(p,{12:[16,15]},{t12:true});await p.go('#/expert/12/e');
  ok(await p.$('#q-xe12 .chip'),'essay planning chips missing');
  const r=await p.evaluate(()=>{const q=EXPERT.sets[12].essay,k=submitAnswer(q,{short:1},{txt:'test'},{band:3,found:[],struct:{},words:1});return [U.ans[k].q,(qIndex()['xe12']||{}).label]});
  ok(r[0]==='xe12'&&/Expert set/.test(r[1]),'essay not in the marking queue: '+r);await p.done()},
/* the stars above Marketing Consultant, with their level badges */
async exlevels(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>[LEVELS.length,level(LEVELS[LEVELS.length-1][0]+1).name,BADGES.some(b=>b.id==='lvl'+LEVELS.length),LEVELS[LEVELS.length-1][1]]);
  if(r[0]>9)ok(/Marketing Partner/.test(r[1])&&r[2],'top level: '+r);else ok(r[1]===r[3],'top level: '+r);await p.done()},
/* review: +4 when remembered, nothing when forgotten, at most 25 a day */
async exrev(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{if(!U.days.includes(today()))U.days.push(today());const id=Object.keys(qIndex())[0];U.srs={};const x0=U.xp;
    U.srs[id]={s:0,due:today()};srsDone(id,false);const a=U.xp-x0;U.srs[id]={s:1,due:addDays(today(),-1)};srsDone(id,true);const b=U.xp-x0;
    U.revx={d:today(),n:REV_CAP};U.srs[id]={s:2,due:addDays(today(),-2)};srsDone(id,true);return [a,b,U.xp-x0]});
  ok(r.join()==='0,4,4','review XP / cap: '+r);await p.go('#/');ok(/to review/.test(await p.textContent('#trv')),'review chip missing');await p.done()},
/* the board row carries this week's XP only once the newest rules are published */
async exweek(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{PR.r3=false;const a=rowOf(ME.sid);PR.r3=true;const b=rowOf(ME.sid);PR.r3=null;return [('w' in a),b.wk===wildWin().id,typeof b.w]});
  ok(r.join()==='false,true,number','weekly row: '+r);await p.done()},
/* tutorial: a joined student who has mastered the topic is offered the Expert set */
async extut(){const p=await page({sid:STUDENT});if(!await on(p))return p.done();await seed(p,{10:[15,14]},{t10:true});
  const r=await p.evaluate(()=>[exTutHTML([10]).includes('#/expert/10'),exTutHTML([11]),exTutAllowed(['expert','10'],[10]),exTutAllowed(['expert','11'],[10])]);
  ok(r[0]&&r[1]===''&&r[2]&&!r[3],'tutorial offer: '+r);await p.done()},
/* the lecturer previews every set and approves them on the Lecturer tab */
async exlect(){const p=await page({sid:LECT});if(!await on(p))return p.done();await p.go('#/expert');
  const st=await p.$$eval('[data-ex]',e=>e.map(x=>x.dataset.st));ok(st.length===7&&st.every(s=>s==='preview'),'lecturer preview: '+st);
  ok(await p.evaluate(()=>LCARDS.some(c=>c.id==='expac')&&!!LF_META.expac),'approval card missing');await p.done()}
}};
