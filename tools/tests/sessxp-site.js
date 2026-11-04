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
/* the live board: XP this session per joined student (exact from the log, ≈ from whole hours), the total and the session leaders */
async sxlive(){const l=await page({sid:LECT});const t=await l.evaluate(async()=>{const now=Date.now(),T=now-50*60e3,s=x=>Math.round(x/1000);ME.cloud=true;CLOUD.ok=true;['push','flush','put'].forEach(k=>CLOUD[k]=()=>Promise.resolve());
    PR.sess={id:'LV',name:'Week 13 tutorial',active:true,startedAt:T,endsAt:now+3600e3};PR.sessOn=true;
    CLOUD.watchUsers=cb=>setTimeout(()=>cb([{id:'S081441',name:'Aminath Test',u:{qaSince:T-1,qa:[[s(T+6*60e3),'qa',0,2],[s(T+7*60e3),'qb',1,0]],alSince:T-864e5,al:[[s(T-60e3),'mcq:a:0',2],[s(T+5*60e3),'mcq:a:1',2],[s(T+9*60e3),'plan:q:1',15]]}},{id:'S085542',name:'Other Student',u:{xph:{[mvHour(T)]:7,[mvHour(now)]:3}}}]),0);
    CLOUD.watchPresence=(id,cb)=>setTimeout(()=>cb([{id:'S081441',st:'on',on:2000,idle:0,away:0,left:0,longest:0,joinedAt:T+2*60e3,t:now},{id:'S085542',st:'idle',on:1000,idle:500,away:0,left:1,longest:0,joinedAt:T,t:now}]),0);
    location.hash='#/live';await new Promise(r=>setTimeout(r,300));return document.querySelector('#lvb').textContent});
  ok(t.includes('XP this session')&&/Session leaders:.*Aminath Test \+17/.test(t),'live board XP: '+t.slice(0,500));
  ok(t.includes('Most missed')&&t.includes('average score')&&t.includes('50%')&&t.includes('Answer details from 1 of 2'),'live panel: '+t.slice(0,600));ok(/≈ \+\d+\s*XP this session/.test(t),'live total not marked ≈: '+t.slice(0,300));
  await shot(l,'sx-live',true);await l.click('#lvproj');ok(await l.$eval('#lvmain',e=>getComputedStyle(e).display==='none'),'projector view shows names');await shot(l,'sx-live-projector',true);
  await l.evaluate(()=>document.body.classList.remove('proj'));await l.done()},
/* every practice answer is logged with its time, question, result and pick; trimmed like the XP log */
async sxans(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{U.qa=[];ansLog('q1',true,2);ansLog('q2',.456,'plan');ansLog('q3',0,'x'.repeat(30));
    const a=JSON.stringify(U.qa.map(x=>x.slice(1)));U.qa.unshift([Math.round((Date.now()-50*864e5)/1000),'old',1,'']);for(let i=0;i<3100;i++)U.qa.push([Math.round(Date.now()/1000),'f'+i,1,'']);ansLog('last',1,0);
    return {a,len:U.qa.length,old:U.qa.some(x=>x[1]==='old'),since:!!U.qaSince}});
  ok(r.a==='[["q1",1,2],["q2",0.46,"plan"],["q3",0,"xxxxxxxxxxxx"]]','answers: '+r.a);ok(r.len===3000&&!r.old&&r.since,'trim: '+r.len);await p.done()},
