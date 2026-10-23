import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFile(path.join(root,name),'utf8');
let [html,worker,readme]=await Promise.all(['index.html','service-worker.js','README.md'].map(read));
const pattern=/const APP_VERSION='(\d+\.\d+\.\d+)';/;
const current=html.match(pattern)?.[1];
assert(current,'APP_VERSION must be defined once in index.html');
const command=process.argv[2]||'--check';

if(command==='--check'){
 assert(worker.includes("const VERSION='silhueta-app-v"+current+"';"),'Service worker cache version differs from APP_VERSION');
 assert(html.includes('manifest.webmanifest?v='+current+'"'),'Manifest query differs from APP_VERSION');
 assert(html.includes('data-app-version>${APP_VERSION}</span>'),'Settings must render APP_VERSION rather than a separate version string');
 assert(readme.startsWith('# Silhueta · versão '+current+' '),'README version differs from APP_VERSION');
 console.log('PASS: release '+current+' matches Settings, cache, manifest and README');
}else{
 const parts=current.split('.').map(Number);
 const next=command==='patch'?`${parts[0]}.${parts[1]}.${parts[2]+1}`:command;
 assert(/^\d+\.\d+\.\d+$/.test(next),'Use: node scripts/release.mjs patch | X.Y.Z | --check');
 const numbers=next.split('.').map(Number),firstDifference=numbers.findIndex((n,i)=>n!==parts[i]);
 assert(firstDifference>=0&&numbers[firstDifference]>parts[firstDifference],'Release version must increase');
 html=html.replace(pattern,"const APP_VERSION='"+next+"';").replace(/manifest\.webmanifest\?v=[\d.]+/, 'manifest.webmanifest?v='+next);
 worker=worker.replace(/const VERSION='silhueta-app-v[\d.]+';/,"const VERSION='silhueta-app-v"+next+"';");
 readme=readme.replace(/^# Silhueta · versão [\d.]+ /,'# Silhueta · versão '+next+' ');
 await writeFile(path.join(root,'index.html'),html);
 await writeFile(path.join(root,'service-worker.js'),worker);
 await writeFile(path.join(root,'README.md'),readme);
 console.log('Updated release '+current+' → '+next+'. Run node scripts/release.mjs --check.');
}
