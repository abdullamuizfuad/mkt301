/* MKT Arena engine: SVG avatars and the avatar builder.
   An avatar is a 10-character code (U.av, and board field 'a'): g sk hs hc ey of oc hg hp vl
   g f/m · sk skin 0-5 · hs hair 0-7 · hc hair colour 0-7 · ey eyes 0-3 · of outfit 0-5 · oc outfit colour 0-5 ·
   hg headgear 0 none 1 cap 2 beanie · hp headphones 0/1 · vl veil 0/1 (headphones and a veil can be worn together) ·
   ex expression 0-3 (optional 11th character; older 10-character codes read as 0) */
const AV={
  skin:['#f9d7c0','#f1c27d','#d9a066','#b97a4a','#8d5524','#5c3a21'],
  hairC:['#1d1a1a','#4a2c1d','#7b4a26','#c58b4b','#e8c27a','#a33b20','#8a8f98','#6b4fd8'],
  outfitC:['#3ee6c1','#6aa8ff','#ff6b9a','#ffc94d','#a98bff','#4fd88a'],
  hairN:['Short','Buzz','Curly','Side part','Long','Bun','Ponytail','Bob'],
  eyesN:['Dots','Happy','Bright','Glasses'],outfitN:['T-shirt','Hoodie','Shirt','Blazer','Sweater','Kurta'],skinN:['Light','Fair','Medium','Tan','Brown','Deep'],
  hgN:['None','Cap','Beanie'],exN:['Smile','Big grin','Calm','Wow'],hairCN:['Black','Dark brown','Brown','Light brown','Blonde','Auburn','Grey','Violet']};
const AV_DEFAULT='f220100000';
function avParse(code){const s=/^[fm][0-5][0-7][0-7][0-3][0-5][0-5][0-2][01][01][0-3]?$/.test(String(code||''))?String(code):AV_DEFAULT;
  return {g:s[0],sk:+s[1],hs:+s[2],hc:+s[3],ey:+s[4],of:+s[5],oc:+s[6],hg:+s[7],hp:+s[8],vl:+s[9],ex:+(s[10]||0)}}