/* class figures: average, most missed with the common wrong pick, mostly right, topics; students without the log are counted apart */
async sxstats(){const p=await page({sid:STUDENT});const r=await p.evaluate(()=>{const T=Date.now()-3600e3,s=x=>Math.round(x/1000),S={id:'Z',startedAt:T,endedAt:T+3000e3,active:false};
    const u=a=>({qaSince:T-1,qa:a.map(([m,q,ok,pk])=>[s(T+m*60e3),q,ok,pk])});
    const rows=[{id:'A',u:u([[1,'qa',0,2],[2,'qb',1,0],[3,'qc',1,0],[60,'qz',0,1]])},{id:'B',u:u([[1,'qa',0,2],[2,'qb',1,0],[4,'qc',1,0]])},{id:'C',u:u([[1,'qa',0,3],[2,'qb',0,1],[5,'qc',1,0]])},{id:'D',u:{xph:{}}}];
    const st=sessStats(rows,S);return {avg:st.avg,n:st.n,miss:st.missed.map(e=>e.id+':'+e.pw+':'+e.n+':'+JSON.stringify(e.picks)).join(),right:st.right.map(e=>e.id).join(),cover:st.cover+'/'+st.miss,A:st.per.A.sc+':'+st.per.A.miss.join('+')}});
  ok(r.avg===56&&r.n===9,'average: '+r.avg+' of '+r.n);ok(r.miss==='qa:100:3:{"2":2,"3":1},qb:33:3:{"1":1}','most missed: '+r.miss);ok(r.right==='qc','mostly right: '+r.right);
  ok(r.cover==='3/1','coverage: '+r.cover);ok(r.A==='67:qa','own score: '+r.A);await p.done()},
/* the student's Past tutorial sessions page: the reflection and only their own figures */
async sxpast(){const p=await page({sid:STUDENT});const t=await p.evaluate(async()=>{const T=Date.now()-5*3600e3;ME.cloud=true;CLOUD.ok=true;['push','flush','put'].forEach(k=>CLOUD[k]=()=>Promise.resolve());PR.r3=true;
    const S={id:'PS',name:'Week 11 tutorial',active:false,startedAt:T,endedAt:T+90*60e3,fb:[{t:T+20*60e3,m:'Levels count intermediaries',q:'t10-12'}],
      refl:{cov:[['Topic 10',14],['Topic 11',3]],avg:62,xp:40,nj:9,str:[{id:'x',q:'What is a retailer?',p:95}],ar:[{id:'y',q:'Which channel level has two intermediaries?',a:'Two-level',p:70,h:'#/notes/10'}],note:'Good work today'}};
    CLOUD.getSession=async()=>S;CLOUD.get=async path=>path==='sessions/PS/me/'+ME.sid?{j:T+5*60e3,on:4800,pct:91,xp:37,sc:75,n:8,miss:['zz-unknown']}:null;
    location.hash='#/sessions/PS';await new Promise(r=>setTimeout(r,400));return {t:document.querySelector('#sxsp').textContent,lect:document.querySelectorAll('[data-lect]').length,notes:!!document.querySelector('#sxsp a[href="#/notes/10"]')}});
  ok(t.t.includes('Your session')&&t.t.includes('80 min')&&t.t.includes('91%')&&t.t.includes('37')&&t.t.includes('75%'),'own figures: '+t.t.slice(0,300));
  ok(t.t.includes('Good work today')&&t.t.includes('Areas to reflect on')&&t.t.includes('Two-level')&&t.t.includes('Levels count intermediaries'),'reflection: '+t.t.slice(0,600));
  ok(t.notes,'notes link missing');ok(!t.lect,'lecturer-only element on the student page');await shot(p,'sx-past',true);await p.done()},
