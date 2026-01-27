import React from 'react';
import { motion } from 'framer-motion';

const StrategySection = () => {
    return (
        <section className="relative py-20 bg-black border-y-2 border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Visual */}
                    <div className="order-2 md:order-1">
                        <div className="bg-gray-900 border-2 border-gray-800 p-6 relative shadow-[10px_10px_0px_0px_rgba(220,38,38,0.2)]">
                            <div className="absolute -top-3 -left-3 bg-red-600 px-2 py-1 text-xs font-bold text-white uppercase">
                                Tire Strategy
                            </div>

                            {/* Stint Chart Visualization */}
                            <div className="space-y-6 mt-4">
                                {/* Driver 1 */}
                                <div>
                                    <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                                        <span>VER</span>
                                        <span>2 STOPS</span>
                                    </div>
                                    <div className="flex h-8 w-full">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '40%' }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="bg-yellow-500 h-full border-r-2 border-black relative group"
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">MED</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '35%' }}
                                            transition={{ duration: 1, delay: 0.4 }}
                                            className="bg-white h-full border-r-2 border-black relative group"
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">HARD</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '25%' }}
                                            transition={{ duration: 1, delay: 0.6 }}
                                            className="bg-red-600 h-full relative group"
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">SOFT</span>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Driver 2 */}
                                <div>
                                    <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                                        <span>HAM</span>
                                        <span>1 STOP</span>
                                    </div>
                                    <div className="flex h-8 w-full">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '55%' }}
                                            transition={{ duration: 1, delay: 0.3 }}
                                            className="bg-yellow-500 h-full border-r-2 border-black relative group"
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">MED</span>
                                        </motion.div>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '45%' }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="bg-white h-full relative group"
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-black font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">HARD</span>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 mt-6 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                    <span className="text-xs text-gray-400">SOFT</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-xs text-gray-400">MEDIUM</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                    <span className="text-xs text-gray-400">HARD</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="order-1 md:order-2">
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
                            Master the <span className="text-red-600">Strategy</span>
                        </h2>
                        <p className="text-xl text-gray-400 font-mono mb-8 border-l-4 border-red-600 pl-6">
                            Analyze tire degradation, pit windows, and undercut potential.
                            See the race before it happens.
                        </p>
                        <ul className="space-y-4 font-mono text-sm">
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>REAL-TIME TIRE HISTORY</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>PIT STOP DELTA ANALYSIS</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-red-600 font-bold">&gt;</span>
                                <span>PREDICTIVE STRATEGY MODELING</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export { StrategySection };
export default StrategySection;
