import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function verifyJordanRegions({evaluate,waitFor,navigate,send}){
 await navigate('Mission Atlas');
 await evaluate('(()=>{const s=document.querySelector(".atlas-region select");s.value="northern-jordan";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
 await waitFor('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).region==="northern-jordan" && !window.verificationMap.isMoving()');
 await waitFor('(await window.verificationMap.getSource("ajloun-boundary").getData()).features[0].properties.name==="Northern Jordan"');
 await waitFor('!window.verificationMap.isMoving()');
 assert.ok(await evaluate('(await window.verificationMap.getSource("ajloun-boundary").getData()).features[0].geometry.coordinates.flat(2).every(p=>window.verificationMap.getBounds().contains(p))'),'Northern Jordan camera fits every union vertex');
 assert.equal(await evaluate('(await window.verificationMap.getSource("observations").getData()).features.length'),0);
 assert.ok(await evaluate('window.verificationMap.getCanvas()===window.originalCanvas'));
 assert.deepEqual(await evaluate('[...document.querySelector(".atlas-region select").options].map(o=>o.value)'),['ajloun','northern-jordan']);
 await navigate('Burning Calendar');await waitFor('!!document.querySelector(".calendar-grid")');
 assert.equal(await evaluate('document.querySelectorAll(".calendar-day[data-state=observed],.calendar-day[data-state=verified-zero]").length'),0);
 assert.ok(await evaluate('document.querySelector(".calendar-month-summary").textContent.includes("Source unavailable")'));
 assert.equal(await evaluate('[...document.querySelectorAll(".burning-calendar button")].find(b=>b.textContent==="Download displayed month CSV").disabled'),true);
 await evaluate('document.querySelector(".calendar-day").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});assert.ok(await evaluate('!!document.activeElement.dataset.calendarDate'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.querySelector("select[aria-label]").textContent.includes("شمال الأردن")'));assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/jordan-north-ar-mobile.png',Buffer.from(shot.data,'base64'));
 await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await navigate('Evidence Engine');await waitFor('!!document.querySelector("#research-brief button")');
 await evaluate('(()=>{window.oldJordanURL=URL.createObjectURL;URL.createObjectURL=b=>{window.jordanExport=b;return window.oldJordanURL(b)};document.querySelector("#research-brief button").click();})()');
 const report=await evaluate('JSON.parse(await window.jordanExport.text())');assert.equal(report.scope.region,'northern-jordan');assert.equal(report.comparison.observations.length,0);assert.equal(report.comparison.availability.state,'unavailable');assert.equal(report.comparison.availability.fixture,false);await evaluate('URL.createObjectURL=window.oldJordanURL');
 assert.ok(await evaluate('!document.querySelector(".main-content").innerText.includes("Brazil")'));
 await navigate('Mission Atlas');await evaluate('(()=>{const s=document.querySelector(".atlas-region select");s.value="ajloun";s.dispatchEvent(new Event("change",{bubbles:true}));})()');await waitFor('(await window.verificationMap.getSource("observations").getData()).features.length===36');
 console.log('PASS Northern Jordan exact source, unavailable observations/zero protection, no retired choices, keyboard/Arabic/mobile, research scope, Ajloun preservation');
}
