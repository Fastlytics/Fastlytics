import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerF1Props {
  className?: string;
  size?: number; // Size in pixels
}

const LoadingSpinnerF1: React.FC<LoadingSpinnerF1Props> = ({
  className,
  size = 48, // Default size
}) => {
  // Simple SVG spinning wheel design
  // Colors can be adjusted to match theme (e.g., text-red-500)
  return (
    <svg
      className={cn("animate-spin text-red-500", className)} // Use accent color
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" opacity="0.25" strokeWidth="1.5" />
      {/* Inner structure - simplified wheel spokes */}
      <line x1="12" y1="2" x2="12" y2="6" opacity="0.75" />
      <line x1="12" y1="18" x2="12" y2="22" opacity="0.75" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" opacity="0.75" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" opacity="0.75" />
      <line x1="2" y1="12" x2="6" y2="12" opacity="0.75" />
      <line x1="18" y1="12" x2="22" y2="12" opacity="0.75" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" opacity="0.75" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" opacity="0.75" />
       {/* Optional: Add a moving segment for more dynamism */}
       {/* <path d="M2 12h4l3 3 4-6 3 3h4" opacity="1" strokeWidth="2"/> */}
    </svg>
  );
};

export default LoadingSpinnerF1;
