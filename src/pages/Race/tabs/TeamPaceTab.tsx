import React from 'react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { TeamPaceBreakdown } from '@/components/race/TeamPaceBreakdown';

interface TeamPaceTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
}

export const TeamPaceTab: React.FC<TeamPaceTabProps> = ({ year, eventName, analysisSession }) => {
  return (
    <GatedRoute
      featureName="Team Pace Analysis"
      description="Team-level pace breakdown by tyre compound and sector, with individual driver analysis"
    >
      <section id="teampace" className="animate-in fade-in duration-500">
        <TeamPaceBreakdown year={year} event={eventName} session={analysisSession} />
      </section>
    </GatedRoute>
  );
};
