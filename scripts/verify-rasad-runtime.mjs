import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const artifacts=[];
async function inspect(directory){
 for(const entry of await fs.readdir(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);if(entry.isDirectory()){await inspect(file);continue;}
  if(!/\.(?:js|json|html|webmanifest|css|geojson)$/.test(file))continue;
  const bytes=await fs.readFile(file),text=bytes.toString('utf8');
  assert.doesNotMatch(text,/ajloun|northern[- ]jordan|\bJordan\b|JO-AJ|\bIrbid\b|\bAmman\b/i,file+' contains a retired study label');
  assert.doesNotMatch(text,/FIREPULSE/,file+' contains retired visible branding');
  artifacts.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
}
await inspect('dist');
const active=JSON.parse(await fs.readFile('server/data/south-america/active.json','utf8'));
const result={generation:active.generation,retiredStudyLabels:0,retiredVisibleBranding:0,artifacts,passed:true};
await fs.writeFile('.checkpoints/rasad/runtime-scope-proof.json',JSON.stringify(result,null,2));
console.log('PASS production bundle scope and RASAD branding:',artifacts.length,'hashed text artifacts; zero retired study labels.');
