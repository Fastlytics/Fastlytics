import type { TooltipProps } from 'recharts';

export type ChartPayloadEntry<TData> = {
  name?: string;
  value?: TData;
  color?: string;
  payload?: TData;
};

export type CustomTooltipProps<TData> = {
  active?: boolean;
  payload?: readonly ChartPayloadEntry<TData>[];
  label?: string | number;
};

export type CustomLegendProps = {
  payload?: readonly {
    value?: string;
    color?: string;
    type?: string;
    inactive?: boolean;
  }[];
};
