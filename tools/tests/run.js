#!/usr/bin/env node
/* MKT301 Arena end-to-end tests (Playwright + Chromium).
   Run from the repo root:  node tools/tests/run.js
   Starts its own `python3 -m http.server`, runs every group, prints PASS/FAIL and exits non-zero on failure.
   Options: --only=<group>  --headed */
const path=require('path'),{spawn}=require('child_process');
let chromium;try{({chromium}=require('playwright'))}catch(e){console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');process.exit(2)}

const ROOT=path.resolve(__dirname,'../..'),PORT=8700+Math.floor(Math.random()*200),URL0=`http://localhost:${PORT}/`;
const ARGS=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')).map(([k,v])=>[k,v??true]));
const STUDENT='S081441',OTHER='S085542',LECT='S000001';
let browser,fails=0,passes=0;
const ok=(cond,msg)=>{if(!cond)throw new Error(msg)};
const shot=async(p,name,full)=>{if(ARGS.shots)await p.screenshot({path:path.join(ARGS.shots,name+'.png'),fullPage:!!full})};

async function page(opts={}){
  const ctx=await browser.newContext({viewport:{width:opts.w||390,height:opts.h||844},permissions:['clipboard-read','clipboard-write']});
  const p=await ctx.newPage();p.errs=[];
  p.on('pageerror',e=>p.errs.push('pageerror: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/mailto|favicon|fonts\.g/.test(m.text()))p.errs.push('console: '+m.text())});
  p.on('dialog',d=>d.accept());
  if(!opts.breaks)await p.addInitScript(()=>{window.__presNoBreak=1});
  /* already on Version 2.1 (the release test turns this off to see the one-time sign-out) */
  if(opts.ver!==false)await p.addInitScript(()=>{window.__noWhatsNew=1;try{if(!localStorage.getItem('mkt301_ver'))localStorage.setItem('mkt301_ver','"2.1"')}catch(e){}});/* break reminders only in the breaks test */
  if(opts.clock)await p.clock.install();if(opts.init)await p.addInitScript(opts.init);
  await p.goto(URL0);
  if(opts.sid){await p.evaluate(([sid,theme,tour])=>{localStorage.setItem('mkt301_session',JSON.stringify({sid,name:'Test Student'}));
      if(tour)localStorage.setItem('mkt301_u_'+sid,JSON.stringify({tour:1,inst:1}));if(theme)localStorage.setItem('mkt301_theme',JSON.stringify(theme))},[opts.sid,opts.theme,opts.tour!==false]);
    await p.reload();await p.waitForTimeout(300)}
  p.go=async h=>{await p.goto(URL0+h);await p.waitForTimeout(250)};
  p.U=()=>p.evaluate(()=>({xp:U.xp,n:U.n,day:U.day,badges:Object.keys(U.badges)}));
  p.done=async()=>{const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);ok(w[0]<=w[1],`horizontal scroll: ${w[0]} > ${w[1]}`);ok(!p.errs.length,p.errs.join('\n'));await ctx.close()};
  return p}

/* plan the focused question: pick every key idea (flawless) or the first k chips */
async function plan(p,k){const q=p.locator('.qcard').first();
  if(k)for(let j=0;j<k;j++)await q.locator('.chip').nth(j).click();
  else{const id=(await q.getAttribute('id')).slice(2);const good=await p.evaluate(id=>{const all=CASES.flatMap(c=>c.questions).concat(BANK_B);return all.find(x=>x.id===id).chips.map((c,i)=>c.g?i:-1).filter(i=>i>=0)},id);
    for(const j of good)await q.locator(`.chip[data-j="${j}"]`).click()}
  await q.locator('[data-a="check"]').click();await p.waitForTimeout(40)}

/* type into the focused answer box like a person: small chunks, with time passing (needs page({clock:true})) */
async function typeAnswer(p,text,o={}){const ta=p.locator('.qcard textarea');await ta.click();const w=text.split(/\s+/);
  for(let i=0;i<w.length;i+=8){await p.keyboard.insertText(w.slice(i,i+8).join(' ')+' ');if(!o.fast)await p.clock.runFor(6000)}await p.waitForTimeout(20)}
/* an answer built from the focused question's key ideas, with definition, example, evaluation and recommendation */
async function goodText(p){const id=(await p.locator('.qcard').first().getAttribute('id')).slice(2);
  return p.evaluate(id=>{const q=CASES.flatMap(c=>c.questions).concat(BANK_B).find(x=>x.id===id);
    return 'This means '+q.chips.filter(c=>c.g).map(c=>c.t).join('. ')+'. For example, the company can test this first. However, there is a risk. Overall I recommend this approach.'},id)}
const T={
async concepts(){const r=require('child_process').spawnSync(process.execPath,[path.join(__dirname,'concepts.js')],{encoding:'utf8'});ok(r.status===0,'concept unit tests failed:\n'+r.stdout+r.stderr)},

async signin(){const p=await page();
  ok(await p.$('#sid'),'sign-in form missing');
  await p.fill('#nm','Test Student');await p.type('#sid','0814');ok((await p.textContent('#mla')).startsWith('s0814'),'email does not fill while typing');
  ok(await p.$eval('#go',b=>b.disabled),'button should be disabled before verifying');
  await p.type('#sid','41');await p.waitForTimeout(300);ok((await p.textContent('#mst')).includes('Verified'),'listed ID not verified');
  await p.fill('#sid','');await p.type('#sid','099999');await p.waitForTimeout(300);ok((await p.textContent('#mst')).includes('Not found'),'unlisted ID accepted');
  await p.fill('#sid','');await p.type('#sid','5');ok((await p.textContent('#mst')).includes('0'),'leading-digit rule missing');
  await p.fill('#sid','');await p.type('#sid','081441');await p.waitForTimeout(300);await p.click('#go');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>ME&&ME.sid==='S081441'),'sign-in did not complete');await p.done()},

async tour(){const p=await page({sid:STUDENT,tour:false});await p.waitForTimeout(900);ok(await p.$('.modal'),'tour not shown on first sign-in');
  for(let i=0;i<4;i++){await p.click('#tn');await p.waitForTimeout(60)}ok(!await p.$('#tn'),'tour did not close');await p.evaluate(()=>closeModal());
  await p.reload();await p.waitForTimeout(900);ok(!await p.$('#tn'),'tour shown again');await p.evaluate(()=>closeModal());await p.click('#help');ok(await p.$('.modal'),'help link does not open tour');await p.done()},

async cases(){const p=await page({sid:STUDENT,clock:true});const ids=await p.evaluate(()=>CASES.map(c=>c.id));ok(ids.length===3,'expected 3 cases');
  for(const id of ids){await p.go(`#/case/${id}/read`);await p.click('[data-r]');
    await p.go(`#/case/${id}/exhibits`);ok(await p.$$eval('table',t=>t.length)>=5,id+': exhibits missing');
    await p.go(`#/case/${id}/board`);for(const t of await p.$$eval('[data-tp]',e=>e.map(x=>x.dataset.tp))){await p.click(`[data-tp="${t}"]`);
      while(await p.locator('[data-v]:not([disabled])').count()){await p.locator('[data-v]:not([disabled])').first().click();await p.waitForTimeout(20)}}
    await p.go(`#/case/${id}/practice`);const n=await p.$$eval('.dot',d=>d.length-1);ok(n===5,id+': focus mode should show 5 questions');
    for(let i=0;i<n;i++){await plan(p,2);await p.click('[data-a="rplan"]');await p.waitForTimeout(60)}
    ok((await p.textContent('#qs')).includes('Set summary'),id+': summary not shown after last question')}
  const u=await p.U();ok(u.n.verdicts===60,'expected 60 verdicts, got '+u.n.verdicts);await p.done()},

async sectionB(){const p=await page({sid:STUDENT,clock:true});const ids=await p.evaluate(()=>BANK_B.map(q=>q.id));ok(ids.length>=50,'Section B bank too small');
  const bad=await p.evaluate(()=>BANK_B.filter(q=>q.chips.filter(c=>c.g).length<3||!q.chips.some(c=>!c.g)||!q.checks.length||!q.week).map(q=>q.id));ok(!bad.length,'malformed questions: '+bad);
  for(const [k,id] of ids.entries()){await p.evaluate(id=>{U.sets._b=[id];U.bweek=0;(U.focus=U.focus||{})._b=0;save();location.hash='#/short';shortPage()},id);await p.waitForTimeout(60);
    ok(await p.$('#q-'+id),'question not shown: '+id);await plan(p);const r=['rplan','rpaper','rtyped'][k%3];await p.click(`[data-a="${r}"]`);
    if(r==='rpaper'){await p.click('[data-a="tgo"]');await p.clock.fastForward(300000);await p.click('[data-a="done"]');await p.locator('[data-k]').first().check();await p.click('[data-a="fin"]')}
    if(r==='rtyped'){await typeAnswer(p,await goodText(p));await p.click('[data-a="tdone"]');ok(+(await p.textContent('.autob b.big')).split('/')[0]>=4,id+': good typed answer scored low');
      await p.locator('.band input[value="5"]').check();await p.click('[data-a="tfin"]')}
    await p.waitForTimeout(30)}
  const u=await p.U();ok(u.n.timed>=18&&u.n.typed>=18,'routes not counted: timed '+u.n.timed+', typed '+u.n.typed);ok(u.badges.includes('wordsmith'),'Wordsmith badge missing');await p.done()},

async sectionC(){const p=await page({sid:STUDENT,clock:true});const C=await p.evaluate(()=>({s:BANK_C.structured.map(x=>x.id),e:BANK_C.essays.map(x=>({id:x.id,chain:x.chain}))}));
  ok(C.s.length>=4&&C.e.length>=4,'expected 4 + 4 Section C scenarios');
  for(const id of C.s){await p.go('#/essay/ca/'+id);for(const part of ['a','b','c']){const el=p.locator('#cp-'+part);
      for(const g of await el.locator('[data-c]').evaluateAll(b=>[...new Set(b.map(x=>x.dataset.c.split('|')[0]))]))await el.locator(`[data-c^="${g}|0|"]`).click();
      for(const s of await el.locator('select[data-s]').all())await s.selectOption({index:1});
      await el.locator('[data-a="check"]').click();await el.locator('[data-a="go"]').click();await el.locator('[data-a="tgo"]').click();await p.clock.fastForward(1200000);
      await el.locator('[data-a="done"]').click();await el.locator('[data-k]').first().check();await el.locator('[data-a="fin"]').click()}
    ok(await p.evaluate(id=>!!U.log['cadone:'+id],id),id+': scenario not completed')}
  for(const e of C.e){await p.go('#/essay/coach/'+e.id);await p.click('#nx');
    await p.selectOption('select[data-o="0"]','1');await p.click('[data-c^="entry|0|"]');await p.click('[data-a="entry"]');
    for(const t of e.chain)await p.click(`[data-ch="${t.replace(/"/g,'\\"')}"]`);await p.click('[data-a="chain"]');
    await p.click('[data-c^="rev|0|"]');await p.click('[data-a="rev"]');await p.click('[data-rk="0"]');await p.click('[data-c^="mit|0|"]');await p.click('[data-a="risk"]');
    await p.click('[data-a="plandone"]');await p.click('[data-a="toscript"]');await p.click('#nx');await p.click('[data-a="tgo"]');await p.clock.fastForward(1200000);await p.click('[data-a="done"]');
    await p.selectOption('select[data-mk="0"]','3');await p.click('#fin');ok(await p.evaluate(id=>U.ess[id].final&&!!U.log['emark:'+id+':'+today()],e.id),e.id+': essay not completed')}
  await p.done()},

async antiFarming(){const p=await page({sid:STUDENT,clock:true});await p.go('#/case/iceto/practice');
  for(let r=0;r<6;r++){await plan(p);if(r<5)await p.click('[data-a="replan"]')}
  let u=await p.U();ok(u.n.plans===1&&u.n.perfect===1,'re-planning inflated counters: '+JSON.stringify(u.n));const x1=u.xp;
  await p.click('[data-a="restart"]');await p.waitForTimeout(80);u=await p.U();ok(u.xp===x1-25&&u.n.plans===0,'restart did not refund plan XP/counters');
  await plan(p);await p.click('[data-a="rpaper"]');await p.click('[data-a="tgo"]');await p.clock.runFor(5000);await p.click('[data-a="done"]');u=await p.U();ok(u.n.timed===0,'instant timer earned timed credit');
  await p.click('[data-a="restart"]');await plan(p);await p.click('[data-a="rtyped"]');await typeAnswer(p,'too short');await p.click('[data-a="tdone"]');
  await p.click('[data-a="tfin"]');u=await p.U();ok(!u.n.typed,'short typed answer earned credit');
  await p.click('[data-a="restart"]');await plan(p);await p.click('[data-a="rtyped"]');await typeAnswer(p,'word '.repeat(60));await p.click('[data-a="tdone"]');
  ok((await p.textContent('.qcard')).includes('no key ideas'),'off-topic typed answer should earn nothing');await p.click('[data-a="tedit"]');
  await p.locator('.qcard textarea').fill('');await typeAnswer(p,await goodText(p));await p.click('[data-a="tdone"]');
  const exp=await p.evaluate(()=>{const id=document.querySelector('.qcard').id.slice(2);return U.plansSaved[id].chk.xp});const x2=(await p.U()).xp;await p.click('[data-a="tfin"]');u=await p.U();
  ok(exp>=20&&u.xp===x2+exp&&u.n.typed===1,'typed XP should be +'+exp+', got +'+(u.xp-x2));
  ok(await p.evaluate(()=>Object.values(U.ans||{}).some(a=>a.b>=4&&a.t.length>100)),'submitted answer not stored for marking');
  await p.click('[data-a="restart"]');u=await p.U();ok(!u.n.typed&&u.xp===x2-25,'restart did not refund typed XP');await p.done()},

async integrity(){const p=await page({sid:STUDENT,clock:true});await p.go('#/short');await plan(p);await p.click('[data-a="rtyped"]');
  const ta=p.locator('.qcard textarea'),fl=()=>p.evaluate(()=>{const id=document.querySelector('.qcard').id.slice(2);return U.plansSaved[id].fl||{}});
  await ta.click();await p.evaluate(()=>navigator.clipboard.writeText('Pasted from somewhere else. '.repeat(10)));
  await p.keyboard.press('Control+V');await p.waitForTimeout(60);ok(!(await ta.inputValue()).includes('Pasted'),'paste was not blocked');
  let f=await fl();ok(f.paste>=1&&f.ev.some(x=>x.k==='paste'&&x.s.startsWith('Pasted from somewhere')&&x.t&&x.at),'paste snippet not recorded: '+JSON.stringify(f.ev));
  /* one 40-word insertion that isn't a paste (e.g. keyboard voice typing): kept, with a soft flag and a snippet */
  const forty=Array.from({length:40},(_,i)=>'word'+i).join(' ');await ta.fill(forty);await p.waitForTimeout(40);
  ok((await ta.inputValue())===forty,'large insertion was removed');let g=await p.evaluate(()=>U.integ||{});ok(g.paste>=1&&g.bigKept>=1&&!g.big,'flags not counted: '+JSON.stringify(g));
  f=await fl();const k=f.ev.find(x=>x.k==='bigKept');ok(k&&k.s.startsWith('word0 word1')&&k.s.length<=120&&'c' in k,'large insert snippet not recorded: '+JSON.stringify(k));
  ok((await p.textContent('.qcard')).includes('Large inserts are kept but recorded'),'student note missing');
  await ta.fill('');await typeAnswer(p,await goodText(p),{fast:true});await p.click('[data-a="tdone"]');ok((await p.textContent('.qcard')).includes('faster than typing'),'too-fast answer not caught');
  const x=(await p.U()).xp;await p.click('[data-a="tfin"]');ok((await p.U()).xp===x,'too-fast answer earned XP');
  ok(await p.evaluate(()=>Object.values(U.ans).some(a=>a.fl.fast&&a.fl.paste&&a.fl.bigKept&&a.fl.ev.length>=2)),'flags not stored with the answer');await p.done()},

/* a 150-word answer spoken with the 🎤 button over about a minute earns XP (speech is timed at 1 s per 3 words) */
async dictation(){const p=await page({sid:STUDENT,clock:true,init:()=>{window.SpeechRecognition=class{start(){setTimeout(()=>{
    this.onresult&&this.onresult({resultIndex:0,results:[Object.assign([{transcript:window.__T||''}],{isFinal:true})]});this.onend&&this.onend()},60000)}stop(){this.onend&&this.onend()}}}});
  await p.go('#/short');await plan(p);await p.click('[data-a="rtyped"]');const g=await goodText(p);
  const t=(g+' '+'This matters because customers compare options and the firm must respond with a clear plan that fits its market and its budget. '.repeat(8)).split(/\s+/).slice(0,150).join(' ');
  await p.evaluate(t=>{window.__T=t},t);await p.click('[data-a="mic"]');await p.clock.runFor(61000);await p.waitForTimeout(50);
  const v=await p.locator('.qcard textarea').inputValue();ok(v.split(/\s+/).filter(Boolean).length>=150,'dictated text missing');
  const x=(await p.U()).xp;await p.click('[data-a="tdone"]');ok(!(await p.textContent('.qcard')).includes('faster than typing'),'dictated answer marked too fast');
  await p.click('[data-a="tfin"]');ok((await p.U()).xp>x,'dictated answer earned no XP');ok(!(await p.evaluate(()=>U.integ&&(U.integ.bigKept||U.integ.big))),'the 🎤 button was flagged as a large insert');await p.done()},

async mic(){const p=await page({sid:STUDENT,clock:true,init:()=>{window.SpeechRecognition=class{start(){setTimeout(()=>{const t='A grey market is when genuine goods are resold outside the planned channel, for example cheaper cups from Thailand resold in Singapore, which harms the brand and partners.';
    this.onresult&&this.onresult({resultIndex:0,results:[Object.assign([{transcript:t}],{isFinal:true})]});this.onend&&this.onend()},50)}stop(){this.onend&&this.onend()}}}});
  await p.go('#/short');await plan(p);await p.click('[data-a="rtyped"]');ok(await p.$('[data-a="mic"]'),'mic button missing');await p.click('[data-a="mic"]');await p.waitForTimeout(300);
  ok((await p.locator('.qcard textarea').inputValue()).includes('grey market'),'speech not added');ok(!(await p.evaluate(()=>U.integ&&U.integ.big)),'speech was treated as a big insertion');
  ok(await p.evaluate(()=>LS.get('micnote',0)===1),'privacy note not shown');await p.done()},


async backup(){const p=await page({sid:STUDENT});await p.evaluate(()=>{U.xp=777;save()});const code=await p.evaluate(()=>backupCode());ok(/^MKT301[ZB]-/.test(code),'bad backup code');
  await p.evaluate(()=>{localStorage.removeItem('mkt301_u_S081441')});await p.reload();await p.waitForTimeout(200);
  ok((await p.evaluate(c=>restore(c),code))==='',' restore failed');ok((await p.U()).xp===777,'XP not restored');
  await p.evaluate(()=>localStorage.setItem('mkt301_session',JSON.stringify({sid:'S085542',name:'Other'})));await p.reload();await p.waitForTimeout(200);
  ok((await p.evaluate(c=>restore(c),code)).includes('different student'),'another ID could restore');
  ok((await p.evaluate(c=>restore(c.slice(0,-4)+'0000'),code)).includes('damaged'),'damaged code accepted');
  await p.click('#svb');ok(await p.$('.modal #mem'),'Save popup missing');await p.done()},

async missions(){const p=await page({sid:STUDENT});const v=await p.evaluate(()=>[0,1,2].map(t=>pickMissions(t).map(id=>MPOOL.find(m=>m.id===id).t)));
  ok(v.every((a,t)=>a.length===3&&a.every(x=>x===t||x===t-1)),'mission tiers wrong: '+JSON.stringify(v));
  const ms=await p.evaluate(()=>missions().map(m=>m.k));ok(new Set(ms).size===3,'missions track the same activity twice');await p.done()},

async lecturer(){const p=await page({sid:LECT});await p.go('#/lecturer');await p.click('[data-lfall="1"]');await p.waitForTimeout(100);ok(await p.$('#demo'),'demo panel missing');ok(await p.$$eval('#rvw [data-rv]',e=>e.length)>30,'content review list too short');
  ok((await p.textContent('#rvw')).includes('Naver'),'Naver example not listed');await p.done();
  const s=await page({sid:STUDENT});await s.go('#/lecturer');ok(!await s.$('#demo'),'students can open the lecturer page');await s.done()},

async dash(){const p=await page({sid:STUDENT});
  ok(await p.$('#thead')&&await p.$('.tstreak')&&await p.$('#tcd')&&await p.$('#nextact')&&await p.$('#trow')&&await p.$('#ttiles'),'home parts missing');
  ok(/\d+ days? left/.test(await p.textContent('#tcd'))&&/Mon 14 Dec 2026 · 9:00 am/.test(await p.textContent('#tcd'))&&!/exam/i.test(await p.textContent('main')),'countdown wording');await shot(p,'dash-home',true);
  await p.go('#/progress/cd');ok(await p.$('#sec-cd[open] #cdcard')&&await p.$('#rdcard'),'progress parts missing');ok(/Mon 14 Dec 2026 · 9:00 am/.test(await p.textContent('#cdcard')),'full countdown wording');await p.go('#/');
  /* spaced review with the confidence check */
  const id=await p.evaluate(()=>{const id=Object.keys(qIndex()).concat(typeof MCQ_BY!=='undefined'?Object.keys(MCQ_BY):[]).find(k=>revOf(k));U.srs={[id]:{s:0,due:today(),n:0}};save();return id});
  ok(id,'nothing reviewable');const x0=(await p.U()).xp;await p.go('#/review');await p.click('[data-sure="1"]');
  if(await p.$('[data-oi="0"]'))await p.click('[data-oi="0"]');else{await p.click('#rvshow');await p.click('[data-got="1"]')}
  await p.click('#rvnx');const r=await p.evaluate(id=>({s:U.srs[id],conf:U.conf,xp:U.xp,due:srsDue().length}),id);
  ok(r.s.s===1&&r.s.due>(await p.evaluate(()=>today()))&&r.xp>=x0+4&&r.due===0,'review not recorded: '+JSON.stringify(r));
  ok(Object.values(r.conf||{}).some(c=>c[0]===1&&c[1]===1),'confidence not recorded');
  /* restart-safe: the same review on the same day gives no more XP */
  await p.evaluate(id=>{U.srs[id]={s:0,due:today(),n:1};save()},id);await p.go("#/");await p.go("#/review");await p.click('[data-sure="0"]');
  if(await p.$('[data-oi="0"]'))await p.click('[data-oi="0"]');else{await p.click('#rvshow');await p.click('[data-got="1"]')}
  ok((await p.U()).xp===r.xp,'review XP farmed');
  /* flashcards */
  await p.go('#/cards');await p.click('a.card.zone');await p.click('#fcard');await p.click('#fcr [data-k="1"]');
  ok(await p.evaluate(()=>Object.values(U.fc).filter(s=>s.s===1).length===1),'flashcard not recorded');
  /* avatar builder: girl, veil and headphones together, an expression */
  await p.go('#/avatar');await p.click('[data-k="g"][data-v="f"]');await p.click('[data-k="vl"]');await p.click('[data-k="hp"]');await p.click('[data-k="ex"][data-v="2"]');await shot(p,'dash-avatar');
  await p.click('#avsave');const av=await p.evaluate(()=>U.av);ok(/^f.{7}112$/.test(av),'avatar not saved: '+av);
  ok(await p.evaluate(()=>!!document.querySelector('#hud .avpill svg')),'avatar not in the top bar');await p.done()},

async paper(){const p=await page({sid:STUDENT,clock:true});await p.clock.setSystemTime(new Date('2026-11-21T20:00:00+05:00'));
  await p.go('#/paper');ok((await p.textContent('main')).includes('Unlocks Sun 22 Nov 2026')&&!await p.$('#ppgo'),'paper not locked before 22 Nov');
  const l=await page({sid:LECT,clock:true});await l.clock.setSystemTime(new Date('2026-11-01T10:00:00+05:00'));await l.go('#/paper');ok(!!await l.$('#ppgo'),'lecturer cannot preview');await l.done();
  await p.clock.setSystemTime(new Date('2026-11-22T09:00:00+05:00'));await p.go('#/');await p.go('#/paper');await p.click('#ppgo');await p.waitForSelector('#pptm');await shot(p,'paper-sitting');
  const sec=async()=>p.evaluate(()=>U.pp.cur.si),answer=async()=>{const ta=await p.$('.ppq textarea');if(ta){await ta.click();await p.keyboard.type('My answer explains the idea with an example from the case and says why it matters.',{delay:5})}else await p.click('.ppq .mopt')};
  ok(await sec()===0,'paper did not start at section 1');await answer();
  /* paste is blocked in the paper too */
  const ta=await p.$('.ppq textarea');if(ta){await p.evaluate(()=>navigator.clipboard.writeText('pasted text from somewhere'));await ta.focus();await p.keyboard.press('Control+V');ok(!(await ta.inputValue()).includes('pasted text'),'paste allowed in the paper')}
  const m1=await p.evaluate(()=>ppSpec(U.pp.cur)[0].mins);await p.clock.fastForward('10:00');await p.click('#ppsub');await p.waitForTimeout(300);
  ok(await sec()===1,'section not submitted');const carried=await p.evaluate(()=>U.pp.cur.bonus/60000);ok(Math.abs(carried-(m1-10))<=1,'leftover time not carried: '+carried);
  ok((await p.textContent('#pphead')).includes('+'+Math.round(carried)+' min carried'),'carried minutes not shown');
  /* the first section can't be edited any more */
  const first=await p.evaluate(()=>ppSpec(U.pp.cur)[0].items[0].id);ok(!await p.$('#pq-'+first),'submitted section still on screen');
  /* the second section runs out: buzzer modal, the third starts */
  await answer();
  const m2=await p.evaluate(()=>ppSpec(U.pp.cur)[1].mins);await p.clock.fastForward((m2+Math.round(carried)+1)*60*1000);await p.waitForTimeout(800);
  ok(await sec()===2&&!!await p.$('.modal[aria-label="Time is up"]'),'time-out did not submit the section');await p.click('#ppok');
  ok(await p.evaluate(()=>U.pp.cur.sub[1].auto===1&&U.pp.cur.bonus===0),'auto submit not recorded');
  /* closing the page past the end: everything is submitted */
  await p.clock.fastForward(4*3600*1000);await p.waitForTimeout(600);if(await p.$('#ppok'))await p.click('#ppok');await p.go('#/');await p.go('#/paper');ok(await p.evaluate(()=>!!U.pp.cur.end),'paper did not end after 3 hours');
  /* self-check (XP only), then the report */
  const x0=(await p.U()).xp;const n=await p.$$eval('[data-q][data-j]',a=>a.length);if(n)await p.locator('[data-q][data-j]').first().check({force:true});await shot(p,'paper-check');await p.click('#ppfin');await p.waitForTimeout(300);
  const r=await p.evaluate(()=>({h:U.pp.hist,hash:location.hash,ck:U.pp.cur.ck}));ok(r.ck&&r.h.length===1&&/report/.test(r.hash),'report not shown: '+JSON.stringify(r));
  ok((await p.U()).xp>x0,'no XP from the self-check');ok(/key ideas covered/.test(await p.textContent('main')),'report text');await shot(p,'paper-report',true);
  ok(!/\bexam/i.test(await p.textContent('main')),'exam wording');
  /* XP keys are stable: running the check again gives nothing */
  const x1=(await p.U()).xp;await p.evaluate(()=>{U.pp.cur.ck=0;save()});await p.go('#/');await p.go('#/paper');await p.click('#ppfin');ok((await p.U()).xp===x1,'self-check XP farmed');
  await p.done()},

async hints(){const p=await page({sid:STUDENT});await p.go('#/short');await p.waitForSelector('.qcard [data-hint]');await p.click('.qcard [data-hint]');
  ok(await p.$('.qcard .hint'),'hint not shown');const id=(await p.locator('.qcard').first().getAttribute('id')).slice(2);
  const st=await p.evaluate(id=>U.plansSaved[id],id);ok(st&&st.hints&&st.hints.length===1,'hint not recorded');
  await p.locator('.qcard .chip').first().click();ok(await p.$$eval('.qcard .hint',a=>a.length)===1,'hint lost on redraw');
  /* skip link and focus */
  await p.reload();await p.waitForTimeout(500);await p.keyboard.press('Tab');ok(await p.evaluate(()=>document.activeElement.classList.contains('skip')),'skip link is not first');await p.keyboard.press('Enter');ok(await p.evaluate(()=>document.activeElement.id==='main'),'skip link does not reach the content');
  await p.done()},

async release(){const p=await page({ver:false});const pre=await p.evaluate(()=>CRS.ls);
  await p.evaluate(pre=>{localStorage.setItem(pre+'session',JSON.stringify({sid:'S081441',name:'Test Student'}));localStorage.setItem(pre+'u_S081441',JSON.stringify({tour:1,inst:1,xp:120,days:['2026-10-01'],log:{'x:1':1},badges:{boarding:'2026-10-01'}}))},pre);
  await p.reload();await p.waitForTimeout(3500);
  ok(await p.evaluate(()=>!ME)&&!!await p.$('#verban'),'not signed out once with the 2.1 message');await shot(p,'release-banner');
  const kept=await p.evaluate(pre=>{const u=JSON.parse(localStorage.getItem(pre+'u_S081441')||'{}'),b=JSON.parse(localStorage.getItem(pre+'u_bak21_S081441')||'{}');return [u.xp,b.xp]},pre);ok(kept[0]>=120&&kept[1]>=120,'progress not kept: '+kept);
  await p.fill('#nm','Test Student');await p.type('#sid','081441');await p.waitForTimeout(300);await p.click('#go');await p.waitForTimeout(400);if(await p.$('#pgo'))await p.click('#pgo');
  await p.waitForSelector('.modal[aria-label="What\'s new"]',{timeout:8000});ok(await p.evaluate(()=>U.xp>=120&&!document.querySelector('#verban')),'progress lost after signing in again');await shot(p,'release-whatsnew');
  await p.click('#wnmore');await p.waitForTimeout(400);ok((await p.textContent('main')).includes("What's new in Version 2.1"),'What\'s new page missing');
  ok(!/\bexam/i.test(await p.textContent('main')),'exam wording on What\'s new');
  /* only once: reloading does not sign out again or show the popup again */
  await p.reload();await p.waitForTimeout(3000);ok(await p.evaluate(()=>!!ME&&!document.querySelector('.modal[aria-label="What\'s new"]')),'2.1 steps repeated');await p.done()},

async layout(){const pages=['#/','#/paper','#/cases','#/case/iceto/read','#/case/cbtl/board','#/case/tuna/practice','#/case/tuna/exhibits','#/short','#/essay','#/essay/ca/manta','#/essay/coach/coco','#/badges','#/board'];
  for(const w of [320,390,1280])for(const theme of ['dark','light']){const p=await page({sid:STUDENT,w,theme});for(const h of pages){await p.go(h);const sw=await p.evaluate(()=>document.documentElement.scrollWidth);ok(sw<=w,`${h} at ${w}px ${theme}: scrollWidth ${sw}`)}
    ok(await p.evaluate(t=>document.documentElement.dataset.theme===t,theme),'theme not applied');await p.done()}},

async profileLocal(){const p=await page({sid:'S000001'});await p.go('#/student/S081441');await p.waitForTimeout(300);
  ok((await p.textContent('main')).includes('need the live connection'),'device-only profile note missing');
  const s=await page({sid:STUDENT});await s.go('#/student/S081441');await s.waitForTimeout(300);ok(!(await s.textContent('main')).includes('live connection')&&!!await s.$('#thead'),'student reached a profile');await s.done();await p.done()},

async install(){const p=await page({sid:STUDENT,tour:false});await p.waitForTimeout(1200);ok(await p.$('#tn'),'tour should open for a new student');
  for(let n=0;n<8&&await p.$('#tn');n++){await p.click('#tn');await p.waitForTimeout(120)}
  await p.waitForTimeout(700);ok(await p.$('[aria-label="Install the app"]'),'install popup should follow the tour');
  ok(/COMPUTER|THIS BROWSER/.test(await p.textContent('.modal .card')),'desktop steps expected');
  await p.click('#idone');await p.reload();await p.waitForTimeout(1600);ok(!await p.$('[aria-label="Install the app"]'),'install popup should show only once');
  await p.click('#inst');await p.waitForTimeout(200);ok(await p.$('[aria-label="Install the app"]'),'footer link should reopen it');await p.done()},

async screentime(){const p=await page({sid:STUDENT,clock:true});await p.evaluate(()=>{U.st={};U.stx={};save()});
  const sec=()=>p.evaluate(()=>((U.st||{})[today()]|0)+PR.pend),poke=()=>p.mouse.click(5,600),vis=v=>p.evaluate(v=>{Object.defineProperty(document,'visibilityState',{value:v,configurable:true});document.dispatchEvent(new Event('visibilitychange'))},v);
  await poke();let a=await sec();await p.clock.runFor(90000);let b=await sec();ok(b-a>=85&&b-a<=92,'90 active seconds counted as '+(b-a));
  await poke();a=await sec();await p.clock.runFor(300000);b=await sec();ok(b-a>=115&&b-a<=126,'idle did not pause after 2 minutes: '+(b-a));
  await poke();await vis('hidden');a=await sec();await p.clock.runFor(60000);ok(await sec()-a<1,'counted while hidden');await vis('visible');
  await p.evaluate(()=>{const t=document.createElement('button');t.dataset.a='tgo';t.textContent='Pause';t.id='fk';document.querySelector('main').append(t)});
  await poke();a=await sec();await p.clock.runFor(300000);b=await sec();ok(b-a>=295,'a running writing timer did not keep it counting: '+(b-a));await p.evaluate(()=>document.getElementById('fk').remove());
  await p.evaluate(()=>{U.st[today()]=1190;U.stx[today()]=1190;PR.pend=PR.pendx=0;save()});await poke();await p.clock.runFor(15000);await p.evaluate(()=>stFlush(true));
  let u=await p.evaluate(()=>({g:!!U.log['stgoal:'+today()],b:Object.keys(U.log).filter(k=>k.startsWith('stblock:')).length,c:U.day.c.stgoal,gx:U.gain['stgoal:'+today()]}));
  ok(u.g&&u.b===1&&u.c===1&&u.gx===15,'daily goal or first block not awarded: '+JSON.stringify(u));
  await p.evaluate(()=>{U.stx[today()]=1200*9;stFlush(true)});ok(await p.evaluate(()=>Object.keys(U.log).filter(k=>k.startsWith('stblock:')).length)===6,'bonus blocks not capped at 6');
  await p.evaluate(()=>{PR.sess={id:'x',name:'t',active:true,endsAt:Date.now()+3600e3};PR.sessOn=true;PR.joined=true;U.sess={x:{j:Date.now(),on:0,idle:0,away:0,left:0,lg:0,pr:[],c:0}};PR.pendx=0});
  await poke();await p.clock.runFor(30000);ok(await p.evaluate(()=>PR.pendx)<1&&await p.evaluate(()=>PR.pend)>0,'live-session time counted towards bonus blocks');
  await p.evaluate(()=>{PR.sess=null;PR.sessOn=false;PR.joined=false;presBar()});
  await p.evaluate(()=>{U.stArch=5*3600;stFlush(true)});ok((await p.U()).badges.includes('hrs5'),'5 Hours Logged badge missing');
  await p.go('#/');ok((await p.textContent('#tst')).includes('Goal met'),'Home does not show the goal met');
  await p.go('#/progress/screen');ok((await p.textContent('#stcard')).includes('GOAL MET'),'My progress does not show the goal met');
  await p.evaluate(()=>{document.querySelectorAll('.toast').forEach(t=>t.remove());document.querySelector('#stcard').scrollIntoView({block:'center'})});await shot(p,'st-card');
  await p.go('#/badges');ok((await p.textContent('main')).includes('every 20 active minutes'),'How to earn XP row missing');await p.done()},

/* break reminder: after 20 focused minutes; Not now = 10 more minutes; a break pauses screen time; deferred during a writing timer; never in a live session */
async breaks(){const p=await page({sid:STUDENT,clock:true,breaks:true});const brk=()=>p.$('[aria-label="Take a break"]'),poke=()=>p.mouse.click(5,600),min=async n=>{for(let i=0;i<n;i++){await poke();await p.clock.runFor(60000)}};
  await min(19);ok(!await brk(),'reminder before 20 minutes');await min(2);ok(await brk(),'no reminder after 20 minutes');await shot(p,'break-reminder');
  await p.click('#brn');await min(9);ok(!await brk(),'"Not now" asked again too soon');await min(2);ok(await brk(),'no reminder 10 minutes after "Not now"');
  await p.click('#brs');ok(await p.$('#brt'),'break countdown missing');const s0=await p.evaluate(()=>((U.st||{})[today()]|0)+PR.pend);await p.clock.runFor(120000);
  ok(await p.evaluate(()=>((U.st||{})[today()]|0)+PR.pend)-s0<1,'screen time counted during the break');await p.clock.runFor(200000);ok(!await p.$('#brt'),'break did not end after 5 minutes');
  await p.evaluate(()=>{PR.fc=1250;const t=document.createElement('button');t.dataset.a='tgo';t.textContent='Pause';t.id='fk';document.querySelector('main').append(t)});await poke();await p.clock.runFor(5000);ok(!await brk(),'reminder during a writing timer');
  await p.evaluate(()=>document.getElementById('fk').remove());await poke();await p.clock.runFor(3000);ok(await brk(),'deferred reminder not shown after the timer');await p.click('#brn');
  await p.evaluate(()=>{PR.sess={id:'x',name:'t',active:true,endsAt:Date.now()+3600e3};PR.sessOn=true;PR.fc=5000;PR.next=1200});await poke();await p.clock.runFor(3000);ok(!await brk(),'reminder during a live session');
  await p.evaluate(()=>{PR.sess=null;PR.sessOn=false;PR.fc=0;presBar()});
  await p.done()},

/* simple home: a short Today screen; everything else is on My progress */
async simplehome(){const p=await page({sid:STUDENT,clock:true});await p.clock.setSystemTime(new Date('2026-11-01T10:00:00+05:00'));await p.go('#/');
  for(const s of ['#thead','.tstreak','#tcd','#nextact','#trow','#ttiles','#tedit','#tpaper'])ok(await p.$(s),'home part missing: '+s);
  for(const s of ['#stcard','#cdcard','#rdcard','.mission:not(#tml .mission)','#bk','.badges','[data-lect]','#lday'])ok(!await p.$('main '+s),'home should not have '+s);
  ok(await p.getAttribute('#tedit','href')==='#/avatar','Edit profile link');
  ok(await p.isHidden('#tml'),'missions should start folded');await p.click('#tmb');ok(await p.isVisible('#tml')&&await p.$$eval('#tml .mission',e=>e.length)===3,'missions do not open');
  const pt=await p.textContent('#tpaper');ok(pt.includes('Opens Sun 22 Nov')&&!!await p.$('#tpaper.locked'),'paper tile not locked before 22 Nov: '+pt);
  await p.click('#tmb');const h=await p.evaluate(()=>document.documentElement.scrollHeight);ok(h<=844*1.6,'home too tall on a phone: '+h);console.log('    home height, new student, 390 x 844:',h);
  await p.click('#tedit');await p.waitForTimeout(100);ok((await p.textContent('main h1'))==='My profile'&&!!await p.$('#pfname')&&!!await p.$('#avsave'),'My profile page');await p.done()},

async progress(){const p=await page({sid:STUDENT});await p.go('#/progress');
  const ids=await p.$$eval('details.sec',d=>d.map(x=>x.dataset.sec+(x.open?'*':'')));
  for(const id of ['cd','ready','weak','act','screen','badges','cases'])ok(ids.includes(id),'progress section missing: '+id+' in '+ids);
  ok(!ids.some(x=>x.endsWith('*')),'sections should start folded: '+ids);ok(await p.$('#psum'),'summary row missing');
  ok(!ids.some(x=>/^(integ|ans|msgs)$/.test(x))&&!await p.$('main [data-lect]'),'lecturer-only parts on My progress');
  await p.click('#sec-badges summary');ok(await p.$('#sec-badges[open] .bsm'),'badges section does not open');
  await p.go('#/progress/screen');ok(await p.$('#sec-screen[open] #stcard'),'a deep link does not open its section');await p.done()},

async tabbar(){const p=await page({sid:STUDENT});await p.go('#/');ok(await p.isVisible('.tabbar')&&await p.isHidden('nav.tabs'),'phone: tab bar instead of the top tabs');
  const items=await p.$$eval('.tabbar a,.tabbar button',e=>e.map(x=>x.textContent.trim()).join('|'));ok(items==='🏠Home|🎯Practice|📈Progress|🏆Leaderboard|☰More','tab bar items: '+items);
  ok((await p.textContent('footer')).includes('Sign out'),'the footer Sign out must stay');
  await p.click('.tabbar [data-more]');for(const h of ['#/avatar','#/progress','#/badges','#/backup','#/privacy','#/whatsnew','#/paper'])ok(await p.$(`.morelist a[href="${h}"]`),'More is missing '+h);
  ok((await p.textContent('.morelist')).includes('My profile')&&(await p.textContent('.morelist')).includes('Sign out'),'More labels');
  await p.click('.morelist a[href="#/avatar"]');await p.waitForTimeout(100);ok((await p.evaluate(()=>location.hash))==='#/avatar'&&!await p.$('.modal'),'My profile from More');
  await p.click('.tabbar a[href="#/practice"]');await p.waitForTimeout(100);ok(await p.$('main #ttiles')&&await p.$('.tabbar a.on[href="#/practice"]'),'Practice page');
  const pad=await p.evaluate(()=>parseFloat(getComputedStyle(document.body).paddingBottom));ok(pad>=60,'no room for the tab bar: '+pad);
  await p.evaluate(()=>{CRS.tabbar=false;route()});ok(!await p.$('.tabbar')&&await p.isVisible('nav.tabs'),'CRS.tabbar=false should remove it');await p.done();
  const d=await page({sid:STUDENT,w:1280,h:900});await d.go('#/');ok(await d.isHidden('.tabbar')&&await d.isVisible('nav.tabs'),'desktop: top tabs only');
  ok(await d.$('nav.tabs a[href="#/progress"]')&&await d.$('nav.tabs [data-more]'),'desktop: My progress tab and More');await d.done()},

/* the lecturer is never a player: lecturer essentials only, no XP, no board row, no challenges */
async lecthome(){const p=await page({sid:LECT});await p.go('#/');
  ok(await p.$('#lhome')&&await p.$('.lbtns')&&await p.$('#lhva')&&await p.$('#tpaper'),'lecturer home parts missing');
  for(const s of ['.tstreak','#tcd','#nextact','#trow','#tmb','#stcard','.mission','#tinv','#psum'])ok(!await p.$('main '+s),'lecturer home has a student card: '+s);
  const btn=await p.$$eval('.lbtns .btn',e=>e.map(x=>x.textContent.trim()).join('|'));for(const b of ['View as student','Marking','Post announcement','Start live session','Leaderboard','Lecturer tools'])ok(btn.includes(b),'lecturer button missing: '+b);
  ok((await p.textContent('#tpaper')).includes('Preview'),'paper preview tile');
  ok(!await p.$('#hud .pill.gold')&&!await p.$('#hud .fire')&&(await p.textContent('#hud')).includes('Lecturer')&&await p.$('#hud .avpill svg'),'lecturer top bar');
  await p.click('#tpaper');await p.waitForTimeout(150);ok((await p.evaluate(()=>location.hash))==='#/paper'&&/practice paper/i.test(await p.textContent('main')),'paper preview link');
  const x=await p.evaluate(()=>{const a=award('t:lect',50,'x');return [a,U.xp,rowOf(ME.sid)]});ok(x[0]===false&&x[1]===0&&x[2]===null,'the lecturer earned XP or has a board row: '+JSON.stringify(x));
  for(const r of ['#/challenges','#/weekend','#/notifs']){await p.go(r);ok(await p.$('main [data-lect]')&&!await p.$('#chq')&&!await p.$('#wkgo'),'the lecturer reached '+r)}
  await p.go('#/avatar');ok((await p.textContent('main h1'))==='My profile','lecturer profile page');await p.click('[data-k="g"][data-v="m"]');await p.click('#avsave');
  ok(await p.evaluate(()=>/^m/.test(U.av)&&U.xp===0&&lectAv()===U.av),'lecturer avatar not saved');ok(await p.$('#hud .avpill svg'),'lecturer avatar in the top bar');await p.done()},

/* nothing lecturer-only on any student page; the lecturer is never in a classmate picker */
async lectonly(){const p=await page({sid:STUDENT});const routes=await p.evaluate(()=>Object.keys(ROUTES).concat(['','cases','badges','board','lecturer','student/S081441','live','session/x','progress/badges']));
  for(const r of routes){await p.evaluate(h=>{location.hash=h},'#/'+r);await p.waitForTimeout(250);const n=await p.evaluate(()=>document.querySelectorAll('[data-lect]').length);ok(!n,'lecturer-only element on #/'+r)}
  await p.evaluate(()=>{SDIR={S000001:{n:'The Lecturer'},S085542:{n:'Other Student'}};chNew()});ok(!await p.$('[data-s="S000001"]')&&await p.$('[data-s="S085542"]'),'the lecturer is in the challenge picker');await p.done()},

/* View as student: the student's pages, read-only, and the lecturer's own state untouched */
async viewas(){const p=await page({sid:LECT});await p.go('#/');const snap=()=>p.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));const before=await snap();
  await p.evaluate(()=>vaEnter({id:'S081441',name:'Aminath Test',u:{xp:420,days:[today()],log:{'read:x:1':1},badges:{boarding:today()},n:{plans:3},dn:'Aminath Test',un:'@Aminath441',tour:1,inst:1}}));await p.waitForTimeout(150);
  ok((await p.textContent('#vabar')).includes('Viewing as Aminath Test (S081441)')&&(await p.textContent('#vabar')).includes('read-only'),'view-as banner');
  for(const s of ['#thead','#tcd','#nextact','#trow','#ttiles'])ok(await p.$(s),'view-as home part missing: '+s);ok(!await p.$('main [data-lect]')&&!await p.$('#lhome'),'lecturer parts while viewing');
  ok((await p.textContent('#thead')).includes('Aminath Test'),'not the student\'s home');
  /* pages may set up a blank plan in memory; nothing may be picked, checked, earned or counted */
  const st=()=>p.evaluate(()=>JSON.stringify([U.xp,U.log,U.n,U.badges,U.cnt||null,Object.values(U.plansSaved||{}).filter(x=>(x.sel||[]).length||x.checked).length]));const u0=await st();
  await p.evaluate(()=>{location.hash='#/short'});await p.waitForTimeout(250);await p.locator('.qcard .chip').first().click();await p.waitForSelector('.toast:has-text("Read-only")');
  ok(await p.evaluate(()=>award('t:va',50,'x')===false),'award while viewing');await p.evaluate(()=>{save();countOnce('t:va','plans');LS.set('x',1)});
  for(const h of ['#/progress','#/badges','#/avatar','#/practice','#/paper','#/challenges']){await p.evaluate(h=>{location.hash=h},h);await p.waitForTimeout(200);ok(!await p.$('main [data-lect]'),'lecturer-only part while viewing '+h)}
  {const u1=await st();ok(u1===u0,'the student\'s progress changed while viewing: '+u0+' → '+u1)}
  await p.click('#vax');await p.waitForTimeout(200);ok(!await p.$('#vabar')&&await p.evaluate(()=>ME.sid)==='S000001'&&!!await p.$('#lhome'),'Exit does not restore the lecturer');
  ok(await snap()===before,'the lecturer\'s localStorage changed while viewing');await p.done()},

