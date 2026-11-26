/* Site tests for Replacement Tutorial Sessions (engine/rts.js); shared by both courses.
   The session's window is moved around "now" so the tests do not depend on today's date. */
module.exports=({page,ok,STUDENT,LECT,shot})=>{
const open=async p=>{await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>!x.noLimit);s.from=new Date(Date.now()-864e5).toISOString();s.to=new Date(Date.now()+864e5).toISOString()});await p.go('#/');await p.waitForTimeout(300)};
const start=async p=>{await open(p);ok(await p.$('#rtsb'),'no Replacement Tutorial block on home');ok(/SAVE MY ATTENDANCE/.test(await p.textContent('#rtsgo')),'button text');
  await p.click('#rtsgo');await p.waitForSelector('#rtsyes');ok(/leave any time/.test(await p.textContent('.modal')),'start popup must say students can leave');await p.click('#rtsyes');await p.waitForTimeout(400)};
/* fills every answer: MCQs correct, written answers long enough, a choice in every "choose" part */
const fillAll=p=>p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);s.parts.forEach((pt,pi)=>{if(pt.kind==='mcq')pt.items.forEach(id=>st.a[id]=RTS_Q[id][2][0]);else{if(pt.pick)st.pick[pi]=pt.items[0];(pt.pick?[pt.items[0]]:pt.items).forEach(id=>st.a[id]=Array((RTS_Q[id].minW||60)+10).fill('word').join(' '))}});save();rtsPage()});
return {
async rtsFast(){const p=await page({sid:STUDENT,rts:true});await start(p);
  ok(/#\/rts/.test(p.url()),'not on the session page');await shot(p,'rts-session');
  await p.go('#/board');await p.waitForTimeout(300);ok(/#\/board/.test(p.url()),'the arena should not lock during the session');ok(await p.evaluate(()=>presBusyNow()!==true),'break reminder paused away from the session');await p.go('#/');await p.click('#rtsgo');await p.waitForTimeout(300);ok(/#\/rts/.test(p.url()),'CONTINUE should reopen the session');
  ok(await p.evaluate(()=>presBusyNow()===true),'break reminder not paused');
  const x0=await p.evaluate(()=>U.xp);await fillAll(p);ok(!(await p.$eval('#rtsfin',b=>b.disabled)),'Finish should be enabled when everything is answered');
  await p.click('#rtsfin');await p.waitForSelector('#rtsfx');ok(/Secret question unlocked/.test(await p.textContent('.modal')),'secret question offer');await p.click('#rtsfx');await p.waitForTimeout(300);
  await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);st.a[s.bonus]=Array(160).fill('word').join(' ');save()});await p.click('#rtsbsub');await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);return {st:st.st,res:st.res,keys:(st.keys||[]).length,ans:Object.keys(U.ans||{}).filter(k=>/^rts_/.test(k)).length,xp:U.xp,mcq:s.parts.some(x=>x.kind==='mcq')}});
  ok(r.st==='done'&&r.res.bonus,'not finished with the secret question: '+JSON.stringify(r));
  ok(r.xp-x0>=600+(r.res.saved*20),'XP: expected at least '+(600+r.res.saved*20)+', got '+(r.xp-x0));
  ok(r.keys===r.ans&&r.ans>=2,'written answers not in the marking queue: '+JSON.stringify(r));
  ok(/Attendance saved/.test(await p.textContent('.modal')),'celebration popup');await shot(p,'rts-done');
  await p.click('#rtsdok');await p.go('#/board');await p.waitForTimeout(300);ok(/#\/board/.test(p.url()),'the arena is still locked after finishing');
  await p.go('#/');await p.waitForTimeout(300);ok(/ATTENDANCE SAVED/.test(await p.textContent('#rtsgo')),'home button not green after finishing');
  ok(!(await p.$('[data-lect]')),'lecturer-only element on a student page');await p.done()},
