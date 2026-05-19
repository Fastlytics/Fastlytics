import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

// Completely isolated, zero-margin, transparent background logo container
// Used primarily for programmatic screenshot generation via Playwright
const IsolatedLogo = () => {
  const [searchParams] = useSearchParams();
  const theme = (searchParams.get('theme') as 'dark' | 'light') || 'dark';
  const showText = searchParams.get('showText') !== 'false';

  useEffect(() => {
    // Force transparency on all container levels just to be completely certain
    document.body.style.setProperty('background', 'transparent', 'important');
    document.documentElement.style.setProperty('background', 'transparent', 'important');
    const root = document.getElementById('root');
    if (root) root.style.setProperty('background', 'transparent', 'important');

    return () => {
      // Cleanup
      document.body.style.removeProperty('background');
      document.documentElement.style.removeProperty('background');
      if (root) root.style.removeProperty('background');
    };
  }, []);

  return (
    <div
      style={{
        margin: 0,
        padding: '0 16px', // 16px horizontal padding to widen the final image boundaries
        background: 'transparent',
        display: 'inline-block',
      }}
      id="isolated-logo-container"
    >
      <FastlyticsLogo
        size={100} // Large size for clarity, scaling via deviceScaleFactor will handle the resolution
        disableAnimation={true}
        forceFinalState={true}
        theme={theme}
        showText={showText}
      />
    </div>
  );
};

export default IsolatedLogo;
