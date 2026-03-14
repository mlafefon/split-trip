import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';
import { AppIcon } from './AppIcon';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show prompt for iOS after a delay
      const timer = setTimeout(() => {
        // Check if user has dismissed before (optional, using localStorage)
        const dismissed = localStorage.getItem('installPromptDismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 relative max-w-md mx-auto">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4 pr-2">
          <div className="bg-indigo-50 p-3 rounded-xl h-fit">
            <AppIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 mb-1">התקן את האפליקציה</h3>
            <p className="text-sm text-slate-600 mb-3">
              {isIOS 
                ? 'הוסף את האפליקציה למסך הבית לגישה מהירה ונוחה יותר.' 
                : 'התקן את האפליקציה לגישה מהירה ונוחה יותר, גם ללא חיבור לאינטרנט.'}
            </p>
            
            {isIOS ? (
              <div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>לחץ על כפתור השיתוף <Share className="w-4 h-4 inline mx-1" /></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>בחר ב"הוסף למסך הבית" <PlusSquare className="w-4 h-4 inline mx-1" /></span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors w-full"
              >
                התקן עכשיו
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
