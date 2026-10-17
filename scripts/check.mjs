import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
for(const file of ['app.js','processing.js','worker.js','site-config.js','scripts/serve.mjs']) execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'inherit'});
for(const file of ['index.html','report/index.html']) {
  const html=await readFile(resolve(root,file),'utf8');
  for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if(/^(?:https?:|#|data:)/.test(url)) continue;
    if(url.startsWith('/')) throw new Error(`Root-relative URL is unsafe for a project site: ${url}`);
    await access(resolve(root,dirname(file),url.split('#')[0]));
  }
}
console.log('PASS: JavaScript syntax, local assets, report images and repository-relative paths.');
