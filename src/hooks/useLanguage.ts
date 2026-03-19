import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from '@/i18n/config';

export function useLanguage() {
  const { i18n } = useTranslation();

  const language = i18n.language?.split('-')[0] ?? 'en';
  const direction: 'ltr' | 'rtl' = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];

  const setLanguage = useCallback(
    (code: string) => {
      i18n.changeLanguage(code);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      document.documentElement.lang = code;
      document.documentElement.dir = RTL_LANGUAGES.includes(code) ? 'rtl' : 'ltr';
    },
    [i18n],
  );

  return {
    language,
    direction,
    currentLang,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: direction === 'rtl',
  };
}
