/* Cloud tests for fun and tutors (engine/fun.js; shared by MKT101 and MKT301, required by firebase.js). The parts that need the newest
   rules (help, subs, streak duels, mentors, tutor rows) run only when the rules have them (R4); on older rules they must stay hidden. */
module.exports=({page,ok,signIn,tourOff,ensure,fsDoc,waitFor,A,B,L,PIN,PINB,PINL,R2,RULES})=>{
const R4=!!RULES&&/match \/help\/\{id\}/.test(require('fs').readFileSync(RULES,'utf8'));
const al=/permission|PERMISSION|insufficient|400|403|Failed to load resource|identitytoolkit/;
const who=async(sid,pin,name,o)=>{const p=await page(Object.assign({allow:al},o||{}));await ensure(p,sid,pin);await signIn(p,sid,pin,name);await tourOff(p);
  await p.evaluate(()=>{if(!U.days.includes(today()))U.days.push(today());save()});return p};
const tryAll=(p,fn)=>p.evaluate(fn);
const tutorUp=p=>p.evaluate(()=>{const c=funCfg();U.xp=Math.max(U.xp,LEVELS[c.tutorLvl][0]);(typeof exTops==='function'?exTops():[]).slice(0,c.tutorEx).forEach(([t])=>U.badges['ex'+t]=today());save()});
return {
/* on older rules the new parts stay hidden; on the newest they switch on */
async funGate(){if(!R2)return;const p=await who(A,PIN);const on=await p.evaluate(()=>funOK());ok(on===R4,'funOK '+on+' with '+(R4?'new':'old')+' rules');
  await p.go('#/practice');await p.waitForTimeout(500);ok(await p.evaluate(()=>!!document.querySelector('.funtiles [href="#/help"]').hidden)===!R4,'Ask a tutor tile visibility');
  if(!R4){await p.go('#/help');ok((await p.textContent('main')).includes('switches on soon'),'Ask a tutor on old rules')}await p.done()},
/* the rules: daily limits, no links, owners, approval only by the lecturer, streak duels, tutor rows, mentors */
async funRules(){if(!R4)return;const a=await who(A,PIN);
  const r=await tryAll(a,async()=>{const t=async f=>{try{await f();return 'allowed'}catch(e){return 'refused'}},d=funDayNo(),me=ME.sid,base={by:me,n:'A',tp:10,q:'Why does a two-level channel have two intermediaries?',at:CLOUD.ts(),st:'open'};
    const row=rowOf(me),rb={n:row.n,u:row.u,a:row.a,x:0,l:0,b:0,s:0,t:CLOUD.ts()};
    return {ok:await t(()=>CLOUD.put('help/'+me+'_'+d+'_1',base)),four:await t(()=>CLOUD.put('help/'+me+'_'+d+'_4',base)),day:await t(()=>CLOUD.put('help/'+me+'_'+(d-1)+'_2',base)),
      link:await t(()=>CLOUD.put('help/'+me+'_'+d+'_2',Object.assign({},base,{q:'Please read www.example.com about this'}))),other:await t(()=>CLOUD.put('help/S085542_'+d+'_1',Object.assign({},base,{by:'S085542'}))),
      sub:await t(()=>CLOUD.put('subs/'+me+'_tb_1',{by:me,n:'A',k:'tb',tp:10,tx:'Channel levels count the intermediaries between the maker and the final customer, never the customers themselves.',st:'sub',at:CLOUD.ts()})),
      self:await t(()=>CLOUD.put('subs/'+me+'_tb_1',{st:'ok'},true)),
      duel:await t(()=>CLOUD.add('challenges',{by:me,p:[me,'S085542'],mode:'streak',items:[],t:CLOUD.ts(),exp:CLOUD.when(Date.now()+8*864e5-36e5),st:'wait'})),
      long:await t(()=>CLOUD.add('challenges',{by:me,p:[me,'S085542'],mode:'open',items:[],t:CLOUD.ts(),exp:CLOUD.when(Date.now()+8*864e5),st:'wait'})),
      tu:await t(()=>CLOUD.put('board/'+me,Object.assign({},rb,{tu:'8,9',hp:2}))),tubad:await t(()=>CLOUD.put('board/'+me,Object.assign({},rb,{tu:'abc'}))),tid:me+'_'+d+'_1'}});
  ok(r.ok==='allowed'&&r.four==='refused'&&r.day==='refused'&&r.link==='refused'&&r.other==='refused','help rules: '+JSON.stringify(r));
  ok(r.sub==='allowed'&&r.self==='refused','subs rules: '+JSON.stringify(r));ok(r.duel==='allowed'&&r.long==='refused','duel rules: '+JSON.stringify(r));ok(r.tu==='allowed'&&r.tubad==='refused','tutor row rules: '+JSON.stringify(r));
  const b=await who(B,PINB);const rb=await b.evaluate(async tid=>{const t=async f=>{try{await f();return 'allowed'}catch(e){return 'refused'}};
    return {reply:await t(()=>CLOUD.put('help/'+tid+'/r/'+ME.sid+'_1',{by:ME.sid,n:'B',tx:'Count the middlemen only: a wholesaler and a retailer make two levels.',at:CLOUD.ts(),ok:false,st:'ok'})),
      hide:await t(()=>CLOUD.put('help/'+tid,{st:'hid'},true)),readSub:await t(()=>CLOUD.get('subs/S081441_tb_1')),okOwn:await t(()=>CLOUD.put('help/'+tid+'/r/'+ME.sid+'_1',{ok:true},true))}},r.tid);
  ok(rb.reply==='allowed'&&rb.hide==='refused'&&rb.readSub==='refused'&&rb.okOwn==='refused','other student: '+JSON.stringify(rb));
  const ra=await a.evaluate(async tid=>{const t=async f=>{try{await f();return 'allowed'}catch(e){return 'refused'}};
    return {mark:await t(()=>CLOUD.put('help/'+tid+'/r/S085542_1',{ok:true},true)),selfReply:await t(()=>CLOUD.put('help/'+tid+'/r/'+ME.sid+'_1',{by:ME.sid,n:'A',tx:'Answering myself here.',at:CLOUD.ts(),ok:false,st:'ok'}))}},r.tid);
  ok(ra.mark==='allowed'&&ra.selfReply==='refused','asker: '+JSON.stringify(ra));
  const l=await who(L,PINL,'Abdulla Muiz Fuad',{w:1280,h:900});const rl=await l.evaluate(async tid=>{const t=async f=>{try{await f();return 'allowed'}catch(e){return 'refused'}};
    return {approve:await t(()=>CLOUD.put('subs/S081441_tb_1',{st:'ok',note:'Clear and correct.'},true)),ask:await t(()=>CLOUD.put('help/'+ME.sid+'_'+funDayNo()+'_1',{by:ME.sid,n:'L',tp:10,q:'A lecturer question here?',at:CLOUD.ts(),st:'open'})),
      hide:await t(()=>CLOUD.put('help/'+tid,{st:'hid'},true)),
      ment:await t(async()=>{const id=await CLOUD.add('sessions',{name:'Week 11 tutorial',startedAt:CLOUD.ts(),endsAt:CLOUD.when(Date.now()+3600e3),active:true});await CLOUD.put('sessions/'+id,{ment:{S081441:['S085542']}},true)})}},r.tid);
  ok(rl.approve==='allowed'&&rl.ask==='refused'&&rl.hide==='allowed'&&rl.ment==='allowed','lecturer: '+JSON.stringify(rl));
  ok(await b.evaluate(async()=>{try{return !!(await CLOUD.get('subs/S081441_tb_1'))}catch(e){return false}}),'approved teach-back not readable by the class');
  await a.done();await b.done();await l.done()},
/* Ask a tutor end to end: a question, a tutor's answer, "This helped me", the tutor's XP; the lecturer hides it */
async funHelp(){if(!R4)return;const a=await who(A,PIN),b=await who(B,PINB);await tutorUp(b);
  await a.go('#/help');await a.click('#hask summary');await a.fill('#haq','How do I tell a one-level channel from a two-level channel?');await a.click('#hago');
  await waitFor(a,()=>/^#\/help\/.+/.test(location.hash));const id=await a.evaluate(()=>location.hash.split('/')[2]);
  await b.go('#/help');await waitFor(b,id=>!!document.querySelector(`#hlist a[href="#/help/${id}"]`),id);await b.go('#/help/'+id);await b.waitForSelector('#hrx');
  await b.fill('#hrx','Count the businesses in the middle: maker → café → you is one level; add a wholesaler and it is two.');await b.click('#hrgo');
  await a.go('#/help/'+id);await a.waitForSelector('[data-hok]');await a.click('[data-hok]');await waitFor(a,()=>document.body.textContent.includes('👍 helped'));
  const x0=await b.evaluate(()=>U.xp);await waitFor(b,()=>NOTE.some(n=>/^help:.+\//.test(n.ref||'')));await b.evaluate(()=>funCredit());
  const r=await b.evaluate(()=>[U.xp,U.fun.hp]);ok(r[0]-x0===10&&r[1]===1,'tutor not credited: '+r);await b.evaluate(()=>funCredit());ok(await b.evaluate(()=>U.xp)===r[0],'credited twice');
  const l=await who(L,PINL,'Abdulla Muiz Fuad',{w:1280,h:900});await l.go('#/help/'+id);await l.waitForSelector('#hhide');await l.click('#hhide');
  await waitFor(l,()=>document.body.textContent.includes('Hidden'));const d=await fsDoc('help',id);ok(d&&d.st.stringValue==='hid','not hidden: '+JSON.stringify(d&&d.st));
  await a.go('#/help');await a.waitForTimeout(800);ok(!await a.$(`#hlist a[href="#/help/${id}"]`),'hidden question still listed');await a.done();await b.done();await l.done()},
/* teach-back: an Expert-level student sends one; the lecturer approves it; the student is credited and it shows on the notes page */
async funTeach(){if(!R4)return;const a=await who(A,PIN);await tutorUp(a);const t0=await a.evaluate(()=>funExTops(U)[0]);ok(t0!=null,'no Expert-level topic');
  await a.go('#/teach');await a.waitForSelector('#sbx');await a.selectOption('#sbt',String(t0));
  await a.fill('#sbx','Think of price as everything you give up: the money, but also your time and effort. That is why a slow, far-away shop can feel expensive even when its prices are low.');
  await a.click('#sbgo');await waitFor(a,()=>document.body.textContent.includes('Waiting for your lecturer'));
  const l=await who(L,PINL,'Abdulla Muiz Fuad',{w:1280,h:900});await l.go('#/lecturer');await l.waitForSelector('#sbl [data-ap="ok"]',{timeout:15000});await l.click('#sbl [data-ap="ok"]');await l.waitForTimeout(800);
  const x0=await a.evaluate(()=>U.xp);await a.evaluate(()=>{funCredit.subT=0;return funCredit()});const r=await a.evaluate(()=>[U.xp,!!U.badges.teach]);ok(r[1]&&r[0]-x0>=15,'teach-back not credited: '+r);
  await a.evaluate(()=>{TB_LIST=null});await a.go('#/notes/'+t0);await waitFor(a,()=>!!document.querySelector('.tbq'));await a.done();await l.done()},
/* the class figures: the lecturer works them out; students read them */
async funAgg(){if(!R2)return;const l=await who(L,PINL,'Abdulla Muiz Fuad',{w:1280,h:900});await l.evaluate(()=>aggRun());const d=await fsDoc('meta','agg');ok(d&&d.goal&&d.wk,'meta/agg not written');
  const a=await who(A,PIN);ok(await a.evaluate(async()=>{const A=await funAggLoad(true);return !!(A&&A.goal&&A.goal.target)}),'student cannot read the class figures');await a.go('#/');await waitFor(a,()=>!!document.querySelector('#tfun .goalc'));
  await a.done();await l.done()},
/* a mentor bonus from the lecturer reaches the student as XP */
async funBonus(){if(!R2)return;const a=await who(A,PIN),x0=await a.evaluate(()=>U.xp);const l=await who(L,PINL,'Abdulla Muiz Fuad',{w:1280,h:900});
  await l.evaluate(()=>CLOUD.put('reviews/S081441',{m:{bonus_ment_t1:{q:'mentor',xp:15,fb:'Mentor bonus: thank you for helping!',at:isoNow(),by:'lecturer'}}},true));
  await waitFor(a,x=>U.xp>=x+15,x0);ok(await a.evaluate(()=>!!U.badges.mentor),'no Mentor badge');await a.done();await l.done()},
/* "Encourage top students": goes only to the students the lecturer ticked, as a note; the student sees a gold celebration */
async cheerEnc(){if(!R2)return;const b0=await who(B,PINB);await b0.done();const a0=await who(A,PIN);await a0.done();
  const l=await who(L,PINL,'Abdulla Muiz Fuad',{w:1280,h:900});await l.go('#/lecturer');await l.waitForSelector('#enl [data-es]',{timeout:15000});
  for(const c of await l.$$('#enl [data-es]:checked'))await c.uncheck();await l.check(`#enl [data-es="${B}"]`);await l.fill('#entx','Brilliant work this week! 🌟 Keep going.');await l.click('#engo');
  await waitFor(l,()=>/Sent to 1 student/.test(document.querySelector('#enmsg').textContent));
  const rb=await fsDoc('reviews',B),ra=await fsDoc('reviews',A),has=d=>!!d&&Object.keys(((d.m||{}).mapValue||{}).fields||{}).some(k=>/^note_enc_/.test(k));ok(has(rb)&&!has(ra),'sent to the wrong students');
  const b=await who(B,PINB,null,{celeb:1});for(let i=0;i<60&&!await b.$('.celeb.gold');i++){if(await b.$('.celeb #celok'))await b.click('#celok');await b.waitForTimeout(300)}ok(await b.$('.celeb.gold'),'no gold celebration');ok((await b.textContent('.celeb')).includes('Brilliant work this week'),'no gold celebration');await b.done();await l.done()},
};};
