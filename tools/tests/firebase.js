#!/usr/bin/env node
/* MKT301 Arena cloud tests: PIN accounts, sync, live leaderboard and lecturer dashboard against the Firebase emulators.
   Don't run directly: use  node tools/tests/firebase-run.js  (starts the emulators first).  Options: --only=<group> --shots=<dir> */
const path=require('path'),{spawn}=require('child_process');
let chromium;try{({chromium}=require('playwright'))}catch(e){console.error('Playwright is not installed.');process.exit(2)}
const ROOT=process.env.MKT301_ROOT||path.resolve(__dirname,'../..'),PORT=8900+Math.floor(Math.random()*90),URL0=`http://localhost:${PORT}/?emu=1`;
const ARGS=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')).map(([k,v])=>[k,v??true]));
const EMU='http://127.0.0.1:9099/emulator/v1/projects/demo-mkt301',FS='http://127.0.0.1:8085/v1/projects/demo-mkt301/databases/(default)/documents';
const A='S081441',B='S085542',L='S000001',C='S082110',PIN='482913',PINB='730516',PINL='905127',PINC='371946';
const fs=require('fs'),os=require('os'),{spawnSync}=require('child_process');
let browser,fails=0,passes=0;const R2=process.env.RULES2==='1';const ok=(c,m)=>{if(!c)throw new Error(m)};
const shot=async(p,name,full)=>{if(ARGS.shots)await p.screenshot({path:path.join(ARGS.shots,name+'.png'),fullPage:!!full})};

async function page(o={}){const ctx=await browser.newContext({viewport:{width:o.w||390,height:o.h||844}});
  if(o.theme)await ctx.addInitScript(t=>localStorage.setItem('mkt301_theme',JSON.stringify(t)),o.theme);
  await ctx.addInitScript(()=>{window.__presNoBreak=1});
  const p=await ctx.newPage();p.errs=[];p.allow=o.allow||null;
  p.on('pageerror',e=>{if(!(p.allow&&p.allow.test(e.message)))p.errs.push('pageerror: '+e.message)});
  p.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/mailto|favicon|fonts\.g/.test(t)&&!(p.allow&&p.allow.test(t)))p.errs.push('console: '+t)});
  p.on('dialog',d=>d.accept());if(o.block)await p.route('**/vendor/firebase.js',r=>r.abort());
  await p.goto(URL0);await p.waitForTimeout(300);
  p.go=async h=>{await p.evaluate(h=>{location.hash=h},h);await p.waitForTimeout(400)};
  p.done=async()=>{const w=await p.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);ok(w[0]<=w[1],`horizontal scroll ${w[0]}>${w[1]}`);ok(!p.errs.length,p.errs.join('\n'));await ctx.close()};
  return p}
/* sign-in screen → PIN step */
async function toPin(p,sid,name){await p.fill('#nm',name||'Test Student');await p.type('#sid',sid.slice(1));await p.waitForTimeout(300);await p.click('#go');await p.waitForSelector('#pin')}
async function createPin(p,sid,pin,name){await toPin(p,sid,name);await p.click('[data-pm="new"]');await p.fill('#pin',pin);await p.fill('#pin2',pin);await p.click('#pgo');await synced(p)}
async function signIn(p,sid,pin,name){await toPin(p,sid,name);await p.fill('#pin',pin);await p.click('#pgo');await synced(p)}
async function synced(p,t=12000){const t0=Date.now();await p.waitForTimeout(300);
  while(Date.now()-t0<t){if(await p.evaluate(()=>typeof ME!=='undefined'&&ME&&ME.cloud&&CLOUD.state==='synced'))return;await p.waitForTimeout(200)}
  throw new Error('not synced (state '+await p.evaluate(()=>CLOUD.state)+')')}
const tourOff=p=>p.evaluate(()=>{if(U&&(!U.tour||!U.inst)){U.tour=1;U.inst=U.inst||1;save()}document.querySelector('.modal')?.remove()});
const fsDoc=async(col,id)=>{const r=await fetch(`${FS}/${col}/${id}`,{headers:{Authorization:'Bearer owner'}});return r.ok?(await r.json()).fields:null};
const int=f=>f?+(f.integerValue??f.doubleValue):null;
const enc=x=>typeof x==='string'?{stringValue:x}:Number.isInteger(x)?{integerValue:String(x)}:typeof x==='number'?{doubleValue:x}:typeof x==='boolean'?{booleanValue:x}:x instanceof Date?{timestampValue:x.toISOString()}:x==null?{nullValue:null}:{mapValue:{fields:Object.fromEntries(Object.entries(x).map(([k,v])=>[k,enc(v)]))}};
const fsPut=async(col,id,o)=>{const r=await fetch(`${FS}/${col}/${id}`,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,enc(v)]))})});if(!r.ok)throw new Error('fsPut '+r.status)};

