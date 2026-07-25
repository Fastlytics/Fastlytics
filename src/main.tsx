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
import { ErrorBoundary } from 'react-error-boundary';
import { LazyMotion, domAnimation } from 'motion/react';
import { ErrorFallback } from './components/layout/ErrorFallback';
import { getConsentPreferences, hasAnalyticsConsent, hasConsentChoice } from './lib/consent';
import type posthogType from 'posthog-js';
import App from './App.tsx';
import './index.css';

/* ─── Sentry (error monitoring) ───
 * Initialized early to catch bootstrap errors, but heavy integrations are
 * deferred so they don't compete with first paint. */
Sentry.init({
  dsn: 'https://d6124c77a3ce6da34a6e3fcb510280a5@o4509542641434624.ingest.de.sentry.io/4511292801024080',
  sendDefaultPii: false,
  integrations: [],
  tracesSampleRate: 0.0,
});

const setupSentryReactIntegration = () => {
  try {
    const client = Sentry.getClient();
    if (client) {
      client.addIntegration(
        Sentry.reactRouterV7BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        })
      );
    }
  } catch {
    /* silent */
  }
};

let posthog: posthogType | null = null;

const idle =
  typeof requestIdleCallback !== 'undefined'
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 200);

const initUmami = () => {
  const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (umamiWebsiteId && !document.querySelector('script[data-website-id]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://analytics.fastlytics.app/script.js';
    script.setAttribute('data-website-id', umamiWebsiteId);
    document.head.appendChild(script);
  }
};

const removeUmami = () => {
  const script = document.querySelector('script[data-website-id]');
  if (script) script.remove();
};

const initPostHog = () => {
  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  if (!key || !posthog || posthog.__loaded) return;
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
};

const bootstrapAnalytics = () => {
  idle(() => {
    if (!hasAnalyticsConsent()) return;
    initUmami();

    import('posthog-js').then(({ default: ph }) => {
      posthog = ph;
      initPostHog();
    });

    idle(() => {
      setupSentryReactIntegration();
    });
  });
};
bootstrapAnalytics();

window.addEventListener('consent-changed', ((
  e: CustomEvent<{ preferences: { analytics: boolean } }>
) => {
  const { analytics } = e.detail.preferences;
  if (analytics) {
    initUmami();
    if (posthog?.__loaded) {
      posthog.opt_in_capturing();
    } else {
      import('posthog-js').then(({ default: ph }) => {
        posthog = ph;
        initPostHog();
      });
    }
  } else {
    removeUmami();
    if (posthog?.__loaded) posthog.opt_out_capturing();
  }
}) as EventListener);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PostHogProvider client={posthog}>
        <HelmetProvider>
          <LazyMotion features={domAnimation} strict>
            <App />
          </LazyMotion>
        </HelmetProvider>
      </PostHogProvider>
    </ErrorBoundary>
  </StrictMode>
);
