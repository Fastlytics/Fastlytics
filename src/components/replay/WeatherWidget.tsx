import React from 'react';
import type { ReplayWeather } from '@/lib/api';

interface WeatherWidgetProps {
  weather: ReplayWeather;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  return (
    <div className="bg-black/70 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 text-xs font-sans min-w-[120px]">
      <div className="flex items-center gap-1 text-white mb-1">
        <span className="text-[9px] uppercase tracking-wider">Weather</span>
        {weather.rainfall && <span className="text-blue-400">💧</span>}
      </div>

      <div className="space-y-0.5">
        {weather.air_temp != null && (
          <div className="flex justify-between text-white">
            <span className="text-white/60">Air</span>
            <span>{weather.air_temp.toFixed(1)}°C</span>
          </div>
        )}

        {weather.track_temp != null && (
          <div className="flex justify-between text-white">
            <span className="text-white/60">Track</span>
            <span>{weather.track_temp.toFixed(1)}°C</span>
          </div>
        )}

        {weather.humidity != null && (
          <div className="flex justify-between text-white">
            <span className="text-white/60">Hum</span>
            <span>{weather.humidity.toFixed(0)}%</span>
          </div>
        )}

        {weather.wind_speed != null && (
          <div className="flex justify-between text-white">
            <span className="text-white/60">Wind</span>
            <span className="flex items-center gap-1">
              {weather.wind_speed.toFixed(1)} m/s
              {weather.wind_direction != null && (
                <span
                  className="inline-block text-[10px]"
                  style={{ transform: `rotate(${weather.wind_direction}deg)` }}
                >
                  ↑
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