const T={
async create(){const p=await page();await shot(p,'fb-gate');await toPin(p,A);await shot(p,'fb-pin');
  await p.click('[data-pm="new"]');await p.fill('#pin','123');await p.fill('#pin2','123');await p.click('#pgo');ok((await p.textContent('#per')).includes('6 digits'),'short PIN accepted');
  await p.fill('#pin','111111');await p.fill('#pin2','111111');await p.click('#pgo');ok((await p.textContent('#per')).includes('easy'),'trivial PIN accepted');
  await p.fill('#pin',PIN);await p.fill('#pin2','000000');await p.click('#pgo');ok((await p.textContent('#per')).includes("match"),'mismatch accepted');
  await p.fill('#pin2',PIN);await p.click('#pgo');await synced(p);await tourOff(p);
  ok(await p.evaluate(()=>ME.cloud&&CLOUD.user&&CLOUD.user.email==='s081441@student.mnu.edu.mv'),'not signed in to the account');
  await p.go('#/case/iceto/read');await p.click('[data-r]');await p.waitForTimeout(2600);await synced(p);
  const d=await fsDoc('users',A);ok(d&&int(d.xp)===15,'users doc not saved (xp '+(d&&int(d.xp))+')');
  const b=R2?await waitDoc('board',A,b=>int(b.x)===15,20000):await fsDoc('board',A);ok(b&&int(b.x)===15&&b.n.stringValue===(R2?'':'Test S.'),'board row not saved');
  await p.reload();await p.waitForTimeout(1500);ok(await p.evaluate(()=>ME&&ME.sid==='S081441'&&U.xp===15),'not signed in after reload');await p.done()},

async secondDevice(){const p=await page({w:1280,h:800});await signIn(p,A,PIN);await p.waitForTimeout(400);
  ok(await p.evaluate(()=>U.xp===15&&!!U.log['read:iceto:origins']),'progress not loaded on the second device');await p.done()},

async anyChars(){const p=await page({allow:/400|Failed to load resource|identitytoolkit/});await p.evaluate(async()=>{await CLOUD.create('S085651','Pass-word9');await CLOUD.signOut()});
  await toPin(p,'S085651','Letters Pin');await p.click('#abc');ok(await p.evaluate(()=>document.querySelector('#pin').inputMode==='text'),'letters toggle did not switch the keyboard');
  await p.fill('#pin','Pass-word9');await p.click('#pgo');await synced(p);ok(await p.evaluate(()=>ME.sid==='S085651'),'sign-in rejected a non-digit password');await p.done()},

async wrongPin(){const p=await page({allow:/400|Failed to load resource|identitytoolkit/});await toPin(p,A);await p.fill('#pin','999999');await p.click('#pgo');await p.waitForTimeout(1200);
  ok((await p.textContent('#per')).includes("doesn't match"),'wrong PIN message missing: '+await p.textContent('#per'));
  await p.click('[data-pm="new"]');await p.fill('#pin','246813');await p.fill('#pin2','246813');await p.click('#pgo');await p.waitForTimeout(1200);
  ok((await p.textContent('#per')).includes('already has a PIN'),'existing-account message missing');await p.done()},

async forgot(){const p=await page();await toPin(p,A);await p.click('#fgt');await p.waitForTimeout(1200);ok((await p.textContent('#per')).includes('s081441@student.mnu.edu.mv'),'reset message missing');
  const codes=await (await fetch(EMU+'/oobCodes')).json();ok((codes.oobCodes||[]).some(c=>c.email==='s081441@student.mnu.edu.mv'&&c.requestType==='PASSWORD_RESET'),'no reset email sent');await p.done()},

async liveBoard(){const a=await page({w:1280,h:800});await signIn(a,A,PIN);await tourOff(a);await a.go('#/board');await a.waitForTimeout(800);
  ok((await a.textContent('#lbl')).includes(R2?'S081441':'Test S.'),'own row missing');ok(await a.$('#lbl .r.me'),'own row not highlighted');
  const b=await page();await createPin(b,B,PINB,'Mariyam Ali');await tourOff(b);await b.go('#/case/cbtl/read');await b.click('[data-r]');await b.waitForTimeout(100);
  const rows=b.locator('[data-r]');await rows.first().click();await b.waitForTimeout(2600);await synced(b);
  await a.waitForTimeout(800);ok((await a.textContent('#lbl')).includes(R2?'S085542':'Mariyam A.'),'live board did not show the other student');await shot(a,'fb-board');
  await b.go('#/board');await b.waitForTimeout(400);ok(!await b.$('#hd')&&!await b.$('#nk'),'nickname or Hidden player option still offered');await a.done();await b.done()},

async restartSync(){const p=await page();await signIn(p,A,PIN);await tourOff(p);await p.go('#/short');
  const q=p.locator('.qcard').first();await q.locator('.chip').nth(0).click();await q.locator('[data-a="check"]').click();await p.waitForTimeout(2600);await synced(p);
  const xp=async()=>int((await fsDoc('users',A)).xp),bx=async want=>int((await waitDoc('board',A,b=>want==null||int(b.x)===want,want==null?1:25000)||await fsDoc('board',A)).x);
  const x1=await bx(R2?await xp():null);await q.locator('[data-a="restart"]').click();await p.waitForTimeout(2600);await synced(p);
  const x2=await bx(R2?x1-15:null);ok(x2===x1-15,`restart not synced to the board (${x1} → ${x2})`);
  await p.evaluate(()=>{U.xp=9000;save()});await p.waitForTimeout(2600);await synced(p,20000);ok(R2?int((await fsDoc('board',A)).x)<9000:int((await fsDoc('board',A)).x)===9000,R2?'board followed a 9,000 XP jump at once':'big XP jump did not reach the board in steps');
  await p.evaluate(()=>{U.xp-=8985;save()});await p.waitForTimeout(2600);await synced(p);await p.done()},

async lecturer(){const p=await page({w:1280,h:900});await createPin(p,L,PINL,'Abdulla Muiz Fuad');await tourOff(p);await p.go('#/lecturer');await p.waitForTimeout(1200);
  const t=await p.textContent('#cdb');ok(t.includes('S081441')&&t.includes('S085542')&&t.includes('Mariyam Ali'),'dashboard missing students');ok(/(^|\D)3\/32/.test(t),'signed-up count wrong');
  ok(!await p.$('#cdb tr td:nth-child(3):text("S000001")'),'lecturer listed as a student');
  const rowsBefore=await p.$$eval('#cdb tr[data-sid]',r=>r.length);await p.click('[data-win="30"]');await p.waitForTimeout(300);
  ok(await p.$eval('[data-win="30"]',b=>b.classList.contains('sel')),'30-minute filter not selected');
  ok(await p.$eval('#cdb th[data-sk="ts"]',h=>h.getAttribute('aria-sort'))==='descending','30-minute filter should sort by most recently active');
  ok(await p.$$eval('#cdb tr[data-sid]',r=>r.length)===rowsBefore,'students active just now should all be listed');
  ok(/active in last 30 min/.test(await p.textContent('#cdb')),'30-minute count missing');
  await p.click('[data-win="all"]');await p.waitForTimeout(300);ok(await p.$eval('#cdb th[data-sk="xp"]',h=>h.getAttribute('aria-sort'))==='descending','All should sort by XP again');await shot(p,'fb-dashboard',true);
  ok(!(await fsDoc('board',L)),'lecturer has a board row');await p.done();
  const s=await page();await signIn(s,B,PINB);await tourOff(s);await s.go('#/lecturer');ok(!await s.$('#cdash'),'student sees the dashboard');
  /* ask the server directly with the student's own sign-in token: listing everyone's progress must be refused */
  const tok=await s.evaluate(()=>CLOUD.user.getIdToken());const r=await fetch(FS+'/users',{headers:{Authorization:'Bearer '+tok}});ok(r.status===403,'student could list all users: HTTP '+r.status);
  const own=await fetch(FS+'/users/'+B,{headers:{Authorization:'Bearer '+tok}});ok(own.status===200,'student cannot read own progress: HTTP '+own.status);
  const other=await fetch(FS+'/users/'+A,{headers:{Authorization:'Bearer '+tok}});ok(other.status===403,'student could read a classmate: HTTP '+other.status);await s.done()},

async rosterBlocked(){const p=await page({allow:/permission|PERMISSION|Failed to load resource|400|403/});await p.fill('#nm','Outsider');await p.type('#sid','099999');await p.waitForTimeout(300);
  ok((await p.textContent('#mst')).includes('Not found')&&await p.$eval('#go',b=>b.disabled),'unlisted ID could continue');
  const st=await p.evaluate(async()=>{await CLOUD.create('S099999','135792');CLOUD.ready('S099999',()=>({sid:'S099999',name:'x',U:{xp:1},row:{n:'x',x:1,l:0,b:0,s:0}}));await CLOUD.flush();return CLOUD.state});
  ok(st==='error','rules let an unlisted account save ('+st+')');ok(!(await fsDoc('users','S099999')),'unlisted users doc written');await p.done()},

async fallback(){const p=await page({block:true,allow:/Failed to load resource|ERR_FAILED/});ok(await p.evaluate(()=>!CLOUD.ok),'cloud should be off');
  ok((await p.textContent('#go')).includes('Verify and start'),'device-only sign-in not offered');await p.fill('#nm','Test Student');await p.type('#sid','081441');await p.waitForTimeout(300);await p.click('#go');await p.waitForTimeout(500);
  ok(await p.evaluate(()=>ME&&!ME.cloud),'device-only sign-in failed');await p.done()},

async layout(){for(const w of [390,1280])for(const theme of ['dark','light']){const p=await page({w,h:900,theme});await toPin(p,A);
    ok(await p.evaluate(t=>document.documentElement.dataset.theme===t,theme),'theme');if(w===390&&theme==='light')await shot(p,'fb-pin-light');
    await p.fill('#pin',PIN);await p.click('#pgo');await synced(p);await tourOff(p);
    for(const h of ['#/','#/board','#/badges']){await p.go(h);const sw=await p.evaluate(()=>document.documentElement.scrollWidth);ok(sw<=w,`${h} ${w}px ${theme}: ${sw}`)}
    await p.click('#svb');ok((await p.textContent('.modal')).includes('Saved to your account'),'sync status missing in the Save popup');if(w===390&&theme==='dark')await shot(p,'fb-save');
    await p.keyboard.press('Escape');await p.click('#so');await p.waitForTimeout(800);ok(await p.$('#sid'),'sign out did not return to sign-in');ok(await p.evaluate(()=>!CLOUD.user),'still signed in to the account');await p.done()}}
,

async resetLink(){for(const theme of ['dark','light']){const p=await page({theme,allow:/400|Failed to load resource|identitytoolkit/});await toPin(p,A);await p.click('#fgt');await p.waitForTimeout(1200);
    const codes=(await (await fetch(EMU+'/oobCodes')).json()).oobCodes.filter(c=>c.email==='s081441@student.mnu.edu.mv'&&c.requestType==='PASSWORD_RESET');const code=codes[codes.length-1].oobCode;
    await p.goto(URL0+'&mode=resetPassword&oobCode='+encodeURIComponent(code));await p.waitForSelector('#np');ok((await p.textContent('#act')).includes('S081441'),'reset screen does not name the student');
    await shot(p,'fb-reset-'+theme);
    await p.fill('#np','abc123');await p.fill('#np2','abc123');await p.click('#rgo');ok((await p.textContent('#rer')).includes('6 digits'),'non-digit PIN accepted on reset');
    const np=theme==='dark'?'615243':PIN;await p.fill('#np',np);await p.fill('#np2','000000');await p.click('#rgo');ok((await p.textContent('#rer')).includes("match"),'mismatch accepted');
    await p.fill('#np2',np);await p.click('#rgo');await p.waitForSelector('#sid');await p.waitForTimeout(500);
    ok((await p.textContent('#gmsg')).includes('PIN has been changed'),'no success message');ok(await p.inputValue('#sid')==='081441'&&(await p.textContent('#mst')).includes('Verified'),'ID not prefilled');
    ok(!/oobCode/.test(await p.evaluate(()=>location.search)),'link code left in the address bar');
    await p.fill('#nm','Test Student');await p.click('#go');await p.waitForSelector('#pin');await p.fill('#pin',np);await p.click('#pgo');await synced(p);
    await p.goto(URL0+'&mode=resetPassword&oobCode='+encodeURIComponent(code));await p.waitForTimeout(1200);ok((await p.textContent('#act')).includes('expired or has already been used'),'reused link not rejected');
    await p.goto(URL0+'&mode=verifyEmail&oobCode=nonsense');await p.waitForTimeout(1200);ok((await p.textContent('#act')).includes("didn't work"),'bad verify link not handled');
    await p.click('#ab');ok(await p.$('#sid'),'no way back to sign-in');await p.done()}},

/* typed answer → Claude marking scripts (fetch → marks.json → apply) → the student sees the mark live; lecturer override; rules */
async marking(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mkt301-mark-'));
  const run=(f,pin,args=[])=>spawnSync(process.execPath,[path.join(ROOT,'tools/marking',f)].concat(args),{encoding:'utf8',
    env:Object.assign({},process.env,{MKT301_EMU:'1',MKT301_LECTURER_PIN:pin,MKT301_MARK_DIR:dir})});
  await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'s000001@student.mnu.edu.mv',password:PINL})});
  const c=await page();await createPin(c,C,PINC,'Shifa Test');await tourOff(c);await c.go('#/short');
  const id=(await c.locator('.qcard').getAttribute('id')).slice(2);
  const info=await c.evaluate(id=>{const q=BANK_B.find(x=>x.id===id);return {good:q.chips.map((x,i)=>x.g?i:-1).filter(i=>i>=0),text:'This means '+q.chips.filter(x=>x.g).map(x=>x.t).join('. ')+'. For example, a firm can test this first. However, there is a risk. Overall I recommend this approach.'}},id);
  for(const j of info.good)await c.click(`.qcard .chip[data-j="${j}"]`);await c.click('[data-a="check"]');await c.click('[data-a="rtyped"]');
  await c.locator('.qcard textarea').click();const w=info.text.split(' ');for(let i=0;i<w.length;i+=8)await c.keyboard.insertText(w.slice(i,i+8).join(' ')+' ');
  await c.evaluate(id=>{U.plansSaved[id].act=1e6},id);await c.click('[data-a="tdone"]');await c.click('[data-a="tfin"]');await c.waitForTimeout(2600);await synced(c);
  const ud=await fsDoc('users',C);ok(ud&&JSON.parse(ud.u.stringValue).ans,'typed answer not saved for marking');
  let r=run('fetch.mjs','000000');ok(r.status!==0&&/sign-in failed/i.test(r.stderr),'wrong lecturer PIN accepted: '+r.stderr);
  r=run('fetch.mjs',PINL);ok(r.status===0,'fetch failed: '+r.stderr+r.stdout);ok(!/905127/.test(r.stdout+r.stderr),'PIN printed');
  const pend=JSON.parse(fs.readFileSync(path.join(dir,'pending.json'),'utf8')),it=pend.items.find(x=>x.sid===C);
  ok(it&&it.q===id&&it.answer.includes('For example')&&it.keyIdeas.length===info.good.length&&it.rubric.length===7,'pending item incomplete: '+JSON.stringify(it).slice(0,200));
  fs.writeFileSync(path.join(dir,'marks.json'),JSON.stringify([{key:it.key,sid:C,q:id,band:9,xp:22,fb:'x'}]));r=run('apply.mjs',PINL,['--dry']);ok(r.status!==0&&/band/.test(r.stderr),'invalid mark accepted');
  const x0=await c.evaluate(()=>U.xp);
  fs.writeFileSync(path.join(dir,'marks.json'),JSON.stringify([{key:it.key,sid:C,q:id,band:5,xp:22,fb:'You covered every key idea clearly. Add one specific example from a real firm. Next time, finish with a firm recommendation.'}]));
  r=run('apply.mjs',PINL);ok(r.status===0,'apply failed: '+r.stderr+r.stdout);ok(JSON.parse(fs.readFileSync(path.join(dir,'pending.json'),'utf8')).items.every(x=>x.key!==it.key),'marked item still pending');
  const t0=Date.now();while(Date.now()-t0<10000&&!(await c.evaluate(k=>!!(U.log&&U.log['review:'+k]),it.key)))await c.waitForTimeout(200);
  let u=await c.evaluate(()=>({xp:U.xp,badges:Object.keys(U.badges),n:U.n}));ok(u.xp===x0+22,'mark XP not awarded: +'+(u.xp-x0));ok(u.badges.includes('marked'),'Marked by the Pro badge missing');
  await c.go('#/short');await c.waitForTimeout(300);const card=await c.textContent('.qcard');ok(card.includes('Marked 5/6')&&card.includes('Next time'),'mark not shown on the question');await shot(c,'mk-student',true);
  /* rules: students can read only their own marks and can never write them */
  const tokC=await c.evaluate(()=>CLOUD.user.getIdToken());
  let h=await fetch(FS+'/reviews/'+C,{headers:{Authorization:'Bearer '+tokC}});ok(h.status===200,'student cannot read own marks: '+h.status);
  h=await fetch(FS+'/reviews/'+C+'?updateMask.fieldPaths=m.fake',{method:'PATCH',headers:{Authorization:'Bearer '+tokC,'Content-Type':'application/json'},body:JSON.stringify({fields:{m:{mapValue:{fields:{fake:{mapValue:{fields:{xp:{integerValue:'30'}}}}}}}}})});
  ok(h.status===403,'student could write a mark: '+h.status);
  const o=await page();await createPin(o,'S084517','264819','Classmate Test');const tokB=await o.evaluate(()=>CLOUD.user.getIdToken());h=await fetch(FS+'/reviews/'+C,{headers:{Authorization:'Bearer '+tokB}});ok(h.status===403,'classmate could read marks: '+h.status);await o.done();
  /* lecturer: marked list, override */
  const l=await page({w:1280,h:900});await signIn(l,L,PINL,'Abdulla Muiz Fuad');await tourOff(l);await l.go('#/lecturer');await l.waitForTimeout(1200);
  ok((await l.textContent('#mqb')).includes('Marked (1)'),'marked list missing: '+(await l.textContent('#mqb')).slice(0,120));await l.click('#mqb [data-t="d"]');await l.click('#mqb [data-open]');
  await l.selectOption('#mqb [data-f="band"]','6');await l.fill('#mqb [data-f="xp"]','26');await l.fill('#mqb [data-f="fb"]','Excellent, clear and well applied. Keep this structure.');await shot(l,'mk-lecturer',true);
  await l.click('#mqb [data-save]');await l.waitForTimeout(800);
  const t1=Date.now();while(Date.now()-t1<10000&&(await c.evaluate(k=>U.rev[k].band,it.key))!==6)await c.waitForTimeout(200);
  u=await c.evaluate(k=>({xp:U.xp,r:U.rev[k]}),it.key);ok(u.r.band===6&&u.r.by==='lecturer'&&u.xp===x0+26,'override not applied: '+JSON.stringify(u));
  ok((await l.textContent('#cdb')).includes(C),'dashboard missing the student');await l.done();
  /* restart keeps marked XP (it's for a submitted answer) */
  await c.go('#/short');const x2=await c.evaluate(()=>U.xp);await c.click('[data-a="restart"]');await c.waitForTimeout(200);
  u=await c.evaluate(k=>({xp:U.xp,has:!!U.log['review:'+k]}),it.key);ok(u.has&&u.xp>=x2-60&&u.xp<x2,'restart removed the mark XP: '+JSON.stringify(u));
  await c.done();fs.rmSync(dir,{recursive:true,force:true})},

