import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';

const root=process.cwd(),output=path.join(root,'qa/pwa-audit-output');
await mkdir(output,{recursive:true});
const [html,worker,legacyWorker,legacyManifest]=await Promise.all(['index.html','service-worker.js','qa/fixtures/service-worker-2.9.3.js','qa/fixtures/manifest-2.9.3.webmanifest'].map(p=>readFile(path.join(root,p),'utf8')));
const manifest=JSON.parse(await readFile(path.join(root,'manifest.webmanifest'),'utf8'));
const version=html.match(/const APP_VERSION='([^']+)'/)[1],cacheName='silhueta-app-v'+version;
let phase='legacy',manifestRevision='',manifestRequests=0;
const results=[],runtimeErrors=[],profiles=[],contexts=new Set(),pendingRequests=new Set();let context,browserVersion='';
async function deadline(promise,label,ms=10000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' did not respond within '+ms+'ms')),ms);})]);}finally{clearTimeout(timer);}}
async function readyApp(page){await page.locator('#main h1').waitFor({state:'visible'});}
async function check(name,fn){
 console.log('SILHUETA_PWA_CHECK_START '+name);let timer,timedOut=false;
 try{const detail=await Promise.race([fn(),new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;reject(new Error('Diagnostic exceeded 45 seconds: '+name));},45000);})]);results.push({name,status:'pass',...detail});}
 catch(error){results.push({name,status:'fail',error:error.message,pendingRequests:[...pendingRequests].map(r=>({url:r.url(),type:r.resourceType()}))});if(timedOut)throw error;}
 finally{clearTimeout(timer);console.log('SILHUETA_PWA_CHECK '+JSON.stringify(results.at(-1)));}
}
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),prefix='/Silhueta/';
  if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
  const name=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html',file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  let bytes;
  if(name==='index.html')bytes=phase==='legacy'?html.replace('href="./manifest.webmanifest"','href="./manifest.webmanifest?v=2.9.3"'):html;
  else if(name==='manifest.webmanifest'){manifestRequests++;bytes=phase==='legacy'?legacyManifest:JSON.stringify({...manifest,...(manifestRevision?{description:manifestRevision}:{})});}
  else if(name==='service-worker.js')bytes=phase==='legacy'?legacyWorker:worker;
  else bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(4174,resolve));
