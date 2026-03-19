import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function ServerError() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <AlertCircle className="h-24 w-24 mx-auto text-destructive" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">500</h1>
          <h2 className="text-2xl font-bold">{t('errors.serverError')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('errors.serverErrorDesc')}
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link to={ROUTES.HOME}>{t('errors.goHome')}</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('errors.tryAgain')}
          </Button>
        </div>
      </div>
    </div>
  );
}
