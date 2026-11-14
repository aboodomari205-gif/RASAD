// Local browser verification using Chromium's CDP; no browser-testing dependency required.
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const children = [];
const existingDev=process.argv.includes('--dev-existing');
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
  await region('.atlas-region select','northern-jordan');await count(803);assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));
  if(existingDev){
    for(const [suffix,total]of [['manifest=1',0],['year=2026',803]]){
      const proof=await evaluate(`fetch('/api/observations?mode=northern-jordan&${suffix}').then(async r=>({status:r.status,type:r.headers.get('content-type'),body:await r.json()}))`);
      assert.equal(proof.status,200);assert.match(proof.type,/application\/json/);assert.equal(proof.body.features.length,total);assert.equal(proof.body.metadata.totalDelivered,6859);
    }
    await evaluate('document.querySelector("#atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');
    const dateInput=async(label,value)=>evaluate(`(()=>{const i=document.querySelector('input[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${value}');i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await dateInput('Atlas start date','2021-07-01');await dateInput('Atlas end date','2021-07-01');
    const expected=await evaluate("fetch('/api/observations?mode=northern-jordan&year=2021').then(r=>r.json()).then(j=>j.features.filter(f=>f.properties.date==='2021-07-01').length)");
    assert.ok(expected>0);await count(expected);
    await evaluate(`document.querySelector('button[aria-label="Close filters"]').click()`);
    await waitFor('!!document.querySelector(".observation-row")');await evaluate('document.querySelector(".observation-row").click()');await waitFor('!!document.querySelector(".atlas-popup-title")');
    assert.ok(await evaluate('document.querySelector(".maplibregl-popup").textContent.includes("2021-07-01")'));
    const {writeFile}=await import('node:fs/promises');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/runtime-dev-fix/north-2021-07-01.png',Buffer.from(shot.data,'base64'));
    await evaluate('document.querySelector("#atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');
    await dateInput('Atlas end date','2026-12-31');await dateInput('Atlas start date','2026-01-01');await count(803);
    await evaluate(`document.querySelector('button[aria-label="Close filters"]').click()`);
    console.log('PASS actual localhost:5173 same-origin JSON, North 2021-07-01 '+expected+' rendered observations, popup and 2026 restoration');
  }
  await navigate('Burning Calendar');await waitFor('!!document.querySelector(".calendar-grid")');if(existingDev){await region('select[aria-label="Calendar month"]','10');}await waitFor('document.querySelectorAll(".calendar-day[data-state=observed]").length>0');
  await region('select[aria-label="Processing strata"]','nrt');await count(265);
  await region('select[aria-label="Processing strata"]','standard');await count(538);
  await region('select[aria-label="Processing strata"]','all');await count(803);
  await region('select[aria-label="Calendar region"]','ajloun');await count(10);
  await region('select[aria-label="Calendar year"]','2006');await region('select[aria-label="Calendar month"]','11');await count(2);
  await waitFor('document.querySelectorAll(".calendar-day[data-state=observed]").length>0');assert.equal(await evaluate('document.querySelectorAll(".calendar-day[data-state=verified-zero]").length'),0);
  await evaluate(`(()=>{window.realURL=URL.createObjectURL;URL.createObjectURL=b=>{window.exported=b;return window.realURL(b)};[...document.querySelectorAll('.burning-calendar button')].find(b=>b.textContent==='Download displayed month CSV').click();})()`);
  const csv=await evaluate('await window.exported.text()');assert.equal(csv.split('\r\n').length,3);assert.ok(csv.includes('"standard"'));assert.ok(csv.includes('"2006-12-03"'));await evaluate('URL.createObjectURL=window.realURL');
  for(const module of ['Fire Season Clock','Sensor Intelligence','Fire DNA','Anomaly Detection','Decision Brief']) {
    await navigate(module);
    await waitFor('!!document.querySelector(".lab-content") && document.querySelector(".lab-content").getAttribute("aria-busy")!=="true"');
    await waitFor(module==='Decision Brief'?'document.querySelector(".lab-content").textContent.includes("ajloun-modis-standard-c61")':'!!document.querySelector(".lab-actions")');
  }
  await navigate('Evidence Engine');await waitFor('!!document.getElementById("start-judge-guide")');await evaluate('document.getElementById("start-judge-guide").click()');await count(22);await waitFor('document.querySelector("[data-sensitivity=current] td")?.textContent==="12"');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-sensitivity=current] td")].map(x=>Number(x.textContent))'),[12,13,1]);
  await evaluate('document.querySelector("#historical-overview>summary").click()');await waitFor('document.querySelectorAll("#historical-overview tbody tr").length>0');assert.ok(await evaluate('document.getElementById("historical-overview").textContent.includes("2006")'));
  await evaluate(`(()=>{window.realURL=URL.createObjectURL;URL.createObjectURL=b=>{window.exported=b;return window.realURL(b)};document.querySelector('#research-brief button').click();})()`);
  const report=await evaluate('JSON.parse(await window.exported.text())');assert.equal(report.comparison.observations.length,22);assert.equal(report.comparison.matching.pairs.length,12);assert.ok(report.comparison.datasets.every(d=>d.provenanceFiles?.length));assert.equal(report.comparison.methodology.validated,false);await evaluate('URL.createObjectURL=window.realURL');
  await evaluate('document.querySelector(".evidence-trace button").click()');
  await waitFor('!!document.querySelector(".atlas-popup-title") && !document.querySelector(".evidence-engine")');
  assert.ok(await evaluate('document.querySelector(".maplibregl-popup").textContent.includes("NASA FIRMS")'));
  assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));
  await navigate('Evidence Engine');await waitFor('!!document.querySelector("#research-brief")');
  // Repeat the source handoff with the date and sensor already applied.
  await evaluate('document.querySelector(".evidence-trace button").click()');
  await waitFor('!!document.querySelector(".atlas-popup-title") && !document.querySelector(".evidence-engine")');
  await navigate('Evidence Engine');await waitFor('!!document.querySelector("#research-brief")');
  const selectedScope=await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1"))');
  for(const selectedRegion of ['northern-jordan','ajloun']) {
    await region('select[aria-label="Intelligence region"]',selectedRegion);
    await waitFor('document.querySelector(".lab-content").getAttribute("aria-busy")!=="true" && !!document.querySelector("#research-brief")');
    const current=await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1"))');
    assert.equal(current.region,selectedRegion);assert.equal(current.startDate,selectedScope.startDate);assert.equal(current.endDate,selectedScope.endDate);assert.equal(current.sensor,selectedScope.sensor);
  }
  const {writeFile}=await import('node:fs/promises');const desktop=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/historical-desktop.png',Buffer.from(desktop.data,'base64'));
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
  await evaluate('document.querySelector(".evidence-engine").scrollIntoView()');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/historical-ar-mobile.png',Buffer.from(shot.data,'base64'));
  const metrics=(await send('Performance.getMetrics')).metrics;const measurement={metrics:metrics.filter(m=>['JSHeapUsedSize','JSHeapTotalSize','Nodes','Documents','TaskDuration'].includes(m.name)),navigation:await evaluate('performance.getEntriesByType("navigation")[0].toJSON()'),requestedArchivePaths:[...new Set(loaded)]};await writeFile(existingDev?'.checkpoints/runtime-dev-fix/browser-proof.json':'.checkpoints/historical-browser-performance.json',JSON.stringify({...measurement,origin},null,2));
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS actual historical Ajloun/North windows 10/803, processing 265/538, year 2006, CSV, candidate 12/13/1, summary, research provenance, Arabic mobile and retained map');
}finally{ws?.close();for(const child of children.reverse())child.kill();}
