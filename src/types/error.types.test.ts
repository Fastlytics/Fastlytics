import { describe, it, expect } from 'vitest';
import { isErrorWithMessage, getErrorMessage } from './error.types';

describe('error.types', () => {
  describe('isErrorWithMessage', () => {
    it('should return true for Error objects with message', () => {
      const error = new Error('Test error');
      const result = isErrorWithMessage(error);
      expect(result).toBe(true);
    });

    it('should return false for non-Error objects', () => {
      const error = 'string error';
      const result = isErrorWithMessage(error);
      expect(result).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test message');
      const message = getErrorMessage(error);
      expect(message).toBe('Test message');
    });

    it('should return fallback for non-Error objects', () => {
      const error = 'string error';
      const message = getErrorMessage(error);
      expect(message).toBe('An error occurred');
    });

    it('should return fallback for null', () => {
      const error = null as unknown;
      const message = getErrorMessage(error);
      expect(message).toBe('An error occurred');
    });
  });
});
