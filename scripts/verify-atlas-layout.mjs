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

  assert.equal(await evaluate('document.querySelectorAll(".earth-skip").length'),0);
  await region('.atlas-region select','northern-jordan');await count(803);
  const {writeFile}=await import('node:fs/promises');const proofs=[];
  const open=async()=>{if(!await evaluate('!!document.querySelector(".atlas-inspector")'))await evaluate('document.querySelector("button[aria-controls=atlas-inspector]").click()');await waitFor('!!document.querySelector(".atlas-inspector")');await delay(250);};
  const check=async()=>evaluate(`(()=>{const selectors=['.atlas-masthead','.atlas-inspector','.atlas-tool-spine','.atlas-imagery','.atlas-timeline','.atlas-footer','.maplibregl-ctrl-bottom-left','.maplibregl-ctrl-bottom-right'];const rectangles=Object.fromEntries(selectors.map(s=>{const e=document.querySelector(s);if(!e)throw Error("Missing "+s);const r=e.getBoundingClientRect();return[s,{x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height}]}));const overlaps=[];for(let i=0;i<selectors.length;i++)for(let j=i+1;j<selectors.length;j++){const a=rectangles[selectors[i]],b=rectangles[selectors[j]];if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push([selectors[i],selectors[j]]);}const panel=rectangles['.atlas-inspector'],body=document.querySelector('.ledger-body'),footer=document.querySelector('.ledger-caveat').getBoundingClientRect();return{rectangles,overlaps,bodyHeight:body.clientHeight,footerVisible:footer.bottom<=panel.bottom+1&&footer.y>=panel.y,noOverflow:document.documentElement.scrollWidth<=innerWidth+1};})()`);
  for(const lang of ['en','ar']){
   if(lang==='ar')await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');
   for(const [width,height]of [[1366,768],[1440,900],[1920,1080],[390,844],[320,740]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<760});await delay(300);await open();
    const proof=await check();proofs.push({lang,width,height,...proof});assert.deepEqual(proof.overlaps,[],JSON.stringify(proof));assert.ok(proof.footerVisible);assert.ok(proof.bodyHeight>40);assert.ok(proof.noOverflow);
    await evaluate('(()=>{const b=document.querySelector(".ledger-body");b.scrollTop=b.scrollHeight;})()');assert.ok(await evaluate('document.querySelector(".ledger-body").scrollTop>0'));
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/layout-'+lang+'-'+width+'.png',Buffer.from(shot.data,'base64'));
    await evaluate('document.querySelector(".atlas-inspector .atlas-dismiss").click()');await waitFor('!document.querySelector(".atlas-inspector")');await open();
   }
  }
  await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});await open();
  for(let i=0;i<20;i++){if(!await evaluate('!!document.querySelector(".ledger-more")'))break;await evaluate('document.querySelector(".ledger-more").click()');await delay(40);}
  await waitFor('document.querySelectorAll(".observation-row").length===803');await evaluate('document.querySelector(".ledger-body").scrollTop=document.querySelector(".ledger-body").scrollHeight');
  assert.ok(await evaluate('(()=>{const last=[...document.querySelectorAll(".observation-row")].at(-1).getBoundingClientRect(),body=document.querySelector(".ledger-body").getBoundingClientRect();return last.bottom<=body.bottom+1&&last.y>=body.y;})()'));
  await writeFile('.checkpoints/layout-rectangles.json',JSON.stringify(proofs,null,2));assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));assert.deepEqual(errors,[]);console.log('PASS actual localhost:5173: EN/AR at 1366x768,1440x900,1920x1080,390x844,320x740; no panel/timeline/tool/header/footer overlap, visible footer, scrollable body, all 803 records reachable, close/reopen, unchanged map canvas.');
}finally{ws?.close();for(const child of children.reverse())child.kill();}
