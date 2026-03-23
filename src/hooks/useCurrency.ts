import { useState, useEffect, useCallback } from 'react';
import { CURRENCY_STORAGE_KEY, SUPPORTED_LANGUAGES } from '@/i18n/config';

export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>('EGP');

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  }, []);

  const getCurrencySymbol = useCallback((curr: string = currency): string => {
    const symbols: Record<string, string> = {
      EGP: 'ج.م',
      USD: '$',
      EUR: '€',
      GBP: '£',
      SAR: 'ر.س',
      AED: 'د.إ',
      CNY: '¥',
      JPY: '¥',
      KRW: '₩',
      BRL: 'R$',
      RUB: '₽',
      TRY: '₺',
    };
    return symbols[curr] || curr;
  }, [currency]);

  return {
    currency,
    setCurrency,
    getCurrencySymbol,
    supportedCurrencies: SUPPORTED_LANGUAGES.map(l => l.currency).filter((v, i, a) => a.indexOf(v) === i),
  };
}
