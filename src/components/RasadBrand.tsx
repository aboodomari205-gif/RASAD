import {t} from '../i18n/translate';

/** Original supplied artwork, with its full symbol and lettering retained. */
export default function RasadBrand(){
 return <div className="rasad-brand-lockup">
  <div className="rasad-logo-frame"><img src="/brand/trasrad-source.jpeg" alt={t('Supplied RASAD logo')} width="1600" height="900"/></div>
  <div className="rasad-wordmark">RASAD <span lang="ar">رصد</span></div>
  <p lang="ar" dir="rtl">الرصد والمتابعة الشاملة</p>
 </div>;
}
