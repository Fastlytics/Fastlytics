import React from 'react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { TireStrategy } from '@/components/race/TireStrategy';

interface StrategyTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
  favoriteDriver?: string | null;
}

export const StrategyTab: React.FC<StrategyTabProps> = ({
  year,
  eventName,
  analysisSession,
  favoriteDriver,
}) => {
  return (
    <GatedRoute
      featureName="Tire Strategy"
      description="Advanced tire strategy analysis including pit stop patterns and compound selection strategies"
    >
      <section id="strategy" className="animate-in fade-in duration-500 space-y-8">
        <TireStrategy
          year={year}
          event={eventName}
          session={analysisSession}
          favoriteDriver={favoriteDriver}
        />
      </section>
    </GatedRoute>
  );
};
