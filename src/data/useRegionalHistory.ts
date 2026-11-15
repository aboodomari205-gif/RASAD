import {useMission} from '../state/mission';
import{useEffect,useState}from'react';
import type{historicalSummary}from'../../shared/historySummary';
import type{ObservationCollection}from'../../shared/model';
type Summary=ReturnType<typeof historicalSummary>;
export function useRegionalHistory(collection:ObservationCollection){
 const {scope}=useMission();
 const base=typeof collection.metadata?.summaryPath==='string'?collection.metadata.summaryPath:null;
 const query=base?new URL(base,window.location.origin):null;
 for(const [key,value] of Object.entries({sensor:scope.sensor,processing:scope.processing,platform:scope.platform}))if(query&&value!==undefined)query.searchParams.set(key,String(value));
 const path=query?query.pathname+query.search:null;
 const [result,setResult]=useState<{path:string;data:Summary|null;error:boolean}|null>(null);
 useEffect(()=>{if(!path)return;const controller=new AbortController();Promise.all([path,path.replace(/([?&])summary=year\b/,'$1summary=month').replace(/summaries-year\.json$/,'summaries-month.json')].map(url=>fetch(url,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}))).then((parts:Summary[])=>{if(parts.some(data=>data.schema!=='firepulse.historical-summary/v1'||data.region!==collection.metadata?.mode))throw Error();const data={...parts[0],series:[...parts[0].series.filter(r=>r.period.length===4),...parts[1].series.filter(r=>r.period.length===7)]};if(!controller.signal.aborted)setResult({path,data,error:false});}).catch(()=>{if(!controller.signal.aborted)setResult({path,data:null,error:true});});return()=>controller.abort();},[path,collection.metadata?.mode]);
 return {path,current:result?.path===path?result:null};
}
