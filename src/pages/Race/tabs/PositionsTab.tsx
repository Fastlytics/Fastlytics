import React from 'react';
import { GatedRoute } from '@/components/common/GatedRoute';
import PositionsTabContent from '@/components/race/PositionsTabContent';

interface PositionsTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
  favoriteDriver?: string | null;
}

export const PositionsTab: React.FC<PositionsTabProps> = ({
  year,
  eventName,
  analysisSession,
  favoriteDriver,
}) => {
  return (
    <GatedRoute
      featureName="Position Tracking"
      description="Real-time position changes and overtaking opportunities throughout the race"
    >
      <section id="positions" className="animate-in fade-in duration-200">
        <PositionsTabContent
          year={year}
          event={eventName}
          session={analysisSession}
          favoriteDriver={favoriteDriver}
        />
      </section>
    </GatedRoute>
  );
};
