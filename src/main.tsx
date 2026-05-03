import * as Sentry from '@sentry/react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/layout/ErrorFallback';
import { getConsentPreferences, hasAnalyticsConsent, hasConsentChoice } from './lib/consent';
import App from './App.tsx';
import './index.css';

/* ─── Sentry (error monitoring) ───
 * Sentry is initialized unconditionally because crash reporting is
 * considered a "legitimate interest" under GDPR Art. 6(1)(f).
 * However, we strip PII (user IDs, emails) when analytics consent is
 * NOT granted. The DSN contains no PII by itself. */
Sentry.init({
  dsn: 'https://d6124c77a3ce6da34a6e3fcb510280a5@o4509542641434624.ingest.de.sentry.io/4511292801024080',
  sendDefaultPii: hasAnalyticsConsent(),
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: hasAnalyticsConsent() ? 1.0 : 0.0,
  tracePropagationTargets: ['localhost', /^https:\/\/api\.fastlytics\.app\/api/],
  enableLogs: hasAnalyticsConsent(),
});

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

/** Remove the Umami analytics script */
const removeUmami = () => {
  const script = document.querySelector('script[data-website-id]');
  if (script) {
    script.remove();
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
      autocapture: true,
      session_recording: {
        recordCrossOriginIframes: false,
        maskAllInputs: true,
        maskTextSelector: '[data-mask]',
      },
      capture_pageview: true,
      capture_pageleave: true,
      enable_heatmaps: true,
      scroll_depth: true,
      capture_dead_clicks: true,
      capture_performance: true,
      persistence: 'localStorage+cookie',
      opt_out_capturing_by_default: false,
    });
  }
};

/** Shutdown PostHog tracking */
const shutdownPostHog = () => {
  if (posthog.__loaded) {
    posthog.opt_out_capturing();
  }
};

/** Bootstrap analytics based on current consent */
const bootstrapAnalytics = () => {
  if (hasAnalyticsConsent()) {
    initUmami();
    initPostHog();
    posthog.opt_in_capturing?.();
  } else {
    removeUmami();
    shutdownPostHog();
  }
};

// Initial bootstrap
bootstrapAnalytics();

// Listen for consent changes at runtime (from ConsentBanner)
window.addEventListener('consent-changed', ((
  e: CustomEvent<{ preferences: { analytics: boolean } }>
) => {
  const { analytics } = e.detail.preferences;
  if (analytics) {
    initUmami();
    if (posthog.__loaded) {
      posthog.opt_in_capturing();
    } else {
      initPostHog();
    }
  } else {
    removeUmami();
    shutdownPostHog();
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
