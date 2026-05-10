import React from 'react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { SpeedTraceChart } from '@/components/charts/SpeedTraceChart';
import { ThrottleChart } from '@/components/charts/ThrottleChart';
import { BrakeChart } from '@/components/charts/BrakeChart';
import { RPMChart } from '@/components/charts/RPMChart';
import { GearMapChart } from '@/components/charts/GearMapChart';
import { DRSChart } from '@/components/charts/DRSChart';
import { DetailedRaceResult } from '@/lib/api';

interface TelemetryTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
  selectedLap: string | number;
  sessionResults?: DetailedRaceResult[];
  favoriteDriver?: string | null;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  year,
  eventName,
  analysisSession,
  selectedLap,
  sessionResults,
  favoriteDriver,
}) => {
  const defaultDriver =
    favoriteDriver ||
    (sessionResults && sessionResults.length > 0 ? sessionResults[0].driverCode : undefined);

  return (
    <GatedRoute
      featureName="Advanced Telemetry"
      description="Complete telemetry analysis with speed traces, throttle/brake patterns, RPM curves, gear selection, and DRS deployment strategies"
    >
      <section id="telemetry" className="animate-in fade-in duration-500">
        <div className="flex flex-col gap-y-12">
          <SpeedTraceChart
            year={year}
            event={eventName}
            session={analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <ThrottleChart
            year={year}
            event={eventName}
            session={analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <BrakeChart
            year={year}
            event={eventName}
            session={analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <RPMChart
            year={year}
            event={eventName}
            session={analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <GearMapChart
            year={year}
            event={eventName}
            session={analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <DRSChart
            year={year}
            event={eventName}
            session={analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
        </div>
      </section>
    </GatedRoute>
  );
};
