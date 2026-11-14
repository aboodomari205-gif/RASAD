// Local browser verification using Chromium's CDP; no browser-testing dependency required.
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const children = [];
const existingDev=true;
const origin=existingDev?'http://localhost:5173':'http://127.0.0.1:5179';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function start(command, args) { const child = spawn(command, args, { windowsHide: true, stdio: 'ignore' }); children.push(child); return child; }
async function ready(url) { for (let i = 0; i < 100; i++) { try { const r = await fetch(url); if (r.ok) return r; } catch {} await delay(150); } throw new Error('Local service did not start: ' + url); }
let ws;
try {
  if(!existingDev)start(process.execPath, ['deployment/cloudflare/serve-static.mjs',process.argv[2]??'.checkpoints/historical-static']);
  await ready(origin);
  const profile = await mkdtemp(path.join(tmpdir(), 'firepulse-motion-'));
  start('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader', '--remote-debugging-port=9337', '--user-data-dir=' + profile, 'about:blank']);
  const targets = await (await ready('http://127.0.0.1:9337/json')).json();
  const target = targets.find(t => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let sequence = 0; const pending = new Map(); const errors = []; const consoleErrors=[];
  ws.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); } else if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')consoleErrors.push(message.params.args.map(a=>a.description??a.value).join(' ')); else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description ?? '')); });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression: `(async () => (${expression}))()`, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; };
  const waitFor = async expression => { for (let i = 0; i < 100; i++) { try { if (await evaluate(expression)) return; } catch (error) { if (!/navigated|context was destroyed|Cannot read properties/.test(error.message)) throw error; } await delay(100); } throw new Error('Browser condition timed out: ' + expression); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Network.enable');await send('Performance.enable');
  const loaded=[];ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Network.responseReceived'&&(m.params.response.url.includes('/archive-data/')||m.params.response.url.includes('/api/observations')))loaded.push(m.params.response.url);});
  await send('Page.navigate',{url:origin+'/#mission-atlas'});await waitFor('!!document.querySelector(".earth-enter")');assert.equal(await evaluate('document.querySelectorAll(".earth-skip").length'),0);assert.equal(await evaluate('document.querySelectorAll(".earth-enter").length'),1);await evaluate('document.querySelector(".earth-enter").click()');
  await waitFor('document.querySelectorAll(".observation-row").length===10').catch(async error=>{console.log(await evaluate('document.body.innerText.slice(-2500)'));console.log(errors);console.log(consoleErrors);console.log(loaded);throw error;});
  await evaluate(`(()=>{let f=document.querySelector('.fire-map-canvas');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getSource){window.verificationMap=h.memoizedState.current;window.originalCanvas=window.verificationMap.getCanvas();return;}h=h.next;}f=f.return;}throw Error('No map');})()`);
  const count=n=>waitFor(`(await window.verificationMap.getSource('observations').getData()).features.length===${n}`);
  await count(10);assert.equal(await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).startDate'),'2026-01-01');
  const region=async(selector,value)=>{await evaluate(`(()=>{const s=document.querySelector('${selector}');s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);};


 await region('.atlas-region select','northern-jordan');await count(803);
 const click=async selector=>{const p=await evaluate(`(()=>{const b=document.querySelector('${selector}'),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!b.contains(hit))throw Error('Blocked '+hit?.outerHTML);return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});};
 const open=async()=>{if(!await evaluate('document.querySelector(".region-explorer").open'))await click('.region-explorer>summary');await waitFor('document.querySelector(".region-explorer").open');};
 const {writeFile}=await import('node:fs/promises');const proofs=[];
 for(const lang of ['en','ar']){
  if(lang==='ar')await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');
  for(const [width,height]of [[1366,768],[1440,900],[1920,1080],[390,844],[320,740]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<760});await delay(300);await open();
   const proof=await evaluate(`(()=>{const panel=document.querySelector('.region-explorer-panel'),body=document.querySelector('.region-explorer-content'),header=document.querySelector('.region-explorer-header');const box=e=>{const r=e.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};const before=box(header);body.scrollTop=body.scrollHeight;const last=box(body.querySelector('select'));return{panel:box(panel),timeline:box(document.querySelector('.atlas-timeline')),missionHeader:box(document.querySelector('.atlas-masthead')),body:box(body),headerBefore:before,headerAfter:box(header),lastControl:last,scrollHeight:body.scrollHeight,clientHeight:body.clientHeight,scrollTop:body.scrollTop,noOverflow:document.documentElement.scrollWidth<=innerWidth+1};})()`);
   assert.ok(proof.panel.bottom<=proof.timeline.top-1,JSON.stringify(proof));assert.ok(proof.panel.top>=proof.missionHeader.bottom);assert.ok(proof.panel.left>=0&&proof.panel.right<=width+1);assert.ok(proof.lastControl.top>=proof.body.top&&proof.lastControl.bottom<=proof.body.bottom+1);assert.deepEqual(proof.headerBefore,proof.headerAfter);assert.ok(proof.noOverflow);if(width===320)assert.ok(proof.scrollTop>0);
   await evaluate('document.querySelector(".region-explorer-content select").focus()');assert.ok(await evaluate('document.activeElement===document.querySelector(".region-explorer-content select")'));
   proofs.push({lang,width,height,...proof});const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/exploration-'+lang+'-'+width+'.png',Buffer.from(shot.data,'base64'));
   await click('.region-explorer-close');await waitFor('!document.querySelector(".region-explorer").open');
  }
 }
 await open();await evaluate('document.querySelector(".region-camera-options button:last-child").scrollIntoView({block:"nearest"})');await click('.region-camera-options button:last-child');await waitFor('!document.querySelector(".region-explorer").open');await count(803);
 await open();await evaluate('document.querySelector(".region-explorer-content").scrollTop=document.querySelector(".region-explorer-content").scrollHeight');await region('.region-explorer select','ajloun');await waitFor('!document.querySelector(".region-explorer").open');await count(10);
 await open();assert.ok(await evaluate('(()=>{const e=document.querySelector(".atlas-year-controls select"),r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()'));
 await writeFile('.checkpoints/exploration-rectangles.json',JSON.stringify(proofs,null,2));assert.deepEqual(errors,[]);console.log('PASS actual localhost:5173: manually opened exploration panel EN/AR at all five sizes, zero timeline overlap, fixed header/close, internal scrolling, final selector/action reachable, original camera/region actions and timeline interaction retained.');
}finally{ws?.close();for(const child of children.reverse())child.kill();}
