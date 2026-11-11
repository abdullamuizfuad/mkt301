#!/usr/bin/env node
/* Works out the class figures for the fun features and writes them to meta/agg (see docs/AGG.md):
   the class goal (answers this week), most improved last week and topic territories, with engine/agg.js (the same code the
   Lecturer tab's "Work out the figures now" button runs).
     node tools/agg/run.mjs          work them out and write meta/agg
     node tools/agg/run.mjs --dry    work them out and print the counts, write nothing
   Signs in as the lecturer (the PIN secret, like marking) and prints counts only, never names or IDs. */
import {createRequire} from 'module';import {readFileSync} from 'fs';import path from 'path';import {useProxy,signIn,list,putDoc,ROOT} from '../marking/lib.mjs';
const require=createRequire(import.meta.url),{aggCompute,aggSessGroups}=require(path.join(ROOT,'engine/agg.js'));
const dry=process.argv.includes('--dry');useProxy();
const cfg=readFileSync(path.join(ROOT,'course-config.js'),'utf8'),goalDef=+((/fun:\{[^}]*goal:(\d+)/.exec(cfg)||[])[1]||1500);
const token=await signIn(),[users,dir,meta,sessions]=await Promise.all([list(token,'users'),list(token,'directory'),list(token,'meta'),list(token,'sessions')]);
const secLabel=g=>String(g||'').trim().replace(/^[A-Za-z]{2,6}\d{2,4}_/,'').replace(/\s+course$/i,'').trim();
let groups={};for(const [id,d] of Object.entries(dir))if(d.g)groups[id]=secLabel(d.g);
if(!Object.keys(groups).length){const ss=[];for(const [id,s] of Object.entries(sessions)){const p=await list(token,'sessions/'+id+'/p');ss.push({name:s.name,grp:s.grp,startedAt:Date.parse(s.startedAt)||0,p:Object.keys(p)})}groups=aggSessGroups(ss)}
const U=Object.entries(users).filter(([id])=>id!=='S000001').map(([id,d])=>{let u={};try{u=JSON.parse(d.u)}catch(e){}return {id,n:(dir[id]||{}).n||u.dn||'',u}});
const A=aggCompute(U,groups,{target:(meta.goal&&meta.goal.target)||goalDef});
console.log(`✓ Week of ${A.wk}: class goal ${A.goal.n}/${A.goal.target}${A.goal.done?' (reached)':''} · most improved: ${A.imp.top.length} student(s) · territories: ${Object.keys(A.terr).length} topic(s), ${A.teams.length} team(s) · ${U.length} students`);
if(dry){console.log('(dry run: nothing written)');process.exit(0)}
await putDoc(token,'meta/agg',A);console.log('✓ meta/agg written');
/* Guest preview board (engine/guest.js): the whole class without names, usernames, avatars or IDs. Needs the `public` rules block;
   until it is published the write is refused and the class figures above are still written. */
try{const board=await list(token,'board'),num=v=>Number.isFinite(+v)?Math.max(0,Math.round(+v)):0;
  const rows=Object.entries(board).filter(([id])=>id!=='S000001'&&id!=='S000000').map(([,r])=>{const t=Date.parse(r.t||'');return {x:num(r.x),l:num(r.l),b:num(r.b),s:num(r.s),w:num(r.w),wk:String(r.wk||''),t:Number.isFinite(t)?t:0}})
    .sort((a,b)=>b.x-a.x);
  await putDoc(token,'public/board',{at:new Date().toISOString(),rows});console.log(`✓ public/board written (${rows.length} anonymous rows)`)}
catch(e){console.log('… public/board not written: '+e.message+' (publish the rules with the public block)')}
