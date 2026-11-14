import type { FeatureCollection, Point } from 'geojson';
import type { Map, GeoJSONSource, ExpressionSpecification } from 'maplibre-gl';

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Presentation-only rank. Acquisition metadata and coordinates are never modified.
export const signalVisibility: ExpressionSpecification = ['min', 1, ['max', 0,
  ['/', ['-', ['coalesce', ['global-state', 'signal-reveal'], 1], ['*', ['coalesce', ['get', '_revealOrder'], 0], 0.65]], 0.35],
]];

export function createSignalMotion(map: Map) {
  let frame = 0;
  let generation = 0;
  let selected: string | number | undefined;
  let sourceListener: (() => void) | undefined;
  const cancel = () => {
    generation++;
    cancelAnimationFrame(frame);
    if (sourceListener) map.off('sourcedata', sourceListener);
    sourceListener = undefined;
  };
  function present(data: FeatureCollection<Point>) {
    cancel();
    selected = undefined;
    const source = map.getSource('observations') as GeoJSONSource | undefined;
    if (!source) return;
    map.removeFeatureState({ source: 'observations' });
    const reduced = prefersReducedMotion();
    map.setGlobalStateProperty('signal-reveal', reduced ? 1 : 0);
    const rendered: FeatureCollection<Point> = { ...data, features: data.features.map((feature, index) => ({
      ...feature, properties: { ...feature.properties, _observationId: feature.id, _revealOrder: index / Math.max(1, data.features.length - 1) },
    })) };
    const token = generation;
    // Wait for the GeoJSON worker, not an assumed network/loading duration.
    sourceListener = () => {
      if (token !== generation || !map.getSource('observations') || !map.isSourceLoaded('observations')) return;
      if (sourceListener) map.off('sourcedata', sourceListener);
      sourceListener = undefined;
      if (reduced || !data.features.length) { map.setGlobalStateProperty('signal-reveal', 1); return; }
      const start = performance.now();
      let previous = 0;
      const tick = (now: number) => {
        if (token !== generation || !map.getLayer('observations')) return;
        const progress = Math.min(1, (now - start) / 850);
        if (now - previous > 30 || progress === 1) {
          map.setGlobalStateProperty('signal-reveal', prefersReducedMotion() ? 1 : progress);
          previous = now;
        }
        if (progress < 1 && !prefersReducedMotion()) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    map.on('sourcedata', sourceListener);
    source.setData(rendered);
  }
  return {
    present,
    select(id: string | number | undefined) {
      if (!map.getSource('observations')) return;
      if (selected !== undefined) map.setFeatureState({ source: 'observations', id: selected }, { selected: false });
      selected = id;
      if (id !== undefined) map.setFeatureState({ source: 'observations', id }, { selected: true });
    },
    dispose: cancel,
  };
}

export function createMissionCamera(map: Map) {
  let generation = 0;
  const interrupt = () => { generation++; map.stop(); };
  const gesture = () => interrupt();
  // Raw input cancels pending async journeys too; programmatic movements do not.
  const canvas = map.getCanvas();
  const container = map.getContainer();
  container.addEventListener('pointerdown', gesture);
  container.addEventListener('wheel', gesture, { passive: true });
  container.addEventListener('touchstart', gesture, { passive: true });
  const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') interrupt(); };
  window.addEventListener('keydown', escape);
  const keyboard = (event: KeyboardEvent) => {
    if (['Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(event.key)) interrupt();
  };
  canvas.addEventListener('keydown', keyboard);
  return {
    begin() { interrupt(); return generation; },
    fit(data: FeatureCollection, token: number, animate = true) {
      if (token !== generation) return;
      const coordinates: [number, number][] = [];
      const visit = (value: unknown): void => {
        if (!Array.isArray(value)) return;
        if (typeof value[0] === 'number' && typeof value[1] === 'number') coordinates.push([value[0], value[1]]);
        else value.forEach(visit);
      };
      data.features.forEach(feature => { if ('coordinates' in feature.geometry) visit(feature.geometry.coordinates); });
      if (!coordinates.length) return;
      let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
      for (const [x, y] of coordinates) { west = Math.min(west, x); south = Math.min(south, y); east = Math.max(east, x); north = Math.max(north, y); }
      const bounds: [[number, number], [number, number]] = [[west, south], [east, north]];
      map.stop();
      const width = map.getContainer().clientWidth;
      const wide = width > 1000;
      const ledgerOpen = map.getContainer().closest('.atlas-screen')?.getAttribute('data-inspector') === 'open';
      const padding = wide ? { top: 95, bottom: 205, left: 315, right: ledgerOpen ? 400 : 70 } : width > 760 ? { top: 95, bottom: 205, left: 240, right: ledgerOpen ? 330 : 60 } : { top: 140, bottom: ledgerOpen ? 300 : 210, left: 65, right: 40 };
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
      map.fitBounds(bounds, { padding, maxZoom: 12,
        duration: animate && !prefersReducedMotion() ? 1600 : 0, linear: false,
        easing: t => t * t * (3 - 2 * t), essential: false });
    },
    interrupt,
    dispose() {
      interrupt(); container.removeEventListener('pointerdown', gesture); container.removeEventListener('wheel', gesture);
      container.removeEventListener('touchstart', gesture); canvas.removeEventListener('keydown', keyboard);
      window.removeEventListener('keydown', escape);
    },
  };
}
