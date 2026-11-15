import fs from 'node:fs';
import {predictResearch} from '../shared/researchModel.js';
const file=new URL('../models/brazil-frp-model.json',import.meta.url);
export function researchPrototype(query={}){
 for(const key of Object.keys(query))if(!['example','mode','region'].includes(key))throw new RangeError('Unsupported research query');
 for(const key of ['mode','region'])if(query[key]!==undefined&&query[key]!=='brazil')throw new RangeError('Brazil only');
 if(!fs.existsSync(file))return {status:'UNAVAILABLE',reason:'Run node scripts/train-research.mjs against the indexed real Brazil data'};
 const artifact=JSON.parse(fs.readFileSync(file,'utf8'));
 const pointerFile=new URL('./data/south-america/active.json',import.meta.url);
 const pointer=fs.existsSync(pointerFile)?JSON.parse(fs.readFileSync(pointerFile,'utf8')):null;
 if(pointer&&pointer.generation!==artifact.generation)return {status:'STALE_MODEL',reason:'Indexed data generation changed; retrain and revalidate before inference'};
 const examples=artifact.examples.map((s,index)=>({...s,index,estimatedMeanFRPMW:predictResearch(artifact.model,s),kind:'EXPERIMENTAL_MODEL_ESTIMATE',observedKind:'OBSERVED_SOURCE_MEAN_REPORTED_FRP'}));
 if(query.example!==undefined){if(typeof query.example!=='string'||!/^\d{1,2}$/.test(query.example)||Number(query.example)>=examples.length)throw new RangeError('Select an existing held-out example index');return {status:artifact.evaluation.status,generation:artifact.generation,example:examples[Number(query.example)],uncertainty:artifact.evaluation.uncertainty,limitations:artifact.evaluation.limitations};}
 return {status:artifact.evaluation.status,generation:artifact.generation,archiveAvailable:Boolean(pointer),domain:artifact.domain,evaluation:artifact.evaluation,examples,calibration:'NOT VALIDATED',downscaling:'NOT VALIDATED',historicalReconstruction:'NOT VALIDATED'};
}
export function registerResearch(app){
 app.get('/api/research/prototype',(req,res)=>{try{res.json(researchPrototype(req.query));}catch(e){res.status(e instanceof RangeError?400:503).json({error:e instanceof RangeError?e.message:'Research model unavailable; no substitute estimates returned'});}});
}
