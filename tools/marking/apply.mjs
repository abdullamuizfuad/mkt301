#!/usr/bin/env node
/* Step 2 of Claude marking: upload marks from tools/marking/marks.json to Firebase (reviews/{SID}).
   marks.json: [{"key":"b10_lx3k2a","sid":"S081441","q":"b10","band":5,"xp":22,"fb":"…"}]
   Usage (repo root):  node tools/marking/apply.mjs [--dry]      Needs MKT301_LECTURER_PIN. See CLAUDE.md. */
import {useProxy,signIn,patchReview,PENDING,MARKS,DONE,readJSON,writeJSON,die} from './lib.mjs';
useProxy();
const dry=process.argv.includes('--dry'),marks=readJSON(MARKS,null),pending=readJSON(PENDING,{items:[]});
if(!Array.isArray(marks))die('No marks found. Write an array of marks to '+MARKS);
const byKey=Object.fromEntries(pending.items.map(i=>[i.key,i])),errors=[],ok=[];
for(const m of marks){const p=byKey[m.key],why=[];
  if(/^note_/.test(String(m.key)))why.push('note_ keys are lecturer messages, not marks');
  if(!p)why.push('not in pending.json (run fetch.mjs again?)');else{if(p.sid!==m.sid)why.push('sid does not match');if(p.q!==m.q)why.push('question does not match')}
  if(!Number.isInteger(m.band)||m.band<0||m.band>6)why.push('band must be a whole number 0–6');
  if(!Number.isInteger(m.xp)||m.xp<0||m.xp>30)why.push('xp must be a whole number 0–30');
  if(typeof m.fb!=='string'||!m.fb.trim()||m.fb.length>600)why.push('fb must be 1–600 characters');
  if(/\b(exams?|examination|examiners?|resits?|final paper)\b/i.test(m.fb||''))why.push('feedback must not mention exams');
  (why.length?errors:ok).push(why.length?`${m.key}: ${why.join('; ')}`:m)}
if(errors.length){console.error('✗ Fix these marks first:\n  '+errors.join('\n  '));process.exit(1)}
if(dry){console.log(`✓ ${ok.length} mark(s) are valid (dry run, nothing uploaded).`);process.exit(0)}
const token=await signIn(),at=new Date().toISOString(),by={};
ok.forEach(m=>{(by[m.sid]=by[m.sid]||{})[m.key]={q:m.q,band:m.band,xp:m.xp,fb:m.fb.trim(),at,by:'claude'}});
let n=0;for(const [sid,entries] of Object.entries(by)){try{await patchReview(token,sid,entries);n+=Object.keys(entries).length}catch(e){die(`Upload failed for ${sid} after ${n} mark(s): ${e.message}`)}}
const done=new Set(ok.map(m=>m.key));writeJSON(PENDING,Object.assign(pending,{items:pending.items.filter(i=>!done.has(i.key)),count:pending.items.length-done.size}));
const log=readJSON(DONE,[]);writeJSON(DONE,log.concat(ok.map(m=>({key:m.key,sid:m.sid,q:m.q,band:m.band,xp:m.xp,at}))));writeJSON(MARKS,[]);
const avg=ok.reduce((t,m)=>t+m.band,0)/(ok.length||1);
console.log(`✓ Uploaded ${n} mark(s) for ${Object.keys(by).length} student(s). Average band ${avg.toFixed(1)}/6. Students see them straight away.`);
