import { t } from '../i18n/translate';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AtlasGlyph } from '../design/AtlasPrimitives';
import { useMotionPreference } from '../motion/useMotionPreference';
import { MODULES as modules } from '../state/mission';
export type Module = typeof modules[number];
export function Navigation({ active, onChange }: { active: Module; onChange: (value: Module) => void }) {
  const [open, setOpen] = useState(false);
  const navigation = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reduced = useMotionPreference();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!navigation.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    navigation.current?.querySelector<HTMLButtonElement>('.atlas-index-sheet button')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <nav ref={navigation} className="atlas-index-nav" aria-label={t("Mission modules")} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }}><button ref={trigger} className="atlas-index-trigger" aria-expanded={open} aria-controls="atlas-index-sheet" onClick={() => setOpen(value => !value)}><AtlasGlyph name={open ? 'close' : 'index'} size={18} /><span>{t("Index")}</span><small>{String(modules.length).padStart(2,'0')}</small></button><AnimatePresence>{t(open && <motion.div id="atlas-index-sheet" className="atlas-index-sheet" initial={{ opacity: 0, y: reduced ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }}><span className="atlas-overline">{t("FIREPULSE / MISSION INDEX")}</span>{t(modules.map((name, index) => <button key={name} aria-current={active === name ? 'page' : undefined} onClick={() => { onChange(name); setOpen(false); trigger.current?.focus(); }}><span>{t(String(index + 1).padStart(2, '0'))}</span><strong>{t(name === 'Intelligence Map' ? 'Mission Atlas' : name)}</strong><small>{t(name === 'Trust the Signal' ? 'METHOD' : name === 'Evidence Engine' ? 'GUIDED DEMO' : 'EXPLORE')}</small><AtlasGlyph name="arrow" size={15} /></button>))}<p>{t("Scientific context, without invented intelligence.")}</p></motion.div>)}</AnimatePresence></nav>;
}
export function ObservationDetails({ properties, coordinates }: { properties: Record<string, unknown>; coordinates?: number[] }) {
  return <dl className="metadata-grid">{t([
    ['Source', properties.source], ['Satellite', properties.satellite], ['Instrument', properties.instrument],
    ['Acquisition date', properties.date], ['Time · HHMM UTC', properties.time], ['Timestamp · UTC', properties.acquiredAt],
    ['Confidence · raw', properties.confidence], ['FRP · MW', properties.frp],
    ['Dataset', properties.datasetId], ['Product', properties.product], ['Processing', properties.processing], ['Collection', properties.collectionVersion ?? properties.version],
    ...(coordinates ? [['Position · lon, lat', coordinates.map(n => n.toFixed(5)).join(', ')]] : []),
  ].map(([label, value]) => <div key={String(label)}><dt>{t(String(label))}</dt><dd>{value == null ? t('Unavailable') : String(value)}</dd></div>))}</dl>;
}