async rtsSlow(){const p=await page({sid:STUDENT,rts:true});await start(p);
  await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);st.act=rtsLimit(s,st);save();rtsPage()});
  ok(await p.$('#rtsext'),'no "more time" button when time is up');ok(await p.$eval('#rtsfin',b=>b.disabled),'Finish should wait while answers are missing');
  ok(await p.evaluate(()=>{location.hash='#/rts';return rtsNoXP()===false}),'no extension yet');
  await p.click('#rtsext');await p.waitForTimeout(200);await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);st.act=rtsLimit(s,st)-1000});
  ok(await p.evaluate(()=>rtsNoXP()===true),'extra time should earn no study-time XP');
  await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);st.act=rtsLimit(s,st);save();rtsPage()});await p.click('#rtsext');await p.waitForTimeout(200);
  await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);st.act=rtsLimit(s,st);save();rtsPage()});
  ok(!(await p.$('#rtsext')),'only two extensions');ok(!(await p.$eval('#rtsfin',b=>b.disabled)),'Finish should be allowed after both extensions');ok(await p.$('#rtsrst'),'Restart next to Finish');
  const x0=await p.evaluate(()=>U.xp);await p.click('#rtsfin');await p.waitForTimeout(800);
  const r=await p.evaluate(()=>rtsSt(rtsCur()).res);ok(r&&r.ext===2&&r.todo>0,'slow finish: '+JSON.stringify(r));
  ok(/friendly tip on speed/.test(await p.textContent('.modal')),'no speed tips for a slow finish');ok((await p.evaluate(()=>U.xp))-x0>=300,'300 XP for finishing');await p.done()},
async rtsLive(){const p=await page({sid:STUDENT,rts:true});await start(p);/* an unfinished session plus a live tutorial: the tutorial wins, no redirect loop */
  await p.evaluate(()=>{window.__hops=0;addEventListener('hashchange',()=>window.__hops++);tutOn=()=>true;location.hash='#/tutorial'});await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>({h:location.hash,hops:window.__hops}));ok(r.h==='#/tutorial'&&r.hops<5,'live tutorial and session lock loop: '+JSON.stringify(r));p.errs.length=0;/* the stubbed tutorial has no session data */await p.done()},
async rtsLiveFree(){const p=await page({sid:STUDENT,rts:true});await start(p);/* any live session lifts the session lock, joined or not */
  await p.evaluate(()=>{PR.sess={id:'x',active:true,endsAt:Date.now()+36e5}});await p.go('#/board');await p.waitForTimeout(500);
  ok(/#\/board/.test(p.url()),'a live session should lift the Replacement Tutorial lock');
  await p.evaluate(()=>{PR.sess=null});await p.go('#/badges');await p.waitForTimeout(500);ok(/#\/badges/.test(p.url()),'no lock after the live session either');await p.done()},
async rtsLate(){const p=await page({sid:STUDENT,rts:true});/* closed for the class, reopened for one student by a lecturer note */
  await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>!x.noLimit);s.from=new Date(Date.now()-2*864e5).toISOString();s.to=new Date(Date.now()-36e5).toISOString()});await p.go('#/');await p.waitForTimeout(300);
  ok(!(await p.$('#rtsb')),'a closed session should not show');
  await p.evaluate(()=>applyMarks({note_rtsopen_t:{q:'note',fb:'Reopened for you',at:isoNow(),by:'lecturer',rts:RTS_SESSIONS.find(x=>!x.noLimit).id,rtsTo:new Date(Date.now()+864e5).toISOString()}}));await p.go('#/');await p.waitForTimeout(300);
  ok(await p.$('#rtsb'),'the reopened session should show on home');ok(await p.evaluate(()=>!!rtsCur()),'rtsCur after reopening');await p.done()},
