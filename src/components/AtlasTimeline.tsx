import {useEffect,useState,useRef} from 'react';
import {nextObservedDate} from '../../shared/observedPlayback';
import { t } from "../i18n/translate";
import { motion } from "motion/react";
import { useMotionPreference } from "../motion/useMotionPreference";
import { AtlasGlyph } from "../design/AtlasPrimitives";
export default function AtlasTimeline({
  dates,
  selected,
  onSelect,
  fixture,
  years=[],year,onYear,status="ready",message="",playbackScope="",
}: {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
  fixture: boolean;
  playbackScope?:string; years?:string[]; year?:string; onYear?:(year:string)=>void; status?:string; message?:string;
}) {
  const reduced = useMotionPreference();
  const chips=useRef<HTMLDivElement>(null);
  const datesKey=dates.join(',');
  const previousDate=[...dates].reverse().find(d=>selected!=='all'&&selected!=='range'&&d<selected);
  const followingDate=dates.find(d=>selected==='all'||selected==='range'||d>selected);
  useEffect(()=>{if(chips.current&&getComputedStyle(chips.current).visibility!=='hidden')chips.current.querySelector('.is-active')?.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});},[selected,playbackScope,year,datesKey]);
  const signature=JSON.stringify([playbackScope,year,dates]);
  const [playback,setPlayback]=useState<string|null>(null);
  const playing=playback===signature&&status==='ready'&&dates.length>1;
  const pause=()=>setPlayback(null);
  function selectDate(value:string){pause();onSelect(value);}
  useEffect(()=>{
    if(!playing)return;
    const timer=window.setTimeout(()=>{const next=nextObservedDate(dates,selected);if(next)onSelect(next);else setPlayback(null);},1600);
    return()=>window.clearTimeout(timer);
  },[playing,signature,dates,selected,onSelect]);
  useEffect(()=>{
    if(!playing)return;
    const interaction=(event:Event)=>{if(event.type==='visibilitychange'){if(document.hidden)pause();}else if(event instanceof KeyboardEvent){if(event.key==='Escape')pause();}else if(!(event.target instanceof Element)||!event.target.closest('.atlas-timeline'))pause();};
    document.addEventListener('click',interaction);document.addEventListener('keydown',interaction,true);document.addEventListener('visibilitychange',interaction);
    return()=>{document.removeEventListener('click',interaction);document.removeEventListener('keydown',interaction,true);document.removeEventListener('visibilitychange',interaction);};
  },[playing]);

  const index =
    selected === "all" || selected === "range"
      ? 0
      : dates.indexOf(selected) + 1;
  const yearIndex=years.indexOf(year??"");
  const problem=message||(status==="loading"?"Reading observations":status==="error"?"Observation source unavailable. Retry connection.":!dates.length?"No delivered observations under these filters. Coverage is unknown.":"");
  return (
    <section className="atlas-timeline" aria-label={t("Observation timeline")}>
      <div className="temporal-label">
        <AtlasGlyph name="time" size={20} />
        <div>
          <span className="atlas-overline">{t("TEMPORAL INDEX")}</span>
          <h2>{t("Observation window")}</h2>
        </div>
        <button
          disabled={status!=='ready'||dates.length<2}
          className="temporal-play"
          title={t('Playback visits delivered dates only; gaps are not observation coverage.')}
          aria-label={t(playing?'Pause observed-date playback':'Play observed-date playback')}
          aria-pressed={playing}
          onClick={()=>{if(playing)pause();else{if(!nextObservedDate(dates,selected)||selected==='all'||selected==='range')onSelect(dates[0]);setPlayback(signature);}}}
        >
          {playing ? 'Ⅱ' : '▷'}
        </button>
      </div>
      <div className="temporal-workspace">
        <div className="rasad-date-navigation">
          <button aria-label={t('Previous delivered date')} disabled={!previousDate||status!=='ready'} onClick={()=>previousDate&&selectDate(previousDate)}><AtlasGlyph name="back" size={16}/></button>
          <label>{t('UTC date')}<input id="rasad-date-select" aria-label={t('UTC date')} type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(selected)?selected:''} min={year?year+'-01-01':dates[0]} max={year?year+'-12-31':dates.at(-1)} onChange={e=>{if(e.target.value)selectDate(e.target.value);}}/></label>
          <button aria-label={t('Next delivered date')} disabled={!followingDate||status!=='ready'} onClick={()=>followingDate&&selectDate(followingDate)}><AtlasGlyph name="arrow" size={16}/></button>
          <button className="rasad-latest-date" disabled={!dates.length||status!=='ready'} onClick={()=>selectDate(dates.at(-1)!)}>{t('Latest delivered date')}</button>
        </div>
        {onYear&&years.length>0&&<div className="atlas-year-controls">
          <span>{t('Historical year / UTC')}</span>
          <button aria-label={t('Previous observed year')} disabled={yearIndex<=0} onClick={()=>{pause();onYear(years[yearIndex-1]);}}>&lsaquo;</button>
          <select aria-label={t('Atlas historical year')} value={year} onChange={e=>{pause();onYear(e.target.value);}}>
            {year&&!years.includes(year)&&<option value={year}>{year} / {t('Unavailable')}</option>}
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button aria-label={t('Next observed year')} disabled={yearIndex<0||yearIndex===years.length-1} onClick={()=>{pause();onYear(years[yearIndex+1]);}}>&rsaquo;</button>
          <small>{t('Observed dates only; acquisition coverage unknown.')}</small>
        </div>}
        {problem&&<p className="atlas-temporal-status" role={status==='error'?'alert':'status'}>{t(problem)}</p>}

        {t(
          dates.length ? (
            <>
              <div ref={chips} className="temporal-dates">
                <button
                  title={years.length?t("All observed dates in selected year"):undefined}
                  className={`date-chip ${selected === "all" ? "is-active" : ""}`}
                  aria-pressed={selected === "all"}
                  onClick={() => selectDate("all")}
                >
                  {t("All dates")}
                  {t(
                    selected === "all" && (
                      <motion.i
                        layoutId="temporal-cursor"
                        transition={{ duration: reduced ? 0 : 0.22 }}
                      />
                    ),
                  )}
                </button>
                {t(
                  dates.map((date) => (
                    <button
                      key={date}
                      className={`date-chip ${selected === date ? "is-active" : ""}`}
                      aria-pressed={selected === date}
                      onClick={() => selectDate(date)}
                    >
                      {t(date)}
                      {t(
                        selected === date && (
                          <motion.i
                            layoutId="temporal-cursor"
                            transition={{ duration: reduced ? 0 : 0.22 }}
                          />
                        ),
                      )}
                    </button>
                  )),
                )}
              </div>
              <input
                id="atlas-scrubber"
                className="temporal-scrubber"
                type="range"
                min={0}
                max={dates.length}
                step={1}
                value={Math.max(0,index)}
                aria-label={t("Scrub actual acquisition dates")}
                aria-valuetext={t(
                  selected === "all"
                    ? "All available acquisition dates"
                    : selected === "range"
                      ? "Custom UTC date range"
                      : selected + " UTC",
                )}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  selectDate(value === 0 ? "all" : dates[value - 1]);
                }}
              />
              <span className="temporal-caption">
                {t("OBSERVED DATES ONLY · UTC · COVERAGE UNKNOWN")}
              </span>
            </>
          ) : (
            <div className="temporal-unavailable">
              <div className="temporal-empty-line" />
              <span>
                {t("No acquisition dates available ")}
                <b> / </b>{" "}
                {t(
                  fixture
                    ? "Fixture has no valid dates"
                    : years.length?"No delivered observations under these filters. Coverage is unknown.":"Regional history not connected",
                )}
              </span>
            </div>
          ),
        )}
      </div>
      <div className="temporal-edition">
        <span>
          {t(
            fixture
              ? "LOCAL TEST"
              : dates.length||years.length
                ? "ARCHIVE ? NOT LIVE"
                : "UNCONNECTED",
          )}
        </span>
        <small>{t("NASA FIRMS / UTC")}</small>
      </div>
    </section>
  );
}
