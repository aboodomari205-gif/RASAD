import {deliveryProfile} from './archiveProfiles.js';
import { IngestionError } from './firmsArchive.js';

// This is a conservative review gate, NOT a scientific product authenticator.
// See docs/NASA_PRODUCT_VERIFICATION.md for evidence and unresolved delivery semantics.
export function requireVerifiedExportSemantics(dataset, headers, record) {
  if(dataset?.deliveryProfile){deliveryProfile(dataset);return;}
  if (dataset?.kind !== 'archive') return; // Generic synthetic schema tests are not registered in the application catalog.
  // Explicit delivery profiles ingest core measurements; opaque fields are never reinterpreted.
  if ((dataset.archiveProfile === 'modis-firms-export' && dataset.sensor === 'MODIS' && dataset.product === 'MCD14ML' && dataset.version === '6.1') || (dataset.archiveProfile === 'viirs-snpp-firms-export' && dataset.sensor === 'VIIRS' && dataset.product === 'VNP14IMGTML' && dataset.version === '2')) return;
  if (dataset.sensor === 'MODIS' && [dataset.version, record?.version].some(value => ['6.03', '61.03'].includes(value))) {
    throw new IngestionError('PRODUCT_VERIFICATION_REQUIRED', 'MODIS raw version semantics require delivery-specific NASA documentation. Preserve the original version; do not rewrite it to 6.1. Import was stopped, not classified as corrupt source data. See docs/NASA_PRODUCT_VERIFICATION.md.');
  }
  if (dataset.sensor === 'VIIRS' && headers.includes('bright_t31')) {
    throw new IngestionError('PRODUCT_VERIFICATION_REQUIRED', 'The VIIRS export contains bright_t31. Its delivery-specific channel semantics are unverified; MODIS channel meanings and automatic I-5 aliases are not permitted. Preserve original fields. See docs/NASA_PRODUCT_VERIFICATION.md.');
  }
  if (dataset.sensor === 'VIIRS' && headers.includes('brightness') && !headers.includes('bright_ti4')) {
    throw new IngestionError('PRODUCT_VERIFICATION_REQUIRED', 'NASA documents a VIIRS brightness alias in web services, but this archive export profile has not been verified. Preserve the original header; do not automatically relabel it bright_ti4. See docs/NASA_PRODUCT_VERIFICATION.md.');
  }
}