/* lecturer: a student's full profile (runs after marking: student C has a marked typed answer) */
async profile(){const c=await page();await signIn(c,C,PINC,'Shifa Test');await tourOff(c);const xc=await c.evaluate(()=>U.xp);
  const l=await page({w:1280,h:900,theme:'light'});await signIn(l,L,PINL,'Abdulla Muiz Fuad');await tourOff(l);
  await l.go('#/board');await l.waitForSelector('#lbl [data-sid="'+C+'"]');await l.click('#lbl [data-sid="'+C+'"]');await l.waitForTimeout(1200);
  ok(await l.evaluate(()=>location.hash)==='#/student/'+C,'leaderboard row did not open the profile');
  let t=await l.textContent('#prof');ok(t.includes('Shifa Test')&&t.includes(C)&&t.includes('s082110@student.mnu.edu.mv')&&t.includes(xc+' XP'),'profile header wrong: '+t.slice(0,160));
  ok(t.includes('marked 6/6')&&t.includes('Typed answers'),'typed answer with its mark missing');ok(/Week \d/.test(t)&&/Section C/.test(t)&&/Essay Coach/.test(t)&&/Badges/.test(t)&&/Recent activity/.test(t),'profile sections missing');
  await shot(l,'prof-desktop-light',true);
  /* dashboard: search + clickable rows */
  await l.go('#/lecturer');await l.waitForTimeout(1000);await l.fill('#csq','shifa');await l.waitForTimeout(200);
  ok(await l.$$eval('#cdb tr[data-sid]',r=>r.length===1&&r[0].dataset.sid==='S082110'),'search did not filter the table');
  await l.click('#cdb tr[data-sid="'+C+'"]');await l.waitForTimeout(1000);ok(await l.evaluate(()=>location.hash)==='#/student/'+C,'table row did not open the profile');
  /* inline marking from the profile */
  await l.click('#prof .mqi [data-open]');await l.selectOption('#prof [data-f="band"]','4');await l.fill('#prof [data-f="xp"]','16');await l.fill('#prof [data-f="fb"]','Good structure. Add an example.');await l.click('#prof [data-save]');await l.waitForTimeout(800);
  const rv=await fsDoc('reviews',C),m=rv.m.mapValue.fields,k=Object.keys(m).find(x=>!/^note_/.test(x));ok(int(m[k].mapValue.fields.band)===4,'inline mark not saved');
  const t1=Date.now();while(Date.now()-t1<10000&&(await c.evaluate(()=>U.xp))!==xc-10)await c.waitForTimeout(200);ok(await c.evaluate(()=>U.xp)===xc-10,'student XP not adjusted to the new mark');
  /* a message: delivered as a note, never a mark */
  const x1=await c.evaluate(()=>U.xp);await l.fill('#pnote','Great progress! Try the Topic 12 MCQs next.');await l.click('#psend');await l.waitForTimeout(600);
  const t2=Date.now();while(Date.now()-t2<10000&&!(await c.evaluate(()=>Object.keys(U.notes||{}).length)))await c.waitForTimeout(200);
  let u=await c.evaluate(()=>({n:Object.values(U.notes||{}),xp:U.xp,rev:Object.keys(U.rev||{}).filter(k=>/^note_/.test(k)).length,reviewed:U.n.reviewed}));
  ok(u.n.length===1&&u.n[0].fb.includes('Topic 12')&&u.xp===x1&&!u.rev,'note handled as a mark or not delivered: '+JSON.stringify(u));
  await c.go('#/');await c.waitForTimeout(300);ok((await c.textContent('.inbox')).includes('Topic 12'),'inbox card missing');await c.click('[data-noteread]');await c.waitForTimeout(300);ok(!await c.$('.inbox'),'inbox not dismissed');
  await l.go('#/lecturer');await l.waitForTimeout(1000);ok((await l.textContent('#mqb')).includes('Marked (1)'),'note counted in marking: '+(await l.textContent('#mqb')).slice(0,80));
  /* PIN reset email */
  await l.go('#/student/'+C);await l.waitForTimeout(1000);await l.click('#preset');await l.waitForTimeout(1200);
  const oob=await (await fetch(EMU+'/oobCodes')).json();ok((oob.oobCodes||[]).some(o=>o.email==='s082110@student.mnu.edu.mv'&&o.requestType==='PASSWORD_RESET'),'reset email not requested');await l.done();
  /* phone, dark */
  const ph=await page({theme:'dark'});await signIn(ph,L,PINL,'Abdulla Muiz Fuad');await tourOff(ph);await ph.go('#/student/'+C);await ph.waitForTimeout(1200);ok((await ph.textContent('#prof')).includes('Shifa Test'),'phone profile missing');await shot(ph,'prof-phone-dark',true);await ph.done();
  /* students: no clickable rows, no profiles */
  await c.go('#/board');await c.waitForTimeout(800);ok(!await c.$('#lbl [data-sid]'),'student sees clickable rows');
  await c.go('#/student/'+A);await c.waitForTimeout(500);ok(!await c.$('#prof')&&await c.evaluate(()=>!location.hash.includes('student')||!!document.querySelector('.hero')),'student opened a profile');await c.done()},

