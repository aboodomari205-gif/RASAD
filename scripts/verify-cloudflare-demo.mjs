import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {harmonizationLab} from '../shared/harmonizationLab.js';
import {predictResearch} from '../shared/researchModel.js';
const origin=process.argv[2]??'http://127.0.0.1:5180';
async function get(route){const r=await fetch(origin+route);assert.equal(r.status,200,route);return r.json();}
const bytes=await fs.readFile('dist/demo/evidence.json'),snapshot=JSON.parse(bytes),manifest=JSON.parse(await fs.readFile('dist/demo/manifest.json'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
assert.equal(snapshot.rows.length,6876);assert.equal(new Set(snapshot.features.map(f=>f.id)).size,6876);
const actual=await get('/api/observations?mode=brazil&manifest=1');assert.equal(actual.metadata.limitedDataDemo,true);assert.equal(actual.metadata.totalDelivered,6876);
const ids=new Set();let total=0;
for(let offset=0;offset<6876;offset+=3000){const page=await get('/api/observations?mode=brazil&from=2024-08-01&to=2024-08-31&limit=3000&offset='+offset);for(const f of page.features){assert.ok(!ids.has(f.id));ids.add(f.id);assert.ok(f.geometry.coordinates[0]>=-57&&f.geometry.coordinates[0]<=-55&&f.geometry.coordinates[1]>=-14&&f.geometry.coordinates[1]<=-12);}total+=page.features.length;}
assert.equal(total,6876);
for(const support of ['h3','equal-area']){const expected=harmonizationLab(snapshot.rows,{support,resolution:6,size:2000}),value=await get('/api/research/harmonization?mode=brazil&from=2024-08-01&to=2024-08-31&support='+support);assert.deepEqual(value.overlap,expected.overlap);assert.equal(value.count,6876);assert.equal(value.cells.length,expected.cells.length);}
const summary=await get('/api/observations?mode=brazil&summary=day');assert.equal(summary.series.reduce((n,r)=>n+r.count,0),6876);
const empty=await get('/api/observations?mode=brazil&from=2024-07-01&to=2024-07-01');assert.equal(empty.features.length,0);assert.equal(empty.metadata.availability.coverage,'unknown');
const model=JSON.parse(await fs.readFile('models/brazil-frp-model.json')),prototype=await get('/api/research/prototype');assert.deepEqual(prototype.evaluation,model.evaluation);assert.equal(model.model.trees.length,60);
for(const example of prototype.examples)assert.ok(Math.abs(example.estimatedMeanFRPMW-predictResearch(model.model,example))<1e-10,'Worker and Node inference must agree within floating-point rounding');
assert.equal(prototype.archiveAvailable,false);assert.equal((await fetch(origin+'/api/observations?mode=ajloun')).status,400);assert.equal((await fetch(origin+'/api/research/prototype?example=999')).status,400);
const {default:worker}=await import('../dist/_worker.js?missing-evidence');
const unavailable=await worker.fetch(new Request('https://demo.example/api/observations?mode=brazil'),{ASSETS:{fetch:async()=>new Response('Missing',{status:404})}});
assert.equal(unavailable.status,503);assert.match((await unavailable.json()).error,/no substitute observations/);
console.log('PASS Pages runtime: 6876 authentic unique coordinates, pagination conservation, exact H3/equal-area overlap, daily totals, real 60-tree inference/evaluation, empty states and rejected invalid scope.');
