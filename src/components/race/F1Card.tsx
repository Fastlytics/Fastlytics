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
      return { color: 'text-green-500', icon: <ArrowUp01Icon className="h-4 w-4" /> };
    } else if (change < 0) {
      return { color: 'text-red-500', icon: <ArrowDown01Icon className="h-4 w-4" /> };
    } else {
      return { color: 'text-gray-500', icon: <MinusSignCircleIcon className="h-4 w-4" /> };
    }
  };

  const indicator = getChangeIndicator(points_change);

  return (
    <div
      className={cn(
        'bg-black border p-6 relative overflow-hidden group transition-all duration-300 hover:border-white border-gray-700',
        className
      )}
      style={style}
    >
      {/* Team accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', `bg-f1-${team}`)} />

      <div className="flex justify-between items-start relative z-10 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{title}</h3>
            {isRookie && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/50 text-blue-200 uppercase font-black tracking-wider border border-blue-800">
                Rookie
              </span>
            )}
          </div>
          <div className="text-2xl font-black uppercase tracking-wider text-white mb-1 font-mono">
            {value}
          </div>

          {subValue && <div className="text-sm text-red-500 font-mono font-black">{subValue}</div>}

          {indicator && (
            <div
              className={cn(
                'text-xs mt-2 flex items-center gap-1 font-black uppercase tracking-wider',
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
          <Avatar className="h-16 w-16 border border-gray-700">
            <AvatarImage src={imageUrl} className="object-cover object-top bg-black" />
            <AvatarFallback>{String(value).substring(0, 2)}</AvatarFallback>
          </Avatar>
        ) : (
          icon &&
          React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: 'w-6 h-6',
          })
        )}
      </div>
    </div>
  );
};

export { F1Card };
export default F1Card;
