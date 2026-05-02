import React from 'react';

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
  if (!data || data.length < 2) return <div className={className} style={{ width, height }} />;

  const max = maxValue ?? Math.max(...data, 1);
  const min = minValue ?? Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      {fillColor && <polygon points={areaPoints} fill={fillColor} opacity={0.15} />}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TelemetrySparkline;
