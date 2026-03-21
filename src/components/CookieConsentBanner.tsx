import { useEffect, useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function CookieConsentBanner() {
  const { preferences, setCookieConsent } = usePreferences();
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if consent hasn't been recorded yet
    if (!preferences.cookieConsent) {
      // Delay showing to avoid being intrusive
      const timer = setTimeout(() => {
        setShow(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [preferences.cookieConsent]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShow(false), 300);
  };

  const handleAccept = () => {
    setCookieConsent('accepted');
    handleClose();
  };

  const handleReject = () => {
    setCookieConsent('rejected');
    handleClose();
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-gray-900 dark:bg-gray-800 text-white shadow-2xl border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-2xl">🍪</span>
                <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              </div>
              <p className="text-sm text-gray-300 max-w-2xl">
                We use cookies to enhance your browsing experience. 
                Essential cookies are required for authentication and security. 
                By accepting, you help us personalize your experience with preferences like theme and language.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={handleReject}
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                Reject Optional
              </Button>
              <Button
                onClick={handleAccept}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Accept All
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
