import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '@babel/parser';
import { arabic, templates } from '../src/i18n/ar.ts';
import { translateText, t, setLanguage, getLanguage, subscribeLanguage, locale } from '../src/i18n/translate.ts';
import { decisionSummary } from '../shared/analytics.ts';

test('every static translated JSX label has reviewed Arabic copy (except brands and scientific units)', () => {
  const unchanged = new Set(['RASAD', 'FIRE', 'PULSE', 'FIREPULSE', 'MW', 'ESC', 'MODIS', 'VIIRS', 'VIIRS / MODIS', 'NASA FIRMS', 'NASA FIRMS / UTC', 'NASA FIRMS ·']);
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(dir + '/' + e.name) : e.name.endsWith('.tsx') ? [dir + '/' + e.name] : []);
  const missing: string[] = [];
  function walk(value: unknown) {
    if (!value || typeof value !== 'object') return;
    const node = value as { type?: string; callee?: { name?: string }; arguments?: { type?: string; value?: string }[] };
    if (node.type === 'CallExpression' && node.callee?.name === 't' && node.arguments?.[0]?.type === 'StringLiteral') {
      const label = node.arguments[0].value!;
      if (/[A-Za-z]/.test(label) && !unchanged.has(label.trim()) && translateText(label, 'ar') === label) missing.push(label);
    }
    for (const child of Object.values(value)) { if (Array.isArray(child)) child.forEach(walk); else if (child && typeof child === 'object' && 'type' in child) walk(child); }
  }
  for (const file of files('src')) walk(parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] }));
  assert.deepEqual(missing, []);
});
test('Arabic dictionary and interpolated templates preserve values and scientific caveats', () => {
  for (const [key, value] of Object.entries(arabic)) { assert.ok(value.trim(), key); if (!key.startsWith('NASA FIRMS')) assert.match(value, /[\u0600-\u06ff]/, key); }
  for (const [key, value] of Object.entries(templates)) assert.deepEqual([...key.matchAll(/\{\d+\}/g)].map(m => m[0]).sort(), [...value.matchAll(/\{\d+\}/g)].map(m => m[0]).sort(), key);
  assert.equal(translateText('7 observed dates available for VIIRS.', 'ar'), 'يتوفر 7 من تواريخ الرصد للمستشعر VIIRS.');
  assert.equal(translateText('7 VIIRS source records / 3 observed days in this month', 'ar'), '7 سجل مصدر للمستشعر VIIRS / 3 أيام مرصودة في هذا الشهر');
  assert.match(translateText('3 VIIRS observations; reported FRP sum 23.54 MW, partial reporting', 'ar'), /23\.54 MW، إبلاغ جزئي/);
  assert.equal(translateText('Brazil','ar'),'\u0627\u0644\u0628\u0631\u0627\u0632\u064a\u0644');
  for (const raw of ['NASA FIRMS', 'MODIS', 'VIIRS', 'S-NPP', 'h', 'n', '2026-11-08T23:59:00Z', '-51.334, -8.231', 'firepulse.observations/v1']) assert.equal(translateText(raw, 'ar'), raw);
});
test('language switching notifies once, preserves non-string React/data values and uses Gregorian UTC formatting', () => {
  let notifications = 0; const unsubscribe = subscribeLanguage(() => notifications++);
  const data = { sensor: 'VIIRS', coordinates: [-51.334, -8.231] };
  setLanguage('ar'); setLanguage('ar'); assert.equal(getLanguage(), 'ar'); assert.equal(t(data), data); assert.equal(t(0), 0);
  assert.equal(new Intl.DateTimeFormat(locale(), { year: 'numeric', timeZone: 'UTC' }).format(new Date('2026-12-31T23:59:59Z')), '2026');
  setLanguage('en'); assert.equal(t('Burning Calendar'), 'Burning Calendar'); assert.equal(notifications, 2); unsubscribe();
});
test('localized descriptive report retains actual Brazil scope and no-data uncertainty', () => {
  const brief = decisionSummary([], { region: 'brazil', startDate: '2026-11-01', endDate: '2026-11-30' }, { state: 'unavailable', coverage: 'unknown', fixture: false }, '2026-11-11T21:00:00Z');
  const result = translateText(brief, 'ar');
  assert.match(result, /المنطقة: البرازيل/); assert.match(result, /2026-11-01/); assert.match(result, /2026-11-11T21:00:00Z/);
  assert.match(result, /ليست حرائق غابات مؤكدة/); assert.match(result, /لا يثبت انعدام النشاط/); assert.doesNotMatch(result, /Generated:|Region:|No observations|Thermal detections/);
});

