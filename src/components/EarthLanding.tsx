import LanguageSwitch from '../i18n/LanguageSwitch';
import { t } from '../i18n/translate';
import { useMotionPreference } from '../motion/useMotionPreference';
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import type { EarthInteraction } from './EarthScene';
import './EarthLanding.css';
const EarthScene = lazy(() => import('./EarthScene'));
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function EarthLanding({ allowWebGL, onEnter }: { allowWebGL: boolean; onEnter: () => void }) {
  const reduced = useMotionPreference();
  const [assetStatus, setAssetStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stillFailed, setStillFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [entering, setEntering] = useState(false);
  const interaction = useRef<EarthInteraction>({ yaw: 0, tilt: 0, dragging: false, paused: false, invalidate: () => {} });
  const enterButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { enterButton.current?.focus({ preventScroll: true }); }, []);
  const drag = useRef({ x: 0, y: 0 });
  const finished = useRef(false);
  const sceneActive = allowWebGL && !reduced && assetStatus !== 'error';
  const setInvalidate = useCallback((invalidate: () => void) => { interaction.current.invalidate = invalidate; }, []);
  const ready = useCallback(() => setAssetStatus('ready'), []);
  const fail = useCallback(() => setAssetStatus('error'), []);
  const finish = useCallback(() => { if (finished.current) return; finished.current = true; onEnter(); }, [onEnter]);
  const enter = () => { if (entering) return; if (!sceneActive || assetStatus !== 'ready') finish(); else { setEntering(true); interaction.current.invalidate(); } };
  // A lost renderer or a changed motion preference must never trap the CTA journey.
  useEffect(() => {
    if (!entering) return;
    if (reduced || assetStatus === 'error') { finish(); return; }
    const timeout = window.setTimeout(finish, 2300);
    return () => clearTimeout(timeout);
  }, [entering, reduced, assetStatus, finish]);
  return <motion.section className={`earth-landing ${entering ? 'is-entering' : ''}`} aria-label={t("FIREPULSE Earth Alive")} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .35 }}>
    <div className="earth-layout">
    <div className="earth-art" aria-hidden="true">
      {t(!stillFailed ? <img className={`earth-still ${sceneActive && assetStatus === 'ready' ? 'is-obscured' : ''}`} src="/earth/blue-marble-east.jpg" alt="" onError={() => setStillFailed(true)} /> : <div className="earth-unavailable">{t("Earth imagery unavailable")}</div>)}
      {t(sceneActive && <SceneBoundary onError={fail}><Suspense fallback={null}><EarthScene interaction={interaction} entering={entering} onReady={ready} onComplete={finish} onLost={fail} onInvalidate={setInvalidate} /></Suspense></SceneBoundary>)}
    </div>
    <header className="earth-header"><LanguageSwitch /><a className="earth-wordmark" href="#earth-title" aria-label={t("FIREPULSE Earth Alive")}>{t("FIRE")}<span>{t("PULSE")}</span><small>{t("EARTH ALIVE")}</small></a><span className="earth-edition">{t("AN EARTH OBSERVATION EXPERIENCE")}<br />{t("NASA SPACE APPS / RESEARCH PROTOTYPE")}</span></header>
    <div className="earth-gesture" tabIndex={entering ? -1 : 0} role="region" aria-label={t("Interactive Earth. Drag horizontally to rotate. Arrow keys rotate and tilt.")} onPointerDown={event => { interaction.current.dragging = true; drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (!interaction.current.dragging) return; interaction.current.yaw += (event.clientX - drag.current.x) * .005; interaction.current.tilt = Math.max(-.45, Math.min(.45, interaction.current.tilt + (event.clientY - drag.current.y) * .002)); drag.current = { x: event.clientX, y: event.clientY }; interaction.current.invalidate(); }} onPointerUp={() => { interaction.current.dragging = false; }} onPointerCancel={() => { interaction.current.dragging = false; }} onKeyDown={event => { if (!event.key.startsWith('Arrow')) return; event.preventDefault(); if (event.key === 'ArrowLeft') interaction.current.yaw -= .16; if (event.key === 'ArrowRight') interaction.current.yaw += .16; if (event.key === 'ArrowUp') interaction.current.tilt = Math.max(-.45, interaction.current.tilt - .08); if (event.key === 'ArrowDown') interaction.current.tilt = Math.min(.45, interaction.current.tilt + .08); interaction.current.invalidate(); }} />
    <motion.div className="earth-editorial" animate={entering ? { opacity: 0, y: reduced ? 0 : -25 } : { opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .55 }}>
      <motion.p className="earth-kicker" initial={{ opacity: 0, x: reduced ? 0 : -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduced ? 0 : .8 }}>{t("ONE PLANET. COUNTLESS SIGNALS.")}</motion.p>
      <h1 id="earth-title">{t(['A living Earth.', 'A closer look.'].map((line, index) => <span className="earth-title-line" key={line}><motion.span initial={{ y: reduced ? 0 : '105%' }} animate={{ y: 0 }} transition={{ duration: reduced ? 0 : .95, delay: reduced ? 0 : .15 + index * .14, ease: [.16, 1, .3, 1] }}>{t(line)}</motion.span></span>))}</h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : .65, duration: .65 }}><p className="earth-description">{t("MODIS and VIIRS see thermal activity differently. FIREPULSE aligns their delivered observations on one UTC calendar, preserving each source and its uncertainty.")}</p><motion.button ref={enterButton} className="earth-enter" onClick={enter} disabled={entering} whileHover={{ x: reduced ? 0 : 4 }} whileTap={{ scale: reduced ? 1 : .98 }}>{t("Enter mission ")}<span aria-hidden="true">↗</span></motion.button><p className="earth-destination"><i /> {t(allowWebGL ? "BEGIN IN AJLOUN, JORDAN" : "RETURN TO YOUR ACTIVE MISSION")} <span>{t(allowWebGL ? "PILOT REGION" : "REGION PRESERVED")}</span></p></motion.div>
    </motion.div>
    <div className="earth-scene-caption"><span className="earth-caption-line" /><span>{t("BLUE MARBLE / EARTH STUDY")}</span><p>{t(sceneActive && assetStatus === 'ready' ? 'Drag to explore · Arrow keys to rotate' : 'Static Earth composition')}<br />{t("Historical composite imagery, not live observations")}</p>{t(sceneActive && assetStatus === "ready" && <button className="earth-pause" aria-pressed={paused} onClick={() => { interaction.current.paused = !paused; setPaused(!paused); interaction.current.invalidate(); }}>{t(paused ? "Resume rotation" : "Pause rotation")}</button>)}</div>
    <footer className="earth-footer"><p>{t("OBSERVE THE SIGNAL.")}<br /><span>{t("QUESTION THE CERTAINTY.")}</span></p><div className="earth-asset-state" role="status">{t(sceneActive && assetStatus === 'loading' ? 'Loading NASA Earth texture… You can enter directly.' : assetStatus === 'error' ? 'Interactive Earth unavailable. Static composition shown; mission access is available.' : reduced ? 'Reduced motion · Still Earth view' : !allowWebGL ? 'Still Earth view · Your mission remains active' : 'NASA Blue Marble · Illustrative lighting')}</div><a href="https://svs.gsfc.nasa.gov/2915/" target="_blank" rel="noreferrer">{t("EARTH IMAGERY: NASA / GSFC / SVS ↗")}</a></footer>
    </div>
  </motion.section>;
}
