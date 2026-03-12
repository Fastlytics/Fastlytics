import { describe, it, expect } from 'vitest';
import type { CustomTooltipProps, CustomLegendProps } from './recharts.types';

describe('recharts.types', () => {
  describe('CustomTooltipProps', () => {
    it('should be importable and usable', () => {
      const props: CustomTooltipProps<number> = {
        active: true,
        payload: [{ name: 'VER', value: 100, color: '#1e41ff' }],
        label: 'FP1',
      };

      expect(props).toBeDefined();
      expect(props.active).toBe(true);
      expect(props.payload).toHaveLength(1);
    });
  });

  describe('CustomLegendProps', () => {
    it('should be importable and usable', () => {
      const props: CustomLegendProps = {
        payload: [
          { value: 'VER', color: '#1e41ff', type: 'circle', inactive: false },
          { value: 'MER', color: '#6cd3bf', type: 'circle', inactive: false },
        ],
      };

      expect(props).toBeDefined();
      expect(props.payload).toHaveLength(2);
    });
  });
});
