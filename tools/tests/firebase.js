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
let browser,fails=0,passes=0;const ok=(c,m)=>{if(!c)throw new Error(m)};
const shot=async(p,name,full)=>{if(ARGS.shots)await p.screenshot({path:path.join(ARGS.shots,name+'.png'),fullPage:!!full})};

async function page(o={}){const ctx=await browser.newContext({viewport:{width:o.w||390,height:o.h||844}});
  if(o.theme)await ctx.addInitScript(t=>localStorage.setItem('mkt301_theme',JSON.stringify(t)),o.theme);
  const p=await ctx.newPage();p.errs=[];p.allow=o.allow||null;
  p.on('pageerror',e=>p.errs.push('pageerror: '+e.message));
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

const T={
async create(){const p=await page();await shot(p,'fb-gate');await toPin(p,A);await shot(p,'fb-pin');
  await p.click('[data-pm="new"]');await p.fill('#pin','123');await p.fill('#pin2','123');await p.click('#pgo');ok((await p.textContent('#per')).includes('6 digits'),'short PIN accepted');
  await p.fill('#pin','111111');await p.fill('#pin2','111111');await p.click('#pgo');ok((await p.textContent('#per')).includes('easy'),'trivial PIN accepted');
  await p.fill('#pin',PIN);await p.fill('#pin2','000000');await p.click('#pgo');ok((await p.textContent('#per')).includes("match"),'mismatch accepted');
  await p.fill('#pin2',PIN);await p.click('#pgo');await synced(p);await tourOff(p);
  ok(await p.evaluate(()=>ME.cloud&&CLOUD.user&&CLOUD.user.email==='s081441@student.mnu.edu.mv'),'not signed in to the account');
  await p.go('#/case/iceto/read');await p.click('[data-r]');await p.waitForTimeout(2600);await synced(p);
  const d=await fsDoc('users',A);ok(d&&int(d.xp)===15,'users doc not saved (xp '+(d&&int(d.xp))+')');
  const b=await fsDoc('board',A);ok(b&&int(b.x)===15&&b.n.stringValue==='Test S.','board row not saved');
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
  ok((await a.textContent('#lbl')).includes('Test S.'),'own row missing');ok(await a.$('#lbl .r.me'),'own row not highlighted');
  const b=await page();await createPin(b,B,PINB,'Mariyam Ali');await tourOff(b);await b.go('#/case/cbtl/read');await b.click('[data-r]');await b.waitForTimeout(100);
  const rows=b.locator('[data-r]');await rows.first().click();await b.waitForTimeout(2600);await synced(b);
  await a.waitForTimeout(800);ok((await a.textContent('#lbl')).includes('Mariyam A.'),'live board did not show the other student');await shot(a,'fb-board');
  await b.go('#/board');await b.waitForTimeout(400);await b.check('#hd');await b.waitForTimeout(2800);await a.waitForTimeout(800);
  const t=await a.textContent('#lbl');ok(t.includes('Hidden player')&&!t.includes('Mariyam'),'hidden player still named');await a.done();await b.done()},

async restartSync(){const p=await page();await signIn(p,A,PIN);await tourOff(p);await p.go('#/short');
  const q=p.locator('.qcard').first();await q.locator('.chip').nth(0).click();await q.locator('[data-a="check"]').click();await p.waitForTimeout(2600);await synced(p);
  const x1=int((await fsDoc('board',A)).x);await q.locator('[data-a="restart"]').click();await p.waitForTimeout(2600);await synced(p);
  const x2=int((await fsDoc('board',A)).x);ok(x2===x1-15,`restart not synced to the board (${x1} → ${x2})`);
  await p.evaluate(()=>{U.xp=9000;save()});await p.waitForTimeout(2600);await synced(p,20000);ok(int((await fsDoc('board',A)).x)===9000,'big XP jump did not reach the board in steps');
  await p.evaluate(()=>{U.xp-=8985;save()});await p.waitForTimeout(2600);await synced(p);await p.done()},

async lecturer(){const p=await page({w:1280,h:900});await createPin(p,L,PINL,'Abdulla Muiz Fuad');await tourOff(p);await p.go('#/lecturer');await p.waitForTimeout(1200);
  const t=await p.textContent('#cdb');ok(t.includes('S081441')&&t.includes('S085542')&&t.includes('Mariyam Ali'),'dashboard missing students');ok(/(^|\D)3\/32/.test(t),'signed-up count wrong');
  ok(!await p.$('#cdb tr td:nth-child(3):text("S000001")'),'lecturer listed as a student');await shot(p,'fb-dashboard',true);
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
  await c.done();fs.rmSync(dir,{recursive:true,force:true})}
};

(async()=>{const server=spawn('python3',['-m','http.server',String(PORT)],{cwd:ROOT,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
  browser=await chromium.launch();
  for(const [name,fn] of Object.entries(T)){if(ARGS.only&&ARGS.only!==name)continue;const t0=Date.now();
    try{await fn();passes++;console.log(`PASS ${name} (${((Date.now()-t0)/1000).toFixed(1)}s)`)}catch(e){fails++;console.log(`FAIL ${name}: ${e.message.split('\n').slice(0,4).join(' | ')}`)}}
  await browser.close();server.kill();console.log(`\n${passes} passed, ${fails} failed`);process.exit(fails?1:0)})();
