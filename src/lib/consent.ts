/**
 * Consent management utility.
 * Controls whether analytics providers should be active based on user consent.
 */

const CONSENT_KEY = 'cookie_consent';

export type ConsentStatus = 'accepted' | 'declined' | null;

/** Get the current consent status */
export const getConsentStatus = (): ConsentStatus => {
  return localStorage.getItem(CONSENT_KEY) as ConsentStatus;
};

/** Check if analytics consent has been granted */
export const hasAnalyticsConsent = (): boolean => {
  return getConsentStatus() === 'accepted';
};

/** Check if user has made any consent choice */
export const hasConsentChoice = (): boolean => {
  return getConsentStatus() !== null;
};

/** Set consent and trigger analytics initialization */
export const setConsent = (accepted: boolean): void => {
  localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined');
  // Dispatch custom event so main.tsx can react to consent changes
  window.dispatchEvent(new CustomEvent('consent-changed', { detail: { accepted } }));
};
