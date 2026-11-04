/* Site tests for XP and activity per live session (engine/presence.js; shared by MKT101 and MKT301; required by run.js).
   The cloud parts (rep rows with xp / acts accepted by the rules, the report built from users docs) are in firebase.js (group sessxp). */
module.exports=({page,ok,STUDENT,LECT,shot})=>({
/* every award is logged with its time; the check-in too; old entries and overflow are trimmed */
async sxlog(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{U.al=[];award('mcq:t:1',2,'x');award(null,25,'Daily mission complete');
    const a=U.al.map(e=>e[1]+'='+e[2]).join();U.al.unshift([Math.round((Date.now()-50*864e5)/1000),'mcq:old',2]);
    for(let i=0;i<2600;i++)U.al.push([Math.round(Date.now()/1000),'fc:x'+i,1]);award('plan:q:1',15,'x');
    return {a,len:U.al.length,old:U.al.some(e=>e[1]==='mcq:old'),last:U.al[U.al.length-1][1],since:!!U.alSince,again:award('mcq:t:1',2,'x')}});
  ok(/mcq:t:1=2/.test(r.a)&&/mission=25/.test(r.a),'awards not logged: '+r.a);ok(r.since,'alSince not set');
  ok(r.len===2500&&!r.old&&r.last==='plan:q:1','log not trimmed: '+r.len+' '+r.old);ok(r.again===false,'repeat award logged');await p.done()},
/* the window: session start or join (later), to the end or now while live; the focus bonus is found by key and shown on its own */
async sxwin(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const T=Date.parse('2026-11-03T16:00:00+05:00'),s=t=>Math.round(t/1000),m=60e3;
    const u={alSince:T-864e5,gain:{'sessfocus:S1':20},al:[[s(T-5*m),'mcq:a:1',2],[s(T+2*m),'mcq:a:2',2],[s(T+12*m),'plan:b:1',15],[s(T+12*m),'perfect:b',10],[s(T+30*m),'chip:c:1',6],
      [s(T+50*m),'stgoal:d',15],[s(T+70*m),'sessfocus:S1',20],[s(T+130*m),'mcq:a:3',2]]};
    const real=Date.now;Date.now=()=>T+60*m;
    const ended={id:'S1',startedAt:T,endedAt:T+120*m,active:false},live={id:'S1',startedAt:T,endsAt:T+180*m,active:true};
    const a=sessXP(u,ended),b=sessXP(u,ended,T+10*m),c=sessXP(u,live);Date.now=real;
    return {a:[a.xp,a.fx,a.est,sxActs(a.acts)],b:[b.xp,sxActs(b.acts)],c:[c.xp,c.tl.length]}});
  ok(r.a.join('|')==='68|20|false|1 MCQ · 1 plan · 1 paragraph','ended session: '+r.a.join('|'));
  ok(r.b.join('|')==='66|1 plan · 1 paragraph','joined late: '+r.b.join('|'));ok(r.c.join('|')==='68|5','still live (to now): '+r.c.join('|'));await p.done()},
/* award key prefixes from both courses map to plain categories; bonuses don't count as practice */
async sxcats(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>['mcq','mcqr','mqs','plan','perfect','chip','typed','timed','ltimed','essay','check','fc','rev','notes','read','readall','actdone',
    'verdict','ca','ess','eplan','pp','ch','btp','wild','review','stgoal','stblock','sessfocus','checkin','mission','avatar','zzz'].map(k=>{const c=sxCat(k+':x');return k+'='+c.c+(c.n?'':'*')}).join()+'|'+sxActs({mcq:3,plan:1,st:2,daily:1,marked:1}));
  ok(r.includes('mcqr=mcq')&&r.includes('perfect=plan*')&&r.includes('ltimed=timed')&&r.includes('actdone=case')&&r.includes('ess=essay')&&r.includes('btp=chal*')&&r.includes('zzz=other'),'categories: '+r);
  ok(r.endsWith('|3 MCQs · 1 plan'),'bonuses counted as practice: '+r);await p.done()},
/* sessions from before the log: an hourly estimate, marked ≈, with no breakdown; a saved report row is used when the log can't cover it */
async sxhourly(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const T=Date.parse('2026-11-02T10:10:00+05:00'),S={id:'S0',startedAt:T,endedAt:T+90*60e3,active:false};
    const u={xph:{[mvHour(T-3600e3)]:40,[mvHour(T)]:12,[mvHour(T+3600e3)]:8,[mvHour(T+4*3600e3)]:99}},e=sessXP(u,S),k=sessXP({},S,null,{xp:30,fx:20,acts:{mcq:4}});
    return [e.xp,e.est,sxXP(e),sxActs(e.acts),k.xp,k.est,sxActs(k.acts)].join('|')});
  ok(r==='20|true|≈ 20 XP||50|false|4 MCQs','hourly / saved: '+r);await p.done()},
