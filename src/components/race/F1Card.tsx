import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CARD_CONTAINER } from '@/lib/card-styles';

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
      CARD_CONTAINER,
      'relative overflow-hidden transition-colors hover:border-white/[0.08]',
      className
    )}
    style={style}
  >
    {/* Team color accent — thin top bar */}
    <div className={cn('absolute inset-x-0 top-0 h-px', `bg-f1-${team}`)} />

    <div className="flex items-center gap-5 p-5">
      {imageUrl && (
        <Avatar className="size-16 shrink-0 rounded-lg border border-white/[0.06]">
          <AvatarImage src={imageUrl} className="object-cover object-top" />
          <AvatarFallback className="bg-white/[0.03] text-[13px] font-medium text-white/60">
            {String(value).substring(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[12px] font-medium text-white/80">{title}</div>
        <div className="truncate text-[18px] font-semibold text-white">{value}</div>
        {subValue && <div className="mt-1 text-[13px] font-medium text-white/80">{subValue}</div>}
      </div>
    </div>
  </div>
);

export { F1Card };
export default F1Card;
