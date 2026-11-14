import assert from 'node:assert/strict';
export async function verifyRegionAndSensitivity({evaluate,waitFor,navigate,send}) {
 const {verifyJordanRegions}=await import('./verify-jordan-regions.mjs');
 await verifyJordanRegions({evaluate,waitFor,navigate,send});
 const {verifyJudgeGuide}=await import('./verify-judge-guide.mjs');
 const count=n=>waitFor(`(await window.verificationMap.getSource("observations").getData()).features.length===${n}`);
 const input=async(label,value)=>evaluate(`(()=>{const i=document.querySelector('input[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${value}');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const region=async(selector,value)=>evaluate(`(()=>{const s=document.querySelector('${selector}');s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 for(const [module,selector]of [['Mission Atlas','.atlas-region select'],['Burning Calendar','select[aria-label="Calendar region"]'],['Sensor Intelligence','select[aria-label="Intelligence region"]']]){
  await navigate(module);await region(selector,'northern-jordan');await count(0);await waitFor('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).region==="northern-jordan"');
  if(module==='Burning Calendar')assert.equal(await evaluate('document.querySelectorAll(".calendar-day[data-state=verified-zero]").length'),0);
  await region(selector,'ajloun');await count(36);assert.ok(await evaluate('(await window.verificationMap.getSource("observations").getData()).features.every(f=>f.properties.datasetId.startsWith("ajloun-"))'));
  console.log('PASS Jordan region round-trip: '+module);
 }
 await navigate('Mission Atlas');await evaluate('document.getElementById("atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');await evaluate('document.querySelector("input[name=atlas-sensor][value=all]").click()');await evaluate('document.querySelector(".atlas-filter-panel .atlas-dismiss").click()');await count(36);
 await navigate('Evidence Engine');await waitFor('!!document.querySelector("[data-sensitivity=current]")');
 const stats=()=>evaluate('[...document.querySelectorAll("[data-sensitivity=current] td")].map(td=>Number(td.textContent))');
 assert.deepEqual(await stats(),[5,6,1]);
 await input('UTC tolerance','7');await waitFor('document.querySelector("[data-sensitivity=current] small").textContent.includes("7 min")');assert.deepEqual(await stats(),[5,6,1]);
 await input('UTC tolerance','6');await waitFor('document.querySelector("[data-sensitivity=current] td").textContent==="0"');assert.deepEqual(await stats(),[0,0,0]);
 assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-sensitivity=reference] td")].map(td=>Number(td.textContent))'),[5,6,1]);
 await evaluate(`[...document.querySelectorAll('.sensitivity-actions button')].find(b=>b.textContent==='Pin current thresholds').click()`);
 assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-sensitivity=reference] td")].map(td=>Number(td.textContent))'),[0,0,0]);
 await input('UTC tolerance','60');await input('Matching radius','0.1');await waitFor('document.querySelector("[data-sensitivity=current] td").textContent==="0"');
 await input('Matching radius','1');await waitFor('document.querySelector("[data-sensitivity=current] td").textContent==="5"');
 await evaluate('document.querySelector(".sensitivity-group>summary").click()');
 assert.equal(await evaluate('document.querySelectorAll(".sensitivity-group[open] .sensitivity-edge-list>div").length'),5);
 assert.ok(await evaluate('document.querySelector(".sensitivity-group[open]").textContent.includes("ajloun-modis-842987") && document.querySelector(".sensitivity-group[open]").textContent.includes("ajloun-snpp-842985")'));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');
 assert.ok(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'));
 assert.equal(await evaluate('document.querySelector("#sensitivity-title").textContent'),'كيف تؤثر حدود المطابقة في الأدلة؟');
 assert.deepEqual(await stats(),[5,6,1]);
 const {writeFile}=await import('node:fs/promises');
 await evaluate('document.querySelector(".sensitivity-explorer").scrollIntoView()');
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/sensitivity-ar-mobile.png',Buffer.from(shot.data,'base64'));
 await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector(".sensitivity-explorer").scrollIntoView()');
 const desktop=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/sensitivity-desktop.png',Buffer.from(desktop.data,'base64'));
 await verifyJudgeGuide({evaluate,waitFor,navigate,send});
 const {verifyResearch}=await import('./verify-research.mjs');
 await verifyResearch({evaluate,waitFor,send});
 const {verifyCombinedCalendar}=await import('./verify-combined-calendar.mjs');
 await verifyCombinedCalendar({evaluate,waitFor,navigate,send});
 await navigate('Mission Atlas');await evaluate('document.getElementById("atlas-filter-trigger").click()');await waitFor('!!document.querySelector(".atlas-filter-panel")');
 await evaluate('document.querySelector("input[name=atlas-sensor][value=all]").click()');
 await evaluate('[...document.querySelectorAll(".atlas-filter-panel button")].find(b=>b.textContent.includes("Clear date")).click()');
 await evaluate('document.querySelector(".atlas-filter-panel .atlas-dismiss").click()');
 await navigate('Mission Atlas');await count(36);
 console.log('PASS sensitivity time/distance thresholds, pin comparison, exact 5/6/1 groups, provenance, Arabic mobile and reduced motion');
}

