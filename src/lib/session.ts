/**
 * Anonymous session tracking utility.
 *
 * Generates a persistent session ID stored in localStorage so anonymous users
 * can be tracked across page loads without requiring authentication.
 * The ID persists for 30 days (rolling) and is shared with PostHog's distinct_id
 * when available to enable cross-provider identity stitching.
 */

const SESSION_KEY = 'fst_session_id';
const SESSION_EXPIRY_KEY = 'fst_session_expiry';
const SESSION_TTL_DAYS = 30;

/** Generate a random session ID (UUIDv4-like) */
const generateSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `anon_${crypto.randomUUID()}`;
  }
  // Fallback for older browsers
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

/** Get or create a persistent anonymous session ID */
export const getSessionId = (): string => {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

    // Return existing if still valid
    if (existing && expiry && Date.now() < Number(expiry)) {
      // Extend TTL on access (rolling expiry)
      const newExpiry = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(SESSION_EXPIRY_KEY, String(newExpiry));
      return existing;
    }

    // Create new session
    const sessionId = generateSessionId();
    const newExpiry = Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SESSION_KEY, sessionId);
    localStorage.setItem(SESSION_EXPIRY_KEY, String(newExpiry));
    return sessionId;
  } catch {
    // localStorage unavailable (private browsing, etc.)
    return generateSessionId();
  }
};

/**
 * Link an anonymous session to an authenticated user.
 * Call this on login to stitch the anonymous trail to the user identity.
 */
export const linkSessionToUser = (userId: string): void => {
  try {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId && sessionId.startsWith('anon_')) {
      // Replace the anon prefix with the user ID for future events
      localStorage.setItem(SESSION_KEY, `user_${userId}`);
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
};