/* question coverage: seeded attempts show up with the right counts, the not-attempted filter and the CSV */
async coverage(){const al=/400|Failed to load resource|identitytoolkit/;const c=await page({allow:al});await ensure(c,C,PINC);await signIn(c,C,PINC,'Shifa Test');await tourOff(c);
  const ids=await c.evaluate(()=>{const G=covCatalogue(),w=G.filter(g=>g.kind==='written').pop(),m=G.find(g=>g.kind==='mcq');
    /* a question this student hasn't touched (the marking test answers a random one) */
    const used=id=>Object.keys(U.log).some(k=>k.split(':')[1]===id)||Object.values(U.ans||{}).some(a=>a.q===id),wi=w.items.slice().reverse().find(it=>!used(it.id))||w.items[w.items.length-1];
    return {w:wi.id,wg:w.k,m:m?m.items[m.items.length-1].id:null,mg:m?m.k:null,total:G.reduce((t,g)=>t+g.items.length,0)}});
  await c.evaluate(i=>{U.log['plan:'+i.w+':2026-10-01']=1;U.log['typed:'+i.w+':2026-10-02']=1;U.ans=U.ans||{};U.ans[i.w+'_cov1']={q:i.w,t:'A seeded answer for the coverage test.',at:'2026-10-02T10:00:00.000Z',b:4};
    if(i.m){U.cnt=U.cnt||{};U.cnt['mcq:'+i.m+':2026-10-01']={d:'2026-10-01',k:['mcq','mcqRight']};U.cnt['mcq:'+i.m+':2026-10-02']={d:'2026-10-02',k:['mcq']}}save()},ids);await synced(c);await c.waitForTimeout(2500);await c.done();
  const l=await page({w:1280,h:900,allow:al});await ensure(l,L,PINL);await signIn(l,L,PINL,'Abdulla Muiz Fuad');await tourOff(l);await l.go('#/lecturer');
  await waitFor(l,()=>!!document.querySelector('#covb .covsum'));ok((await l.textContent('#covb')).includes(' of '+ids.total),'total questions missing');
  const cells=async(g,id)=>{await waitFor(l,g=>!!document.querySelector('.covg[data-g="'+g+'"]'),g);const open=await l.$eval('.covg[data-g="'+g+'"]',d=>d.open);if(!open)await l.click('.covg[data-g="'+g+'"] summary');
    await waitFor(l,([g,id])=>[...document.querySelectorAll('.covg[data-g="'+g+'"] tr')].some(r=>r.textContent.includes(id)),[g,id]);
    return l.$$eval('.covg[data-g="'+g+'"] tr',(rs,id)=>{const r=rs.find(x=>x.cells[0]&&x.cells[0].textContent.startsWith(id+' '));return r?[...r.cells].slice(1).map(c=>c.textContent.trim()):null},id)};
  const w=await cells(ids.wg,ids.w);ok(w&&JSON.stringify(w)===JSON.stringify(['1','2','1','0','1','0','4.0']),'written row wrong: '+JSON.stringify(w));
  if(ids.m){const m=await cells(ids.mg,ids.m);ok(m&&JSON.stringify(m)===JSON.stringify(['1','2','50%']),'MCQ row wrong: '+JSON.stringify(m))}
  await shot(l,'coverage',true);
  await l.check('#covzero');await l.waitForTimeout(300);ok(await l.$$eval('#covb tr',rs=>rs.slice(1).every(r=>!r.cells[1]||r.cells[1].tagName==='TH'||r.classList.contains('cov0'))),'not-attempted filter shows attempted questions');
  ok(!(await l.textContent('#covb')).includes(ids.w+' '),'attempted question still listed');
  const [dl]=await Promise.all([l.waitForEvent('download'),l.click('#covcsv')]);const csv=require('fs').readFileSync(await dl.path(),'utf8');
  ok(csv.split('\n').length===ids.total+1&&csv.includes(ids.w),'CSV should list every question');await l.done()},

