import assert from 'node:assert/strict';
const base=new URL(process.argv[2]??'');
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use HTTPS or an explicit local origin');
if(base.username||base.password)throw Error('Credentials must not be embedded in URLs');
async function get(route,json=true){const r=await fetch(new URL(route,base),{signal:AbortSignal.timeout(15000),redirect:'error'});assert.equal(r.status,200,route);if(json){assert.match(r.headers.get('content-type'),/json/);return r.json();}return r.text();}
assert.match(await get('/',false),/<div id="root">/);assert.match(await get('/mission',false),/<div id="root">/);assert.equal((await get('/api/health')).project,'FIREPULSE');assert.equal((await get('/jordan-adm1.geojson')).type,'FeatureCollection');
const totals={};const revisions=new Set();
for(const region of['ajloun','northern-jordan']){
 const m=await get('/api/observations?mode='+region+'&manifest=1');assert.equal(m.type,'FeatureCollection');assert.equal(m.features.length,0);assert.equal(m.metadata.mode,region);assert.equal(m.metadata.developmentFixture,false);assert.equal(m.metadata.historical,true);assert.match(m.metadata.activationRevision,/^[a-f0-9]{64}$/);revisions.add(m.metadata.activationRevision);assert.ok(m.metadata.totalDelivered>0);assert.equal(m.metadata.availability.coverage,'unknown');
 const ids=new Set();let total=0;for(const[year,route]of Object.entries(m.metadata.yearPaths)){assert.equal(new URL(route,base).origin,base.origin);const c=await get(route);assert.equal(c.metadata.mode,region);assert.equal(c.metadata.activationRevision,m.metadata.activationRevision);assert.equal(c.features.length,m.metadata.yearCounts[year]);for(const f of c.features){assert.ok(!ids.has(f.id));ids.add(f.id);assert.ok(f.properties.date.startsWith(year));assert.ok(f.geometry.coordinates.every(Number.isFinite));}total+=c.features.length;}
 assert.equal(total,m.metadata.totalDelivered);assert.equal((await get('/api/observations?mode='+region)).features.length,m.metadata.yearCounts[String(m.metadata.defaultYear)]);assert.equal((await get('/api/history/coverage?region='+region)).coverageStatus,'unknown');totals[region]=total;
}
assert.equal(revisions.size,1);console.log('PASS actual HTTP HTML/deep link/assets, both activated region manifests and every UTC-year count/ID/revision, latest-year defaults, fixture isolation and unknown coverage:',JSON.stringify(totals));
