#!/usr/bin/env node
/* Phone notifications: send each student's unread notifications (challenge invites and results) as a Web Push message.
   Run by the lecturer (or a Claude task the lecturer starts):  node tools/push/send.mjs [--dry]
   Needs: the lecturer PIN secret (as for marking) and MKT_PUSH_PRIVATE (the private VAPID key, an environment secret: never commit it).
   The public key goes in cloud-config.js (PUSH_KEY), with PUSH_ON=true. See docs/PUSH.md.
   Sends at most one message per student per run (a summary), and only for notifications it has not sent before
   (tools/push/sent.json, git-ignored). Prints counts only, never names or messages. */
import fs from 'fs';import path from 'path';import {useProxy,signIn,list,val,ROOT,HERE,readJSON,writeJSON,die} from '../marking/lib.mjs';
useProxy();
const DRY=process.argv.includes('--dry'),PRIV=process.env.MKT_PUSH_PRIVATE;
const cfg=fs.readFileSync(path.join(ROOT,'cloud-config.js'),'utf8'),PUB=(cfg.match(/PUSH_KEY\s*=\s*'([^']*)'/)||[])[1]||'';
if(!/PUSH_ON\s*=\s*true/.test(cfg)||!PUB)die('Phone notifications are off: set PUSH_ON=true and PUSH_KEY in cloud-config.js (docs/PUSH.md).');
if(!PRIV&&!DRY)die('MKT_PUSH_PRIVATE is not set. Add it as an environment secret (docs/PUSH.md).');
let webpush;try{webpush=(await import('web-push')).default}catch(e){die('Install the sender first: npm i --no-save web-push')}
const SITE=(cfg.match(/PUSH_SITE\s*=\s*'([^']*)'/)||[])[1]||'./';
const token=await signIn(),notes=await list(token,'notifs'),subs=await list(token,'push');
const SENT=path.join(HERE,'sent.json'),sent=readJSON(SENT,{});
const by={};for(const [id,f] of Object.entries(notes)){const to=val(f.to);if(val(f.seen)||sent[id]||!subs[to])continue;(by[to]=by[to]||[]).push({id,tx:val(f.tx)||'',ref:val(f.ref)||''})}
if(!DRY)webpush.setVapidDetails('mailto:noreply@student.mnu.edu.mv',PUB,PRIV);
let ok=0,gone=0,fail=0;
for(const [sid,list] of Object.entries(by)){const one=list.length===1,msg={title:one?'MKT Arena':list.length+' new notifications',body:one?list[0].tx:'Challenges are waiting for you',url:SITE+(one&&list[0].ref?'#/challenge/'+list[0].ref:'#/notifs'),tag:'notifs'};
  if(DRY){ok++;continue}
  try{await webpush.sendNotification(JSON.parse(val(subs[sid].s)),JSON.stringify(msg),{TTL:86400});ok++;list.forEach(n=>sent[n.id]=Date.now())}
  catch(e){if(e.statusCode===404||e.statusCode===410){gone++;list.forEach(n=>sent[n.id]=Date.now())}else fail++}}
if(!DRY){for(const k of Object.keys(sent))if(Date.now()-sent[k]>30*864e5)delete sent[k];writeJSON(SENT,sent)}
console.log(`${DRY?'Would send':'Sent'} ${ok} message${ok===1?'':'s'}${gone?`, ${gone} expired subscription${gone===1?'':'s'} skipped`:''}${fail?`, ${fail} failed`:''}.`);
