#!/usr/bin/env node
/* Step 1 of Claude marking: download every typed answer that has no mark yet into tools/marking/pending.json.
   Usage (repo root):  node tools/marking/fetch.mjs        Needs MKT301_LECTURER_PIN. See CLAUDE.md. */
import {useProxy,signIn,list,bank,BANDS,PENDING,writeJSON} from './lib.mjs';
useProxy();
const token=await signIn(),[users,reviews]=await Promise.all([list(token,'users'),list(token,'reviews')]),Q=bank();
const items=[];let students=0,answers=0,flagged=0;
for(const [sid,doc] of Object.entries(users)){if(sid==='S000001')continue;let u;try{u=JSON.parse(doc.u||'{}')}catch(e){continue}
  const ans=u.ans||{},done=(reviews[sid]&&reviews[sid].m)||{};const ks=Object.keys(ans);if(ks.length)students++;answers+=ks.length;
  for(const key of ks){if(done[key])continue;const a=ans[key],e=Q[a.q];if(!e)continue;const good=e.q.chips.filter(c=>c.g),fl=a.fl||{};
    if(fl.paste||fl.big||fl.fast)flagged++;
    items.push({key,sid,q:a.q,area:e.area,context:e.context,question:e.q.q,keyIdeas:good.map(c=>c.t),
      commonMistakes:e.q.chips.filter(c=>!c.g).map(c=>c.t+(c.why?' ('+c.why+')':'')),rubric:BANDS,
      answer:a.t,words:a.w,submitted:a.at,auto:{band:a.b,keyIdeasFound:(a.f||[]).map(j=>e.q.chips[j]&&e.q.chips[j].t).filter(Boolean),structure:a.s||[]},
      flags:{pastesBlocked:fl.paste|0,bigInsertionsRemoved:fl.big|0,tooFast:!!fl.fast}})}}
items.sort((a,b)=>String(a.submitted)<String(b.submitted)?-1:1);
writeJSON(PENDING,{generated:new Date().toISOString(),count:items.length,items});
console.log(`✓ ${items.length} answer(s) to mark (from ${students} student(s), ${answers} answer(s) in total; ${flagged} with integrity flags).`);
console.log(`  Saved to ${PENDING}. Next: write marks.json, then run node tools/marking/apply.mjs`);
