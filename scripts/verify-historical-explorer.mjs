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
  await evaluate(`(()=>{let f=document.querySelector('.fire-map-canvas');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getSource){window.verificationMap=h.memoizedState.current;window.originalCanvas=window.verificationMap.getCanvas();return;}h=h.next;}f=f.return;}throw Error('No map');})()`);
  const count=n=>waitFor(`(await window.verificationMap.getSource('observations').getData()).features.length===${n}`);
  await count(10);assert.equal(await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).startDate'),'2026-01-01');
  const navigate=async name=>{await evaluate('document.querySelector(".atlas-index-trigger").click()');await waitFor('!!document.querySelector(".atlas-index-sheet")');await evaluate(`[...document.querySelectorAll('.atlas-index-sheet button')].find(b=>b.textContent.includes('${name}')).click()`);};
  const region=async(selector,value)=>{await evaluate(`(()=>{const s=document.querySelector('${selector}');s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);};

  const api=async regionId=>evaluate(`fetch('/api/observations?mode=${regionId}&manifest=1').then(r=>r.json())`);
  const year=async(regionId,y)=>{await region('select[aria-label="Atlas historical year"]',y);const m=await api(regionId);await count(m.metadata.yearCounts[y]??0);assert.equal(await evaluate('document.querySelector(".atlas-year-controls select").value'),y);};
  await year('ajloun','2006');await count(2);
  await evaluate('document.querySelector(".atlas-year-controls button:last-of-type").click()');await count(1);assert.equal(await evaluate('document.querySelector(".atlas-year-controls select").value'),'2010');
  await evaluate('document.querySelector(".atlas-year-controls button:first-of-type").click()');await count(2);
  for(const y of ['2021','2023','2026','2006'])await year('ajloun',y);
  await region('.atlas-region select','northern-jordan');await count(15);await year('northern-jordan','2021');await count(591);
  await region('.atlas-region select','ajloun');await count(2);await region('.atlas-region select','northern-jordan');await count(591);
  const records=await evaluate("fetch('/api/observations?mode=northern-jordan&year=2021').then(r=>r.json()).then(j=>j.features)");
  const first=records.map(f=>f.properties.date).sort()[0];
  await evaluate(`[...document.querySelectorAll('.date-chip')].find(b=>b.textContent==='${first}').click()`);await count(records.filter(f=>f.properties.date===first).length);
  await evaluate(`[...document.querySelectorAll('.date-chip')].find(b=>b.textContent==='All dates').click()`);await count(591);
  await evaluate('document.querySelector("#atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');
  await evaluate(`document.querySelector('input[name=atlas-sensor][value=MODIS]').click()`);await count(records.filter(f=>f.properties.instrument==='MODIS').length);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.date-chip')].slice(1).map(b=>b.textContent)"),[...new Set(records.filter(f=>f.properties.instrument==='MODIS').map(f=>f.properties.date))].sort());
  await evaluate(`document.querySelector('input[name=atlas-sensor][value=all]').click()`);await count(591);await evaluate(`document.querySelector('button[aria-label="Close filters"]').click()`);
  await waitFor('!!document.querySelector(".observation-row")');await evaluate('document.querySelector(".observation-row").click()');await waitFor('!!document.querySelector(".atlas-popup-title")');await waitFor('!window.verificationMap.isMoving()');
  const snapshot=()=>evaluate(`JSON.stringify({ids:(await window.verificationMap.getSource('observations').getData()).features.map(f=>f.id).sort(),boundary:await window.verificationMap.getSource('ajloun-boundary').getData(),center:window.verificationMap.getCenter(),zoom:window.verificationMap.getZoom(),popup:document.querySelector('.maplibregl-popup')?.textContent,scope:JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1'))})`);
  const physicalClick=async selector=>{const point=await evaluate(`(()=>{const b=document.querySelector('${selector}'),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!b.contains(hit))throw Error('Control obscured by '+hit?.outerHTML);return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});};
  const {writeFile}=await import('node:fs/promises');
  for(const lang of ['en','ar']){
    if(lang==='ar')await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');
    await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});await delay(250);
    const before=await snapshot();
    for(const mode of ['street','satellite']){
      await physicalClick(`button[data-basemap=${mode}]`);
      await waitFor(`!!window.verificationMap.getLayer('observations') && ${mode==='street'?"!window.verificationMap.getSource('satellite')":"!!window.verificationMap.getSource('satellite')"}`);
      assert.equal(await snapshot(),before);assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));
    }
    for(const width of [390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});await waitFor('!document.querySelector(".atlas-inspector")');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));for(const mode of ['street','satellite']){await physicalClick(`button[data-basemap=${mode}]`);await waitFor(`!!window.verificationMap.getLayer('observations') && ${mode==='street'?"!window.verificationMap.getSource('satellite')":"!!window.verificationMap.getSource('satellite')"}`);}const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/explorer-'+lang+'-'+width+'.png',Buffer.from(shot.data,'base64'));}
  }
  await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('Burning Calendar');await waitFor('!!document.querySelector(".calendar-grid")');assert.equal(await evaluate('document.querySelector(".calendar-month-selectors select:last-of-type").value'),'2021');
  await region('select[aria-label="Calendar region"]','ajloun');await region('select[aria-label="Calendar year"]','2001');await count(0);await navigate('Mission Atlas');await waitFor('document.querySelector(".atlas-temporal-status")?.textContent.includes("not available")');assert.equal(await evaluate('document.querySelector(".atlas-year-controls select").value'),'2001');assert.ok(await evaluate('document.querySelector(".temporal-play").disabled'));
  await year('ajloun','2023');await navigate('Evidence Engine');await waitFor('!!document.querySelector("#research-brief")');await evaluate('document.querySelector("#historical-overview>summary").click()');await waitFor('!!document.querySelector(".history-comparison-controls select")');
  await region('select[aria-label="Reference delivered year"]','2021');await region('select[aria-label="Comparison delivered year"]','2023');
  assert.ok(await evaluate('document.querySelector("#historical-overview").textContent.includes("acquisition opportunity")'));
  await waitFor('!!document.querySelector("#matched-month-comparison")');
  await evaluate('document.querySelector("#matched-month-comparison>summary").click()');
  await waitFor('document.querySelectorAll("#matched-month-comparison [data-month-status=matched-observed-support]").length===1');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#matched-month-comparison [data-month-status=matched-observed-support] td")].map(e=>e.textContent)'),['07','1','5','4']);
  await evaluate(`(()=>{window.monthURL=URL.createObjectURL;URL.createObjectURL=b=>{window.monthBlob=b;return window.monthURL(b)};document.querySelector('#matched-month-comparison button').click();})()`);
  const monthReport=await evaluate('JSON.parse(await window.monthBlob.text())');await evaluate('URL.createObjectURL=window.monthURL');assert.equal(monthReport.comparison.anomaly,null);assert.equal(monthReport.comparison.calibrated,false);assert.ok(monthReport.activationRevision);assert.ok(monthReport.datasets.every(d=>d.provenanceFiles?.length));

  await evaluate(`(()=>{window.realURL=URL.createObjectURL;URL.createObjectURL=b=>{window.exported=b;return window.realURL(b)};document.querySelector('#research-brief button').click();})()`);const report=await evaluate('JSON.parse(await window.exported.text())');assert.equal(report.comparison.observations.length,22);assert.ok(report.comparison.observations.every(o=>o.utcDate.startsWith('2023')));
  await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');await send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate('document.querySelector("#matched-month-comparison>summary").textContent'),evidenceArabic['Same-month source comparison / descriptive only']);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
  await evaluate('document.querySelector("#matched-month-comparison").scrollIntoView()');const monthlyShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/scientific-completion/comparison-ar320.png',Buffer.from(monthlyShot.data,'base64'));
  assert.deepEqual(errors,[]);console.log('PASS local browser '+origin+': manifest years 2006/2021/2023/2026, independent region years, actual filtered dates, unavailable year, real RTL/English mouse basemap switching at 1366/390/320, retained canvas/camera/boundary/popup/IDs, Calendar and Research scope, descriptive history.');
}finally{ws?.close();for(const child of children.reverse())child.kill();}

