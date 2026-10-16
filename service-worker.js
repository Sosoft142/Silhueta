const VERSION='silhueta-app-v1.3.1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put('./index.html',copy)).catch(()=>{});}return res;}).catch(()=>caches.match('./index.html')));
 }else event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});