/* the joined student's bar shows the XP earned since joining */
async sxbar(){const p=await page({sid:STUDENT});const r=await p.evaluate(async()=>{const now=Date.now();PR.sess={id:'L1',name:'Week 12 tutorial',active:true,startedAt:now-60e3,endsAt:now+3600e3};PR.sessOn=true;
    U.sess={L1:{j:now-30e3,on:0,idle:0,away:0,left:0,lg:0,pr:[],c:0}};PR.joined=true;presBar();award('mcq:bar:1',2,'x');award('plan:bar:1',15,'y');
    await new Promise(r=>setTimeout(r,30));return (document.querySelector('#lbxp')||{}).textContent||''});
  ok(/^\+(17|27) XP this session$/.test(r),'bar counter: '+r);await shot(p,'sx-bar');await p.done()},
/* the lecturer's report: XP and activity columns, class totals, a timeline, the CSV; a student's progress shows their own XP and nothing lecturer-only */
async sxreport(){const T0=Date.now()-3*3600e3;
  const mk=(T,m)=>({S:{id:'R1',name:'Week 12 tutorial',active:false,startedAt:T,endedAt:T+100*m,endsAt:T+180*m,rep:{S081441:{n:'Aminath Test',on:5000,idle:200,away:100,left:2,lg:60,pct:94,pr:'Section A',j:T+5*m},
      S085542:{n:'Other Student',on:3000,idle:900,away:700,left:6,lg:300,pct:65,pr:'Notes'},S082110:{n:'Old Device',on:4000,idle:100,away:0,left:0,lg:0,pct:97,pr:'',xp:12,fx:0,acts:{fc:6}}}},
    users:[{id:'S081441',name:'Aminath Test',u:{alSince:T-864e5,gain:{'sessfocus:R1':20},sess:{R1:{j:T+5*m}},al:[[Math.round((T+10*m)/1000),'mcq:a:1',2],[Math.round((T+11*m)/1000),'mcq:a:2',2],[Math.round((T+40*m)/1000),'plan:q:1',15],[Math.round((T+101*m)/1000),'sessfocus:R1',20]]}},
      {id:'S085542',name:'Other Student',u:{xph:{[mvHour(T)]:9,[mvHour(T+3600e3)]:6}}},{id:'S082110',name:'Old Device',u:{}}]});
  const l=await page({sid:LECT});
  const got=await l.evaluate(async src=>{const D=eval('('+src[0]+')')(src[1],60e3);ME.cloud=true;CLOUD.ok=true;['push','flush','put'].forEach(k=>CLOUD[k]=()=>Promise.resolve());
      CLOUD.watchUsers=(cb)=>cb(D.users);CLOUD.watchSessionDoc=(id,cb)=>cb(D.S);CLOUD.watchPresence=()=>{};
      let blob=null;URL.createObjectURL=b=>{blob=b;return 'blob:x'};HTMLAnchorElement.prototype.click=function(){};
      location.hash='#/session/R1';await new Promise(r=>setTimeout(r,300));const el=document.querySelector('#srp');document.querySelector('#srcsv').click();
      const row=sid=>document.querySelector(`#srp tr[data-sid="${sid}"]`).textContent;
      return {t:el.textContent,a:row('S081441'),b:row('S085542'),c:row('S082110'),tl:!!document.querySelector('tr[data-sid="S081441"] details.sxtl[data-lect]'),csv:await blob.text()}},[mk.toString(),T0]);
  ok(got.t.includes('XP in session')&&got.t.includes('Focus bonus')&&got.t.includes('Activity'),'report columns missing');
  ok(got.a.includes('39 XP')&&got.a.includes('+20')&&got.a.includes('2 MCQs · 1 plan'),'exact row: '+got.a);
  ok(got.b.includes('≈ 15 XP')&&got.b.includes('estimate (hourly)'),'estimate row: '+got.b);ok(got.c.includes('12 XP')&&got.c.includes('6 flashcards'),'saved row: '+got.c);
  ok(/≈ 66\s*XP earned in session/.test(got.t)&&/≈ 22\s*XP per student/.test(got.t),'class totals: '+got.t.slice(0,400));ok(got.tl,'timeline missing');
  ok(got.csv.split('\n')[0].includes('"XP in session","Focus bonus","XP basis","Activity"')&&got.csv.includes('"39","20","exact","2 MCQs · 1 plan"')&&got.csv.includes('estimate (hourly)'),'CSV: '+got.csv.split('\n').slice(0,2).join(' / '));
  await shot(l,'sx-report',true);await l.done();
  /* the student's own progress: XP per session, no lecturer-only elements */
  const s=await page({sid:STUDENT});const own=await s.evaluate(async src=>{const D=eval('('+src[0]+')')(src[1],60e3);U.alSince=D.users[0].u.alSince;U.al=D.users[0].u.al;U.gain=Object.assign(U.gain||{},D.users[0].u.gain);U.sess=D.users[0].u.sess;
      PR.sessList=[D.S];location.hash='#/progress/screen';await new Promise(r=>setTimeout(r,300));const pg=document.querySelector('#pgb');
      return {t:pg.textContent,lect:document.querySelectorAll('[data-lect]').length}},[mk.toString(),T0]);
  ok(own.t.includes('XP in session')&&own.t.includes('39 XP'),'own progress XP missing: '+own.t.slice(0,300));ok(!own.lect,'lecturer-only element on the student page');
  await shot(s,'sx-progress',true);await s.done()},
});
