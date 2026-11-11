/* Site tests for the guest preview (engine/guest.js); shared by both courses.
   The anonymised class board is fed a made-up public/board document through a stubbed CLOUD.docs. */
module.exports=({page,ok,shot})=>({
async guest(){const p=await page();
  ok(await p.$('#gst'),'no "Preview as a guest" button on the sign-in card');
  await p.click('#gst');await p.waitForTimeout(400);
  const s=await p.evaluate(()=>({sid:ME&&ME.sid,cloud:!!(ME&&ME.cloud),bar:!!document.getElementById('gbar'),on:cloudOn()}));
  ok(s.sid==='S000000'&&!s.cloud&&!s.on&&s.bar,'guest session: '+JSON.stringify(s));
  ok(await p.evaluate(()=>{const x=U.xp;award("guesttest:1",20,"Test",true);return U.xp>=x+20}),'a guest earns XP on this device');
  ok(!(await p.$('[data-lect]')),'a lecturer-only element is shown to a guest');
  await p.evaluate(()=>{const t=Date.now();CLOUD.ok=true;GBOARD=null;CLOUD.docs=async c=>c==='public'?[{id:'board',at:new Date(t).toISOString(),rows:[{x:900,l:3,b:5,s:4,w:120,wk:'',t},{x:400,l:2,b:3,s:1,w:0,wk:'',t},{x:5,l:0,b:0,s:0,w:0,wk:'',t}]}]:[]});
  await p.go('#/board');await p.waitForTimeout(500);
  const b=await p.evaluate(()=>{const el=document.getElementById('lbl');return el?el.innerText:''});
  ok(/Student 1/.test(b)&&/Student 2/.test(b)&&/You \(guest\)/.test(b),'anonymised board: '+b.slice(0,200));
  ok(!/S0\d{5}/.test(b),'an ID is shown on the guest board');
  const rows=await p.$$eval('#lbl .r',r=>r.map(x=>x.querySelector('b').textContent));ok(rows.length===4&&rows[0]==='Student 1','board order: '+rows.join(', '));
  await shot(p,'guest-board');
  await p.evaluate(()=>{if(typeof closeModal==='function')closeModal()});await p.click('#gleave');await p.waitForTimeout(400);
  const g=await p.evaluate(()=>({me:typeof ME!=='undefined'&&ME?ME.sid:null,bar:!!document.getElementById('gbar'),gst:!!document.getElementById('gst'),u:Object.keys(localStorage).some(k=>/u_S000000$/.test(k))}));
  ok(!g.me&&!g.bar&&g.gst&&!g.u,'leaving the preview: '+JSON.stringify(g));
  await p.done()},
async guestUrl(){const p=await page();await p.go('?guest=1#/');await p.reload();await p.waitForTimeout(500);
  ok(await p.evaluate(()=>!!(ME&&ME.sid==='S000000')),'?guest=1 opens the preview');
  await p.evaluate(()=>{GBOARD=null;CLOUD.ok=true;CLOUD.docs=async()=>[]});await p.go('?guest=1#/board');await p.waitForTimeout(500);
  ok(/not available/.test(await p.evaluate(()=>document.getElementById('lbl').innerText)),'board without published figures shows a note');
  await p.done()}
});
