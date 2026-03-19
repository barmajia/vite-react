import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { isValidEmail } from '@/lib/utils';
import { toast } from 'sonner';

export function ForgotPassword() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email) {
      setError(t('auth.emailRequired'));
      return false;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.validEmail'));
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(t('auth.unexpectedError'));
      } else {
        setIsSubmitted(true);
        toast.success(t('forgotPassword.resetEmailSent'));
      }
    } catch (_err) {
      toast.error(t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('forgotPassword.back')}
          </Button>
          <CardTitle className="text-2xl font-bold">{t('forgotPassword.title')}</CardTitle>
          <CardDescription>{t('forgotPassword.subtitle')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('forgotPassword.checkEmail')}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t('forgotPassword.sentResetLink')} <strong>{email}</strong>
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsSubmitted(false)} className="w-full">
                  {t('forgotPassword.tryAnotherEmail')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className={`pl-10 ${error ? 'border-destructive' : ''}`} disabled={isLoading} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )}
          </CardContent>

          {!isSubmitted && (
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('forgotPassword.sendResetLink')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('forgotPassword.rememberPassword')}{' '}
                <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
                  {t('auth.signIn')}
                </Link>
              </p>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
