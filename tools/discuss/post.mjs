#!/usr/bin/env node
/* Put Claude's discussion notes into the lecturer's Discussion panel (engine/discuss.js):
   node tools/discuss/post.mjs <sessionId> tools/discuss/notes.md
   Writes reviews/S000001.m['disc_<sessionId>'] = {q:'disc', fb, at, by:'claude'}. Only the lecturer can read that document, so students
   never see it and no new rules are needed. Notes: plain text, "## " headings, "- " bullets, **bold**. Students by letter only, never names. */
import {useProxy,signIn,patchReview} from '../marking/lib.mjs';import {readFileSync} from 'fs';
const [,,id,file]=process.argv;if(!id||!file){console.error('Usage: node tools/discuss/post.mjs <sessionId> <notes.md>');process.exit(1)}
const fb=readFileSync(file,'utf8').trim();if(!fb){console.error('✗ The notes file is empty');process.exit(1)}
if(/\bS0\d{5}\b/.test(fb)){console.error('✗ The notes contain a student ID: use the Student letters instead');process.exit(1)}
useProxy();const t=await signIn();await patchReview(t,'S000001',{['disc_'+id]:{q:'disc',fb:fb.slice(0,20000),at:new Date().toISOString(),by:'claude'}});
console.log('✓ Discussion notes are in the panel for session '+id+' (press ↻ Refresh on the Discussion page)');
