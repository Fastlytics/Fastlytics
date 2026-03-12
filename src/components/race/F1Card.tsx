import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon } from 'hugeicons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface F1CardProps {
  title: string;
  value: string | number;
  team:
    | 'ferrari'
    | 'mercedes'
    | 'mclaren'
    | 'redbull'
    | 'astonmartin'
    | 'alpine'
    | 'williams'
    | 'haas'
    | 'alfaromeo'
    | 'alphatauri'
    | 'gray';
  icon?: React.ReactNode;
  points_change?: number;
  subValue?: string | null;
  className?: string;
  style?: React.CSSProperties;
  isRookie?: boolean;
  imageUrl?: string;
}

const F1Card = ({
  title,
  value,
  team,
  icon,
  points_change,
  subValue,
  className,
  style,
  isRookie,
  imageUrl,
}: F1CardProps) => {
  const getChangeIndicator = (change: number | undefined) => {
    if (change === undefined) {
      return null;
    }
    if (change > 0) {
      return { color: 'text-green-400', icon: <ArrowUp01Icon className="h-4 w-4" /> };
    } else if (change < 0) {
      return { color: 'text-red-400', icon: <ArrowDown01Icon className="h-4 w-4" /> };
    } else {
      return { color: 'text-neutral-400', icon: <MinusSignCircleIcon className="h-4 w-4" /> };
    }
  };

  const indicator = getChangeIndicator(points_change);

  return (
    <div
      className={cn(
        'relative overflow-hidden group transition-all duration-300',
        'bg-neutral-950 border border-neutral-800 hover:border-neutral-600',
        'rounded-lg',
        className
      )}
      style={style}
    >
      {/* Team accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-0.5', `bg-f1-${team}`)} />
      {/* Subtle team color glow on hover */}
      <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500', `bg-f1-${team}`)} />

      <div className="flex justify-between items-start relative z-10 p-5 pt-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            {icon && React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: cn('w-3.5 h-3.5', `text-f1-${team === 'gray' ? 'gray' : team}`),
            })}
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{title}</h3>
            {isRookie && (
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 uppercase font-semibold tracking-wider rounded">
                Rookie
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white mb-1 tracking-tight truncate">
            {value}
          </div>

          {subValue && (
            <div className="text-sm text-neutral-300 font-mono font-medium tracking-wide">
              {subValue}
            </div>
          )}

          {indicator && (
            <div
              className={cn(
                'text-xs mt-3 flex items-center gap-1 font-semibold',
                indicator.color
              )}
              title="Points Change"
            >
              {indicator.icon}
              <span>{points_change !== 0 ? Math.abs(points_change ?? 0) : '-'}</span>
            </div>
          )}
        </div>

        {imageUrl ? (
          <Avatar className="h-20 w-20 rounded-lg border border-neutral-800 ml-3 shrink-0">
            <AvatarImage src={imageUrl} className="object-cover object-top bg-neutral-900" />
            <AvatarFallback className="bg-neutral-900 text-neutral-500 text-sm font-mono rounded-lg">{String(value).substring(0, 3)}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </div>
  );
};

export { F1Card };
export default F1Card;
