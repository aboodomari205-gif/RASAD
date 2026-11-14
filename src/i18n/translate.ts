import { evidenceArabic } from './evidence-ar.ts';
import { arabic, templates } from './ar.ts';

export type Language = 'en' | 'ar';
export const LANGUAGE_KEY = 'firepulse.language.v1';
let language: Language = 'en';
try { if (typeof window !== 'undefined' && window.localStorage.getItem(LANGUAGE_KEY) === 'ar') language = 'ar'; } catch { /* Storage is optional. */ }
const listeners = new Set<() => void>();
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const dictionary = new Map(Object.entries({ ...arabic, ...evidenceArabic }).map(([key, value]) => [normalize(key), value]));
const patterns = Object.entries(templates).map(([key, value]) => ({
  pattern: new RegExp('^' + key.split(/\{\d+\}/).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([\\s\\S]*?)') + '$', 'i'), value,
}));
export const getLanguage = () => language;
export const locale = () => language === 'ar' ? 'ar-JO-u-ca-gregory-nu-latn' : 'en-GB';
export function subscribeLanguage(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function documentLanguage() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.title = language === 'ar' ? 'FIREPULSE — ذكاء رصد الأرض' : 'FIREPULSE — Earth Intelligence';
}
documentLanguage();
export function setLanguage(next: Language) {
  if (next === language) return;
  language = next;
  try { if (typeof window !== 'undefined') window.localStorage.setItem(LANGUAGE_KEY, next); } catch { /* Private browsing still supports in-memory switching. */ }
  documentLanguage();
  for (const listener of listeners) listener();
}
/** Pure display translation. No mutation of observation payloads, state keys or DOM nodes. */
export function translateText(text: string, target: Language = language): string {
  if (target === 'en' || !text.trim()) return text;
  const exact = dictionary.get(normalize(text));
  if (exact !== undefined) return text.match(/^\s*/)?.[0] + exact + (text.match(/\s*$/)?.[0] ?? '');
  if (text.includes('\n')) return text.split('\n').map(line => translateText(line, target)).join('\n');
  for (const { pattern, value } of patterns) {
    const match = text.trim().match(pattern);
    if (match) return value.replace(/\{(\d+)\}/g, (_, n: string) => translateText(match[Number(n) + 1], target));
  }
  // Reports are composed of independent, audited sentences; raw provenance stays intact.
  return text;
}
/** Localizes only strings at React presentation boundaries; nodes/numbers remain unchanged. */
export function t<T>(value: T): T { return (typeof value === 'string' ? translateText(value) : value) as T; }
