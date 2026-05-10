import React from 'react';

interface SpeedometerProps {
  speed: number;
  maxSpeed?: number;
  size?: number;
  driverColor?: string;
}

const Speedometer: React.FC<SpeedometerProps> = ({
  speed,
  maxSpeed = 400,
  size = 140,
  driverColor = '#ef4444',
}) => {
  const safeSpeed = Number.isFinite(speed) ? Math.max(0, Math.min(speed, maxSpeed)) : 0;
  const normalizedSpeed = safeSpeed / maxSpeed;
  const startAngle = 135;
  const sweepAngle = 270;
  const angle = startAngle + normalizedSpeed * sweepAngle;

  const radius = size / 2 - 12;
  const center = size / 2;

  // Tick marks
  const ticks = [] as React.ReactNode[];
  const tickCount = 21;
  for (let i = 0; i < tickCount; i++) {
    const t = i / (tickCount - 1);
    const tickAngle = startAngle + t * sweepAngle;
    const rad = (tickAngle * Math.PI) / 180;
    const isMajor = i % 5 === 0;
    const innerR = radius - (isMajor ? 14 : 8);
    const outerR = radius - 2;
    const x1 = center + innerR * Math.cos(rad);
    const y1 = center + innerR * Math.sin(rad);
    const x2 = center + outerR * Math.cos(rad);
    const y2 = center + outerR * Math.sin(rad);

    ticks.push(
      <line
        key={`${tickAngle}-${isMajor ? 'major' : 'minor'}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}
        strokeWidth={isMajor ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  // Speed labels
  const labels = [] as React.ReactNode[];
  const labelSteps = [0, 100, 200, 300, 400];
  for (const val of labelSteps) {
    const t = val / maxSpeed;
    const labelAngle = startAngle + t * sweepAngle;
    const rad = (labelAngle * Math.PI) / 180;
    const labelR = radius - 22;
    const x = center + labelR * Math.cos(rad);
    const y = center + labelR * Math.sin(rad);
    labels.push(
      <text
        key={val}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white/70 text-[9px] font-medium"
      >
        {val}
      </text>
    );
  }

  // Arc background
  const arcRadius = radius - 4;
  const arcPath = describeArc(center, center, arcRadius, startAngle, startAngle + sweepAngle);

  // Active arc
  const activeArcPath = describeArc(center, center, arcRadius, startAngle, angle);

  // Needle
  const needleRad = (angle * Math.PI) / 180;
  const needleX = center + (arcRadius - 6) * Math.cos(needleRad);
  const needleY = center + (arcRadius - 6) * Math.sin(needleRad);

  const activeColor = driverColor || 'rgba(255,255,255,0.92)';

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {safeSpeed > 0 && (
          <path
            d={activeArcPath}
            fill="none"
            stroke={activeColor}
            strokeWidth={6}
            strokeLinecap="round"
          />
        )}
        {/* Ticks */}
        {ticks}
        {/* Labels */}
        {labels}
        {/* Needle */}
        <line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          stroke={activeColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={center} cy={center} r={4} fill={activeColor} />
        <circle cx={center} cy={center} r={2} fill="#0e0e12" />
      </svg>
      <div className="flex items-baseline gap-1 -mt-2">
        <span className="text-[28px] font-bold text-white tabular-nums leading-none">
          {Math.round(safeSpeed)}
        </span>
        <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">km/h</span>
      </div>
    </div>
  );
};

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(' ');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export default Speedometer;
