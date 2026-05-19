import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DriverTab {
  id: string;
  label: string;
}

export const DRIVER_TABS: DriverTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'championship', label: 'Championship' },
];

interface DriverTabStripProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DriverTabStrip({ activeTab, onTabChange }: DriverTabStripProps) {
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  // Animate the underline indicator to the active tab
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
      aria-label="Driver sections"
    >
      {DRIVER_TABS.map((tab) => (
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

      {/* Sliding underline indicator */}
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
