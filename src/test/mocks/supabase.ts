import { vi } from 'vitest';

/**
 * Mock for Supabase client.
 * Use this in tests to avoid actual Supabase calls.
 *
 * @example
 * ```typescript
 * vi.mock('@/lib/supabase', () => ({
 *   supabase: createMockSupabase(),
 * }));
 * ```
 */
export function createMockSupabase() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      }),
    },
  };
}

/**
 * Creates a mock session object.
 */
export function createMockSession(overrides = {}) {
  return {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600,
    token_type: 'bearer',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      ...overrides,
    },
  };
}

/**
 * Creates a mock user object.
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
