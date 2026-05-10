import React from 'react';

function createLazyChart<P extends Record<string, unknown>>(name: string): React.FC<P> {
  const LazyComp = React.lazy(async () => {
    const mod = await import('recharts');
    return { default: (mod as Record<string, React.ComponentType<P>>)[name] };
  });

  const Wrapped: React.FC<P> = (props: P) => (
    <React.Suspense
      fallback={<div className="animate-pulse bg-white/[0.03] rounded h-full w-full" />}
    >
      <LazyComp {...props} />
    </React.Suspense>
  );
  Wrapped.displayName = `Lazy${name}`;
  return Wrapped;
}

export const LineChart = createLazyChart('LineChart');
export const Line = createLazyChart('Line');
export const XAxis = createLazyChart('XAxis');
export const YAxis = createLazyChart('YAxis');
export const CartesianGrid = createLazyChart('CartesianGrid');
export const Tooltip = createLazyChart('Tooltip');
export const ResponsiveContainer = createLazyChart('ResponsiveContainer');
export const Legend = createLazyChart('Legend');
export const Brush = createLazyChart('Brush');
export const BarChart = createLazyChart('BarChart');
export const Bar = createLazyChart('Bar');
export const Cell = createLazyChart('Cell');
export const ReferenceLine = createLazyChart('ReferenceLine');
export const AreaChart = createLazyChart('AreaChart');
export const Area = createLazyChart('Area');
export const ComposedChart = createLazyChart('ComposedChart');
export const Scatter = createLazyChart('Scatter');
export const ReferenceArea = createLazyChart('ReferenceArea');
export const Label = createLazyChart('Label');
export const ScatterChart = createLazyChart('ScatterChart');
