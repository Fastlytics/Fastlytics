import React from 'react';
import { motion } from 'framer-motion';

const LapTimeSection = () => {
    // Sample data for line chart
    const points = [
        { x: 0, y1: 80, y2: 75 },
        { x: 20, y1: 70, y2: 65 },
        { x: 40, y1: 60, y2: 62 },
        { x: 60, y1: 50, y2: 55 },
        { x: 80, y1: 45, y2: 40 },
        { x: 100, y1: 30, y2: 35 },
    ];

    // Convert points to SVG path string
    const createPath = (dataKey: 'y1' | 'y2') => {
        return points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x * 4} ${p[dataKey] * 2}`
        ).join(' ');
    };

    return (
        <section className="relative py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
                            Precision <span className="text-red-600">Pace</span>
                        </h2>
                        <p className="text-xl text-gray-400 font-mono mb-8 border-l-4 border-red-600 pl-6">
                            Every millisecond counts. Compare lap times instantly to spot
                            who is pushing and who is managing.
                        </p>
                        <ul className="space-y-4 font-mono text-sm">
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>LAP-BY-LAP COMPARISON</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>SECTOR BREAKDOWNS</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>GAP EVOLUTION CHARTS</span>
                            </li>
                        </ul>
                    </div>

                    {/* Visual */}
                    <div>
                        <div className="bg-gray-900 border-2 border-gray-800 p-6 relative shadow-[-10px_10px_0px_0px_rgba(255,255,255,0.1)]">
                            <div className="absolute -top-3 -right-3 bg-white px-2 py-1 text-xs font-bold text-black uppercase">
                                Lap Comparison
                            </div>

                            {/* Line Chart Visualization */}
                            <div className="h-64 relative mt-4 bg-black/50 border border-gray-800 overflow-hidden">
                                <svg className="w-full h-full p-4" viewBox="0 0 400 200" preserveAspectRatio="none">
                                    {/* Grid */}
                                    <path d="M0 50 L400 50 M0 100 L400 100 M0 150 L400 150" stroke="#333" strokeWidth="1" />

                                    {/* Driver 1 Line (Red) */}
                                    <motion.path
                                        d={createPath('y1')}
                                        fill="none"
                                        stroke="#DC2626"
                                        strokeWidth="3"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 2, ease: "easeInOut" }}
                                    />

                                    {/* Driver 2 Line (White) */}
                                    <motion.path
                                        d={createPath('y2')}
                                        fill="none"
                                        stroke="#FFFFFF"
                                        strokeWidth="3"
                                        strokeDasharray="5 5"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                                    />
                                </svg>

                                {/* Labels */}
                                <div className="absolute bottom-2 left-4 text-xs font-mono text-gray-500">LAP 1</div>
                                <div className="absolute bottom-2 right-4 text-xs font-mono text-gray-500">LAP 10</div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 mt-4 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-red-600"></div>
                                    <span className="text-xs text-gray-400 font-mono">VERSTAPPEN</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-white border border-dashed border-gray-500"></div>
                                    <span className="text-xs text-gray-400 font-mono">HAMILTON</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export { LapTimeSection };
export default LapTimeSection;
