import fs from 'node:fs/promises';
import {build} from 'vite';
import {loadRegionCollection} from '../../server/dataCatalog.js';
const pointerText=await fs.readFile('server/data/active-history.json','utf8');
const active=JSON.parse(pointerText);if(!/^historical-activation-[a-f0-9]+\.json$/.test(active.reportFile))throw Error('Unsafe activation report pointer');
const activationReport=JSON.parse(await fs.readFile('server/data/'+active.reportFile,'utf8'));
const outDir=process.argv[2]??'releases/cloudflare-static-v4-final';
if(process.argv[2] && !/^\.checkpoints\/[a-zA-Z0-9_-]+$/.test(outDir))throw new Error('Test output must be a direct .checkpoints subdirectory');
let replaced=false;
await build({build:{outDir,emptyOutDir:false},plugins:[{name:'archive-static-deployment',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/data/observations.ts')){const before='`/api/observations?mode=${encodeURIComponent(region)}`';if(!code.includes(before))throw new Error('Observation transport changed; review static packaging.');replaced=true;return code.replace(before,'`/archive-data/${encodeURIComponent(region)}.json?static=1`');}}}]});
if(!replaced)throw new Error('Static transport was not compiled');
await fs.mkdir(outDir+'/archive-data',{recursive:true});
for(const region of ['ajloun','northern-jordan']){
 const collection=loadRegionCollection(region,process.argv.includes('--baseline')?{baseline:true}:{});collection.metadata.deployment={mode:'immutable-static-archive',live:false,builtAt:new Date().toISOString()};
 if(collection.metadata.datasets.some(d=>d.deliveryProfile)){
 const dates=collection.features.map(f=>String(f.properties.date)).sort(),years=[...new Set(dates.map(d=>d.slice(0,4)))].sort();
 const summary=new Map();for(const f of collection.features){const p=f.properties;for(const period of [String(p.date),String(p.date).slice(0,7),String(p.date).slice(0,4)]){const key=JSON.stringify([p.datasetId,p.satellite,p.version,period]);const row=summary.get(key)??{datasetId:p.datasetId,platform:p.satellite,version:p.version,period,count:0,frpSum:null,frpReported:0,coverage:'unknown'};row.count++;if(p.frp!==null){row.frpSum=(row.frpSum??0)+p.frp;row.frpReported++;}summary.set(key,row);}}
 collection.metadata={...collection.metadata,historical:true,defaultYear:Number(years.at(-1)),availableYears:years,observedExtent:[dates[0],dates.at(-1)],totalDelivered:collection.features.length,yearCounts:Object.fromEntries(years.map(y=>[y,collection.features.filter(f=>String(f.properties.date).startsWith(y)).length])),exampleYears:Object.fromEntries(Object.entries(activationReport.regions).map(([r,v])=>[r,v.exampleYear])),summaryPath:`/archive-data/${region}/summaries-year.json`,yearPaths:Object.fromEntries(years.map(y=>[y,`/archive-data/${region}/${y}.json`]))};
 await fs.mkdir(outDir+'/archive-data/'+region,{recursive:true});
 for(const year of years)await fs.writeFile(`${outDir}/archive-data/${region}/${year}.json`,JSON.stringify({...collection,metadata:{...collection.metadata,windowYear:Number(year)},features:collection.features.filter(f=>String(f.properties.date).startsWith(year))}));
 await fs.writeFile(`${outDir}/archive-data/${region}/summaries.json`,await fs.readFile('server/data/'+JSON.parse(await fs.readFile('server/data/active-history.json','utf8')).summaryPrefix+region+'.json','utf8'));
 const fullSummary=JSON.parse(await fs.readFile('server/data/'+JSON.parse(await fs.readFile('server/data/active-history.json','utf8')).summaryPrefix+region+'.json','utf8'));for(const [period,length]of [['year',4],['month',7],['day',10]])await fs.writeFile(`${outDir}/archive-data/${region}/summaries-${period}.json`,JSON.stringify({...fullSummary,series:fullSummary.series.filter(row=>row.period.length===length)}));
 collection.features=[];
 }
 await fs.writeFile(outDir+'/archive-data/'+region+'.json',JSON.stringify(collection));console.log(region,collection.metadata.totalDelivered??collection.features.length);
}
if(await fs.readFile('server/data/active-history.json','utf8')!==pointerText)throw Error('Activation changed during build; discard mixed output and rebuild.');
console.log('Static upload: no Pages Functions, Worker runtime or API server required.');
