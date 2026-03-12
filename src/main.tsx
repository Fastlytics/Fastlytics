import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/layout/ErrorFallback';
import { hasAnalyticsConsent, hasConsentChoice } from './lib/consent';
import App from './App.tsx';
import './index.css';

/** Inject the Umami analytics script */
const initUmami = () => {
  const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (umamiWebsiteId && !document.querySelector('script[data-website-id]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://analytics.subhashh.tech/script.js';
    script.setAttribute('data-website-id', umamiWebsiteId);
    document.head.appendChild(script);
  }
};

/** Initialize PostHog with full config */
const initPostHog = () => {
  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  if (key && !posthog.__loaded) {
    posthog.init(key, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: import.meta.env.MODE === 'development',
      // Auto-capture all clicks, form submissions, and page changes
      autocapture: true,
      // Session recording for replay & heatmaps
      session_recording: {
        recordCrossOriginIframes: false,
        maskAllInputs: true,
        maskTextSelector: '[data-mask]',
      },
      // Capture pageview and pageleave events automatically
      capture_pageview: true,
      capture_pageleave: true,
      // Enable heatmaps
      enable_heatmaps: true,
      // Scroll depth tracking
      scroll_depth: true,
      // Capture dead clicks (clicks that don't trigger navigation)
      capture_dead_clicks: true,
      // Capture performance metrics
      capture_performance: true,
      // Persistence
      persistence: 'localStorage+cookie',
      // Respect cookie consent — start opted out if no consent yet
      opt_out_capturing_by_default: !hasAnalyticsConsent(),
    });
  }
};

// If consent was already given, initialize analytics immediately
if (hasAnalyticsConsent()) {
  initUmami();
  initPostHog();
} else if (!hasConsentChoice()) {
  // No choice yet — initialize PostHog in opted-out mode so the provider works,
  // but no data is captured until they accept
  initPostHog();
}

// Listen for consent changes at runtime (from ConsentBanner)
window.addEventListener('consent-changed', ((e: CustomEvent<{ accepted: boolean }>) => {
  if (e.detail.accepted) {
    initUmami();
    if (posthog.__loaded) {
      posthog.opt_in_capturing();
    } else {
      initPostHog();
      posthog.opt_in_capturing();
    }
    posthog.capture('cookie_consent_accepted');
  } else {
    posthog.capture('cookie_consent_declined');
    if (posthog.__loaded) {
      posthog.opt_out_capturing();
    }
  }
}) as EventListener);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PostHogProvider client={posthog}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </PostHogProvider>
    </ErrorBoundary>
  </StrictMode>
);
