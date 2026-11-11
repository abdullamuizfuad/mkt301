/* Site tests for the lecturer's Class activity card (engine/activity.js) and timed writing as study time (presence.js U.stw);
   shared by both courses. The card is fed made-up progress documents through a stubbed CLOUD.docs. */
module.exports=({page,ok,STUDENT,LECT,shot})=>{
/* made-up class: A busy every day, B two days last week, C one day this week, plus the lecturer (must be left out) */
const fake=()=>{const t=today(),wk=weekKey(t),pw=addDays(wk,-7),u=(o)=>JSON.stringify(o),C={};
  const cnt=(days,n,right)=>{const c={};days.forEach(d=>{for(let i=0;i<n;i++)c['mcq:q'+i+':'+d]={d,k:i<right?['mcq','mcqRight']:['mcq']};c['plan:p:'+d]={d,k:['plans']}});return c};
  const A=[pw,addDays(pw,1),addDays(pw,2),wk,t].filter((d,i,a)=>a.indexOf(d)===i&&d<=t);
  return [{id:'S000001',name:'Lecturer',xp:0,u:u({days:[t],cnt:cnt([t],5,5)})},
    {id:'S090001',name:'Alpha Test',xp:900,u:u({days:A,cnt:cnt(A,10,8),st:Object.fromEntries(A.map(d=>[d,1800])),stw:{[A[0]]:3600},xpd:Object.fromEntries(A.map(d=>[d,100]))})},
    {id:'S090002',name:'Beta Test',xp:300,u:u({days:[pw,addDays(pw,3)],cnt:cnt([pw,addDays(pw,3)],4,2),st:{[pw]:7200,[addDays(pw,3)]:7200},xpd:{[pw]:150,[addDays(pw,3)]:150}})},
    {id:'S090003',name:'Gamma Test',xp:50,u:u({days:[t],cnt:cnt([t],2,1),st:{[t]:600},xpd:{[t]:50}})}]};
const load=async p=>{await p.evaluate(fk=>{const f=new Function('return ('+fk+')()')();CLOUD.docs=async()=>f;ACTV=null;let el=document.getElementById('actb');if(!el){el=document.createElement('div');el.id='actb';document.querySelector('#app,main,body').prepend(el)}return actLoad(true)},fake.toString());await p.waitForSelector('#actb table')};
return {
/* ranges: full semester, this week (Monday to Sunday) and a past week; the lecturer is never counted */
async actrange(){const p=await page({sid:LECT,w:1280,h:900});await load(p);
  const r=await p.evaluate(()=>{const n=v=>{actSetRange(v);return ACTV.S.map(s=>actNums(s,ACTV.R)).reduce((o,x)=>(o[x.sid]=x,o),{})};
    const full=n('full'),week=n('week'),pw=n('w:'+addDays(weekKey(today()),-7));
    return {ids:ACTV.S.map(s=>s.sid),wkMon:new Date(ACTV.R.a+'T12:00').getDay(),wkLen:actDays(ACTV.R).length,fullA:full.S090001,wB:week.S090002,pwB:pw.S090002,opts:actRanges().map(x=>x[0])}});
  ok(!r.ids.includes('S000001'),'lecturer counted');ok(r.wkMon===1&&r.wkLen===7,'week is not Monday to Sunday');
  ok(r.fullA.xp===900&&r.fullA.acc===80&&r.fullA.mcq>=10,'full semester numbers: '+JSON.stringify(r.fullA));
  ok(r.fullA.tw===1&&Math.abs(r.fullA.hrs-(r.fullA.days*0.5+1))<0.01,'study hours incl. timed writing: '+JSON.stringify(r.fullA));
  ok(r.wB.days===0&&r.wB.ans===0&&r.pwB.days===2&&r.pwB.xp===300&&r.pwB.hrs===4,'week filter: '+JSON.stringify([r.wB,r.pwB]));
  ok(r.opts.includes('full')&&r.opts.includes('week')&&r.opts.includes('custom')&&r.opts.some(o=>o.startsWith('w:')),'range options');await p.done()},
/* Top 5/10/20/Everyone, sorting, the per-student chart and CSV downloads */
async acttop(){const p=await page({sid:LECT,w:1280,h:900});await load(p);
  await p.evaluate(()=>{window.__csv=[];window.__csvSpy=(rows,name)=>window.__csv.push([name,rows])});
  ok(await p.$$eval('#actb tr[data-asid]',r=>r.length)===3,'Top 10 should list all 3');
  await p.evaluate(()=>{ACTV.top=5;ACTV.sort='hrs';actDraw()});let order=await p.$$eval('#actb tr[data-asid]',r=>r.map(x=>x.dataset.asid));ok(order[0]==='S090002'&&order[2]==='S090003','sort by hours: '+order);
  await p.evaluate(()=>{ACTV.sort='acc';actDraw()});order=await p.$$eval('#actb tr[data-asid]',r=>r.map(x=>x.dataset.asid));ok(order[0]==='S090001','sort by accuracy: '+order);
  await p.click('#actb tr[data-asid="S090002"]');ok(await p.$('#actb tr.actdet svg')&&await p.$('#actb tr.actdet [data-va="S090002"]'),'student chart / view-as button');
  await p.click('#actcsv');await p.click('#actcsva');await p.click('#actcsvd');const c=await p.evaluate(()=>window.__csv);
  ok(c.length===3&&c[0][1][0].join()==='rank,sid,name,from,to,xp,study_hours,timed_writing_hours,days_active,answers,mcq_answers,mcq_accuracy_pct,xp_per_hour,act_mcq,act_plan,act_written,act_chip,act_case,act_notes,act_review,act_expert,act_boss,act_chal,act_paper','CSV header');
  ok(c[1][1].length===4&&!c[1][1].some(r=>r[1]==='S000001'),'everyone CSV');ok(c[2][1][0].join()==='date,students_active,answers,xp,study_hours'&&c[2][1].length>2,'daily CSV');
  await p.evaluate(()=>{ACTV.top=0;actDraw()});await shot(p,'activity-desktop');await p.done();
  const m=await page({sid:LECT,w:390,h:844});await load(m);await m.waitForTimeout(200);
  ok(await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'sideways scroll on a phone');await shot(m,'activity-phone');await m.done()},
/* the calendar works with very little data, and tapping a day shows its numbers */
async actheat(){const p=await page({sid:LECT,w:390,h:844});await p.evaluate(()=>{CLOUD.docs=async()=>[{id:'S090009',name:'Solo',xp:5,u:JSON.stringify({days:[today()],cnt:{['mcq:x:'+today()]:{d:today(),k:['mcq']}}})}];ACTV=null;const el=document.createElement('div');el.id='actb';document.body.prepend(el);return actLoad(true)});
  await p.waitForSelector('#actb [data-hd]');await p.evaluate(()=>{actSetRange('full');actDraw()});const n=await p.$$eval('#actb [data-hd]',r=>r.length);ok(n>=1,'no calendar squares');
  await p.click(`#actb [data-hd="${await p.evaluate(()=>today())}"]`);ok((await p.textContent('#actday')).includes('1 students practised'),'day detail');await p.done()},
/* timed writing: capped at the timer, minus on-screen seconds, only on Done with 40%+; additive; never for the lecturer */
async twcredit(){const p=await page({sid:STUDENT});
  const r=await p.evaluate(()=>{const k=today();U.stw={};const mk=id=>{const el=document.createElement('div');el.innerHTML=`<span id="t-${id}"></span><button data-a="tgo"></button><button data-a="tstop"></button><button data-a="done"></button>`;document.body.append(el);return el};
    const out=[];
    /* 1. 20 of 30 minutes used, 300 s of it on screen (the phone was locked for the rest) → 900 s */
    LS.set('tm_tw1',{left:600,end:Date.now()+600e3,twPid:PR.pid,twA0:PR.act,twOs:0});const e1=mk('tw1');let got=null;timer('tw1',1800,e1,ok=>got=ok);PR.act+=300;e1.querySelector('[data-a="done"]').click();out.push(got,U.stw[k]|0);
    /* 2. overtime: 40 minutes on a 30-minute timer → capped at 1800 */
    LS.set('tm_tw2',{left:-600,end:Date.now()-600e3,twPid:PR.pid,twA0:PR.act,twOs:0});const e2=mk('tw2');timer('tw2',1800,e2,()=>{});e2.querySelector('[data-a="done"]').click();out.push(U.stw[k]|0);
    /* 3. under 40%: no credit */
    window.confirm=()=>true;LS.set('tm_tw3',{left:1500,end:null,twOs:0});const e3=mk('tw3');timer('tw3',1800,e3,()=>{});e3.querySelector('[data-a="done"]').click();out.push(U.stw[k]|0);
    /* 4. on-screen counted across a pause/resume and a page reload (new page id) is still subtracted */
    const T={};twStart(T);PR.act+=100;twStop(T);twStart(T);PR.act+=50;const old=PR.pid;PR.pid='other';twTake(T);PR.pid=old;out.push(T.twOs);
    /* 5. the lecturer never gets it */
    return out});
  ok(r[0]===true&&r[1]===900,'credit minus on-screen: '+r);ok(r[2]===900+1800,'not capped / not additive: '+r);ok(r[3]===2700,'credit under 40%: '+r);ok(r[4]===100,'on-screen across pause/reload: '+r);
  const s=await p.evaluate(()=>{U.st=U.st||{};U.st[today()]=600;return stCardHTML()});ok(s.includes('incl. timed writing'),'screen-time card note');
  const xp=await p.evaluate(()=>{stFlush(true);const before=U.xp;U.stw[today()]=99999;stFlush(true);return U.xp-before});ok(xp===0,'timed writing earned screen-time XP');await p.done();
  const l=await page({sid:LECT});ok(await l.evaluate(()=>stwAdd(600,1800,0))===0,'lecturer got timed writing');await l.done()}
}};
