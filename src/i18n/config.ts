import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// RTL languages
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',    flag: '🇸🇦' },
  { code: 'fr', name: 'French',     nativeName: 'Français',   flag: '🇫🇷' },
  { code: 'zh', name: 'Chinese',    nativeName: '中文',        flag: '🇨🇳' },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    flag: '🇩🇪' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    flag: '🇪🇸' },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',  flag: '🇧🇷' },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',    flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',      flag: '🇯🇵' },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',      flag: '🇰🇷' },
  { code: 'tr', name: 'Turkish',    nativeName: 'Türkçe',     flag: '🇹🇷' },
];

export const LANGUAGE_STORAGE_KEY = 'aurora-language';

/**
 * Try to detect language from user's IP location (graceful fallback on error).
 * Returns a 2-letter language code or null.
 */
async function detectLanguageFromLocation(): Promise<string | null> {
  const cached = sessionStorage.getItem('aurora-geo-lang');
  if (cached) return cached;

  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    const countryToLang: Record<string, string> = {
      SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar', LY: 'ar', TN: 'ar',
      FR: 'fr', BE: 'fr', CH: 'fr',
      CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
      DE: 'de', AT: 'de',
      ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
      IT: 'it',
      BR: 'pt', PT: 'pt',
      RU: 'ru',
      JP: 'ja',
      KR: 'ko',
      TR: 'tr',
    };
    const lang = countryToLang[data.country_code] ?? null;
    if (lang) sessionStorage.setItem('aurora-geo-lang', lang);
    return lang;
  } catch {
    return null;
  }
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    defaultNS: 'translation',
    ns: ['translation'],

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    detection: {
      // Priority order: localStorage → navigator (browser) → htmlTag
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

// After base init: try to refine with geolocation if no preference stored
const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
if (!storedLang) {
  detectLanguageFromLocation().then((lang) => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  });
}

export default i18n;
