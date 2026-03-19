import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { currentLang, setLanguage, supportedLanguages } = useLanguage();

  // Detect whether current language was auto-detected (no manual choice saved)
  const hasManualChoice = !!localStorage.getItem('aurora-language');
  const geoLang = sessionStorage.getItem('aurora-geo-lang');
  const isAutoDetected = !hasManualChoice && !!geoLang && geoLang === currentLang.code;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 px-2 h-9"
          aria-label={t('common.language')}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline text-sm font-medium">
            {currentLang.flag} {currentLang.code.toUpperCase()}
          </span>
          <span className="sm:hidden text-base">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
          <Globe className="h-3.5 w-3.5" />
          {t('common.language')}
          {isAutoDetected && (
            <span className="ml-auto text-[10px] rounded-full bg-primary/10 text-primary px-1.5 py-0.5">
              {t('common.autoDetected')}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              currentLang.code === lang.code
                ? 'bg-primary/5 font-medium text-primary'
                : ''
            }`}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span className="flex-1 text-sm">{lang.nativeName}</span>
            {currentLang.code === lang.code && (
              <span className="text-primary text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
