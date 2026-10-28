#!/usr/bin/env node
/* The engine (engine/*) is shared by MKT101 and MKT301 and must stay byte-identical in both repos.
   node tools/sync-engine.mjs [other-repo]          copy this repo's engine to the other repo and refresh engine/MANIFEST in both
   node tools/sync-engine.mjs --check [other-repo]  exit 1 if the engine differs from its MANIFEST, or from the other repo when it is present
   The other repo defaults to the sibling folder (../mkt301 or ../mkt101-cases, or ../n301 / ../n101). */
import fs from 'fs';import path from 'path';import crypto from 'crypto';import {fileURLToPath} from 'url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),check=args.includes('--check'),given=args.find(a=>!a.startsWith('--'));
const files=d=>fs.readdirSync(path.join(d,'engine')).filter(f=>f!=='MANIFEST').sort();
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const manifest=d=>files(d).map(f=>sha(path.join(d,'engine',f))+'  '+f).join('\n')+'\n';
function other(){if(given)return path.resolve(given);const me=fs.readFileSync(path.join(ROOT,'course-config.js'),'utf8').match(/id:'(mkt\d+)'/)[1];
  const cands=me==='mkt101'?['mkt301','n301']:['mkt101-cases','n101'];for(const c of cands){const p=path.resolve(ROOT,'..',c);if(fs.existsSync(path.join(p,'engine')))return p}return null}
const O=other();
if(check){let bad=0;const m=path.join(ROOT,'engine','MANIFEST');
  if(!fs.existsSync(m)||fs.readFileSync(m,'utf8')!==manifest(ROOT)){console.error('engine/ differs from engine/MANIFEST: run node tools/sync-engine.mjs to copy it to the other course and refresh the manifest');bad=1}
  if(O){const a=files(ROOT),b=files(O);if(a.join()!==b.join()){console.error('engine file lists differ:',a.join(' '),'vs',b.join(' '));bad=1}
    else for(const f of a)if(sha(path.join(ROOT,'engine',f))!==sha(path.join(O,'engine',f))){console.error('engine/'+f+' differs from '+O);bad=1}}
  if(!bad)console.log('engine OK'+(O?' (identical to '+O+')':' (manifest only: other repo not found)'));process.exit(bad)}
if(!O){console.error('Other repo not found: pass its path');process.exit(2)}
const od=path.join(O,'engine');for(const f of files(O))if(!files(ROOT).includes(f))fs.unlinkSync(path.join(od,f));
for(const f of files(ROOT))fs.copyFileSync(path.join(ROOT,'engine',f),path.join(od,f));
const m=manifest(ROOT);fs.writeFileSync(path.join(ROOT,'engine','MANIFEST'),m);fs.writeFileSync(path.join(od,'MANIFEST'),m);
console.log('engine copied to '+O+' ('+files(ROOT).length+' files)');