/* live tutorial sessions: start, join, on screen / left the app, section, report, focus XP, profile */
async sessions(){if(process.env.OLDRULES)return;
  const l=await page({w:1280,h:900,theme:'light',allow:/400|Failed to load resource|identitytoolkit/});await ensure(l,L,PINL);await signIn(l,L,PINL,'Abdulla Muiz Fuad');await tourOff(l);
  await l.go('#/lecturer');await waitFor(l,()=>!!document.querySelector('#lsess #lsgo'));
  ok(JSON.stringify(await l.$$eval('#lsname option',o=>o.map(x=>x.value)))===JSON.stringify(['Week 11 tutorial','Week 12 tutorial','Week 13 tutorial','Week 14 tutorial']),'week dropdown should offer only weeks 11-14');
  ok(await l.$eval('#lsname',s=>s.value)==='Week 11 tutorial','Week 11 should be preselected');await shot(l,'session-start',true);await l.click('#lsgo');
  await waitFor(l,()=>PR.sessOn===true);const sid=await l.evaluate(()=>PR.sess.id);ok((await l.textContent('#lsess')).includes('Week 11 tutorial'),'running session not shown');
  const c=await page({allow:/400|Failed to load resource|identitytoolkit/});await ensure(c,C,PINC);await signIn(c,C,PINC,'Shifa Test');await tourOff(c);
  await waitFor(c,()=>!!document.querySelector('#lbjoin'));ok(await c.evaluate(()=>!PR.joined),'joined without tapping Join');await shot(c,'sess-banner');
  await c.click('#lbjoin');await c.waitForSelector('#lok');ok((await c.textContent('.modal')).includes('whether this app is on your screen'),'join note missing');await c.click('#lok');
  await waitFor(c,()=>PR.joined===true);const pp='sessions/'+sid+'/p';
  let d=await waitDoc(pp,C,x=>x.st.stringValue==='on');ok(d,'presence not written');
  await l.go('#/live');await waitFor(l,()=>!!document.querySelector('#lvb tr[data-sid]'));ok((await l.textContent('#lvb')).includes('On screen'),'live board row missing');
  /* the student moves to Section B, then leaves the app */
  await c.go('#/short');await c.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
  d=await waitDoc(pp,C,x=>x.st.stringValue==='away');ok(d&&int(d.left)===1,'away / left count not written');ok(d.sec.stringValue.startsWith('Section B'),'section not reported: '+(d&&d.sec.stringValue));
  await waitFor(l,()=>document.querySelector('#lvb').textContent.includes('Left the app'));await shot(l,'live-board',true);
  await c.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await c.mouse.click(5,500);
  d=await waitDoc(pp,C,x=>x.st.stringValue==='on');ok(d,'back on screen not written');
  await c.go('#/live');ok(!await c.$('#lvb'),'student opened the live board');await c.go('#/session/'+sid);ok(!await c.$('#srp'),'student opened a report');
  ok(await c.evaluate(()=>!document.querySelector('[aria-label="Take a break"]')&&(PR.fc=5000,presTick(),!document.querySelector('[aria-label="Take a break"]'))),'break reminder during a live session');
  /* focus XP: a long, focused record, then the lecturer ends the session */
  const x0=await c.evaluate(()=>{const r=U.sess[PR.sess.id];r.on=1000;r.idle=20;r.away=30;PR.fc=0;return U.xp});
  await l.go('#/live');await waitFor(l,()=>!!document.querySelector('#lvend'));await l.click('#lvend');
  await waitFor(c,()=>!PR.joined&&!document.querySelector('#livebar'));await waitFor(c,id=>!!U.log['sessfocus:'+id],sid);ok(await c.evaluate(([id,x])=>U.gain['sessfocus:'+id]===20&&U.xp>=x+20,[sid,x0]),'focus XP not +20');
  const sd=await fsDoc('sessions',sid);ok(sd&&sd.active.booleanValue===false&&sd.rep&&sd.rep.mapValue.fields[C],'report not saved');
  await l.go('#/session/'+sid);await waitFor(l,()=>!!document.querySelector('#srp tr[data-sid]'));ok((await l.textContent('#srp')).includes('Shifa'),'report row missing');ok(await l.$('#srcsv'),'CSV button missing');await shot(l,'session-report',true);
  await l.go('#/lecturer');await waitFor(l,()=>(document.querySelector('#lsess')||{}).textContent.includes('Week 11 tutorial'));
  await waitFor(l,()=>!!document.querySelector('#lsname')&&document.querySelector('#lsname').value==='Week 12 tutorial');
  await l.go('#/student/'+C);await waitFor(l,()=>!!document.querySelector('#prof')&&document.querySelector('#prof').textContent.includes('Week 11 tutorial'));
  ok((await l.textContent('#prof')).includes('Screen time'),'screen time missing from the profile');
  await c.done();await l.done()},

