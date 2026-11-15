/** Conditional-on-detection FRP research; never generates absent-hotspot labels. */
import {latLngToCell,cellToParent,cellToLatLng} from 'h3-js';
import {PILOT,insidePolygon} from './pilot.js';
export const FEATURE_NAMES=['cell_latitude','cell_longitude','season_sin','season_cos','source_index'];
export const MODEL_LIMITS=[
 'EXPERIMENTAL conditional mean reported FRP per source-positive H3 cell-day, not future fire prediction.',
 'No-record days are excluded, never labeled negatives. Labels reflect source-specific selection and reported FRP only.',
 'VIIRS is not ground truth. Platform/product/processing strata remain separate; NOAA-20/21 Standard lineage is unresolved.',
 'One-month Brazil pilot; no independent year holdout, no opportunity/cloud/geolocation QA or environmental covariates.',
 'No calibrated uncertainty interval, downscaling, sensor-equivalent adjustment or historical reconstruction.',
];
export function features(sample,sources){
 const [lat,lon]=cellToLatLng(sample.cell),date=Date.parse(sample.date+'T00:00:00Z');
 const year=Number(sample.date.slice(0,4)),start=Date.UTC(year,0,1),next=Date.UTC(year+1,0,1);
 const phase=2*Math.PI*(date-start)/(next-start),source=sources.indexOf(sample.datasetId);
 if(source<0)throw new RangeError('Unseen source stratum');
 return [lat,lon,Math.sin(phase),Math.cos(phase),source];
}
export function aggregateResearch(rows,{resolution=6,polygon=PILOT.polygon,maxRows=100000}={}){
 const groups=new Map(),descriptors=new Map();let inputRows=0,frpMissing=0;
 for(const r of rows){if(!insidePolygon(r.lon,r.lat,polygon))continue;if(++inputRows>maxRows)throw new RangeError('Research row cap exceeded; narrow dates');
  descriptors.set(r.dataset.id,{id:r.dataset.id,sensor:r.dataset.sensor,platform:r.dataset.platform,product:r.dataset.product,version:r.dataset.version,processing:r.dataset.processing,lineage:r.dataset.fieldSemantics?.historicalReference??'delivery-declared'});
  const cell=latLngToCell(r.lat,r.lon,resolution),date=r.timestamp.slice(0,10),key=[r.dataset.id,cell,date].join('|');
  const g=groups.get(key)??{datasetId:r.dataset.id,cell,block:cellToParent(cell,4),date,count:0,frpReported:0,frpSum:0};g.count++;
  if(r.frp!==null&&Number.isFinite(r.frp)&&r.frp>=0){g.frpSum+=r.frp;g.frpReported++;}else frpMissing++;
  groups.set(key,g);
 }
 const samples=[...groups.values()].filter(g=>g.frpReported>0).map(g=>({...g,targetMW:g.frpSum/g.frpReported})).sort((a,b)=>a.date.localeCompare(b.date)||a.block.localeCompare(b.block)||a.cell.localeCompare(b.cell)||a.datasetId.localeCompare(b.datasetId));
 return {samples,descriptors:[...descriptors.values()].sort((a,b)=>a.id.localeCompare(b.id)),inputRows,frpMissing,excludedNoReportedFRPGroups:groups.size-samples.length};
}
export function researchOverlap(samples,descriptors){
 const sources=new Map(descriptors.map(d=>[d.id,d])),pairs=[];
 for(const modis of descriptors.filter(d=>d.sensor==='MODIS'))for(const viirs of descriptors.filter(d=>d.sensor==='VIIRS')){
  const left=new Map(samples.filter(s=>s.datasetId===modis.id).map(s=>[s.cell+'|'+s.date,s]));
  const right=new Map(samples.filter(s=>s.datasetId===viirs.id).map(s=>[s.cell+'|'+s.date,s]));
  const both=[...left.keys()].filter(k=>right.has(k)),union=new Set([...left.keys(),...right.keys()]);
  pairs.push({modis:sources.get(modis.id),viirs:sources.get(viirs.id),modisPositiveCellDays:left.size,viirsPositiveCellDays:right.size,coDetectedCellDays:both.length,modisOnlyDelivered:left.size-both.length,viirsOnlyDelivered:right.size-both.length,deliveredJaccard:union.size?both.length/union.size:null,paired:both.map(key=>({cell:key.split('|')[0],date:key.split('|')[1],modisCount:left.get(key).count,viirsCount:right.get(key).count,modisMeanReportedFRPMW:left.get(key).targetMW,viirsMeanReportedFRPMW:right.get(key).targetMW}))});
 }
 return {support:'Source-positive H3 cell-days with reported FRP; source-only is absence of delivered counterpart, not a confirmed negative.',calibration:'NOT VALIDATED',pairs};
}
const average=values=>values.reduce((a,b)=>a+b,0)/values.length;
const hash=text=>{let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function splitResearch(samples,cutoff='2024-08-25'){
 const blocks=[...new Set(samples.map(s=>s.block))].sort((a,b)=>hash(a)-hash(b)||a.localeCompare(b));
 const held=new Set(blocks.slice(0,Math.max(1,Math.ceil(blocks.length/5))));
 return {cutoff,heldBlocks:[...held],train:samples.filter(s=>s.date<cutoff&&!held.has(s.block)),temporal:samples.filter(s=>s.date>=cutoff&&!held.has(s.block)),spatial:samples.filter(s=>s.date<cutoff&&held.has(s.block)),joint:samples.filter(s=>s.date>=cutoff&&held.has(s.block))};
}
function treeFit(x,residuals,{depth=3,minLeaf=12}={},indices=x.map((_,i)=>i)){
 const values=indices.map(i=>residuals[i]),mean=average(values);
 if(depth===0||indices.length<minLeaf*2)return {value:mean};
 let best=null,bestLoss=values.reduce((sum,v)=>sum+(v-mean)**2,0);
 for(let feature=0;feature<x[0].length;feature++){
  const order=indices.slice().sort((a,b)=>x[a][feature]-x[b][feature]);
  const total=values.reduce((sum,v)=>sum+v,0),totalSq=values.reduce((sum,v)=>sum+v*v,0);let sum=0,sq=0;
  for(let k=0;k<order.length-1;k++){const y=residuals[order[k]];sum+=y;sq+=y*y;const n=k+1,m=order.length-n;
   if(n<minLeaf||m<minLeaf||x[order[k]][feature]===x[order[k+1]][feature])continue;
   const loss=sq-sum*sum/n+(totalSq-sq)-(total-sum)**2/m;
   if(loss<bestLoss-1e-10){bestLoss=loss;best={feature,threshold:(x[order[k]][feature]+x[order[k+1]][feature])/2,left:order.slice(0,n),right:order.slice(n)};}
  }
 }
 return best?{feature:best.feature,threshold:best.threshold,left:treeFit(x,residuals,{depth:depth-1,minLeaf},best.left),right:treeFit(x,residuals,{depth:depth-1,minLeaf},best.right)}:{value:mean};
}
export function treePredict(tree,x){return tree.value!==undefined?tree.value:treePredict(x[tree.feature]<=tree.threshold?tree.left:tree.right,x);}
export function fitResearch(train,sources,{iterations=60,learningRate=0.06,depth=3,minLeaf=12}={}){
 if(train.length<100)throw new RangeError('At least 100 source-positive training cell-days required');
 if(sources.some(source=>!train.some(s=>s.datasetId===source)))throw new RangeError('Every source stratum must have actual training support');
 const x=train.map(s=>features(s,sources)),y=train.map(s=>Math.log1p(s.targetMW)),base=average(y),pred=y.map(()=>base),trees=[];
 for(let i=0;i<iterations;i++){const tree=treeFit(x,y.map((v,j)=>v-pred[j]),{depth,minLeaf});trees.push(tree);for(let j=0;j<pred.length;j++)pred[j]+=learningRate*treePredict(tree,x[j]);}
 const sourceBaselines=Object.fromEntries(sources.map(source=>[source,average(train.filter(s=>s.datasetId===source).map(s=>Math.log1p(s.targetMW)))]));
 return {algorithm:'Deterministic squared-error gradient boosting of depth-3 regression trees on log1p(mean reported FRP)',features:FEATURE_NAMES,sources,base,sourceBaselines,learningRate,trees,hyperparameters:{iterations,learningRate,depth,minLeaf},trainCount:train.length};
}
export function predictResearch(model,sample){const x=features(sample,model.sources);return Math.max(0,Math.expm1(model.trees.reduce((p,t)=>p+model.learningRate*treePredict(t,x),model.base)));}
export function evaluateResearch(model,samples){
 if(!samples.length)return {count:0,baseline:null,model:null};
 const metrics=pred=>({maeMW:average(samples.map((s,i)=>Math.abs(pred[i]-s.targetMW))),rmseMW:Math.sqrt(average(samples.map((s,i)=>(pred[i]-s.targetMW)**2))),biasMW:average(samples.map((s,i)=>pred[i]-s.targetMW)),maeLog1p:average(samples.map((s,i)=>Math.abs(Math.log1p(pred[i])-Math.log1p(s.targetMW))))});
 return {count:samples.length,baseline:metrics(samples.map(s=>Math.expm1(model.sourceBaselines[s.datasetId]??model.base))),model:metrics(samples.map(s=>predictResearch(model,s)))};
}
