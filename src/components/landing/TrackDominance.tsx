import React from 'react';
import { motion } from 'framer-motion';

const TrackDominance = () => {
    // Simplified track path (like Bahrain or generic circuit)
    const trackPath = "M150 100 L400 100 Q450 100 450 150 L450 300 Q450 350 400 350 L200 350 Q150 350 150 300 L150 250 Q150 200 100 200 L50 200 Q20 200 20 150 L20 130 Q20 100 50 100 Z";

    return (
        <div className="w-full max-w-5xl mx-auto bg-gray-900/50 border-2 border-gray-800 p-8 md:p-12 relative overflow-hidden group hover:border-red-600/50 transition-colors duration-500">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}>
            </div>

            <div className="relative z-10 grid md:grid-cols-3 gap-8 items-center">
                {/* Text Info */}
                <div className="col-span-1 space-y-6">
                    <div className="border-l-4 border-red-600 pl-4">
                        <h3 className="text-2xl font-bold uppercase text-white mb-2">Dominance Map</h3>
                        <p className="text-gray-400 font-mono text-sm">
                            Live visualization of sector dominance.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-red-600 skew-x-[-10deg]"></div>
                            <span className="font-mono text-sm text-white">VERSTAPPEN</span>
                            <span className="font-bold text-red-600 ml-auto">1:32.455</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-blue-600 skew-x-[-10deg]"></div>
                            <span className="font-mono text-sm text-white">LECLERC</span>
                            <span className="font-bold text-blue-600 ml-auto">+0.124</span>
                        </div>
                    </div>
                </div>

                {/* Animation Container */}
                <div className="col-span-2 h-[300px] md:h-[400px] flex items-center justify-center relative">
                    <svg viewBox="0 0 500 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                        {/* Base Track */}
                        <path
                            d={trackPath}
                            fill="none"
                            stroke="#333"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Animated Segments - Simulating dominance */}
                        {/* Segment 1 - Red Dominance */}
                        <motion.path
                            d="M150 100 L400 100 Q450 100 450 150"
                            fill="none"
                            stroke="#DC2626"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />

                        {/* Segment 2 - Blue Dominance */}
                        <motion.path
                            d="M450 150 L450 300 Q450 350 400 350"
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 1.5, ease: "easeInOut" }}
                        />

                        {/* Segment 3 - Red Dominance */}
                        <motion.path
                            d="M400 350 L200 350 Q150 350 150 300 L150 250"
                            fill="none"
                            stroke="#DC2626"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 3.0, ease: "easeInOut" }}
                        />

                        {/* Segment 4 - Blue Dominance */}
                        <motion.path
                            d="M150 250 Q150 200 100 200 L50 200 Q20 200 20 150 L20 130 Q20 100 50 100 L150 100"
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            whileInView={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 4.5, ease: "easeInOut" }}
                        />

                        {/* Moving Car Marker */}
                        <motion.circle
                            r="6"
                            fill="#fff"
                            filter="drop-shadow(0 0 4px #fff)"
                        >
                            <animateMotion
                                dur="6s"
                                repeatCount="indefinite"
                                path={trackPath}
                            />
                        </motion.circle>
                    </svg>

                    {/* Floating Labels */}
                    <motion.div
                        className="absolute top-10 right-10 bg-black/80 border border-red-600 px-3 py-1 text-xs font-bold text-red-500"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 }}
                    >
                        SECTOR 1
                    </motion.div>

                    <motion.div
                        className="absolute bottom-10 right-20 bg-black/80 border border-blue-600 px-3 py-1 text-xs font-bold text-blue-500"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2.5 }}
                    >
                        SECTOR 2
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default TrackDominance;
