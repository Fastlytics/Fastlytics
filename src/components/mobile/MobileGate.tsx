import React, { useState, useEffect } from 'react';
import { MobileComingSoon } from './MobileComingSoon';

interface MobileGateProps {
  children: React.ReactNode;
}

/**
 * Wraps the entire app. On mobile viewports (< 768px width),
 * shows the "coming soon" page instead of the actual app.
 */
export function MobileGate({ children }: MobileGateProps) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (isMobile) {
    return <MobileComingSoon />;
  }

  return <>{children}</>;
}