/* rules without sessions (before the new rules are published): no banner, no errors, screen time still works */
async sessDenied(){if(!process.env.OLDRULES)return;const c=await page({allow:/permission|insufficient|400|Failed to load resource|identitytoolkit/i});await ensure(c,C,PINC);await signIn(c,C,PINC,'Shifa Test');await tourOff(c);
  await c.waitForTimeout(1500);ok(!await c.$('#livebar'),'banner without session rules');ok(await c.$('#stcard'),'screen time card missing');
  const l=await page({w:1280,h:900,allow:/permission|insufficient|400|Failed to load resource|identitytoolkit/i});await ensure(l,L,PINL);await signIn(l,L,PINL,'Abdulla Muiz Fuad');await tourOff(l);
  await l.evaluate(()=>{window.__formSeen=0;new MutationObserver(()=>{if(document.querySelector('#lsess #lsgo'))window.__formSeen=1}).observe(document.body,{childList:true,subtree:true})});await l.go('#/lecturer');
  await waitFor(l,()=>(document.querySelector('#lsess')||{}).textContent.includes("rules haven't been published"));await l.waitForTimeout(800);
  ok(await l.evaluate(()=>!window.__formSeen),'the Start form flashed before the rules check');ok((await l.textContent('#lsess')).includes('Screen time'),'fallback should say screen time still works');await c.done();await l.done()},
/* ---------- combined rules (RULES2=1): names, usernames, the XP guard and the Phase 1 features ---------- */
async gated(){if(R2)return;const p=await page();await signIn(p,A,PIN);await tourOff(p);
  ok(await p.evaluate(()=>!CLOUD.rules2&&!document.body.classList.contains('rules2')),'combined-rules features switched on under the old rules');
  await p.go('#/short');ok(!(await p.isVisible('.rpt')),'report button shown under the old rules');
  const b=await fsDoc('board',A);ok(b&&!('u' in b)&&!('a' in b),'old rules: board row should keep the old shape');await p.done()},
async names(){if(!R2)return;await fsPut('directory',A,{n:'Hawwa Uyoon Ali',g:'H01'});
  const p=await page();await signIn(p,A,PIN);await p.waitForSelector('.modal[aria-label="Confirm your name"]',{timeout:15000});
  ok((await p.textContent('.modal')).includes('Hawwa Uyoon Ali'),'official name not shown');await shot(p,'fb-name');
  await p.click('.modal [data-w="Uyoon"]');await p.click('#nmok');await p.waitForTimeout(2600);await synced(p);await tourOff(p);
  const b=await waitDoc('board',A,d=>d.u&&d.u.stringValue==='@Uyoon441');ok(b&&b.n.stringValue==='Hawwa Uyoon Ali','board row not updated with the official name and username');
  const bad=await p.evaluate(async()=>{const base={n:U.dn,u:U.un,a:'',x:0,l:0,b:0,s:0,t:CLOUD.ts()};const tries={nick:{n:'Cool Kid'},digits:{u:'@Uyoon999'},word:{u:'@Zara441'},avatar:{a:'<b>x</b>'},overXP:{x:(U.xp|0)+10}};
    const out={};for(const [k,v] of Object.entries(tries)){try{await CLOUD.put('board/'+ME.sid,Object.assign({},base,v));out[k]='allowed'}catch(e){out[k]='refused'}}
    try{await CLOUD.put('board/'+ME.sid,Object.assign({},base,{u:'@Hawwa441'}));out.otherWord='refused-ok'}catch(e){out.otherWord='wrongly refused'}return out});
  ok(Object.entries(bad).every(([k,v])=>k==='otherWord'?v==='refused-ok':v==='refused'),'board rules: '+JSON.stringify(bad));
  /* fake XP: the progress jumps by 2,000; the board must not follow at once */
  await p.evaluate(()=>{U.xp+=2000;save()});await p.waitForTimeout(3000);const d=await fsDoc('users',A),b2=await fsDoc('board',A);
  ok(int(d.xp)-int(b2.x)>=1900,'board followed a 2,000 XP jump at once ('+int(b2.x)+' of '+int(d.xp)+')');ok(await p.evaluate(()=>CLOUD.state!=='error'),'sync shows an error while the board catches up');
  await p.evaluate(()=>{U.xp-=2000;save()});await p.waitForTimeout(2600);
  await p.go('#/board');await p.waitForTimeout(800);ok((await p.textContent('#lbl')).includes('@Uyoon441'),'username not on the board');ok(!await p.$('#hd'),'Hidden player option still offered');await p.done()},