/* ending a session on the newest rules: rows to lect/rep, each student's own doc, the reflection on the session doc (no per-student figures) */
async sxfinish(){const l=await page({sid:LECT});const r=await l.evaluate(async()=>{const T=Date.now()-60*60e3,s=x=>Math.round(x/1000),W=[];ME.cloud=true;CLOUD.ok=true;PR.r3=true;
    CLOUD.put=(p,d,m)=>{W.push([p,JSON.parse(JSON.stringify(d))]);return Promise.resolve()};CLOUD.endSession2=(id,d)=>{W.push(['END '+id,d]);return Promise.resolve()};CLOUD.endSession=()=>{W.push(['OLD']);return Promise.resolve()};
    CLOUD.presenceOnce=async()=>[{id:'S081441',st:'on',on:3000,idle:0,away:0,left:0,longest:0,joinedAt:T+60e3,t:Date.now()},{id:'S085542',st:'on',on:1000,idle:900,away:900,left:3,longest:200,joinedAt:T+20*60e3,t:Date.now()}];
    const U2=(a)=>({alSince:T-1,qaSince:T-1,al:[[s(T+5*60e3),'mcq:x:1',2]],qa:a});
    CLOUD.watchUsers=cb=>setTimeout(()=>cb([{id:'S081441',name:'A',u:U2([[s(T+5*60e3),'qa',1,0],[s(T+6*60e3),'qb',0,2]])},{id:'S085542',name:'B',u:U2([[s(T+25*60e3),'qb',0,2]])}]),0);
    PR.sessList=[{id:'F1',name:'Week 12 tutorial',active:true,startedAt:T,endsAt:T+3*3600e3,fb:[]}];LIVE_NAMES={S081441:'A',S085542:'B'};
    await liveFinish('F1');return W});
  const P=r.map(x=>x[0]);ok(!P.includes('OLD'),'used the old end');ok(P.includes('sessions/F1/lect/rep'),'rows not moved to lect/rep: '+P.join());
  const me=r.find(x=>x[0]==='sessions/F1/me/S081441');ok(me&&me[1].sc===50&&me[1].miss.join()==='qb'&&me[1].xp===2,'own doc: '+JSON.stringify(me));
  const end=r.find(x=>x[0]==='END F1')[1];ok(end.nj===2&&end.refl&&!end.rep&&end.refl.ar[0].id==='qb'&&end.refl.ar[0].p===100,'session doc: '+JSON.stringify(end).slice(0,300));
  ok(!JSON.stringify(end).includes('S08'),'student IDs on the session doc');await l.done()},
/* attendance on the report: the whole class, statuses, overrides saved, CSV */
async sxatt(){const l=await page({sid:LECT});const r=await l.evaluate(async()=>{const T=Date.now()-3*3600e3,W=[];ME.cloud=true;CLOUD.ok=true;PR.r3=true;
    CLOUD.put=(p,d)=>{W.push([p,d]);return Promise.resolve()};CLOUD.get=async p=>p.endsWith('/lect/att')?{m:{S000004:'p'}}:p.endsWith('/lect/rep')?{rows:{S000001x:{}}}:null;
    CLOUD.docs=async()=>[{id:'S000002',n:'Bee Present',g:'MKT101_H01 course'},{id:'S000003',n:'Cee Late'},{id:'S000004',n:'Dee NoPhone'},{id:'S000005',n:'Eve Partial'},{id:'S000006',n:'Fay Absent'}];
    const S={id:'AT',name:'Week 12 tutorial',active:false,startedAt:T,endedAt:T+100*60e3,endsAt:T+180*60e3,fb:[],rep:{S000002:{n:'Bee Present',on:5000,pct:90,j:T+2*60e3},S000003:{n:'Cee Late',on:4000,pct:80,j:T+15*60e3},S000005:{n:'Eve Partial',on:900,pct:30,j:T+60e3}}};
    CLOUD.watchUsers=cb=>setTimeout(()=>cb([]),0);CLOUD.watchSessionDoc=(id,cb)=>setTimeout(()=>cb(S),0);CLOUD.watchPresence=()=>{};
    let blob=null;URL.createObjectURL=b=>{blob=b;return 'blob:x'};HTMLAnchorElement.prototype.click=function(){};
    location.hash='#/session/AT';await new Promise(r=>setTimeout(r,500));const row=id=>document.querySelector(`#sratt tr[data-att="${id}"]`).textContent;
    const before=['S000002','S000003','S000004','S000005','S000006'].map(row);document.querySelector('[data-ov="S000006"]').click();await new Promise(r=>setTimeout(r,100));
    document.querySelector('#atcsv').click();return {before,after:row('S000006'),W:W.filter(x=>x[0].includes('/lect/att')),csv:await blob.text(),t:document.querySelector('#sratt').textContent}});
  ok(/Present/.test(r.before[0])&&r.before[0].includes('H01'),'present: '+r.before[0]);ok(/Late/.test(r.before[1]),'late: '+r.before[1]);ok(/Present\s*\(set by you\)/.test(r.before[2]),'override: '+r.before[2]);
  ok(/Partial/.test(r.before[3]),'partial: '+r.before[3]);ok(/Absent/.test(r.before[4]),'absent: '+r.before[4]);ok(/Present/.test(r.after)&&r.W.length===1&&r.W[0][1].m.S000006==='p','override not saved: '+r.after+JSON.stringify(r.W));
  ok(r.csv.split('\n')[0].includes('"Status","Set by lecturer","Joined","Minutes present","On screen %"')&&r.csv.includes('"Dee NoPhone","S000004"'),'CSV: '+r.csv.slice(0,200));
  await shot(l,'sx-attendance',true);await l.done()},
