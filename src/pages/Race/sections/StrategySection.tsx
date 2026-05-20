import { m } from 'motion/react';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { GatedRoute } from '@/components/common/GatedRoute';
import { TireStrategy } from '@/components/race/TireStrategy';
import SectionUnavailable from '@/pages/Race/SectionUnavailable';
import { RACE_TAB_ITEMS, sectionVisibleFor } from '@/pages/Race/race-tab-items';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

export default function StrategySection() {
  const ctx = useRaceLayoutContext();
  const isHistoricalSeason = ctx.year < getCurrentSeasonYear();

  const strategyItem = RACE_TAB_ITEMS.find((item) => item.segment === 'strategy')!;
  const visible = sectionVisibleFor(strategyItem, {
    selectedSession: ctx.selectedSession,
    isTestingSession: ctx.isTestingSession,
    isTestingEvent: ctx.isTestingEvent,
  });

  if (!visible) {
    return (
      <SectionUnavailable
        message="Strategy analysis requires Race, Sprint, or Testing session data."
        suggestedSession="R"
        onSwitchSession={() => ctx.setSelectedSession('R')}
      />
    );
  }

  return (
    <GatedRoute
      featureName="Tire Strategy"
      description="Pit stop patterns and compound selection"
      requiredTier={isHistoricalSeason ? 'pro' : undefined}
      gateShellClassName="min-h-[560px]"
    >
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <TireStrategy
          year={ctx.year}
          event={ctx.eventName}
          session={ctx.analysisSession}
          favoriteDriver={ctx.profile?.favorite_driver}
        />
      </m.div>
    </GatedRoute>
  );
}
