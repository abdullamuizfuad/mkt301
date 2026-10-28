/* MKT301 Arena service worker: works offline, but always tries the network first so updates arrive.
   Bump CACHE when the list of files changes; old caches are deleted on activate. */
const CACHE='mkt301-v5';
const CORE=['./','index.html','install.js','presence.js','cases.js','case-cbtl.js','case-tuna.js','bank-b.js','bank-c.js','concepts.js','roster.js','leaderboard.js',
  'vendor/firebase.js','cloud.js','manifest.webmanifest','assets/favicon.svg','assets/icon-192.png','assets/icon-512.png','assets/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin!==location.origin){ // Google Fonts: cache-first
    if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{c.put(r,res.clone());return res}))));
    return}
  // same origin: network first (skipping the browser's HTTP cache), fall back to the cache when offline
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))))});
