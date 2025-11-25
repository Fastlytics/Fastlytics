import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileWarningBannerProps {
  id: string; // Unique identifier for this warning
  expiresInDays?: number; // How many days before showing the warning again
  className?: string;
}

const MobileWarningBanner: React.FC<MobileWarningBannerProps> = ({
  id,
  expiresInDays = 1,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile based on screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  useEffect(() => {
    if (!isMobile) {
      setIsVisible(false);
      return;
    }
    
    // Check if this warning has been dismissed
    const dismissedWarnings = JSON.parse(localStorage.getItem('dismissedWarnings') || '{}');
    
    // If there's an expiry date stored, check if it's passed
    if (dismissedWarnings[id]) {
      const expiryDate = new Date(dismissedWarnings[id]);
      if (new Date() > expiryDate) {
        // Expired, show again
        delete dismissedWarnings[id];
        localStorage.setItem('dismissedWarnings', JSON.stringify(dismissedWarnings));
        setIsVisible(true);
      } else {
        // Not expired, keep hidden
        setIsVisible(false);
      }
    } else {
      // Never dismissed, show it
      setIsVisible(true);
    }
  }, [id, expiresInDays, isMobile]);
  
  const dismissWarning = () => {
    const dismissedWarnings = JSON.parse(localStorage.getItem('dismissedWarnings') || '{}');
    
    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);
    
    dismissedWarnings[id] = expiryDate.toISOString();
    localStorage.setItem('dismissedWarnings', JSON.stringify(dismissedWarnings));
    
    setIsVisible(false);
  };
  
  if (!isVisible || !isMobile) return null;
  
  return (
    <div className={cn(
      "bg-amber-950/80 border border-amber-500/30 text-amber-100 py-3 px-4 rounded-lg shadow-lg mb-6 relative backdrop-blur-sm",
      className
    )}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-300 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-base text-amber-200">Best viewed on desktop</h3>
          <p className="text-amber-100 my-1 text-sm">
            For the best experience with charts and data visualizations, we recommend using a larger screen.
          </p>
        </div>
        <button 
          onClick={dismissWarning}
          className="text-amber-200 hover:text-white ml-2 p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileWarningBanner; 