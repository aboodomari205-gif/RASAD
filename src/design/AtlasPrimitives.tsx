import {useMission} from '../state/mission';
import { t } from '../i18n/translate';
import type { ButtonHTMLAttributes } from 'react';
export type AtlasSymbol = 'orbit' | 'satellite' | 'layers' | 'filter' | 'locate' | 'north' | 'plus' | 'minus' | 'ledger' | 'arrow' | 'close' | 'index' | 'back' | 'time' | 'signal';
const geometry: Record<AtlasSymbol, string> = {
  orbit: 'M3 17C-1 12 17-1 21 7S7 26 3 17ZM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM16 4l4 1-1 4',
  satellite: 'm9 9 6 6m-7-4 3-3 5 5-3 3-5-5Zm-6-3 4-4 4 4-4 4-4-4Zm12 12 4-4 4 4-4 4-4-4ZM15 3a6 6 0 0 1 6 6M15 6a3 3 0 0 1 3 3',
  layers: 'm3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4',
  filter: 'M3 6h18M3 12h18M3 18h18M8 3v6m8 0v6M9 15v6',
  locate: 'M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M8 12h8m-4-4v8',
  north: 'm12 3 7 17-7-4-7 4 7-17Zm0 0v13',
  plus: 'M5 12h14m-7-7v14', minus: 'M5 12h14',
  ledger: 'M4 3h16v18H4V3Zm4 5h8M8 12h8m-8 4h4M2 8h4m-4 8h4',
  arrow: 'M4 12h15m-6-6 6 6-6 6', close: 'M5 5l14 14M19 5 5 19',
  index: 'M3 5h4m4 0h10M3 12h4m4 0h10M3 19h4m4 0h10',
  back: 'M20 12H5m6-6-6 6 6 6', time: 'M12 3a9 9 0 1 0 9 9M12 3v3m0 6 5-4M3 12h3m6 6v3m6-9h3',
  signal: 'M2 18V9m5 12V5m5 13V2m5 17V7m5 14V12',
};
export function AtlasGlyph({ name, size = 22 }: { name: AtlasSymbol; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d={geometry[name]} /></svg>;
}
export function AtlasTool({ symbol, label, active, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { symbol: AtlasSymbol; label: string; active?: boolean }) {
  return <button {...props} className={`atlas-tool ${active ? 'is-active' : ''}`} aria-label={t(label)} title={t(label)} aria-pressed={active}><AtlasGlyph name={symbol} /><span className="atlas-tool-label">{t(label)}</span></button>;
}
export function AtlasStamp({ fixture }: { fixture: boolean }) { const {scope}=useMission();
  return <span className={`atlas-stamp ${fixture ? 'is-fixture' : ''}`}><span />{t(scope.region==='northern-jordan'?'Northern Jordan':fixture?'REGIONAL DATA':'AJLOUN / PILOT REGION')}</span>;
}
