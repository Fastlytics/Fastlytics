import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { fetchTrackEvolution, TrackEvolutionResponse } from '@/lib/api'; // Import API function and types
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1";
import { AlertCircle, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper function to format seconds into MM:SS.mmm (can be shared if needed)
const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};

interface TrackEvolutionChartProps {
  className?: string;
  year: number;
  event: string;
  session: string;
}

const TrackEvolutionChart: React.FC<TrackEvolutionChartProps> = ({
  className,
  year,
  event,
  session,
}) => {

  // Fetch track evolution data
  const { data, isLoading, error, isError } = useQuery<TrackEvolutionResponse>({
    queryKey: ['trackEvolution', year, event, session],
    queryFn: () => fetchTrackEvolution(year, event, session),
    staleTime: 1000 * 60 * 15, // Cache for 15 mins
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session,
  });

  // --- Prepare data for Recharts ---
  const chartData = useMemo(() => {
    if (!data || !data.drivers) return [];

    // Combine driver rolling averages and track temp into a single array suitable for Recharts
    const combined: { [lap: number]: { lap: number, temp?: number | null, [driverCode: string]: number | null } } = {};

    // Add driver rolling averages
    data.drivers.forEach(driver => {
      driver.rollingAverageLaps.forEach(lapData => {
        if (!combined[lapData.lap]) {
          combined[lapData.lap] = { lap: lapData.lap };
        }
        combined[lapData.lap][driver.code] = lapData.time;
      });
    });

    // Add track temperature
    data.trackTemperature.forEach(tempData => {
      if (combined[tempData.lap]) {
        combined[tempData.lap].temp = tempData.temp;
      } else {
        // If a lap only has temp data (unlikely but possible), create entry
        combined[tempData.lap] = { lap: tempData.lap, temp: tempData.temp };
      }
    });

    // Convert combined object to sorted array
    return Object.values(combined).sort((a, b) => a.lap - b.lap);

  }, [data]);

  // --- Render States ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-900/50 rounded-lg">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    if (isError || !data) {
      return (
        <div className="w-full h-[400px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading track evolution data</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch analysis.'}</p>
        </div>
      );
    }
    if (chartData.length === 0 || data.drivers.length === 0) {
      return (
        <div className="w-full h-[400px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-500">
          Not enough data available for track evolution analysis.
        </div>
      );
    }

    // --- Render Chart ---
    const hasTempData = data.trackTemperature.length > 0;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis
            dataKey="lap"
            stroke="rgba(156, 163, 175, 0.7)"
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}
            padding={{ left: 10, right: 10 }}
            label={{ value: "Lap Number", position: "insideBottom", offset: -5, fill: 'rgba(156, 163, 175, 0.7)', fontSize: 12 }}
          />
          {/* Lap Time Y-Axis (Left) */}
          <YAxis
            yAxisId="left"
            stroke="rgba(156, 163, 175, 0.7)"
            tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }}
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickFormatter={formatLapTime}
            allowDecimals={true}
            width={65}
            label={{ value: "Lap Time (5-Lap Avg)", angle: -90, position: 'insideLeft', fill: 'rgba(156, 163, 175, 0.7)', fontSize: 12 }}
            reversed // Lap times decrease as track improves
          />
          {/* Track Temp Y-Axis (Right) - Conditionally Rendered */}
          {hasTempData && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgba(251, 146, 60, 0.7)" // Orange color for temp axis
              tick={{ fill: 'rgba(251, 146, 60, 0.9)', fontSize: 12 }}
              domain={['dataMin - 2', 'dataMax + 2']} // Add some padding
              unit="°C"
              width={50}
              label={{ value: "Track Temp (°C)", angle: 90, position: 'insideRight', fill: 'rgba(251, 146, 60, 0.7)', fontSize: 12 }}
            />
          )}
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', // Darker, more solid background 
              borderColor: 'rgba(71, 85, 105, 0.6)', 
              color: '#E5E7EB', 
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', // Stronger shadow
              padding: '8px 12px' // More padding 
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)', paddingBottom: '4px' }}
            itemStyle={{ padding: '3px 0' }} // More padding between items
            formatter={(value: number | null, name: string) => {
                if (name === 'Track Temp') return [`${value?.toFixed(1) ?? 'N/A'} °C`, name];
                return [formatLapTime(value), name]; // name is driver code
            }}
            labelFormatter={(label) => `Lap ${label}`}
            // Sort items by lap time (ascending, so fastest driver comes first)
            // But always keep Track Temp at the bottom
            itemSorter={(item) => {
                if (item.name === 'Track Temp') return Infinity; // Always put track temp last
                // Sort by lap time (null values at the end)
                return item.value === null ? Infinity - 1 : item.value;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {/* Driver Rolling Average Lines */}
          {data.drivers.map((driver) => (
            <Line
              key={driver.code}
              yAxisId="left"
              type="monotone"
              dataKey={driver.code}
              stroke={driver.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: driver.color }}
              name={driver.code} // Legend name
              connectNulls={true} // Connect gaps in rolling average
            />
          ))}

          {/* Track Temperature Line - Conditionally Rendered */}
          {hasTempData && (
             <Line
               key="trackTemp"
               yAxisId="right"
               type="monotone"
               dataKey="temp"
               stroke="rgba(251, 146, 60, 0.8)" // Orange color
               strokeWidth={1.5}
               strokeDasharray="5 5" // Dashed line
               dot={false}
               activeDot={false}
               name="Track Temp" // Legend name
               connectNulls={true}
             />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={cn("chart-container bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
           <Thermometer className="w-5 h-5 text-orange-400" /> Track Evolution & Temperature
        </CardTitle>
        {/* Optional: Add description or controls here */}
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
        {/* TODO: Display stint/compound analysis results below chart if implemented */}
      </CardContent>
    </Card>
  );
};

export default TrackEvolutionChart;
