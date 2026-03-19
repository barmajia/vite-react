import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-bold">{t('errors.notFound')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('errors.notFoundDesc')}
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link to={ROUTES.HOME}>{t('errors.goHome')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.PRODUCTS}>{t('errors.browseProducts')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
