import { useSyncExternalStore } from 'react';
import { getLanguage, subscribeLanguage } from './translate';
export function useLanguage() { return useSyncExternalStore(subscribeLanguage, getLanguage, () => 'en' as const); }
