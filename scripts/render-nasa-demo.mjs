import path from 'node:path';import fs from 'node:fs/promises';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const port=Number(process.env.RASAD_CDP_PORT??9611);
const out='.checkpoints/rasad-focused/screenshots';await fs.mkdir(out,{recursive:true});
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--enable-unsafe-swiftshader','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+path.resolve('.checkpoints/rasad-focused/demo-chrome'),'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));const keep=setInterval(()=>{},1000);let ws;
try{
 let v;for(let i=0;i<80;i++){try{v=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();break;}catch{}await delay(200);}assert.ok(v,'Chrome unavailable');
 ws=new WebSocket(v.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});let seq=0,session;const pending=new Map(),errors=[];
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={},target=session)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject,timer:setTimeout(()=>reject(Error('CDP timeout '+method)),20000)});ws.send(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<180;i++){if(await evaluate('Boolean('+expression+')'))return;await delay(150);}throw Error('Timed out '+expression);};
 const viewport=async(width,height)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});
 await send('Page.enable');await send('Runtime.enable');await viewport(1440,1000);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.navigate',{url:pathToFileURL(path.resolve('artifacts/RASAD_NASA_DEMO_7_SLIDES.html')).href});
 await wait('document.querySelectorAll(".slide").length===7');
 await evaluate('Promise.all([...document.images].map(i=>i.decode()))');
 const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
 const buffer=Buffer.from(pdf.data,'base64');const pages=(buffer.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
 assert.equal(pages,7);await fs.writeFile('artifacts/RASAD_NASA_DEMO_7_SLIDES.pdf',buffer);
 assert.deepEqual(errors,[]);console.log('PASS actual seven-page NASA demo PDF, '+buffer.length+' bytes.');
}finally{ws?.close();clearInterval(keep);child.kill();}
