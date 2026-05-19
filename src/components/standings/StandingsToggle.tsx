import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Drivers', to: '/standings/drivers' },
  { label: 'Teams', to: '/standings/teams' },
] as const;

/**
 * Segmented toggle between Drivers and Teams standings.
 * Deep-linkable — active state comes from the URL, and location.search is
 * preserved on navigation so we don't strip query params.
 */
export const StandingsToggle: React.FC = () => {
  const location = useLocation();
  return (
    <div
      role="tablist"
      aria-label="Standings category"
      className="inline-flex items-center gap-1 rounded-md border border-white/[0.04] p-0.5"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={{ pathname: tab.to, search: location.search }}
          role="tab"
          className={({ isActive }) =>
            cn(
              'rounded-[5px] px-3 py-1.5 text-[12px] font-medium transition-colors duration-150',
              isActive
                ? 'bg-white/[0.06] text-white'
                : 'text-white/80 hover:bg-white/[0.02] hover:text-white'
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};
