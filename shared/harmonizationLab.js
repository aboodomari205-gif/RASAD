import {latLngToCell,cellToBoundary,cellArea} from 'h3-js';
import {equalAreaCell,GRID_METHOD} from './equalArea.ts';
import {PILOT,insidePolygon} from './pilot.js';
import {researchOverlap} from './researchModel.js';
export function harmonizationLab(rows,{support='h3',resolution=6,size=2000}={}){
 if(!['h3','equal-area'].includes(support)||!Number.isInteger(resolution)||resolution<4||resolution>8||![1000,2000,5000].includes(size))throw new RangeError('Invalid common spatial support');
 const sources=new Map(),groups=new Map(),cells=new Map(),points={MODIS:[],VIIRS:[]};let count=0;
 for(const r of rows){if(!insidePolygon(r.lon,r.lat,PILOT.polygon))continue;if(++count>100000)throw new RangeError('Narrow pilot dates; 100000-row analysis limit');
  const d=r.dataset,source=sources.get(d.id)??{id:d.id,sensor:d.sensor,platform:d.platform,processing:d.processing,product:d.product,version:d.version,nominalResolution:d.sensor==='MODIS'?'~1 km':'~375 m',confidence:d.sensor==='MODIS'?'Original MODIS percent; not comparable to VIIRS categories':'Original VIIRS low/nominal/high categories; not converted to MODIS percent',lineage:d.fieldSemantics?.historicalReference??'delivery-declared',count:0,frpSum:null,frpReported:0,firstUTC:r.timestamp,lastUTC:r.timestamp,sourceFiles:new Set()};
  source.count++;source.firstUTC=source.firstUTC<r.timestamp?source.firstUTC:r.timestamp;source.lastUTC=source.lastUTC>r.timestamp?source.lastUTC:r.timestamp;source.sourceFiles.add(r.delivery?.source_file??'unknown');
  if(r.frp!==null){source.frpSum=(source.frpSum??0)+r.frp;source.frpReported++;}sources.set(d.id,source);
  const date=r.timestamp.slice(0,10),id=support==='h3'?latLngToCell(r.lat,r.lon,resolution):equalAreaCell(r.lon,r.lat,size),key=[d.id,id,date].join('|');
  const g=groups.get(key)??{datasetId:d.id,cell:id,date,count:0,frpSum:0,frpReported:0};g.count++;if(r.frp!==null){g.frpSum+=r.frp;g.frpReported++;}groups.set(key,g);
  const c=cells.get(id)??{id,MODIS:0,VIIRS:0,sourceCounts:{},dates:{}};c[d.sensor]++;c.sourceCounts[d.id]=(c.sourceCounts[d.id]??0)+1;c.dates[date]??={MODIS:0,VIIRS:0};c.dates[date][d.sensor]++;cells.set(id,c);
  if(points[d.sensor].length<600)points[d.sensor].push({id:r.id,lon:r.lon,lat:r.lat,utc:r.timestamp,frp:r.frp,confidence:r.raw.confidence,platform:d.platform,datasetId:d.id,processing:d.processing,sourceFile:r.delivery?.source_file,sourceMember:r.delivery?.member,sourceSHA256:r.delivery?.sha256});
 }
 const descriptors=[...sources.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(s=>({...s,sourceFiles:[...s.sourceFiles]})),samples=[...groups.values()].map(g=>({...g,targetMW:g.frpReported?g.frpSum/g.frpReported:null}));
 const boundary=id=>{if(support==='h3')return cellToBoundary(id,true);const[x,y]=id.split(':').map(Number),r=GRID_METHOD.radiusM,c=Math.cos(Math.PI/6);return [[x,y],[x+1,y],[x+1,y+1],[x,y+1],[x,y]].map(([a,b])=>[a*size/(r*c)*180/Math.PI,Math.asin(b*size*c/r)*180/Math.PI]);};
 const overlap=researchOverlap(samples,descriptors);overlap.support='Actual source-positive cells on the same UTC day; no-record counterparts are unknown, not verified negatives.';
 return {schema:'rasad.harmonization-lab/v1',region:'brazil',pilot:PILOT,count,support,resolution:support==='h3'?resolution:null,sizeM:support==='equal-area'?size:null,opportunity:'UNKNOWN',calibration:'NOT VALIDATED',sources:descriptors,points,pointPreviewLimitPerSensor:600,activeCells:cells.size,cellPreviewTruncated:cells.size>2000,cells:[...cells.values()].slice(0,2000).map(c=>({...c,areaKm2:support==='h3'?cellArea(c.id,'km2'):size*size/1e6,boundary:boundary(c.id)})),overlap,cellDays:samples};
}