async reports(){if(!R2)return;const s=await page();await signIn(s,A,PIN);await tourOff(s);await s.go('#/short');await s.waitForSelector('.qcard .rpt',{state:'visible'});
  await s.click('.qcard .rpt');await s.click('.modal input[value="unclear"]');await s.fill('#rtx','Typo in the second chip');await s.click('#rsend');await s.waitForTimeout(800);
  ok((await s.textContent('.qcard .rpt')).includes('Reported'),'report not confirmed');
  const l=await page({w:1280,h:900});await signIn(l,L,PINL);await tourOff(l);await l.go('#/lecturer');await l.waitForSelector('#rptb .note',{timeout:15000});
  ok((await l.textContent('#rptb')).includes('Typo in the second chip'),'report not in the lecturer queue');
  await l.fill('#rptb textarea','Thanks, fixed!');await l.click('#rptb [data-rsend]');await l.waitForTimeout(1200);
  await s.go('#/');await waitFor(s,()=>document.body.textContent.includes('Thanks, fixed!'));
  /* announcements */
  await l.fill('#ant','Tutorial moved');await l.fill('#anb','Thursday 10 am in Room 3');await l.click('#ango');await l.waitForTimeout(1000);
  await s.go('#/');await waitFor(s,()=>document.body.textContent.includes('Thursday 10 am in Room 3'));await s.click('[data-annread]');await s.waitForTimeout(300);
  ok(!(await s.textContent('#app')).includes('Thursday 10 am in Room 3'),'announcement not dismissed');
  /* a student can't post an announcement or read someone else's report */
  const r=await s.evaluate(async()=>{const o={};try{await CLOUD.add('announcements',{t:'x',b:'y',at:CLOUD.ts()});o.ann='allowed'}catch(e){o.ann='refused'}
    try{await CLOUD.add('reports',{sid:'S085542',q:'x',w:'',k:'other',tx:'',st:'open',t:CLOUD.ts()});o.spoof='allowed'}catch(e){o.spoof='refused'}return o});
  ok(r.ann==='refused'&&r.spoof==='refused','student rules: '+JSON.stringify(r));await s.done();await l.done()},
async errors(){if(!R2)return;const s=await page({allow:/boom-test/});await signIn(s,A,PIN);await tourOff(s);
  await s.evaluate(()=>setTimeout(()=>{throw new Error('boom-test')},0));await s.waitForTimeout(1500);
  const l=await page({w:1280,h:900});await signIn(l,L,PINL);await tourOff(l);await l.go('#/lecturer');await waitFor(l,()=>(document.querySelector('#errb')||{}).textContent?.includes('boom-test'));
  await s.done();await l.done()},
