import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  RACE_TAB_ITEMS,
  sectionVisibleFor,
  type RaceTabItem,
  type SectionVisibilityContext,
} from '@/pages/Race/race-tab-items';

export interface RaceTabStripProps {
  baseHref: string;
  selectedSession: string;
  isTestingSession: boolean;
  isTestingEvent: boolean;
  isHistorical?: boolean;
}

export function RaceTabStrip({
  baseHref,
  selectedSession,
  isTestingSession,
  isTestingEvent,
  isHistorical = false,
}: RaceTabStripProps) {
  const location = useLocation();

  const ctx: SectionVisibilityContext = {
    selectedSession,
    isTestingSession,
    isTestingEvent,
    isHistorical,
  };

  const visibleItems = RACE_TAB_ITEMS.filter((item) => sectionVisibleFor(item, ctx));

  return (
    <nav
      className="flex items-center gap-1 border-b border-white/[0.04]"
      aria-label="Race sections"
    >
      {visibleItems.map((item: RaceTabItem) => (
        <NavLink
          key={item.segment}
          to={{ pathname: `${baseHref}/${item.segment}`, search: location.search }}
          end={false}
          className={({ isActive }) =>
            cn(
              'px-4 py-3 text-[13px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-0',
              isActive
                ? 'border-b-2 border-red-400 -mb-px text-white'
                : 'text-white/60 hover:text-white'
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