/* sessions before the answer log: the session day's MCQs and plans (≈); then "Create reflection" on an ended report */
async sxday(){const l=await page({sid:LECT});const r=await l.evaluate(async()=>{const T=Date.parse('2026-11-04T15:00:00+05:00'),d='2026-11-04',W=[];ME.cloud=true;CLOUD.ok=true;PR.r3=true;
    const st=sessStats([{id:'S000002',u:{mday:{d,ids:{'t9-5':1,'t8-23':1,'t9-12':1}},log:{'mcq:t8-23:2026-11-04':1,'mcq:t9-12:2026-11-04':1,'plan:s9a:2026-11-04':1}}},{id:'S000003',u:{mday:{d,ids:{'t9-5':1,'t8-23':1}},log:{'mcq:t8-23:2026-11-04':1}}},{id:'S000004',u:{mday:{d:'2026-11-03',ids:{'t9-5':1}},log:{}}}],{id:'D1',startedAt:T,endedAt:T+90*60e3});
    CLOUD.noField=()=>'DEL';CLOUD.put=(p,x)=>{W.push([p,JSON.parse(JSON.stringify(x))]);return Promise.resolve()};CLOUD.get=async p=>p.endsWith('/lect/rep')?{rows:{S000002:{n:'Bee',pct:90,on:4000},S000003:{n:'Cee',pct:70,on:3000}}}:null;CLOUD.docs=async()=>[];
    const S={id:'D1',name:'Week 11 tutorial',active:false,startedAt:T,endedAt:T+90*60e3,endsAt:T+180*60e3,fb:[],rep:{S000002:{n:'Bee',pct:90,on:4000},S000003:{n:'Cee',pct:70,on:3000}}};
    CLOUD.watchUsers=cb=>setTimeout(()=>cb([{id:'S000002',name:'Bee',u:{mday:{d,ids:{'t9-5':1,'t8-23':1}},log:{'mcq:t8-23:2026-11-04':1}}},{id:'S000003',name:'Cee',u:{mday:{d,ids:{'t9-5':1}},log:{}}}]),0);
    CLOUD.watchSessionDoc=(id,cb)=>setTimeout(()=>cb(S),0);CLOUD.watchPresence=()=>{};location.hash='#/session/D1';await new Promise(r=>setTimeout(r,500));
    const t=document.querySelector('#srp').textContent;document.querySelector('#srrb').click();await new Promise(r=>setTimeout(r,300));
    return {avg:st.avg,est:st.est,miss:st.missed.map(e=>e.id+':'+e.pw).join(),cover:st.cover+'/'+st.miss,t,W:W.map(x=>[x[0],x[1]])}});
  ok(r.avg===60&&r.est&&r.miss==='t9-5:100','day fallback: '+JSON.stringify(r).slice(0,300));ok(r.cover==='2/1','coverage: '+r.cover);
  ok(r.t.includes("Based on the day's practice"),'≈ day note missing');const P=r.W.map(x=>x[0]);
  ok(P.includes('sessions/D1/me/S000002')&&P.includes('sessions/D1/lect/rep'),'reflection writes: '+P.join());const rf=r.W.find(x=>x[0]==='sessions/D1'&&x[1].refl);ok(rf&&rf[1].refl.est===1&&rf[1].refl.ar[0].id==='t9-5'&&rf[1].nj===2,'reflection: '+JSON.stringify(rf));
  ok(r.W.some(x=>x[0]==='sessions/D1'&&x[1].rep==='DEL'&&x[1].nj===2),'old rows not moved off the session doc');await l.done()},
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
