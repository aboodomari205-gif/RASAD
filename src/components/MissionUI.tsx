import RasadBrand from './RasadBrand';
import LanguageSwitch from '../i18n/LanguageSwitch';
import { t } from '../i18n/translate';
import { useEffect, useRef, useState } from 'react';
import { AtlasGlyph } from '../design/AtlasPrimitives';
import { NAVIGATION as modules, sectionName } from '../state/mission';
export type Module = typeof import('../state/mission').MODULES[number];
export function Navigation({ active, onChange }: { active: Module; onChange: (value: Module) => void }) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const navigation = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { const media=window.matchMedia('(max-width: 900px)');const change=()=>{setMobile(media.matches);setOpen(false);};media.addEventListener('change',change);return()=>media.removeEventListener('change',change); },[]);
  useEffect(() => {
    if(!open||!mobile)return;
    navigation.current?.querySelector<HTMLButtonElement>('.rasad-nav-links button')?.focus();
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}};
    document.addEventListener('keydown',escape,true);return()=>document.removeEventListener('keydown',escape,true);
  },[open,mobile]);
  function close(){setOpen(false);trigger.current?.focus();}
  const icons=['layers','time','signal','ledger'] as const;
  const descriptions=['Observe, harmonize, compare','Discover historical seasons','Experimental FRP, not calibration','Methods, provenance and downloads'];
  return <>
    <header className="rasad-mobile-header"><span className="rasad-mobile-wordmark"><img src="/brand/rasad-source.jpeg" alt={t('Supplied RASAD logo')}/><b>RASAD <span lang="ar">رصد</span><small className="rasad-mobile-section">{t(sectionName(active))}</small></b></span><LanguageSwitch/><button ref={trigger} className="rasad-mobile-toggle" aria-label={t('Open navigation')} aria-expanded={open} aria-controls="rasad-sidebar" onClick={()=>setOpen(v=>!v)}><AtlasGlyph name="index" size={20}/><span>{t('Menu')}</span></button></header>
    {open&&mobile&&<button className="rasad-nav-backdrop" aria-label={t('Close navigation')} onClick={close}/>}
    <aside id="rasad-sidebar" ref={navigation} className="rasad-sidebar" data-open={open} inert={mobile&&!open} aria-hidden={mobile&&!open?true:undefined} role={mobile&&open?'dialog':undefined} aria-modal={mobile&&open?true:undefined} aria-label={t('RASAD workspace')} onKeyDown={e=>{if(e.key==='Escape')close();if(e.key==='Tab'&&open&&mobile){const buttons=[...navigation.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(b=>b.offsetParent!==null);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
      <div className="rasad-sidebar-brand"><RasadBrand/><button className="rasad-drawer-close" aria-label={t('Close navigation')} onClick={close}><AtlasGlyph name="close"/></button></div>
      <div className="rasad-nav-caption">{t('OBSERVATION WORKSPACE')}</div>
      <nav className="rasad-nav-links" aria-label={t('Primary navigation')}>{modules.map(({name,module},index)=><button key={module} data-module={module} aria-current={sectionName(active)===name?'page':undefined} onClick={()=>{onChange(module);if(mobile)close();}}><span className="rasad-nav-icon"><AtlasGlyph name={icons[index]} size={21}/></span><span><strong>{t(name)}</strong><small>{t(descriptions[index])}</small></span><span className="rasad-nav-marker" aria-hidden="true"/></button>)}</nav>
      <div className="rasad-sidebar-evidence"><span className="rasad-status-dot"/><strong>NASA FIRMS</strong><p>{t('Brazil')} · MODIS / VIIRS</p><small>{t('Source-aware observations. Calibration not validated.')}</small></div>
      <footer className="rasad-sidebar-footer"><LanguageSwitch/><span>{t('Earth Observation & Burning Activity Intelligence')}</span></footer>
    </aside>
  </>;
}
export function ObservationDetails({ properties, coordinates }: { properties: Record<string, unknown>; coordinates?: number[] }) {
  return <dl className="metadata-grid">{t([
    ['Source', properties.source], ['Satellite', properties.satellite], ['Instrument', properties.instrument],
    ['Acquisition date', properties.date], ['Time Â· HHMM UTC', properties.time], ['Timestamp Â· UTC', properties.acquiredAt],
    ['Confidence Â· raw', properties.confidence], ['FRP Â· MW', properties.frp],
    ['Original source version',properties.source_version],['Source file',properties.source_file],['ZIP member',properties.source_member],['Source SHA-256',properties.source_sha256],['Import generation',properties.import_generation],['Original brightness',JSON.stringify(properties.brightness_original??{})],['Day / night',properties.daynight],['Scan / track',String(properties.scan??'')+' / '+String(properties.track??'')],['Dataset', properties.datasetId], ['Product', properties.product], ['Processing', properties.processing], ['Collection', properties.collectionVersion ?? properties.version],
    ...(coordinates ? [['Position Â· lon, lat', coordinates.map(n => n.toFixed(5)).join(', ')]] : []),
  ].map(([label, value]) => <div key={String(label)}><dt>{t(String(label))}</dt><dd>{value == null ? t('Unavailable') : String(value)}</dd></div>))}</dl>;
}
