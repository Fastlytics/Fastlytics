import React from 'react';
import type { WeatherSummary } from '@/lib/api';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

interface WeatherBannerProps {
  weatherData: WeatherSummary | null;
}

export const RacingWeatherBanner: React.FC<WeatherBannerProps> = ({ weatherData }) => {
  if (!weatherData) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px]"
      style={inter}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
        Conditions
      </span>
      <span>
        Air <span className="text-white font-semibold">{weatherData.airTemp.toFixed(1)}°C</span>
      </span>
      <span>
        Track <span className="text-white font-semibold">{weatherData.trackTemp.toFixed(1)}°C</span>
      </span>
      <span>
        Hum <span className="text-white font-semibold">{weatherData.humidity.toFixed(0)}%</span>
      </span>
      <span>
        Wind{' '}
        <span className="text-white font-semibold">{weatherData.windSpeed.toFixed(1)} m/s</span>
      </span>
      {weatherData.rainfall && <span className="text-blue-400 font-semibold">Rain</span>}
    </div>
  );
};
