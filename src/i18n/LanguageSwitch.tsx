import { setLanguage } from './translate';
import { useLanguage } from './useLanguage';
import './language.css';
export default function LanguageSwitch() {
  const language = useLanguage();
  return <button type="button" className="language-switch" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} aria-label={language === 'en' ? 'Switch language to Arabic' : 'تغيير اللغة إلى الإنجليزية'} title={language === 'en' ? 'العربية' : 'English'} lang={language === 'en' ? 'ar' : 'en'}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/></svg><span dir="auto">{language === 'en' ? 'العربية' : 'English'}</span></button>;
}
