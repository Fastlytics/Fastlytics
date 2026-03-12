import { describe, it, expect } from 'vitest';
import { getCompoundColor, formatTime, cn } from './utils';

describe('utils', () => {
  describe('getCompoundColor', () => {
    it('returns correct color for known compounds', () => {
      expect(getCompoundColor('SOFT')).toBe('#EF4444');
      expect(getCompoundColor('medium')).toBe('#FCD34D'); // Case insensitive check
    });

    it('returns unknown color for null/undefined/unknown', () => {
      expect(getCompoundColor(null)).toBe('#9CA3AF');
      expect(getCompoundColor(undefined)).toBe('#9CA3AF');
      expect(getCompoundColor('HYPERSOFT')).toBe('#9CA3AF');
    });
  });

  describe('formatTime', () => {
    it('formats seconds to MM:SS.ms', () => {
      expect(formatTime(65.5)).toBe('01:05.500');
      expect(formatTime(0)).toBe('00:00.000');
    });

    it('handles negative or NaN input', () => {
      expect(formatTime(-1)).toBe('--:--.---');
      expect(formatTime(NaN)).toBe('--:--.---');
    });
  });
});
