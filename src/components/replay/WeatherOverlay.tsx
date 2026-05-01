import React, { useMemo } from 'react';
import { CloudRain, Thermometer, Droplets, Wind, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/useDraggable';

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
  className?: string;
}

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ weather, currentTime, className }) => {
  const { position, isDragging, handleMouseDown } = useDraggable({ x: 12, y: 12 });

  const currentWeather = useMemo(() => {
    if (!weather || weather.length === 0) return null;

    let closest = weather[0];
    let minDiff = Math.abs(weather[0].time - currentTime);

    for (const w of weather) {
      const diff = Math.abs(w.time - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = w;
      }
    }

    return closest;
  }, [weather, currentTime]);

  if (!currentWeather) return null;

  const { air_temp, track_temp, humidity, wind_speed, rainfall } = currentWeather;

  const items: { icon: React.ReactNode; label: string; value: string; active?: boolean }[] = [];

  if (track_temp !== null) {
    items.push({
      icon: <Thermometer size={12} />,
      label: 'Track',
      value: `${track_temp.toFixed(1)}°C`,
    });
  }

  if (air_temp !== null) {
    items.push({
      icon: <Thermometer size={12} />,
      label: 'Air',
      value: `${air_temp.toFixed(1)}°C`,
    });
  }

  if (humidity !== null) {
    items.push({
      icon: <Droplets size={12} />,
      label: 'Humidity',
      value: `${humidity.toFixed(0)}%`,
    });
  }

  if (wind_speed !== null) {
    items.push({
      icon: <Wind size={12} />,
      label: 'Wind',
      value: `${wind_speed.toFixed(1)} m/s`,
    });
  }

  if (rainfall) {
    items.push({
      icon: <CloudRain size={12} />,
      label: 'Rain',
      value: 'Active',
      active: true,
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      className={cn('absolute z-20', isDragging ? 'cursor-grabbing' : 'cursor-default', className)}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-[#0c0c0e]/90 backdrop-blur border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04]" data-grip>
          <GripVertical size={12} className="text-white cursor-grab" />
          <span className="text-[10px] font-normal uppercase tracking-wider text-white">
            Conditions
          </span>
        </div>
        <div className="flex flex-col">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] last:border-b-0"
            >
              <span className={cn('text-white', item.active && 'text-blue-400')}>{item.icon}</span>
              <span className="text-[11px] text-white font-normal min-w-[50px]">{item.label}</span>
              <span
                className={cn(
                  'text-[11px] font-mono font-medium tabular-nums ml-auto',
                  item.active ? 'text-blue-400' : 'text-white'
                )}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherOverlay;
