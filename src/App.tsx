import { t } from './i18n/translate';
import { useLanguage } from './i18n/useLanguage';
import { useMotionPreference } from "./motion/useMotionPreference";
import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import "./App.css";
import { useMission, readModuleHash, moduleHash } from "./state/mission";
import MissionBoundary from "./components/MissionBoundary";
import AnalysisBoundary from "./components/AnalysisBoundary";
const FireMap = lazy(() => import("./FireMap"));
import { Navigation } from "./components/MissionUI";
import type { Module } from "./components/MissionUI";
import type {
  CalendarMapSelection,
} from "./calendar/aggregation";
const BurningCalendar = lazy(() => import("./calendar/BurningCalendar"));
const IntelligenceWorkspace = lazy(() => import("./intelligence/IntelligenceWorkspace"));
const EarthLanding = lazy(() => import("./components/EarthLanding"));

export default function App() {
  useLanguage(); // Re-render presentation in place; retain map, filters and scene state.
  const reduced = useMotionPreference();
  const { scope, update } = useMission();
  const missionRegion = scope.region;
  const [calendarSelection, setCalendarSelection] =
    useState<CalendarMapSelection | null>(null);
  const [active, setActive] = useState<Module>(readModuleHash);
  useEffect(() => { const restore = () => setActive(readModuleHash()); window.addEventListener('hashchange', restore); return () => window.removeEventListener('hashchange', restore); }, []);
  useEffect(() => { const hash = moduleHash(active); if (window.location.hash !== hash) window.history.pushState(null, '', hash); }, [active]);
  const [landing, setLanding] = useState(true);
  const [missionMounted, setMissionMounted] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [missionRequest, setMissionRequest] = useState(0);
  function enterMission() {
    setLanding(false);
    setHandoff(true);
  }
  useEffect(() => {
    if (!handoff) return;
    // R3F defers renderer disposal on unmount. Release it before creating MapLibre.
    const timeout = window.setTimeout(() => {
      setMissionMounted(true);
      setHandoff(false);
      setMissionRequest((value) => value + 1);
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
        document
          .getElementById("enter-mission")
          ?.focus({ preventScroll: true });
      });
    }, 650);
    return () => clearTimeout(timeout);
  }, [handoff]);
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {t(missionMounted && (
        <div
          className="workspace-host"
          data-covered={landing || handoff}
          inert={landing || handoff}
          aria-hidden={landing || handoff}
        >
          <div className="app-shell">
            <a className="skip-link" href="#main-workspace">{t("Skip to workspace")}</a>
            <Navigation active={active} onChange={setActive} />
            <main id="main-workspace" className="main-content">
              <div
                className="calendar-map-host"
                data-hidden={active !== "Intelligence Map"}
                inert={active !== "Intelligence Map"}
                aria-hidden={active !== "Intelligence Map"}
              >
                <MissionBoundary onReturn={() => setLanding(true)}>
                  <Suspense
                    fallback={
                      <p className="mission-starting" role="status">{t("Opening the observation workspace…")}</p>
                    }
                  >
                    <FireMap
                      missionRequest={missionRequest}
                      onReplayIntro={() => setLanding(true)}
                      calendarSelection={calendarSelection}
                    />
                  </Suspense>
                </MissionBoundary>
              </div>
              {t(active === "Burning Calendar" && (
                <AnalysisBoundary onReset={() => update({ startDate: undefined, endDate: undefined, frpMin: undefined, frpMax: undefined, confidenceRaw: 'all' })} onReturn={() => setActive('Intelligence Map')}><Suspense
                  fallback={
                    <p className="mission-starting" role="status">{t("Opening Burning Calendar…")}</p>
                  }
                >
                  <BurningCalendar
                    initialRegion={missionRegion}
                    onExploreHistory={()=>setActive('Anomaly Detection')}
                    onReturn={() => setActive("Intelligence Map")}
                    onEarth={() => setLanding(true)}
                    onMap={(selection) => {
                      setCalendarSelection({
                        ...selection,
                        id: (calendarSelection?.id ?? 0) + 1,
                      });
                      setActive("Intelligence Map");
                    }}
                  />
                </Suspense></AnalysisBoundary>
              ))}
              <AnimatePresence mode="wait">
                {t(active !== "Intelligence Map" &&
                  active !== "Burning Calendar" && (
                    <AnalysisBoundary key={active} onReset={() => update({ startDate: undefined, endDate: undefined, frpMin: undefined, frpMax: undefined, confidenceRaw: 'all' })} onReturn={() => setActive('Intelligence Map')}><Suspense fallback={<p className="mission-starting" role="status">{t("Opening intelligence workspace?")}</p>}><IntelligenceWorkspace key={active} active={active} onNavigate={setActive} onEarth={() => setLanding(true)} onMap={selection => { setCalendarSelection({ ...selection, id: (calendarSelection?.id ?? 0) + 1 }); setActive("Intelligence Map"); }} /></Suspense></AnalysisBoundary>
                  ))}
              </AnimatePresence>
            </main>
          </div>
        </div>
      ))}
      {t(landing && (
        <Suspense
          fallback={
            <div className="earth-handoff">
              <p>{t("Opening Earth scene…")}</p>
              <button className="mission-button" onClick={enterMission}>{t("Enter directly")}</button>
            </div>
          }
        >
          <EarthLanding allowWebGL={!missionMounted} onEnter={enterMission} />
        </Suspense>
      ))}
      <AnimatePresence>
        {t(handoff && (
          <motion.div
            className="earth-handoff"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4 }}
            role="status"
          >
            <p>
              {t(missionMounted
                ? "RETURNING TO MISSION"
                : "OPENING AJLOUN MISSION")}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </MotionConfig>
  );
}
