import React from 'react';
import {
  ChampionIcon,
  PlayCircle02Icon,
  TireIcon,
  ChartLineData01Icon,
  Time01Icon,
  GitCompareIcon,
  UserGroupIcon,
  Analytics01Icon,
} from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all',
      active
        ? 'bg-red-500/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(239,68,68,0.2)]'
        : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
    )}
  >
    <Icon className={cn('size-4', active ? 'text-red-400' : 'text-white/30')} />
    {label}
  </button>
);

interface TelemetryTabsProps {
  activeSection: string;
  handleSectionChange: (section: string) => void;
  selectedSession: string;
  isTestingSession: boolean;
}

export const TelemetryTabs: React.FC<TelemetryTabsProps> = ({
  activeSection,
  handleSectionChange,
  selectedSession,
  isTestingSession,
}) => {
  if (selectedSession === 'Summary') {
    return null;
  }

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 space-y-1.5">
        <NavItem
          id="overview"
          label="Overview"
          icon={ChampionIcon}
          active={activeSection === 'overview'}
          onClick={() => handleSectionChange('overview')}
        />

        <NavItem
          id="replay"
          label="Replay"
          icon={PlayCircle02Icon}
          active={activeSection === 'replay'}
          onClick={() => handleSectionChange('replay')}
        />
        {(selectedSession === 'R' || selectedSession === 'Sprint' || isTestingSession) && (
          <NavItem
            id="strategy"
            label="Strategy"
            icon={TireIcon}
            active={activeSection === 'strategy'}
            onClick={() => handleSectionChange('strategy')}
          />
        )}
        {(selectedSession === 'R' || selectedSession === 'Sprint') && (
          <NavItem
            id="positions"
            label="Positions"
            icon={ChartLineData01Icon}
            active={activeSection === 'positions'}
            onClick={() => handleSectionChange('positions')}
          />
        )}
        <NavItem
          id="laptimes"
          label="Lap Times"
          icon={Time01Icon}
          active={activeSection === 'laptimes'}
          onClick={() => handleSectionChange('laptimes')}
        />
        <NavItem
          id="dominance"
          label="Head to Head"
          icon={GitCompareIcon}
          active={activeSection === 'dominance'}
          onClick={() => handleSectionChange('dominance')}
        />
        <NavItem
          id="teampace"
          label="Team Pace"
          icon={UserGroupIcon}
          active={activeSection === 'teampace'}
          onClick={() => handleSectionChange('teampace')}
        />
        <NavItem
          id="telemetry"
          label="Telemetry"
          icon={Analytics01Icon}
          active={activeSection === 'telemetry'}
          onClick={() => handleSectionChange('telemetry')}
        />
      </div>
    </aside>
  );
};
