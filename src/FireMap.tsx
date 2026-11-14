import {constrainObservationPopup} from './motion/popupLayout';
import {selectedAtlasYear,selectAtlasYear,observedAtlasDates} from '../shared/atlasTemporal';
import RegionExplorer from "./components/RegionExplorer";
import type { CameraDestination } from "./components/RegionExplorer";
import { clearObservationFilters } from "../shared/activation";
import { t } from "./i18n/translate";
import LanguageSwitch from "./i18n/LanguageSwitch";
import { useLanguage } from "./i18n/useLanguage";
import { useMission } from "./state/mission";
import {
  fetchObservationCollection,
  filterObservationCollection,
} from "./data/observations";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import * as ml from "maplibre-gl";
import type { FeatureCollection, Point, Geometry } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { AnimatePresence } from "motion/react";
import { useMotionPreference } from "./motion/useMotionPreference";
import { AtlasGlyph, AtlasStamp, AtlasTool } from "./design/AtlasPrimitives";
import AtlasTimeline from "./components/AtlasTimeline";
import AtlasFilters from "./components/AtlasFilters";
import AtlasInspector from "./components/AtlasInspector";
import "./design/atlas.css";
import {
  createMissionCamera,
  createSignalMotion,
  signalVisibility,
} from "./motion/mapMotion";

import type {
  CalendarMapSelection,
  ObservationRegion,
} from "./calendar/aggregation";
import type { Dataset } from "../shared/model";
type Region = ObservationRegion;
type Observations = FeatureCollection<Point>;
const EMPTY: Observations = { type: "FeatureCollection", features: [] };
const SATELLITE: ml.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Imagery © Esri and its imagery providers",
    },
  },
  layers: [
    {
      id: "satellite-imagery",
      type: "raster",
      source: "satellite",
      paint: {
        "raster-saturation": -0.28,
        "raster-brightness-max": 0.85,
        "raster-contrast": 0.08,
      },
    },
  ],
};
const STREET = "https://tiles.openfreemap.org/styles/bright";
function displayProvenance(
  properties: Record<string, unknown>,
  datasets: Dataset[],
) {
  const dataset =
    datasets.find((d) => d.id === properties.datasetId) ??
    (datasets.length === 1 ? datasets[0] : undefined);
  return {
    ...properties,
    datasetId: dataset?.id ?? properties.datasetId,
    product: dataset?.product ?? null,
    processing: dataset?.processing ?? "unknown",
    collectionVersion: properties.version ?? dataset?.version ?? null,
  };
}

function metadataPopup(properties: Record<string, unknown>, region: Region) {
  const content = document.createElement("div");
  const kicker = document.createElement("span");
  kicker.className = "atlas-popup-kicker";
  kicker.textContent = t(
    region==='northern-jordan'
      ? "NORTHERN JORDAN / NASA OBSERVATIONS"
      : "AJLOUN / NASA OBSERVATIONS",
  );
  const title = document.createElement("strong");
  title.className = "atlas-popup-title";
  title.textContent = t("Thermal detection.");
  content.append(kicker, title);
  for (const [label, value] of [
    ["Source", properties.source],
    ["Satellite", properties.satellite],
    ["Instrument", properties.instrument],
    ["Acquisition date", properties.date],
    ["Time · HHMM UTC", properties.time],
    ["Timestamp · UTC", properties.acquiredAt],
    ["Confidence · raw", properties.confidence],
    ["FRP · MW", properties.frp],
    ["Dataset", properties.datasetId],
    ["Product", properties.product],
    ["Processing", properties.processing],
    ["Collection", properties.collectionVersion],
  ]) {
    const row = document.createElement("div");
    row.className = "atlas-popup-row";
    const key = document.createElement("span");
    key.textContent = t(String(label));
    const entry = document.createElement("span");
    entry.textContent = value == null ? t("Unavailable") : String(value);
    row.append(key, entry);
    content.append(row);
  }
  const note = document.createElement("p");
  note.className = "atlas-popup-note";
  note.textContent = t(
    "Thermal detections are not confirmed fires. Confidence retains its original sensor scale.",
  );
  content.append(note);
  content.dir = document.documentElement.dir;
  return content;
}

function observationPopup(
  instance: ml.Map,
  coordinates: number[],
  properties: Record<string, unknown>,
  region: Region,
) {
  const location = coordinates as [number, number];
  const anchor = instance.project(location).y < 330 ? "top" : "bottom";
  const result = new ml.Popup({ anchor, offset: 16, maxWidth: "300px" })
    .setLngLat(location)
    .setDOMContent(metadataPopup(properties, region))
    .addTo(instance);
  result
    .getElement()
    .querySelector("button")
    ?.setAttribute("aria-label", t("Close popup"));
  constrainObservationPopup(instance,result);
  return result;
}

