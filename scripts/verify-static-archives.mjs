import { verifyRegionAndSensitivity } from './verify-region-sensitivity.mjs';
// Local browser verification using Chromium's CDP; no browser-testing dependency required.
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const children = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function start(command, args) { const child = spawn(command, args, { windowsHide: true, stdio: 'ignore' }); children.push(child); return child; }
async function ready(url) { for (let i = 0; i < 100; i++) { try { const r = await fetch(url); if (r.ok) return r; } catch {} await delay(150); } throw new Error('Local service did not start: ' + url); }
let ws;
try {
  start(process.execPath, ['deployment/cloudflare/serve-static.mjs',...(process.argv[2]?[process.argv[2]]:[])]);
  await ready('http://127.0.0.1:5179');
  const profile = await mkdtemp(path.join(tmpdir(), 'firepulse-motion-'));
  start('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader', '--remote-debugging-port=9337', '--user-data-dir=' + profile, 'about:blank']);
  const targets = await (await ready('http://127.0.0.1:9337/json')).json();
  const target = targets.find(t => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let sequence = 0; const pending = new Map(); const errors = [];
  ws.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description ?? '')); });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression: `(async () => (${expression}))()`, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result.value; };
  const waitFor = async expression => { for (let i = 0; i < 100; i++) { try { if (await evaluate(expression)) return; } catch (error) { if (!/navigated|context was destroyed|Cannot read properties/.test(error.message)) throw error; } await delay(100); } throw new Error('Browser condition timed out: ' + expression); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('firepulse.mission-scope.v1', JSON.stringify({region:'ajloun',sensor:'MODIS',metric:'count',calendarMonth:'2012-12',startDate:'2012-12-21',endDate:'2012-12-21',frpMin:999}));` });
  await send('Page.navigate', { url: 'http://127.0.0.1:5179' });

  await waitFor('!!document.querySelector(".earth-enter")');
  await evaluate('document.querySelector(".earth-enter").click()');
  await waitFor('document.querySelectorAll(".observation-row").length===36');
  await evaluate(`(() => {let f=document.querySelector('.fire-map-canvas'); f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))]; while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getSource){window.verificationMap=h.memoizedState.current;window.originalCanvas=window.verificationMap.getCanvas();return true;}h=h.next;}f=f.return;}throw new Error('No map');})()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===36');
  const source=await evaluate('await window.verificationMap.getSource("observations").getData()');
  const {pointInRegion}=await import('../shared/observations.ts');const {loadAjlounGeometry}=await import('../server/dataCatalog.js');
  assert.ok(source.features.every(f=>pointInRegion(...f.geometry.coordinates,loadAjlounGeometry())));
  const api=await (await fetch(`http://127.0.0.1:5179/archive-data/ajloun.json`)).json();
  assert.equal(api.features.length,36); assert.equal(api.features.filter(f=>f.properties.instrument==='MODIS').length,5);assert.equal(api.features.filter(f=>f.properties.instrument==='VIIRS').length,31);
  const scope=await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1"))');
  assert.equal(scope.startDate,'2020-08-02');assert.equal(scope.endDate,'2025-10-18');assert.equal(scope.frpMin,undefined);
  console.log('PASS static archive 36 detections (no API server): MODIS 5 / VIIRS 31; polygon membership; stale 2012 date and FRP migration');
  await waitFor('!window.verificationMap.isMoving()');
  await waitFor('window.verificationMap.queryRenderedFeatures({layers:["observations"]}).length>0');
  await delay(1400);
  const point=await evaluate('(() => { const f=window.verificationMap.queryRenderedFeatures({layers:["observations"]}).find(f=>{const p=window.verificationMap.project(f.geometry.coordinates);const r=window.verificationMap.getCanvas().getBoundingClientRect();return document.elementFromPoint(p.x+r.left,p.y+r.top)===window.verificationMap.getCanvas();});const p=window.verificationMap.project(f.geometry.coordinates);const r=window.verificationMap.getCanvas().getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top};})()');
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
  await waitFor('!!document.querySelector(".atlas-popup-title")');
  await evaluate('document.querySelector(".observation-row").click()');
  await waitFor('!!document.querySelector(".atlas-popup-title")');
  assert.ok(await evaluate('document.querySelector(".maplibregl-popup").textContent.includes("NASA FIRMS")'));
  console.log('PASS real rendered point layer and clickable metadata details');
  await evaluate('document.querySelector("#atlas-filter-trigger").click()');
  await waitFor('!!document.querySelector(".atlas-filter-panel")');
  await evaluate(`document.querySelector('input[name=atlas-sensor][value=MODIS]').click()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===5');
  await evaluate(`document.querySelector('input[name=atlas-sensor][value=VIIRS]').click()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===31');
  await evaluate(`document.querySelector('input[name=atlas-sensor][value=all]').click()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===36');
  await evaluate(`(() => {for(const label of ['Atlas start date','Atlas end date']){const i=document.querySelector('input[aria-label="'+label+'"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'2025-10-18');i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.every(f=>f.properties.date==="2025-10-18")');
  assert.ok(await evaluate('(await window.verificationMap.getSource("observations").getData()).features.length>0'));
  await evaluate(`[...document.querySelectorAll('.atlas-range-filters button')].find(b=>b.textContent.includes('Clear')).click()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===36');
  await evaluate(`document.querySelector('button[aria-label="Close filters"]').click()`);
  console.log('PASS real sensor/date filtering and reset');
  for(const region of ['northern-jordan','ajloun']){
    await evaluate(`(()=>{const s=document.querySelector('.atlas-region select');s.value='${region}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await waitFor(`(await window.verificationMap.getSource("observations").getData()).features.length===${region==='ajloun'?36:0}`);
  }
  assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));
  console.log('PASS Jordan region isolation and return to 36 Ajloun detections without map remount');
  const navigate=async name=>{await evaluate('document.querySelector(".atlas-index-trigger").click()');await waitFor('!!document.querySelector(".atlas-index-sheet")');await evaluate(`[...document.querySelectorAll('.atlas-index-sheet button')].find(b=>b.textContent.includes('${name}')).click()`);};
  await navigate('Burning Calendar');await waitFor('document.querySelectorAll(".calendar-day[data-state=observed]").length>0');
  console.log('PASS Burning Calendar shows real observed days');
  for(const module of ['Fire Season Clock','Sensor Intelligence','Fire DNA','Anomaly Detection','Decision Brief']){
    await navigate(module);await waitFor('!!document.querySelector(".lab-content") && document.querySelector(".lab-content").getAttribute("aria-busy")!=="true"');
    await waitFor(module === 'Decision Brief' ? 'document.querySelector(".lab-content").textContent.includes("ajloun-snpp-842985")' : '!!document.querySelector(".lab-actions")');
    console.log('PASS shared real data module: '+module);
  }
  await navigate('Evidence Engine');
  await waitFor('document.querySelector(".evidence-total strong")?.textContent==="5"');
  assert.equal(await evaluate('document.querySelectorAll(".evidence-pairs article").length'),5);
  assert.ok(await evaluate('document.querySelector(".evidence-verdicts").textContent.includes("provisional")'));
  await evaluate(`(() => {const i=document.querySelector('input[aria-label="Matching radius"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'0.1');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor('document.querySelector(".evidence-total strong")?.textContent==="0"');
  await evaluate(`(() => {const i=document.querySelector('input[aria-label="Matching radius"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'1');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor('document.querySelector(".evidence-total strong")?.textContent==="5"');
  await evaluate('document.querySelector(".evidence-trace summary").click()');
  assert.ok(await evaluate('document.querySelector(".evidence-trace code").textContent.startsWith("fp1:ajloun-")'));
  const {writeFile:saveEvidence}=await import('node:fs/promises');
  const evidenceShot=await send('Page.captureScreenshot',{format:'png'});await saveEvidence('.checkpoints/evidence-desktop.png',Buffer.from(evidenceShot.data,'base64'));
  await evaluate(`document.querySelector('.intelligence-workspace .language-switch').click()`);
  await waitFor('document.documentElement.dir==="rtl"');
  assert.ok(await evaluate('document.querySelector(".evidence-intro h2").textContent!=="Every conclusion has a source."'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
  const arShot=await send('Page.captureScreenshot',{format:'png'});await saveEvidence('.checkpoints/evidence-ar-mobile.png',Buffer.from(arShot.data,'base64'));
  assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'));
  await evaluate(`document.querySelector('.intelligence-workspace .language-switch').click()`);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate('(()=>{window.evidenceExport=null;window.originalObjectURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.evidenceExport=blob;return window.originalObjectURL(blob)}})()');
  await evaluate(`[...document.querySelectorAll('.evidence-engine button')].find(b=>b.textContent==='Download evidence JSON').click()`);
  const exported=await evaluate('JSON.parse(await window.evidenceExport.text())');
  assert.equal(exported.observations.length,36);assert.equal(exported.matching.pairs.length,5);assert.equal(exported.matching.methodology.eventCount,null);assert.ok(exported.verdicts.find(v=>v.status==='provisional').ids.length>0);
  await evaluate('URL.createObjectURL=window.originalObjectURL');
  await evaluate('document.querySelector(".evidence-trace button").click()');
  await waitFor('!!document.querySelector(".atlas-popup-title") && !document.querySelector(".evidence-engine")').catch(async error=>{console.log('SOURCE FAILURE',await evaluate('JSON.stringify({scope:JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")),popup:!!document.querySelector(".atlas-popup-title"),evidence:!!document.querySelector(".evidence-engine"),body:document.querySelector(".ledger-body")?.textContent.slice(0,300),points:(await window.verificationMap.getSource("observations").getData()).features.map(f=>[f.id,f.properties.date])})'));throw error;});
  assert.ok(await evaluate('document.querySelector(".maplibregl-popup").textContent.includes("NASA FIRMS")'));
  await evaluate('document.querySelector("#atlas-filter-trigger").click()');
  await evaluate(`[...document.querySelectorAll('.atlas-range-filters button')].find(b=>b.textContent.includes('Clear')).click()`);
  await evaluate("document.querySelector('input[name=atlas-sensor][value=all]').click()");
  await evaluate(`document.querySelector('button[aria-label="Close filters"]').click()`);
  await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===36');
  console.log('PASS actual evidence 5 candidate pairs, configurable thresholds, source trace and Arabic/mobile layout');
  await navigate('Mission Atlas');await waitFor('!!document.querySelector(".maplibregl-canvas")');
  for(const name of ['Global Earth','North Jordan','Ajloun pilot']){
    await evaluate('document.querySelector(".region-explorer summary").click()');
    await evaluate(`[...document.querySelectorAll('.region-camera-options button')].find(b=>b.textContent.includes('${name}')).click()`);
    await waitFor('!window.verificationMap.isMoving()');
    assert.equal(await evaluate('(await window.verificationMap.getSource("observations").getData()).features.length'),36);
    if(name==='Global Earth') {assert.ok(await evaluate('window.verificationMap.getZoom()<3'));assert.ok(await evaluate('document.querySelector(".camera-scope-note").textContent.includes("global data is unavailable")'));}
  }
  console.log('PASS Earth / North Jordan / Ajloun camera exploration preserves regional data scope');

  await evaluate(`[...document.querySelectorAll('.atlas-imagery button')].find(b=>b.textContent==='Street').click()`);
  await waitFor('!!window.verificationMap.getSource("observations") && window.verificationMap.queryRenderedFeatures({layers:["observations"]}).length>0');
  await evaluate(`[...document.querySelectorAll('.atlas-imagery button')].find(b=>b.textContent==='Satellite').click()`);
  await waitFor('!!window.verificationMap.getSource("observations") && window.verificationMap.queryRenderedFeatures({layers:["observations"]}).length>0');
  assert.equal(await evaluate('(await window.verificationMap.getSource("observations").getData()).features.length'),36);
  console.log('PASS street/satellite retains real point source');
  await verifyRegionAndSensitivity({evaluate,waitFor,navigate,send});
  if(process.argv.includes('--audit')){const {auditExperience}=await import('./audit-experience.mjs');await auditExperience({evaluate,waitFor,navigate,send});}
  const {writeFile}=await import('node:fs/promises');
  await delay(1400);
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/activation-desktop.png',Buffer.from(shot.data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(500);
  const mobile=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/activation-mobile.png',Buffer.from(mobile.data,'base64'));
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS browser no uncaught exceptions; desktop/mobile screenshots captured');
} finally {ws?.close();for(const child of children.reverse())child.kill();}
