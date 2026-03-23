import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENCY_STORAGE_KEY, SUPPORTED_LANGUAGES } from '@/i18n/config';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  getCurrencySymbol: (currency?: string) => string;
  supportedCurrencies: string[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<string, string> = {
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

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('EGP');

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  const getCurrencySymbol = (curr: string = currency): string => {
    return CURRENCY_SYMBOLS[curr] || curr;
  };

  const supportedCurrencies = SUPPORTED_LANGUAGES
    .map((l) => l.currency)
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, getCurrencySymbol, supportedCurrencies }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
