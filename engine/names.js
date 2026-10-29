/* MKT Arena engine: official names and @usernames (the lecturer's name policy).
   directory/{SID} = {n: official full name (Moodle), g: section (e.g. MKT301_H01), u?: username set by the lecturer}. Written only by the lecturer.
   Everyone appears under their official name; there are no hidden players. Each student picks an @username made of ONE word of
   their official name plus the last 3 digits of their ID (e.g. Hawwa Uyoon Ali, S089481 → @Uyoon481). U.dn/U.dg cache the directory entry,
   U.un is the username, U.nameOK the date they confirmed their name. */
const nameWords=n=>[...new Set(String(n||'').split(/[^A-Za-z]+/).filter(w=>w.length>=2&&w.length<=20))];
const unFor=(word,sid)=>'@'+word.charAt(0).toUpperCase()+word.slice(1)+String(sid).slice(-3);
const unOK=(un,sid,name)=>{const m=String(un||'').match(/^@([A-Za-z]{2,20})(\d{3})$/);return !!m&&m[2]===String(sid).slice(-3)&&(!name||nameWords(name).some(w=>w.toLowerCase()===m[1].toLowerCase()))};
/* what everyone sees for a student: official name (or their ID until the lecturer adds names) */
const showName=(n,sid)=>n||sid||'';
const nameLine=(n,u,sid)=>esc(showName(n,sid))+(u?` <span class="muted uname">· ${esc(u)}</span>`:'');
let DIR_ME=null;
async function dirLoad(){if(!ME||ME.sid===LECTURER||!(await rulesOK()))return;
  try{const d=await CLOUD.get('directory/'+ME.sid);DIR_ME=d||false;let ch=false;
    if(d&&d.n&&U.dn!==d.n){U.dn=String(d.n).slice(0,80);ch=true}if(d&&(d.g||'')!==(U.dg||'')){U.dg=String(d.g||'').slice(0,40);ch=true}
    if(d&&d.u&&U.un!==d.u){U.un=d.u;ch=true}/* the lecturer's choice wins */
    if(U.un&&U.dn&&!unOK(U.un,ME.sid,U.dn)&&!(d&&d.u===U.un)){U.un='';U.nameOK='';ch=true}
    if(ch){save();hud()}
    namePrompt()}catch(e){}}
