import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, APIError } from './api-client';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api-client', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request()', () => {
    it('makes a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test Event' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await request<typeof mockData>('/api/schedule/2024');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it('includes headers in the request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await request('/api/test');

      // Check that fetch was called with headers including Content-Type
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws APIError on 404 with detail message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Event not found' }),
      });

      try {
        await request('/api/schedule/9999');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).status).toBe(404);
        expect((error as APIError).message).toBe('Event not found');
      }
    });

    it('throws APIError on 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(request('/api/crash')).rejects.toThrow(APIError);
    });

    it('throws APIError with status message if json parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(request('/api/unhealthy')).rejects.toMatchObject({
        status: 503,
        message: 'HTTP error! status: 503',
      });
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(request('/api/test')).rejects.toThrow('Network failure');
    });

    it('merges custom headers with default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await request('/api/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('APIError', () => {
    it('creates an error with status and message', () => {
      const error = new APIError(401, 'Unauthorized');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('APIError');
      expect(error.status).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('includes optional data', () => {
      const error = new APIError(400, 'Bad Request', { field: 'email' });

      expect(error.data).toEqual({ field: 'email' });
    });
  });
});
