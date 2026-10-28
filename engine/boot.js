/* engine boot: runs after every script has loaded */
$('#hud').onclick=e=>{if(e.target.closest('#svb'))openSave()};
$('#tbtn').onclick=()=>theme(LS.get('theme','dark')==='light'?'dark':'light');
theme();
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-noteread]');if(!b||!U)return;U.notesRead=U.notesRead||{};U.notesRead[b.dataset.noteread]=1;save();route()});
CLOUD.onStatus(()=>{const e=$('#sync');if(e)e.outerHTML=syncChip()});
addEventListener('hashchange',route);
start();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{}));
