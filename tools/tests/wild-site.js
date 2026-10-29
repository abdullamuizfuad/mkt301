/* Site tests for the weekly 6th-spot challenge, paragraph questions and study notes (shared by MKT101 and MKT301; required by run.js).
   The cloud parts (window, top 5 left out, one attempt, no lecturer entry, the full run) are in firebase.js (group wild). */
module.exports=({page,ok,STUDENT,LECT,shot})=>({
/* the window: 24 hours before class start (GMT+5) until class starts; ids are the class date */
async wildwin(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const W=CRS.wild,at=(d,h,m)=>Date.parse(d+'T'+String(h).padStart(2,'0')+':'+String(m||0).padStart(2,'0')+':00+05:00');
    const cls=CRS.id==='mkt301'?'2026-11-03':'2026-11-04',open=CRS.id==='mkt301'?'2026-11-02':'2026-11-03',w=t=>{const x=wildWin(t);return [x.id,x.open,x.opens===at(open,16),x.closes===at(cls,16)].join()};
    return {day:W.day,hour:W.hour,before:w(at(open,15,59)),start:w(at(open,16)),last:w(at(cls,15,59)),end:wildWin(at(cls,16)).id,mid:w(at(open,23)),prev:wildWin(at(cls,16)-7*864e5-1).id}});
  const id='w'+(r.day===2?'2026-11-03':'2026-11-04');ok(r.hour===16&&[2,3].includes(r.day),'class time');
  ok(r.before===id+',false,true,true','before opening: '+r.before);ok(r.start===id+',true,true,true','at opening: '+r.start);ok(r.last===id+',true,true,true','a second before class: '+r.last);
  ok(r.mid===id+',true,true,true','overnight: '+r.mid);ok(r.end!==id,'still open at class start');ok(r.prev==='w'+(r.day===2?'2026-10-27':'2026-10-28'),'previous window: '+r.prev);await p.done()},
/* the week's top 5 from XP per hour (and per day before that existed); the lecturer and students with no XP that week are left out */
async wildtop5(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const win=wildWin(Date.parse('2026-11-12T12:00:00+05:00')),h=t=>mvHour(t),d=t=>mvDay(t);
    const inW=win.from+3600e3,before=win.from-3600e3,after=win.opens+3600e3;
    const rows=[{id:'S000001',u:{xph:{[h(inW)]:900}}},{id:'S000002',u:{xph:{[h(inW)]:50,[h(after)]:500}}},{id:'S000003',u:{xph:{[h(before)]:400,[h(inW)]:10}}},
      {id:'S000004',u:{xpd:{[d(inW+864e5)]:70}}},{id:'S000005',u:{xph:{[h(inW)]:30}}},{id:'S000006',u:{xph:{[h(inW)]:20}}},{id:'S000007',u:{xph:{[h(inW)]:5}}},{id:'S000008',u:{}}];
    return {t5:wildTop5(rows,win).map(x=>x.id+':'+x.x).join(),wx:weekXP(rows[1].u,win.from,win.opens)}});
  ok(r.wx===50,'XP after the opening counted: '+r.wx);ok(r.t5==='S000004:70,S000002:50,S000005:30,S000006:20,S000003:10','top 5: '+r.t5);await p.done()},
/* XP is recorded per hour as it is earned */
async wildxph(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{award('t:xph',25,'x');return U.xph[mvHour()]});ok(r===25,'hourly XP not recorded: '+r);await p.done()},
/* paragraph questions: a full path, an alternative order, a correct start, a partial path, decoys */
async chipscore(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const it={chips:[{t:'a',ok:1},{t:'b',ok:1},{t:'c',ok:1},{t:'d',ok:1},{t:'x'},{t:'y'}],paths:[[0,1,2,3],[0,2,1,3]],partial:[[[0,3],2]],max:4},s=a=>chipsScore(it,a).s;
    return [s([0,1,2,3]),s([0,2,1,3]),s([0,1]),s([0,3]),s([0,1,2,3,4]),s([4,5]),s([2,0,1,3]),s([0,4,1,2,3])].join()});
  ok(r==='4,4,2,2,3,0,2,3','chip scores: '+r);
  ok(await p.evaluate(()=>CHIPS.every(c=>c.paths.every(pa=>pa.every(j=>c.chips[j]&&c.chips[j].ok))&&c.chips.filter(x=>!x.ok).every(x=>x.w))&&new Set(CHIPS.map(c=>c.id)).size===CHIPS.length),'a paragraph question is malformed');
  ok(await p.evaluate(()=>wildTopicList().every(([k])=>CHIPS.filter(c=>String(c.topic)===String(k)).length>=(CRS.id==='mkt301'?2:1))),'not enough paragraph questions for a topic');
  /* practice page: build, check, XP once a day */
  await p.go('#/chips/'+(await p.evaluate(()=>String(wildTopicList()[2][0]))));await p.click('#chq [data-in]');await p.click('#chq [data-ck]');ok(await p.$('#chq .fb'),'no feedback after checking');await p.done()},
