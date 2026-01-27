import React from 'react';
import { motion } from 'framer-motion';

const SpeedTraceSection = () => {
    return (
        <section className="relative py-20 bg-black border-y-2 border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Visual */}
                    <div className="order-2 md:order-1">
                        <div className="bg-gray-900 border-2 border-gray-800 p-6 relative shadow-[10px_10px_0px_0px_rgba(220,38,38,0.2)]">
                            <div className="absolute -top-3 -left-3 bg-red-600 px-2 py-1 text-xs font-bold text-white uppercase">
                                Telemetry
                            </div>

                            {/* Speed Trace Graph Visualization */}
                            <div className="h-64 relative mt-4 bg-black/50 border border-gray-800">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                                    {[...Array(16)].map((_, i) => (
                                        <div key={i} className="border-r border-b border-gray-800/30"></div>
                                    ))}
                                </div>

                                {/* Speed Trace Line SVG */}
                                <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <motion.path
                                        d="M0,80 C10,80 15,20 20,20 L25,20 C30,20 35,90 40,90 L45,90 C50,90 55,30 60,30 L65,30 C70,30 75,85 80,85 L85,85 C90,85 95,40 100,40"
                                        fill="none"
                                        stroke="#DC2626"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 2, ease: "easeInOut" }}
                                    />
                                    <motion.path
                                        d="M0,82 C10,82 15,25 20,25 L25,25 C30,25 35,88 40,88 L45,88 C50,88 55,35 60,35 L65,35 C70,35 75,82 80,82 L85,82 C90,82 95,45 100,45"
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="2"
                                        strokeDasharray="4 2"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                                    />
                                </svg>

                                {/* Axis Labels */}
                                <div className="absolute bottom-1 right-2 text-[10px] text-gray-500 font-mono">DISTANCE (m)</div>
                                <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-mono">SPEED (km/h)</div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="order-1 md:order-2">
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
                            Deep <span className="text-red-600">Telemetry</span>
                        </h2>
                        <p className="text-xl text-gray-400 font-mono mb-8 border-l-4 border-red-600 pl-6">
                            Go beyond the broadcast. Analyze throttle traces, braking points,
                            and cornering speeds with professional-grade telemetry.
                        </p>
                        <ul className="space-y-4 font-mono text-sm">
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>SPEED vs DISTANCE TRACES</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>THROTTLE & BRAKE INPUTS</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>DRS ACTIVATION ZONES</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export { SpeedTraceSection };
export default SpeedTraceSection;