async rtsLectReset(){const p=await page({sid:STUDENT,rts:true});await start(p);await fillAll(p);await p.click('#rtsfin');await p.waitForSelector('#rtsfn,#rtsdok');
  if(await p.$('#rtsfn'))await p.click('#rtsfn');await p.waitForTimeout(500);await p.evaluate(()=>{closeModal&&closeModal()});
  const x1=await p.evaluate(()=>({xp:U.xp,st:rtsSt(rtsCur()).st}));ok(x1.st==='done','not finished first');
  await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>!x.noLimit);s.to=new Date(Date.now()-36e5).toISOString();applyMarks({note_rs:{q:'note',fb:'Reset',at:isoNow(),by:'lecturer',pin:true,rtsReset:s.id,rts:s.id,rtsTo:new Date(Date.now()+864e5).toISOString()}})});
  await p.go('#/');await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>!x.noLimit);return {st:U.rts[s.id].st,old:(U.rtsOld[s.id]||[]).length,ans:Object.keys(U.ans||{}).filter(k=>/^rts_/.test(k)).length,xp:U.xp,log:Object.keys(U.log).filter(k=>k.indexOf('rts:')===0).length}});
  ok(r.st==='new'&&r.old===1&&r.ans===0&&r.log===0&&r.xp<x1.xp,'lecturer reset: '+JSON.stringify(r)+' before '+JSON.stringify(x1));
  ok(/SAVE MY ATTENDANCE/.test(await p.textContent('#rtsgo')),'red button back on home');ok(/#\/$|#$/.test(p.url())||!/#\/rts/.test(p.url()),'should not be locked before starting');
  await p.evaluate(()=>applyMarks({note_rs:{q:'note',fb:'Reset',at:isoNow(),by:'lecturer',rtsReset:RTS_SESSIONS.find(x=>!x.noLimit).id}}));ok(await p.evaluate(()=>(U.rtsOld[RTS_SESSIONS.find(x=>!x.noLimit).id]||[]).length===1),'reset must run once only');await p.done()},
async rtsResetBtn(){const p=await page({sid:LECT,rts:true});await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>!x.noLimit);s.from=new Date(Date.now()-864e5).toISOString();s.to=new Date(Date.now()+864e5).toISOString();
    CLOUD.ok=true;ME.cloud=true;window.__W=[];CLOUD.docs=async c=>c==='users'?[{id:'S081441',name:'A',u:JSON.stringify({rts:{[s.id]:{st:'done',n:1,act:6e5,res:{}}}})}]:[];CLOUD.saveReview=async(sid,k,v)=>{__W.push([sid,k,v])};window.confirm=()=>true});
  await p.go('#/lecturer');await p.waitForTimeout(500);await p.click('[data-f="rtsc"] .lfh');await p.waitForTimeout(500);
  await p.waitForSelector('[data-rtsrs]',{timeout:5000});await p.click('[data-rtsrs]');await p.waitForTimeout(300);
  const w=await p.evaluate(()=>__W);ok(w.length===1&&w[0][0]==='S081441'&&w[0][2].pin&&w[0][2].rtsReset&&/\+05:00$/.test(w[0][2].rtsTo)&&/^note_/.test(w[0][1]),'reset note: '+JSON.stringify(w));await p.done()},
async rtsNoLimit(){const p=await page({sid:STUDENT,rts:true});const has=await p.evaluate(()=>RTS_SESSIONS.some(x=>x.noLimit));if(!has)return p.done();
  /* closed for the class; opened for one student by a note; no time limit; choose 2 of 4 */
  await p.go('#/');await p.waitForTimeout(300);ok(!(await p.$('#rtsb')),'the additional tutorial should be hidden from the class');
  await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>x.noLimit);applyMarks({note_pin_add:{q:'note',fb:'Open for you',at:isoNow(),by:'lecturer',pin:true,rts:s.id,rtsTo:new Date(Date.now()+864e5).toISOString()}})});
  await p.go('#/');await p.waitForTimeout(300);ok(/no time limit/i.test(await p.textContent('#rtsb')),'block should say no time limit');
  await p.click('#rtsgo');await p.waitForSelector('#rtsyes');await p.click('#rtsyes');await p.waitForTimeout(300);ok(/#\/rts/.test(p.url()),'not on the session page');
  ok(/suggested/.test(await p.textContent('#rtsclk')),'clock should be a guide');
  await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);st.act=5*3600e3;save();rtsPage()});ok(!(await p.$('#rtsext')),'no extensions with no time limit');ok(!/Time is up/.test(await p.textContent('main')),'time up shown');
  const boxes=await p.$$('[data-pkm]');ok(boxes.length===4,'four options');await p.locator('[data-pkm]').nth(0).click();await p.waitForTimeout(300);await p.locator('[data-pkm]').nth(2).click();await p.waitForTimeout(300);
  ok(await p.evaluate(()=>[...document.querySelectorAll('[data-pkm]')].filter(x=>x.disabled).length===2),'a third choice should be blocked');
  ok((await p.$$('textarea[data-wq]')).length===2,'two answer boxes');
  await p.evaluate(()=>{const s=rtsCur(),st=rtsSt(s);s.parts[0].items.forEach(id=>st.a[id]=RTS_Q[id][2][0]);rtsPicks(st,1).forEach(id=>st.a[id]=Array(90).fill('word').join(' '));save();rtsPage()});
  ok(!(await p.$eval('#rtsfin',b=>b.disabled)),'Finish should be enabled');const x0=await p.evaluate(()=>U.xp);await p.click('#rtsfin');await p.waitForTimeout(800);
  const r=await p.evaluate(()=>{const st=rtsSt(RTS_SESSIONS.find(x=>x.noLimit));return {st:st.st,keys:(st.keys||[]).length,xp:U.xp}});
  ok(r.st==='done'&&r.keys===2&&r.xp-x0>=300,'finish: '+JSON.stringify(r)+' from '+x0);await p.done()},
