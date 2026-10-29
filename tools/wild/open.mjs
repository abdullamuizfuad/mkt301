#!/usr/bin/env node
/* Opens this week's 6th-spot challenge (see docs/WILD.md). Run it at (or soon after) the opening time, 24 hours before class:
     node tools/wild/open.mjs                 open the window that is open now (does nothing if it is already open)
     node tools/wild/open.mjs --topics=10,11  use these two topics (otherwise: the topics saved on the site, then CRS.wildPlan, then the two most recent)
     node tools/wild/open.mjs --dry           work everything out and print the counts, write nothing
     node tools/wild/open.mjs --at=<ISO time> pretend it is this time (tests)
   Signs in as the lecturer (the PIN secret, like marking), locks the week's top 5 by XP earned since the last class,
   writes wild/<id> and sends every other student an invite (the top 5 get a "hold your place" note). Prints counts only. */
import crypto from 'crypto';import {useProxy,signIn,list,putDoc,commitDocs,getDoc,die} from '../marking/lib.mjs';
import {course,wildWin,top5,recentTopics,when,args} from './core.mjs';
useProxy();const A=args(),C=course(),now=A.at?Date.parse(A.at):Date.now(),win=wildWin(C,now);
if(!win.open)die(`The challenge is not open now. This week's window: ${when(win.opens)} to ${when(win.closes)} (GMT+5).`);
const token=await signIn(),old=await getDoc(token,'wild/'+win.id);
if(old&&old.st&&old.st!=='plan'){console.log(`✓ ${win.id} is already open (${old.st}). Nothing to do.`);process.exit(0)}
let top=A.topics?String(A.topics).split(',').map(s=>s.trim()):old&&old.top&&old.top.length===2?old.top.map(String):(C.CRS.wildPlan||{})[win.id]||recentTopics(C,win);
top=top.map(String);if(top.length!==2||top[0]===top[1]||!top.every(k=>C.keys.includes(k)))die('Pick two different topics from: '+C.keys.join(', '));
const users=await list(token,'users'),rows=Object.entries(users).map(([id,x])=>{let u={};try{u=JSON.parse(x.u)}catch(e){}return {id,u}});
const t5=top5(rows,win),items=C.wildPick(top,C.CRS.id+'|'+win.id);if(!items.length)die('No questions found for those topics.');
let dir={};try{dir=await list(token,'directory')}catch(e){}
const all=[...new Set(Object.keys(dir).concat(rows.map(r=>r.id)))].filter(s=>s!=='S000001'&&/^S0\d{5}$/.test(s)),inT5=new Set(t5.map(r=>r.id));
console.log(`${win.id}: topics ${top.join(' and ')} · ${items.length} questions · top 5 locked: ${t5.length} · invites: ${all.length-[...inT5].filter(s=>all.includes(s)).length} · closes ${when(win.closes)}`);
if(A.dry){console.log('(dry run: nothing written)');process.exit(0)}
await putDoc(token,'wild/'+win.id,{wk:win.id,top,tl:top.map(C.label),items,t5:t5.map(r=>r.id),t5x:t5.map(r=>r.x),opens:new Date(win.opens),closes:new Date(win.closes),st:'open',by:'S000001'});
const tx=s=>inT5.has(s)?"You're in this week's top 5. Hold your place 🎁":`This week's 6th-spot challenge is open until ${when(win.closes)}. The best score wins the 6th gift 🎁`;
const notes=all.map(s=>({path:'notifs/'+crypto.randomBytes(10).toString('hex'),data:{to:s,fr:'S000001',k:inT5.has(s)?'result':'invite',ref:'wild:'+win.id,tx:tx(s),seen:false},ts:['t'],create:true}));
for(let i=0;i<notes.length;i+=200)await commitDocs(token,notes.slice(i,i+200));
console.log(`✓ Opened ${win.id} and sent ${notes.length} notifications.`);
