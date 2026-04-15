import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import ar from './translations/ar.json';
import ku from './translations/ku.json';

const savedLang = localStorage.getItem('chrani-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    ku: { translation: ku },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const RTL_LANGUAGES = ['ar', 'ku'];

export const isRTL = (lang: string) => RTL_LANGUAGES.includes(lang);

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('chrani-lang', lang);
  document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// Set initial direction
document.documentElement.dir = isRTL(savedLang) ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

export default i18n;
