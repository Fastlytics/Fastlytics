import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { AlertCircleIcon, Cancel01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface MobileWarningBannerProps {
  id: string; // Unique identifier for this warning
  expiresInDays?: number; // How many days before showing the warning again
  className?: string;
}

const getIsMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

const subscribeToResize = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};

const MobileWarningBanner: React.FC<MobileWarningBannerProps> = ({
  id,
  expiresInDays = 1,
  className,
}) => {
  const isMobile = useSyncExternalStore(subscribeToResize, getIsMobile, () => false);

  const [isDismissed, setIsDismissed] = useState(() => {
    const dismissedWarnings = JSON.parse(localStorage.getItem('dismissedWarnings') || '{}');
    if (dismissedWarnings[id]) {
      const expiryDate = new Date(dismissedWarnings[id]);
      if (new Date() > expiryDate) {
        delete dismissedWarnings[id];
        localStorage.setItem('dismissedWarnings', JSON.stringify(dismissedWarnings));
        return false;
      }
      return true;
    }
    return false;
  });

  const isVisible = isMobile && !isDismissed;

  const dismissWarning = () => {
    const dismissedWarnings = JSON.parse(localStorage.getItem('dismissedWarnings') || '{}');

    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);

    dismissedWarnings[id] = expiryDate.toISOString();
    localStorage.setItem('dismissedWarnings', JSON.stringify(dismissedWarnings));

    setIsDismissed(true);
  };

  if (!isVisible || !isMobile) return null;

  return (
    <div
      className={cn(
        'bg-amber-950/80 border border-amber-500/30 text-amber-100 py-3 px-4 rounded-lg shadow-lg mb-6 relative backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-start">
        <AlertCircleIcon className="h-5 w-5 text-amber-300 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-base text-amber-200">Best viewed on desktop</h3>
          <p className="text-amber-100 my-1 text-sm">
            For the best experience with charts and data visualizations, we recommend using a larger
            screen.
          </p>
        </div>
        <button
          onClick={dismissWarning}
          className="text-amber-200 hover:text-white ml-2 p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <Cancel01Icon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export { MobileWarningBanner };
export default MobileWarningBanner;
