import './ScientificContext.css';
import {useMemo} from 'react';
import type {Dataset,Observation,RegionId} from '../../shared/model';
import {scientificHarmonization} from '../../shared/scientificEngine';
import {DEFAULT_MATCH,type MatchOptions} from '../../shared/evidence';
import {t} from '../i18n/translate';
export default function ScientificContext({records,datasets,region,thresholds=DEFAULT_MATCH}:{records:Observation[];datasets:Dataset[];region:RegionId;thresholds?:MatchOptions}){
 const {distanceKm,minutes}=thresholds;
 const result=useMemo(()=>{try{return {data:scientificHarmonization(records,datasets,region,{distanceKm,minutes}),error:false};}catch{return {data:null,error:true};}},[records,datasets,region,distanceKm,minutes]);
 const data=result.data;
 const download=()=>{if(!data)return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='rasad-scientific-harmonization.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <details className="research-section scientific-context"><summary>{t('Scientific harmonization / scoped evidence')}</summary>{!data?<p role="alert">{t('Narrow the observation scope before scientific analysis.')}</p>:<>
 <p>{t('Delivered observations are harmonized by UTC, geography and provenance. Detection opportunity, calibrated equivalent counts, exposure-normalized historical median and validated anomalies remain unavailable.')}</p>
 <p><bdi>{data.uniqueDelivered}</bdi> {t('Delivered detections')} / <bdi>{data.strata.length}</bdi> {t('Source strata')} / <bdi>{thresholds.distanceKm} km / {thresholds.minutes} min</bdi></p>
 <button className="atlas-text-button" onClick={download}>{t('Export scoped harmonization JSON')}</button>
 {datasets.some(d=>d.deliveryProfile==='N20'||d.deliveryProfile==='N21')&&<p>{t('NOAA-20/21 archive processing is source-declared. Upstream lineage and early-date documentation differences require supplier clarification; original records are preserved.')}</p>}
 <h3>{t('First delivered dates in this scope, not satellite introduction years')}</h3><div className="lab-table-scroll" tabIndex={0}><table className="lab-table"><thead><tr><th>{t('Source')}</th><th>{t('Delivered detections')}</th><th>{t('UTC period')}</th></tr></thead><tbody>{data.strata.map(s=><tr key={s.key}><th>{s.sensor} / {s.platform} / {s.processing}<small>{s.datasetId} / {s.version}</small></th><td>{s.count}</td><td><bdi>{s.firstDelivered} / {s.lastDelivered}</bdi></td></tr>)}</tbody></table></div>
 <h3>{t('Matched detection-extent windows / descriptive only')}</h3><p>{t('These windows intersect delivered detection dates, not verified overpass coverage. Same-day contributions do not prove simultaneity or a shared event. Source and processing changes are retained.')}</p>
 <div className="lab-table-scroll" tabIndex={0}><table className="lab-table"><thead><tr><th>{t('Source')}</th><th>{t('UTC period')}</th><th>MODIS / VIIRS</th></tr></thead><tbody>{data.detectionExtentOverlap.comparisons.map(c=><tr key={c.modisStratum+c.viirsStratum}><th>{data.strata.find(s=>s.key===c.modisStratum)?.platform} / {data.strata.find(s=>s.key===c.viirsStratum)?.platform}<small>{data.strata.find(s=>s.key===c.modisStratum)?.processing}</small></th><td>{c.window?<bdi>{c.window.from} / {c.window.to}</bdi>:t('Unavailable')}</td><td>{c.status==='descriptive'?`${c.modisIds.length} / ${c.viirsIds.length}`:t('Unknown')}</td></tr>)}</tbody></table></div>
 <h3>{t('UTC seasonal contributions / source separated')}</h3><p>{t('DJF assigns December to the following year. Seasonal counts describe delivered records, not severity, recurrence or coverage-normalized activity.')}</p><div className="lab-table-scroll" tabIndex={0}><table className="lab-table"><thead><tr><th>{t('Source')}</th><th>{t('UTC period')}</th><th>{t('Delivered detections')}</th></tr></thead><tbody>{data.seasonal.map(s=><tr key={s.stratum+s.period}><th>{data.strata.find(g=>g.key===s.stratum)?.sensor} / {data.strata.find(g=>g.key===s.stratum)?.platform}<small>{data.strata.find(g=>g.key===s.stratum)?.processing} / {data.strata.find(g=>g.key===s.stratum)?.version}</small></th><td><bdi>{s.period}</bdi><small><bdi>{s.firstDelivered} / {s.lastDelivered}</bdi></small></td><td>{s.count}</td></tr>)}</tbody></table></div>
 <p>{t('Required for stronger conclusions: platform-specific acquisition, cloud and valid-pixel masks, comparable sampling and independent calibration. No coefficients or missing zero days are invented.')}</p>
 </>}</details>;
}
