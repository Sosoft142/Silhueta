const VERSION='silhueta-app-v2.9.7';
const CACHE_PREFIX='silhueta-app-v';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/brand-mark.svg','./icons/icon.svg','./icons/apple-touch-icon-v21.png','./icons/icon-192-v21.png','./icons/icon-512-v21.png','./icons/icon-maskable-512-v21.png'];
const APP_SCOPE=new URL(self.registration.scope);
const MANIFEST_URL=new URL('./manifest.webmanifest',APP_SCOPE).href;
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
async function networkFirst(request,cacheKey,fetchOptions){
  const cache=await caches.open(VERSION);
  try{
    const response=await fetch(request,fetchOptions);
    if(response.ok){await cache.put(cacheKey,response.clone()).catch(()=>{});return response;}
    return (await cache.match(cacheKey))||response;
  }catch(error){return (await cache.match(cacheKey))||Response.error();}
}
self.addEventListener('fetch',e=>{
  const req=e.request;
  const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==APP_SCOPE.origin||!url.pathname.startsWith(APP_SCOPE.pathname))return;
  if(url.pathname===new URL(MANIFEST_URL).pathname){
    // Installed WebAPKs may still request an older versioned URL. Always refresh
    // installation metadata from the network and keep one canonical offline copy.
    e.respondWith(networkFirst(req,MANIFEST_URL,{cache:'no-store'}));
  }else if(req.mode==='navigate'){
    e.respondWith(networkFirst(req,new URL('./index.html',APP_SCOPE).href));
  } else {
    e.respondWith(caches.open(VERSION).then(async cache=>(await cache.match(req))||fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone()).catch(()=>{});return res;})));
  }
});
