import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {researchRows} from '../server/southAmerica.js';
import {aggregateResearch,splitResearch,fitResearch,evaluateResearch,researchOverlap,MODEL_LIMITS} from '../shared/researchModel.js';
const query={mode:'brazil',from:'2024-08-01',to:'2024-08-31'},cutoff='2024-08-25';
let generation,data;
if(process.argv.includes('--from-bundled')){
 const packet=JSON.parse(fs.readFileSync(new URL('../models/brazil-pilot-samples.json',import.meta.url),'utf8'));
 const actual=createHash('sha256').update(JSON.stringify(packet.samples)).digest('hex');
 if(actual!==packet.sampleSHA256)throw Error('Bundled real research sample checksum mismatch');
 generation=packet.generation;data=packet;
}else{const input=researchRows(query);generation=input.generation;data=aggregateResearch(input.rows);}
const sources=data.descriptors.map(d=>d.id),split=splitResearch(data.samples,cutoff);
if(!split.temporal.length||!split.joint.length)throw Error('No temporal and joint spatial/temporal held-out observations; no evaluation claim');
const model=fitResearch(split.train,sources);
const sha256=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const evaluation={schema:'rasad.research-evaluation/v1',status:'EXPERIMENTAL_NOT_CALIBRATION',generation,query,task:'Estimate mean reported FRP MW per source-positive H3 resolution-6 cell-day, conditional on actual detected hotspots with reported FRP. Not forecasting.',features:model.features,sourceDescriptors:data.descriptors,inputRows:data.inputRows,frpMissing:data.frpMissing,eligibleCellDays:data.samples.length,excludedNoReportedFRPGroups:data.excludedNoReportedFRPGroups,sampleSHA256:sha256(data.samples),training:{count:split.train.length,cutoff,first:split.train[0].date,last:split.train.at(-1).date,heldSpatialBlocks:split.heldBlocks,trainingBlocks:[...new Set(split.train.map(s=>s.block))],hyperparameters:model.hyperparameters,selection:'Fixed parameters; no tuning on held-out results'},evaluation:{temporal:evaluateResearch(model,split.temporal),spatial:evaluateResearch(model,split.spatial),joint:evaluateResearch(model,split.joint)},uncertainty:'No calibrated prediction interval; empirical held-out errors are not individual uncertainty bounds.',limitations:MODEL_LIMITS,overlap:researchOverlap(data.samples,data.descriptors)};
const examples=split.joint.slice(0,30).map(s=>({datasetId:s.datasetId,cell:s.cell,date:s.date,observedMeanFRPMW:s.targetMW}));
const artifact={schema:'rasad.research-model/v1',generation,sampleSHA256:evaluation.sampleSHA256,domain:{bbox:[-57,-14,-55,-12],from:query.from,to:query.to,resolution:6},model,evaluation,examples};
const root=new URL('../models/',import.meta.url);fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(new URL('brazil-frp-model.json',root),JSON.stringify(artifact,null,2));
fs.writeFileSync(new URL('brazil-frp-evaluation.json',root),JSON.stringify(evaluation,null,2));
fs.mkdirSync(new URL('../.checkpoints/rasad-ai/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../.checkpoints/rasad-ai/samples.json',import.meta.url),JSON.stringify(data.samples));
console.log(JSON.stringify({generation,inputRows:data.inputRows,eligibleCellDays:data.samples.length,train:split.train.length,evaluation:evaluation.evaluation,sampleSHA256:evaluation.sampleSHA256},null,2));
