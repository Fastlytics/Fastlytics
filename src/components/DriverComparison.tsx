
import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend 
} from 'recharts';
import { cn } from "@/lib/utils";

interface DriverComparisonProps {
  data: any[];
  className?: string;
  delay?: number;
}

const DriverComparison: React.FC<DriverComparisonProps> = ({ 
  data, 
  className,
  delay = 0 
}) => {
  // Get the driver ids from the first data item (excluding 'attribute')
  const drivers = Object.keys(data[0] || {}).filter(key => key !== 'attribute');
  
  // Define colors for drivers
  const driverColors: Record<string, string> = {
    verstappen: '#1e41ff', // Red Bull blue
    hamilton: '#6cd3bf',   // Mercedes teal
    leclerc: '#ff2800',    // Ferrari red
    norris: '#ff8700',     // McLaren orange
    russell: '#6cd3bf',    // Mercedes teal
    sainz: '#ff2800',      // Ferrari red
    piastri: '#ff8700',    // McLaren orange
    perez: '#1e41ff',      // Red Bull blue
  };
  
  return (
    <div 
      className={cn("chart-container", className)}
      style={{ '--delay': delay } as React.CSSProperties}
    >
      <h2 className="text-lg font-semibold mb-4">Driver Performance Comparison</h2>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis 
            dataKey="attribute" 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
          />
          <PolarRadiusAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          
          {drivers.map(driver => (
            <Radar 
              key={driver}
              name={driver.charAt(0).toUpperCase() + driver.slice(1)} 
              dataKey={driver} 
              stroke={driverColors[driver] || '#888'} 
              fill={driverColors[driver] || '#888'} 
              fillOpacity={0.6} 
            />
          ))}
          
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DriverComparison;
