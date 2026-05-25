import React, { useMemo } from 'react';

interface TelemetrySparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  maxValue?: number;
  minValue?: number;
  className?: string;
}

const TelemetrySparkline: React.FC<TelemetrySparklineProps> = ({
  data,
  width = 120,
  height = 40,
  color = '#ef4444',
  fillColor,
  maxValue,
  minValue,
  className,
}) => {
  // Round width to nearest even pixel to avoid sub-pixel thrashing during resize
  const roundedWidth = Math.max(0, Math.round(width));
  const roundedHeight = Math.max(0, Math.round(height));

  const pathData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const max = maxValue ?? Math.max(...data, 1);
    const min = minValue ?? Math.min(...data, 0);
    const range = max - min || 1;
    const w = roundedWidth;
    const h = roundedHeight;

    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((val - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');

    const areaPoints = `${points} ${w},${h} 0,${h}`;

    return { points, areaPoints };
  }, [data, maxValue, minValue, roundedWidth, roundedHeight]);

  if (!pathData) {
    return <div className={className} style={{ width: roundedWidth, height: roundedHeight }} />;
  }

  return (
    <svg
      width={roundedWidth}
      height={roundedHeight}
      className={className}
      viewBox={`0 0 ${roundedWidth} ${roundedHeight}`}
    >
      {fillColor && <polygon points={pathData.areaPoints} fill={fillColor} opacity={0.15} />}
      <polyline
        points={pathData.points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default React.memo(TelemetrySparkline);
