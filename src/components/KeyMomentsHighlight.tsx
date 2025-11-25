import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LapPositionDataPoint } from '@/lib/api'; // Use the correct type
import { ArrowDown, ArrowUp, Zap } from 'lucide-react';

interface KeyMomentsHighlightProps {
    lapData?: LapPositionDataPoint[]; // Use the correct type
}

const KeyMomentsHighlight: React.FC<KeyMomentsHighlightProps> = ({ lapData }) => {
    if (!lapData || lapData.length === 0) {
        return null;
    }

    let biggestGain = { driver: '', change: 0, lap: 0, from: 0, to: 0 };
    let biggestLoss = { driver: '', change: 0, lap: 0, from: 0, to: 0 };

    const positionsByLap: { [lap: number]: { [driver: string]: number } } = {};

    // Organize data by lap and driver
    lapData.forEach(lapEntry => {
        if (!positionsByLap[lapEntry.lap_number]) {
            positionsByLap[lapEntry.lap_number] = {};
        }
        positionsByLap[lapEntry.lap_number][lapEntry.driver_code] = lapEntry.position;
    });

    const laps = Object.keys(positionsByLap).map(Number).sort((a, b) => a - b);

    // Iterate through laps to find changes
    for (let i = 1; i < laps.length; i++) {
        const currentLapNumber = laps[i];
        const previousLapNumber = laps[i - 1];
        const currentLapPositions = positionsByLap[currentLapNumber];
        const previousLapPositions = positionsByLap[previousLapNumber];

        for (const driver in currentLapPositions) {
            if (previousLapPositions && driver in previousLapPositions) {
                const currentPos = currentLapPositions[driver];
                const previousPos = previousLapPositions[driver];
                const change = previousPos - currentPos; // Gain is positive, Loss is negative

                if (change > biggestGain.change) {
                    biggestGain = { driver, change, lap: currentLapNumber, from: previousPos, to: currentPos };
                }
                if (change < biggestLoss.change) {
                    biggestLoss = { driver, change, lap: currentLapNumber, from: previousPos, to: currentPos };
                }
            }
        }
    }

    // Don't render if no significant changes found
    if (biggestGain.change <= 1 && biggestLoss.change >= -1) { // Only show if gain > 1 or loss < -1
        return null;
    }

    return (
        <Card className="bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm animate-fade-in mt-4">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400"/> Key Moments</CardTitle>
                <CardDescription className="text-xs text-gray-400">Largest single-lap position changes.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {biggestGain.change > 1 ? (
                    <div className="bg-green-900/30 p-3 rounded border border-green-700/50">
                        <p className="font-semibold text-green-300 flex items-center gap-1 mb-1">
                            <ArrowUp className="w-4 h-4"/> Biggest Gain
                        </p>
                        <p><span className="font-bold">{biggestGain.driver}</span> gained <span className="font-bold">{biggestGain.change}</span> places</p>
                        <p className="text-xs text-gray-400">Moved from P{biggestGain.from} to P{biggestGain.to} on Lap {biggestGain.lap}</p>
                    </div>
                ) : (
                     <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                        <p className="font-semibold text-gray-300 flex items-center gap-1 mb-1">
                           No Significant Gains
                        </p>
                        <p className="text-xs text-gray-400">No driver gained more than 1 position in a single lap.</p>
                    </div>
                 )}

                {biggestLoss.change < -1 ? (
                    <div className="bg-red-900/30 p-3 rounded border border-red-700/50">
                        <p className="font-semibold text-red-300 flex items-center gap-1 mb-1">
                           <ArrowDown className="w-4 h-4"/> Biggest Loss
                        </p>
                        <p><span className="font-bold">{biggestLoss.driver}</span> lost <span className="font-bold">{Math.abs(biggestLoss.change)}</span> places</p>
                        <p className="text-xs text-gray-400">Moved from P{biggestLoss.from} to P{biggestLoss.to} on Lap {biggestLoss.lap}</p>
                    </div>
                ) : (
                     <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                        <p className="font-semibold text-gray-300 flex items-center gap-1 mb-1">
                           No Significant Losses
                        </p>
                         <p className="text-xs text-gray-400">No driver lost more than 1 position in a single lap.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
};

export default KeyMomentsHighlight; 