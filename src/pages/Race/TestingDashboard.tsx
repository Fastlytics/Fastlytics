import React from 'react';
import { F1Card } from '@/components/race/F1Card';
import { Clock01Icon, TradeUpIcon, Calendar01Icon } from 'hugeicons-react';
import { getTeamColorClass } from '@/lib/teamColors';
import { getDriverImage } from '@/utils/imageMapping';
import { formatDistance, calculateDistance } from '@/lib/api';
import { DetailedRaceResult } from '@/lib/api';

interface TestingDashboardProps {
  testingInsights: {
    fastest: DetailedRaceResult | null;
    mileage: DetailedRaceResult | null;
    totalDistance: number;
    averageLaps: number;
    circuitLength: number;
  };
  getSessionWindowLapTime: (result: DetailedRaceResult) => string | null;
  getSessionWindowLaps: (result: DetailedRaceResult) => number;
  year: number;
}

export const TestingDashboard: React.FC<TestingDashboardProps> = ({
  testingInsights,
  getSessionWindowLapTime,
  getSessionWindowLaps,
  year,
}) => {
  const fastestLapTime = getSessionWindowLapTime(testingInsights.fastest) ?? '-';

  const mileageDistance =
    getSessionWindowLaps(testingInsights.mileage) * testingInsights.circuitLength;

  return (
    <>
      {testingInsights.fastest && (
        <F1Card
          title="FASTEST LAP"
          value={testingInsights.fastest.fullName}
          subValue={fastestLapTime}
          team={getTeamColorClass(testingInsights.fastest.team)}
          icon={<Clock01Icon />}
          imageUrl={getDriverImage(testingInsights.fastest.driverCode, year)}
        />
      )}
      {testingInsights.mileage && (
        <F1Card
          title="MILEAGE LEADER"
          value={testingInsights.mileage.fullName}
          subValue={formatDistance(mileageDistance)}
          team={getTeamColorClass(testingInsights.mileage.team)}
          icon={<TradeUpIcon />}
          imageUrl={getDriverImage(testingInsights.mileage.driverCode, year)}
        />
      )}
      <F1Card
        title="SESSION WORKLOAD"
        value={formatDistance(testingInsights.totalDistance)}
        subValue={`Avg ${testingInsights.averageLaps.toFixed(1)} laps/driver`}
        team="gray"
        icon={<Calendar01Icon />}
      />
    </>
  );
};
