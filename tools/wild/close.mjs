#!/usr/bin/env node
/* After class starts: ranks the week's 6th-spot entries and writes provisional results with integrity flags (see docs/WILD.md).
     node tools/wild/close.mjs              the window that closed most recently
     node tools/wild/close.mjs --id=w2026-11-03
     node tools/wild/close.mjs --dry        print the counts only
   The lecturer still checks the top entries and confirms the winner on the live screen (#/wild/live). Prints counts and IDs only. */
import {useProxy,signIn,list,commitDocs,getDoc,die} from '../marking/lib.mjs';
import {course,wildWin,rescore,flags,rank,args} from './core.mjs';
useProxy();const A=args(),C=course(),now=A.at?Date.parse(A.at):Date.now(),cur=wildWin(C,now),id=A.id||(cur.open?wildWin(C,cur.opens-1).id:wildWin(C,cur.closes-7*864e5-1).id);
const token=await signIn(),D=await getDoc(token,'wild/'+id);if(!D||!D.items)die(id+' was never opened.');
if(Date.parse(D.closes)>now)die(id+' is still open until '+D.closes+'.');
const E=Object.entries(await list(token,'wild/'+id+'/e')).map(([sid,e])=>Object.assign({id:sid},e)),done=E.filter(e=>e.st==='done');
const R=rank(done.map(e=>Object.assign(e,{s:rescore(C,D.items,e.a).s})));const res={};
R.forEach((e,i)=>{res[e.id]={r:i+1,s:e.s,mx:e.mx|0,ms:e.ms|0,f:flags(C,D.items,e).join('; ').slice(0,80)}});
const fl=Object.values(res).filter(x=>x.f).length;
console.log(`${id}: ${E.length} started · ${done.length} finished · ${fl} flagged · provisional leader: ${R[0]?R[0].id:'none'}`);
if(A.dry){console.log('(dry run: nothing written)');process.exit(0)}
await commitDocs(token,[{path:'wild/'+id,data:{res,st:D.st==='done'?'done':'closed'},mask:['res','st']}]);
console.log('✓ Results written. Confirm the winner on the live screen (#/wild/live).');
