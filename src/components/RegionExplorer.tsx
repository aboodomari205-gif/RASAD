import { useRef } from 'react';
import type { RegionId } from '../../shared/model';
import { t } from '../i18n/translate';
import './regionExplorer.css';
export type CameraDestination='earth'|'north-jordan'|'ajloun';
export default function RegionExplorer({region,onRegion,onCamera,loaded}:{region:RegionId;onRegion:(region:RegionId)=>void;onCamera:(destination:CameraDestination)=>void;loaded:boolean}){
 const panel=useRef<HTMLDetailsElement>(null);
 const close=()=>{if(panel.current){panel.current.open=false;panel.current.querySelector('summary')?.focus();}};
 return <details ref={panel} className="atlas-region region-explorer" onKeyDown={e=>{if(e.key==='Escape'){close();e.stopPropagation();}}}>
  <summary><span className="atlas-overline">{t('REGION EXPLORER')}</span><strong>{t(region==='ajloun'?'Ajloun, Jordan · Pilot':'Northern Jordan')} <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"><path d="m2 4 4 4 4-4"/></svg></strong></summary>
  <section className="region-explorer-panel" aria-label={t('Region explorer')}>
   <header className="region-explorer-header"><div><span className="atlas-overline">{t('EARTH / CONTEXT / EVIDENCE')}</span><h2>{t('Explore the planet. Read the scope.')}</h2></div><button type="button" className="region-explorer-close" aria-label={t('Close exploration panel')} onClick={close}>&times;</button></header>
   <div className="region-explorer-content" tabIndex={0} aria-label={t('Exploration options')}>
   <p>{t('Camera navigation does not change data coverage.')}</p>
   <div className="region-camera-options">{(['earth','north-jordan','ajloun'] as const).map((destination,i)=><button key={destination} onClick={()=>{onCamera(destination);close();}}><small>0{i+1}</small><strong>{t(destination==='earth'?'Global Earth':destination==='north-jordan'?'North Jordan':'Ajloun pilot')}</strong><span>{t(destination==='ajloun'?'Pilot boundary':'Camera exploration only')}</span></button>)}</div>
   <label>{t('Observation region')}<select aria-label={t('Observation region')} value={region} onChange={e=>{onRegion(e.target.value as RegionId);close();}}><option value="ajloun">{t('Ajloun, Jordan · Pilot')}</option><option value="northern-jordan">{t('Northern Jordan')}</option></select></label>
   {region==='northern-jordan'&&<p>{t('Irbid, Ajloun, Jerash and Mafraq. Exact governorate union; acquisition coverage remains unknown.')}</p>}
   <p className="region-coverage">{t(region==='northern-jordan'?(loaded?'Northern Jordan archive observations.':'No observations loaded in this window; coverage is unknown.'):loaded?'Ajloun archive loaded. Global observations are not connected.':'Ajloun archive unavailable. Global observations are not connected.')}</p>
   </div>
  </section>
 </details>;
}

