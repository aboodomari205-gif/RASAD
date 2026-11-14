import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export async function auditExperience({evaluate,waitFor,navigate,send}) {
 const routes=['Mission Atlas','Burning Calendar','Fire Season Clock','Sensor Intelligence','Evidence Engine','Fire DNA','Anomaly Detection','Decision Brief','Trust the Signal'];
 const report={production:true,initial:await evaluate('({navigation:performance.getEntriesByType("navigation")[0].toJSON(),paints:performance.getEntriesByType("paint").map(p=>({name:p.name,time:p.startTime})),resources:performance.getEntriesByType("resource").filter(r=>r.name.includes("/assets/")).map(r=>({name:r.name.split("/").pop(),duration:r.duration,bytes:r.encodedBodySize}))})'),routes:[],findings:[]};
 for(const mobile of [false,true]) {
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1000,deviceScaleFactor:1,mobile});
  for(const route of routes){
   const start=await evaluate('performance.now()');await navigate(route);
   await waitFor('!document.querySelector(".lab-content[aria-busy=true]") && (!!document.querySelector(".lab-content") || !!document.querySelector(".burning-calendar") || !!document.querySelector(".fire-map-canvas"))');
   // Allow route entrance layout to settle; elapsed time is not a network benchmark.
   await new Promise(r=>setTimeout(r,400));
   const metrics=await evaluate('({elapsed:performance.now(),overflow:document.documentElement.scrollWidth>innerWidth+1,mapRetained:window.verificationMap.getCanvas()===window.originalCanvas,text:document.querySelector(".lab-content")?.innerText.slice(0,2000)??""})');
   report.routes.push({route,mobile,elapsedMs:metrics.elapsed-start,overflow:metrics.overflow,mapRetained:metrics.mapRetained});
   assert.equal(metrics.mapRetained,true);assert.equal(metrics.overflow,false,route+' viewport overflow');
   if(route==='Sensor Intelligence'&&metrics.text.includes('No hotspot matching'))report.findings.push({severity:'P2',issue:'Sensor Intelligence says no hotspot matching is supplied although Evidence Engine offers exploratory matching.'});
   if(mobile){await evaluate('document.querySelector(".language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));}
   const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`.checkpoints/sprint6-${mobile?'ar-mobile':'desktop'}-${route.toLowerCase().replaceAll(' ','-')}.png`,Buffer.from(shot.data,'base64'));
   if(mobile){await evaluate('document.querySelector(".language-switch").click()');await waitFor('document.documentElement.dir==="ltr"');}
  }
 }
 await navigate('Evidence Engine');await waitFor('!!document.querySelector(".evidence-engine")');
 await evaluate('(()=>{const i=document.querySelector("input[aria-label=\\"Period A start\\"]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"2099-01-01");i.dispatchEvent(new Event("input",{bubbles:true}));})()');
 await waitFor('!!document.querySelector(".evidence-engine [role=alert]")');
 if(process.argv.includes('--after')){
  assert.equal(await evaluate('document.querySelector("[data-sensitivity=current] td").textContent'),'5','Invalid historical period must not suppress valid candidate matching');
  assert.equal(await evaluate('document.querySelector("#research-brief button").disabled'),false);
  assert.equal(await evaluate('[...document.querySelectorAll(".evidence-engine button")].find(b=>b.textContent==="Download evidence JSON").disabled'),true,'Historical report must not conceal invalid periods');
 }
 await evaluate('document.getElementById("start-judge-guide").click()');
 const blocked=await evaluate('!!document.querySelector(".evidence-engine [role=alert]")');
 if(process.argv.includes('--after'))assert.equal(blocked,false,'Judge start must reset invalid comparison periods');
 report.findings.push({severity:blocked?'P1':'PASS',issue:'Starting the judge guide after an invalid comparison period',blocked});
 await writeFile(`.checkpoints/sprint6-audit-${process.argv.includes('--after')?'after':'before'}.json`,JSON.stringify(report,null,2));
 console.log('AUDIT',JSON.stringify({routes:report.routes.length,findings:report.findings}));
 // Keep the audit reversible and do not pollute subsequent browser checks.
 await evaluate('sessionStorage.removeItem("firepulse.guide.step")');
}
