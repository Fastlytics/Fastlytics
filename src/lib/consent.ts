/**
 * GDPR / CCPA Compliant Consent Management
 *
 * Two cookie categories:
 *  - necessary:   Auth, session, security (always on, cannot be disabled)
 *  - analytics:   PostHog, Umami, Sentry (with PII), Supabase activity tracking
 *
 * Stored as JSON in localStorage under `fastlytics_consent_v2`.
 */

const CONSENT_KEY = 'fastlytics_consent_v2';

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  timestamp?: string;
}

const defaultPreferences: ConsentPreferences = {
  necessary: true, // cannot be toggled off
  analytics: false,
};

/** Load stored consent or return defaults */
export const getConsentPreferences = (): ConsentPreferences => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ConsentPreferences;
      return { ...defaultPreferences, ...parsed };
    }
  } catch {
    // ignore corrupt storage
  }
  return { ...defaultPreferences };
};

/** Check if analytics consent has been granted */
export const hasAnalyticsConsent = (): boolean => {
  return getConsentPreferences().analytics === true;
};

/** Check if user has made ANY choice (accept all, reject all, or custom) */
export const hasConsentChoice = (): boolean => {
  return localStorage.getItem(CONSENT_KEY) !== null;
};

/** Persist consent and fire a custom event so main.tsx / hooks can react */
export const setConsentPreferences = (prefs: Partial<ConsentPreferences>): void => {
  const current = getConsentPreferences();
  const next: ConsentPreferences = {
    ...current,
    ...prefs,
    necessary: true, // immutable
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(next));

  window.dispatchEvent(
    new CustomEvent('consent-changed', {
      detail: { preferences: next },
    })
  );
};

/** Convenience: accept everything */
export const acceptAllConsent = (): void => {
  setConsentPreferences({ analytics: true });
};

/** Convenience: reject everything non-essential */
export const rejectAllConsent = (): void => {
  setConsentPreferences({ analytics: false });
};

/** Reset consent (for testing / re-prompting) */
export const clearConsent = (): void => {
  localStorage.removeItem(CONSENT_KEY);
};
