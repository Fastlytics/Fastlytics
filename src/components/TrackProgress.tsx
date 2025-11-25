
import React from 'react';

interface TrackProgressProps {
  progress: number;
  trackColor?: string;
  progressColor?: string;
}

const TrackProgress = ({ 
  progress, 
  trackColor = "rgba(255,255,255,0.1)", 
  progressColor = "#ff2800" 
}: TrackProgressProps) => {
  const strokeWidth = 6;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width="80" height="80">
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="animate-loading-track"
          style={{ '--stroke-dashoffset': strokeDashoffset } as React.CSSProperties}
        />

        {/* Start/Finish Line */}
        <line
          x1="40"
          y1={40 - radius - 2}
          x2="40"
          y2={40 - radius + 8}
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      
      <div className="absolute text-center">
        <span className="text-xl font-bold">{progress}%</span>
      </div>
    </div>
  );
};

export default TrackProgress;
