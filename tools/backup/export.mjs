#!/usr/bin/env node
/* Full class backup: every Firestore collection the lecturer can read, as one timestamped JSON file.
   node tools/backup/export.mjs [--out=<dir>]
   Signs in as the lecturer (S000001) with the PIN from the environment (see tools/marking/lib.mjs), never prints student data,
   and writes OUTSIDE the repo by default (the scratchpad backups folder, or $BACKUP_DIR). Never commit a backup: it holds personal data.
   Prints only counts per collection and the number of students, so it can be checked against the lecturer dashboard. */
import fs from 'fs';import path from 'path';import {useProxy,signIn,list,ROOT} from '../marking/lib.mjs';
useProxy();
const arg=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const course=(fs.readFileSync(path.join(ROOT,'course-config.js'),'utf8').match(/id:'(mkt\d+)'/)||[])[1]||'site';
const OUT=arg.out||process.env.BACKUP_DIR||'/tmp/claude-0/-home-user/0a7e29b4-6b73-5b93-9c5a-c9bb320c0870/scratchpad/backups';
if(path.resolve(OUT).startsWith(ROOT+path.sep)){console.error('✗ Refusing to write a backup inside the repo.');process.exit(1)}
/* top-level collections (new ones are listed here as features add them); sessions have a p/{SID} subcollection */
const COLS=['users','board','reviews','sessions','directory','announcements','reports','errors','challenges','notifs','qbank','battles','weekend'];
const token=await signIn(),data={},counts={},skipped={};
for(const c of COLS){try{data[c]=await list(token,c);counts[c]=Object.keys(data[c]).length}catch(e){skipped[c]=String(e.message).split(':')[0];delete data[c]}}
if(data.sessions)for(const id of Object.keys(data.sessions)){try{const p=await list(token,'sessions/'+id+'/p');data['sessions/'+id+'/p']=p;counts['sessions/*/p']=(counts['sessions/*/p']||0)+Object.keys(p).length}catch(e){skipped['sessions/'+id+'/p']=String(e.message).split(':')[0]}}
const students=Object.keys(data.users||{}).filter(s=>s!=='S000001').length;
const at=new Date().toISOString().replace(/[:.]/g,'-');fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const file=path.join(OUT,`${course}-${at}.json`);
fs.writeFileSync(file,JSON.stringify({course,at:new Date().toISOString(),counts,students,data},null,0),{mode:0o600});
console.log('✓ Backup written: '+file);
console.log('  students (users docs, lecturer excluded): '+students);
for(const [c,n] of Object.entries(counts))console.log('  '+c+': '+n);
if(Object.keys(skipped).length)console.log('  not readable (empty or not in the rules yet): '+Object.entries(skipped).map(([c,e])=>c+' ('+e+')').join(', '));
