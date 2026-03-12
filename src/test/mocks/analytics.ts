import { vi } from 'vitest';

/**
 * Mock for PostHog analytics.
 * Use this in tests to avoid actual analytics calls.
 *
 * @example
 * ```typescript
 * vi.mock('posthog-js', () => ({
 *   default: createMockPosthog(),
 * }));
 * ```
 */
export function createMockPosthog() {
  return {
    capture: vi.fn().mockReturnValue(undefined),
    identify: vi.fn().mockReturnValue(undefined),
    alias: vi.fn().mockReturnValue(undefined),
    reset: vi.fn().mockReturnValue(undefined),
    setPersonProperties: vi.fn().mockReturnValue(undefined),
    setGroupPropertiesForTelemetry: vi.fn().mockReturnValue(undefined),
    register: vi.fn().mockReturnValue(undefined),
    unregister: vi.fn().mockReturnValue(undefined),
    getFeatureFlag: vi.fn().mockReturnValue(undefined),
    isFeatureEnabled: vi.fn().mockReturnValue(false),
    reloadFeatureFlags: vi.fn().mockReturnValue(undefined),
    debug: vi.fn(),
    init: vi.fn(),
    loaded: true,
    config: {
      token: 'test-token',
      api_host: 'https://app.posthog.com',
    },
  };
}

/**
 * Creates a mock feature flag response.
 */
export function createMockFeatureFlags(flags: Record<string, boolean | string>) {
  return flags;
}
