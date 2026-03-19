import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function About() {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('about.title')}</h1>
        <p className="text-xl text-muted-foreground">{t('about.subtitle')}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p>{t('about.intro')}</p>

        <h2>{t('about.ourValues')}</h2>
        <ul>
          <li><strong>{t('about.qualityFirst')}</strong> {t('about.qualityFirstDesc')}</li>
          <li><strong>{t('about.customerFocus')}</strong> {t('about.customerFocusDesc')}</li>
          <li><strong>{t('about.trustSecurity')}</strong> {t('about.trustSecurityDesc')}</li>
          <li><strong>{t('about.sustainability')}</strong> {t('about.sustainabilityDesc')}</li>
        </ul>

        <h2>{t('about.whyChoose')}</h2>
        <ul>
          <li>{t('about.verifiedSellers')}</li>
          <li>{t('about.securePayments')}</li>
          <li>{t('about.fastReliable')}</li>
          <li>{t('about.support247')}</li>
          <li>{t('about.easyReturns')}</li>
        </ul>
      </div>

      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link to={ROUTES.PRODUCTS}>
            {t('about.shopNow')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={ROUTES.CONTACT}>{t('about.contactUs')}</Link>
        </Button>
      </div>
    </div>
  );
}
