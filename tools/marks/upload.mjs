#!/usr/bin/env node
/* Publish each student's course marks to their own private record: reviews/{SID}.m[<key>] (only that student and the
   lecturer can read it). Input: the private JSON from tools/build-marks.py.  --dry checks without writing.
   Signs in as the lecturer with the PIN secret (never printed). The site shows the card at the top of Home (cmarks.js). */
import {useProxy,signIn,list,patchReview} from '../marking/lib.mjs';import {readFileSync} from 'fs';
const file=process.argv[2],dry=process.argv.includes('--dry');if(!file){console.error('Usage: node tools/marks/upload.mjs <marks.json> [--dry]');process.exit(1)}
const D=JSON.parse(readFileSync(file,'utf8')),ids=Object.keys(D.recs);
useProxy();const t=await signIn();const users=await list(t,'users');
const none=ids.filter(s=>!users[s]);
console.log(`${ids.length} students · key ${D.key}${none.length?` · ${none.length} have never signed in (they see it when they do): `+none.join(', '):''}`);
if(dry){console.log('Dry run: nothing written.');process.exit(0)}
const at=new Date().toISOString();let n=0;
for(const sid of ids){await patchReview(t,sid,{[D.key]:Object.assign({q:'cm',band:0,xp:0,term:D.term,at,by:'lecturer'},D.recs[sid])});n++}
console.log(`✓ Published to ${n} students. Each sees only their own card on Home.`);