async social(){if(!R2)return;await fsPut('directory',A,{n:'Hawwa Uyoon Ali',g:'H01'});await fsPut('directory',B,{n:'Mariyam Test Ali',g:'H02'});
  const play=async(p,right)=>{for(let k=0;k<20;k++){const b=await p.$(right?'[data-qo="0"]:not([disabled])':'[data-qo]:not([data-qo="0"]):not([disabled])');if(!b){if(!await p.$('[data-qo]'))return;await p.waitForTimeout(300);continue}await b.click();await p.waitForTimeout(right?800:1700)}};
  const a=await page();await signIn(a,A,PIN);await tourOff(a);await a.go('#/challenges/new');await a.waitForSelector('#chp [data-s="'+B+'"]');
  await a.click('#chp [data-s="'+B+'"]');await a.click('#chgo');await a.waitForFunction(()=>/^#\/challenge\/\w+/.test(location.hash),null,{timeout:15000});
  const id=await a.evaluate(()=>location.hash.split('/')[2]);await a.waitForSelector('#chplay');await a.click('#chplay');await play(a,true);
  await waitFor(a,()=>(document.querySelector('#chv')||{}).textContent?.includes('not played yet'));const ax0=await a.evaluate(()=>U.xp);
  /* B: the bell, the invite, then playing (all wrong) */
  const b=await page();await signIn(b,B,PINB);await tourOff(b);await waitFor(b,()=>!!document.querySelector('#bell b'));await b.click('#bell');await b.waitForTimeout(600);
  ok((await b.textContent('main')).includes('challenged you'),'invite not in notifications');await shot(b,'fb-notifs');
  const bx0=await b.evaluate(()=>U.xp);await b.go('#/challenge/'+id);await b.waitForSelector('#chplay');await b.click('#chplay');await play(b,false);
  await waitFor(b,()=>(document.querySelector('#chv')||{}).textContent?.includes('Final results'));ok((await b.evaluate(()=>U.xp))-bx0>=15,'challengee XP missing');
  /* A won: +50 */
  await a.go('#/');await a.go('#/challenge/'+id);await waitFor(a,()=>(document.querySelector('#chv')||{}).textContent?.includes('won'));await a.waitForTimeout(500);
  ok((await a.evaluate(()=>U.xp))-ax0===50,'challenger win XP wrong: '+((await a.evaluate(()=>U.xp))-ax0));await shot(a,'fb-challenge');
  /* rules: no second score, no reading other people's notifications or challenges */
  const r=await b.evaluate(async([id,A])=>{const o={};try{await CLOUD.put('challenges/'+id+'/r/'+ME.sid,{s:10,n:10,ms:1,at:CLOUD.ts()});o.again='allowed'}catch(e){o.again='refused'}
    try{await CLOUD.docs('notifs');o.allNotes='allowed'}catch(e){o.allNotes='refused'}
    try{await CLOUD.put('challenges/'+id,{st:'done'},true);o.notBy='allowed'}catch(e){o.notBy='refused'}
    try{await CLOUD.add('notifs',{to:A,fr:'S099999',k:'invite',ref:'',tx:'x',t:CLOUD.ts(),seen:false});o.spoof='allowed'}catch(e){o.spoof='refused'}return o},[id,A]);
  ok(Object.values(r).every(v=>v==='refused'),'challenge rules: '+JSON.stringify(r));
  /* weekend: the rules accept a score only on Friday and Saturday (Maldives time) */
  const dow=new Date(Date.now()+5*3600e3).getUTCDay(),wk=await b.evaluate(async()=>{const w=mvDay();try{await CLOUD.put('weekend/'+w+'_'+ME.sid,{w,sid:ME.sid,g:'H02',s:3,n:15,ms:1000,at:CLOUD.ts()});return 'allowed'}catch(e){return 'refused'}});
  ok(wk===([5,6].includes(dow)?'allowed':'refused'),'weekend rule on day '+dow+': '+wk);
  const wg=await b.evaluate(async()=>{const w=mvDay();try{await CLOUD.put('weekend/'+w+'_'+ME.sid+'x',{w,sid:ME.sid,g:'H01',s:3,n:15,ms:1000,at:CLOUD.ts()});return 'allowed'}catch(e){return 'refused'}});ok(wg==='refused','weekend: wrong team or id accepted');
  await b.go('#/weekend');await b.waitForTimeout(800);ok((await b.textContent('main')).includes('Teams'),'weekend page');
  /* studying now: shared only when switched on */
  await b.go('#/notifs');await b.check('#seest');await a.go('#/notifs');await a.check('#shst');await a.evaluate(()=>{award('test:study:'+Date.now(),1,'x',1)});
  await waitFor(b,()=>(document.querySelector('main')||{}).textContent?.includes('is studying now'));
  /* live quiz battle */
  const l=await page({w:1280,h:900});await signIn(l,L,PINL);await tourOff(l);await l.go('#/battle');await l.waitForSelector('#btnew');await l.fill('#btn','Test battle');await l.click('#btnew');
  await a.go('#/battle');await a.waitForSelector('#btjoin');await a.click('#btjoin');await waitFor(l,()=>(document.querySelector('#btv')||{}).textContent?.includes('1 joined'));
  await l.click('#btnext');await a.waitForSelector('[data-bo="0"]:not([disabled])');await a.click('[data-bo="0"]');await waitFor(l,()=>(document.querySelector('#btv')||{}).textContent?.includes('1/1 answered'));
  await l.click('#btrev');await waitFor(a,()=>!!document.querySelector('.fb.ok'));await shot(a,'fb-battle');
  const x0=await a.evaluate(()=>U.xp);await l.click('#btend');await waitFor(a,()=>(document.querySelector('#btv')||{}).textContent?.includes('You came 1'));await a.waitForTimeout(500);
  ok((await a.evaluate(()=>U.xp))-x0===30,'battle XP wrong: '+((await a.evaluate(()=>U.xp))-x0));
  await a.done();await b.done();await l.done()},
async qbank(){if(!R2)return;const l=await page({w:1280,h:900});await signIn(l,L,PINL);await tourOff(l);await l.go('#/lecturer');await l.waitForSelector('#qbc:not([hidden]) #qbload',{state:'attached'});
  const [k,id]=await l.evaluate(()=>{const k=Object.keys(qbankKinds())[0];return [k,k==='mcq'?BANK.mcq[0].id:BANK_B[0].id]});
  await l.click('#qbc summary');await l.fill('#qbid',id);await l.click('#qbload');const j=JSON.parse(await l.inputValue('#qbj'));j.q='EDITED: '+j.q;await l.fill('#qbj',JSON.stringify(j));await l.click('[data-qs="live"]');
  await waitFor(l,()=>(document.querySelector('#qbl')||{}).textContent?.includes('EDITED'));
  /* a draft with a mistake is refused by the check; a good draft is saved but not shown to students */
  await l.fill('#qbid','');await l.fill('#qbj',JSON.stringify(Object.assign({},j,{id:'',q:'Draft only: '+j.q})));await l.click('[data-qs="draft"]');await l.waitForTimeout(800);
  await l.fill('#qbj',JSON.stringify(Object.assign({},j,{id:'',q:'What will be on the exam?'})));await l.click('[data-qs="live"]');ok((await l.textContent('#qberr')).includes('exam'),'exam wording not refused');await shot(l,'fb-qbank');
  const s=await page();await signIn(s,A,PIN);await tourOff(s);await waitFor(s,([k,id])=>/^EDITED/.test((qbankKinds()[k].find(id)||{}).q||''),[k,id]);
  ok(await s.evaluate(()=>!JSON.stringify(typeof BANK_B!=='undefined'?BANK_B:BANK).includes('Draft only')),'draft reached a student');
  const r=await s.evaluate(async()=>{try{await CLOUD.docs('qbank');return 'allowed'}catch(e){return 'refused'}});ok(r==='refused','students can list drafts');
  /* Claude's drafts: the upload tool against the emulator */
  const fs2=require('fs'),f=path.join(os.tmpdir(),'qgen-test.json');fs2.writeFileSync(f,JSON.stringify([{kind:k,data:Object.assign({},j,{id:'gen-test-1',q:'A new practice question about '+j.q.slice(8,60)}),note:'test'}]));
  const env=Object.assign({},process.env,{MKT301_EMU:'1',MKT101_EMU:'1',MKT301_LECTURER_PIN:PINL,MKT101_LECTURER_PIN:PINL,HTTPS_PROXY:'',https_proxy:''});
  const up=spawnSync(process.execPath,[path.join(ROOT,'tools','qgen','upload.mjs'),f],{encoding:'utf8',env});ok(up.status===0&&/Uploaded 1/.test(up.stdout),'qgen upload failed: '+up.stdout+up.stderr);
  await waitFor(l,()=>(document.querySelector('#qbl')||{}).textContent?.includes('gen-test-1'));await l.done();await s.done()},
async lectReports(){const l=await page({w:1280,h:900});await signIn(l,L,PINL);await tourOff(l);await l.go('#/lecturer');await l.waitForSelector('#wkrgo');await l.click('#wkrgo');
  await waitFor(l,()=>!!document.querySelector('#wkrb table'));const t=await l.textContent('#wkrb');ok(/\d+\/\d+/.test(t),'weekly report empty');
  const [dl]=await Promise.all([l.waitForEvent('download'),l.click('#wkrb [data-wk]')]);const csv=fs.readFileSync(await dl.path(),'utf8');ok(csv.startsWith('"week_of","sid"')&&csv.includes('S081441'),'weekly CSV wrong');
  if(!process.env.OLDRULES){const [d2]=await Promise.all([l.waitForEvent('download',{timeout:15000}),l.click('#attgo')]);const a=fs.readFileSync(await d2.path(),'utf8');ok(a.startsWith('"sid","name","sessions_joined"'),'attendance CSV wrong')}
  await shot(l,'fb-reports',true);await l.done()},
async xpAudit(){if(!R2)return;const u=await fsDoc('users',B);const U2=JSON.parse(u.u.stringValue);U2.xp=(U2.xp|0)+5000;await fsPut('users',B,{name:u.name.stringValue,u:JSON.stringify(U2),xp:U2.xp,ts:new Date()});
  const l=await page({w:1280,h:900});await signIn(l,L,PINL);await tourOff(l);await l.go('#/lecturer');await waitFor(l,()=>(document.querySelector('#xpab')||{}).textContent?.includes('S085542'));
  ok((await l.textContent('#xpab')).includes('not explained'),'inflated XP not flagged');
  await l.go('#/student/S085542');await waitFor(l,()=>!!document.querySelector('#pxa'));ok((await l.textContent('#pxa')).includes('flag'),'flag not on the profile');
  /* full class backup */
  await l.go('#/lecturer');await l.waitForSelector('#bkgo');const [dl]=await Promise.all([l.waitForEvent('download'),l.click('#bkgo')]);
  const j=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));ok(j.students>=3&&j.data.users[A]&&j.data.board&&j.data.directory,'backup incomplete: '+JSON.stringify(j.counts));await l.done()},
};
async function waitFor(p,fn,arg,t=15000){const t0=Date.now();while(Date.now()-t0<t){if(await p.evaluate(fn,arg).catch(()=>false))return;await p.waitForTimeout(250)}throw new Error('timed out waiting for '+String(fn).slice(0,90))}
async function waitDoc(col,id,test,t=15000){const t0=Date.now();let d=null;while(Date.now()-t0<t){d=await fsDoc(col,id);if(d&&(!test||test(d)))return d;await new Promise(r=>setTimeout(r,300))}return null}
async function ensure(p,sid,pin){await p.evaluate(async([s,k])=>{try{await CLOUD.create(s,k)}catch(e){}try{await CLOUD.signOut()}catch(e){}},[sid,pin]);await p.reload();await p.waitForTimeout(400)}


(async()=>{const server=spawn('python3',['-m','http.server',String(PORT)],{cwd:ROOT,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
  browser=await chromium.launch();
  for(const [name,fn] of Object.entries(T)){if(ARGS.only&&!String(ARGS.only).split(',').includes(name))continue;const t0=Date.now();
    try{await fn();passes++;console.log(`PASS ${name} (${((Date.now()-t0)/1000).toFixed(1)}s)`)}catch(e){fails++;console.log(`FAIL ${name}: ${e.message.split('\n').slice(0,4).join(' | ')}`)}}
  await browser.close();server.kill();console.log(`\n${passes} passed, ${fails} failed`);process.exit(fails?1:0)})();
