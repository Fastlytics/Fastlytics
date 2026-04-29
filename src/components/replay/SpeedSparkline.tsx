import React, { useMemo } from 'react';

interface SpeedSparklineProps {
  speeds: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const SpeedSparkline: React.FC<SpeedSparklineProps> = ({
  speeds,
  width = 180,
  height = 40,
  color = '#ef4444',
  className,
}) => {
  const pathData = useMemo(() => {
    if (!speeds || speeds.length < 2) return '';

    const maxSpeed = Math.max(...speeds, 1);
    const minSpeed = Math.min(...speeds);
    const range = maxSpeed - minSpeed || 1;

    const stepX = width / (speeds.length - 1);

    let d = '';
    speeds.forEach((speed, i) => {
      const x = i * stepX;
      const normalized = (speed - minSpeed) / range;
      const y = height - normalized * (height - 4) - 2;

      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    });

    return d;
  }, [speeds, width, height]);

  const areaPath = useMemo(() => {
    if (!pathData) return '';
    return `${pathData} L ${width} ${height} L 0 ${height} Z`;
  }, [pathData, width, height]);

  if (!speeds || speeds.length < 2) return null;

  return (
    <svg width={width} height={height} className={className} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkline-gradient)" />
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SpeedSparkline;
