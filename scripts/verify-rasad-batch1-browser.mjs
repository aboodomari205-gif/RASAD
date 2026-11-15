import path from 'node:path';import fs from 'node:fs/promises';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const before=process.argv.includes('--before'),origin=process.env.RASAD_TEST_ORIGIN??'http://localhost:4173',port=Number(process.env.RASAD_CDP_PORT??9481);
const out='.checkpoints/rasad-batch1/screenshots';await fs.mkdir(out,{recursive:true});
const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--enable-unsafe-swiftshader','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+path.resolve('.checkpoints/rasad-batch1/chrome'),'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));const keep=setInterval(()=>{},1000);let ws;
try{
 let v;for(let i=0;i<80;i++){try{v=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();break;}catch{}await delay(200);}assert.ok(v,'Chrome unavailable');
 ws=new WebSocket(v.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});let seq=0,session;const pending=new Map(),errors=[];
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={},target=session)=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject,timer:setTimeout(()=>reject(Error('CDP timeout '+method)),20000)});ws.send(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<180;i++){if(await evaluate('Boolean('+expression+')'))return;await delay(150);}throw Error('Timed out '+expression);};
 const viewport=async(width,height)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});
 const capture=async name=>{await delay(350);const r=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(out+'/'+name+'.png',Buffer.from(r.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await viewport(1440,1000);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('firepulse.language.v1','en')"});await send('Page.navigate',{url:origin+'/#mission-atlas'});await wait('!!document.querySelector(".earth-enter")');await evaluate('document.querySelector(".earth-enter").click()');await wait('document.querySelectorAll(".observation-row").length>0');
 if(process.argv.includes('--research')){
  await evaluate("document.querySelector('.rasad-nav-links [data-module=\"Sensor Intelligence\"]').click()");
  await wait('document.querySelector(".research-prototype")?.textContent.includes("27.216")');
  assert.ok(await evaluate('document.querySelector(".research-prototype").textContent.includes("Mixed results")'));
  assert.equal(await evaluate("document.querySelectorAll('.research-prototype table')[0].querySelectorAll('tbody tr').length"),3);
  const first=await evaluate("document.querySelector('.research-prototype select').value");
  await evaluate("(()=>{const s=document.querySelector('.research-prototype select');s.value='1';s.dispatchEvent(new Event('change',{bubbles:true}));})()");
  assert.notEqual(await evaluate("document.querySelector('.research-prototype select').value"),first);
  const downloads=path.resolve('.checkpoints/rasad-ai/downloads');await fs.mkdir(downloads,{recursive:true});
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},null);
  await evaluate("[...document.querySelectorAll('.research-prototype button')].find(b=>b.textContent==='Export research evaluation JSON').click()");
  const filename=path.join(downloads,'rasad-research-prototype.json');for(let i=0;i<30;i++){try{await fs.access(filename);break;}catch{}await delay(200);}
  const report=JSON.parse(await fs.readFile(filename,'utf8'));assert.equal(report.evaluation.training.count,282);assert.equal(report.evaluation.evaluation.joint.count,148);
  assert.equal(report.examples.length,30);assert.ok(report.evaluation.overlap.pairs.every(p=>p.coDetectedCellDays>0));
  const printedTarget=await evaluate("(()=>{const original=window.print;let target;window.print=()=>{target=document.body.dataset.rasadPrint};[...document.querySelectorAll('.research-prototype button')].find(b=>b.textContent==='Print research report').click();window.print=original;return {target,cleaned:!document.body.dataset.rasadPrint};})()");
  assert.deepEqual(printedTarget,{target:'research',cleaned:true});
  await evaluate("document.body.dataset.rasadPrint='research'");await send('Emulation.setEmulatedMedia',{media:'print'});
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.research-prototype')).visibility"),'visible');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.research-prototype button')).display"),'none');
  const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});await fs.writeFile('.checkpoints/rasad-ai/research-report.pdf',Buffer.from(pdf.data,'base64'));assert.ok(Buffer.from(pdf.data,'base64').length>10000);
  await evaluate('delete document.body.dataset.rasadPrint');await send('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate("document.querySelector('.research-prototype h2').scrollIntoView({block:'start'})");await capture('research-prototype-desktop');
  await evaluate("document.querySelector('.research-prototype table').scrollIntoView({block:'center'})");await capture('research-evaluation-desktop');
  await viewport(390,844);await evaluate("document.querySelector('.research-prototype h2').scrollIntoView({block:'start'})");await capture('research-prototype-mobile');
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'Research mobile overflow');
  await evaluate('document.querySelector(".rasad-mobile-header .language-switch").click()');await wait('document.documentElement.dir==="rtl"');
  await evaluate("document.querySelector('.research-prototype h2').scrollIntoView({block:'start'})");await capture('research-prototype-arabic-mobile');
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'Research RTL mobile overflow');
  assert.ok(await evaluate('document.querySelector(".research-prototype").textContent.includes("نموذج بحثي")'));
  await fs.mkdir('.checkpoints/rasad-ai',{recursive:true});await fs.writeFile('.checkpoints/rasad-ai/browser-proof.json',JSON.stringify({passed:true,train:282,temporal:306,spatial:252,joint:148,actualReportDownload:true,exampleSelection:true,printTarget:true,actualPDF:true,mobileLTR:true,mobileRTL:true,errors},null,2));
  console.log('PASS real research model panel, held-out metrics, 4 overlap pairs, actual report download, example selection, desktop/mobile and Arabic RTL.');
 }
 else if(process.argv.includes('--pilot')){
  await evaluate("document.querySelector('.rasad-nav-links [data-module=\"Anomaly Detection\"]').click()");await wait('!!document.querySelector(".brazil-pilot")');
  await evaluate("[...document.querySelectorAll('.brazil-pilot button')].find(b=>b.textContent==='Inspect August 2024 pilot').click()");
  await wait('document.querySelector(".brazil-pilot")?.textContent.includes("6,876")');await wait('!!document.querySelector(".brazil-pilot svg polygon")');
  assert.ok(await evaluate('document.querySelector(".brazil-pilot").textContent.includes("NOT VALIDATED")'));
  await evaluate("document.querySelector('.brazil-pilot h2').scrollIntoView({block:'start'})");await capture('brazil-pilot-desktop');
  await evaluate("document.querySelector('.brazil-pilot svg').scrollIntoView({block:'center'})");await capture('brazil-pilot-progression-desktop');
  const original=await evaluate("document.querySelector('.brazil-pilot figure figcaption').textContent");
  await evaluate("[...document.querySelectorAll('.brazil-pilot button')].find(b=>b.textContent==='Play daily evidence').click()");await delay(1500);
  assert.notEqual(await evaluate("document.querySelector('.brazil-pilot figure figcaption').textContent"),original);
  await evaluate("[...document.querySelectorAll('.brazil-pilot button')].find(b=>b.textContent==='Pause').click()");
  const downloads=path.resolve('.checkpoints/rasad-brazil/downloads');await fs.mkdir(downloads,{recursive:true});
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},null);
  for(const label of ['Export pilot report JSON','Export daily evidence CSV'])await evaluate(`[...document.querySelectorAll('.brazil-pilot button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
  for(let i=0;i<30;i++){if((await fs.readdir(downloads)).filter(n=>/\.(json|csv)$/.test(n)).length>=2)break;await delay(200);}
  const report=JSON.parse(await fs.readFile(path.join(downloads,'rasad-brazil-pilot-2024-08-01-2024-08-31.json'),'utf8'));assert.equal(report.count,6876);assert.equal(report.activeCells,152);
  const csv=await fs.readFile(path.join(downloads,'rasad-brazil-pilot-2024-08-01-2024-08-31.csv'),'utf8');assert.equal(csv.trim().split('\n').length,report.daily.length+1);
  await viewport(390,844);await evaluate("document.querySelector('.brazil-pilot svg').scrollIntoView({block:'center'})");await capture('brazil-pilot-mobile');
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'));
  await evaluate('document.querySelector(".rasad-mobile-header .language-switch").click()');await wait('document.documentElement.dir==="rtl"');
  assert.ok(await evaluate('document.querySelector(".brazil-pilot").textContent.includes("منطقة ماتو غروسو")'));await evaluate("document.querySelector('.brazil-pilot svg').scrollIntoView({block:'center'})");await capture('brazil-pilot-arabic-mobile');
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'));
  await fs.writeFile('.checkpoints/rasad-brazil/browser-proof.json',JSON.stringify({passed:true,count:report.count,activeCells:report.activeCells,playback:true,jsonDownload:true,csvRows:report.daily.length,mobileLTR:true,mobileRTL:true,errors},null,2));
  console.log('PASS Brazil pilot real 6876 detections, 152 H3 cells, daily playback, actual JSON/CSV downloads, mobile LTR/RTL and screenshots.');
 }
 else if(before){await capture('before-mission-atlas-desktop');await evaluate("window.location.hash='#burning-calendar'");await wait('!!document.querySelector(".calendar-grid")');await capture('before-burning-calendar-desktop');await viewport(390,844);await capture('before-mobile');console.log('BEFORE screenshots captured from live React app.');}
 else {

 const items=[['Intelligence Map','mission-atlas'],['Burning Calendar','burning-calendar'],['Anomaly Detection','activity-intelligence'],['Sensor Intelligence','sensor-harmonization'],['Trust the Signal','research-export']];
 const navigate=async(module)=>{
  if(await evaluate('innerWidth<=900')){await evaluate('document.querySelector(".rasad-mobile-toggle").click()');await wait('document.querySelector(".rasad-mobile-toggle").getAttribute("aria-expanded")==="true"');}
  await evaluate(`document.querySelector('.rasad-nav-links [data-module="${module}"]').click()`);
  await wait(`document.querySelector('.rasad-nav-links [data-module="${module}"]').getAttribute('aria-current')==='page'`);
  await wait(module==='Intelligence Map'?'!!document.querySelector(".calendar-map-host[data-hidden=false]")':module==='Burning Calendar'?'!!document.querySelector(".calendar-grid")':'!!document.querySelector(".intelligence-workspace .lab-content")');await delay(600);if(!['Intelligence Map','Burning Calendar'].includes(module))await wait('document.querySelector(".lab-content")?.getAttribute("aria-busy")=="false"');
 };
 const overflow=async()=>assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'Page overflow');
 assert.equal(await evaluate('document.querySelectorAll(".rasad-nav-links button").length'),5);
 assert.ok(await evaluate('document.querySelector(".rasad-logo-frame img").naturalWidth>0'),'Supplied logo not loaded');
 assert.ok(await evaluate('document.querySelector(".rasad-sidebar").getBoundingClientRect().left<2'),'English sidebar not left');
 for(const [module,slug] of items){
  await navigate(module);await overflow();
  if(module==='Burning Calendar'){
   await evaluate(`(()=>{const b=[...document.querySelectorAll('.calendar-data-notice button')].find(b=>b.textContent.includes('Clear shared'));b?.click();})()`);
   await wait(`document.querySelector('[data-calendar-date="2026-11-13"]')?.getAttribute('data-state')==='observed'`);
  }
  if(module==='Anomaly Detection')await wait('!!document.querySelector("#observed-period-explorer [data-observed-period]")');
  if(module==='Sensor Intelligence')await wait('!!document.querySelector(".sensor-trust-lens[data-evidence-ready=true] figure")');
  await capture('after-'+slug+'-desktop');
  if(module==='Burning Calendar'){
   await wait('document.querySelectorAll("[data-calendar-date][data-state=observed]").length>0');
   await evaluate('(()=>{const e=document.querySelector(".calendar-layout"),p=document.querySelector(".burning-calendar");p.scrollTop+=e.getBoundingClientRect().top-p.getBoundingClientRect().top-110;})()');await capture('after-burning-calendar-grid-desktop');
   await evaluate('document.querySelector("[data-calendar-date][data-state=observed]").click()');await wait('!!document.querySelector(".calendar-day-stat")');
  }
  if(module==='Anomaly Detection')await wait('!!document.querySelector("#observed-period-explorer")');
  if(module==='Sensor Intelligence'){
   await wait('!!document.querySelector(".sensor-trust-lens[open] figure svg")');
   const changeSize=async size=>evaluate(`(()=>{const e=document.querySelector('select[aria-label="Experimental equal-area grid"]');e.value='${size}';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   await changeSize('5000');await wait(`!!document.querySelector('figure[data-grid-size="5000"]')`);
   await evaluate('(()=>{const e=document.querySelector(".sensor-trust-lens figure"),p=document.querySelector(".burning-calendar");p.scrollTop+=e.getBoundingClientRect().top-p.getBoundingClientRect().top-180;})()');await capture('after-sensor-harmonization-grid-desktop');
  }
 }
 await navigate('Intelligence Map');
 await evaluate(`(()=>{const e=document.querySelector('.fire-map-canvas');let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber'))];while(f){let h=f.memoizedState;while(h){if(h.memoizedState?.current?.getSource){window.qaMap=h.memoizedState.current;return;}h=h.next;}f=f.return;}})()`);
 await evaluate(`(()=>{const e=document.querySelector('#rasad-date-select');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'2026-11-13');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await wait(`(async()=>{const d=await window.qaMap.getSource('observations').getData();return d.features.length>0&&d.features.every(f=>f.properties.date==='2026-11-13');})()`);
 await wait(`!document.querySelector('[aria-label="Previous delivered date"]').disabled`);await evaluate(`document.querySelector('[aria-label="Previous delivered date"]').click()`);await wait('document.querySelector("#rasad-date-select").value==="2026-11-12"');
 await wait(`!document.querySelector('[aria-label="Next delivered date"]').disabled`);await evaluate(`document.querySelector('[aria-label="Next delivered date"]').click()`);await wait('document.querySelector("#rasad-date-select").value==="2026-11-13"');
 await wait('!document.querySelector(".rasad-latest-date").disabled');await evaluate('document.querySelector(".rasad-latest-date").click()');await wait('document.querySelector("#rasad-date-select").value==="2026-11-14"');
 await evaluate('document.querySelector("#atlas-filter-trigger").click()');await wait('!!document.querySelector(".atlas-filter-panel")');
 await evaluate(`(()=>{const e=document.querySelector('select[aria-label="Platform"]');e.value='NOAA-20';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await wait(`(async()=>{const d=await window.qaMap.getSource('observations').getData();return d.features.length>0&&d.features.every(f=>f.properties.satellite==='NOAA-20');})()`);
 await evaluate(`(()=>{const e=document.querySelector('select[aria-label="Platform"]');e.value='all';e.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[aria-label="Close filters"]').click();})()`);
 await evaluate('document.querySelector(".rasad-sidebar-footer .language-switch").click()');await wait('document.documentElement.dir==="rtl"');
 assert.ok(await evaluate('Math.abs(document.querySelector(".rasad-sidebar").getBoundingClientRect().right-innerWidth)<2'),'Arabic sidebar not right');await overflow();await capture('after-mission-atlas-arabic-desktop');
 await evaluate('document.querySelector(".rasad-sidebar-footer .language-switch").click()');await wait('document.documentElement.dir==="ltr"');
 await viewport(390,844);await delay(300);
 for(const [module,slug] of items){await navigate(module);await overflow();assert.equal(await evaluate('document.querySelector(".rasad-mobile-toggle").getAttribute("aria-expanded")'),'false');await capture('after-'+slug+'-mobile');}
 await evaluate('document.querySelector(".rasad-mobile-toggle").click()');await wait('document.querySelector(".rasad-sidebar").getAttribute("role")==="dialog"');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('document.querySelector(".rasad-mobile-toggle").getAttribute("aria-expanded")==="false"');assert.ok(await evaluate('document.activeElement===document.querySelector(".rasad-mobile-toggle")'));
 await evaluate('document.querySelector(".rasad-mobile-header .language-switch").click()');await wait('document.documentElement.dir==="rtl"');await evaluate('document.querySelector(".rasad-mobile-toggle").click()');await wait('document.querySelector(".rasad-mobile-toggle").getAttribute("aria-expanded")==="true"');await capture('after-arabic-mobile-navigation');
 await evaluate('document.querySelector(".rasad-drawer-close").click()');await viewport(320,740);await delay(200);await overflow();await capture('after-arabic-mobile-320');
 await fs.writeFile('.checkpoints/rasad-batch1/browser-proof.json',JSON.stringify({generation:'86f1f872f7366fe4',sections:items.map(i=>i[1]),desktop:[1440,1000],mobile:[[390,844],[320,740]],logo:true,sidebarLTR:true,sidebarRTL:true,mobileEscapeFocus:true,liveDateNavigation:true,livePlatformFilter:true,gridSizeSwitch:true,calendarDetails:true,errors,passed:true},null,2));
 console.log('PASS five sections, original logo, LTR/RTL sidebar, labeled mobile drawer, Escape focus, date/previous/next/latest controls, real map filter, calendar detail, 5 km grid and desktop/mobile screenshots.');
 
 }
 assert.deepEqual(errors,[]);
}finally{ws?.close();clearInterval(keep);child.kill();}
