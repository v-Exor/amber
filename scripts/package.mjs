import { mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const out=resolve(root,'artifacts','github-pages');
// Only reset this explicitly bounded, generated staging directory.
if(!out.startsWith(root)) throw new Error('Invalid package directory');
await rm(out,{recursive:true,force:true}); await mkdir(out,{recursive:true});
for(const item of ['index.html','styles.css','app.js','processing.js','worker.js','site-config.js','.nojekyll','assets','downloads','python','report']) await cp(resolve(root,item),resolve(out,item),{recursive:true});
console.log(`Deployable static files: ${out}`);
