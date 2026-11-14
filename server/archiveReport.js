import path from 'node:path';
import { ArchiveStore, DEFAULT_ARCHIVE_STORE } from './archiveStore.js';

let store;
try {
  const args = process.argv.slice(2); const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--store', '--dataset', '--import', '--offset', '--limit'].includes(args[index]) || !args[index + 1]) throw new RangeError('Invalid report arguments');
    options[args[index].slice(2)] = args[index + 1];
  }
  const location = options.store ? path.resolve(options.store) : DEFAULT_ARCHIVE_STORE;
  if (options.store && path.extname(options.store) !== '.sqlite') throw new RangeError('Expected a dedicated .sqlite archive store');
  store = new ArchiveStore(location, { readOnly: true });
  const importId = options.import ? Number(options.import) : null;
  if (importId !== null && (!Number.isSafeInteger(importId) || importId < 1)) throw new RangeError('Invalid import ID');
  const result = importId !== null ? { importId, issues: store.issues(importId, { offset: Number(options.offset ?? 0), limit: Number(options.limit ?? 100) }) } : options.dataset ? store.reports(options.dataset) : store.catalog();
  console.log(JSON.stringify(result, null, 2));
} catch { console.error('Archive report unavailable. Check documented arguments and persistent store.'); process.exitCode = 1; }
finally { store?.close(); }
