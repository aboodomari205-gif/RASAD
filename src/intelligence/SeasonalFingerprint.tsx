import {useMission} from '../state/mission';
import {useState} from 'react';
import {useRegionalHistory} from '../data/useRegionalHistory';
import type {ObservationCollection} from '../../shared/model';
import {t} from '../i18n/translate';
export default function SeasonalFingerprint({collection,onMonth}:{collection:ObservationCollection;onMonth?:(period:string)=>void}){
 const {scope}=useMission();const {current}=useRegionalHistory(collection);const [chosen,setChosen]=useState('');
 const sources=(collection.metadata?.datasets??[]).filter(d=>(!scope.processing||scope.processing===d.processing)&&(scope.sensor==='all'||scope.sensor===d.sensor)&&(!scope.platform||scope.platform===d.platform)&&d.processing==='standard'&&d.fieldSemantics?.historicalReference!=='blocked-lineage');
 const source=sources.find(d=>d.id===chosen)??sources[0];
 const rows=current?.data?.series.filter(r=>r.period.length===7&&r.datasetId===source?.id)??[];
 const peak=rows.reduce<typeof rows[number]|null>((best,row)=>!best||row.count>best.count?row:best,null);const annual=new Map<string,number>();for(const row of rows)annual.set(row.period.slice(0,4),(annual.get(row.period.slice(0,4))??0)+row.count);const peakYear=[...annual].sort((a,b)=>b[1]-a[1])[0];
 const years=[...new Set(rows.map(r=>r.period.slice(0,4)))].sort();const max=Math.max(1,...rows.map(r=>r.count));
 return <section aria-label={t('Source-specific seasonal fingerprint')}>
 <span className="atlas-overline">{t('FULL DELIVERED HISTORY / STANDARD SOURCE')}</span><h2>{t('Source-specific seasonal fingerprint')}</h2>
 <p>{t('Each cell is a positive delivered monthly count from one eligible Standard source. Missing months are unknown. This fingerprint is not a recurrence probability, a climate-normalized anomaly or calibrated cross-sensor activity.')}</p>
 {!current?<p role="status">{t('Reading source…')}</p>:current.error?<p role="alert">{t('Historical summaries unavailable.')}</p>:<>
 <label>{t('Source')}<select disabled={!sources.length} value={source?.id??''} onChange={e=>setChosen(e.target.value)}>{!sources.length&&<option value="">{t('No eligible Standard source')}</option>}{sources.map(d=><option key={d.id} value={d.id}>{d.sensor} / {d.platform} / {d.version}</option>)}</select></label>
 {peak&&<p>{t('Peak delivered month')}: {peak.period} / {peak.count.toLocaleString()} · {t('Peak delivered year')}: {peakYear?.[0]} / {peakYear?.[1].toLocaleString()}. {t('Delivered counts; incomplete sampling can affect peaks.')}</p>}
 {years.length<2?<p>{t('At least two observed years of the same eligible Standard source are required.')}</p>:<div className="lab-table-scroll"><table className="lab-table seasonal-fingerprint"><caption>{source?.sensor} / {source?.platform} / {source?.processing} · {t('Coverage unknown')}</caption><thead><tr><th>{t('Year')}</th>{Array.from({length:12},(_,m)=><th key={m}>{String(m+1).padStart(2,'0')}</th>)}</tr></thead><tbody>{years.map(year=><tr key={year}><th>{year}</th>{Array.from({length:12},(_,m)=>{const row=rows.find(r=>r.period===year+'-'+String(m+1).padStart(2,'0'));return <td key={m} style={{background:row?`rgb(123 202 209 / ${.08+.42*Math.sqrt(row.count/max)})`:undefined}}>{row?<button disabled={!onMonth} onClick={()=>onMonth?.(row.period)} title={row.period}>{row.count.toLocaleString()}</button>:t('Unknown')}</td>;})}</tr>)}</tbody></table></div>}
 </>}
 </section>;
}
