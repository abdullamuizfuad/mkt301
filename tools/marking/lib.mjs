/* Shared helpers for the Claude marking workflow (fetch.mjs, apply.mjs). See CLAUDE.md at the repo root.
   Talks to Firebase over its REST APIs, signed in as the lecturer (S000001) with MKT301_LECTURER_PIN.
   Set MKT301_EMU=1 to use the local emulators (tests). The PIN is only ever read from the environment. */
import {readFileSync,writeFileSync,existsSync} from 'fs';
import path from 'path';import vm from 'vm';import {spawnSync} from 'child_process';import {fileURLToPath} from 'url';

export const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../..');
export const DIR=process.env.MKT301_MARK_DIR||HERE;
export const PENDING=path.join(DIR,'pending.json'),MARKS=path.join(DIR,'marks.json'),DONE=path.join(DIR,'marked-log.json');

/* Node's fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1 (Node >= 22.21): re-run this script with it set */
export function useProxy(){if((process.env.HTTPS_PROXY||process.env.https_proxy)&&!process.env.NODE_USE_ENV_PROXY){
  const r=spawnSync(process.execPath,['--disable-warning=UNDICI-EHPA'].concat(process.argv.slice(1)),{stdio:'inherit',env:Object.assign({},process.env,{NODE_USE_ENV_PROXY:'1'})});process.exit(r.status==null?1:r.status)}}

/* the public web config lives in cloud-config.js (the one place to paste it) */
const CFG=(()=>{try{const ctx={};vm.createContext(ctx);return vm.runInContext(readFileSync(path.join(ROOT,'cloud-config.js'),'utf8')+';CLOUD_CONFIG',ctx)||{}}catch(e){return {}}})();
const EMU=process.env.MKT301_EMU==='1',API_KEY=CFG.apiKey||'demo-key',PROJECT=EMU?'demo-mkt301':CFG.projectId;
const AUTH=(EMU?'http://127.0.0.1:9099/identitytoolkit.googleapis.com':'https://identitytoolkit.googleapis.com')+'/v1';
const FS=(EMU?'http://127.0.0.1:8085':'https://firestore.googleapis.com')+`/v1/projects/${PROJECT}/databases/(default)/documents`;
export const LECTURER_EMAIL='s000001@student.mnu.edu.mv';
export function die(m){console.error('✗ '+m);process.exit(1)}

export async function signIn(){const pin=process.env.MKT301_LECTURER_PIN;
  if(!pin)die('MKT301_LECTURER_PIN is not set. Add it as an environment secret (see CLAUDE.md).');
  let r;try{r=await fetch(`${AUTH}/accounts:signInWithPassword?key=${API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:LECTURER_EMAIL,password:pin,returnSecureToken:true})})}catch(e){die('Cannot reach Firebase sign-in: '+e.message)}
  const j=await r.json().catch(()=>({}));if(!r.ok)die('Lecturer sign-in failed: '+((j.error&&j.error.message)||r.status)+'. Check MKT301_LECTURER_PIN.');return j.idToken}

/* Firestore REST values ⇄ plain JS */
export function val(v){if(!v)return null;if('stringValue' in v)return v.stringValue;if('integerValue' in v)return Number(v.integerValue);if('doubleValue' in v)return v.doubleValue;
  if('booleanValue' in v)return v.booleanValue;if('timestampValue' in v)return v.timestampValue;if('nullValue' in v)return null;
  if('mapValue' in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,val(x)]));if('arrayValue' in v)return (v.arrayValue.values||[]).map(val);return null}
function enc(x){if(typeof x==='string')return {stringValue:x};if(Number.isInteger(x))return {integerValue:String(x)};if(typeof x==='number')return {doubleValue:x};
  if(typeof x==='boolean')return {booleanValue:x};if(x==null)return {nullValue:null};if(Array.isArray(x))return {arrayValue:{values:x.map(enc)}};
  return {mapValue:{fields:Object.fromEntries(Object.entries(x).map(([k,v])=>[k,enc(v)]))}}}
const fieldPath=k=>/^[A-Za-z_][A-Za-z_0-9]*$/.test(k)?k:'`'+k.replace(/[`\\]/g,'\\$&')+'`';

async function req(method,url,token,body){let r;try{r=await fetch(url,{method,headers:Object.assign({Authorization:'Bearer '+token},body?{'Content-Type':'application/json'}:{}),body:body?JSON.stringify(body):undefined})}
  catch(e){die('Cannot reach Firestore: '+e.message)}const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&(j.error.status+': '+j.error.message))||String(r.status));return j}
/* every document in a collection → {id: fields} */
export async function list(token,col){const out={};let page='';
  do{const j=await req('GET',`${FS}/${col}?pageSize=300${page?'&pageToken='+encodeURIComponent(page):''}`,token);
    for(const d of j.documents||[])out[d.name.split('/').pop()]=Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,val(v)]));page=j.nextPageToken||''}while(page);return out}
/* merge marks into reviews/{sid}.m without touching other keys */
export async function patchReview(token,sid,entries){const mask=Object.keys(entries).map(k=>'updateMask.fieldPaths='+encodeURIComponent('m.'+fieldPath(k))).join('&');
  return req('PATCH',`${FS}/reviews/${encodeURIComponent(sid)}?${mask}`,token,{fields:{m:enc(entries)}})}

/* question bank (the same data files the site uses) */
export function bank(){const ctx={};vm.createContext(ctx);
  const D=vm.runInContext(['cases.js','case-cbtl.js','case-tuna.js','bank-b.js'].map(f=>readFileSync(path.join(ROOT,f),'utf8')).join('\n')+';({CASES,BANK_B})',ctx);
  const Q={};D.CASES.forEach(c=>c.questions.forEach(q=>Q[q.id]={q,area:c.title+' (case): '+q.skill,context:c.title+': '+c.subtitle}));
  D.BANK_B.forEach(q=>Q[q.id]={q,area:'Week '+q.week+': '+q.topic,context:'Short-answer practice'});return Q}
export const BANDS=['0: Off topic or missing','1: Lists a term or two','2: Lists several terms with little explanation','3: Explains the idea with some application',
  '4: Explains clearly and applies it to the example','5: Applies well and starts to evaluate','6: Applies to the case or example throughout and evaluates with a clear judgement'];
export const readJSON=(f,d)=>existsSync(f)?JSON.parse(readFileSync(f,'utf8')):d;
export const writeJSON=(f,x)=>writeFileSync(f,JSON.stringify(x,null,1)+'\n',{mode:0o600});