/* the challenge's questions: the same for everyone, the right size, all real */
async wilditems(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const L=wildTopicList(),out=[];for(let i=0;i+1<L.length;i++){const top=[L[i][0],L[i+1][0]].map(String),a=wildItems(top,'x|'+i),b=wildItems(top,'x|'+i);
      out.push([a.join()===b.join(),a.length,a.every(id=>!!wildItem(id)),a.filter(id=>wildItem(id).kind==='chips').length].join(':'))}return out});
  ok(r.every(x=>x.startsWith('true:')&&x.split(':')[2]==='true'),'challenge items: '+r.join(' '));
  ok(r.every(x=>{const [,n,,c]=x.split(':');return n>=(c>2?8:12)&&c>=2}),'challenge size: '+r.join(' '));await p.done()},
/* a running attempt locks the notes and survives a reload; the lecturer never starts one */
async wildlock(){const p=await page({sid:STUDENT});await p.evaluate(()=>{U.wild={wTest:{at:Date.now()-5*60e3,i:0,a:{},done:0}};save()});await p.reload();await p.waitForTimeout(300);
  ok(await p.evaluate(()=>wildBusy()&&document.body.classList.contains('wlock')),'not locked after a reload');
  const left=await p.evaluate(()=>U.wild.wTest.at+WILD_MS-Date.now());ok(left>14*60e3&&left<=15*60e3,'the clock restarted: '+left);
  await p.go('#/notes');ok((await p.textContent('main')).includes('locked during the challenge'),'notes open during the attempt');
  await p.evaluate(()=>{U.wild.wTest.at=Date.now()-21*60e3;save()});await p.go('#/');await p.go('#/notes');ok(!(await p.textContent('main')).includes('locked'),'still locked after 20 minutes');await p.done();
  const l=await page({sid:LECT});await l.evaluate(()=>wildStart({id:'wX',items:[]}));ok(await l.evaluate(()=>!U.wild),'the lecturer started an attempt');await l.done()},
/* "📖 Refer to notes" on written questions, and every link opens real notes */
async notesref(){const p=await page({sid:STUDENT});await p.go('#/short');const b=p.locator('.qcard .nref').first();ok(await b.count(),'no Refer to notes button on a written question');
  const href=await b.getAttribute('href');await b.click();await p.waitForTimeout(250);ok((await p.evaluate(()=>location.hash))===href&&!!await p.$('#n-min'),'Refer to notes does not open the notes: '+href);
  const bad=await p.evaluate(()=>{const C=notesCfg();return CHIPS.map(q=>notesHref(q,{})).filter(h=>!h||!C.keys.map(String).includes(h.split('/')[2]))});ok(!bad.length,'broken notes links: '+bad.join());await p.done()},
/* the folded notes page (MKT301): big idea and one minute open, sections tap open, Jump to opens a section, a section link opens it */
async notesfold(){const p=await page({sid:STUDENT});if(!await p.evaluate(()=>notesCfg().fold))return p.done();await p.go('#/notes/10');
  ok(await p.$('.nbig')&&await p.isVisible('#n-min'),'big idea or one minute missing');ok(await p.$$eval('details.nsec',d=>d.length>=5&&d.every(x=>!x.open)),'sections should start closed');
  const h=await p.evaluate(()=>document.querySelector('main').getBoundingClientRect().height);ok(h<1500,'the folded week is too long: '+Math.round(h));await shot(p,'notes-week10-folded',true);
  await p.click('.njump [data-jump="n-terms"]');ok(await p.$eval('#n-terms',d=>d.open),'Jump to does not open the section');
  await p.go('#/notes/11/chk');ok(await p.$eval('#n-chk',d=>d.open),'a section link does not open the section');
  await p.selectOption('#nwk','3');await p.waitForTimeout(250);ok((await p.evaluate(()=>location.hash))==='#/notes/3','week picker');await p.done();
  const l=await page({sid:LECT});ok(await l.evaluate(()=>LCARDS.some(c=>c.id==='nrevc')&&/Notes to check \(\d+\)/.test(LF_META.nrevc[0])),'no notes-to-check card for the lecturer');await l.done()},
/* the challenge page offline and the home card stay quiet without the cloud */
async wildpage(){const p=await page({sid:STUDENT});await p.go('#/wild');ok((await p.textContent('main')).includes('6th-spot challenge'),'challenge page');await p.go('#/practice');ok(await p.$('a[href="#/wild"]')&&await p.$('a[href="#/chips"]'),'practice tiles');await p.done()}
});
