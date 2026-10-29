/* MKT301 Arena service worker (scope: /mkt301/): works offline, but always tries the network first so updates arrive.
   Bump CACHE when the list of files changes; old MKT301 caches are deleted on activate (other sites' caches, such as MKT101's on the same origin, are left alone). */
const CACHE='mkt301-v12';
const CORE=['./','index.html','engine/engine.css','engine/concepts.js','engine/cloud.js','engine/install.js','engine/coverage.js','engine/presence.js','engine/core.js','engine/feat.js','engine/avatar.js','engine/names.js','engine/dash.js','engine/paper.js','engine/social.js','engine/qbank.js','engine/reports.js','engine/release.js','engine/simple.js','engine/boot.js','course-config.js','course.js','course.css','cloud-config.js','cases.js','case-cbtl.js','case-tuna.js','bank-b.js','bank-c.js',
  'roster.js','leaderboard.js','vendor/firebase.js','manifest.webmanifest','assets/favicon.svg','assets/icon-192.png','assets/icon-512.png','assets/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mkt301-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin!==location.origin){ // Google Fonts: cache-first
    if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());return res}))));
    return}
  // same origin: network first (skipping the browser's HTTP cache), fall back to the cache when offline
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))))});
/* phone notifications (docs/PUSH.md): show the message; a tap opens the page it points to */
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={title:'MKT Arena',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'MKT Arena',{body:d.body||'',icon:'assets/apple-touch-icon.png',badge:'assets/favicon.svg',data:{url:d.url||'./'},tag:d.tag||undefined}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{const w=ws.find(x=>x.url.startsWith(self.registration.scope));if(w){w.navigate(url);return w.focus()}return clients.openWindow(url)}))});
