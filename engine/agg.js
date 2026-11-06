/* MKT Arena engine: class figures for the fun features (engine/fun.js): the class goal, most improved and topic territories.
   aggCompute(users, groups, o) → the meta/agg document. Pure (no page, no cloud), so tools/agg/run.mjs runs the same code in Node.
   users: [{id, n (official name), u (parsed progress)}], students only. groups: {SID: team label} (sections, or tutorial Session 1/2/3).
   o: {now (ms), target (answers for the class goal)}. Weeks run Monday to Sunday, Maldives time (GMT+5). Answers come from U.qa
   ([seconds, question id, ok 0–1, pick]); topic accuracy for territories from U.mt ({topic: [tries, right]}). */
const AGG_MV=5*3600e3;
function aggWeek(t){const d=new Date(t+AGG_MV),day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);return d.toISOString().slice(0,10)}
function aggCompute(users,groups,o){o=o||{};groups=groups||{};const now=o.now||Date.now(),wk=aggWeek(now),from=Date.parse(wk+'T00:00:00+05:00'),p1=from-7*864e5,p2=from-14*864e5;
  const win=(u,a,b)=>(u.qa||[]).filter(x=>x[0]*1000>=a&&x[0]*1000<b),acc=v=>v.reduce((t,r)=>t+(+r[2]||0),0)/v.length;
  /* the class goal: practice answers this week */
  let n=0;users.forEach(x=>{n+=win(x.u||{},from,now+1).length});const target=Math.max(1,o.target|0||1500);
  /* most improved: last full week against the week before, for students with 20+ answers in both */
  const imp=[];users.forEach(x=>{const u=x.u||{},a=win(u,p1,from),b=win(u,p2,p1);if(a.length<20||b.length<20)return;const d=Math.round((acc(a)-acc(b))*100);
    if(d>0)imp.push({sid:x.id,n:String(x.n||'').slice(0,60),d,acc:Math.round(acc(a)*100)})});imp.sort((p,q)=>q.d-p.d||q.acc-p.acc);
  /* topic territories: each team's average accuracy per topic (students with 5+ tries in it, 2+ students a team) */
  const T={};users.forEach(x=>{const g=groups[x.id];if(!g)return;Object.entries((x.u||{}).mt||{}).forEach(([t,r])=>{if(!r||(r[0]|0)<5)return;const e=(T[t]=T[t]||{})[g]=T[t][g]||[0,0];e[0]+=r[1]/r[0];e[1]++})});
  const terr={};Object.entries(T).forEach(([t,G])=>{const av={};Object.entries(G).forEach(([g,e])=>{if(e[1]>=2)av[g]=Math.round(e[0]/e[1]*100)});const ks=Object.keys(av).sort((a,b)=>av[b]-av[a]);
    if(ks.length)terr[t]={av,own:ks.length>1&&av[ks[0]]===av[ks[1]]?'':ks[0]}});
  const mem={};users.forEach(x=>{if(groups[x.id])mem[x.id]=groups[x.id]});
  return {at:now,wk,goal:{wk,target,n,done:n>=target},imp:{wk:aggWeek(p1),top:imp.slice(0,3)},terr,teams:[...new Set(Object.values(mem))].sort(),mem}}
/* which tutorial session (number) each student joined most recently: sessions [{id, name, wk, grp, startedAt, p:[SID…]}] */
function aggSessGroups(sessions){const m={},at={};(sessions||[]).forEach(s=>{const g=+s.grp||+((/Session\s*(\d+)/i.exec(String(s.name||''))||[])[1])||1,t=+s.startedAt||0;
  (s.p||[]).forEach(sid=>{if(!(sid in at)||t>at[sid]){at[sid]=t;m[sid]='Session '+g}})});return m}
if(typeof module!=='undefined')module.exports={aggCompute,aggWeek,aggSessGroups};
