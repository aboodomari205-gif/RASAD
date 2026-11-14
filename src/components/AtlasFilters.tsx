import ProcessingScope from './ProcessingScope';
import { t } from "../i18n/translate";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { AtlasGlyph } from "../design/AtlasPrimitives";
import { useMotionPreference } from "../motion/useMotionPreference";
import { useMission } from "../state/mission";
import { useState } from "react";
export default function AtlasFilters({
  sensor,
  confidence,
  instruments,
  confidences,
  onSensor,
  onConfidence,
  onClose,
  fixture,
  connected,
}: {
  sensor: string;
  confidence: string;
  instruments: string[];
  confidences: string[];
  onSensor: (sensor: string) => void;
  onConfidence: (confidence: string) => void;
  onClose: () => void;
  fixture: boolean;
  connected?: boolean;
}) {
  const { scope, update } = useMission();
  const [error, setError] = useState("");
  function change(patch: Parameters<typeof update>[0]) {
    try {
      update(patch);
      setError("");
    } catch {
      setError("Enter a valid range: minimum must not exceed maximum.");
    }
  }
  const reduced = useMotionPreference();
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);
  return (
    <motion.section
      ref={panel}
      className="atlas-filter-panel"
      role="dialog"
      aria-label={t("Observation filters")}
      initial={{ opacity: 0, x: reduced ? 0 : -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduced ? 0 : -8 }}
      transition={{ duration: reduced ? 0 : 0.18 }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
    <ProcessingScope />
      <header>
        <div>
          <span className="atlas-overline">{t("SOURCE CONTROL")}</span>
          <h2>{t("Read the right signal.")}</h2>
        </div>
        <button
          className="atlas-dismiss"
          onClick={onClose}
          aria-label={t("Close filters")}
        >
          <AtlasGlyph name="close" size={16} />
        </button>
      </header>
      <fieldset className="sensor-selector">
        <legend>{t("01 / INSTRUMENT")}</legend>
        <label className={sensor === "all" ? "is-selected" : ""}>
          <input
            type="radio"
            name="atlas-sensor"
            value="all"
            checked={sensor === "all"}
            onChange={() => onSensor("all")}
          />
          <span>
            {t("All instruments")}
            <small>{t("Separate counts, original confidence scales")}</small>
          </span>
        </label>
        {t(
          [...new Set(["VIIRS", "MODIS", ...instruments])].map((instrument) => {
            const available = instruments.includes(instrument);
            return (
              <label
                key={instrument}
                className={`${sensor === instrument ? "is-selected" : ""} ${!available ? "is-unavailable" : ""}`}
              >
                <input
                  type="radio"
                  name="atlas-sensor"
                  value={instrument}
                  disabled={!available}
                  checked={sensor === instrument}
                  onChange={() => onSensor(instrument)}
                />
                <AtlasGlyph name="satellite" size={24} />
                <span>
                  {t(instrument)}
                  <small>
                    {t(
                      available
                        ? "Available in selected collection"
                        : "Not present in this collection",
                    )}
                  </small>
                </span>
                <span className="sensor-code">
                  {t(
                    instrument === "VIIRS"
                      ? "V"
                      : instrument === "MODIS"
                        ? "M"
                        : "·",
                  )}
                </span>
              </label>
            );
          }),
        )}
      </fieldset>
      <label className="confidence-control">
        <span>{t("02 / CONFIDENCE · RAW VALUE")}</span>
        <select
          value={confidence}
          disabled={sensor === "all" || !confidences.length}
          onChange={(event) => onConfidence(event.target.value)}
        >
          <option value="all">{t("All original values")}</option>
          {t(
            confidences.map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            )),
          )}
        </select>
        <small>
          {t(
            sensor === "all"
              ? "Choose one instrument to filter its original confidence values."
              : "Original sensor values, not a normalized probability.",
          )}
        </small>
      </label>
      <div className="atlas-range-filters">
        <label>
          {t("From · UTC")}
          <input
            aria-label={t("Atlas start date")}
            type="date"
            value={scope.startDate ?? ""}
            onChange={(e) => change({ startDate: e.target.value || undefined })}
          />
        </label>
        <label>
          {t("Through · UTC")}
          <input
            aria-label={t("Atlas end date")}
            type="date"
            value={scope.endDate ?? ""}
            onChange={(e) => change({ endDate: e.target.value || undefined })}
          />
        </label>
        <label>
          {t("Minimum FRP · MW")}
          <input
            aria-label={t("Minimum FRP")}
            type="number"
            min="0"
            step="any"
            value={scope.frpMin ?? ""}
            onChange={(e) =>
              change({
                frpMin:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </label>
        <label>
          {t("Maximum FRP · MW")}
          <input
            aria-label={t("Maximum FRP")}
            type="number"
            min="0"
            step="any"
            value={scope.frpMax ?? ""}
            onChange={(e) =>
              change({
                frpMax:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </label>
        <button
          className="atlas-text-button"
          onClick={() => {
            update({
              frpMin: undefined,
              frpMax: undefined,
              startDate: undefined,
              endDate: undefined,
            });
            setError("");
          }}
        >
          {t("Clear date / FRP bounds")}
        </button>
        <small>
          {t("FRP bounds exclude detections without reported FRP.")}
        </small>
        {t(error && <p role="alert">{t(error)}</p>)}
      </div>
      <p className="filter-footnote">
        {t(
          fixture
            ? "regional archive only. No live feed."
            : connected
              ? "Ajloun loaded observations. Coverage remains unknown."
              : "Ajloun observations are not connected.",
        )}
        <br />
        {t("Filters never change source coordinates or metadata.")}
      </p>
    </motion.section>
  );
}
