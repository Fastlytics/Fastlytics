import React from 'react';
import { motion } from 'framer-motion';
import { TeamPaceData } from '@/lib/api';
import { Activity, AlertTriangle } from 'lucide-react';

interface PaceAnalysisWidgetProps {
    data: TeamPaceData[] | null;
    isLoading: boolean;
    eventName: string;
}

const PaceAnalysisWidget: React.FC<PaceAnalysisWidgetProps> = ({ data, isLoading, eventName }) => {
    if (isLoading) {
        return <div className="h-64 bg-gray-900/50 animate-pulse border-2 border-gray-800"></div>;
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-64 bg-black border-2 border-gray-800 flex flex-col items-center justify-center text-gray-500">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="font-mono text-sm">No pace data available for {eventName}</p>
            </div>
        );
    }

    // Calculate gaps relative to the fastest team (index 0 after sort)
    const fastestTime = data[0].medianTime;
    const maxGap = data[data.length - 1].medianTime - fastestTime;

    return (
        <div className="bg-black border-2 border-gray-800 p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <span className="w-1 h-8 bg-red-600 block"></span>
                        Race <span className="text-gray-500">Pace</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1 uppercase">
                        {eventName} • Median Lap Time
                    </p>
                </div>
                <Activity className="text-red-600 w-6 h-6" />
            </div>

            <div className="space-y-3">
                {data.slice(0, 5).map((team, index) => {
                    const gap = team.medianTime - fastestTime;
                    const gapPercent = (gap / maxGap) * 100;
                    // Invert width logic: fastest (gap 0) should be full width? 
                    // Actually, let's show the gap visually. 
                    // Or better: Show a bar representing "Performance". 
                    // Fastest = 100%, Slowest = 0% (relative to the displayed group)

                    // Let's stick to a simple gap bar
                    // Width represents the time, so longer bar = slower? 
                    // Let's make the bar represent "Speed" -> shorter time = longer bar?
                    // Let's just visualize the gap.

                    return (
                        <div key={team.teamName} className="relative">
                            <div className="flex justify-between items-end mb-1">
                                <span className="font-bold text-sm uppercase">{team.teamName}</span>
                                <span className="font-mono text-xs text-gray-400">
                                    {index === 0 ? 'REFERENCE' : `+${gap.toFixed(3)}s`}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-900 w-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${100 - (gap * 20)}%` }} // Arbitrary scaling for visual effect
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`h-full ${index === 0 ? 'bg-red-600' : 'bg-gray-600'}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <button className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                    View Full Analysis
                </button>
            </div>
        </div>
    );
};

export default PaceAnalysisWidget;
