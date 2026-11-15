/** Inspect staged blobs without printing any possible secret content. */
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),...args],{maxBuffer:64*1024*1024});
const paths=git('diff','--cached','--name-only','--diff-filter=ACMR','-z').toString().split('\0').filter(Boolean);
if(!paths.length)throw Error('No staged source changes');
let total=0;const errors=[];
const secrets=[/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{50,}/,/AKIA[A-Z0-9]{16}/,/sk-(?:proj-)?[A-Za-z0-9_-]{40,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/FIRMS_MAP_KEY\s*=\s*["']?[a-f0-9]{32}/i];
for(const filename of paths){
 const normalized=filename.replaceAll('\\','/');
 if(/(?:^|\/)(?:node_modules|\.checkpoints|\.git|\.aws|\.codex)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:sqlite\w*|zip|csv|pem|key|p12|pfx)$/i.test(normalized)||/^(?:server\/data\/|data\/(?:incoming|processed|indexes)\/)/.test(normalized))errors.push(filename+': private/raw path staged');
 const content=git('show',':'+filename);total+=content.length;if(content.length>20*1024*1024)errors.push(filename+': exceeds 20 MiB staged-file limit');
 if(!['.png','.jpg','.jpeg','.webp','.ico'].includes(path.extname(filename).toLowerCase())){
  const body=content.toString('utf8');if(secrets.some(pattern=>pattern.test(body)))errors.push(filename+': possible secret pattern (content suppressed)');
 }
}
if(errors.length)throw Error(errors.join('\n'));
console.log(JSON.stringify({passed:true,stagedFiles:paths.length,stagedBytes:total,secretPatternsFound:0,rawOrPrivateFilesStaged:0,maxFileBytes:20*1024*1024},null,2));