export default function FireMap({
  missionRequest,
  onReplayIntro,
  calendarSelection,
  onRegionChange,
}: {
  missionRequest: number;
  onReplayIntro: () => void;
  calendarSelection?: CalendarMapSelection | null;
  onRegionChange?: (region: Region) => void;
}) {
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>('.atlas-screen');
    if(!root)return;
    const targets=[['.atlas-masthead','--atlas-header-h'],['.atlas-timeline','--atlas-time-h'],['.atlas-imagery','--atlas-style-h']] as const;
    const measure=()=>{for(const [selector,property]of targets){const element=root.querySelector(selector);if(element)root.style.setProperty(property,element.getBoundingClientRect().height+'px');}};
    const observer=new ResizeObserver(measure);for(const [selector]of targets){const element=root.querySelector(selector);if(element)observer.observe(element);}measure();return()=>observer.disconnect();
  },[]);
  const language = useLanguage();
  const reduced = useMotionPreference();
  const { scope, update } = useMission();
  const pendingCalendar = useRef<CalendarMapSelection | null>(null);
  const consumedCalendar = useRef<number | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(
    () => window.innerWidth > 760,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sensor = scope.sensor;
  const setSensor = useCallback(
    (value: string) => update({ sensor: value }),
    [update],
  );
  const confidence = scope.confidenceRaw ?? "all";
  const setConfidence = useCallback(
    (value: string) => update({ confidenceRaw: value }),
    [update],
  );
  const [viewCenter, setViewCenter] = useState([35.75, 32.33]);
  const camera = useRef<ReturnType<typeof createMissionCamera> | null>(null);
  const signals = useRef<ReturnType<typeof createSignalMotion> | null>(null);
  const journey = useRef(0);
  const [cameraMoving, setCameraMoving] = useState(false);
  const focusDetails = useRef(false);
  const [listLimit, setListLimit] = useState(50);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<ml.Map | null>(null);
  const currentData = useRef<Observations>(EMPTY);
  const currentDatasets = useRef<Dataset[]>([]);
  const boundary = useRef<FeatureCollection<Geometry> | null>(null);
  const regionRef = useRef<Region>("ajloun");
  const popup = useRef<ml.Popup | null>(null);
  const selectedObservation=useRef<string|number|undefined>(undefined);
  const region = scope.region;
  const setRegion = (value: Region) => update({ region: value });
  const [cameraContext, setCameraContext] = useState<CameraDestination>('ajloun');
  function exploreCamera(destination: CameraDestination) {
    setCameraContext(destination);
    journey.current = camera.current?.begin() ?? 0;
    if(destination!=='earth'){const ticket=journey.current;fetch(destination==='ajloun'?'/jordan-adm1.geojson':'/northern-jordan.geojson').then(r=>r.json()).then(result=>{if(ticket!==journey.current)return;camera.current?.fit(destination==='ajloun'?{type:'FeatureCollection',features:result.features.filter((f:import('geojson').Feature)=>f.properties?.shapeName==='Ajloun')}:result,ticket);}).catch(()=>setMapError('Regional boundary could not load.'));return;}
    map.current?.setPadding({top:0,right:0,bottom:0,left:0});
    map.current?.flyTo({ center: destination === 'earth' ? [35,24] : [35.85,32.35], zoom: destination === 'earth' ? 1.5 : 8, bearing:0, pitch:0, duration:reduced?0:1800, essential:false });
  }
  const [mode, setMode] = useState<"satellite" | "street">("satellite");
  const [data, setData] = useState<Observations>(EMPTY);
  const [status, setStatus] = useState("loading");
  const [mapError, setMapError] = useState("");
  const [retry, setRetry] = useState(0);
  const [sourceError,setSourceError]=useState('');
  const date =
    scope.startDate && scope.startDate === scope.endDate
      ? scope.startDate
      : "all";
  const setDate = useCallback(
    (value: string) =>
      update({
        startDate: value === "all" ? undefined : value,
        endDate: value === "all" ? undefined : value,
      }),
    [update],
  );
  const [selected, setSelected] = useState<{
    properties: Record<string, unknown>;
    coordinates: number[];
  } | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"observations" | "details">(
    "observations",
  );
  useEffect(() => {
    // Refresh an open MapLibre popup without closing it or resetting the map camera.
    if (popup.current?.isOpen() && selected)
      popup.current.setDOMContent(
        metadataPopup(selected.properties, regionRef.current),
      );
    popup.current
      ?.getElement()
      ?.querySelector("button")
      ?.setAttribute("aria-label", t("Close popup"));
    container.current
      ?.querySelector(".maplibregl-ctrl-attrib-button")
      ?.setAttribute("title", t("Toggle attribution"));
    const canvas = map.current?.getCanvas();
    if (canvas)
      canvas.setAttribute("aria-label", t("Interactive observation map"));
  }, [language, selected]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const adapt = () => {
      if (media.matches) {
        setInspectorOpen(false);
        setFiltersOpen(false);
        camera.current?.interrupt();
        map.current?.setPadding({ top: 140, bottom: 210, left: 65, right: 40 });
      }
    };
    media.addEventListener("change", adapt);
    return () => media.removeEventListener("change", adapt);
  }, []);

  useEffect(() => {
    if (!container.current) return;
    ml.setWorkerUrl(
      new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
    );
    const instance = new ml.Map({
      container: container.current,
      style: SATELLITE,
      center: [35.75, 32.33],
      zoom: 12,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      locale: {
        "Map.Title": t("Interactive observation map"),
        "Popup.Close": t("Close popup"),
        "AttributionControl.ToggleAttribution": t("Toggle attribution"),
      },
    });
    map.current = instance;
    camera.current = createMissionCamera(instance);
    signals.current = createSignalMotion(instance);
    instance.on("movestart", () => setCameraMoving(true));
    instance.on("moveend", () => {
      setCameraMoving(false);
      const center = instance.getCenter();
      setViewCenter([center.lng, center.lat]);
    });
    let disposed = false;
    let hovered: string | number | undefined;
    const restore = () => {
      if (boundary.current && !instance.getSource("ajloun-boundary")) {
        instance.addSource("ajloun-boundary", {
          type: "geojson",
          data: boundary.current,
        });
        instance.addLayer({
          id: "ajloun-fill",
          type: "fill",
          source: "ajloun-boundary",
          paint: { "fill-color": "#ff6848", "fill-opacity": 0.07 },
        });
        instance.addLayer({
          id: "ajloun-outline",
          type: "line",
          source: "ajloun-boundary",
          paint: { "line-color": "#ff6848", "line-width": 2 },
        });
      }
      if (!instance.getSource("observations")) {
        instance.addSource("observations", {
          type: "geojson",
          data: currentData.current,
          promoteId: "_observationId",
        });
        instance.addLayer({
          id: "observations",
          type: "circle",
          source: "observations",
          paint: {
            "circle-radius": [
              "*",
              ["+", 0.45, ["*", 0.55, signalVisibility]],
              [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                8,
                ["boolean", ["feature-state", "hover"], false],
                7,
                5,
              ],
            ],
            "circle-color": [
              "match",
              ["get", "instrument"],
              "VIIRS",
              "#ff6848",
              "MODIS",
              "#7bcad1",
              "#eae8e2",
            ],
            "circle-opacity": ["*", 0.85, signalVisibility],
            "circle-stroke-opacity": signalVisibility,
            "circle-stroke-color": "#fff2df",
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2,
              1,
            ],
          },
        });
        instance.addLayer({
          id: "selected-signal",
          type: "circle",
          source: "observations",
          paint: {
            "circle-radius": 14,
            "circle-opacity": 0,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#7bcad1",
            "circle-stroke-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.8,
              0,
            ],
          },
        });
        signals.current?.present(currentData.current);
        if(selectedObservation.current) signals.current?.select(selectedObservation.current);
      }
    };
    instance.on("style.load", restore);
    instance.on("mousemove", "observations", (e) => {
      if (hovered !== undefined)
        instance.setFeatureState(
          { source: "observations", id: hovered },
          { hover: false },
        );
      hovered = e.features?.[0]?.id;
      instance.getCanvas().style.cursor = "pointer";
      if (hovered !== undefined)
        instance.setFeatureState(
          { source: "observations", id: hovered },
          { hover: true },
        );
    });
    instance.on("mouseleave", "observations", () => {
      if (hovered !== undefined)
        instance.setFeatureState(
          { source: "observations", id: hovered },
          { hover: false },
        );
      hovered = undefined;
      instance.getCanvas().style.cursor = "";
    });
    instance.on("click", "observations", (e) => {
      const feature = e.features?.[0];
      if (
        !feature ||
        feature.geometry.type !== "Point" ||
        !currentData.current.features.some((item) => item.id === feature.id)
      )
        return;
      selectedObservation.current=feature.id;
      signals.current?.select(feature.id);
      const properties = displayProvenance(
        feature.properties,
        currentDatasets.current,
      );
      setSelected({
        properties,
        coordinates: feature.geometry.coordinates as number[],
      });
      setInspectorTab("details");
      setInspectorOpen(true);
      popup.current?.remove();
      popup.current = observationPopup(
        instance,
        feature.geometry.coordinates,
        properties,
        regionRef.current,
      );
    });
    instance.on("error", () =>
      setMapError("Some map resources could not load. Check your connection."),
    );
    instance.addControl(
      new ml.ScaleControl({ maxWidth: 90, unit: "metric" }),
      "bottom-left",
    );
    instance.addControl(
      new ml.AttributionControl({ compact: true }),
      "bottom-right",
    );
    fetch("/jordan-adm1.geojson")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const result: FeatureCollection = await response.json();
        const ajloun = result.features.find(
          (f) => f.properties?.shapeName === "Ajloun",
        );
        if (!ajloun) throw new Error();
        if (disposed || regionRef.current!=="ajloun") return;
        boundary.current = { type: "FeatureCollection", features: [ajloun] };
        if (instance.getSource("observations")) restore();
        if (regionRef.current === "ajloun")
          camera.current?.fit(boundary.current, journey.current, false);
      })
      .catch(() => {
        if (!disposed) setMapError("Ajloun boundary could not load.");
      });
    return () => {
      disposed = true;
      signals.current?.dispose();
      camera.current?.dispose();
      popup.current?.remove();
      instance.remove();
      map.current = null;
      signals.current = null;
      camera.current = null;
    };
  }, []);

  const requestFromYear=(scope.startDate??scope.calendarMonth).slice(0,4);
  const requestThroughYear=scope.endDate?.slice(0,4)??requestFromYear;
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(()=>{if(!controller.signal.aborted)setStatus('loading');});
    fetchObservationCollection(region, controller.signal,Number(requestFromYear),Number(requestThroughYear))
      .then((result) => {
        if (controller.signal.aborted) return;
        setSourceError("");
        const safe = filterObservationCollection(result, { region });
        currentDatasets.current = safe.metadata?.datasets ?? [];
        const request =
          pendingCalendar.current?.region === region
            ? pendingCalendar.current
            : null;
        const displayed: Observations = request
          ? filterObservationCollection(safe, {
              region,
              sensor: request.sensor,
              startDate: request.date,
              endDate: request.date,
            })
          : safe;
        if (request) {
          setDate(request.date);
          setSensor(request.sensor);
          setConfidence("all");
          pendingCalendar.current = null;
        }
        currentData.current = displayed;
        setData(safe);
        signals.current?.present(displayed);
        setStatus((safe as import('../shared/model').ObservationCollection).metadata?.availability?.state==='unavailable'?'unavailable':safe.features.length?'ready':'empty');
      })
      .catch((error:unknown) => {
        if (!controller.signal.aborted) {
          setSourceError(error instanceof Error&&/^(Select at most|Narrow the UTC window)/.test(error.message)?error.message:"Observation source unavailable. Retry connection.");
          setStatus("error");
          setInspectorOpen(true);
        }
      });
    return () => controller.abort();
  }, [region, retry, setDate, setSensor, setConfidence,requestFromYear,requestThroughYear]);

  function changeRegion(next: Region) {
    // Commit shared region before retained-map effects can run.
    if(next!==scope.region){setRegion(next);return;}
    if (next === regionRef.current) return;
    pendingCalendar.current = null;
    journey.current = camera.current?.begin() ?? 0;
    setStatus("loading");
    focusDetails.current = false;
    setListLimit(50);
    selectedObservation.current=undefined;
    setSelected(null);
    setInspectorTab("observations");
    regionRef.current = next;
    currentData.current = EMPTY;
    setData(EMPTY);
    popup.current?.remove();
    signals.current?.present(EMPTY);
    if (next === "ajloun" && boundary.current)
      camera.current?.fit(boundary.current, journey.current);
  }
  const availableInstruments = [
    ...new Set(
      data.features.map((f) => String(f.properties?.instrument ?? "Unknown")),
    ),
  ];
  const historicalMetadata=(data as import('../shared/model').ObservationCollection).metadata;
  const historical=historicalMetadata?.historical===true;
  const selectedYear=selectedAtlasYear(scope);
  const years=historical&&Array.isArray(historicalMetadata.availableYears)?historicalMetadata.availableYears.map(String):[];
  const dates=observedAtlasDates(data as import('../shared/model').ObservationCollection,scope,filterObservationCollection).filter(d=>!historical||d.startsWith(selectedYear));
  function chooseYear(year:string){update(selectAtlasYear(year,region,scope.regionalYears));}
  const confidences = [
    ...new Set(
      data.features
        .filter(
          (f) =>
            sensor === "all" ||
            (f.properties?.instrument ?? "Unknown") === sensor,
        )
        .map((f) => String(f.properties?.confidence ?? ""))
        .filter(Boolean),
    ),
  ].sort();
  const visibleData: Observations = filterObservationCollection(data, scope);
  const instruments = sensor === "all" ? availableInstruments : [sensor];
  function applyFilters(
    nextDate: string,
    nextSensor: string,
    nextConfidence: string,
  ) {
    focusDetails.current = false;
    if (nextDate !== date) setDate(nextDate);
    setSensor(nextSensor);
    setConfidence(nextConfidence);
    setListLimit(50);
    setInspectorTab("observations");
    selectedObservation.current=undefined;
    setSelected(null);
    popup.current?.remove();
    const filtered: Observations = filterObservationCollection(data, {
      ...scope,
      region,
      sensor: nextSensor,
      startDate: nextDate === "all" ? undefined : nextDate,
      endDate: nextDate === "all" ? undefined : nextDate,
      confidenceRaw: nextConfidence,
    });
    currentData.current = filtered;
    signals.current?.present(filtered);
  }
  const synchronizeScope = useEffectEvent(() => {
    if (regionRef.current !== scope.region) {
      changeRegion(scope.region);
      return;
    }
    const filtered = filterObservationCollection(data, scope);
    currentData.current = filtered;
    signals.current?.present(filtered);
    // A same-year fetch can finish just after a user opens a valid record.
    // Keep that immutable selection; only incompatible scopes clear it.
    if(selectedObservation.current!==undefined&&filtered.features.some(f=>f.id===selectedObservation.current)){
      signals.current?.select(selectedObservation.current);
      return;
    }
    popup.current?.remove();
    selectedObservation.current=undefined;
    setSelected(null);
    setInspectorTab("observations");
  });
  useEffect(() => {
    synchronizeScope();
  }, [
    scope.region,
    scope.sensor,
    scope.processing,
    scope.startDate,
    scope.endDate,
    scope.confidenceRaw,
    scope.frpMin,
    scope.frpMax,
    data,
  ]);
  function filterDate(next: string) {
    if(historical&&next==="all"){update({...selectAtlasYear(selectedYear,region,scope.regionalYears),calendarMonth:scope.calendarMonth});return;}
    if (
      next !== date ||
      (next === "all" && (scope.startDate || scope.endDate))
    ) {
      setDate(next);
      applyFilters(next, sensor, confidence);
    }
  }
  function closeFilters() {
    setFiltersOpen(false);
    document.getElementById("atlas-filter-trigger")?.focus();
  }
  function inspectObservation(feature: Observations["features"][number]) {
    if (
      !map.current ||
      !currentData.current.features.some((item) => item.id === feature.id)
    )
      return;
    const properties = displayProvenance(
      feature.properties ?? {},
      currentDatasets.current,
    );
    selectedObservation.current=feature.id;
      signals.current?.select(feature.id);
    setSelected({ properties, coordinates: feature.geometry.coordinates });
    focusDetails.current = true;
    setInspectorTab("details");
    setInspectorOpen(true);
    popup.current?.remove();
    popup.current = observationPopup(
      map.current,
      feature.geometry.coordinates,
      properties,
      regionRef.current,
    );
    camera.current?.interrupt();
    map.current.easeTo({
      center: feature.geometry.coordinates as [number, number],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 500,
    });
  }
  const inspectedEvidence = useRef<{id:number;data:Observations} | null>(null);
  const inspectEvidence = useEffectEvent(() => {
    if(status!=='ready'){inspectedEvidence.current=null;return;}
    // Apply the handoff filters before inspecting; re-open after any data effect clears it.
    if (!calendarSelection?.observationId || consumedCalendar.current!==calendarSelection.id || (inspectedEvidence.current?.id===calendarSelection.id && inspectedEvidence.current.data===data && popup.current?.isOpen())) return;
    if (scope.region !== calendarSelection.region || scope.startDate !== calendarSelection.date || scope.endDate !== calendarSelection.date || scope.sensor !== calendarSelection.sensor) return;
    const feature = currentData.current.features.find(f => f.id === calendarSelection.observationId);
    if (!feature || !map.current?.getSource('observations')) return;
    inspectedEvidence.current = {id:calendarSelection.id,data};
    inspectObservation(feature);
  });
  useEffect(() => { const frame = requestAnimationFrame(() => inspectEvidence()); return () => cancelAnimationFrame(frame); }, [calendarSelection, data, status,scope.region, scope.sensor, scope.processing,scope.startDate, scope.endDate]);
  function refit() {
    if (!map.current) return;
    const target = boundary.current;
    journey.current = camera.current?.begin() ?? 0;
    if (target) camera.current?.fit(target, journey.current);
  }
  useEffect(() => {
    if (!missionRequest || !camera.current) return;
    journey.current = camera.current.begin();
    const target =
      boundary.current;
    if (target) camera.current.fit(target, journey.current);
    document.getElementById("enter-mission")?.focus({ preventScroll: true });
  }, [missionRequest]);
  useEffect(() => {
    onRegionChange?.(region);
  }, [region, onRegionChange]);
  const receiveCalendarSelection = useEffectEvent(
    (selection: CalendarMapSelection) => {
      if (consumedCalendar.current === selection.id) return;
      consumedCalendar.current = selection.id;
      setInspectorOpen(true);
      if (region !== selection.region) {
        changeRegion(selection.region);
        pendingCalendar.current = selection;
      } else if (status === "ready" || status === "empty") {
        applyFilters(selection.date, selection.sensor, "all");
        requestAnimationFrame(()=>inspectEvidence());
        // Calendar region selection can load while the retained map is hidden.
        // This explicit user handoff starts a fresh, cancellable camera journey.
        journey.current = camera.current?.begin() ?? 0;
        const target =
          selection.region === "ajloun"
            ? boundary.current
            : filterObservationCollection(data, {
                ...scope,
                region: selection.region,
                sensor: selection.sensor,
                startDate: selection.date,
                endDate: selection.date,
              });
        if (target) camera.current?.fit(target, journey.current);
      } else pendingCalendar.current = selection;
    },
  );
  useEffect(() => {
    if (!calendarSelection) return;
    const frame = requestAnimationFrame(() =>
      receiveCalendarSelection(calendarSelection),
    );
    return () => cancelAnimationFrame(frame);
  }, [calendarSelection]);
  useEffect(()=>{let cancelled=false;fetch(region==='ajloun'?'/jordan-adm1.geojson':'/northern-jordan.geojson').then(r=>r.json()).then(result=>{if(cancelled)return;const next:FeatureCollection=region==='ajloun'?{type:'FeatureCollection',features:result.features.filter((f:import('geojson').Feature)=>f.properties?.shapeName==='Ajloun')}:result;boundary.current=next;const source=map.current?.getSource('ajloun-boundary') as import('maplibre-gl').GeoJSONSource|undefined;source?.setData(next);if(camera.current){journey.current=camera.current.begin();camera.current.fit(next,journey.current);}}).catch(()=>setMapError('Regional boundary could not load.'));return()=>{cancelled=true;};},[region]);
  const fixture = false;
  const availability = (data as import("../shared/model").ObservationCollection)
    .metadata?.availability;
  const dateRange =
    date !== "all"
      ? date
      : scope.startDate || scope.endDate
        ? `${scope.startDate ?? "Open start"} ? ${scope.endDate ?? "Open end"}`
        : !dates.length
          ? fixture
            ? "No acquisition dates"
            : "Not connected"
          : dates[0] +
            (dates.length > 1 ? " — " + dates[dates.length - 1] : "");
  const satellites = [
    ...new Set(
      data.features.map((feature) =>
        String(feature.properties?.satellite ?? "Unknown"),
      ),
    ),
  ];
  const filterCount =
    Number(sensor !== "all") +
    Number(confidence !== "all") +
    Number(Boolean(scope.startDate || scope.endDate)) +
    Number(scope.frpMin !== undefined || scope.frpMax !== undefined);
  return (
    <section
      className="atlas-screen"
      data-inspector={inspectorOpen ? "open" : "closed"}
      data-observation-selected={selected?"true":"false"}
      aria-label={t("Mission Atlas")}
    >
      <div
        className="atlas-map fire-map-canvas"
        ref={container}
        aria-label={t(
          region==='northern-jordan'?"Northern Jordan boundary":"Interactive Ajloun pilot boundary map",
        )}
      />
      <div className="atlas-vignette" aria-hidden="true" />
      <header className="atlas-masthead">
        <LanguageSwitch />
        <button
          className="atlas-brand mission-brand"
          onClick={onReplayIntro}
          aria-label={t("Return to Earth Alive")}
        >
          <AtlasGlyph name="orbit" size={31} />
          <span>
            {t("FIRE")}
            <span>{t("PULSE")}</span>
            <small>
              {t(
                fixture && availableInstruments.length
                  ? availableInstruments.join(" / ") +
                      " · " +
                      satellites.join(", ")
                  : "EARTH INTELLIGENCE OS",
              )}
            </small>
          </span>
        </button>
        <div className="atlas-register">
          <span>01</span>
          <strong>{t("MISSION ATLAS")}</strong>
          <small>{t("SCIENTIFIC CARTOGRAPHY")}</small>
        </div>
        <RegionExplorer region={region} onRegion={changeRegion} onCamera={exploreCamera} loaded={data.features.length > 0} />
        <button
          className="atlas-window"
          onClick={() => document.getElementById("atlas-scrubber")?.focus()}
        >
          <span className="atlas-overline">{t("ACQUISITION / UTC")}</span>
          <strong>{t(dateRange)}</strong>
        </button>
        <div className="atlas-source">
          <span className="atlas-overline">{t("SENSOR PROVENANCE")}</span>
          <strong>
            {t(
              availableInstruments.length
                ? availableInstruments.join(" / ") +
                    " · " +
                    satellites.join(", ")
                : "NASA FIRMS / Unconnected",
            )}
          </strong>
        </div>
      </header>
      <div className="atlas-editorial">
        <span className="atlas-overline">
          {t("FIELD STUDY ")}
          <b>/</b> {t(region==='northern-jordan'?'JO / NORTHERN JORDAN':'JO / AJLOUN GOVERNORATE')}
        </span>
        <h1>
          {t(region === "northern-jordan" ? "Northern Jordan" : "Ajloun")}
          <span>.</span>
        </h1>
        <AtlasStamp fixture={fixture} />
        <p>
          {t(
            fixture
              ? "A local NASA observation fixture.\nA separate view, never Ajloun data."
              : "The landscape is the first layer.\nThe signal comes with context.",
          )}
        </p>
      </div>
      <div
        className="atlas-tool-spine"
        role="toolbar"
        aria-label={t("Map tools")}
      >
        <AtlasTool
          id="atlas-filter-trigger"
          symbol="filter"
          label={t("Sensor and confidence filters")}
          active={filtersOpen}
          onClick={() => setFiltersOpen((value) => !value)}
          aria-expanded={filtersOpen}
          aria-controls="atlas-filters"
        />
        {t(
          filterCount > 0 && (
            <span className="atlas-filter-count">{t(filterCount)}</span>
          ),
        )}
        <AtlasTool
          id="enter-mission"
          symbol="locate"
          label={t("Fit study area")}
          onClick={refit}
        />
        <span className="tool-divider" />
        <AtlasTool
          symbol="plus"
          label={t("Zoom in")}
          onClick={() => {
            camera.current?.interrupt();
            map.current?.zoomIn({ duration: reduced ? 0 : 250 });
          }}
        />
        <AtlasTool
          symbol="minus"
          label={t("Zoom out")}
          onClick={() => {
            camera.current?.interrupt();
            map.current?.zoomOut({ duration: reduced ? 0 : 250 });
          }}
        />
        <AtlasTool
          symbol="north"
          label={t("Reset north")}
          onClick={() => {
            camera.current?.interrupt();
            map.current?.resetNorth({ duration: reduced ? 0 : 350 });
          }}
        />
        <span className="tool-divider" />
        <AtlasTool
          id="atlas-ledger-trigger"
          symbol="ledger"
          label={t("Observation ledger")}
          active={inspectorOpen}
          onClick={() => setInspectorOpen((value) => !value)}
          aria-expanded={inspectorOpen}
          aria-controls="atlas-inspector"
        />
      </div>
      <AnimatePresence>
        {t(
          filtersOpen && (
            <div id="atlas-filters">
              <AtlasFilters
                sensor={sensor}
                confidence={confidence}
                instruments={availableInstruments}
                confidences={confidences}
                onSensor={(next) => applyFilters(date, next, "all")}
                onConfidence={(next) => applyFilters(date, sensor, next)}
                onClose={closeFilters}
                fixture={fixture}
                connected={
                  availability?.state !== undefined &&
                  availability.state !== "unavailable"
                }
              />
            </div>
          ),
        )}
      </AnimatePresence>
      <div
        className="atlas-imagery floating-controls"
        aria-label={t("Basemap")}
      >
        <AtlasGlyph name="layers" size={18} />
        <span>{t("BASEMAP")}</span>
        {t(
          (["satellite", "street"] as const).map((value) => (
            <button
              key={value}
              data-basemap={value}
              aria-pressed={mode === value}
              onClick={() => {
                if (mode === value) return;
                map.current?.setStyle(
                  value === "satellite" ? SATELLITE : STREET,
                );
                setMode(value);
              }}
            >
              {t(value === "satellite" ? "Satellite" : "Street")}
            </button>
          )),
        )}
      </div>
      <div className="atlas-view-label">
        <span className="atlas-overline">{t("VIEW CENTER")}</span>
        <span>
          {t(Math.abs(viewCenter[1]).toFixed(3))}°{" "}
          {t(viewCenter[1] < 0 ? "S" : "N")} <b>/</b>{" "}
          {t(Math.abs(viewCenter[0]).toFixed(3))}°{" "}
          {t(viewCenter[0] < 0 ? "W" : "E")}
        </span>
      </div>
      <div className="atlas-key">
        <span>
          <i className="key-boundary" />
          {t(region==='ajloun'?"Ajloun boundary":"Northern Jordan boundary")}
        </span>
        {t(
          fixture &&
            availableInstruments.map((instrument) => (
              <span key={instrument}>
                <i
                  className={instrument === "MODIS" ? "key-modis" : "key-viirs"}
                />
                {t(instrument)}
              </span>
            )),
        )}
        <span className="atlas-key-note">
          {t("DETECTIONS ≠ CONFIRMED FIRES")}
        </span>
      </div>
      {t(
        cameraMoving && (
          <button
            className="atlas-stop"
            onClick={() => camera.current?.interrupt()}
          >
            {t("Stop camera ")}
            <span>{t("ESC")}</span>
          </button>
        ),
      )}
      {t(
        mapError && (
          <div className="atlas-map-error" role="alert">
            {t(mapError)}
            <button
              onClick={() => setMapError("")}
              aria-label={t("Dismiss map warning")}
            >
              <AtlasGlyph name="close" size={14} />
            </button>
          </div>
        ),
      )}
      <AnimatePresence>
        {t(
          inspectorOpen && (
            <AtlasInspector
              data={visibleData}
              instruments={instruments}
              status={status}
              fixture={fixture}
              availability={availability}
              selected={selected}
              details={inspectorTab === "details"}
              listLimit={listLimit}
              onSelect={inspectObservation}
              onBack={() => {
                setInspectorTab("observations");
                document
                  .getElementById("inspector-content")
                  ?.focus({ preventScroll: true });
              }}
              onMore={() => setListLimit((value) => value + 50)}
              onClose={() => {
                setInspectorOpen(false);
                document.getElementById("atlas-ledger-trigger")?.focus();
              }}
              onRetry={() => {
                setStatus("loading");
                setRetry((value) => value + 1);
              }}
              onFixture={() => changeRegion("northern-jordan")}
              onClear={() => {
                update(clearObservationFilters);
                applyFilters("all", "all", "all");
              }}
              onEntered={() => {
                if (focusDetails.current && inspectorTab === "details") {
                  document
                    .getElementById("inspector-content")
                    ?.focus({ preventScroll: true });
                  focusDetails.current = false;
                }
              }}
            />
          ),
        )}
      </AnimatePresence>
      {cameraContext !== 'ajloun' && <p className="camera-scope-note" role="status">{t('Exploration view only. Observation coverage remains the selected regional dataset; global data is unavailable.')}</p>}
      <AtlasTimeline
        dates={dates}
        playbackScope={JSON.stringify([region,sensor,confidence,scope.processing,scope.frpMin,scope.frpMax])}
        years={years} year={selectedYear} onYear={chooseYear} status={status}
        message={sourceError|| (historical&&!years.includes(selectedYear)?'This year is not available in the selected region. Coverage is unknown.':date!=='all'&&!dates.includes(date)?'Selected date has no delivered observations under these filters. Coverage is unknown.':scope.startDate&&scope.endDate&&scope.startDate.slice(0,4)!==scope.endDate.slice(0,4)?'Custom UTC date range':'')}
        selected={
          date === "all" && (scope.startDate || scope.endDate) && !(historical&&scope.startDate===selectedYear+"-01-01"&&scope.endDate===selectedYear+"-12-31") ? "range" : date
        }
        onSelect={filterDate}
        fixture={fixture}
      />
      <footer className="atlas-footer">
        <span>
          <i />
          {t(
            status === "loading"
              ? "READING SOURCE"
              : status === "error"
                ? "SOURCE UNAVAILABLE"
                : fixture
                  ? "LOCAL FIXTURE · NOT LIVE"
                  : availability &&
                      !["unavailable", "error"].includes(availability.state)
                    ? "ARCHIVE · NOT LIVE"
                    : "PILOT · OBSERVATIONS NOT CONNECTED",
          )}
        </span>
        <p>
          {t(
            "NASA FIRMS · Confidence: original sensor values · FRP: MW · Acquisition: UTC",
          )}
        </p>
        <span>{t("SPACE APPS / RESEARCH PROTOTYPE")}</span>
      </footer>
    </section>
  );
}
