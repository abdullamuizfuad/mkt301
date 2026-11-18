#!/usr/bin/env node
/* Prepare a live-session discussion (see CLAUDE.md "Discussion notes").
   node tools/discuss/prep.mjs [sessionId]   → tools/discuss/session.json (git-ignored): what the class answered during the session,
   grouped like the Discussion panel (engine/discuss.js), with the same "Student A, B…" letters (ordered by first answer in the session).
   Signs in as the lecturer with the PIN secret (never printed). With no id, the most recently started session. */
import {useProxy,signIn,list,bank} from '../marking/lib.mjs';
import {readFileSync,writeFileSync,existsSync} from 'fs';import path from 'path';import vm from 'vm';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../..');
useProxy();const token=await signIn();
const [users,reviews,sessions]=await Promise.all([list(token,'users'),list(token,'reviews'),list(token,'sessions')]);
const ms=v=>v==null?0:typeof v==='number'?v:Date.parse(v)||0;
const ss=Object.entries(sessions).map(([id,s])=>Object.assign({id},s,{startedAt:ms(s.startedAt),endedAt:ms(s.endedAt)||null})).sort((a,b)=>b.startedAt-a.startedAt);
const S=process.argv[2]?ss.find(s=>s.id===process.argv[2]):ss[0];if(!S){console.error('✗ No session found');process.exit(1)}
const a0=S.startedAt||0,b0=S.endedAt||Date.now();
/* Boardroom arguments, for verdict ids v:<case>:<i> */
let CASESX=[];try{const ctx={};vm.createContext(ctx);const f=existsSync(path.join(ROOT,'case-extend.js'))?['cases-data.js','case-extend.js']:['cases.js','case-cbtl.js','case-tuna.js'];
  CASESX=vm.runInContext(f.filter(x=>existsSync(path.join(ROOT,x))).map(x=>readFileSync(path.join(ROOT,x),'utf8')).join('\n')+';typeof CASEL!=="undefined"?CASEL:CASES',ctx)}catch(e){}
const Q=bank(),L={strong:'Strong',mixed:'Partly right',weak:'Weak'};
const W={},C={},first=[];
for(const [sid,doc] of Object.entries(users)){if(sid==='S000001'||sid==='S000000')continue;let u;try{u=JSON.parse(doc.u||'{}')}catch(e){continue}let t0=Infinity;
  for(const [key,a] of Object.entries(u.ans||{})){const t=Date.parse(a&&a.at);if(!a||!a.q||!(t>=a0&&t<=b0))continue;t0=Math.min(t0,t);const e=Q[a.q],r=((reviews[sid]||{}).m||{})[key];
    const q=W[a.q]||(W[a.q]={id:a.q,area:e?e.area:'Written answers',question:e?e.q.q:a.q,keyIdeas:e?e.q.chips.filter(c=>c.g).map(c=>c.t):[],commonMistakes:e?e.q.chips.filter(c=>!c.g).map(c=>c.t):[],answers:[]});
    q.answers.push({sid,key,text:a.t,words:a.w,band:r?r.band:null,autoBand:a.b})}
  const seen={};for(const [s,id,ok,p] of (u.qa||[])){const t=s*1000;if(!(t>=a0&&t<=b0)||seen[id])continue;seen[id]=1;t0=Math.min(t0,t);
    const m=/^v:([^:]+):(\d+)$/.exec(id),c=m&&CASESX.find(x=>x.id===m[1]),arg=c&&c.boardroom&&c.boardroom[+m[2]];
    const q=C[id]||(C[id]={id,question:arg?arg.who+': '+arg.say:id,area:arg?(c.short||c.id)+' Boardroom: '+arg.topic:'quick questions',correct:arg?L[arg.v]:null,why:arg?arg.why:null,n:0,right:0,picks:{}});
    q.n++;if(ok>=.5)q.right++;const k=arg?(L[p]||p):String(p);q.picks[k]=(q.picks[k]|0)+1}
  if(t0<Infinity)first.push([t0,sid])}
const letter={};first.sort((a,b)=>a[0]-b[0]).forEach(([t,sid],i)=>{let s='',n=i+1;while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}letter[sid]='Student '+s});
Object.values(W).forEach(q=>q.answers.forEach(a=>{a.student=letter[a.sid]}));
const out={session:{id:S.id,name:S.name,startedAt:new Date(a0).toISOString(),endedAt:S.endedAt?new Date(S.endedAt).toISOString():null},students:first.length,
  written:Object.values(W).sort((a,b)=>b.answers.length-a.answers.length),choices:Object.values(C).map(q=>Object.assign(q,{pctRight:Math.round(q.right/q.n*100)})).sort((a,b)=>a.pctRight-b.pctRight)};
writeFileSync(path.join(HERE,'session.json'),JSON.stringify(out,null,1));
console.log(`✓ ${S.name} (${S.id}): ${first.length} students, ${out.written.reduce((t,q)=>t+q.answers.length,0)} written answers on ${out.written.length} questions, ${out.choices.length} choice questions. Saved to tools/discuss/session.json`);
