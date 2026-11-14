import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n/translate';
import type { Observation } from '../../shared/model';
const steps=[
  ['The problem','Two sensors sample thermal activity differently. Counts and confidence scales are not interchangeable.'],
  ['Real Ajloun observations','Original source observations retain their actual platform and processing stage. The selected UTC window is bounded; coverage remains unknown. Return through Evidence Engine after inspecting a source.'],
  ['Harmonization','Inspect candidate edges and their distance / UTC deltas. Connected groups are not confirmed events.'],
  ['Sensitivity','Select a threshold setting in the chart. Compare pairs, participating observations and groups.'],
  ['Evidence verdict','Read the coverage gate: descriptive evidence does not establish validated anomalies.'],
  ['Transparent scientific brief','Export the current scope, thresholds, source observations and limitations.'],
];
export default function JudgeGuide({records,onInspect,onExport,onResearch,onStart,exportDisabled}:{records:Observation[];onInspect:(o:Observation)=>void;onExport:()=>void;onResearch:()=>void;onStart:()=>void;exportDisabled:boolean}) {
  const [step,setStep]=useState(()=>{try{const n=Number(sessionStorage.getItem('firepulse.guide.step')??-1);return Number.isInteger(n)&&n>=0&&n<6?n:-1;}catch{return -1;}});
  const heading=useRef<HTMLHeadingElement>(null);
  const start=()=>{try{sessionStorage.setItem('firepulse.guide.step','0');}catch{/* Optional. */}setStep(0);onStart();};
  useEffect(()=>{try{sessionStorage.setItem('firepulse.guide.step',String(step));}catch{/* Optional session persistence. */}if(step>=0)heading.current?.focus({preventScroll:true});},[step]);
  const jump=(id:string)=>{const target=document.getElementById(id);if(target instanceof HTMLDetailsElement)target.open=true;target?.scrollIntoView({block:'start'});target?.focus({preventScroll:true});};
  return <aside className="judge-guide" aria-label={t('Guided demonstration')}>
    {step<0?<><span className="atlas-overline">{t('90-SECOND FIELD GUIDE')}</span><button id="start-judge-guide" onClick={start}>{t('Start guided demonstration')}</button><p>{t('Starting the guide opens a delivered Ajloun comparison year with candidate associations. This is an example, not a baseline.')}</p></>:<>
      <div className="guide-progress" aria-hidden="true">{steps.map((_,i)=><span key={i} data-active={i<=step}/>)}</div>
      <motion.div key={step} initial={{opacity:.5}} animate={{opacity:1}}><span className="atlas-overline">{step+1} / 6 · {t('Self-paced • approximately 90 seconds')}</span><h3 ref={heading} tabIndex={-1}>{t(steps[step][0])}</h3><p>{t(steps[step][1])}</p></motion.div>
      <div className="guide-action">
        {step===0&&<p>MODIS · {t('1 km')} / VIIRS · {t('375 m')} — {t('nominal detection pixel')}</p>}
        {step===1&&<><p>{t('Current scope')}: {records.filter(o=>o.sensor==='MODIS').length} MODIS / {records.filter(o=>o.sensor==='VIIRS').length} VIIRS</p><button disabled={!records.length} onClick={()=>onInspect(records.find(o=>o.sensor==='MODIS')??records[0])}>{t('Inspect source in Atlas')}</button></>}
        {step===2&&<button onClick={()=>jump('candidate-evidence')}>{t('Inspect candidate associations')}</button>}
        {step===3&&<><button onClick={()=>jump('agreement-lab')}>{t('Explore threshold settings')}</button><button onClick={()=>jump('robustness-view')}>{t('Inspect matching robustness')}</button></>}
        {step===4&&<button onClick={()=>jump('coverage-gate')}>{t('Read evidence verdict')}</button>}
        {step===5&&<><button disabled={exportDisabled} onClick={onExport}>{t('Export scientific comparison JSON')}</button><button disabled={exportDisabled} onClick={onResearch}>{t('Export reproducible research brief')}</button></>}
      </div>
      <nav aria-label={t('Guide controls')}><button disabled={step===0} onClick={()=>setStep(step-1)}>{t('Back')}</button><button disabled={step===5} onClick={()=>{try{sessionStorage.setItem('firepulse.guide.step',String(step+1));}catch{/* Optional. */}setStep(step+1);if(step===1)onStart();}}>{t('Next')}</button><button onClick={start}>{t('Restart')}</button><button onClick={()=>{setStep(-1);requestAnimationFrame(()=>document.getElementById('start-judge-guide')?.focus());}}>{t('Exit guide')}</button></nav>
    </>}
  </aside>;
}
