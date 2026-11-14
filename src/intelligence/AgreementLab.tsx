import { RobustnessView } from './ResearchEvidence';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { Availability, Observation } from '../../shared/model';
import type { MatchOptions } from '../../shared/evidence';
import { coverageGate, sensitivitySeries } from '../../shared/agreement';
import { t } from '../i18n/translate';
import './agreement.css';
export default function AgreementLab({records,availability,onThreshold,current,trace}:{records:Observation[];availability:Availability;onThreshold:(options:MatchOptions)=>void;current:MatchOptions;trace:(id:string)=>ReactNode}) {
  const analysis=useMemo(()=>{try{return {series:sensitivitySeries(records),gate:coverageGate(records,availability),error:false};}catch{return {series:[],gate:[],error:true};}},[records,availability]);
  const max=Math.max(1,...analysis.series.flatMap(s=>[s.pairs,s.observations,s.groups]));
  return <section className="agreement-lab" id="agreement-lab" tabIndex={-1}>
    <span className="atlas-overline">{t('SENSOR AGREEMENT LAB')}</span><h3>{t('One landscape. Different samples.')}</h3>
    <p>{t('Select a setting to inspect its actual candidate graph below. Bar lengths share a count scale, not a fire-intensity scale.')}</p>
    {analysis.error?<p role="alert">{t('Narrow the observation scope before sensitivity analysis.')}</p>:<>
    <div className="agreement-legend"><span>{t('Candidate pairs')}</span><span>{t('Unique participating observations')}</span><span>{t('Connected association groups')}</span></div>
    <div className="agreement-chart" aria-label={t('Threshold sensitivity comparison')}>{analysis.series.map(s=><button key={`${s.distanceKm}/${s.minutes}`} data-setting={`${s.distanceKm}/${s.minutes}`} aria-pressed={s.distanceKm===current.distanceKm&&s.minutes===current.minutes} onClick={()=>onThreshold(s)}><strong dir="ltr">{s.distanceKm} km / {s.minutes} min</strong>{[s.pairs,s.observations,s.groups].map((value,i)=><span className="agreement-bar" key={i}><i style={{width:`${value/max*100}%`}}/><span>{t(['Candidate pairs','Unique participating observations','Connected association groups'][i])}: <b>{value}</b></span></span>)}</button>)}</div>
    <p>{t('Exploratory defaults: 1 km / 60 min. Not a validated calibration.')}</p>
    <RobustnessView records={records} trace={trace} />
    <section id="coverage-gate" tabIndex={-1} className="coverage-gate" aria-label={t('Data sufficiency / coverage gate')}><h3>{t('Data sufficiency / coverage gate')}</h3>{analysis.gate.map(g=><article key={g.id} data-gate={g.id} data-verdict={g.status}><span>{t(g.status)}</span><div><h4>{t(g.claim)}</h4><p>{t(g.reason)}</p></div></article>)}</section>
    </>}
  </section>;
}
