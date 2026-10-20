const VERSION='silhueta-app-v2.9.0';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon.svg','./icons/apple-touch-icon-v21.png','./icons/icon-192-v21.png','./icons/icon-512-v21.png','./icons/icon-maskable-512-v21.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(cache=>cache.put('./index.html',copy)).catch(()=>{});}return res;}).catch(()=>caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(cache=>cache.put(req,copy)).catch(()=>{});}return res;})));
  }
});
