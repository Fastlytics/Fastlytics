import React from 'react';
import { WidgetId, WidgetBounds, WidgetLayout } from '@/hooks/useReplayWidgets';
import { SessionReplayData } from '@/lib/api';
import { DriverFrameState } from './replay-utils';
import { normalizeBrakeValue } from './replay-math';

import WeatherOverlay from './WeatherOverlay';
import RaceControlFeed from './RaceControlFeed';
import SectorTimesPanel from './SectorTimesPanel';
import LapHistoryPanel from './LapHistoryPanel';
import TelemetryOverlay from './TelemetryOverlay';

interface ReplayWidgetRendererProps {
  id: WidgetId;
  data: SessionReplayData;
  currentTime: number;
  selectedDriver: string | null;
  liveSector: { label: string; time: number } | null;
  selectedDriverFullData: {
    speed: number[];
    throttle: number[];
    brake: number[];
    rpm: number[];
    time: number[];
  } | null;
  currentFrameDrivers: Record<string, DriverFrameState>;
  recentSpeedHistory: number[];
  recentThrottleHistory: number[];
  recentBrakeHistory: number[];
  recentRpmHistory: number[];
  liveLapTime: number | null;
  layouts: Record<WidgetId, WidgetLayout>;
  updateLayout: (id: WidgetId, updates: Partial<WidgetLayout>) => void;
  widgetBounds: WidgetBounds;
  getSeekTimeForLap: (lap: number) => number | null;
  setCurrentTime: (time: number) => void;
  onCloseWeather: () => void;
  onCloseRaceControl: () => void;
  onCloseSectors: () => void;
  onCloseLapHistory: () => void;
  onCloseTelemetry: () => void;
}

const ReplayWidgetRenderer = ({
  id,
  data,
  currentTime,
  selectedDriver,
  liveSector,
  selectedDriverFullData,
  currentFrameDrivers,
  recentSpeedHistory,
  recentThrottleHistory,
  recentBrakeHistory,
  recentRpmHistory,
  liveLapTime,
  layouts,
  updateLayout,
  widgetBounds,
  getSeekTimeForLap,
  setCurrentTime,
  onCloseWeather,
  onCloseRaceControl,
  onCloseSectors,
  onCloseLapHistory,
  onCloseTelemetry,
}: ReplayWidgetRendererProps) => {
  switch (id) {
    case 'weather':
      return (
        <WeatherOverlay
          key={id}
          weather={data.weather}
          currentTime={currentTime}
          layout={layouts.weather}
          onUpdateLayout={(u) => updateLayout('weather', u)}
          bounds={widgetBounds}
          onClose={onCloseWeather}
        />
      );
    case 'racecontrol':
      return (
        <RaceControlFeed
          key={id}
          messages={data.race_control_messages}
          currentTime={currentTime}
          onSeek={(time) => setCurrentTime(time)}
          layout={layouts.racecontrol}
          onUpdateLayout={(u) => updateLayout('racecontrol', u)}
          bounds={widgetBounds}
          onClose={onCloseRaceControl}
        />
      );
    case 'sectors':
      return (
        <SectorTimesPanel
          key={id}
          completedLaps={data.completed_laps}
          currentTime={currentTime}
          selectedDriver={selectedDriver}
          fastestSectors={data.fastest_sectors}
          liveSector={liveSector}
          layout={layouts.sectors}
          onUpdateLayout={(u) => updateLayout('sectors', u)}
          bounds={widgetBounds}
          onClose={onCloseSectors}
        />
      );
    case 'laphistory':
      return (
        <LapHistoryPanel
          key={id}
          completedLaps={data.completed_laps}
          currentTime={currentTime}
          selectedDriver={selectedDriver}
          driverData={selectedDriverFullData}
          driverColor={selectedDriver ? data.driver_colors[selectedDriver] : undefined}
          onSeekToLap={(lap) => {
            const time = getSeekTimeForLap(lap);
            if (time !== null) setCurrentTime(time);
          }}
          layout={layouts.laphistory}
          onUpdateLayout={(u) => updateLayout('laphistory', u)}
          bounds={widgetBounds}
          onClose={onCloseLapHistory}
        />
      );
    case 'telemetry':
      return (
        <TelemetryOverlay
          key={id}
          driverCode={selectedDriver}
          telemetry={
            selectedDriver && currentFrameDrivers[selectedDriver]
              ? {
                  speed: currentFrameDrivers[selectedDriver].speed,
                  gear: currentFrameDrivers[selectedDriver].gear,
                  throttle: currentFrameDrivers[selectedDriver].throttle,
                  brake: normalizeBrakeValue(currentFrameDrivers[selectedDriver].brake),
                  drs: currentFrameDrivers[selectedDriver].drs,
                  rpm: currentFrameDrivers[selectedDriver].rpm,
                }
              : null
          }
          driverColor={selectedDriver ? data.driver_colors[selectedDriver] : undefined}
          speedHistory={recentSpeedHistory}
          throttleHistory={recentThrottleHistory}
          brakeHistory={recentBrakeHistory}
          rpmHistory={recentRpmHistory}
          liveLapTime={liveLapTime}
          layout={layouts.telemetry}
          onUpdateLayout={(u) => updateLayout('telemetry', u)}
          bounds={widgetBounds}
          onClose={onCloseTelemetry}
        />
      );
    default:
      return null;
  }
};

export { ReplayWidgetRenderer };
export default ReplayWidgetRenderer;