/* the Lecturer tab: folded blocks, remembered, top 3 rows with Show all, Expand and Collapse all */
async lfold(){const p=await page({sid:LECT});await p.go('#/lecturer');const n=await p.$$eval('.lfold',e=>e.length);ok(n>=2,'no lecturer blocks');
  ok(await p.$$eval('.lfold .lfb',e=>e.every(x=>x.hidden)),'blocks should start folded');ok(!(await p.textContent('#rvw')).trim(),'a folded block loaded its data');
  await p.click('.lfold[data-f="demo"] .lfh');ok(await p.isVisible('#demo'),'a block does not open');
  await p.reload();await p.waitForTimeout(300);ok(await p.isVisible('#demo')&&await p.$$eval('.lfold:not(.open)',e=>e.length)===n-1,'the open block is not remembered');
  await p.evaluate(()=>document.getElementById('demo').insertAdjacentHTML('beforeend','<table id="t6"><tr><th>h</th></tr>'+[1,2,3,4,5,6].map(i=>'<tr><td>'+i+'</td></tr>').join('')+'</table>'));await p.waitForTimeout(50);
  ok(await p.$$eval('#t6 tr:not([hidden])',e=>e.length)===4,'should show the top 3 rows');const b=p.locator('#t6 + .t3');ok((await b.textContent()).includes('Show all 6'),'Show all label');
  await b.click();ok(await p.$$eval('#t6 tr:not([hidden])',e=>e.length)===7&&(await b.textContent()).includes('Show fewer'),'Show all does not show every row');
  await p.click('[data-lfall="1"]');ok(await p.$$eval('.lfold .lfb',e=>e.every(x=>!x.hidden)),'Expand all');await p.click('[data-lfall="0"]');ok(await p.$$eval('.lfold .lfb',e=>e.every(x=>x.hidden)),'Collapse all');await p.done()},

