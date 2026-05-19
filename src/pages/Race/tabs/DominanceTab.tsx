import React from 'react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { CircuitComparisonChart } from '@/components/charts/CircuitComparisonChart';
import { HeadToHeadEnriched } from '@/components/race/HeadToHeadEnriched';
import { DriverComparisonTelemetry } from '@/components/race/DriverComparisonTelemetry';
import { DetailedRaceResult } from '@/lib/api';

interface DominanceTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
  sessionResults?: DetailedRaceResult[];
  favoriteDriver?: string | null;
  circuitDrivers: {
    driver1: string;
    driver2: string;
    lap1: string | number;
    lap2: string | number;
    shouldLoadChart: boolean;
  };
  onCircuitDriversSelected: (drivers: {
    driver1: string;
    driver2: string;
    lap1: string | number;
    lap2: string | number;
    shouldLoadChart: boolean;
  }) => void;
}

export const DominanceTab: React.FC<DominanceTabProps> = ({
  year,
  eventName,
  analysisSession,
  sessionResults,
  favoriteDriver,
  circuitDrivers,
  onCircuitDriversSelected,
}) => {
  let rivalDriverCode: string | null = null;

  if (favoriteDriver && sessionResults) {
    const favResult = sessionResults.find(
      (r) =>
        r.driverCode === favoriteDriver ||
        r.fullName.toLowerCase().includes(favoriteDriver.toLowerCase())
    );
    if (favResult && favResult.position) {
      // Rival is the driver ahead (pos - 1), or behind (pos + 1) if P1
      const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
      const rivalResult = sessionResults.find((r) => r.position === rivalPos);
      if (rivalResult) rivalDriverCode = rivalResult.driverCode;
    }
  }

  return (
    <GatedRoute
      featureName="Head to Head Analysis"
      description="Driver comparison and dominance analysis with detailed telemetry overlays including speed, throttle, brake, and DRS patterns"
    >
      <section id="dominance" className="animate-in fade-in duration-200">
        <div className="space-y-6">
          <CircuitComparisonChart
            year={year}
            event={eventName}
            session={analysisSession}
            initialDriver1={favoriteDriver}
            initialDriver2={rivalDriverCode || undefined}
            onDriversSelected={onCircuitDriversSelected}
          />

          {/* Comparison Charts if selected */}
          {circuitDrivers.shouldLoadChart && (
            <div className="space-y-6">
              {/* Race Performance Summary */}
              <HeadToHeadEnriched
                year={year}
                event={eventName}
                session={analysisSession}
                driver1={circuitDrivers.driver1}
                driver2={circuitDrivers.driver2}
              />

              {/* Speed Trace - Full Width */}
              <DriverComparisonTelemetry
                year={year}
                event={eventName}
                session={analysisSession}
                driver1={circuitDrivers.driver1}
                driver2={circuitDrivers.driver2}
                lap1={circuitDrivers.lap1}
                lap2={circuitDrivers.lap2}
                shouldLoadChart={true}
                telemetryType="speed"
                title="Speed Trace"
              />

              {/* Other Telemetry - Stacked */}
              <div className="space-y-6">
                <DriverComparisonTelemetry
                  year={year}
                  event={eventName}
                  session={analysisSession}
                  driver1={circuitDrivers.driver1}
                  driver2={circuitDrivers.driver2}
                  lap1={circuitDrivers.lap1}
                  lap2={circuitDrivers.lap2}
                  shouldLoadChart={true}
                  telemetryType="gap"
                  title="Gap"
                />
                <DriverComparisonTelemetry
                  year={year}
                  event={eventName}
                  session={analysisSession}
                  driver1={circuitDrivers.driver1}
                  driver2={circuitDrivers.driver2}
                  lap1={circuitDrivers.lap1}
                  lap2={circuitDrivers.lap2}
                  shouldLoadChart={true}
                  telemetryType="throttle"
                  title="Throttle"
                />
                <DriverComparisonTelemetry
                  year={year}
                  event={eventName}
                  session={analysisSession}
                  driver1={circuitDrivers.driver1}
                  driver2={circuitDrivers.driver2}
                  lap1={circuitDrivers.lap1}
                  lap2={circuitDrivers.lap2}
                  shouldLoadChart={true}
                  telemetryType="brake"
                  title="Brake"
                />
                <DriverComparisonTelemetry
                  year={year}
                  event={eventName}
                  session={analysisSession}
                  driver1={circuitDrivers.driver1}
                  driver2={circuitDrivers.driver2}
                  lap1={circuitDrivers.lap1}
                  lap2={circuitDrivers.lap2}
                  shouldLoadChart={true}
                  telemetryType="rpm"
                  title="RPM"
                />
                <DriverComparisonTelemetry
                  year={year}
                  event={eventName}
                  session={analysisSession}
                  driver1={circuitDrivers.driver1}
                  driver2={circuitDrivers.driver2}
                  lap1={circuitDrivers.lap1}
                  lap2={circuitDrivers.lap2}
                  shouldLoadChart={true}
                  telemetryType="drs"
                  title="DRS"
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </GatedRoute>
  );
};
