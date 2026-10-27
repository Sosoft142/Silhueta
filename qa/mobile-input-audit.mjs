
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash, webcrypto } from 'node:crypto';
import { chromium } from 'playwright';

const root=process.cwd(),output=path.join(root,'qa/mobile-audit-output');
await mkdir(output,{recursive:true});
const results=[],shots=[],runtimeErrors=[];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const emptyState=()=>({version:7,meta:{updatedAt:'2026-10-20T12:00:00.000Z',lastSyncAt:'',syncState:'local-only',historyMigratedV23:true},profile:{age:null,height:null,baselineWeight:null,startDate:'',months:12,hormoneMonths:null,workoutsPlanned:null,goalWeight:null,goalWaist:null,goalHip:null},macros:{protein:null,carbs:null,fat:null,calorieReference:null},measurements:{},metricEntries:{},preferences:{favoriteMetrics:['weight','waist','hip'],quickMetrics:['weight','waist','hip']},nutritionLogs:{}});
function filledState(){const s=emptyState();s.profile.startDate='2026-10-01';s.macros={protein:120,carbs:220,fat:60,calorieReference:1900};for(const [id,metric,value,date]of [['m_test_weight_old','weight',75,'2026-10-01'],['m_test_weight_new','weight',74.5,'2026-10-20'],['m_test_waist_old','waist',85,'2026-10-01'],['m_test_waist_new','waist',84.5,'2026-10-20'],['m_test_hip_old','hip',102,'2026-10-01'],['m_test_hip_new','hip',102.5,'2026-10-20']])s.metricEntries[id]={metric,value,date,note:'Registro fictício de teste',updatedAt:date+'T12:00:00.000Z'};s.nutritionLogs={'0':{calories:1900,workouts:3,cardio:90,sleep:7.5,notes:'Registro fictício de teste'}};return s;}
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.env.PWA_CHROME_CHANNEL?{channel:process.env.PWA_CHROME_CHANNEL}:{})});
async function openPage(width=390,seed=emptyState(),acceptDialogs=false){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<=850,hasTouch:width<=850,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
 await context.route('https://api.github.com/**',route=>route.abort());
 await context.addInitScript(data=>{if(!localStorage.getItem('silhueta.app.v1'))localStorage.setItem('silhueta.app.v1',JSON.stringify(data));},seed);
 const page=await context.newPage(),errors=[],dialogs=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});page.on('dialog',async d=>{dialogs.push(d.message());acceptDialogs?await d.accept():await d.dismiss();});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});return{context,page,errors,dialogs};
}
async function go(page,view){let link=page.locator('[data-action="go"][data-view="'+view+'"]:visible').first();if(!(await link.count())){await page.locator('[data-action="openDrawer"]:visible').first().click();link=page.locator('#mobileDrawer [data-view="'+view+'"]:visible').first();}await link.click();await page.waitForTimeout(200);}
async function state(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('silhueta.app.v1')));}
const TEST_GIST_ID='0123456789abcdef0123456789abcdef',TEST_GIST_TOKEN='silhueta-synthetic-token-not-a-credential';
const SYNC_CONFIRM_KEY='silhueta.ui.lastSyncConfirmation',QUICK_METRIC_KEY='silhueta.ui.quickMetric';
async function fixtureKey(salt,iterations){const material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(TEST_GIST_TOKEN),'PBKDF2',false,['deriveKey']);return webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function encryptedFixture(data){const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12)),iterations=100000,key=await fixtureKey(salt,iterations),plain=new TextEncoder().encode(JSON.stringify({app:'Silhueta',data})),ciphertext=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);return{format:'silhueta-gist-encrypted-v1',algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations,salt:Buffer.from(salt).toString('base64'),iv:Buffer.from(iv).toString('base64'),ciphertext:Buffer.from(ciphertext).toString('base64')};}
async function decryptedFixture(envelope){const key=await fixtureKey(Buffer.from(envelope.salt,'base64'),envelope.iterations),raw=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(envelope.iv,'base64')},key,Buffer.from(envelope.ciphertext,'base64'));return JSON.parse(new TextDecoder().decode(raw)).data;}
async function mockGist(context,data){
 const mock={envelope:await encryptedFixture(data),mode:'valid',patches:0,requests:[]};
 // These synthetic requests never leave the browser test context.
 await context.route('https://api.github.com/**',async route=>{
  const req=route.request(),url=new URL(req.url());mock.requests.push(req.method()+' '+url.pathname);
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, PATCH, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type, x-github-api-version, accept'};
  if(req.method()==='OPTIONS'&&url.pathname==='/gists/'+TEST_GIST_ID){await route.fulfill({status:204,headers});return;}
  if(url.pathname!=='/gists/'+TEST_GIST_ID||!['GET','PATCH'].includes(req.method())){await route.abort();return;}
  if(req.method()==='PATCH'){mock.patches++;mock.envelope=JSON.parse(req.postDataJSON().files['silhueta.enc.json'].content);}
  const envelope=mock.mode==='valid'?mock.envelope:{format:'invalid-synthetic-backup'};
  await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({id:TEST_GIST_ID,files:{'silhueta.enc.json':{content:JSON.stringify(envelope),truncated:false}}})});
 });return mock;
}
async function startMockSync(page,{remember=false}={}){
 await page.evaluate(id=>localStorage.setItem('silhueta.gist.id.v1',id),TEST_GIST_ID);
 await page.locator('.sync-trigger').click();await page.locator('#gistToken').fill(TEST_GIST_TOKEN);await page.locator('#gistRemember').setChecked(remember);await page.locator('#syncMainButton').click();
}
async function waitSyncSuccess(page){await page.waitForFunction(()=>document.getElementById('syncState').classList.contains('sync-ok'));}
async function formGeometry(page,label,pairs=[]){
 const data=await page.evaluate(pairs=>{
  const rect=el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=el=>el.getClientRects().length&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
  const forms=Array.from(document.querySelectorAll('#main form')).filter(visible),issues=[],grids=[],controls=[];
  for(const form of forms){
   const bounds=rect(form),items=Array.from(form.querySelectorAll('input:not([type="hidden"]),select,textarea,button')).filter(visible);
   for(const el of items){const r=rect(el),name=el.id||el.textContent.trim();controls.push({name,...r});
    if(r.left<bounds.left-1||r.right>bounds.right+1)issues.push(name+' exceeds '+form.id+' width');
    if(el.scrollWidth>el.clientWidth+2&&el.tagName==='BUTTON')issues.push(name+' clips its content');
    if(r.height<40)issues.push(name+' has a compressed control height');
   }
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=rect(items[i]),b=rect(items[j]);
    if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push('Overlapping controls: '+(items[i].id||items[i].textContent.trim())+' / '+(items[j].id||items[j].textContent.trim()));
   }
   for(const grid of form.querySelectorAll('.form-grid,.quick-fields,.batch-metrics')){
    if(!visible(grid))continue;const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    const fields=Array.from(grid.children).filter(el=>el.classList.contains('field')&&visible(el));
    // A field may span several columns. Compare fields that actually share a
    // rendered row instead of assuming a fixed number of items per row.
    for(let i=0;i<fields.length;i++)for(let j=i+1;j<fields.length;j++){
     const a=rect(fields[i]),b=rect(fields[j]),first=fields[i].querySelector('input,select,textarea'),second=fields[j].querySelector('input,select,textarea');
     const shareRow=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
     if(shareRow&&first&&second&&Math.abs(rect(first).bottom-rect(second).bottom)>1.5)issues.push('Inputs are misaligned within '+form.id+': '+first.id+' / '+second.id);
    }
    grids.push({form:form.id,columns,fieldWidths:fields.map(el=>rect(el).width)});
   }
  }
  const gaps=pairs.map(([above,below])=>{const a=document.querySelector(above),b=document.querySelector(below);return{above,below,gap:a&&b?rect(b).top-rect(a).bottom:null};});
  for(const pair of gaps)if(pair.gap===null||pair.gap<12)issues.push('Insufficient space: '+pair.above+' → '+pair.below+' = '+pair.gap);
  const date=document.getElementById('startDate'),save=document.querySelector('[data-action="saveSettings"]');
  if(date&&save&&innerWidth<=660&&Math.abs(rect(date).width-rect(save).width)>1)issues.push('Mobile date input and save button do not share the same width');
  const macro=document.getElementById('macroForm');
  if(macro&&visible(macro))for(const input of macro.querySelectorAll('input'))if(rect(input).width<Math.min(160,rect(macro).width)-1)issues.push(input.id+' is too narrow for its values and placeholder');
  return{issues,gaps,grids,controlCount:controls.length,viewport:innerWidth,pageWidth:document.documentElement.scrollWidth};
 },pairs);
 assert(data.issues.length===0,label+': '+JSON.stringify(data));assert(data.pageWidth<=data.viewport+1,label+' creates horizontal overflow');return{label,...data};
}
// Synthetic browser signals exercise the app's UI, not Android's WebAPK installer.
async function offerInstall(page,rejectPrompt=false){return page.evaluate(reject=>{
 const fixture=window.installAudit={calls:0};
 const event=new Event('beforeinstallprompt',{cancelable:true});
 event.prompt=()=>{fixture.calls++;return reject?Promise.reject(new Error('Synthetic install failure')):Promise.resolve();};
 event.userChoice=new Promise(resolve=>{fixture.resolve=resolve;});
 window.dispatchEvent(event);return event.defaultPrevented;
},rejectPrompt);}
async function snap(page,name){const file=path.join(output,name+'.jpg');const bytes=await page.screenshot({path:file,type:'jpeg',quality:45,fullPage:false,animations:'disabled'});shots.push({name,bytes});}
async function run(name,fn,opts={}){
 let h;try{h=await openPage(opts.width||390,opts.seed||emptyState(),!!opts.acceptDialogs);const detail=await fn(h);results.push({name,status:'pass',...detail});}catch(e){results.push({name,status:'fail',error:e.message});}finally{if(h){if(h.errors.length)runtimeErrors.push({test:name,errors:h.errors});await h.context.close();}}
}
try{
 const local=await readFile(path.join(root,'index.html'));let live={};try{const r=await fetch('https://sosoft142.github.io/Silhueta/',{signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await r.arrayBuffer());live={httpStatus:r.status,sameAsRepository:local.equals(bytes),sha256:createHash('sha256').update(bytes).digest('hex')};}catch(e){live={error:e.message};}
 results.push({name:'Published source comparison',status:live.sameAsRepository?'pass':'info',...live,repositoryBlob:createHash('sha1').update('blob '+local.length+'\0').update(local).digest('hex')});
 const layoutWidths=[320,360,390,414,660,768,851,1024,1101,1440];
 for(const width of layoutWidths){
  await run('Layout normal and navigation '+width+'px',async({page,errors})=>{
   const checks=[];
   for(const view of ['dashboard','measure','trends','nutrition','settings','help']){
    if(view!=='dashboard')await go(page,view);
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    checks.push({view,...dimensions});assert(dimensions.page<=dimensions.viewport+1,'Horizontal overflow '+JSON.stringify({view,...dimensions}));
    if(width===390&&['dashboard','measure','trends','nutrition','settings'].includes(view))await snap(page,'390-'+view);
    if(width===320&&view==='trends')await snap(page,'320-trends');
   }
   assert(errors.length===0,'Browser errors: '+errors.join(' | '));return{checks};
  },{width,seed:filledState()});
 }
 for(const width of layoutWidths)await run('Form spacing, alignment and expanded controls '+width+'px',async({page})=>{
  const before=await state(page),checks=[];
  await go(page,'settings');
  checks.push(await formGeometry(page,'Settings', [['#startDate','.settings-summary']]));
  if(width===390||width===1440)await snap(page,width+'-settings-spacing');
  await go(page,'measure');await page.locator('#quickForm .help-extra summary').click();
  checks.push(await formGeometry(page,'Quick registration', [['#quickNote','.quick-actions']]));
  await page.locator('[data-action="measureMode"][data-mode="batch"]').click();
  checks.push(await formGeometry(page,'Batch registration', [['#batchDate','.batch-metrics'],['.batch-metrics','#batchForm button[type="submit"]']]));
  if(width===320)await page.locator('#batchForm button[type="submit"]').evaluate(el=>el.scrollIntoView({block:'center'}));
  if(width===320)await snap(page,'320-batch-actions');
  await go(page,'trends');await page.locator('.inline-goal-form summary').click();
  checks.push(await formGeometry(page,'Body goals', [['#goalForm .form-grid','#goalForm [data-action="saveGoals"]']]));
  await go(page,'nutrition');
  if(!(await page.locator('#nutritionForm .detail-panel').evaluate(el=>el.open)))await page.locator('#nutritionForm .detail-panel summary').click();
  await page.locator('.inline-macro-form summary').click();
  checks.push(await formGeometry(page,'Nutrition and food goals', [
   ['#nutritionForm .measure-extras','#nutritionForm .detail-panel > .field'],
   ['#nutritionForm .detail-panel','#nutritionForm .form-actions'],
   ['#macroForm .form-grid','#macroForm [data-action="saveMacroTargets"]']
  ]));
  if(width===390)await page.locator('#notes').evaluate(el=>el.scrollIntoView({block:'center'}));
  if(width===390)await snap(page,'390-nutrition-spacing');
  if(width===1440)await page.locator('#macroForm').evaluate(el=>el.scrollIntoView({block:'center'}));
  if(width===1440)await snap(page,'1440-food-goals-spacing');
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Layout inspection modified existing records');
  return{checks};
 },{width,seed:filledState()});
 await run('Empty mobile dashboard and mobile drawer',async({page})=>{await snap(page,'390-empty-home');await page.locator('[data-action="openDrawer"]:visible').first().click();assert(await page.locator('#mobileDrawer').isVisible(),'Drawer did not open');await snap(page,'390-menu');await page.keyboard.press('Escape');assert(await page.locator('#mobileDrawer').isHidden(),'Escape did not close drawer');});
 await run('Quick registration repeats, isolated edit, isolated delete, persistence',async({page})=>{
  await go(page,'measure');
  for(const v of ['75.5','75.6']){await page.locator('#quickValue').fill(v);await page.locator('#quickDate').fill('2026-10-20');await page.locator('#quickForm button[type="submit"]').click();}
  let s=await state(page),ids=Object.keys(s.metricEntries);assert(ids.length===2,'Expected 2 separate entries');
  await page.locator('[data-action="editMetric"][data-id="'+ids[0]+'"]').click();await page.locator('#quickValue').fill('76');await page.locator('#quickForm button[type="submit"]').click();s=await state(page);assert(s.metricEntries[ids[0]].value===76&&s.metricEntries[ids[1]].value===75.6,'Editing affected another record');
  page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());await page.locator('[data-action="deleteMetric"][data-id="'+ids[0]+'"]').click();s=await state(page);assert(s.metricEntries[ids[0]].deleted===true,'Delete did not create tombstone');
  await page.reload({waitUntil:'networkidle'});s=await state(page);assert(s.metricEntries[ids[1]].value===75.6,'Persisted value lost');return{remainingRecords:1};
 });
 for(const width of [320,390,1440])await run('Quick reference: latest real date, region changes and drafts at '+width+'px',async({page})=>{
  const before=await state(page);await go(page,'measure');
  assert((await page.locator('#quickLastMeasurement').innerText()).includes('74,5 kg em 20/10/2026'),'Weight reference did not use the last real weighing');
  await page.locator('#quickDate').fill('2026-10-18');await page.locator('#quickForm .help-extra summary').click();await page.locator('#quickNote').fill('Synthetic note to preserve');await page.locator('#quickValue').fill('75.5');
  await page.locator('#quickMetric').selectOption('waist');const reference=await page.locator('#quickLastMeasurement').innerText();
  assert(reference.includes('cintura: 84,5 cm em 20/10/2026'),'Reference used edit time, a deleted record or another region: '+reference);
  assert(await page.locator('#quickValue').inputValue()===''&&await page.locator('#quickDate').inputValue()==='2026-10-18'&&await page.locator('#quickNote').inputValue()==='Synthetic note to preserve','Changing the reference filled a value or erased date/notes');
  await page.locator('#quickValue').fill('83.7');await page.locator('#historyFilter').selectOption('waist');
  assert(await page.locator('#quickValue').inputValue()==='83.7'&&(await page.locator('#quickLastMeasurement').innerText())===reference,'A history render changed the draft or reference');
  assert(await page.locator('#quickValue').getAttribute('aria-describedby')==='quickLastMeasurement','Value input is not associated with its reference');
  const geometry=await page.locator('#quickLastMeasurement').evaluate(el=>{const r=el.getBoundingClientRect(),fields=document.querySelector('.quick-fields').getBoundingClientRect(),next=el.nextElementSibling.getBoundingClientRect();return{left:r.left,right:r.right,width:innerWidth,gapBefore:r.top-fields.bottom,gapAfter:next.top-r.bottom};});
  assert(geometry.left>=0&&geometry.right<=width+1&&geometry.gapBefore>=12&&geometry.gapAfter>=12,'Reference is clipped or touches its neighbours: '+JSON.stringify(geometry));
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Reading the reference changed saved data');
  await page.locator('#quickForm').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await snap(page,width+'-last-measurement-reference');
 },{width,seed:(()=>{const s=filledState();s.profile.baselineWeight=90;s.metricEntries.m_edited_old_waist={metric:'waist',value:99,date:'2026-10-10',updatedAt:'2026-10-27T12:00:00.000Z'};s.metricEntries.m_deleted_waist={metric:'waist',value:93,date:'2026-10-26',deleted:true,updatedAt:'2026-10-27T12:00:00.000Z'};return s;})()});
 await run('Quick reference: missing history never presents a profile value as a measurement',async({page})=>{
  await go(page,'measure');assert((await page.locator('#quickLastMeasurement').innerText()).includes('Nenhuma medição de peso registrada'),'Profile reference appeared as a weighing');
  await page.locator('#quickMetric').selectOption('bodyFat');assert((await page.locator('#quickLastMeasurement').innerText()).includes('Nenhuma medição de gordura corporal registrada')&&await page.locator('#quickValue').inputValue()==='','An empty region has invented values');
 },{seed:(()=>{const s=emptyState();s.profile.baselineWeight=75;return s;})()});
 for(const width of [320,1440])await run('Save confirmation: exact values, dates, units and editing at '+width+'px',async({page})=>{
  await go(page,'measure');const before=await state(page);await page.locator('#quickMetric').selectOption('waist');await page.locator('#quickValue').fill('84.2');await page.locator('#quickDate').fill('2026-10-02');await page.locator('#quickForm button[type="submit"]').click();
  assert((await page.locator('#toast .toast-message').innerText())==='Medição salva neste aparelho: Cintura · 84,2 cm · 02/10/2026.','Saving did not confirm the exact stored measurement');
  assert((await page.locator('#quickLastMeasurement').innerText()).includes('84,5 cm em 20/10/2026')&&await page.locator('#quickValue').inputValue()==='','Backdated saving replaced the latest reference or refilled the input');
  const saved=await state(page),id=Object.keys(saved.metricEntries).find(key=>!before.metricEntries[key]);assert(id,'No independent measurement was created');
  await page.locator('[data-action="editMetric"][data-id="'+id+'"]').click();await page.locator('#quickValue').fill('83.1');await page.locator('#quickDate').fill('2026-10-23');await page.locator('#quickForm button[type="submit"]').click();
  const edited=await state(page);assert(edited.metricEntries[id].value===83.1&&Object.keys(edited.metricEntries).length===Object.keys(saved.metricEntries).length,'Editing duplicated the record');
  assert((await page.locator('#toast .toast-message').innerText())==='Registro atualizado neste aparelho: Cintura · 83,1 cm · 23/10/2026.'&&(await page.locator('#quickLastMeasurement').innerText()).includes('83,1 cm em 23/10/2026'),'Editing did not update both confirmation and latest reference');
  for(const [metric,value,label,unit]of [['weight','74.2','Peso','kg'],['bodyFat','22.3','Gordura corporal','%']]){
   await page.locator('#quickMetric').selectOption(metric);await page.locator('#quickValue').fill(value);await page.locator('#quickDate').fill('2026-10-24');await page.locator('#quickForm button[type="submit"]').click();
   const message=await page.locator('#toast .toast-message').innerText();assert(message.includes(label+' · '+value.replace('.',',')+' '+unit+' · 24/10/2026.'),'Wrong unit, value or date in confirmation: '+message);
  }
  await snap(page,width+'-detailed-save-confirmation');const bounds=await page.locator('#toast').boundingBox(),nav=await page.locator('#mobileNav').isVisible()?await page.locator('#mobileNav').boundingBox():null;
  assert(bounds.x>=0&&bounds.x+bounds.width<=width+1&&(!nav||bounds.y+bounds.height<=nav.y+1),'Detailed confirmation is clipped or overlaps mobile navigation');
 },{width,seed:filledState()});
 await run('Quick reference: delete and undo refresh the reference without losing the draft',async({page})=>{
  await go(page,'measure');await page.locator('#quickMetric').selectOption('waist');await page.locator('#quickValue').fill('83.7');
  await page.locator('[data-action="deleteMetric"][data-id="m_test_waist_new"]').click();assert((await page.locator('#quickLastMeasurement').innerText()).includes('85,0 cm em 01/10/2026'),'Deletion left the removed value in the reference');
  await page.locator('#toast [data-action="undoDelete"]').click();assert((await page.locator('#quickLastMeasurement').innerText()).includes('84,5 cm em 20/10/2026')&&await page.locator('#quickValue').inputValue()==='83.7','Undo did not restore the reference safely');
 },{seed:filledState(),acceptDialogs:true});
 await run('Save confirmation: a local storage failure never claims a successful save',async({page})=>{
  await go(page,'measure');const before=await state(page);await page.locator('#quickValue').fill('75.2');
  await page.evaluate(()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='silhueta.app.v1')throw new DOMException('Synthetic quota failure','QuotaExceededError');return write.call(this,key,value);};});
  await page.locator('#quickForm button[type="submit"]').click();const message=await page.locator('#toast .toast-message').innerText();
  assert(message.includes('Não foi possível salvar neste aparelho')&&!message.includes('Medição salva'),'Failed storage still shows a success confirmation');
  assert(JSON.stringify(await state(page))===JSON.stringify(before)&&await page.locator('#storageNotice .notice').isVisible(),'Failed local write changed stored records or hid the recovery notice');
 });
 await run('Native number constraints block weight below minimum',async({page})=>{await go(page,'measure');await page.locator('#quickValue').fill('19');assert(await page.locator('#quickValue').evaluate(el=>el.validity.rangeUnderflow),'Browser did not detect minimum');await page.locator('#quickForm button[type="submit"]').click();assert(Object.keys((await state(page)).metricEntries).length===0,'Invalid weight saved');});
 await run('Invalid date is rejected before saving',async({page})=>{await go(page,'measure');await page.locator('#quickValue').fill('75');await page.locator('#quickDate').evaluate(el=>el.value='2026-02-30');await page.locator('#quickForm button[type="submit"]').click();assert(Object.keys((await state(page)).metricEntries).length===0,'Impossible date saved');});
 await run('Batch rejection is atomic',async({page})=>{await go(page,'measure');await page.locator('[data-action="measureMode"][data-mode="batch"]').click();await page.locator('#batch_weight').fill('75');await page.locator('#batch_waist').fill('85');await page.locator('#batch_bodyFat').fill('150');await page.locator('#batchForm button[type="submit"]').click();assert(Object.keys((await state(page)).metricEntries).length===0,'Batch partially saved');});
 await run('Guide changes preserve unsaved input and all images decode',async({page})=>{await go(page,'measure');await page.locator('#quickValue').fill('75.5');await page.locator('[data-action="openGuide"]').click();for(const m of ['bust','underbust','shoulders','neck','waist','abdomen','hip','arm','biceps','forearm','thigh','calf']){await page.locator('[data-action="guideMetric"][data-metric="'+m+'"]').click();await page.locator('.anatomy-photo img').evaluate(img=>img.decode());assert(await page.locator('#quickValue').inputValue()==='75.5','Guide erased draft at '+m);}await page.locator('.anatomy-card').evaluate(el=>el.scrollIntoView({block:'start'}));await snap(page,'390-anatomy-guide');return{regions:12};});
 await run('Navigation guard preserves draft when discard is refused',async({page,dialogs})=>{await go(page,'measure');await page.locator('#quickValue').fill('75.5');await page.locator('#mobileNav [data-view="dashboard"]').click();assert(dialogs.length===1&&await page.locator('#quickValue').inputValue()==='75.5','Navigation lost draft');});
 await run('Regression: measurement history filter must preserve draft',async({page})=>{await go(page,'measure');await page.locator('#quickValue').fill('75.5');await page.locator('#historyFilter').selectOption('weight');assert(await page.locator('#quickValue').inputValue()==='75.5','Draft 75.5 disappeared after changing history filter');});
 await run('Regression: nutrition week arrow must preserve draft',async({page})=>{await go(page,'nutrition');await page.locator('#calories').fill('1850');await page.locator('[data-action="nextNutWeek"]').click();assert(await page.locator('#calories').inputValue()==='1850','Unsaved 1850 calories disappeared after changing week');});
 await run('Regression: saving macro targets must preserve consumption draft',async({page})=>{await go(page,'nutrition');await page.locator('#calories').fill('1850');await page.locator('.inline-macro-form summary').click();for(const [id,v]of [['target_protein','120'],['target_carbs','200'],['target_fat','60']])await page.locator('#'+id).fill(v);await page.locator('[data-action="saveMacroTargets"]').click();assert(await page.locator('#calories').inputValue()==='1850','Saving targets erased unsaved consumption');});
 await run('Regression: saving consumption must preserve macro target draft',async({page})=>{await go(page,'nutrition');await page.locator('#calories').fill('1850');await page.locator('.inline-macro-form summary').click();await page.locator('#target_protein').fill('120');await page.locator('[data-action="saveNutrition"]').click();assert(await page.locator('#target_protein').inputValue()==='120','Saving consumption erased unsaved target');});
 await run('Regression: editing another history entry must preserve draft',async({page})=>{await go(page,'measure');await page.locator('#quickValue').fill('76');await page.locator('[data-action="editMetric"]').first().click();assert(await page.locator('#quickValue').inputValue()==='76','Opening old entry replaced draft without confirmation');},{seed:filledState()});
 await run('Regression: chart selector must preserve body goal draft',async({page})=>{await go(page,'trends');await page.locator('.inline-goal-form summary').click();await page.locator('#goalWeight').fill('72');await page.locator('#chartMetric').selectOption('waist');assert(await page.locator('#goalWeight').inputValue()==='72','Chart selector erased unsaved body goal');},{seed:filledState()});
 await run('Regression: legacy CSV reimport must not duplicate',async({page})=>{const csv='Data,Região,Medida,Unidade,ID\n2026-10-20,Peso,75,kg,legacy_0_weight';for(let i=0;i<2;i++){await page.setInputFiles('#importFile',{name:'historico.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await page.waitForTimeout(100);}const entries=Object.values((await state(page)).metricEntries).filter(e=>!e.deleted);assert(entries.length===1,'Legacy CSV grew from 1 entry to '+entries.length);},{seed:(()=>{const s=emptyState();s.metricEntries={legacy_0_weight:{metric:'weight',value:75,date:'2026-10-20',updatedAt:'2026-10-20T12:00:00.000Z',origin:'legacy'}};return s;})(),acceptDialogs:true});
 await run('Regression: nutrition CSV must reject out of range values',async({page})=>{const csv='Semana,Calorias médias,Treinos (nº),Sono (h)\n0,-500,99,50';await page.setInputFiles('#importFile',{name:'nutricao.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await page.waitForTimeout(100);const r=(await state(page)).nutritionLogs['0'];assert(!r||!(r.calories<0||r.workouts>14||r.sleep>24),'Invalid CSV values persisted: '+JSON.stringify(r));},{acceptDialogs:true});
 await run('Regression: malformed JSON import must leave previous valid state usable',async({page})=>{const s=emptyState();s.metricEntries={m_invalid:{metric:'weight',value:75,date:123,updatedAt:'2026-10-20T12:00:00.000Z'}};await page.setInputFiles('#importFile',{name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({data:s}))});await page.waitForTimeout(100);const persisted=(await state(page)).metricEntries.m_invalid?.date;await page.reload({waitUntil:'networkidle'});const content=(await page.locator('#main').innerText()).trim();assert(persisted!==123&&content.length>0,'Malformed date persisted='+persisted+'; main content after reload='+content.length+' characters');},{acceptDialogs:true});
 await run('Regression: batch native bounds must match accepted metric limits',async({page})=>{await go(page,'measure');await page.locator('[data-action="measureMode"][data-mode="batch"]').click();await page.locator('#batch_weight').fill('15');await page.locator('#batch_bodyFat').fill('150');const w=await page.locator('#batch_weight').evaluate(el=>el.validity.valid),f=await page.locator('#batch_bodyFat').evaluate(el=>el.validity.valid);assert(!w&&!f,'Browser marks weight 15 kg and body fat 150% as valid in batch');});
 await run('Regression: long saved notes must not create horizontal overflow on 320px',async({page})=>{await go(page,'measure');await page.locator('.history-full-width').evaluate(el=>el.scrollIntoView({block:'start'}));const d=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scale:visualViewport.scale}));await snap(page,'320-long-note');assert(d.page<=321,'Saved 500-character note: '+JSON.stringify(d)+'; expected document width 320px');},{width:320,seed:(()=>{const s=filledState();s.metricEntries.m_test_weight_new.note='x'.repeat(500);return s;})()});

 for(const width of [320,390])await run('Regression: chart axis labels must remain legible at '+width+'px',async({page})=>{await go(page,'trends');const sizes=await page.locator('.chart-svg text').evaluateAll(els=>els.map(el=>{const m=el.getScreenCTM();return parseFloat(getComputedStyle(el).fontSize)*Math.hypot(m.a,m.b);}));const min=Math.min(...sizes),max=Math.max(...sizes);assert(min>=10,'Chart axis rendered font size '+min.toFixed(2)+' to '+max.toFixed(2)+' CSS px at '+width+'px viewport; expected at least 10px');return{min,max};},{width,seed:filledState()});


 await run('Valid JSON import preserves reference, goals, notes and deletion markers',async({page})=>{
  const data=filledState();data.profile.baselineWeight=75;data.profile.goalWeight=72;data.metricEntries.m_deleted={metric:'weight',value:75,date:'2026-10-19',deleted:true,updatedAt:'2026-10-20T12:00:00.000Z'};
  await page.setInputFiles('#importFile',{name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'Silhueta',data}))});await page.waitForTimeout(100);
  const saved=await state(page);assert(saved.profile.baselineWeight===75&&saved.profile.goalWeight===72&&saved.metricEntries.m_deleted.deleted,'Valid backup fields lost');assert(Object.values(saved.metricEntries).filter(r=>!r.deleted).length===6,'Reference created a fake weighing or records lost');assert(saved.metricEntries.m_test_weight_new.note==='Registro fictício de teste','Note lost');
 },{acceptDialogs:true});
 await run('Legacy JSON migration retains individual dates without duplication',async({page})=>{
  const data=emptyState();data.profile.baselineWeight=75;data.meta.historyMigratedV23=false;delete data.metricEntries;data.measurements={'0':{weight:75,waist:85,date:'2026-10-19',d_waist:'2026-10-20',notes:'Nota antiga de teste'}};
  await page.setInputFiles('#importFile',{name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.waitForTimeout(100);
  let saved=await state(page);assert(saved.metricEntries.legacy_0_waist.date==='2026-10-20'&&saved.profile.baselineWeight===75,'Legacy fields lost');await page.reload({waitUntil:'networkidle'});saved=await state(page);assert(Object.keys(saved.metricEntries).length===2,'Legacy migration duplicated');
 },{acceptDialogs:true});
 await run('CSV invalid later row cannot partially modify existing nutrition',async({page})=>{
  const before=JSON.stringify(await state(page));await page.setInputFiles('#importFile',{name:'partial.csv',mimeType:'text/csv',buffer:Buffer.from('Semana,Calorias médias,Treinos (nº),Sono (h)\n0,1850,3,8\n1,-500,99,50')});await page.waitForTimeout(100);assert(JSON.stringify(await state(page))===before,'CSV wrote a valid row before rejecting invalid row');
 },{seed:filledState(),acceptDialogs:true});
 await run('Invalid JSON cannot replace a valid pre-existing history',async({page})=>{
  const before=JSON.stringify(await state(page)),data=emptyState();data.metricEntries={m_bad:{metric:'weight',value:75,date:123}};
  await page.setInputFiles('#importFile',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({data}))});await page.waitForTimeout(100);assert(JSON.stringify(await state(page))===before,'Invalid backup replaced existing history');
 },{seed:filledState(),acceptDialogs:true});
 await run('Week dropdown refusal preserves week and nutrition draft',async({page,dialogs})=>{
  await go(page,'nutrition');const week=await page.locator('#nutWeekPicker').inputValue();await page.locator('#calories').fill('1850');const next=String((Number(week)+1)%53);await page.locator('#nutWeekPicker').selectOption(next);assert(dialogs.length===1&&await page.locator('#nutWeekPicker').inputValue()===week&&await page.locator('#calories').inputValue()==='1850','Week dropdown lost draft or selection');
 });
 await run('Chart resizing preserves draft and readable axes',async({page})=>{
  await go(page,'trends');await page.locator('.inline-goal-form summary').click();await page.locator('#goalWeight').fill('72');
  for(const width of [320,414,360]){await page.setViewportSize({width,height:844});await page.waitForTimeout(150);const min=await page.locator('.chart-svg text').evaluateAll(els=>Math.min(...els.map(el=>{const m=el.getScreenCTM();return parseFloat(getComputedStyle(el).fontSize)*Math.hypot(m.a,m.b);})));assert(min>=10&&await page.locator('#goalWeight').inputValue()==='72','Resize shrank axis labels or erased draft');}
 },{seed:filledState()});

 await run('Usability: returning dashboard prioritizes metrics and retains registration',async({page})=>{
  assert(await page.locator('.ux-hero').count()===0,'Introductory hero still dominates returning dashboard');
  assert(await page.locator('.page-head [data-view="measure"]').isVisible(),'Registration shortcut is missing');
  assert(await page.locator('.dashboard-help').evaluate(el=>!el.open),'Instructions should start collapsed');
  await page.locator('.page-head [data-view="measure"]').click();assert(await page.locator('#quickForm').isVisible(),'Registration shortcut did not open the form');
 },{seed:filledState()});
 await run('Usability: history precedes optional guide and opening it preserves the draft',async({page})=>{
  await go(page,'measure');assert(await page.locator('.anatomy-guide').evaluate(el=>!el.open),'Guide should start collapsed');
  const order=await page.evaluate(()=>document.querySelector('.history-full-width').getBoundingClientRect().top<document.querySelector('.anatomy-full-width').getBoundingClientRect().top);assert(order,'History is below guide');
  await page.locator('#quickValue').fill('75.5');await page.locator('[data-action="openGuide"]').click();assert(await page.locator('.anatomy-guide').evaluate(el=>el.open),'Guide shortcut did not open details');
  await page.locator('.anatomy-guide>summary').click();assert(await page.locator('#quickValue').inputValue()==='75.5','Opening or closing guide erased draft');
  await page.locator('#historyFilter').selectOption('weight');assert(await page.locator('#quickValue').inputValue()==='75.5','Reordered history erased draft');
 },{seed:filledState()});
 await run('Usability: first week has calendar range and keeps the original saved log',async({page})=>{
  await go(page,'nutrition');await page.locator('#nutWeekPicker').selectOption('0');
  assert((await page.locator('.measurement-intro h2').innerText()).includes('Semana 1'),'Visible week numbering does not begin at 1');
  assert((await page.locator('.week-context').innerText()).includes('01/10/2026 a 07/10/2026'),'Week range is missing or shifted');
  assert(await page.locator('#calories').inputValue()==='1900','Existing first-week log moved to another week');
  assert((await page.locator('[data-action="editNutWeek"][data-week="0"]').innerText()).includes('01/10/2026 a 07/10/2026'),'Saved week lacks its calendar range');
  await page.locator('#calories').fill('1800');await page.locator('[data-action="saveNutrition"]').click();const s=await state(page);assert(s.nutritionLogs['0'].calories===1800&&!s.nutritionLogs['1'],'Saving visible week 1 changed the stored identity');
 },{seed:filledState()});
 await run('Usability: undated nutrition explains optional dates and links to settings',async({page})=>{
  await go(page,'nutrition');const text=await page.locator('.week-context').innerText();assert(text.includes('ainda não tem datas')&&text.includes('mesmo sem essa data'),'Undated period is unexplained');
  assert(!(await page.locator('#main').innerText()).includes('Semana 0'),'Week zero remains visible');
  assert(!(await page.locator('.nutrition-reference').innerText()).includes('seu perfil'),'Obsolete profile reference remains');
  await page.locator('.week-context [data-view="settings"]').click();assert(await page.locator('#startDate').isVisible(),'Date shortcut did not reach settings');
 });
 await run('Usability: weekly calendar handles year boundaries',async({page})=>{
  await go(page,'nutrition');await page.locator('#nutWeekPicker').selectOption('0');assert((await page.locator('.week-context').innerText()).includes('29/12/2026 a 04/01/2027'),'Year boundary changed the 7-day period');
 },{seed:(()=>{const s=emptyState();s.profile.startDate='2026-12-29';return s;})()});
 await run('Usability: touch and keyboard chart inspection preserve drafts and resize selection',async({page})=>{
  await go(page,'trends');const chart=page.locator('[data-history-chart]').first(),old=chart.locator('[data-id="m_test_weight_old"]'),recent=chart.locator('[data-id="m_test_weight_new"]');
  await page.locator('.inline-goal-form summary').click();await page.locator('#goalWeight').fill('72');await old.tap();
  assert((await chart.locator('.chart-readout').innerText()).includes('75,0 kg · 01/10/2026'),'Touch did not show exact value and date');
  await recent.focus();await recent.press('Enter');assert((await chart.locator('.chart-readout').innerText()).includes('74,5 kg · 20/10/2026'),'Keyboard did not inspect chart');
  await old.focus();await old.press('Space');await page.setViewportSize({width:320,height:844});await page.waitForTimeout(150);
  assert((await chart.locator('.chart-readout').innerText()).includes('01/10/2026'),'Resizing discarded inspected point');assert(await page.locator('#goalWeight').inputValue()==='72','Inspecting chart erased goal draft');
  const pair=page.locator('[data-history-chart]').nth(1);await pair.locator('[data-id="m_test_hip_old"]').tap();assert((await pair.locator('.chart-readout').innerText()).includes('Quadril · 102,0 cm · 01/10/2026'),'Combined chart showed wrong series');
  await snap(page,'320-chart-inspection');
 },{seed:filledState()});
 await run('Usability: local save status remains visible after saving',async({page})=>{
  const label=page.locator('.sync-trigger-label');assert(await label.isVisible()&&(await label.innerText())==='Salvo neste aparelho','Local save status is not visible');
  await go(page,'measure');await page.locator('#quickValue').fill('75.5');await page.locator('#quickForm button[type="submit"]').click();assert((await label.innerText())==='Salvo neste aparelho','Local save is presented as cloud synchronization');
 });
 await run('Usability: failed storage is never presented as successfully saved',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='silhueta.app.v1')throw new DOMException('Synthetic quota failure','QuotaExceededError');return original.call(this,key,value);};});
  await page.reload({waitUntil:'networkidle'});assert((await page.locator('.sync-trigger-label').innerText())==='Falha ao salvar','Failed storage still claims success');assert((await page.locator('#storageNotice').innerText()).includes('não permitiu salvar'),'Storage failure has no recovery message');
 });

 await run('Installation: late browser offer preserves unsaved settings and existing records',async({page})=>{
  await go(page,'settings');const before=await state(page);
  assert(await page.locator('#installAppButton').isDisabled(),'Installation offered without browser permission');
  await page.locator('#startDate').fill('2026-10-23');
  await page.locator('#settingsForm').evaluate(form=>{window.installDraftForm=form;});
  assert(await offerInstall(page),'Native automatic prompt was not deferred');
  assert(await page.locator('#installAppButton').isEnabled(),'Browser offer did not enable installation');
  assert(await page.locator('#startDate').inputValue()==='2026-10-23','Browser offer erased date draft');
  assert(await page.locator('#settingsForm').evaluate(form=>form===window.installDraftForm),'Offer re-rendered the settings form');
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Install availability mutated user records');
  await page.locator('#installAppButton').scrollIntoViewIfNeeded();await snap(page,'320-install-ready');
 },{width:320,seed:filledState()});
 await run('Installation: one prompt per offer, request is not completion, no permanent installed flag',async({page})=>{
  await go(page,'settings');const before=await state(page);await offerInstall(page);
  await page.locator('#installAppButton').click();await page.locator('#installAppButton').dispatchEvent('click');
  assert(await page.evaluate(()=>window.installAudit.calls)===1,'Same browser offer invoked more than once');
  assert(await page.locator('#installAppButton').isDisabled(),'Prompt can be opened twice while pending');
  await page.evaluate(()=>{window.dispatchEvent(new Event('appinstalled'));window.installAudit.resolve({outcome:'accepted'});});
  await page.waitForFunction(()=>document.getElementById('installAppButton').textContent.includes('Instalação solicitada'));
  assert((await page.locator('#appInstallStatus').innerText()).includes('Aguarde o ícone'),'Early appinstalled event claimed WebAPK completion');
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Install request mutated existing records');
  await page.reload({waitUntil:'networkidle'});await go(page,'settings');await offerInstall(page);
  assert(await page.locator('#installAppButton').isEnabled(),'Reload retained an installed flag that prevents reinstalling');
 },{seed:filledState()});
 await run('Installation: cancellation consumes only the old offer and a fresh offer can retry',async({page})=>{
  await go(page,'settings');await offerInstall(page);await page.locator('#installAppButton').click();
  await page.evaluate(()=>window.installAudit.resolve({outcome:'dismissed'}));
  await page.waitForFunction(()=>document.getElementById('appInstallStatus').textContent.includes('cancelou'));
  await page.locator('#installAppButton').dispatchEvent('click');
  assert(await page.evaluate(()=>window.installAudit.calls)===1,'Dismissed offer was reused');
  await offerInstall(page);assert(await page.locator('#installAppButton').isEnabled(),'Fresh browser offer cannot retry');
  await page.locator('#installAppButton').click();assert(await page.evaluate(()=>window.installAudit.calls)===1,'Fresh offer did not prompt exactly once');
 });
 await run('Installation: browser rejection has a recovery message and preserves records',async({page})=>{
  await go(page,'settings');const before=await state(page);await offerInstall(page,true);await page.locator('#installAppButton').click();
  await page.waitForFunction(()=>document.getElementById('appInstallStatus').textContent.includes('não conseguiu iniciar'));
  assert(await page.locator('#installAppButton').isDisabled(),'Failed offer was not consumed');
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Failed installation modified user records');
 },{seed:filledState()});
 await run('Installation: an old response cannot overwrite a newer browser offer',async({page})=>{
  await go(page,'settings');await offerInstall(page);await page.locator('#installAppButton').click();
  await page.evaluate(()=>{window.oldInstallAudit=window.installAudit;});
  await offerInstall(page);await page.locator('#installAppButton').click();
  await page.evaluate(async()=>{window.oldInstallAudit.resolve({outcome:'dismissed'});await new Promise(resolve=>setTimeout(resolve,0));});
  assert((await page.locator('#installAppButton').innerText()).includes('Aguardando confirmação'),'Late old response overwrote the current request');
  await page.evaluate(()=>window.installAudit.resolve({outcome:'accepted'}));
  await page.waitForFunction(()=>document.getElementById('installAppButton').textContent.includes('Instalação solicitada'));
 });
 await run('Installation: browser offer before opening Settings remains usable',async({page})=>{
  await offerInstall(page);await go(page,'settings');assert(await page.locator('#installAppButton').isEnabled(),'Offer was lost before Settings opened');
  await page.locator('#installAppButton').scrollIntoViewIfNeeded();await snap(page,'390-install-ready');
 });
 await run('Installation: standalone display does not offer to reinstall or save an installed flag',async({page})=>{
  await page.addInitScript(()=>{const match=window.matchMedia.bind(window);window.matchMedia=query=>{const media=match(query);if(query==='(display-mode: standalone)')Object.defineProperty(media,'matches',{value:true});return media;};});
  await page.reload({waitUntil:'networkidle'});await go(page,'settings');const before=await state(page);await offerInstall(page);
  assert(await page.locator('#installAppButton').count()===0,'Standalone launch keeps a redundant installation action');
  assert(await page.locator('#appInstallSection').isHidden(),'Standalone launch keeps installation instructions visible');
  assert(await page.locator('[data-app-version]').isVisible(),'Simplified Settings lost the version footer');
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Standalone detection modified records');
 });
 await run('Installation: display-mode changes simplify only the install block and preserve the date draft',async({page})=>{
  await page.addInitScript(()=>{const match=window.matchMedia.bind(window);window.matchMedia=query=>{const media=match(query);if(query==='(display-mode: standalone)'){window.testInstalledMode=false;window.testInstalledMedia=media;Object.defineProperty(media,'matches',{get:()=>window.testInstalledMode});}return media;};});
  await page.reload({waitUntil:'networkidle'});await go(page,'settings');await page.locator('#startDate').fill('2026-10-16');await offerInstall(page);
  await page.locator('#settingsForm').evaluate(form=>{window.installDateForm=form;});
  await page.evaluate(()=>{window.testInstalledMode=true;window.testInstalledMedia.dispatchEvent(new Event('change'));});
  assert(await page.locator('#appInstallSection').isHidden()&&await page.locator('#installAppButton').count()===0,'Installed mode does not simplify Settings');
  await page.evaluate(()=>{window.testInstalledMode=false;window.testInstalledMedia.dispatchEvent(new Event('change'));});
  assert(await page.locator('#installAppButton').isEnabled(),'Browser installation offer was lost when returning from installed mode');
  assert(await page.locator('#startDate').inputValue()==='2026-10-16'&&await page.locator('#settingsForm').evaluate(form=>form===window.installDateForm),'Display-mode transition erased or replaced the date form');
 });
 await run('Quick metric: remember the region across reloads without retaining values, notes or old dates',async({page})=>{
  const before=await state(page);await go(page,'measure');await page.locator('#quickMetric').selectOption('waist');await page.locator('#quickValue').fill('82.5');await page.locator('#quickDate').fill('2026-01-02');await page.locator('#quickForm .help-extra summary').click();await page.locator('#quickNote').fill('Synthetic unsaved note');
  await page.reload({waitUntil:'networkidle'});await go(page,'measure');
  assert(await page.locator('#quickMetric').inputValue()==='waist','Selected region was not remembered');
  assert(await page.locator('#quickValue').inputValue()===''&&await page.locator('#quickNote').inputValue()===''&&await page.locator('#quickDate').inputValue()!=='2026-01-02','Remembering a region retained old measurement data');
  assert(JSON.stringify(await state(page))===JSON.stringify(before),'Remembering a region changed records or synchronized preferences');
 });
 await run('Quick metric: dashboard shortcuts remember only the selected region',async({page})=>{
  await page.locator('[data-action="quickMetric"][data-metric="hip"]').click();await page.reload({waitUntil:'networkidle'});await go(page,'measure');
  assert(await page.locator('#quickMetric').inputValue()==='hip'&&await page.locator('#quickValue').inputValue()==='','Dashboard shortcut was not remembered safely');
  assert(await page.evaluate(key=>localStorage.getItem(key),QUICK_METRIC_KEY)==='hip','Region preference was not saved on this device');
 },{seed:filledState()});
 await run('Quick metric: invalid device preference falls back to a valid empty registration',async({page})=>{
  await page.addInitScript(key=>localStorage.setItem(key,'not-a-body-region'),QUICK_METRIC_KEY);await page.reload({waitUntil:'networkidle'});await go(page,'measure');
  assert(await page.locator('#quickMetric').inputValue()==='weight'&&await page.locator('#quickValue').inputValue()==='','Malformed region preference broke quick registration');
 });
 await run('Undo: restore the same measurement and preserve another unsaved draft',async({page})=>{
  await go(page,'measure');const before=await state(page),id='m_test_waist_new';await page.locator('#quickValue').fill('76.1');
  await page.locator('[data-action="deleteMetric"][data-id="'+id+'"]').click();const removed=await state(page);assert(removed.metricEntries[id].deleted===true,'Delete did not retain its deletion marker');
  assert(await page.locator('#toast [data-action="undoDelete"]').isVisible(),'Deletion has no undo action');
  await snap(page,'320-undo-deletion');
  const bounds=await page.locator('#toast').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=321,'Undo message overflows mobile viewport');
  await page.locator('#toast [data-action="undoDelete"]').click();const restored=await state(page),entry=restored.metricEntries[id];
  assert(entry.deleted===false&&entry.value===before.metricEntries[id].value&&entry.date===before.metricEntries[id].date&&entry.note===before.metricEntries[id].note,'Undo did not restore the original measurement');
  assert(restored.meta.clock['metricEntries.'+id]>removed.meta.clock['metricEntries.'+id],'Restored record cannot supersede its synced deletion marker');
  assert(await page.locator('#quickValue').inputValue()==='76.1','Undo erased the unsaved quick-registration draft');
  assert(JSON.stringify(restored.metricEntries.m_test_weight_new)===JSON.stringify(before.metricEntries.m_test_weight_new),'Undo changed an unrelated measurement');
 },{width:320,seed:filledState(),acceptDialogs:true});
 await run('Undo: another save retains the exclusion action without undoing the new record',async({page})=>{
  await go(page,'measure');const id='m_test_hip_new';await page.locator('[data-action="deleteMetric"][data-id="'+id+'"]').click();await page.locator('#quickValue').fill('75.9');await page.locator('#quickForm button[type="submit"]').click();
  assert(await page.locator('#toast [data-action="undoDelete"]').isVisible()&&(await page.locator('#toast').innerText()).includes('Exclusão de Quadril'),'Another notification hid or mislabelled the undo action');
  await page.locator('#toast [data-action="undoDelete"]').click();const s=await state(page);
  assert(s.metricEntries[id].deleted===false&&Object.values(s.metricEntries).some(e=>!e.deleted&&e.metric==='weight'&&e.value===75.9),'Undo reverted the wrong action or lost the new record');
 },{seed:filledState(),acceptDialogs:true});
 await run('Undo: the action expires after ten seconds and preserves the deletion',async({page})=>{
  await go(page,'measure');const id='m_test_waist_new';await page.locator('[data-action="deleteMetric"][data-id="'+id+'"]').click();await page.waitForTimeout(10200);
  assert(await page.locator('#toast [data-action="undoDelete"]').count()===0&&(await state(page)).metricEntries[id].deleted===true,'Expired undo is still available or silently restored a record');
 },{seed:filledState(),acceptDialogs:true});
 await run('Sync time: only verified synthetic synchronization creates a device-local timestamp',async({context,page})=>{
  const before=await state(page),mock=await mockGist(context,before);await startMockSync(page);await waitSyncSuccess(page);
  const saved=await page.evaluate(key=>localStorage.getItem(key),SYNC_CONFIRM_KEY),confirmation=JSON.parse(saved);
  assert(confirmation.gistId===TEST_GIST_ID&&Number.isFinite(Date.parse(confirmation.at)),'Verified sync did not save its confirmation time');
  assert(await page.locator('#syncLastConfirmed').isVisible()&&(await page.locator('#syncLastConfirmed').innerText()).includes('às'),'Confirmation time has no readable local date and time');
  await snap(page,'390-sync-confirmed-time');
  assert(!(await state(page)).meta.lastSyncConfirmation,'Device confirmation leaked into synchronized records');
  await page.reload({waitUntil:'networkidle'});await page.locator('.sync-trigger').click();
  assert(await page.locator('#syncLastConfirmed').isVisible()&&await page.evaluate(key=>localStorage.getItem(key),SYNC_CONFIRM_KEY)===saved,'Confirmation history was lost after reopening the app');
  assert(!(await page.locator('#syncState').getAttribute('class')).includes('sync-ok'),'Historical time incorrectly claims a fresh verification');
  mock.mode='invalid';await page.locator('#gistToken').fill(TEST_GIST_TOKEN);await page.locator('#gistRemember').uncheck();await page.locator('#syncMainButton').click();await page.waitForFunction(()=>document.getElementById('syncState').classList.contains('sync-error'));
  assert(await page.evaluate(key=>localStorage.getItem(key),SYNC_CONFIRM_KEY)===saved,'Failed synchronization changed the last confirmed time');
  await page.locator('[data-action="gistRemoveToken"]').click();assert(await page.locator('#syncLastConfirmed').isHidden()&&await page.evaluate(key=>localStorage.getItem(key),SYNC_CONFIRM_KEY)===null,'Disconnect did not clear device confirmation history');
 },{seed:filledState(),acceptDialogs:true});
 await run('Sync time: a failed first connection never displays imported sync metadata as device confirmation',async({context,page})=>{
  const mock=await mockGist(context,await state(page));mock.mode='invalid';await startMockSync(page);await page.waitForFunction(()=>document.getElementById('syncState').classList.contains('sync-error'));
  assert(await page.locator('#syncLastConfirmed').isHidden()&&await page.evaluate(key=>localStorage.getItem(key),SYNC_CONFIRM_KEY)===null,'Failed first connection invented a confirmation');
 },{seed:(()=>{const s=filledState();s.meta.lastSyncAt='2026-01-01T12:00:00.000Z';return s;})()});
 await run('Sync time: invalid or unrelated device histories remain hidden',async({page})=>{
  for(const record of [{gistId:TEST_GIST_ID,at:'not-a-date'},{gistId:'another-synthetic-gist',at:'2026-10-20T12:00:00.000Z'}]){
   await page.evaluate(({key,record,gist})=>{localStorage.setItem(key,JSON.stringify(record));localStorage.setItem('silhueta.gist.id.v1',gist);},{key:SYNC_CONFIRM_KEY,record,gist:TEST_GIST_ID});await page.reload({waitUntil:'networkidle'});await page.locator('.sync-trigger').click();assert(await page.locator('#syncLastConfirmed').isHidden(),'Invalid or unrelated confirmation time was displayed');
  }
 });
 await run('Undo and sync: restoring a record supersedes a previously synchronized deletion',async({context,page})=>{
  await go(page,'measure');const id='m_test_waist_new';await page.locator('[data-action="deleteMetric"][data-id="'+id+'"]').click();const tombstoneState=await state(page),mock=await mockGist(context,tombstoneState);await page.locator('#toast [data-action="undoDelete"]').click();
  await startMockSync(page);await waitSyncSuccess(page);const remote=await decryptedFixture(mock.envelope);
  assert(mock.patches>0&&remote.metricEntries[id].deleted===false&&(await state(page)).metricEntries[id].deleted===false,'Old remote deletion suppressed the restored measurement');
 },{seed:filledState(),acceptDialogs:true});
 await run('Undo and sync: a newer remote change is preserved instead of restoring a stale snapshot',async({context,page})=>{
  await go(page,'measure');const id='m_test_waist_new';await page.locator('[data-action="deleteMetric"][data-id="'+id+'"]').click();const remote=await state(page),clock=Date.now()+60000;remote.metricEntries[id]={...remote.metricEntries[id],value:86.5,note:'Newer synthetic remote change',updatedAt:new Date(clock).toISOString()};remote.meta.clock['metricEntries.'+id]=clock;await mockGist(context,remote);
  await startMockSync(page);await waitSyncSuccess(page);await page.locator('.sync-close').click();await page.locator('#toast [data-action="undoDelete"]').click();const latest=(await state(page)).metricEntries[id];
  assert(latest.deleted===true&&latest.value===86.5&&latest.note==='Newer synthetic remote change','Undo overwrote a newer remote version');
 },{seed:filledState(),acceptDialogs:true});
 await run('Installation: background browser signals preserve an unsaved measurement',async({page})=>{
  await go(page,'measure');await page.locator('#quickValue').fill('75.5');await offerInstall(page);
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  assert(await page.locator('#quickValue').inputValue()==='75.5','Install status update erased a measurement draft');
 });

 results.push({name:'No browser runtime errors across all scenarios',status:runtimeErrors.length?'fail':'pass',errors:runtimeErrors});
 const report={testedSource:process.env.GITHUB_SHA||'local',browser:browser.version(),testMode:'Chromium mobile emulation; isolated synthetic localStorage; no personal Gist',summary:{total:results.length,passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status==='fail').length},results,runtimeErrors,screenshots:shots.map(s=>s.name)};
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log('SILHUETA_AUDIT_JSON '+JSON.stringify(report));
 for(const shot of shots){console.log('SILHUETA_IMAGE_BEGIN '+shot.name);const b64=shot.bytes.toString('base64');for(let i=0;i<b64.length;i+=8000)console.log('SILHUETA_IMAGE_CHUNK '+b64.slice(i,i+8000));console.log('SILHUETA_IMAGE_END '+shot.name);}
 process.exitCode=report.summary.failed?1:0;
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
