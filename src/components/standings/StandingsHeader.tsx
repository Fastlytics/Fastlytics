import { m } from 'motion/react';
import { StandingsToggle } from './StandingsToggle';

interface StandingsHeaderProps {
  title: string;
  subtitle: string;
  selectedYear: number;
}

/**
 * Page header for standings pages.
 * Matches Calendar.tsx / Dashboard.tsx title pattern (20px medium title,
 * 12px white/80 subtitle) with the Drivers/Teams toggle on the right.
 */
export const StandingsHeader: React.FC<StandingsHeaderProps> = ({
  title,
  subtitle,
  selectedYear,
}) => (
  <m.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
  >
    <div>
      <h1 className="text-[20px] font-medium tracking-[-0.01em] text-white">{title}</h1>
      <p className="mt-1 text-[12px] text-white/80">
        {subtitle} · {selectedYear}
      </p>
    </div>
    <StandingsToggle />
  </m.div>
);
