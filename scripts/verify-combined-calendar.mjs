import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../server/package.json',import.meta.url));
const {parse}=require('csv-parse/sync');
export async function verifyCombinedCalendar({evaluate,waitFor,navigate,send}){
 await navigate('Burning Calendar');await waitFor('!!document.querySelector("input[name=calendar-instrument][value=all]")');
 await evaluate('document.querySelector("input[name=calendar-instrument][value=all]").click()');
 const month=async(year,value)=>{for(const [label,v] of [['Calendar year',year],['Calendar month',value]])await evaluate(`(()=>{const s=document.querySelector('select[aria-label="${label}"]');s.value='${v}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);};
 await month('2020','9');await waitFor('document.querySelector(".burning-calendar").dataset.instrument==="all"');
 assert.ok(await evaluate('document.querySelector(".calendar-month-summary").textContent.includes("MODIS: 1 / VIIRS: 1")'));
 assert.equal(await evaluate('document.querySelectorAll(".calendar-day[data-state=verified-zero]").length'),0);
 await evaluate('(()=>{window.oldCalendarURL=URL.createObjectURL;URL.createObjectURL=b=>{window.calendarBlob=b;return window.oldCalendarURL(b)};[...document.querySelectorAll(".burning-calendar button")].find(b=>b.textContent==="Download displayed month CSV").click();})()');
 const csv=await evaluate('await window.calendarBlob.text()'),rows=parse(csv,{columns:true});assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.sensor).sort(),['MODIS','VIIRS']);assert.equal(new Set(rows.map(r=>r.observation_id)).size,2);assert.ok(rows.every(r=>r.coverage_status==='unknown'&&r.utc_date.startsWith('2020-10')&&r.reported_count==='1'));
 await evaluate('[...document.querySelectorAll(".burning-calendar button")].find(b=>b.textContent==="Download displayed month CSV").click()');assert.equal(await evaluate('await window.calendarBlob.text()'),csv);await evaluate('URL.createObjectURL=window.oldCalendarURL');
 for(const sensor of ['MODIS','VIIRS','all']){await evaluate(`document.querySelector('input[name=calendar-instrument][value=${sensor}]').click()`);assert.equal(await evaluate('document.querySelector(".burning-calendar").dataset.instrument'),sensor);}
 await evaluate('document.querySelector(".calendar-day[data-state=observed]").click()');assert.equal(await evaluate('document.querySelectorAll("#calendar-day-detail .calendar-day-detail").length'),2);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await waitFor('document.documentElement.dir==="rtl"');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));assert.ok(await evaluate('document.querySelector("input[value=all]").parentElement.textContent.includes("المصدران")'));
 await evaluate('document.querySelector(".calendar-grid").scrollIntoView()');const {writeFile}=await import('node:fs/promises');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('.checkpoints/closure-calendar-ar.png',Buffer.from(shot.data,'base64'));
 await evaluate('document.querySelector(".burning-calendar .language-switch").click()');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('document.querySelector("#calendar-modis-detail .calendar-map-link").click()');await waitFor('!document.querySelector(".burning-calendar")');assert.equal(await evaluate('JSON.parse(sessionStorage.getItem("firepulse.mission-scope.v1")).sensor'),'MODIS');
 console.log('PASS combined Calendar source-separated day counts, deterministic CSV ID roundtrip, mode transitions, Arabic mobile and MODIS Atlas handoff');
}
