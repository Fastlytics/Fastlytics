import { Add01Icon, MinusSignIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface PointsChangeProps {
  change?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Inline `+N` / `-N` pill shown next to a points value.
 *
 * Visual rules:
 *   positive → emerald,  `+` icon, absolute number
 *   negative → red,      `-` icon, absolute number
 *   zero     → nothing (keeps the row quiet)
 *   undefined → nothing
 */
export const PointsChange: React.FC<PointsChangeProps> = ({ change, size = 'md', className }) => {
  if (change === undefined || change === 0) return null;

  const isGain = change > 0;
  const iconSize = size === 'sm' ? 'size-2.5' : 'size-3';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const color = isGain ? 'text-emerald-400' : 'text-red-400';
  const Icon = isGain ? Add01Icon : MinusSignIcon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono tabular-nums',
        color,
        textSize,
        className
      )}
    >
      <Icon className={cn(iconSize, 'shrink-0')} strokeWidth={3} />
      {Math.abs(change)}
    </span>
  );
};
