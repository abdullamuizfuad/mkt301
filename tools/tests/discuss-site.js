/* Site tests for the discussion panel (engine/discuss.js); shared by both courses */
module.exports=({page,ok,STUDENT,LECT,shot})=>({
async discuss(){const l=await page({sid:LECT});
  const r=await l.evaluate(async()=>{const T=Date.now()-30*60e3,I=qIndex(),qid=Object.keys(I).find(k=>I[k].q&&I[k].q.chips&&I[k].q.chips.some(c=>c.g));
    const A=(n,b,txt)=>({[qid+'_k'+n]:{q:qid,t:txt,at:new Date(T+n*60e3).toISOString(),b,w:txt.split(' ').length}});
    const users=[1,2,3,4,5,6,7].map(n=>({id:'S08000'+n,name:'Name'+n,u:{ans:A(n,n%7,'Answer number '+n+' with some words'),qa:[[Math.round((T+n*6e4)/1000),'v:x:0',n%2,n%2?'strong':'weak']]}}));
    users.push({id:'S080009',name:'Old',u:{ans:{[qid+'_old']:{q:qid,t:'before the session',at:new Date(T-864e5).toISOString(),b:6,w:3}}}});
    CLOUD.ok=true;ME.cloud=true;window.cloudOn=()=>true;PR.sess={id:'L1',name:'Week 12 tutorial',active:true,startedAt:T,endsAt:T+3*3600e3};PR.sessList=[PR.sess];
    CLOUD.docs=async c=>c==='users'?users.map(u=>({id:u.id,name:u.name,u:JSON.stringify(u.u)})):c==='reviews'?[{id:'S080001',m:{[qid+'_k1']:{band:6,xp:24,fb:'x'}}}]:[];
    location.hash='#/discuss';await new Promise(r=>setTimeout(r,800));
    const best=[...document.querySelectorAll('.dsa.best .dst')].map(x=>x.textContent),weak=[...document.querySelectorAll('.dsa.weak .dst')].map(x=>x.textContent);
    return {qid,best,weak,txt:document.querySelector('#dsb').textContent,named:/Name\d/.test([...document.querySelectorAll('.dsa')].map(x=>x.querySelector('.dsn').textContent+x.querySelector('.dst').textContent).join(''))}});
  ok(r.best.length===3&&r.best[0].includes('number 1')&&r.weak.length===3,'best/weak: '+JSON.stringify(r.best)+' / '+JSON.stringify(r.weak));
  ok(!/before the session/.test(r.txt),'answer from before the session shown');ok(!r.named,'names shown before 👁');ok(/Student A/.test(r.txt),'anonymous labels');
  await shot(l,'discuss');
  await l.click('.dsa.best [data-dsv]');ok(!(await l.$eval('.dsa.best .dsnm',e=>e.hidden)),'👁 should show the name');
  const k=await l.$eval('.dsa.weak',e=>e.dataset.k);await l.click('.dsa.weak [data-dsm]');await l.waitForTimeout(200);ok(await l.$(`.dsa.best[data-k="${k}"]`),'move to best did not work');
  ok(await l.evaluate(()=>!!(U.disc&&U.disc.L1&&U.disc.L1.pin)),'changes not kept');
  const n0=(await l.$$('.dsq')).length;await l.click('[data-dsa]');await l.waitForTimeout(200);ok((await l.$$('.dsq')).length<n0,'unticking an area did not hide it');
  ok(await l.evaluate(()=>!U.xp),'the lecturer earned XP');await l.done()}
});
