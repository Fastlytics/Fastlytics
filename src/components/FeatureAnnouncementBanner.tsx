import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FeatureAnnouncementBannerProps {
  id: string; // Unique identifier for this announcement
  title: string;
  message: string;
  linkText?: string;
  linkHref?: string;
  expiresInDays?: number; // How many days the banner should show
  className?: string;
}

const FeatureAnnouncementBanner: React.FC<FeatureAnnouncementBannerProps> = ({
  id,
  title,
  message,
  linkText,
  linkHref,
  expiresInDays = 7,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if this announcement has been dismissed
    const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '{}');
    
    // If there's an expiry date stored, check if it's passed
    if (dismissedAnnouncements[id]) {
      const expiryDate = new Date(dismissedAnnouncements[id]);
      if (new Date() > expiryDate) {
        // Expired, show again
        delete dismissedAnnouncements[id];
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
        setIsVisible(true);
      } else {
        // Not expired, keep hidden
        setIsVisible(false);
      }
    } else {
      // Never dismissed, show it
      setIsVisible(true);
    }
  }, [id, expiresInDays]);
  
  const dismissAnnouncement = () => {
    const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '{}');
    
    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);
    
    dismissedAnnouncements[id] = expiryDate.toISOString();
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
    
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={cn("bg-gradient-to-r from-purple-900/70 via-indigo-800/70 to-blue-900/70 text-white py-3 px-4 rounded-lg shadow-lg border border-purple-500/30 mb-6 relative backdrop-blur-sm", className)}>
      <div className="flex items-start">
        <Sparkles className="h-5 w-5 text-purple-300 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <p className="text-purple-100 my-1">{message}</p>
          {linkText && linkHref && (
            <Link 
              to={linkHref} 
              className="inline-flex items-center text-purple-200 hover:text-white text-sm font-medium mt-1"
            >
              {linkText} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          )}
        </div>
        <button 
          onClick={dismissAnnouncement}
          className="text-purple-200 hover:text-white ml-2 p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default FeatureAnnouncementBanner; 