import {harmonizationLab} from '../../shared/harmonizationLab.js';
import {pilotEvidence} from '../../shared/pilot.js';
import {predictResearch} from '../../shared/researchModel.js';
import {decodePilotPacket} from '../../shared/pilotPacket.js';
let retained;
export default {async fetch(request,env){
 const url=new URL(request.url),q=Object.fromEntries(url.searchParams),p=url.pathname;
 if(!p.startsWith('/api/'))return env.ASSETS.fetch(request);
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(!['GET','HEAD'].includes(request.method))return json({error:'Read-only demo'},405);
 try{
  for(const key of ['mode','region'])if(q[key]&&q[key]!=='brazil')return json({error:'Brazil only'},400);
  retained??=env.ASSETS.fetch(new Request(new URL('/demo/evidence.json',url))).then(r=>{if(!r.ok)throw Error('Missing evidence');return r.json();}).then(decodePilotPacket).catch(e=>{retained=undefined;throw e;});
  const data=await retained;
  if(p==='/api/research/prototype'){
   data.prototype.examples=data.prototype.examples.map(example=>({...example,estimatedMeanFRPMW:predictResearch(data.model,example)}));
   if(q.example!==undefined){if(!/^\d+$/.test(q.example)||!data.prototype.examples[Number(q.example)])return json({error:'Invalid example'},400);return json({...data.prototype,example:data.prototype.examples[Number(q.example)]});}
   return json(data.prototype);
  }
  const from=q.from??(q.year?q.year+'-01-01':undefined),to=q.to??(q.year?q.year+'-12-31':undefined);
  for(const date of [from,to])if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date).toISOString().slice(0,10)!==date))return json({error:'Invalid UTC date'},400);
  if(from&&to&&from>to)return json({error:'Invalid UTC range'},400);
  const bbox=q.bbox?.split(',').map(Number);if(bbox&&(bbox.length!==4||bbox.some(v=>!Number.isFinite(v))))return json({error:'Invalid bbox'},400);
  const rows=data.rows.filter(r=>(!from||r.timestamp.slice(0,10)>=from)&&(!to||r.timestamp.slice(0,10)<=to)&&(!q.sensor||q.sensor==='all'||r.dataset.sensor===q.sensor)&&(!q.platform||r.dataset.platform===q.platform)&&(!q.processing||r.dataset.processing===q.processing)&&(!q.confidence||q.confidence==='all'||String(r.raw.confidence)===q.confidence)&&(!q.daynight||r.raw.daynight===q.daynight)&&(q.frpMin===undefined||(r.frp!==null&&r.frp>=Number(q.frpMin)))&&(q.frpMax===undefined||(r.frp!==null&&r.frp<=Number(q.frpMax)))&&(!bbox||(r.lon>=bbox[0]&&r.lon<=bbox[2]&&r.lat>=bbox[1]&&r.lat<=bbox[3])));
  const common={generation:data.generation,limitedDataDemo:true,from:from??'2024-08-01',to:to??'2024-08-31'};
  if(p==='/api/research/harmonization')return json({...harmonizationLab(rows,{support:q.support??'h3',resolution:Number(q.resolution??6),size:Number(q.size??2000)}),...common});
  if(p==='/api/south-america/pilot')return json({...pilotEvidence(rows,{resolution:Number(q.resolution??6),from:common.from,to:common.to}),...common,region:'brazil',environment:{status:'MISSING',indicators:[],reason:'No environmental evidence bundled'},model:{status:'NOT VALIDATED',trainingSamples:0,reason:'Calibration and reconstruction are not validated'}});
  const summary=q.summary??q.period;
  if(p==='/api/observations'&&summary||p==='/api/history/aggregates'){
   const length={day:10,month:7,year:4}[summary??'month'];if(!length)return json({error:'Invalid period'},400);
   const groups=new Map();for(const r of rows){const period=r.timestamp.slice(0,length),key=r.dataset.id+'|'+period,g=groups.get(key)??{...r.dataset,datasetId:r.dataset.id,period,count:0,frpSum:null,frpReported:0,coverage:'unknown'};g.count++;if(r.frp!==null){g.frpSum=(g.frpSum??0)+r.frp;g.frpReported++;}groups.set(key,g);}
   return json({schema:'firepulse.historical-summary/v1',region:'brazil',coverage:'unknown',unfiltered:!from&&!to,...common,series:[...groups.values()]});
  }
  if(p==='/api/observations'){
   const metadata={...data.metadata,windowFrom:from,windowTo:to};
   if(q.manifest==='1')return json({type:'FeatureCollection',features:[],metadata});
   const limit=Number(q.limit??2000),offset=Number(q.offset??0);if(!Number.isSafeInteger(limit)||limit<1||limit>3000||!Number.isSafeInteger(offset)||offset<0)return json({error:'Invalid page'},400);
   const ids=new Set(rows.slice(offset,offset+limit).map(r=>r.id)),features=data.features.filter(f=>ids.has(f.id)),more=offset+limit<rows.length;
   return json({type:'FeatureCollection',features,metadata:{...metadata,truncated:more,evidencePage:{offset,limit,nextOffset:more?offset+limit:null}}});
  }
  if(p==='/api/history/coverage')return json({region:'brazil',coverage:'unknown',datasets:data.metadata.datasets,availableDates:data.metadata.availableDates});
  if(p==='/api/history/datasets')return json({datasets:data.metadata.datasets,generation:data.generation});
  return json({error:'Not available in limited-data demo; requires original indexed backend'},404);
 }catch(error){return json({error:error instanceof RangeError?error.message:'Bundled evidence unavailable; no substitute observations returned'},error instanceof RangeError?400:503);}
}};
