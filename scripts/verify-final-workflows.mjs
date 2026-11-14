// Local browser verification using Chromium's CDP; no browser-testing dependency required.
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const children = [];
const existingDev=true;const staticMode=process.argv.includes('--static');
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

  const api=async regionId=>evaluate(`fetch('${staticMode?'/archive-data/'+regionId+'.json':'/api/observations?mode='+regionId+'&manifest=1'}').then(r=>r.json())`);
  const year=async(regionId,y)=>{await waitFor('!!document.querySelector(".atlas-year-controls select")');await region('select[aria-label="Atlas historical year"]',y);const m=await api(regionId);await count(m.metadata.yearCounts[y]??0);assert.equal(await evaluate('document.querySelector(".atlas-year-controls select").value'),y);};
  await region('.atlas-region select','northern-jordan');const northManifest=await api('northern-jordan');await count(northManifest.metadata.yearCounts[String(northManifest.metadata.defaultYear)]);await year('northern-jordan','2021');
  const actual=await evaluate(`fetch('${staticMode?'/archive-data/northern-jordan/2021.json':'/api/observations?mode=northern-jordan&year=2021'}').then(r=>r.json()).then(c=>c.features)`);
  const dates=[...new Set(actual.map(f=>f.properties.date))].sort();assert.ok(dates.length>3);
  const selected=()=>evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).startDate');
  const expectedIds=date=>actual.filter(f=>f.properties.date===date).map(f=>f.id).sort();
  const sourceIds=()=>evaluate("(await window.verificationMap.getSource('observations').getData()).features.map(f=>f.id).sort()");
  await evaluate('document.querySelector("#atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');
  const viirs=actual.filter(f=>f.properties.instrument==='VIIRS');await evaluate('document.querySelector("input[name=atlas-sensor][value=VIIRS]").click()');await count(viirs.length);
  const rawConfidence=String(viirs[0].properties.confidence);await region('.confidence-control select',rawConfidence);const confidenceRows=viirs.filter(f=>String(f.properties.confidence)===rawConfidence);await count(confidenceRows.length);assert.deepEqual(await sourceIds(),confidenceRows.map(f=>f.id).sort());
  const threshold=confidenceRows.map(f=>Number(f.properties.frp)).filter(Number.isFinite).sort((a,b)=>a-b)[Math.floor(confidenceRows.length/2)];
  const numeric=async(label,value)=>evaluate(`(()=>{const e=document.querySelector('input[aria-label="${label}"]');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await numeric('Minimum FRP',threshold);await count(confidenceRows.filter(f=>Number(f.properties.frp)>=threshold).length);
  await numeric('Maximum FRP',threshold);await count(confidenceRows.filter(f=>Number(f.properties.frp)===threshold).length);assert.deepEqual(await sourceIds(),confidenceRows.filter(f=>Number(f.properties.frp)===threshold).map(f=>f.id).sort());
  await numeric('Maximum FRP','');await numeric('Minimum FRP','');await region('.confidence-control select','all');await evaluate('document.querySelector("input[name=atlas-sensor][value=all]").click()');await count(actual.length);
  await region('select[aria-label="Processing strata"]','nrt');await count(0);assert.ok(await evaluate('document.querySelector(".temporal-play").disabled'));await region('select[aria-label="Processing strata"]','standard');await count(actual.length);await region('select[aria-label="Processing strata"]','all');await count(actual.length);await evaluate('document.querySelector(".atlas-filter-panel .atlas-dismiss").click()');
  await waitFor('!document.querySelector(".temporal-play").disabled');const requestCount=loaded.length;
  await evaluate('document.querySelector(".temporal-play").click()');await waitFor(`JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1')).startDate==='${dates[0]}'`);await count(expectedIds(dates[0]).length);assert.deepEqual(await sourceIds(),expectedIds(dates[0]));
  await waitFor(`JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1')).startDate==='${dates[1]}'`);await count(expectedIds(dates[1]).length);assert.deepEqual(await sourceIds(),expectedIds(dates[1]));
  await waitFor(`JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1')).startDate==='${dates[2]}'`);await count(expectedIds(dates[2]).length);assert.deepEqual(await sourceIds(),expectedIds(dates[2]));
  assert.equal(loaded.length,requestCount,'Playback must not refetch the same UTC-year shard');assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));
  await evaluate('document.querySelector(".temporal-play").click()');assert.equal(await evaluate('document.querySelector(".temporal-play").getAttribute("aria-pressed")'),'false');const paused=await selected();await delay(1800);assert.equal(await selected(),paused);
  await evaluate(`[...document.querySelectorAll('.date-chip')].find(b=>b.textContent==='${dates.at(-2)}').click()`);await evaluate('document.querySelector(".temporal-play").click()');await waitFor(`JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1')).startDate==='${dates.at(-1)}'`);await waitFor('document.querySelector(".temporal-play").getAttribute("aria-pressed")==="false"');
  await evaluate('document.querySelector(".temporal-play").click()');await waitFor(`JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1')).startDate==='${dates[0]}'`);
  await waitFor('document.querySelector(".temporal-play").getAttribute("aria-pressed")==="true"');await evaluate('document.querySelector(".temporal-play").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await waitFor('document.querySelector(".temporal-play").getAttribute("aria-pressed")==="false"');
  await evaluate('document.querySelector("#atlas-scrubber").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await waitFor(`JSON.parse(sessionStorage.getItem('firepulse.mission-scope.v1')).startDate==='${dates[1]}'`);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate('document.querySelector(".temporal-play").click()');await waitFor('document.querySelector(".temporal-play").getAttribute("aria-pressed")==="true"');await year('northern-jordan','2026');assert.equal(await evaluate('document.querySelector(".temporal-play").getAttribute("aria-pressed")'),'false');
  await region('.atlas-region select','ajloun');await waitFor('document.querySelector(".temporal-play").getAttribute("aria-pressed")==="false"');
  await year('ajloun','2023');await waitFor('!!document.querySelector(".observation-row")');await evaluate('document.querySelector(".observation-row").click()');await waitFor('!!document.querySelector(".maplibregl-popup")');await waitFor('!window.verificationMap.isMoving()');
  const {writeFile}=await import('node:fs/promises');const popupProof=[];
  for(const lang of ['en','ar']){
   if(lang==='ar')await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');
   for(const [width,height]of [[1366,768],[1440,900],[1920,1080],[390,844],[320,740]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<760});await delay(250);
    const proof=await evaluate(`(()=>{const r=document.querySelector('.maplibregl-popup-content').getBoundingClientRect(),h=document.querySelector('.atlas-masthead').getBoundingClientRect(),t=document.querySelector('.atlas-timeline').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,headerBottom:h.bottom,timelineTop:t.top,editorial:getComputedStyle(document.querySelector('.atlas-editorial')).visibility};})()`);popupProof.push({lang,width,height,...proof});assert.equal(proof.editorial,'hidden');assert.ok(proof.left>=-1&&proof.right<=width+1,JSON.stringify(proof));assert.ok(proof.top>=proof.headerBottom-1&&proof.bottom<=proof.timelineTop+1,JSON.stringify(proof));
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".atlas-view-label")).visibility'),'hidden');
    const readable=await evaluate(`(()=>{const body=document.querySelector('.maplibregl-popup-content');body.scrollTop=body.scrollHeight;const note=body.querySelector('.atlas-popup-note').getBoundingClientRect(),box=body.getBoundingClientRect();return note.top>=box.top-1&&note.bottom<=box.bottom+1;})()`);assert.ok(readable,'Final scientific popup caveat must be reachable by internal scroll');await evaluate('document.querySelector(".maplibregl-popup-content").scrollTop=0');
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/final-sprint/popup-'+lang+'-'+width+'.png',Buffer.from(shot.data,'base64'));
   }
  }
  await evaluate('document.querySelector(".atlas-masthead .language-switch").click()');await navigate('Burning Calendar');await waitFor('!!document.querySelector(".calendar-grid")');await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');
  const text=await evaluate(`(()=>{const list=[];for(const p of document.querySelectorAll('.calendar-scale-note,.burning-calendar>.calendar-science-note')){const r=document.createRange();r.selectNodeContents(p);for(const b of r.getClientRects())list.push({left:b.left,right:b.right});}return list;})()`);await writeFile('.checkpoints/final-sprint/workflows.json',JSON.stringify({dates:dates.slice(0,3),observedDates:dates.length,noYearRefetch:true,qualityFilters:{rawConfidence,frpThreshold:threshold,confidenceRows:confidenceRows.length},popupProof,calendarText:text},null,2));assert.ok(text.every(r=>r.left>=-1&&r.right<=321),JSON.stringify(text));
  assert.deepEqual(errors,[]);console.log('PASS real source/confidence/FRP/processing filters, observed-date playback/IDs, pause/end/restart/Escape/keyboard/reduced motion/scope cancellation, no year refetch or map remount, popup bounds EN/AR desktop/mobile and Calendar caveat readability.');
}finally{ws?.close();for(const child of children.reverse())child.kill();}
