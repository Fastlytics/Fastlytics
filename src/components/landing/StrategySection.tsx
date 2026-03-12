import React from 'react';
import { motion } from 'framer-motion';

const StrategySection = () => {
  return (
    <section className="relative py-24 bg-black border-y-2 border-gray-800 overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(#444 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="order-2 md:order-1">
            <div className="bg-gray-900/80 border-2 border-gray-800 p-8 relative shadow-[10px_10px_0px_0px_rgba(220,38,38,0.2)] backdrop-blur-sm group hover:border-red-600/30 transition-colors duration-500">
              <div className="absolute -top-3 -left-3 bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-widest shadow-lg">
                Tire Strategy
              </div>

              {/* Stint Chart Visualization */}
              <div className="space-y-8 mt-6">
                {/* Driver 1 */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black italic text-white">VER</span>
                      <span className="text-xs font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        P1
                      </span>
                    </div>
                    <span className="text-xs font-mono text-red-500 font-bold">
                      2 STOPS // OPTIMAL
                    </span>
                  </div>

                  <div className="flex h-10 w-full rounded-sm overflow-hidden shadow-inner bg-gray-800">
                    {/* Stint 1: Medium */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '40%' }}
                      transition={{ duration: 1, delay: 0.2, ease: 'circOut' }}
                      className="h-full relative group cursor-help"
                      style={{ background: 'linear-gradient(to bottom, #EAB308, #CA8A04)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          MED
                        </span>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 z-20">
                        Laps 1-22
                      </div>
                    </motion.div>

                    {/* Pit Stop Marker */}
                    <div className="w-1 h-full bg-black z-10 relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </div>

                    {/* Stint 2: Hard */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '35%' }}
                      transition={{ duration: 1, delay: 0.4, ease: 'circOut' }}
                      className="h-full relative group cursor-help"
                      style={{ background: 'linear-gradient(to bottom, #FFFFFF, #D1D5DB)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          HARD
                        </span>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 z-20">
                        Laps 23-45
                      </div>
                    </motion.div>

                    {/* Pit Stop Marker */}
                    <div className="w-1 h-full bg-black z-10 relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </div>

                    {/* Stint 3: Soft */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '25%' }}
                      transition={{ duration: 1, delay: 0.6, ease: 'circOut' }}
                      className="h-full relative group cursor-help"
                      style={{ background: 'linear-gradient(to bottom, #DC2626, #991B1B)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          SOFT
                        </span>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 z-20">
                        Laps 46-57
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Driver 2 */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black italic text-gray-400">HAM</span>
                      <span className="text-xs font-mono text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                        P4
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">1 STOP // ALTERNATE</span>
                  </div>

                  <div className="flex h-10 w-full rounded-sm overflow-hidden shadow-inner bg-gray-800 opacity-80">
                    {/* Stint 1: Medium */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '55%' }}
                      transition={{ duration: 1, delay: 0.3, ease: 'circOut' }}
                      className="h-full relative group cursor-help"
                      style={{ background: 'linear-gradient(to bottom, #EAB308, #CA8A04)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          MED
                        </span>
                      </div>
                    </motion.div>

                    {/* Pit Stop Marker */}
                    <div className="w-1 h-full bg-black z-10 relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                    </div>

                    {/* Stint 2: Hard */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '45%' }}
                      transition={{ duration: 1, delay: 0.5, ease: 'circOut' }}
                      className="h-full relative group cursor-help"
                      style={{ background: 'linear-gradient(to bottom, #FFFFFF, #D1D5DB)' }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-black font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          HARD
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-6 mt-8 justify-center border-t border-gray-800 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_5px_rgba(220,38,38,0.5)]"></div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    Soft
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    Medium
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-gray-300 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    Hard
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 md:order-2">
            <div className="inline-block mb-4 px-3 py-1 border border-red-600 bg-red-600/10 text-red-500 font-mono text-xs font-bold tracking-widest uppercase">
              Race Intelligence
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6 text-white leading-[0.9]">
              Master the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                Strategy
              </span>
            </h2>
            <p className="text-xl text-gray-400 font-mono mb-8 border-l-4 border-red-600 pl-6 leading-relaxed">
              Analyze tire degradation, pit windows, and undercut potential. See the race before it
              happens with predictive modeling.
            </p>
            <ul className="space-y-4 font-mono text-sm text-gray-300">
              <li className="flex items-center gap-3 group">
                <span className="text-red-600 font-bold group-hover:translate-x-1 transition-transform">
                  &gt;
                </span>
                <span className="group-hover:text-white transition-colors">
                  REAL-TIME TIRE HISTORY & DEGRADATION
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <span className="text-red-600 font-bold group-hover:translate-x-1 transition-transform">
                  &gt;
                </span>
                <span className="group-hover:text-white transition-colors">
                  PIT STOP DELTA & UNDERCUT ANALYSIS
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <span className="text-red-600 font-bold group-hover:translate-x-1 transition-transform">
                  &gt;
                </span>
                <span className="group-hover:text-white transition-colors">
                  PREDICTIVE STRATEGY MODELING
                </span>
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
