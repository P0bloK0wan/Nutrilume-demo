/** Explicit public artifact. Never copy the repository root or runtime data. */
import {cp,mkdir,rm,copyFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=resolve(root,'public-site');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const files=['demo.html','app.js','foods.json','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png','logo.png','avatar-logo.png','apple-touch-icon.png'];
for(const file of files)await copyFile(join(root,file),join(out,file));
await copyFile(join(root,'pages/index.html'),join(out,'index.html'));
await mkdir(join(out,'platform'));await copyFile(join(root,'platform/styles.css'),join(out,'platform/styles.css'));
await cp(join(root,'creative-studio'),join(out,'studio'),{recursive:true,filter:src=>!src.split('/').some(p=>['.git','node_modules','__pycache__','.state'].includes(p))});
await writeFile(join(out,'.nojekyll'),'');
let count=0;
async function validate(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if((await lstat(p)).isSymbolicLink())throw Error('Symlink forbidden');if(['data','server','node_modules','.env'].includes(entry.name)||entry.name.endsWith('.sqlite'))throw Error('Private runtime in artifact');if(entry.isDirectory())await validate(p);else count++;}}
await validate(out);console.log(`GitHub Pages: ${count} public files in public-site; no private runtime.`);
