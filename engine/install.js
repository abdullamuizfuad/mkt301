/* Install as an app: shows steps for the student's own device (iPhone/iPad, Android, computer).
   Opens once after the first-time tour (or on the next visit for students who already saw it),
   and from "📲 Install the app" in the footer. Skipped when already running as an installed app. */
const APP_NAME=CRS.name;
let DEFER=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();DEFER=e});
addEventListener('appinstalled',()=>{DEFER=null;try{U.inst=2;save()}catch(e){}closeModal();toast('📲','Installed',`Open ${APP_NAME} from your home screen`)});
function isApp(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function device(){const u=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1);
  if(ios)return {os:'ios',br:/CriOS/.test(u)?'chrome':/FxiOS/.test(u)?'firefox':/EdgiOS/.test(u)?'edge':'safari',pad:/iPad/.test(u)||/Macintosh/.test(u)};
  if(/Android/.test(u))return {os:'android',br:/SamsungBrowser/.test(u)?'samsung':/Firefox/.test(u)?'firefox':/EdgA/.test(u)?'edge':'chrome'};
  return {os:'desktop',br:/Edg\//.test(u)?'edge':/Firefox\//.test(u)?'firefox':/Chrome\//.test(u)?'chrome':/Safari\//.test(u)?'safari':'other'}}
const SHARE_ICO='<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
function installSteps(d){
  if(d.os==='ios'){
    if(d.br==='firefox')return {t:'iPhone · Firefox',s:['Open this page in <b>Safari</b> (Firefox on iPhone can\'t add apps to the home screen).','In Safari, tap the Share button '+SHARE_ICO+', then <b>Add to Home Screen</b>, then <b>Add</b>.']};
    if(d.br==='safari')return {t:(d.pad?'iPad':'iPhone')+' · Safari',s:['Tap the <b>Share</b> button '+SHARE_ICO+(d.pad?' at the top of the screen.':' at the bottom of the screen.'),'Scroll down and tap <b>Add to Home Screen</b> ➕.',`Check the name says <b>${APP_NAME}</b>, then tap <b>Add</b>.`]};
    return {t:(d.pad?'iPad':'iPhone')+' · '+(d.br==='edge'?'Edge':'Chrome'),s:['Tap the <b>Share</b> button '+SHARE_ICO+' in the address bar (top right).','Tap <b>Add to Home Screen</b>, then <b>Add</b>.','Don\'t see it? Open this page in <b>Safari</b> and use Share → Add to Home Screen.']}}
  if(d.os==='android'){
    if(d.br==='samsung')return {t:'Android · Samsung Internet',s:['Tap the menu <b>≡</b> (bottom right).','Tap <b>Add page to</b> → <b>Home screen</b>.','Tap <b>Add</b>.']};
    if(d.br==='firefox')return {t:'Android · Firefox',s:['Tap the menu <b>⋮</b>.','Tap <b>Install</b> (or <b>Add to Home screen</b>).','Tap <b>Add</b>.']};
    return {t:'Android · '+(d.br==='edge'?'Edge':'Chrome'),s:['Tap the menu <b>⋮</b> (top right).','Tap <b>Install app</b> (or <b>Add to Home screen</b>).','Tap <b>Install</b>.']}}
  if(d.br==='safari')return {t:'Mac · Safari',s:['In the menu bar, choose <b>File</b> → <b>Add to Dock</b>.','Click <b>Add</b>.']};
  if(d.br==='chrome'||d.br==='edge')return {t:'Computer · '+(d.br==='edge'?'Edge':'Chrome'),s:['Click the <b>install icon</b> at the right end of the address bar,','or open the menu <b>⋮</b> and choose <b>Install '+APP_NAME+'</b> (in Chrome: <b>Cast, save and share</b> → <b>Install page as app</b>).']};
  return {t:'This browser',s:['Open this page in <b>Chrome</b>, <b>Edge</b> or <b>Safari</b> to install it as an app.']}}
function installPop(auto){
  if(auto&&(isApp()||U.inst))return;
  closeModal();const d=device(),st=installSteps(d),m=document.createElement('div');m.className='modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Install the app');
  const done=()=>{U.inst=U.inst||1;save();closeModal()};
  m.innerHTML=`<div class="card"><button class="x" aria-label="Close">✕</button><div style="font-size:2.4rem;text-align:center;margin-top:4px">📲</div>
  <h2 style="text-align:center;margin:4px 0 6px">Install ${APP_NAME}</h2>
  ${isApp()?`<p style="text-align:center">You're already using the app. 🎉</p>`:`<p class="muted" style="text-align:center;margin:0 0 12px">Get it on your home screen: opens full screen in one tap, like any app.</p>
  ${DEFER?`<button class="btn" id="inow" style="width:100%">📲 Install now</button><p class="muted" style="text-align:center;font-size:.82rem;margin:8px 0 4px">or follow these steps:</p>`:''}
  <p style="font:700 .75rem Lexend;letter-spacing:.06em;color:var(--muted);margin:10px 0 4px">${esc(st.t).toUpperCase()}</p>
  <ol style="padding-left:1.3em;margin:0 0 10px">${st.s.map(x=>`<li style="margin-bottom:6px">${x}</li>`).join('')}</ol>
  ${d.os==='ios'?`<p class="callout" style="font-size:.86rem">The app keeps its own sign-in, so sign in once inside it. Your progress follows you.</p>`:''}`}
  <div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" id="ilater">${isApp()?'Close':'Maybe later'}</button>${isApp()?'':'<button class="btn" id="idone">Done</button>'}</div></div>`;
  document.body.append(m);m.querySelector('.x').onclick=done;m.onclick=e=>{if(e.target===m)done()};$('#ilater').onclick=done;$('#idone')&&($('#idone').onclick=done);
  $('#inow')&&($('#inow').onclick=async()=>{const e=DEFER;DEFER=null;e.prompt();try{const r=await e.userChoice;if(r.outcome==='accepted'){U.inst=2;save()}}catch(x){}closeModal()})}
