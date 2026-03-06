import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

const mobileQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function getIsMobile() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(mobileQuery).matches;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(mobileQuery);

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', callback);
    return () => mediaQueryList.removeEventListener('change', callback);
  }

  mediaQueryList.addListener(callback);
  return () => mediaQueryList.removeListener(callback);
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getIsMobile, () => false);
}
