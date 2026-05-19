import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TeamTab {
  id: string;
  label: string;
}

export const TEAM_TABS: TeamTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'championship', label: 'Championship' },
];

interface TeamTabStripProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TeamTabStrip({ activeTab, onTabChange }: TeamTabStripProps) {
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeTab}"]`
    );
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: elRect.left - navRect.left + navRef.current.scrollLeft,
        width: elRect.width,
      });
    }
  }, [activeTab]);

  return (
    <nav
      ref={navRef}
      className="scrollbar-hide relative flex items-center gap-0 overflow-x-auto border-b border-white/[0.04]"
      aria-label="Team sections"
    >
      {TEAM_TABS.map((tab) => (
        <button
          key={tab.id}
          data-tab-id={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative shrink-0 px-4 py-3 text-[13px] font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-0',
            activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/80'
          )}
        >
          {tab.label}
        </button>
      ))}

      <span
        className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-red-400 transition-all duration-200 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
    </nav>
  );
}
