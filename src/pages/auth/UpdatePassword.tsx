import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Logo } from '@/components/shared/Logo';

export function UpdatePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user came from reset password email (has session)
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError(t('auth.invalidResetLink'));
        toast.error('Invalid or expired reset link', {
          description: 'Please request a new password reset email.',
        });
      }
    };

    checkSession();
  }, []);

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return t('auth.passwordRequired');
    }
    if (password.length < 8) {
      return t('auth.passwordMinLength8');
    }
    if (!/[A-Z]/.test(password)) {
      return t('auth.passwordUppercase');
    }
    if (!/[a-z]/.test(password)) {
      return t('auth.passwordLowercase');
    }
    if (!/[0-9]/.test(password)) {
      return t('auth.passwordNumber');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate new password
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully', {
        description: 'You can now sign in with your new password.',
      });

      // Redirect to login
      navigate('/login');
    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err.message || t('auth.updatePasswordError'));
      toast.error('Failed to update password', {
        description: err.message || t('auth.updatePasswordError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <Logo className="h-12 w-auto mx-auto" />
          </a>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('auth.updatePassword')}</h2>
              <p className="text-gray-600">
                {t('auth.enterNewPassword')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{t('auth.passwordStrength')}</span>
                      <span className="font-medium">{strength.label}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${strength.color}`}
                        style={{ width: `${(strength.score / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    {t('auth.passwordMinLength8')}
                  </div>
                  <div className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    {t('auth.passwordUppercase')}
                  </div>
                  <div className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    {t('auth.passwordLowercase')}
                  </div>
                  <div className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    {t('auth.passwordNumber')}
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{t('auth.passwordsMatch')}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">{t('auth.passwordsDoNotMatch')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('auth.updatingPassword')}
                  </>
                ) : (
                  t('auth.updatePassword')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
