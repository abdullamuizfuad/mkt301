/* MKT Arena engine: lecturer reports (Lecturer tab). Both work on the published rules (they read users/ and sessions/ only).
   - Weekly report: for each of the last 8 weeks (Monday to Sunday), how many students practised, their active days, screen time,
     practice actions and the XP they earned, with a per-student CSV for any week.
   - Attendance: every live tutorial session's report as one CSV (students × sessions: minutes joined and % on screen). */
const RP_WEEKS=8;
/* a student's numbers for the week starting `wk` (YYYY-MM-DD, a Monday) */
function wkNums(u,wk){const end=addDays(wk,7),inW=d=>d&&d>=wk&&d<end,days=(u.days||[]).filter(inW).length,st=Object.entries(u.st||{}).filter(([d])=>inW(d)).reduce((t,[,s])=>t+(s|0),0);
  const acts=Object.values(u.cnt||{}).filter(c=>inW(c.d)).length,xp=Object.entries(u.xpd||{}).filter(([d])=>inW(d)).reduce((t,[,x])=>t+(x|0),0);return {days,st,acts,xp}}
/* XP per day (U.xpd, kept for 120 days) so reports can show weekly XP from now on */
onHook('award',(key,xp)=>{if(!U||!xp)return;U.xpd=U.xpd||{};const d=today();U.xpd[d]=(U.xpd[d]|0)+xp;const ks=Object.keys(U.xpd).sort();if(ks.length>120)ks.slice(0,ks.length-120).forEach(k=>delete U.xpd[k])});
lcard('wkrc',el=>{el.hidden=false;el.innerHTML=`<h2 style="margin:0">Weekly report</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Week by week (Monday to Sunday): who practised, for how long and how much. Weekly XP counts from this update on.</p><div id="wkrb"><button class="btn ghost" id="wkrgo">Make the report</button></div>`;
  $('#wkrgo').onclick=async()=>{$('#wkrb').innerHTML='<p class="muted">Reading progress…</p>';let docs;try{docs=await CLOUD.docs('users')}catch(e){$('#wkrb').innerHTML=`<p class="err">${esc(CLOUD.say(e))}</p>`;return}
    const S=docs.filter(d=>d.id!==LECTURER).map(d=>{let u={};try{u=JSON.parse(d.u)}catch(e){}return {sid:d.id,name:d.name||'',u}}),W=[];let wk=weekKey(today());for(let i=0;i<RP_WEEKS;i++){W.unshift(wk);wk=addDays(wk,-7)}
    const rows=W.map(w=>{const N=S.map(s=>Object.assign({sid:s.sid,name:s.name},wkNums(s.u,w))),act=N.filter(n=>n.days>0);
      return {w,n:S.length,act:act.length,days:act.length?(act.reduce((t,n)=>t+n.days,0)/act.length).toFixed(1):'0',st:N.reduce((t,n)=>t+n.st,0),acts:N.reduce((t,n)=>t+n.acts,0),xp:N.reduce((t,n)=>t+n.xp,0),N}});
    const mx=Math.max(1,...rows.map(r=>r.act));
    $('#wkrb').innerHTML=`<div class="tablewrap"><table><tr><th>Week of</th><th>Practised</th><th>Avg days</th><th>Screen time</th><th>Practice</th><th>XP</th><th></th></tr>${rows.slice().reverse().map(r=>`<tr><td><b>${esc(r.w)}</b></td>
      <td><span class="bar" style="display:inline-block;width:70px;vertical-align:middle"><i style="width:${r.act/mx*100}%"></i></span> ${r.act}/${r.n}</td><td>${r.days}</td><td>${stFmt(r.st)}</td><td>${r.acts}</td><td>${r.xp||'–'}</td><td><button class="btn ghost sm" data-wk="${r.w}">⬇ CSV</button></td></tr>`).join('')}</table></div>
      <p class="muted" style="font-size:.82rem;margin:6px 0 0">Practice = answers, plans, reviews, flashcards and other counted actions. Screen time is active time only (2-minute idle rule).</p>`;
    el.querySelectorAll('[data-wk]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x.w===b.dataset.wk);csvDownload([['week_of','sid','name','active_days','screen_minutes','practice_actions','xp']].concat(r.N.sort((a,b)=>b.days-a.days||a.sid<b.sid?-1:1).map(n=>[r.w,n.sid,n.name,n.days,Math.round(n.st/60),n.acts,n.xp])),CRS.id+'-week-'+r.w+'.csv')})}});
lcard('attc',el=>{el.hidden=false;el.innerHTML=`<h2 style="margin:0">Attendance</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Every ended live session as one spreadsheet: minutes joined and % on screen for each student (blank = did not join).</p><button class="btn ghost" id="attgo">⬇ Attendance CSV</button> <span class="muted" id="attn"></span>`;
  $('#attgo').onclick=async()=>{let ss,us;try{[ss,us]=await Promise.all([CLOUD.docs('sessions'),CLOUD.docs('users')])}catch(e){$('#attn').textContent=CLOUD.say(e);return}
    ss=ss.filter(s=>s.rep).sort((a,b)=>(a.startedAt|0)-(b.startedAt|0));if(!ss.length){$('#attn').textContent='No ended sessions with a report yet.';return}
    const names={};us.forEach(u=>names[u.id]=u.name||'');ss.forEach(s=>Object.entries(s.rep).forEach(([sid,r])=>{if(!names[sid])names[sid]=r.n||''}));delete names[LECTURER];
    const head=['sid','name','sessions_joined'].concat(ss.flatMap(s=>{const d=new Date((s.startedAt|0)+MV).toISOString().slice(0,16).replace('T',' ');return [s.name+' '+d+' minutes',s.name+' '+d+' % on screen']}));
    const rows=Object.keys(names).sort().map(sid=>{const c=ss.map(s=>s.rep[sid]);return [sid,names[sid],c.filter(Boolean).length].concat(c.flatMap(r=>r?[Math.round(((r.on|0)+(r.idle|0)+(r.away|0))/60),r.pct|0]:['','']))});
    csvDownload([head].concat(rows),CRS.id+'-attendance.csv');$('#attn').textContent=ss.length+' sessions, '+rows.length+' students.'}});
