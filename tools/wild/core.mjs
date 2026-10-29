/* Shared logic for tools/wild/open.mjs and close.mjs: the same rules as engine/wild.js and engine/chips.js, for Node.
   Loads the course's settings and question data from the repo (course-config.js, bank files, bank-chips.js). */
import {readFileSync,existsSync} from 'fs';import path from 'path';import vm from 'vm';import {ROOT} from '../marking/lib.mjs';
const MV=5*3600e3,LECTURER='S000001',W14='2026-11-22';
/* the course: CRS, CHIPS, wildPick, and topic labels */
export function course(){const ctx={window:{}};vm.createContext(ctx);
  const files=['course-config.js','bank.js','bank-b.js','notes301.js','bank-chips.js'].filter(f=>existsSync(path.join(ROOT,f)));
  vm.runInContext(files.map(f=>readFileSync(path.join(ROOT,f),'utf8')).join('\n;\n')+`;this.__={CRS,CHIPS,wildPick,
    label:k=>typeof NOTES301!=='undefined'?'Week '+k+': '+((NOTES301.weeks[k]||{}).title||''):'Topic '+k+': '+((typeof TERM!=='undefined'&&TERM.topics[k])||''),
    keys:typeof NOTES301!=='undefined'?[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(String):Object.keys(TERM.topics)}`,ctx);return ctx.__}
const mvDay=t=>new Date(t+MV).toISOString().slice(0,10),mvHour=t=>new Date(t+MV).toISOString().slice(0,13);
export function wildWin(C,now){const W=C.CRS.wild,mv=new Date(now+MV);let c=Date.UTC(mv.getUTCFullYear(),mv.getUTCMonth(),mv.getUTCDate()+((W.day-mv.getUTCDay()+7)%7),W.hour)-MV;
  if(c<=now)c+=7*864e5;const o=c-864e5;return {id:'w'+mvDay(c),opens:o,closes:c,from:c-7*864e5,open:now>=o&&now<c}}
export function weekXP(u,from,to){const H=u.xph||{},a=mvHour(from),b=mvHour(to),hd=new Set(Object.keys(H).map(k=>k.slice(0,10)));let x=0;
  Object.entries(H).forEach(([k,v])=>{if(k>=a&&k<b)x+=v|0});Object.entries(u.xpd||{}).forEach(([d,v])=>{if(!hd.has(d)&&d>=a.slice(0,10)&&d<=b.slice(0,10))x+=v|0});return x}
export function top5(rows,win){return rows.filter(r=>r.id!==LECTURER&&/^S0\d{5}$/.test(r.id)).map(r=>({id:r.id,x:weekXP(r.u||{},win.from,win.opens),xp:(r.u||{}).xp|0})).filter(r=>r.x>0)
  .sort((a,b)=>b.x-a.x||b.xp-a.xp||(a.id<b.id?-1:1)).slice(0,5)}
const termWeek=d=>14+Math.floor((Date.parse(d+'T12:00:00Z')-Date.parse(W14+'T12:00:00Z'))/864e5/7);
export function recentTopics(C,win){const L=C.keys,wk=String(termWeek(mvDay(win.opens))),i=L.indexOf(wk);return i<0?L.slice(-2):i===0?L.slice(0,2):[L[i-1],L[i]]}
export function chipsScore(it,sel){sel=(sel||[]).filter(j=>it.chips[j]);const max=it.max||4,ok=j=>!!it.chips[j].ok,core=sel.filter(ok),dec=sel.filter(j=>!ok(j)).length;
  const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]),inOrder=(need,arr)=>{let i=0;for(const x of arr)if(x===need[i])i++;return i===need.length};let base=0;
  for(const p of it.paths){if(eq(core,p)){base=max;break}let L=0;while(L<core.length&&L<p.length&&core[L]===p[L])L++;base=Math.max(base,Math.floor(max*L/p.length))}
  if(base<max)(it.partial||[]).forEach(([ids,pts])=>{if(inOrder(ids,core)&&pts>base)base=pts});return Math.max(0,base-dec)}
/* an entry's score from its answers: MCQ answers are option indexes (0 = right); paragraph answers are chip index lists */
export function rescore(C,items,a){let s=0,mx=0;const by={};C.CHIPS.forEach(c=>by[c.id]=c);
  items.forEach((id,i)=>{const v=(a||{})[i],it=by[id];if(it){mx+=it.max||4;if(v&&Array.isArray(v.v))s+=chipsScore(it,v.v)}else{mx+=1;if(v&&v.v===0)s+=1}});return {s,mx}}
export function flags(C,items,e){const by={};C.CHIPS.forEach(c=>by[c.id]=c);const sn=items.reduce((t,id)=>t+(by[id]?120e3:45e3),0),f=[];
  if(e.ms<sn*.25)f.push('very fast');if(e.s===e.mx&&e.mx>0&&e.ms<sn*.4)f.push('perfect in very little time');const r=rescore(C,items,e.a);if(r.s!==e.s)f.push('score does not match the answers ('+r.s+')');return f}
export const rank=L=>L.slice().sort((a,b)=>b.s-a.s||a.ms-b.ms||String(a.fin||'').localeCompare(String(b.fin||'')));
export const when=t=>{const d=new Date(t+MV);return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+' '+d.getUTCDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]+', '+((d.getUTCHours()+11)%12+1)+':'+String(d.getUTCMinutes()).padStart(2,'0')+(d.getUTCHours()<12?' am':' pm')};
export const args=()=>Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')).map(([k,v])=>[k,v??true]));