const avCode=a=>a.g+a.sk+a.hs+a.hc+a.ey+a.of+a.oc+a.hg+a.hp+a.vl+(a.ex?a.ex:'');
/* a stable default for students who haven't built one: from their ID */
function avFor(sid){let h=0;for(const c of String(sid))h=(h*31+c.charCodeAt(0))>>>0;return (h%2?'f':'m')+(h%6)+((h>>3)%8)+((h>>6)%6)+((h>>9)%4)+((h>>11)%6)+((h>>14)%6)+'000'}
function avatarSVG(code,size,title){const a=avParse(code),sk=AV.skin[a.sk],hc=AV.hairC[a.hc],oc=AV.outfitC[a.oc],z=size||64,id='av'+Math.random().toString(36).slice(2,7);
  const dark='rgba(0,0,0,.18)';let back='',front='',top='';
  if(!a.vl){
    if(a.hs===4)back=`<path d="M27 44c0-20 10-29 23-29s23 9 23 29v30H27z" fill="${hc}"/>`;
    if(a.hs===6)back=`<path d="M66 38c10 6 12 20 6 30-2-8-5-12-9-14z" fill="${hc}"/>`;
    if(a.hs===7)back=`<path d="M28 46c0-19 9-28 22-28s22 9 22 28v14H28z" fill="${hc}"/>`;
    front=[`<path d="M31 41c0-15 8-23 19-23s19 8 19 23c-4-7-10-10-19-10s-15 3-19 10z" fill="${hc}"/>`,
      `<path d="M33 37c2-12 9-17 17-17s15 5 17 17c-5-4-11-6-17-6s-12 2-17 6z" fill="${hc}" opacity=".85"/>`,
      `<g fill="${hc}">${[[34,34],[40,27],[48,24],[56,25],[63,30],[67,37],[31,40]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="7"/>`).join('')}</g>`,
      `<path d="M31 42c0-16 8-24 19-24s19 8 19 22c-7-1-15-5-20-11-3 6-10 10-18 13z" fill="${hc}"/>`,
      `<path d="M30 46c0-18 8-27 20-27s20 9 20 27c-3-9-9-14-20-15-9 1-16 6-20 15z" fill="${hc}"/>`,
      `<circle cx="50" cy="15" r="8" fill="${hc}"/><path d="M31 41c0-15 8-23 19-23s19 8 19 23c-4-7-10-10-19-10s-15 3-19 10z" fill="${hc}"/>`,
      `<path d="M31 41c0-15 8-23 19-23s19 8 19 23c-4-7-10-10-19-10s-15 3-19 10z" fill="${hc}"/>`,
      `<path d="M29 48c0-19 9-29 21-29s21 10 21 29c-2-10-6-15-11-17-4 4-14 6-24 4-3 3-5 8-7 13z" fill="${hc}"/>`][a.hs]}
  const veil=a.vl?`<path d="M24 52c0-22 11-35 26-35s26 13 26 35c0 10-3 18-7 24H31c-4-6-7-14-7-24z" fill="${oc}"/><path d="M24 52c0-22 11-35 26-35s26 13 26 35c0 10-3 18-7 24H31c-4-6-7-14-7-24z" fill="${dark}" opacity=".35"/>`:'';
  const veilFront=a.vl?`<path d="M33 40c3-10 9-15 17-15s14 5 17 15c-2 2-3 2-3 2-2-7-7-11-14-11s-12 4-14 11c0 0-1 0-3-2z" fill="${oc}"/>`:'';
  const outfit=[`<path d="M18 100c2-16 14-24 32-24s30 8 32 24z" fill="${oc}"/>`,
    `<path d="M16 100c2-17 15-25 34-25s32 8 34 25z" fill="${oc}"/><path d="M38 77c3 7 8 10 12 10s9-3 12-10" stroke="${dark}" stroke-width="3" fill="none"/><path d="M45 86v8M55 86v8" stroke="#fff" stroke-width="1.6" opacity=".8"/>`,
    `<path d="M18 100c2-16 14-24 32-24s30 8 32 24z" fill="#f4f6fb"/><path d="M41 76l9 9 9-9-3 9-6 4-6-4z" fill="${oc}"/><path d="M50 85v15" stroke="${oc}" stroke-width="2"/>`,
    `<path d="M18 100c2-16 14-24 32-24s30 8 32 24z" fill="${oc}"/><path d="M42 77l8 23 8-23-8 5z" fill="#f4f6fb"/><path d="M42 77l4 14-6-2 2-12zM58 77l-4 14 6-2-2-12z" fill="${dark}"/>`,
    `<path d="M18 100c2-16 14-24 32-24s30 8 32 24z" fill="${oc}"/><path d="M22 90h56" stroke="#fff" stroke-width="3" opacity=".55"/><path d="M42 77c2 4 5 6 8 6s6-2 8-6" stroke="${dark}" stroke-width="2.5" fill="none"/>`,
    `<path d="M20 100c2-16 13-24 30-24s28 8 30 24z" fill="${oc}"/><path d="M50 79v21" stroke="${dark}" stroke-width="1.6"/>${[84,89,94].map(y=>`<circle cx="52.5" cy="${y}" r="1" fill="#fff"/>`).join('')}`][a.of];
  const eyes=[`<circle cx="43" cy="49" r="2.4" fill="#222"/><circle cx="57" cy="49" r="2.4" fill="#222"/>`,
    `<path d="M40 50q3-3 6 0M54 50q3-3 6 0" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    `<circle cx="43" cy="49" r="3.6" fill="#fff"/><circle cx="57" cy="49" r="3.6" fill="#fff"/><circle cx="43.6" cy="49.4" r="2.2" fill="#222"/><circle cx="57.6" cy="49.4" r="2.2" fill="#222"/><circle cx="44.3" cy="48.6" r=".7" fill="#fff"/><circle cx="58.3" cy="48.6" r=".7" fill="#fff"/>`,
    `<circle cx="43" cy="49" r="2.2" fill="#222"/><circle cx="57" cy="49" r="2.2" fill="#222"/><g stroke="#333" stroke-width="1.8" fill="rgba(255,255,255,.18)"><rect x="36.5" y="44" width="12" height="10" rx="3.5"/><rect x="51.5" y="44" width="12" height="10" rx="3.5"/></g><path d="M48.5 48h3" stroke="#333" stroke-width="1.8"/>`][a.ey];
  const lash=a.g==='f'&&a.ey!==3?`<path d="M39 46l-2-2M61 46l2-2" stroke="#222" stroke-width="1.4" stroke-linecap="round"/>`:'';
  const hg=a.hg===1?`<path d="M29 38c0-14 9-21 21-21s21 7 21 21z" fill="${oc}"/><path d="M29 38c0-14 9-21 21-21s21 7 21 21z" fill="${dark}" opacity=".3"/><path d="M50 38h26c0 3-3 5-8 5H50z" fill="${oc}"/><circle cx="50" cy="18" r="2" fill="${dark}"/>`
    :a.hg===2?`<path d="M28 40c0-16 10-25 22-25s22 9 22 25z" fill="${oc}"/><rect x="27" y="35" width="46" height="8" rx="4" fill="${oc}"/><rect x="27" y="35" width="46" height="8" rx="4" fill="${dark}" opacity=".35"/><circle cx="50" cy="13" r="4.5" fill="${oc}"/>`:'';
  const phones=a.hp?`<path d="M26 50c0-19 11-30 24-30s24 11 24 30" stroke="#2a2f3a" stroke-width="4" fill="none"/><rect x="21" y="45" width="9" height="15" rx="4" fill="#2a2f3a"/><rect x="70" y="45" width="9" height="15" rx="4" fill="#2a2f3a"/><rect x="22.5" y="47" width="6" height="11" rx="3" fill="${oc}"/><rect x="71.5" y="47" width="6" height="11" rx="3" fill="${oc}"/>`:'';
  return `<svg class="avsvg" viewBox="0 0 100 100" width="${z}" height="${z}" role="img" aria-label="${esc(title||'Avatar')}"><defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${id})">
  <rect width="100" height="100" fill="var(--card2,#26173f)"/>${veil}${back}${outfit}<rect x="44" y="64" width="12" height="14" rx="5" fill="${sk}"/><rect x="44" y="64" width="12" height="7" fill="${dark}" opacity=".5"/>
  <ellipse cx="50" cy="48" rx="18" ry="20" fill="${sk}"/>${a.vl?'':`<ellipse cx="32" cy="50" rx="3" ry="4.5" fill="${sk}"/><ellipse cx="68" cy="50" rx="3" ry="4.5" fill="${sk}"/>`}
  ${eyes}${lash}${[`<path d="M44 58q6 5 12 0" stroke="#7a2e2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,`<path d="M42 57q8 9 16 0z" fill="#7a2e2e"/><path d="M44 57.6h12" stroke="#fff" stroke-width="1.6"/>`,`<path d="M45 59h10" stroke="#7a2e2e" stroke-width="2.2" stroke-linecap="round"/>`,`<ellipse cx="50" cy="59.5" rx="3" ry="3.6" fill="#7a2e2e"/>`][a.ex]}<circle cx="38" cy="56" r="3" fill="#ff7a7a" opacity=".25"/><circle cx="62" cy="56" r="3" fill="#ff7a7a" opacity=".25"/>
  ${front}${veilFront}${hg}${phones}</g></svg>`}
const myAv=()=>U&&U.av?U.av:avFor(ME?ME.sid:'');

/* My profile (#/avatar): name, @username and the avatar builder */
ROUTES.avatar=()=>{const a=avParse(myAv());const opt=(k,names,label,vis)=>`<div class="avrow"><b class="lex">${label}</b><div class="avopts" role="group" aria-label="${label}">${names.map((n,i)=>`<button type="button" class="avo ${a[k]===i?'on':''}" data-k="${k}" data-v="${i}" aria-pressed="${a[k]===i}">${vis?vis(i):''}<span>${esc(n)}</span></button>`).join('')}</div></div>`;
  const sw=c=>`<i class="sw" style="background:${c}"></i>`;
  const nm=U.dn||ME.name;
  shell('#/',`<p><a href="#/">← Home</a></p><h1>My profile</h1><div class="card" id="pfname" style="margin-bottom:16px"><h2 style="margin:0">${esc(nm)}</h2><p class="muted" style="margin:2px 0 10px">${U.un?esc(U.un)+' · ':''}${esc(ME.sid)}${U.dg?' · '+esc(secLabel(U.dg)):''}</p>
  ${typeof CLOUD!=='undefined'&&CLOUD.rules2&&U.dn?`<button type="button" class="btn ghost sm" id="pfun">🪪 ${U.un?'Change my @username':'Pick my @username'}</button>`:'<p class="muted" style="font-size:.85rem;margin:0">Your official name and @username appear here once your lecturer adds the class list.</p>'}</div>
  <h2>Your avatar</h2><div class="grid g2 avb"><div class="card" style="text-align:center"><div id="avp">${avatarSVG(avCode(a),180,'Your avatar')}</div><p class="muted" style="font-size:.85rem">Shown on your home page, the leaderboard and in challenges.</p><button class="btn" id="avsave">Save avatar</button> <button class="btn ghost" id="avrand">🎲 Surprise me</button></div>
  <div class="card">${`<div class="avrow"><b class="lex">Character</b><div class="avopts" role="group" aria-label="Character"><button type="button" class="avo ${a.g==='f'?'on':''}" data-k="g" data-v="f" aria-pressed="${a.g==='f'}"><span>👧 Girl</span></button><button type="button" class="avo ${a.g==='m'?'on':''}" data-k="g" data-v="m" aria-pressed="${a.g==='m'}"><span>👦 Boy</span></button></div></div>`}
  ${opt('sk',AV.skinN,'Skin',i=>sw(AV.skin[i]))}${opt('hs',AV.hairN,'Hair style')}${opt('hc',AV.hairCN,'Hair colour',i=>sw(AV.hairC[i]))}${opt('ey',AV.eyesN,'Eyes')}${opt('ex',AV.exN,'Expression')}${opt('of',AV.outfitN,'Outfit')}
  <div class="avrow"><b class="lex">Colour</b><div class="avopts" role="group" aria-label="Outfit colour">${AV.outfitC.map((c,i)=>`<button type="button" class="avo ${a.oc===i?'on':''}" data-k="oc" data-v="${i}">${sw(c)}</button>`).join('')}</div></div>
  ${opt('hg',AV.hgN,'Headgear')}
  <div class="avrow"><b class="lex">Extras</b><div class="avopts"><button type="button" class="avo ${a.hp?'on':''}" data-k="hp" data-v="t" aria-pressed="${!!a.hp}"><span>🎧 Headphones</span></button><button type="button" class="avo ${a.vl?'on':''}" data-k="vl" data-v="t" aria-pressed="${!!a.vl}"><span>🧕 Veil</span></button></div></div></div></div>`);
  const draw=()=>{$('#avp').innerHTML=avatarSVG(avCode(a),180,'Your avatar');document.querySelectorAll('.avo').forEach(b=>{const k=b.dataset.k,v=b.dataset.v;const on=k==='g'?a.g===v:v==='t'?!!a[k]:a[k]===+v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})};
  document.querySelectorAll('.avo').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=b.dataset.v;if(k==='g')a.g=v;else if(v==='t')a[k]=a[k]?0:1;else a[k]=+v;draw()});
  $('#pfun')&&($('#pfun').onclick=()=>namePrompt(true));
  $('#avrand').onclick=()=>{const r=n=>Math.floor(Math.random()*n);Object.assign(a,{sk:r(6),hs:r(8),hc:r(8),ey:r(4),ex:r(4),of:r(6),oc:r(6),hg:r(3)});draw()};
  $('#avsave').onclick=()=>{const first=!U.av;U.av=avCode(a);save();if(first&&award('avatar:made',10,'Avatar created'))countOnce('avatar:made');hud();toast('🧑‍🎨','Avatar saved','');location.hash='#/'}};
