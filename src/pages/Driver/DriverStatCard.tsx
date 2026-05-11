import React from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';

interface DriverStatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  teamColor?: string;
  delay?: number;
  highlight?: boolean;
}

export const DriverStatCard: React.FC<DriverStatCardProps> = ({
  label,
  value,
  icon,
  teamColor,
  delay = 0,
  highlight = false,
}) => (
  <m.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={cn(
      'group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] transition-colors hover:border-white/[0.1]',
      highlight && 'border-red-500/20'
    )}
  >
    {teamColor && (
      <div className={cn('absolute left-0 top-0 h-0.5 w-full opacity-60', `bg-f1-${teamColor}`)} />
    )}
    <div className="relative z-10 p-4 text-center sm:p-5">
      {icon && (
        <div className="mb-2 flex justify-center">
          <span className="text-white/20">{icon}</span>
        </div>
      )}
      <div className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </div>
    </div>
  </m.div>
);
