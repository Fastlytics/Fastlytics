import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface F1CardProps {
  title: string;
  value: string | number;
  team: string;
  icon?: React.ReactNode;
  subValue?: string | null;
  className?: string;
  style?: React.CSSProperties;
  imageUrl?: string;
}

const F1Card = ({ title, value, team, subValue, className, style, imageUrl }: F1CardProps) => (
  <div
    className={cn(
      'group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] transition-colors hover:border-white/[0.1]',
      className
    )}
    style={style}
  >
    <div className={cn('absolute left-0 top-0 h-0.5 w-full', `bg-f1-${team}`)} />
    <div className="relative z-10 flex items-center gap-5 p-6">
      {imageUrl && (
        <Avatar className="size-20 shrink-0 rounded-xl border border-white/[0.08]">
          <AvatarImage src={imageUrl} className="object-cover object-top" />
          <AvatarFallback className="bg-[#1a1a1e] text-[14px] font-bold">
            {String(value).substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/35">
          {title}
        </div>
        <div className="truncate text-[20px] font-bold text-white">{value}</div>
        {subValue && <div className="mt-1 text-[14px] font-medium text-red-400">{subValue}</div>}
      </div>
    </div>
  </div>
);

export { F1Card };
export default F1Card;
