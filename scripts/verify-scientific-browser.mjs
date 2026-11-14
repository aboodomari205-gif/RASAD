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
  await send('Page.navigate',{url:origin+'/#mission-atlas'});await waitFor('!!document.querySelector(".earth-enter")');await evaluate('document.querySelector(".earth-enter").click()');
  await waitFor('document.querySelectorAll(".observation-row").length===10').catch(async error=>{console.log(await evaluate('document.body.innerText.slice(-2500)'));console.log(errors);console.log(consoleErrors);console.log(loaded);throw error;});
  await evaluate(`(()=>{let f=document.querySelector('.fire-map-canvas');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getSource){window.verificationMap=h.memoizedState.current;window.originalCanvas=window.verificationMap.getCanvas();return;}h=h.next;}f=f.return;}throw Error('No map');})()`);
  const count=n=>waitFor(`(await window.verificationMap.getSource('observations').getData()).features.length===${n}`);
  await count(10);assert.equal(await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).startDate'),'2026-01-01');
  const navigate=async name=>{await evaluate('document.querySelector(".atlas-index-trigger").click()');await waitFor('!!document.querySelector(".atlas-index-sheet")');await evaluate(`[...document.querySelectorAll('.atlas-index-sheet button')].find(b=>b.textContent.includes('${name}')).click()`);};
  const region=async(selector,value)=>{await evaluate(`(()=>{const s=document.querySelector('${selector}');s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);};

 const {writeFile}=await import('node:fs/promises');
 await navigate('Evidence Engine');await waitFor('!!document.getElementById("start-judge-guide")');await evaluate('document.getElementById("start-judge-guide").click()');await count(22);await waitFor('!!document.querySelector(".scientific-context")');await evaluate('document.querySelector(".scientific-context>summary").click()');
 const download=async selector=>{await evaluate(`(()=>{window.originalObjectURL=URL.createObjectURL;URL.createObjectURL=b=>{window.scientificBlob=b;return window.originalObjectURL(b)};document.querySelector('${selector}').click();})()`);const value=await evaluate('JSON.parse(await window.scientificBlob.text())');await evaluate('URL.createObjectURL=window.originalObjectURL');return value;};
 let r=await download('.scientific-context button');assert.equal(r.uniqueDelivered,22);assert.equal(r.association.pairs.length,12);assert.equal(r.gates.historicalMedian,null);assert.equal(r.gates.calibratedEquivalentCounts,null);assert.equal(r.seasonal.reduce((n,b)=>n+b.count,0),22);
 await evaluate(`document.querySelector('button[data-setting="0.25/6"]').click()`);await waitFor('document.querySelector("[data-sensitivity=current] small").textContent.includes("0.25")');r=await download('.scientific-context button');assert.equal(r.association.methodology.distanceKm,.25);assert.equal(r.association.methodology.minutes,6);assert.equal(r.association.pairs.length,await evaluate('Number(document.querySelector("[data-sensitivity=current] td").textContent)'));
 const research=await download('#research-brief button');assert.equal(research.harmonization.schema,'firepulse.source-aware-harmonization/v1');assert.equal(research.harmonization.association.pairs.length,research.comparison.matching.pairs.length);assert.ok(research.comparison.datasets.every(d=>d.provenanceFiles.length));
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/science-evidence-desktop.png',Buffer.from(shot.data,'base64'));
 await navigate('Burning Calendar');await waitFor('!!document.querySelector(".calendar-grid")');await region('select[aria-label="Calendar month"]','6');await waitFor('!!document.querySelector(".scientific-context")');await evaluate('document.querySelector(".scientific-context>summary").click()');r=await download('.scientific-context button');assert.equal(r.uniqueDelivered,18);assert.ok(r.temporal.series.filter(b=>b.period.length===10).every(b=>b.period.startsWith('2023-07')));
 for(const module of ['Fire Season Clock','Fire DNA','Sensor Intelligence']){await navigate(module);await waitFor('!!document.querySelector(".scientific-context")');}
 await evaluate('document.querySelector(".scientific-context>summary").click()');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));assert.ok(await evaluate('document.querySelector(".scientific-context>summary").textContent!=="Scientific harmonization / scoped evidence"'));
 await evaluate('document.querySelector(".scientific-context").scrollIntoView()');const ar=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/science-ar-mobile.png',Buffer.from(ar.data,'base64'));
 assert.deepEqual(errors,[]);console.log('PASS actual localhost:5173 scientific engine: scoped Calendar 18, Ajloun 2023 22, baseline 12 candidate pairs, live threshold/export agreement, research provenance/methodology, Season/DNA/Sensor integration, Arabic 320px and reduced motion.');
}finally{ws?.close();for(const child of children.reverse())child.kill();}
