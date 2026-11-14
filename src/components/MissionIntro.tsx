import { t } from '../i18n/translate';
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export default function MissionIntro({ onFinish }: { onFinish: (enter: boolean) => void }) {
  const reduced = useReducedMotion();
  const finish = useRef(onFinish);
  useEffect(() => { finish.current = onFinish; }, [onFinish]);
  useEffect(() => {
    const timeout = window.setTimeout(() => finish.current(false), reduced ? 0 : 2200);
    return () => clearTimeout(timeout);
  }, [reduced]);
  return <motion.section className="mission-intro" aria-label={t("Optional FIREPULSE introduction")} initial={{ opacity: 1 }} exit={{ opacity: 0, scale: reduced ? 1 : 1.035 }} transition={{ duration: reduced ? 0 : .28 }} onKeyDown={event => { if (event.key === 'Escape') onFinish(false); }}>
    <button className="intro-skip" onClick={() => onFinish(false)}>{t("Skip intro ↗")}</button>
    <div className="intro-atmosphere" aria-hidden="true"><svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="orbital-light"><stop stopColor="#45D6C5" stopOpacity=".18" /><stop offset="1" stopColor="#080D17" stopOpacity="0" /></radialGradient><linearGradient id="limb"><stop stopColor="#45D6C5" stopOpacity="0" /><stop offset=".5" stopColor="#91ebdf" /><stop offset="1" stopColor="#FF7043" stopOpacity=".1" /></linearGradient></defs>
      <motion.circle cx="500" cy="610" r="440" fill="url(#orbital-light)" initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} transition={{ duration: 2 }} />
      <motion.ellipse cx="500" cy="625" rx="650" ry="370" fill="#0b1725" stroke="url(#limb)" strokeWidth="2" initial={{ y: 85 }} animate={{ y: 0 }} transition={{ duration: 1.9, ease: [.16, 1, .3, 1] }} />
      {t([0, 1, 2].map(index => <motion.ellipse key={index} cx="500" cy="550" rx={390 + index * 75} ry={125 + index * 40} fill="none" stroke={index === 1 ? '#ff7043' : '#65839c'} strokeOpacity={.25 - index * .04} strokeWidth=".7" transform={`rotate(${-24 + index * 22} 500 550)`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.65, delay: index * .1 }} />))}
      <motion.path d="M120 540 Q500 80 880 420" fill="none" stroke="#45D6C5" strokeWidth="1.5" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [.0, .7, .0] }} transition={{ duration: 2 }} />
    </svg></div>
    <div className="intro-copy"><motion.p initial={{ opacity: 0, letterSpacing: '0.45em' }} animate={{ opacity: 1, letterSpacing: '0.25em' }} transition={{ duration: .8 }}>{t("A DIFFERENT PERSPECTIVE ON EARTH")}</motion.p>
      <h2 aria-label={t("FIREPULSE")}>{t('FIREPULSE'.split('').map((letter, index) => <motion.span aria-hidden="true" key={index} initial={{ y: 70, rotateX: 50, opacity: 0 }} animate={{ y: 0, rotateX: 0, opacity: 1 }} transition={{ duration: .65, delay: .12 + index * .045, ease: [.16, 1, .3, 1] }} className={index > 3 ? 'thermal' : ''}>{t(letter)}</motion.span>))}</h2>
      <motion.div className="intro-actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .65, duration: .4 }}><button className="mission-button" onClick={() => onFinish(true)}>{t("Enter mission ↗")}</button><button className="text-button" onClick={() => onFinish(false)}>{t("Skip introduction")}</button></motion.div>
      <p className="intro-caption">{t("EARTH OBSERVATION / NASA SPACE APPS")}<br />{t("Procedural orbital study · Not satellite imagery")}</p>
    </div>
  </motion.section>;
}
