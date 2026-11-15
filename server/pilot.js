import fs from 'node:fs';
import {PILOT,validatePolygon,insidePolygon} from '../shared/pilot.js';
import {validateEnvironment} from '../scripts/import-environment.mjs';
export function pilotOptions(query){
 const resolution=Number(query.resolution??6);if(!Number.isInteger(resolution)||resolution<4||resolution>8)throw new RangeError('H3 resolution must be 4–8');
 let polygon=PILOT.polygon;if(query.polygon){if(typeof query.polygon!=='string'||query.polygon.length>12000)throw new RangeError('Invalid polygon');try{polygon=JSON.parse(query.polygon);}catch{throw new RangeError('Invalid polygon JSON');}validatePolygon(polygon);}
 return {polygon,resolution};
}
export function environmentalStatus({polygon=PILOT.polygon,from,to}={}){
 const path=new URL('../data/processed/environment.json',import.meta.url);
 if(!fs.existsSync(path))return {status:'MISSING',indicators:[],concernIndex:null,reason:'No validated environmental inputs imported. Missing is unknown; no risk probability is computed.'};
 try{const value=JSON.parse(fs.readFileSync(path,'utf8'));if(value.schema!=='rasad.environment/v1'||!Array.isArray(value.indicators))throw Error();const indicators=validateEnvironment({schema:'rasad.environment-input/v1',indicators:value.indicators}).filter(r=>insidePolygon(r.coordinates[0],r.coordinates[1],polygon)&&(!from||r.endUTC>=from+'T00:00:00Z')&&(!to||r.startUTC<new Date(Date.parse(to+'T00:00:00Z')+86400000).toISOString()));return {...value,indicators,status:indicators.length?'IMPORTED_NOT_SCIENTIFICALLY_VALIDATED':'NO_MATCHING_INPUTS',concernIndex:null};}catch{return {status:'INVALID',indicators:[],concernIndex:null,reason:'Environmental manifest failed validation'};}
}