async rtsViewAs(){const p=await page({sid:LECT,rts:true});/* View as student shows messages and opened tutorials the student's device hasn't picked up yet */
  await p.evaluate(async()=>{const s=RTS_SESSIONS.find(x=>x.noLimit)||RTS_SESSIONS[0];s.from=new Date(Date.now()-864e5).toISOString();s.to=s.from;CLOUD.ok=true;ME.cloud=true;window.cloudOn=()=>true;
    CLOUD.get=async path=>/^users\//.test(path)?{name:'Test',u:JSON.stringify({xp:10,days:[],log:{},badges:{}})}:/^reviews\//.test(path)?{m:{note_pin_x:{q:'note',fb:'Pinned hello',at:new Date().toISOString(),pin:true,rts:s.id,rtsTo:new Date(Date.now()+864e5).toISOString()}}}:null;
    await vaOpen('S081441')});await p.waitForTimeout(500);
  ok(/Pinned hello/.test(await p.textContent('.pinnote')),'pinned message not shown in View as student');ok(await p.$('#rtsb'),'tutorial block not shown in View as student');
  ok(await p.evaluate(()=>!!VIEWAS),'not in View as student');await p.done()},
async pinNote(){const p=await page({sid:STUDENT});
  await p.evaluate(()=>{applyMarks({note_old1:{q:'note',fb:'Old text',at:'2026-11-17T10:00:00Z',by:'lecturer'}});applyMarks({note_pin_t:{q:'note',fb:'Pinned text',at:'2026-11-17T11:00:00Z',by:'lecturer',pin:true,sup:'note_old1'}})});
  await p.go('#/');await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const m=document.querySelector('main')||document.body,f=document.querySelector('.pinnote');return {f:!!f,top:f&&![...document.querySelectorAll('.card')].some(c=>c!==f&&(c.compareDocumentPosition(f)&Node.DOCUMENT_POSITION_FOLLOWING)),old:/Old text/.test((document.querySelector('.inbox')||{}).textContent||'')}});
  ok(r.f&&r.top&&!r.old,'pinned message not first on home, or old message still shown: '+JSON.stringify(r));
  await p.click('.pinnote [data-noteread]');await p.waitForTimeout(300);ok(!(await p.$('.pinnote')),'Got it should clear the pinned message');await p.done()},
async rtsRestart(){const p=await page({sid:STUDENT,rts:true});await start(p);await fillAll(p);
  await p.click('#rtsrst');await p.waitForSelector('#rtsry');ok(/lose all your progress/.test(await p.textContent('.modal')),'restart warning');await p.click('#rtsry');await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const st=rtsSt(rtsCur());return {n:st.n,a:Object.keys(st.a).length,act:st.act,st:st.st}});ok(r.n===2&&r.a===0&&r.act===0&&r.st==='go','restart: '+JSON.stringify(r));
  await p.evaluate(()=>{save()});await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{const s=RTS_SESSIONS.find(x=>!x.noLimit);s.from=new Date(Date.now()-864e5).toISOString();s.to=new Date(Date.now()+864e5).toISOString();route()});await p.waitForTimeout(300);
  await p.go('#/');await p.waitForTimeout(300);ok(/CONTINUE/.test(await p.textContent('#rtsgo')),'an unfinished session should offer CONTINUE after a reload');await p.done()}
}};
