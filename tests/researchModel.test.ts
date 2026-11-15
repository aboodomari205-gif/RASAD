import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {latLngToCell} from 'h3-js';
// @ts-ignore Runtime JavaScript modules.
import {aggregateResearch,splitResearch,predictResearch,fitResearch,features,researchOverlap} from '../shared/researchModel.js';
// @ts-ignore Runtime Node API.
import {researchPrototype} from '../server/research.js';
// @ts-ignore Indexed original-row stream.
import {researchRows} from '../server/southAmerica.js';
const artifact=JSON.parse(fs.readFileSync('models/brazil-frp-model.json','utf8'));
const packet=JSON.parse(fs.readFileSync('models/brazil-pilot-samples.json','utf8'));

test('bundled actual pilot labels reproduce sample identity and held-out partition without the private database',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(packet.samples)).digest('hex'),artifact.sampleSHA256);
 const split=splitResearch(packet.samples);assert.equal(split.train.length,282);assert.equal(split.temporal.length,306);assert.equal(split.spatial.length,252);assert.equal(split.joint.length,148);
 const errors=split.joint.map((s:{targetMW:number})=>Math.abs(predictResearch(artifact.model,s)-s.targetMW));
 assert.ok(Math.abs(errors.reduce((a:number,b:number)=>a+b,0)/errors.length-artifact.evaluation.evaluation.joint.model.maeMW)<1e-10);
});

test('research labels exclude absent hotspots and missing FRP; preserve real zero and exact source strata',()=>{
 const row=(id:string,frp:number|null)=>({lon:-56,lat:-13,timestamp:'2024-08-01T12:00:00Z',frp,dataset:{id,sensor:id==='m'?'MODIS':'VIIRS',platform:id}});
 const data=aggregateResearch([row('m',null),row('v',0),{...row('m',7),lon:-60}]);
 assert.equal(data.inputRows,2);assert.equal(data.samples.length,1);assert.equal(data.samples[0].targetMW,0);assert.equal(data.samples[0].datasetId,'v');assert.equal(data.excludedNoReportedFRPGroups,1);
 assert.equal(researchOverlap(data.samples,data.descriptors).pairs[0].coDetectedCellDays,0);
 assert.throws(()=>aggregateResearch([row('v',0),row('v',1)],{maxRows:1}),/cap/);
});

test('model inference cannot see target FRP or future labels and rejects unseen source',()=>{
 const sample={cell:latLngToCell(-13,-56,6),date:'2024-08-26',datasetId:artifact.model.sources[0],targetMW:1};
 assert.deepEqual(features(sample,artifact.model.sources),features({...sample,targetMW:999999},artifact.model.sources));
 assert.equal(predictResearch(artifact.model,sample),predictResearch(artifact.model,{...sample,targetMW:999999}));
 assert.throws(()=>predictResearch(artifact.model,{...sample,datasetId:'unseen'}));
 assert.throws(()=>fitResearch(Array.from({length:101},()=>sample),[sample.datasetId,'unseen']),/training support/);
});

test('committed research artifact is finite, bounded, source-specific and explicitly experimental',()=>{
 assert.equal(artifact.evaluation.status,'EXPERIMENTAL_NOT_CALIBRATION');assert.equal(artifact.model.trees.length,60);
 assert.equal(artifact.evaluation.inputRows,6876);assert.equal(artifact.evaluation.eligibleCellDays,988);assert.equal(artifact.model.trainCount,282);
 assert.equal(artifact.evaluation.evaluation.temporal.count,306);assert.equal(artifact.evaluation.evaluation.spatial.count,252);assert.equal(artifact.evaluation.evaluation.joint.count,148);
 for(const source of artifact.model.sources)assert.ok(Number.isFinite(artifact.model.sourceBaselines[source]));
 for(const example of artifact.examples)assert.ok(Number.isFinite(predictResearch(artifact.model,example)));
 assert.ok(artifact.evaluation.evaluation.temporal.model.maeMW>artifact.evaluation.evaluation.temporal.baseline.maeMW,'Mixed results must not be rewritten as improvement');
});

test('research API bounds inference to actual held-out examples and rejects other countries', {skip:!fs.existsSync('server/data/south-america/active.json')},()=>{
 const summary=researchPrototype({});assert.equal(summary.examples.length,30);assert.equal(summary.calibration,'NOT VALIDATED');
 const single=researchPrototype({example:'0',mode:'brazil'});assert.ok(single.example.estimatedMeanFRPMW>=0);
 for(const query of [{example:'30'},{example:'-1'},{example:'NaN'},{region:'jordan'},{cell:'anything'}])assert.throws(()=>researchPrototype(query));
});

test('real research sample checksum, disjoint date/block splits and held-out metrics reproduce independently', {skip:!fs.existsSync('server/data/south-america/active.json')},()=>{
 const {generation,rows}=researchRows({mode:'brazil',from:'2024-08-01',to:'2024-08-31'}),data=aggregateResearch(rows),split=splitResearch(data.samples);
 assert.equal(generation,artifact.generation);assert.equal(createHash('sha256').update(JSON.stringify(data.samples)).digest('hex'),artifact.sampleSHA256);
 const trainBlocks=new Set(split.train.map((r:{block:string})=>r.block));
 assert.ok(split.train.every((r:{date:string})=>r.date<split.cutoff));
 assert.ok([...split.spatial,...split.joint].every((r:{block:string})=>!trainBlocks.has(r.block)));
 assert.ok([...split.temporal,...split.joint].every((r:{date:string})=>r.date>=split.cutoff));
 for(const name of ['temporal','spatial','joint'] as const){const rows=split[name];const predictions=rows.map((r:unknown)=>predictResearch(artifact.model,r));
  const errors=rows.map((r:{targetMW:number},i:number)=>predictions[i]-r.targetMW);
  const mae=errors.reduce((sum:number,v:number)=>sum+Math.abs(v),0)/rows.length,rmse=Math.sqrt(errors.reduce((sum:number,v:number)=>sum+v*v,0)/rows.length);
  assert.ok(Math.abs(mae-artifact.evaluation.evaluation[name].model.maeMW)<1e-10);assert.ok(Math.abs(rmse-artifact.evaluation.evaluation[name].model.rmseMW)<1e-10);
 }
});
