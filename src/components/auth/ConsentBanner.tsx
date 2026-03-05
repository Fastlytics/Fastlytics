import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CookieIcon } from 'hugeicons-react';
import { getConsentStatus, setConsent } from '@/lib/consent';

const ConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getConsentStatus();
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    setConsent(false);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[60]"
        >
          <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
                <CookieIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm mb-1">Cookie Consent</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  We use cookies to improve your experience and analyze site traffic. By clicking
                  "Accept", you agree to our use of cookies.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDecline}
                className="flex-1 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { ConsentBanner };
export default ConsentBanner;