/* sections: "MKT301_H01 course" shows as H01; with no sections everyone is one class team */
async sections(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>[secLabel('MKT301_H01 course'),secLabel('MKT101_H02'),secLabel(''),
    wkTeams([{g:'MKT301_H01 course',s:8,n:10},{g:'MKT301_H02 course',s:5,n:10},{g:'MKT301_H01 course',s:6,n:10}]).map(t=>t.label+':'+t.n).join(),
    wkTeams([{g:'',s:8,n:10},{g:'',s:5,n:10}]).map(t=>t.label+':'+t.n).join()]);
  ok(r[0]==='H01'&&r[1]==='H02'&&r[2]==='','secLabel: '+r.slice(0,3));ok(r[3]==='H01:2,H02:1','section teams: '+r[3]);ok(r[4]==='Whole class:2','one class team: '+r[4]);await p.done()},

async engine(){const r=require('child_process').spawnSync(process.execPath,[path.join(ROOT,'tools','sync-engine.mjs'),'--check'],{encoding:'utf8'});ok(r.status===0,'shared engine out of sync:\n'+r.stdout+r.stderr)
  /* every script shares one global scope: a function or const declared twice silently replaces the first */
  const fs=require('fs'),files=fs.readdirSync(path.join(ROOT,'engine')).filter(f=>f.endsWith('.js')).map(f=>'engine/'+f).concat(['course.js']),seen={},dup=[];
  for(const f of files)for(const m of fs.readFileSync(path.join(ROOT,f),'utf8').matchAll(/^(?:async )?(?:function|const|let) ([A-Za-z0-9_$]+)/gm)){if(seen[m[1]]&&seen[m[1]]!==f)dup.push(m[1]+' ('+seen[m[1]]+', '+f+')');seen[m[1]]=f}
  ok(!dup.length,'declared in two files: '+dup.join('; '))},

async offline(){const p=await page({sid:STUDENT});const active=await p.evaluate(async()=>!!(await navigator.serviceWorker.ready).active);ok(active,'service worker not active');await p.done()}
};

(async()=>{const server=spawn('python3',['-m','http.server',String(PORT)],{cwd:ROOT,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
  browser=await chromium.launch({headless:!ARGS.headed});
  for(const [name,fn] of Object.entries(T)){if(ARGS.only&&!String(ARGS.only).split(',').includes(name))continue;const t0=Date.now();
    try{await fn();passes++;console.log(`PASS ${name} (${((Date.now()-t0)/1000).toFixed(1)}s)`)}catch(e){fails++;console.log(`FAIL ${name}: ${e.message.split('\n').slice(0,4).join(' | ')}`)}}
  await browser.close();server.kill();console.log(`\n${passes} passed, ${fails} failed`);process.exit(fails?1:0)})();
