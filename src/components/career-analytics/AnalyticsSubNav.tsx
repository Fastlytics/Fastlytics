import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AnalyticsSubNavProps } from '@/lib/types/career-analytics';

/** Height of the main DashboardNavbar (h-16 = 64px) */
const NAVBAR_HEIGHT = 64;
/** Height of the sub-nav itself */
const SUBNAV_HEIGHT = 48;
/** Total offset for scroll calculations */
const SCROLL_OFFSET = NAVBAR_HEIGHT + SUBNAV_HEIGHT + 16;

export default function AnalyticsSubNav({
  sections,
  activeSection,
  onNavigate,
}: AnalyticsSubNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [activeSectionLocal, setActiveSectionLocal] = useState(activeSection);

  const availableSections = sections.filter((s) => s.available);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sectionElements = availableSections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section that's intersecting
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        // Pick the entry with the highest intersection ratio
        const mostVisible = visibleEntries.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best
        );

        const sectionId = mostVisible.target.id;
        if (sectionId) {
          setActiveSectionLocal(sectionId);
          onNavigate(sectionId);
        }
      },
      {
        rootMargin: `-${NAVBAR_HEIGHT + SUBNAV_HEIGHT}px 0px -40% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [availableSections, onNavigate]);

  // Auto-scroll the active button into view within the horizontal scroll container
  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = activeButtonRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        button.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeSectionLocal]);

  const handleClick = useCallback(
    (sectionId: string) => {
      const target = document.getElementById(sectionId);
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });

      setActiveSectionLocal(sectionId);
      onNavigate(sectionId);
    },
    [onNavigate]
  );

  if (availableSections.length === 0) return null;

  return (
    <nav
      className="sticky z-40 border-b border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl"
      style={{ top: `${NAVBAR_HEIGHT}px` }}
      aria-label="Analytics sections"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex gap-1 overflow-x-auto touch-pan-x"
        >
          {availableSections.map((section) => {
            const isActive = activeSectionLocal === section.id;
            return (
              <button
                key={section.id}
                ref={isActive ? activeButtonRef : undefined}
                type="button"
                onClick={() => handleClick(section.id)}
                className={cn(
                  'relative shrink-0 px-4 py-3 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors',
                  isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                {section.label}
                {isActive && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
