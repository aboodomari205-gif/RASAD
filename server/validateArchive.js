import { ingestFirmsCSV } from './firmsArchive.js';
import { readArchiveCSV, loadAjlounGeometry } from './dataCatalog.js';
export function validateLocalArchive({ filename, sensor, product, version, processing, id }) {
  const dataset = { id, title: 'Ajloun FIRMS archive', regionId: 'ajloun', kind: 'archive', source: 'NASA FIRMS', sensor, product, version, processing, filename };
  const result = ingestFirmsCSV(readArchiveCSV(filename), { dataset, boundary: loadAjlounGeometry() });
  return { dataset: result.dataset, availability: result.availability, diagnostics: result.diagnostics };
}
// Explicit local, read-only dry run; never reads a credential file or writes a dataset.
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/validateArchive.js')) {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index += 2) options[args[index].replace(/^--/, '')] = args[index + 1];
  try { const result = validateLocalArchive(options); console.log(JSON.stringify(result, null, 2)); if (result.availability.quality === 'partial') process.exitCode = 2; }
  catch (error) { console.error(JSON.stringify({ error: { code: error.code ?? 'ARCHIVE_INVALID', message: 'Archive validation failed. Check the documented metadata and local CSV path.' } })); process.exitCode = 1; }
}