const base='http://localhost:4174/Silhueta/',origin=new URL(base).origin;
const seed={version:7,meta:{historyMigratedV23:true},profile:{startDate:'2026-10-01'},macros:{},measurements:{},metricEntries:{m_pwa_test:{metric:'weight',value:75,date:'2026-10-20',note:'Synthetic PWA migration record',updatedAt:'2026-10-20T12:00:00.000Z'}}};
async function openProfile(options={}){
 const dir=await mkdtemp(path.join(os.tmpdir(),'silhueta-pwa-'));profiles.push(dir);
 const ctx=await chromium.launchPersistentContext(dir,{headless:true,locale:'pt-BR',...(process.env.PWA_CHROME_CHANNEL?{channel:process.env.PWA_CHROME_CHANNEL}:{}),...options});
 contexts.add(ctx);
 browserVersion=ctx.browser()?.version()||browserVersion;
 await ctx.route('https://api.github.com/**',route=>route.abort());
 await ctx.addInitScript(data=>{if(!localStorage.getItem('silhueta.app.v1'))localStorage.setItem('silhueta.app.v1',JSON.stringify(data));},seed);
 const page=ctx.pages()[0]||await ctx.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>runtimeErrors.push(e.message));
 page.on('request',r=>pendingRequests.add(r));page.on('requestfinished',r=>pendingRequests.delete(r));page.on('requestfailed',r=>pendingRequests.delete(r));
 // A service worker and Chrome's background installation checks need not be idle
 // for the page to be usable. Check the rendered app and worker explicitly.
 await page.goto(base,{waitUntil:'domcontentloaded'});await readyApp(page);return{ctx,page};
}
async function manifestSnapshot(page,includeInstallability=false){
 const cdp=await deadline(page.context().newCDPSession(page),'Create CDP session');
 const command=name=>deadline(cdp.send(name),name);
 try{await command('Page.enable');const data={manifest:await command('Page.getAppManifest'),identity:await command('Page.getAppId')};if(includeInstallability)data.installability=await command('Page.getInstallabilityErrors');return data;}finally{await deadline(cdp.detach(),'Detach CDP session',5000).catch(()=>{});}
}
async function waitForWorker(page){
 await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.active?.state==='activated';});
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
}
let legacy,current,published={};
try{
 const opened=await openProfile();context=opened.ctx;const page=opened.page;
 await check('Legacy manifest identity is captured by Chromium',async()=>{legacy=await manifestSnapshot(page);assert.equal(legacy.manifest.errors.length,0);assert(legacy.identity.appId,'Chromium did not compute the legacy App ID');return{identity:legacy.identity,manifestUrl:legacy.manifest.url};});
 await check('Service worker 2.9.3 upgrades without losing records or other projects caches',async()=>{
  await waitForWorker(page);
  await page.evaluate(async()=>{const c=await caches.open('another-project-cache');await c.put('/another-project-marker',new Response('preserve'));});
  phase='current';await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async name=>{const keys=await caches.keys();return keys.includes(name)&&!keys.includes('silhueta-app-v2.9.3');},cacheName);
  await page.reload({waitUntil:'domcontentloaded'});await readyApp(page);
  const info=await page.evaluate(async()=>({scope:(await navigator.serviceWorker.ready).scope,updateViaCache:(await navigator.serviceWorker.ready).updateViaCache,keys:await caches.keys(),saved:JSON.parse(localStorage.getItem('silhueta.app.v1')).metricEntries.m_pwa_test}));
  assert.equal(info.scope,base);assert.equal(info.updateViaCache,'none');assert(info.keys.includes('another-project-cache'));assert.equal(info.saved.value,75);assert.equal(info.saved.note,seed.metricEntries.m_pwa_test.note);assert.equal(info.saved.date,'2026-10-20');return info;
 });
 phase='current';
 await check('Canonical manifest parses and preserves the original native App ID',async()=>{
  await page.reload({waitUntil:'domcontentloaded'});await readyApp(page);current=await manifestSnapshot(page);assert.equal(current.manifest.url,base+'manifest.webmanifest');assert.equal(current.manifest.errors.length,0);
  assert.equal(JSON.parse(current.manifest.data).id,'/Silhueta/index.html');assert.equal(current.identity.appId,legacy?.identity.appId,'Adding explicit id changed the installed application identity');return{identity:current.identity,manifestUrl:current.manifest.url};
 });
 await check('Desktop Chromium reports no installability errors',async()=>{const data=await manifestSnapshot(page,true);assert.deepEqual(data.installability.installabilityErrors,[]);return data.installability;});
 await check('Installation PNG icons have the declared dimensions',async()=>{
  const images=[];for(const icon of manifest.icons.filter(x=>x.type==='image/png')){const response=await fetch(new URL(icon.src,base));assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(1,4).toString(),'PNG');const size=bytes.readUInt32BE(16)+'x'+bytes.readUInt32BE(20);assert.equal(size,icon.sizes);images.push({src:icon.src,contentType:response.headers.get('content-type'),size});}return{images};
 });
 await check('A stale cached manifest cannot hide fresh installation metadata',async()=>{
  await page.evaluate(async({name,url})=>{const c=await caches.open(name);await c.put(url,new Response(JSON.stringify({name:'Stale synthetic manifest',id:'/wrong-old-id'}),{headers:{'Content-Type':'application/manifest+json'}}));},{name:cacheName,url:base+'manifest.webmanifest'});
  const before=manifestRequests;manifestRevision='Fresh PWA diagnostic revision 1';
  const data=await page.evaluate(async()=>fetch('./manifest.webmanifest').then(r=>r.json()));assert.equal(data.id,manifest.id);assert.equal(data.description,manifestRevision);assert(manifestRequests>before,'Worker served stale cached metadata without a network check');
  manifestRevision='Fresh PWA diagnostic revision 2';const updated=await page.evaluate(async()=>fetch('./manifest.webmanifest').then(r=>r.json()));assert.equal(updated.description,manifestRevision);return{networkRequests:manifestRequests-before};
 });
 await check('Legacy versioned manifest URLs receive current metadata',async()=>{
  const aliases=['2','21','29','291','292','2.9.3'];for(const alias of aliases){const data=await page.evaluate(async version=>fetch('./manifest.webmanifest?v='+version).then(r=>r.json()),alias);assert.equal(data.id,manifest.id);assert.equal(data.description,manifestRevision);}return{aliases};
 });
 await check('Offline navigation and manifest fallback preserve the saved history',async()=>{
  try{await context.setOffline(true);const data=await page.evaluate(async()=>fetch('./manifest.webmanifest?v=2.9.3').then(r=>r.json()));assert.equal(data.id,manifest.id);assert.equal(data.description,manifestRevision);await page.reload({waitUntil:'domcontentloaded'});await page.locator('#main h1').waitFor();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('silhueta.app.v1')).metricEntries.m_pwa_test);assert.equal(saved.value,75);assert.equal(saved.note,seed.metricEntries.m_pwa_test.note);return{value:saved.value,date:saved.date};}finally{await context.setOffline(false);}
 });
 await check('Root and index entry URLs resolve to the same application identity',async()=>{await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});await readyApp(page);const data=await manifestSnapshot(page);assert.equal(data.identity.appId,legacy?.identity.appId);return data.identity;});
 await check('Release updates never change installation identity or manifest location',async()=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'silhueta-release-'));
  try{await mkdir(path.join(temp,'scripts'));for(const name of ['index.html','service-worker.js','manifest.webmanifest','README.md','scripts/release.mjs'])await cp(path.join(root,name),path.join(temp,name));execFileSync(process.execPath,[path.join(temp,'scripts/release.mjs'),'patch']);execFileSync(process.execPath,[path.join(temp,'scripts/release.mjs'),'--check']);const updated=await readFile(path.join(temp,'index.html'),'utf8');assert(updated.includes('<link rel="manifest" href="./manifest.webmanifest" />'));assert.deepEqual(JSON.parse(await readFile(path.join(temp,'manifest.webmanifest'),'utf8')),manifest);return{stableId:manifest.id};}finally{await rm(temp,{recursive:true,force:true});}
 });
 await context.close();context=null;
 await check('Chromium Android emulation also parses the manifest and reports no installability errors',async()=>{
  const mobile=await openProfile({...devices['Pixel 7']});try{await waitForWorker(mobile.page);const data=await manifestSnapshot(mobile.page,true);assert.equal(data.manifest.errors.length,0);assert.equal(data.identity.appId,legacy?.identity.appId);assert.deepEqual(data.installability.installabilityErrors,[]);return{identity:data.identity,installability:data.installability};}finally{await mobile.ctx.close();}
 });
 try{const page=await fetch('https://sosoft142.github.io/Silhueta/',{signal:AbortSignal.timeout(15000)}),text=await page.text(),manifestResponse=await fetch('https://sosoft142.github.io/Silhueta/manifest.webmanifest',{signal:AbortSignal.timeout(15000)}),remote=await manifestResponse.json();published={status:page.status,version:text.match(/const APP_VERSION='([^']+)'/)?.[1],manifestHref:text.match(/<link rel="manifest" href="([^"]+)"/)?.[1],manifestStatus:manifestResponse.status,manifestContentType:manifestResponse.headers.get('content-type'),id:remote.id||null};}catch(error){published={error:error.message};}
}catch(error){results.push({name:'Audit execution',status:'fail',error:error.stack});}
finally{
 for(const ctx of contexts)await ctx.close().catch(()=>{});server.closeAllConnections();await new Promise(resolve=>server.close(resolve));for(const dir of profiles)await rm(dir,{recursive:true,force:true});
 results.push({name:'No page runtime errors during PWA checks',status:runtimeErrors.length?'fail':'pass',errors:runtimeErrors});
 const report={testedSource:process.env.GITHUB_SHA||'local',browser:browserVersion,channel:process.env.PWA_CHROME_CHANNEL||'chromium',environment:'Persistent isolated browser profiles, desktop and Pixel 7 emulation; no physical Android WebAPK installer; synthetic local records only',version,summary:{total:results.length,passed:results.filter(x=>x.status==='pass').length,failed:results.filter(x=>x.status==='fail').length},results,published};
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log('SILHUETA_PWA_AUDIT_JSON '+JSON.stringify(report));process.exitCode=report.summary.failed?1:0;
}
