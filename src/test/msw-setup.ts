import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

/**
 * MSW (Mock Service Worker) server setup for API mocking in tests.
 *
 * Usage:
 * 1. Import server from this file in your test
 * 2. Use beforeAll(() => server.listen()) to start the mock server
 * 3. Use afterEach(() => server.resetHandlers()) to reset between tests
 * 4. Use afterAll(() => server.close()) to clean up
 *
 * @example
 * ```typescript
 * import { server } from '@test/msw-setup';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 *
 * test('fetches data', async () => {
 *   server.use(
 *     http.get('/api/data', () => {
 *       return HttpResponse.json({ data: 'test' });
 *     })
 *   );
 *   // ... test code
 * });
 * ```
 */

// Default handlers - add your API mocks here
const defaultHandlers = [
  // Example: http.get('/api/schedule/:year', ...)
];

export const server = setupServer(...defaultHandlers);

/**
 * Utility to create a custom handler for tests.
 * Use this in individual tests to override default behavior.
 */
export function createMockHandler(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  response: unknown,
  status = 200
) {
  return http[method](path, () => {
    return new HttpResponse(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Utility to create an error handler for tests.
 */
export function createErrorHandler(path: string, status: number, errorMessage: string) {
  return http.get(path, () => {
    return HttpResponse.json({ detail: errorMessage }, { status });
  });
}
