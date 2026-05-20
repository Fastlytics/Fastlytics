import { useState, useCallback } from 'react';
import { m } from 'motion/react';
import { useRaceLayoutContext } from '@/pages/Race/race-layout-context';
import { GatedRoute } from '@/components/common/GatedRoute';
import { CircuitComparisonChart } from '@/components/charts/CircuitComparisonChart';
import { HeadToHeadEnriched } from '@/components/race/HeadToHeadEnriched';
import { DriverComparisonTelemetry } from '@/components/race/DriverComparisonTelemetry';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

export default function HeadToHeadSection() {
  const ctx = useRaceLayoutContext();
  const isHistoricalSeason = ctx.year < getCurrentSeasonYear();

  const [circuitDrivers, setCircuitDrivers] = useState<{
    driver1: string;
    driver2: string;
    lap1: string | number;
    lap2: string | number;
    shouldLoadChart: boolean;
  }>({ driver1: '', driver2: '', lap1: 'fastest', lap2: 'fastest', shouldLoadChart: false });

  const handleDriversSelected = useCallback(
    (drivers: typeof circuitDrivers) => setCircuitDrivers(drivers),
    []
  );

  // Auto-select rival based on favourite driver
  let rivalDriverCode: string | null = null;
  const favoriteDriver = ctx.profile?.favorite_driver;
  if (favoriteDriver && ctx.sessionResults) {
    const favResult = ctx.sessionResults.find(
      (r) =>
        r.driverCode === favoriteDriver ||
        r.fullName.toLowerCase().includes(favoriteDriver.toLowerCase())
    );
    if (favResult && favResult.position) {
      const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
      const rivalResult = ctx.sessionResults.find((r) => r.position === rivalPos);
      if (rivalResult) rivalDriverCode = rivalResult.driverCode;
    }
  }

  return (
    <GatedRoute
      featureName="Head to Head"
      description="Driver comparison with telemetry overlays"
      requiredTier={isHistoricalSeason ? 'pro' : undefined}
      gateShellClassName="min-h-[760px]"
    >
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        {/* Circuit comparison — driver selector + track dominance */}
        <CircuitComparisonChart
          year={ctx.year}
          event={ctx.eventName}
          session={ctx.analysisSession}
          initialDriver1={favoriteDriver}
          initialDriver2={rivalDriverCode || undefined}
          onDriversSelected={handleDriversSelected}
        />

        {circuitDrivers.shouldLoadChart && (
          <div className="space-y-5">
            {/* Enriched head-to-head stats */}
            <HeadToHeadEnriched
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              driver1={circuitDrivers.driver1}
              driver2={circuitDrivers.driver2}
            />

            {/* Speed trace — full width */}
            <DriverComparisonTelemetry
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              driver1={circuitDrivers.driver1}
              driver2={circuitDrivers.driver2}
              lap1={circuitDrivers.lap1}
              lap2={circuitDrivers.lap2}
              shouldLoadChart={true}
              telemetryType="speed"
              title="Speed Trace"
            />

            {/* Throttle + Brake */}
            <div className="grid gap-5 lg:grid-cols-2">
              <DriverComparisonTelemetry
                year={ctx.year}
                event={ctx.eventName}
                session={ctx.analysisSession}
                driver1={circuitDrivers.driver1}
                driver2={circuitDrivers.driver2}
                lap1={circuitDrivers.lap1}
                lap2={circuitDrivers.lap2}
                shouldLoadChart={true}
                telemetryType="throttle"
                title="Throttle"
              />
              <DriverComparisonTelemetry
                year={ctx.year}
                event={ctx.eventName}
                session={ctx.analysisSession}
                driver1={circuitDrivers.driver1}
                driver2={circuitDrivers.driver2}
                lap1={circuitDrivers.lap1}
                lap2={circuitDrivers.lap2}
                shouldLoadChart={true}
                telemetryType="brake"
                title="Brake"
              />
            </div>

            {/* Gap + RPM */}
            <div className="grid gap-5 lg:grid-cols-2">
              <DriverComparisonTelemetry
                year={ctx.year}
                event={ctx.eventName}
                session={ctx.analysisSession}
                driver1={circuitDrivers.driver1}
                driver2={circuitDrivers.driver2}
                lap1={circuitDrivers.lap1}
                lap2={circuitDrivers.lap2}
                shouldLoadChart={true}
                telemetryType="gap"
                title="Gap"
              />
              <DriverComparisonTelemetry
                year={ctx.year}
                event={ctx.eventName}
                session={ctx.analysisSession}
                driver1={circuitDrivers.driver1}
                driver2={circuitDrivers.driver2}
                lap1={circuitDrivers.lap1}
                lap2={circuitDrivers.lap2}
                shouldLoadChart={true}
                telemetryType="rpm"
                title="RPM"
              />
            </div>

            {/* DRS */}
            <DriverComparisonTelemetry
              year={ctx.year}
              event={ctx.eventName}
              session={ctx.analysisSession}
              driver1={circuitDrivers.driver1}
              driver2={circuitDrivers.driver2}
              lap1={circuitDrivers.lap1}
              lap2={circuitDrivers.lap2}
              shouldLoadChart={true}
              telemetryType="drs"
              title="DRS"
            />
          </div>
        )}
      </m.div>
    </GatedRoute>
  );
}
