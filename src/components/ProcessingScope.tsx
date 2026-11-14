import {useMission} from '../state/mission';
import {t} from '../i18n/translate';
export default function ProcessingScope(){const {scope,update}=useMission();return <label className="processing-scope">{t('Processing strata')}<select aria-label={t('Processing strata')} value={scope.processing??'all'} onChange={e=>update({processing:e.target.value==='all'?undefined:e.target.value as 'standard'|'nrt'})}><option value="all">{t('All strata / kept separate')}</option><option value="standard">{t('Standard processing')}</option><option value="nrt">{t('Near-real-time')}</option></select></label>;}
