import {useRef} from 'react';
import {ACTIVE_REGIONS,regionName} from '../../shared/regions';
import type {RegionId} from '../../shared/model';
import {t} from '../i18n/translate';
import './regionExplorer.css';
export type CameraDestination='earth'|'brazil';
export default function RegionExplorer({region,onRegion,onCamera,loaded}:{region:RegionId;onRegion:(region:RegionId)=>void;onCamera:(destination:CameraDestination)=>void;loaded:boolean}){
 const panel=useRef<HTMLDetailsElement>(null);const close=()=>{if(panel.current)panel.current.open=false;};
 return <details ref={panel} className="atlas-region region-explorer" onKeyDown={e=>{if(e.key==='Escape')close();}}>
 <summary><span className="atlas-overline">{t('STUDY AREA / BRAZIL')}</span><strong>{t(regionName(region))} &#9662;</strong></summary>
 <section className="region-explorer-panel" aria-label={t('Region explorer')}>
 <header className="region-explorer-header"><h2>{t('Choose your study area')}</h2><button className="region-explorer-close" onClick={close} aria-label={t('Close exploration panel')}>&times;</button></header>
 <div className="region-explorer-content"><label>{t('Observation region')}<select aria-label={t('Observation region')} value={region} onChange={e=>{onRegion(e.target.value as RegionId);close();}}>{ACTIVE_REGIONS.map(r=><option key={r.id} value={r.id}>{t(r.name)}</option>)}</select></label>
 <p>{t(loaded?'Delivered thermal observations. Coverage remains unknown.':'No observations loaded. Missing data is not zero activity.')}</p>
 <p>{t('Natural Earth 5.1.2 / 1:110m / public domain. Generalized country boundaries; coastal and border membership is approximate.')}</p>
 <div className="region-camera-options"><button onClick={()=>{onCamera('earth');close();}}>{t('Global Earth / camera only')}</button><button onClick={()=>{onRegion('brazil');onCamera('brazil');close();}}>{t('Brazil')}</button></div>
 </div></section></details>;
}
