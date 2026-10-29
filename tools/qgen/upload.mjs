#!/usr/bin/env node
/* Upload Claude's draft practice questions for the lecturer to review in the Question editor (Lecturer tab).
   node tools/qgen/upload.mjs [file] [--dry]     (default file: tools/qgen/drafts.json, git-ignored)
   The file is a list: [{"kind":"short","data":{...}}, ...] with the same fields as the editor's templates (see docs/QGEN.md).
   Every item is checked first; nothing goes live until the lecturer presses Publish. Signs in as the lecturer (the marking PIN secret). */
import path from 'path';import {useProxy,signIn,putDoc,readJSON,HERE,die,list} from '../marking/lib.mjs';
useProxy();
const DRY=process.argv.includes('--dry'),file=process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(HERE,'..','qgen','drafts.json');
const items=readJSON(path.resolve(file),null);if(!Array.isArray(items)||!items.length)die('No drafts in '+file);
const bad=/\bexams?\b|\bmidterms?\b|\bresits?\b/i,errs=[];
items.forEach((x,i)=>{const d=x&&x.data;if(!x||!['short','mcq'].includes(x.kind)||!d)return errs.push(i+': kind must be short or mcq, with data');
  if(typeof d.q!=='string'||d.q.length<10)errs.push(i+': no question text');if(bad.test(JSON.stringify(d)))errs.push(i+': mentions exams, midterms or resits');
  if(x.kind==='mcq'&&(!Array.isArray(d.o)||d.o.length!==4||!d.why))errs.push(i+': an MCQ needs 4 options (correct first) and why');
  if(x.kind==='short'&&(!Array.isArray(d.chips)||d.chips.filter(c=>c.g).length<3||!d.chips.some(c=>!c.g&&c.why)))errs.push(i+': a short answer needs 3+ key ideas and a decoy with why')});
if(errs.length)die('Fix these first:\n  '+errs.join('\n  '));
if(DRY){console.log(`${items.length} draft(s) look fine.`);process.exit(0)}
const token=await signIn(),have=await list(token,'qbank');let n=0;
for(const x of items){const id=x.data.id&&/^[A-Za-z0-9_-]{1,40}$/.test(x.data.id)?x.data.id:'g'+Date.now().toString(36)+n;if(have[id]&&have[id].st!=='draft'){console.log('skipped '+id+' (already live or hidden)');continue}
  x.data.id=id;await putDoc(token,'qbank/'+id,{kind:x.kind,data:JSON.stringify(x.data),st:'draft',by:'claude',t:new Date(),note:String(x.note||'Drafted by Claude').slice(0,200)});n++}
console.log(`Uploaded ${n} draft(s). The lecturer reviews them on the Lecturer tab → Question editor → Drafts.`);
