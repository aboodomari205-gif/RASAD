import {evidenceArabic} from '../src/i18n/evidence-ar.ts';
// Local browser verification using Chromium's CDP; no browser-testing dependency required.
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const children = [];
const existingDev=true;
const origin=process.argv.includes('--origin')?process.argv[process.argv.indexOf('--origin')+1]:(existingDev?'http://localhost:5173':'http://127.0.0.1:5179');
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('This browser audit accepts local origins only.');
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
  if(process.argv.includes('--refresh')){
    await send('Page.reload',{ignoreCache:true});
    await waitFor('!!document.querySelector(".earth-enter")');
    await evaluate('document.querySelector(".earth-enter").click()');
    await waitFor('document.querySelectorAll(".observation-row").length===10');
    assert.equal(await evaluate('location.hash'),'#mission-atlas');
  }
  await evaluate(`(()=>{let f=document.querySelector('.fire-map-canvas');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getSource){window.verificationMap=h.memoizedState.current;window.originalCanvas=window.verificationMap.getCanvas();return;}h=h.next;}f=f.return;}throw Error('No map');})()`);
  const count=n=>waitFor(`(await window.verificationMap.getSource('observations').getData()).features.length===${n}`);
  await count(10);assert.equal(await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).startDate'),'2026-01-01');
  const navigate=async name=>{await evaluate('document.querySelector(".atlas-index-trigger").click()');await waitFor('!!document.querySelector(".atlas-index-sheet")');await evaluate(`[...document.querySelectorAll('.atlas-index-sheet button')].find(b=>b.textContent.includes('${name}')).click()`);};
  const region=async(selector,value)=>{await evaluate(`(()=>{const s=document.querySelector('${selector}');s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);};

 await region('.atlas-region select','northern-jordan');await count(803);await waitFor('document.querySelectorAll(".observation-row").length===50');assert.ok(await evaluate('document.querySelector(".atlas-editorial").textContent.includes("JO / NORTHERN JORDAN")'));
 await evaluate('document.querySelector(".observation-row").click()');await waitFor('!!document.querySelector(".ledger-detail")');assert.ok(await evaluate('document.querySelector(".ledger-detail>.atlas-overline").textContent.includes("NORTHERN JORDAN")'));
 await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.equal(await evaluate('document.querySelector(".ledger-detail>.atlas-overline").textContent'),String.fromCodePoint(1585,1589,1583,32,1581,1585,1575,1585,1610,32,47,32,1588,1605,1575,1604,32,1575,1604,1571,1585,1583,1606));await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');
 await navigate('Trust the Signal');await waitFor('document.querySelector(".lab-content").textContent.includes("include standard and NRT")');assert.ok(await evaluate('document.querySelector(".lab-content").textContent.includes("NOAA-20/21")'));
 await navigate('Fire DNA');await waitFor('document.querySelector(".lab-content").textContent.includes("Software screening rule")');
 await navigate('Anomaly Detection');await waitFor('document.querySelector(".lab-content").textContent.includes("independently validated baseline methodology are missing")');assert.ok(await evaluate('[...document.querySelectorAll(".lab-content button")].some(b=>b.disabled&&b.textContent.includes("Anomaly scoring unavailable"))'));
 await navigate('Decision Brief');await waitFor('document.querySelector(".decision-report").textContent.includes("Calibrated trends and validated anomalies are unavailable")');
 await navigate('Mission Atlas');await region('.atlas-region select','ajloun');await count(10);await region('.atlas-year-controls select','2023');await count(22);
 await navigate('Burning Calendar');await waitFor('!!document.querySelector(".calendar-grid")');await region('select[aria-label="Calendar month"]','6');await waitFor('document.querySelector(".calendar-month-summary").textContent.includes("MODIS: 2")');
 const exportClick=async selector=>{await evaluate(`(()=>{window.originalObjectURL=URL.createObjectURL;URL.createObjectURL=b=>{window.claimBlob=b;return window.originalObjectURL(b)};document.querySelector('${selector}').click();})()`);const text=await evaluate('await window.claimBlob.text()');await evaluate('URL.createObjectURL=window.originalObjectURL');return text;};
 await evaluate(`document.querySelector('[data-calendar-date="2023-07-14"]').click()`);await waitFor('!!document.getElementById("calendar-modis-detail")');assert.deepEqual(await evaluate('[...document.querySelectorAll("#calendar-day-detail .calendar-day-stat strong")].map(e=>Number(e.textContent))'),[2,11]);
 await evaluate(`(()=>{window.originalObjectURL=URL.createObjectURL;URL.createObjectURL=b=>{window.claimBlob=b;return window.originalObjectURL(b)};[...document.querySelectorAll('.burning-calendar button')].find(b=>b.textContent==='Download displayed month CSV').click();})()`);const csv=await evaluate('await window.claimBlob.text()');await evaluate('URL.createObjectURL=window.originalObjectURL');assert.equal(csv.split('\r\n').length-1,18);
 await evaluate(`(()=>{window.svgURL=URL.createObjectURL;URL.createObjectURL=b=>{window.svgBlob=b;return window.svgURL(b)};[...document.querySelectorAll('.burning-calendar button')].find(b=>b.textContent==='Download displayed month SVG').click();})()`);
 const svg=await evaluate('await window.svgBlob.text()');assert.ok(svg.includes('firepulse.calendar-visualization/v1'));
 assert.equal(await evaluate(`(()=>{const xml=new DOMParser().parseFromString(${JSON.stringify(svg)},'image/svg+xml');if(xml.querySelector('parsererror'))throw Error('Invalid exported SVG');return JSON.parse(xml.querySelector('metadata').textContent).sourceIds.length;})()`),18);
 await evaluate(`new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=reject;img.src=window.svgURL(window.svgBlob);})`);await evaluate('URL.createObjectURL=window.svgURL');
 await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');
 const arabicSVGButton=evidenceArabic['Download displayed month SVG'];
 assert.ok(await evaluate(`[...document.querySelectorAll('.burning-calendar button')].some(b=>b.textContent===${JSON.stringify(arabicSVGButton)})`));
 await evaluate(`(()=>{window.arURL=URL.createObjectURL;URL.createObjectURL=b=>{window.arSVG=b;return window.arURL(b)};[...document.querySelectorAll('.burning-calendar button')].find(b=>b.textContent===${JSON.stringify(arabicSVGButton)}).click();})()`);
 assert.ok((await evaluate('await window.arSVG.text()')).includes(evidenceArabic['Detections are not confirmed fires. MODIS and VIIRS remain separate.']));await evaluate('URL.createObjectURL=window.arURL');
 await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await waitFor('document.documentElement.dir==="ltr"');
 await navigate('Evidence Engine');await waitFor('!!document.getElementById("start-judge-guide")');await evaluate('document.getElementById("start-judge-guide").click()');await count(22);await waitFor('document.querySelector("[data-sensitivity=current] td")?.textContent==="12"');
 assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-sensitivity=current] td")].map(e=>Number(e.textContent))'),[12,13,1]);await evaluate(`document.querySelector('button[data-setting="1/7"]').click()`);await waitFor('document.querySelector("[data-sensitivity=current] td")?.textContent==="5"');assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-sensitivity=current] td")].map(e=>Number(e.textContent))'),[5,6,1]);
 const report=JSON.parse(await exportClick('#research-brief button'));assert.ok(!/(?:[A-Z]:[\\\\/]Users[\\\\/]|file:\/\/\/|\/Users\/|\/home\/[^ /]+\/)/i.test(JSON.stringify(report)),'Research export contains internal absolute paths');assert.equal(report.comparison.observations.length,22);assert.equal(report.comparison.matching.pairs.length,5);assert.equal(report.comparison.methodology.validated,false);assert.equal(report.harmonization.gates.historicalMedian,null);assert.equal(report.harmonization.gates.anomaly,null);
 await evaluate('document.querySelector(".scientific-context>summary").click()');await waitFor('document.querySelector(".scientific-context").textContent.includes("source-declared")');const {writeFile}=await import('node:fs/promises');await evaluate('document.querySelector(".scientific-context").scrollIntoView()');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/readiness-evidence.png',Buffer.from(shot.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));assert.ok(await evaluate('document.querySelector(".scientific-context").textContent.includes(String.fromCodePoint(1605,1593,1575,1604,1580,1577,32,1571,1585,1588,1610,1601,32,78,79,65,65,45,50,48,47,50,49,32,1605,1593,1604,1606,1577,32,1601,1610,32,1575,1604,1605,1589,1583,1585,46,32,1610,1604,1586,1605,32,1578,1608,1590,1610,1581,32,1605,1606,32,1605,1586,1608,1617,1583,32,1575,1604,1576,1610,1575,1606,1575,1578,32,1604,1571,1589,1604,32,1575,1604,1605,1593,1575,1604,1580,1577,32,1608,1575,1582,1578,1604,1575,1601,32,1578,1608,1579,1610,1602,32,1575,1604,1578,1608,1575,1585,1610,1582,32,1575,1604,1605,1576,1603,1585,1577,1563,32,1575,1604,1587,1580,1604,1575,1578,32,1575,1604,1571,1589,1604,1610,1577,32,1605,1581,1601,1608,1592,1577,46))'));
 assert.deepEqual(errors,[]);console.log('PASS local browser '+origin+' claims and judge path: North labels, standard/NRT truth copy, DNA software gate, disabled anomaly claims, descriptive brief, Ajloun 2023 Calendar CSV 18, candidate 12/13/1 -> 5/6/1, reproducible uncalibrated research export and Arabic source-lineage caveat.');
}finally{ws?.close();for(const child of children.reverse())child.kill();}


