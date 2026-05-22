import { useState } from 'react';
import { m } from 'motion/react';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { GatedRoute } from '@/components/common/GatedRoute';
import { SpeedTraceChart } from '@/components/charts/SpeedTraceChart';
import { ThrottleChart } from '@/components/charts/ThrottleChart';
import { BrakeChart } from '@/components/charts/BrakeChart';
import { RPMChart } from '@/components/charts/RPMChart';
import { GearMapChart } from '@/components/charts/GearMapChart';
import { DRSChart } from '@/components/charts/DRSChart';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { isDRSAvailable } from '@/lib/drs-utils';

export default function TelemetrySection() {
  const ctx = useRaceLayoutContext();
  const [selectedLap] = useState<string | number>('fastest');
  const isHistoricalSeason = ctx.year < getCurrentSeasonYear();
  const drsAvailable = isDRSAvailable(ctx.year);

  const defaultDriver =
    ctx.profile?.favorite_driver ||
    (ctx.sessionResults && ctx.sessionResults.length > 0
      ? ctx.sessionResults[0].driverCode
      : undefined);

  return (
    <GatedRoute
      featureName="Advanced Telemetry"
      description="Speed, throttle, brake, RPM, gear, and DRS data (DRS 2018-2025 only)"
      requiredTier={isHistoricalSeason ? 'pro' : undefined}
      gateShellClassName="min-h-[760px]"
    >
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-5"
      >
        {/* Speed trace — primary chart */}
        <SpeedTraceChart
          year={ctx.year}
          event={ctx.eventName}
          session={ctx.analysisSession}
          lap={selectedLap}
          initialDriver={defaultDriver}
        />

        {/* Throttle + Brake */}
        <div className="grid gap-5 lg:grid-cols-2">
          <ThrottleChart
            year={ctx.year}
            event={ctx.eventName}
            session={ctx.analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <BrakeChart
            year={ctx.year}
            event={ctx.eventName}
            session={ctx.analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
        </div>

        {/* RPM + Gear Map */}
        <div className="grid gap-5 lg:grid-cols-2">
          <RPMChart
            year={ctx.year}
            event={ctx.eventName}
            session={ctx.analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
          <GearMapChart
            year={ctx.year}
            event={ctx.eventName}
            session={ctx.analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
        </div>

        {/* DRS */}
        {drsAvailable && (
          <DRSChart
            year={ctx.year}
            event={ctx.eventName}
            session={ctx.analysisSession}
            lap={selectedLap}
            initialDriver={defaultDriver}
          />
        )}
      </m.div>
    </GatedRoute>
  );
}
