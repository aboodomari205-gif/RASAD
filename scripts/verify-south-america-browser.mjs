import path from 'node:path';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.FIREPULSE_TEST_ORIGIN??'http://localhost:5173';
const port=9473;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
await fs.mkdir('.checkpoints/south-america/browser',{recursive:true});
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--enable-unsafe-swiftshader','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+process.cwd()+'/.checkpoints/south-america/browser/profile','about:blank'],{windowsHide:true,stdio:'ignore'});
const keepAlive=setInterval(()=>{},1000);let ws;
try{
 let version;for(let i=0;i<50;i++){try{version=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();break;}catch{}await delay(200);}if(!version)throw Error('Browser debug service unavailable');
 ws=new WebSocket(version.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 let seq=0,session;const pending=new Map(),errors=[];
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={},target=session)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject,timer:setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},15000)});ws.send(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const waitFor=async expression=>{for(let i=0;i<150;i++){try{if(await evaluate('Boolean('+expression+')'))return;}catch{}await delay(150);}throw Error('Browser condition timed out: '+expression);};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('firepulse.language.v1','en')"});
 await send('Page.navigate',{url:origin+'/#mission-atlas'});await waitFor('!!document.querySelector(".earth-enter")');await evaluate('document.querySelector(".earth-enter").click()');
 await waitFor('!!document.querySelector(".region-explorer")');await waitFor('document.querySelectorAll(".observation-row").length>0');
 const options=await evaluate('[...document.querySelector(".region-explorer select").options].map(o=>o.value)');assert.deepEqual(options,['brazil']);
 const change=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const navigateSection=async name=>{
  if(await evaluate('innerWidth<=900')){await evaluate('document.querySelector(".rasad-mobile-toggle").click()');await waitFor('document.querySelector(".rasad-mobile-toggle").getAttribute("aria-expanded")==="true"');}
  await evaluate(`(()=>{const b=[...document.querySelectorAll('.rasad-nav-links button')].find(b=>b.textContent.includes(${JSON.stringify(name)}));if(!b)throw Error('Missing section');b.click();})()`);
  await delay(350);
 };

 await change('.region-explorer select','brazil');await waitFor('document.querySelector(".region-explorer summary").textContent.includes("Brazil")');await waitFor('document.querySelectorAll(".observation-row").length>0');
 await evaluate(`(()=>{const element=document.querySelector('.fire-map-canvas');let fiber=element[Object.keys(element).find(k=>k.startsWith('__reactFiber'))];while(fiber){let hook=fiber.memoizedState;while(hook){if(hook.memoizedState?.current?.getSource){window.qaMap=hook.memoizedState.current;return;}hook=hook.next;}fiber=fiber.return;}throw Error('Retained map unavailable');})()`);

 await evaluate('document.querySelector(".temporal-play").click()');await delay(150);
 const firstPlayback=await evaluate('JSON.parse(sessionStorage.getItem("rasad.brazil-scope.v1")).startDate');
 await waitFor(`JSON.parse(sessionStorage.getItem('rasad.brazil-scope.v1')).startDate!==${JSON.stringify(firstPlayback)}`);
 await evaluate('document.querySelector(".temporal-play").click()');await waitFor('document.querySelector(".temporal-play").getAttribute("aria-pressed")==="false"');
 const beforeZoom=await evaluate('window.qaMap.getZoom()');await evaluate(`document.querySelector('[aria-label="Zoom in"]').click()`);await waitFor(`window.qaMap.getZoom()>${beforeZoom}`);
 await evaluate(`document.querySelector('[aria-label="Zoom out"]').click()`);
 await evaluate(`window.qaMap.setBearing(20);document.querySelector('[aria-label="Reset north"]').click()`);await waitFor('Math.abs(window.qaMap.getBearing())<.1');
 await evaluate('document.querySelector("#enter-mission").click()');
 await evaluate(`(()=>{const b=[...document.querySelectorAll('.date-chip')].find(b=>b.textContent==='2026-11-13');if(!b)throw Error('Delivered date chip absent');b.click();})()`);
 await waitFor(`(async()=>{const data=await window.qaMap.getSource('observations').getData();return data.features.length>0&&data.features.every(f=>f.properties.date==='2026-11-13');})()`);
 await evaluate('document.querySelector("#atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');
 await change('select[aria-label="Platform"]','NOAA-20');
 await waitFor(`(async()=>{const data=await window.qaMap.getSource('observations').getData();return data.features.length>0&&data.features.every(f=>f.properties.satellite==='NOAA-20');})()`);
 await change('select[aria-label="Day / night"]','N');
 await waitFor(`(async()=>{const data=await window.qaMap.getSource('observations').getData();return data.features.length>0&&data.features.every(f=>f.properties.daynight==='N');})()`);
 const input=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await input('input[aria-label="Minimum FRP"]','999999');await waitFor('document.querySelector(".ledger-empty")&&document.querySelectorAll(".observation-row").length===0');
 await input('input[aria-label="Minimum FRP"]','');await change('select[aria-label="Platform"]','all');await change('select[aria-label="Day / night"]','all');await waitFor('document.querySelectorAll(".observation-row").length>0');
 await evaluate(`document.querySelector('[aria-label="Close filters"]').click()`);
 await evaluate('document.querySelector(".observation-row").click()');await waitFor('document.querySelector(".ledger-detail")?.textContent.includes("SHA-256")');
 const modules=await evaluate('[...document.querySelectorAll(".rasad-nav-links button")].map(e=>e.textContent)');
 console.log('Navigation',modules);assert.equal(modules.length,5);assert.ok(modules.some(m=>m.includes('Research & Export')));
 await evaluate('(()=>{const e=[...document.querySelectorAll("button")].find(e=>e.textContent.includes("Burning Calendar"));if(!e)throw Error("Calendar navigation missing");e.click();})()');
 await waitFor('!!document.querySelector(".burning-calendar")');await waitFor('document.querySelectorAll("[data-calendar-date][data-state=observed]").length>0');
 await evaluate('document.querySelector("[data-calendar-date][data-state=observed]").click()');await waitFor('document.querySelector(".calendar-day-stat")').catch(async e=>{console.log('BODY',await evaluate('document.body.innerText.slice(-7000)'));console.log('SCOPE',await evaluate('sessionStorage.getItem("rasad.brazil-scope.v1")'));console.log('ERRORS',errors);throw e;});
 assert.ok(await evaluate('document.querySelector(".rasad-sidebar-evidence").textContent.includes("Calibration not validated")'));
 for(const [width,height] of [[1440,1000],[390,844],[320,740]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<760});await delay(200);assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'Horizontal overflow at '+width);const shot=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`.checkpoints/south-america/browser/calendar-${width}.png`,Buffer.from(shot.data,'base64'));}
 await evaluate('document.querySelector(".rasad-mobile-header .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.querySelector(".rasad-sidebar-evidence").textContent.includes("المعايرة")'));
 const testedModules=[];
 await evaluate('document.querySelector(".rasad-mobile-header .language-switch").click()');await waitFor('document.documentElement.dir==="ltr"');
 for(const name of ['Activity Intelligence','Sensor Harmonization','Research & Export']){
  await navigateSection(name);
  await waitFor('!!document.querySelector(".lab-content")');await delay(350);assert.ok(!await evaluate('document.body.innerText.includes("Something went wrong")'));testedModules.push(name);
 }

 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await navigateSection('Sensor Harmonization');await waitFor('!!document.querySelector(".sensor-trust-lens")');await evaluate('document.querySelector(".sensor-trust-lens").open=true');
 for(const size of ['1000','2000','5000']){
  await change('select[aria-label="Experimental equal-area grid"]',size);
  await waitFor(`document.querySelector('.sensor-trust-lens figure[data-grid-size="${size}"] svg rect')`);
 }
 assert.ok(await evaluate(`document.querySelector('select[aria-label="Comparison view"] option[value="calibrated"]').disabled`));
 for(const [mode,source] of [['modis','modis'],['viirs','n20'],['combined','modis']]){
  await change('select[aria-label="Comparison view"]',mode);
  await waitFor(`document.querySelector('.sensor-trust-lens[data-sensor="${mode==='modis'?'MODIS':mode==='viirs'?'VIIRS':'all'}"][data-evidence-ready="true"] table tbody')?.textContent.includes('${source}')`);
 }
 const downloadPath=path.resolve('.checkpoints/rasad/browser-downloads/run-'+Date.now());await fs.mkdir(downloadPath,{recursive:true});
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath,eventsEnabled:true},null);
 await evaluate(`(()=>{const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.qaDownload={href:this.href,name:this.download};return original.call(this);};const b=[...document.querySelectorAll('.sensor-trust-lens button')].find(b=>b.textContent.includes('Download Sensor Trust'));b.scrollIntoView({block:'center',behavior:'instant'});return b.getBoundingClientRect().toJSON();})()`).then(async box=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x+box.width/2,y:box.y+box.height/2,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x+box.width/2,y:box.y+box.height/2,button:'left',clickCount:1});});
 assert.equal((await evaluate('window.qaDownload'))?.name,'rasad-brazil-sensor-trust.json');
 let downloaded;for(let i=0;i<100;i++){try{downloaded=JSON.parse(await fs.readFile(downloadPath+'/rasad-brazil-sensor-trust.json','utf8'));break;}catch{}await delay(100);}
 assert.ok(downloaded,'Trust JSON download missing');assert.equal(downloaded.calibration,'NOT_CALIBRATED');assert.equal(downloaded.gridSizeM,5000);assert.equal(downloaded.scope.region,'brazil');assert.equal(downloaded.grid.sensitivity.length,3);
 console.log('PASS grid sizes, MODIS/VIIRS/combined modes, disabled unvalidated calibration, real JSON download.');

 const manifest=await (await fetch(origin+'/api/observations?manifest=1')).json();
 if(process.env.RASAD_REQUIRE_HISTORY==='1'){
  assert.ok(manifest.metadata.availableYears.includes('2000'),'Full historical generation not active');
  await navigateSection('Activity Intelligence');
  await waitFor('!!document.querySelector("#observed-period-explorer [data-observed-period]")');
  await evaluate('document.querySelector("[data-observed-period] button").click()');
  await waitFor('!!document.querySelector(".observed-source-records details")');
  assert.ok(await evaluate('document.querySelector("[data-descriptive-median]").textContent.includes("median")'));
  assert.ok(await evaluate('document.querySelector(".observed-source-records").textContent.includes("Bounded source evidence page")'));
  await evaluate("[...document.querySelectorAll('.observed-period-detail button')].find(b=>b.textContent.includes('Open period in Calendar')).click()");
  await waitFor('document.querySelectorAll("[data-calendar-date][data-state=observed]").length>0');
  await evaluate("[...document.querySelectorAll('.calendar-export-actions button')].find(b=>b.textContent.includes('SVG')).click()");
  let svg;for(let i=0;i<100;i++){try{svg=await fs.readFile(path.join(downloadPath,'rasad-calendar.svg'),'utf8');break;}catch{}await delay(100);}
  assert.ok(svg?.includes('<svg')&&svg.includes('RASAD')&&svg.includes('fullDailySummary'),'Historical SVG download absent or missing full summaries');
  await evaluate("[...document.querySelectorAll('.rasad-section-tabs button')].find(b=>b.textContent.includes('Seasonal fingerprint')).click()");
  await waitFor('document.querySelectorAll(".seasonal-fingerprint tbody tr").length>=20');
  await evaluate('document.querySelector(".seasonal-fingerprint td button").click()');
  await waitFor('document.querySelectorAll("[data-calendar-date][data-state=observed]").length>0');
  await change('select[aria-label="Calendar year"]','2000');await change('select[aria-label="Calendar month"]','0');
  await waitFor('document.querySelector("#calendar-month-heading")?.textContent.includes("January")&&document.querySelector("#calendar-month-heading")?.textContent.includes("2000")');
  await delay(500);assert.equal(await evaluate('document.querySelectorAll("[data-calendar-date][data-state=observed]").length'),0);
  assert.equal(await evaluate('document.querySelectorAll("[data-calendar-date][data-state=verified-zero]").length'),0);
  console.log('PASS full history: conditional reference, bounded month inspector, calendar link, real SVG export, 20+ seasonal years, heatmap drill-down, unknown January 2000.');
 }
 await fs.writeFile('.checkpoints/south-america/browser-proof.json',JSON.stringify({origin,generation:manifest.metadata.activationRevision,historyRequired:process.env.RASAD_REQUIRE_HISTORY==='1',testedModules,dimensions:[[1440,1000],[390,844],[320,740]],rtl:true,sourceMetadata:true,calendarDay:true,errors},null,2));
 assert.deepEqual(errors,[]);console.log('PASS actual localhost browser: intro, continent/country selector, real ledger, source SHA, calendar day, Trust Lens, RTL, 1440/390/320px.');
}finally{ws?.close();clearInterval(keepAlive);child.kill();}
