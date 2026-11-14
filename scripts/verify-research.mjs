import assert from 'node:assert/strict';
export async function verifyResearch({evaluate,waitFor,send}) {
 await evaluate('document.querySelector("#robustness-view>summary").focus()');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await waitFor('document.getElementById("robustness-view").open');
 assert.equal(await evaluate('document.querySelectorAll("#robustness-view tbody tr").length'),9);
 assert.ok(await evaluate('document.querySelector("[data-robustness-summary]").textContent.includes("Stable: 0")'));
 assert.equal(await evaluate('document.querySelectorAll("#robustness-view tbody td[data-edge-present=true]").length'),19);
 await evaluate('document.querySelector("#robustness-view tbody details>summary").click()');
 assert.ok(await evaluate('document.querySelector("#robustness-view tbody").textContent.includes("ajloun-modis-842987")'));
 await evaluate('document.querySelector("#sensor-differences>summary").click()');
 assert.ok(await evaluate('document.getElementById("sensor-differences").textContent.includes("modis-percent") && document.getElementById("sensor-differences").textContent.includes("viirs-categorical")'));
 await evaluate('(()=>{window.originalResearchURL=URL.createObjectURL;URL.createObjectURL=blob=>{window.researchBlob=blob;return window.originalResearchURL(blob)};document.querySelector("#research-brief button").click()})()');
 const report=await evaluate('JSON.parse(await window.researchBlob.text())');
 assert.equal(report.schema,'firepulse.research-brief/v1');assert.equal(report.comparison.observations.length,36);assert.equal(report.comparison.datasets.length,2);assert.equal(report.robustness.stable,0);assert.equal(report.robustness.sensitive,9);assert.equal(report.robustness.configurations[4].added.length,4);assert.equal(report.comparison.matching.pairs.length,5);assert.equal(report.questions.length,3);
 assert.deepEqual(report.comparison.datasets.map(d=>[d.id,d.source,d.product,d.version]),[['ajloun-modis-842987','NASA FIRMS','MCD14ML','6.1'],['ajloun-snpp-842985','NASA FIRMS','VNP14IMGTML','2']]);assert.equal(report.provenanceGaps.length,2);assert.ok(report.comparison.gate.filter(g=>['zero','anomaly'].includes(g.id)).every(g=>g.status==='unavailable'));
 await evaluate('document.querySelector("#research-brief button").click()');assert.deepEqual(await evaluate('JSON.parse(await window.researchBlob.text())'),report);
 await evaluate('URL.createObjectURL=window.originalResearchURL');
 await evaluate('document.getElementById("robustness-view").scrollIntoView()');const {writeFile}=await import('node:fs/promises');const desktop=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/sprint5-robustness.png',Buffer.from(desktop.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');
 assert.equal(await evaluate('document.querySelector("#sensor-differences>summary").textContent'),'مستكشف اختلاف المستشعرات');assert.equal(await evaluate('document.querySelector("#research-brief button").textContent'),'تصدير موجز بحثي قابل لإعادة الإنتاج');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
 await evaluate('document.getElementById("research-brief").scrollIntoView()');const mobile=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/sprint5-research-mobile.png',Buffer.from(mobile.data,'base64'));
 await evaluate('document.querySelector(".intelligence-workspace .language-switch").click()');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 console.log('PASS robustness matrix 0 stable/9 sensitive, exact edge changes, sensor provenance, reproducible research export, keyboard, Arabic and mobile');
}
