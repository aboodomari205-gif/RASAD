import {useEffect,useState} from 'react';
import {aggregatePeriods} from '../../shared/observations';
import type {Dataset,ObservationFilter} from '../../shared/model';
type Series=ReturnType<typeof aggregatePeriods>;
type Row={datasetId:string;period:string;count:number;frpSum:number|null;frpReported:number};
export function useScopedSeries(filter:ObservationFilter,datasets:Dataset[],enabled:boolean){
 const key=JSON.stringify(filter);const [value,setValue]=useState<{key:string;monthly:Series;yearly:Series;error:boolean}|null>(null);
 useEffect(()=>{if(!enabled)return;const controller=new AbortController();const q=new URLSearchParams({mode:filter.region??'brazil'});
 for(const[k,v]of Object.entries({from:filter.startDate,to:filter.endDate,sensor:filter.sensor,processing:filter.processing,platform:filter.platform,confidence:filter.confidenceRaw,frpMin:filter.frpMin,frpMax:filter.frpMax,daynight:filter.dayNight}))if(v!==undefined)q.set(k,String(v));
 Promise.all(['month','year'].map(period=>fetch('/api/observations?'+q+'&summary='+period,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}))).then(parts=>{
  const adapt=(rows:Row[],period:'month'|'year'):Series=>{
   const dates=rows.map(r=>r.period).sort();const from=filter.startDate??(dates[0]?.slice(0,4)+'-01-01'),to=filter.endDate??(dates.at(-1)?.slice(0,4)+'-12-31');
   if(!rows.length)return [];
   return aggregatePeriods([],{period,datasets,filter:{...filter,startDate:from,endDate:to}}).map(source=>({...source,periods:source.periods.map(p=>{const row=rows.find(r=>r.datasetId===source.datasetId&&r.period===p.period);return row?{...p,count:row.count,frpSum:row.frpSum,frpReported:row.frpReported,frpComplete:row.frpReported===row.count,status:'observed' as const}:p;})}));
  };
  if(!controller.signal.aborted)setValue({key,monthly:adapt(parts[0].series,'month'),yearly:adapt(parts[1].series,'year'),error:false});
 }).catch(()=>{if(!controller.signal.aborted)setValue({key,monthly:[],yearly:[],error:true});});return()=>controller.abort();
 },[key,enabled,datasets]);
 return value?.key===key?value:null;
}
