/** Retired inputs remain readable by Node regression/archive tools. Vite removes
 * this branch entirely from the active Brazil client. */
declare const __RASAD_ACTIVE_ONLY__: boolean | undefined;
export const COMPATIBILITY_REGIONS: readonly string[] =
  typeof __RASAD_ACTIVE_ONLY__ !== 'undefined' && __RASAD_ACTIVE_ONLY__
    ? []
    : ['ajloun', 'northern-jordan'];
