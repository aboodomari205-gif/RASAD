import {latLngToCell,cellArea,cellToParent,cellToBoundary} from 'h3-js';
export const PILOT = {name:'Mato Grosso, Brazil',bbox:[-57,-14,-55,-12],polygon:{type:'Polygon',coordinates:[[[-57,-14],[-55,-14],[-55,-12],[-57,-12],[-57,-14]]]}};
export function validatePolygon(value){
 if(value?.type!=='Polygon'||!Array.isArray(value.coordinates)||value.coordinates.length!==1)throw new RangeError('Use a single-ring GeoJSON Polygon without holes');
 const ring=value.coordinates[0];if(ring.length<4||ring.length>100)throw new RangeError('Polygon requires 4–100 coordinates');
 for(const p of ring)if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<-74||p[0]>-34||p[1]<-34||p[1]>6)throw new RangeError('Polygon coordinates must be in the Brazil search extent');
 if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])throw new RangeError('Polygon ring must be closed');
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 let area=0;for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if(a[0]===b[0]&&a[1]===b[1])throw new RangeError('Repeated polygon vertex');area+=a[0]*b[1]-b[0]*a[1];for(let j=i+2;j<ring.length-1;j++){if(i===0&&j===ring.length-2)continue;const c=ring[j],d=ring[j+1];if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1])))throw new RangeError('Self-intersecting polygon');}}
 if(Math.abs(area)<1e-8)throw new RangeError('Degenerate polygon');return value;
}
export function insidePolygon(lon,lat,polygon){let inside=false;const r=polygon.coordinates[0];for(let i=0,j=r.length-2;i<r.length-1;j=i++){const a=r[i],b=r[j],cross=(lon-a[0])*(b[1]-a[1])-(lat-a[1])*(b[0]-a[0]);if(Math.abs(cross)<1e-10&&lon>=Math.min(a[0],b[0])&&lon<=Math.max(a[0],b[0])&&lat>=Math.min(a[1],b[1])&&lat<=Math.max(a[1],b[1]))return true;if((a[1]>lat)!==(b[1]>lat)&&lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
/** Source-specific detected occupancy. Unknown opportunity never becomes a covered zero. */
export function pilotEvidence(rows,{polygon=PILOT.polygon,resolution=6,from,to}={}){
 validatePolygon(polygon);if(!Number.isInteger(resolution)||resolution<4||resolution>8)throw new RangeError('H3 resolution must be 4–8');
 const groups=new Map(),cells=new Map();let latest=null,count=0;
 for(const r of rows){if(!insidePolygon(r.lon,r.lat,polygon))continue;count++;if(!latest||r.timestamp>latest)latest=r.timestamp;const day=r.timestamp.slice(0,10),id=latLngToCell(r.lat,r.lon,resolution),key=r.dataset.id+'|'+day;
 const g=groups.get(key)??{datasetId:r.dataset.id,sensor:r.dataset.sensor,platform:r.dataset.platform,processing:r.dataset.processing,date:day,count:0,frpSum:null,frpReported:0,cells:new Set()};g.count++;g.cells.add(id);if(r.frp!==null){g.frpSum=(g.frpSum??0)+r.frp;g.frpReported++;}groups.set(key,g);
 const c=cells.get(id)??{id,areaKm2:cellArea(id,'km2'),parent:cellToParent(id,resolution-1),sources:new Set(),observedDates:new Set(),count:0};c.sources.add(r.dataset.id);c.observedDates.add(day);c.count++;cells.set(id,c);
 }
 const seen=new Map(),previous=new Map();const daily=[...groups.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.datasetId.localeCompare(b.datasetId)).map(g=>{const old=seen.get(g.datasetId)??new Set(),prior=previous.get(g.datasetId),newCells=[...g.cells].filter(c=>!old.has(c)).length,repeated=prior?[...g.cells].filter(c=>prior.cells.has(c)).length:null;for(const c of g.cells)old.add(c);seen.set(g.datasetId,old);previous.set(g.datasetId,{date:g.date,cells:g.cells});return {...g,cells:undefined,activeCells:g.cells.size,newInWindowCells:newCells,repeatedFromPriorObservedDate:repeated,priorObservedDate:prior?.date??null,coverage:'unknown'};});
 const all=[...cells.values()];return {schema:'rasad.pilot-evidence/v1',polygon,from,to,resolution,count,latestAcquisitionUTC:latest,coverage:'unknown',calibration:'NOT VALIDATED',daily,activeCells:all.length,previewTruncated:all.length>1200,cells:all.slice(0,1200).map(c=>({...c,sources:[...c.sources],observedDates:[...c.observedDates].sort(),boundary:cellToBoundary(c.id,true)})),meaning:'New means first detected cell within this selected window and source, not ignition. Repeated cells compare prior positive-delivery date, not necessarily yesterday. No perimeter, spread direction or verified zero is inferred. H3 cells vary in area; resolutions are not sensor footprints.'};
}
