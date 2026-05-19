import React from 'react';
import type { WeatherSummary } from '@/lib/api';

interface WeatherBannerProps {
  weatherData: WeatherSummary | null;
}

export const RacingWeatherBanner: React.FC<WeatherBannerProps> = ({ weatherData }) => {
  if (!weatherData) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-white/[0.04] px-4 py-2.5">
      <span className="text-[12px] font-medium text-white/60">Conditions</span>
      <span className="text-[13px] text-white">
        Air{' '}
        <span className="font-mono tabular-nums text-white">{weatherData.airTemp.toFixed(1)}°</span>
      </span>
      <span className="text-[13px] text-white">
        Track{' '}
        <span className="font-mono tabular-nums text-white">
          {weatherData.trackTemp.toFixed(1)}°
        </span>
      </span>
      <span className="text-[13px] text-white">
        Humidity{' '}
        <span className="font-mono tabular-nums text-white">
          {weatherData.humidity.toFixed(0)}%
        </span>
      </span>
      <span className="text-[13px] text-white">
        Wind{' '}
        <span className="font-mono tabular-nums text-white">
          {weatherData.windSpeed.toFixed(1)} m/s
        </span>
      </span>
      {weatherData.rainfall && <span className="text-[13px] font-medium text-blue-400">Rain</span>}
    </div>
  );
};
