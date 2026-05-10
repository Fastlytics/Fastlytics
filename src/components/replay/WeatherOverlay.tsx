import React, { useMemo } from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudSun,
  CloudLightning,
  CloudFog,
  ArrowUp,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import WidgetShell from './WidgetShell';
import { WidgetBounds, WidgetLayout } from '@/hooks/useReplayWidgets';

interface WeatherData {
  time: number;
  air_temp: number | null;
  track_temp: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  rainfall: boolean;
}

interface WeatherOverlayProps {
  weather: WeatherData[] | undefined;
  currentTime: number;
  layout: WidgetLayout;
  onUpdateLayout: (updates: Partial<WidgetLayout>) => void;
  bounds: WidgetBounds;
  onClose?: () => void;
}

const lerp = (start: number, end: number, alpha: number) => start + (end - start) * alpha;

const lerpNullable = (start: number | null, end: number | null, alpha: number) => {
  if (start === null) return end;
  if (end === null) return start;
  return lerp(start, end, alpha);
};

const lerpAngle = (start: number | null, end: number | null, alpha: number) => {
  if (start === null) return end;
  if (end === null) return start;
  const delta = ((((end - start) % 360) + 540) % 360) - 180;
  return (start + delta * alpha + 360) % 360;
};

function interpolateWeather(weather: WeatherData[], currentTime: number): WeatherData | null {
  if (weather.length === 0) return null;
  if (currentTime <= weather[0].time) return weather[0];

  const lastIndex = weather.length - 1;
  if (currentTime >= weather[lastIndex].time) return weather[lastIndex];

  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sampleTime = weather[mid].time;

    if (sampleTime === currentTime) return weather[mid];
    if (sampleTime < currentTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const prev = weather[Math.max(0, high)];
  const next = weather[Math.min(lastIndex, low)];
  const alpha = next.time === prev.time ? 0 : (currentTime - prev.time) / (next.time - prev.time);

  return {
    time: currentTime,
    air_temp: lerpNullable(prev.air_temp, next.air_temp, alpha),
    track_temp: lerpNullable(prev.track_temp, next.track_temp, alpha),
    humidity: lerpNullable(prev.humidity, next.humidity, alpha),
    pressure: lerpNullable(prev.pressure, next.pressure, alpha),
    wind_speed: lerpNullable(prev.wind_speed, next.wind_speed, alpha),
    wind_direction: lerpAngle(prev.wind_direction, next.wind_direction, alpha),
    rainfall: prev.rainfall,
  };
}

const getWeatherIcon = (rainfall: boolean, temp: number | null, wind: number | null) => {
  if (rainfall) return <CloudRain size={18} className="text-blue-400" />;
  if (wind && wind > 8) return <CloudLightning size={18} className="text-yellow-400" />;
  if (temp && temp > 30) return <Sun size={18} className="text-orange-400" />;
  if (temp && temp < 15) return <CloudFog size={18} className="text-zinc-400" />;
  return <CloudSun size={18} className="text-yellow-300" />;
};

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({
  weather,
  currentTime,
  layout,
  onUpdateLayout,
  bounds,
  onClose,
}) => {
  const currentWeather = useMemo(() => {
    if (!weather || weather.length === 0) return null;
    return interpolateWeather(weather, currentTime);
  }, [weather, currentTime]);

  if (!currentWeather) return null;

  const { air_temp, track_temp, humidity, wind_speed, wind_direction, rainfall, pressure } =
    currentWeather;

  const weatherItems = [
    {
      icon: <Thermometer size={14} className="text-orange-400" />,
      label: 'Track',
      value: track_temp !== null ? `${track_temp.toFixed(1)}°C` : '-',
      color: 'text-orange-300',
    },
    {
      icon: <Thermometer size={14} className="text-blue-400" />,
      label: 'Air',
      value: air_temp !== null ? `${air_temp.toFixed(1)}°C` : '-',
      color: 'text-blue-300',
    },
    {
      icon: <Droplets size={14} className="text-cyan-400" />,
      label: 'Humidity',
      value: humidity !== null ? `${humidity.toFixed(0)}%` : '-',
      color: 'text-cyan-300',
    },
    {
      icon: <Wind size={14} className="text-emerald-400" />,
      label: 'Wind',
      value: wind_speed !== null ? `${wind_speed.toFixed(1)} m/s` : '-',
      color: 'text-emerald-300',
      extra:
        wind_direction !== null ? (
          <ArrowUp
            size={10}
            className="text-white/40 inline-block ml-1"
            style={{ transform: `rotate(${wind_direction}deg)` }}
          />
        ) : null,
    },
    {
      icon: <Gauge size={14} className="text-purple-400" />,
      label: 'Pressure',
      value: pressure !== null ? `${pressure.toFixed(0)} hPa` : '-',
      color: 'text-purple-300',
    },
  ];

  return (
    <WidgetShell
      title="Conditions"
      icon={getWeatherIcon(rainfall, air_temp, wind_speed)}
      layout={layout}
      bounds={bounds}
      onUpdateLayout={onUpdateLayout}
      onClose={onClose}
    >
      <div className="flex flex-col h-full gap-2">
        {/* Main weather display */}
        <div className="flex items-center gap-3 pb-2 border-b border-white/[0.04]">
          <div className="size-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
            {getWeatherIcon(rainfall, air_temp, wind_speed)}
          </div>
          <div>
            <div className="text-[11px] text-white/40 uppercase tracking-wider">
              {rainfall ? 'Rain' : 'Dry'}
            </div>
            <div className="text-[13px] font-semibold text-white">
              {track_temp !== null ? `${track_temp.toFixed(1)}°C` : '—'} Track
            </div>
          </div>
        </div>

        {/* Grid of metrics */}
        <div className="grid grid-cols-2 gap-2">
          {weatherItems.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex flex-col gap-1 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]',
                'hover:bg-white/[0.04] transition-colors'
              )}
            >
              <div className="flex items-center gap-1.5">
                {item.icon}
                <span className="text-[9px] text-white/40 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center">
                <span className={cn('text-[13px] font-semibold tabular-nums', item.color)}>
                  {item.value}
                </span>
                {item.extra}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
};

export default WeatherOverlay;