onHook('preSync',async()=>{await rulesOK();await dirLoad()});
/* "Confirm your name" (once, and again when the lecturer adds names): shows the official name, picks the username */
function namePrompt(force){if(!ME||ME.sid===LECTURER||!U)return;if(!force&&typeof whatsNewDue==='function'&&whatsNewDue()){setTimeout(()=>namePrompt(),1500);return}/* What's new first */if(!force&&(U.nameOK&&U.un||(!U.dn&&U.nameLater===today())))return;if(document.querySelector('.modal')&&!force){setTimeout(()=>namePrompt(),1500);return}
  const words=nameWords(U.dn),cur=(U.un||'').replace(/^@|\d{3}$/g,'');
  const m=modal('Confirm your name',`<div style="text-align:center"><div style="font-size:2.2rem">🪪</div><h2 style="margin:4px 0 6px">Confirm your name</h2></div>
  ${U.dn?`<p style="text-align:center;margin:0 0 4px">Your name from the class list:</p><p class="lex" style="text-align:center;font-size:1.25rem;font-weight:700;margin:0 0 4px">${esc(U.dn)}</p><p class="muted" style="text-align:center;font-size:.85rem;margin:0 0 12px">${esc(ME.sid)} · this is how classmates see you on the leaderboard and in challenges.</p>
  <label>Pick your @username</label><p class="muted" style="font-size:.85rem;margin:0 0 6px">One part of your name, plus the last 3 digits of your ID.</p>
  <div class="avopts" role="radiogroup" aria-label="Username">${words.map((w,i)=>`<button type="button" class="avo ${(cur?cur.toLowerCase()===w.toLowerCase():i===0)?'on':''}" data-w="${esc(w)}"><span>${esc(unFor(w,ME.sid))}</span></button>`).join('')}</div>
  <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost sm" id="nmwrong">This isn't my name → tell my lecturer</button><button class="btn" id="nmok">✓ That's me</button></div>`
  :`<p style="text-align:center">Your lecturer hasn't added the class names yet, so classmates see your ID (<b>${esc(ME.sid)}</b>) for now.</p><p class="muted" style="text-align:center;font-size:.9rem">You'll be asked to confirm your name and pick an @username once they do.</p><div class="row" style="justify-content:center;margin-top:10px"><button class="btn" id="nmlater">OK</button></div>`}`);
  m.querySelector('.x').onclick=()=>{U.nameLater=today();save();closeModal()};
  if(!U.dn){$('#nmlater').onclick=()=>{U.nameLater=today();save();closeModal()};return}
  let pick=(m.querySelector('.avo.on')||{}).dataset;pick=pick&&pick.w;
  m.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{pick=b.dataset.w;m.querySelectorAll('[data-w]').forEach(x=>x.classList.toggle('on',x===b))});
  $('#nmok').onclick=()=>{if(!pick)return;U.un=unFor(pick,ME.sid);U.nameOK=today();save();closeModal();hud();toast('🪪','Welcome, '+U.un,'Your name is confirmed');if(location.hash.replace(/^#\/?/,'')==='')route()};
  $('#nmwrong').onclick=()=>{closeModal();reportPop('name:'+ME.sid,'My name on the class list','other','My name should be: ')}}

/* lecturer: paste the Moodle participants CSV ("First name","Last name","Email address",Groups) → directory/{SID} */
function parseCSV(t){const rows=[];let r=[],f='',q=false;t=String(t).replace(/^﻿/,'');
  for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===','||c==='\t'){r.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;r.push(f);f='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else f+=c}
  r.push(f);if(r.some(x=>x.trim()))rows.push(r);return rows}
function dirFromCSV(text){const rows=parseCSV(text);if(!rows.length)return [];const h=rows[0].map(x=>x.trim().toLowerCase());
  const fi=h.indexOf('first name'),li=h.indexOf('last name'),ei=h.findIndex(x=>x==='email address'||x==='email'),gi=h.findIndex(x=>x==='groups'||x==='group'),ni=h.findIndex(x=>x==='name'||x==='full name'),si=h.findIndex(x=>x==='id'||x==='student id');
  const out=[];for(const r of rows.slice(1)){const em=ei>=0?String(r[ei]||'').trim():'',m=em.match(/^(s\d{6})@student\.mnu\.edu\.mv$/i),sid=m?m[1].toUpperCase():si>=0&&/^S\d{6}$/i.test(String(r[si]||'').trim())?String(r[si]).trim().toUpperCase():'';
    if(!sid||sid===LECTURER)continue;const n=(ni>=0?String(r[ni]||''):[fi>=0?r[fi]:'',li>=0?r[li]:''].join(' ')).replace(/\s+/g,' ').trim().slice(0,80);if(!n)continue;
    out.push({sid,n,g:gi>=0?String(r[gi]||'').trim().slice(0,40):''})}
  return out}
lcard('dirc',el=>{rulesOK().then(ok=>{if(!ok)return;el.hidden=false;
  el.innerHTML=`<h2 style="margin:0">Class names</h2><p class="muted" style="font-size:.88rem;margin:6px 0 8px">Paste the Moodle participants export (CSV with "First name", "Last name", "Email address" and Groups). Students then appear under their official name, and pick an @username from it. Names live only in the class database, never in the site's code.</p>
  <textarea id="dirtx" style="min-height:90px" placeholder='"First name","Last name","Email address",Groups'></textarea><div class="row" style="margin-top:8px"><input type="file" id="dirf" accept=".csv,text/csv" style="max-width:100%;color:var(--ink2)"><button class="btn ghost" id="dirchk">Check</button><button class="btn" id="dirgo" disabled>Save names</button></div>
  <div id="dirout" style="margin-top:10px"></div><div id="dirlist" style="margin-top:10px"></div>`;
  let parsed=[];const show=()=>{parsed=dirFromCSV($('#dirtx').value);const secs={};parsed.forEach(p=>secs[p.g||'(no group)']=(secs[p.g||'(no group)']||0)+1);
    $('#dirout').innerHTML=parsed.length?`<p><b>${parsed.length}</b> students found${Object.keys(secs).length?' · '+Object.entries(secs).map(([g,n])=>esc(g)+' '+n).join(' · '):''}.</p>`:'<p class="err">No students found. Paste the CSV with its header row.</p>';$('#dirgo').disabled=!parsed.length};
  $('#dirchk').onclick=show;$('#dirtx').oninput=()=>{$('#dirgo').disabled=true};
  $('#dirf').onchange=async e=>{const f=e.target.files[0];if(f){$('#dirtx').value=await f.text();show()}};
  $('#dirgo').onclick=async()=>{$('#dirgo').disabled=true;let n=0,bad=0;for(const p of parsed){try{await CLOUD.put('directory/'+p.sid,{n:p.n,g:p.g,t:CLOUD.ts()},true);n++}catch(e){bad++}}
    $('#dirout').innerHTML=`<p>✓ Saved ${n} names${bad?` · ${bad} failed`:''}.</p>`;$('#dirtx').value=''};
  CLOUD.watch('directory',{},list=>{const l=$('#dirlist');if(!l)return;l.innerHTML=list.length?`<details><summary class="click"><b>${list.length}</b> names saved</summary><div class="tablewrap"><table><tr><th>ID</th><th>Name</th><th>Section</th><th>Username set by you</th></tr>${list.sort((a,b)=>a.n<b.n?-1:1).map(d=>`<tr class="click" data-sid="${esc(d.id)}"><td>${esc(d.id)}</td><td>${esc(d.n)}</td><td>${esc(d.g||'')}</td><td>${esc(d.u||'')}</td></tr>`).join('')}</table></div></details>`:'<p class="muted">No names saved yet.</p>';
    l.querySelectorAll('tr[data-sid]').forEach(r=>r.onclick=()=>openStudent(r.dataset.sid))},()=>{})})});
/* lecturer: change one student's name or username (from their profile) */
function nameEditHTML(sid,u){return `<div class="card psec" id="nme" data-need="rules"><h2>Name and username</h2><p class="muted" style="font-size:.85rem;margin:0 0 6px">Overrides the class list for this student. The username must be one word of the name plus ${esc(String(sid).slice(-3))}.</p>
  <label for="nmn">Official name</label><input type="text" id="nmn" maxlength="80" value="${esc((u&&u.dn)||'')}"><label for="nmu">Username</label><input type="text" id="nmu" maxlength="24" value="${esc((u&&u.un)||'')}" placeholder="@Name${esc(String(sid).slice(-3))}">
  <div class="row" style="margin-top:8px"><button class="btn sm" id="nmsave" data-sid="${esc(sid)}">Save</button><span class="err" id="nmerr"></span></div></div>`}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('#nmsave');if(!b)return;const sid=b.dataset.sid,n=$('#nmn').value.replace(/\s+/g,' ').trim().slice(0,80),u=$('#nmu').value.trim();
  if(u&&!unOK(u,sid,n)){$('#nmerr').textContent='Username must be @ + one word of the name + '+sid.slice(-3)+'.';return}
  b.disabled=true;try{await CLOUD.put('directory/'+sid,Object.assign({n,t:CLOUD.ts()},u?{u}:{u:CLOUD.noField()}),true);toast('🪪','Saved',n);$('#nmerr').textContent=''}catch(x){$('#nmerr').textContent=CLOUD.say(x)}b.disabled=false});
/* students who used to be "Hidden player": tell them once (as a message on their home page) */
onHook('afterLoad',()=>{if(!U||!U.hide||U.hideNote)return;U.hideNote=today();U.notes=U.notes||{};
  U.notes['note_hidden_off']={fb:'Leaderboard update: "Hidden player" has been retired. Everyone in the class now appears under their name from the class list, with an @username you pick from your name (as on Moodle).',at:new Date().toISOString()};save()});
