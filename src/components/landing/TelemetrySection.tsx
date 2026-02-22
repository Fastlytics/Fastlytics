import React from 'react';
import { motion } from 'framer-motion';

const TelemetrySection = () => {
  // Complex speed trace data simulation
  // Using a more detailed path to simulate a real lap trace
  const tracePath1 =
    'M0,80 C20,80 25,20 30,20 L35,20 C40,20 45,85 50,85 L55,85 C60,85 65,30 70,30 L75,30 C80,30 85,80 90,80 L95,80 C100,80 105,40 110,40 L115,40 C120,40 125,75 130,75 L135,75 C140,75 145,25 150,25 L155,25 C160,25 165,85 170,85 L175,85 C180,85 185,35 190,35 L195,35 C200,35 205,80 210,80 L215,80 C220,80 225,45 230,45 L235,45 C240,45 245,70 250,70';

  const tracePath2 =
    'M0,82 C20,82 25,25 30,25 L35,25 C40,25 45,88 50,88 L55,88 C60,88 65,35 70,35 L75,35 C80,35 85,82 90,82 L95,82 C100,82 105,45 110,45 L115,45 C120,45 125,78 130,78 L135,78 C140,78 145,30 150,30 L155,30 C160,30 165,88 170,88 L175,88 C180,88 185,40 190,40 L195,40 C200,40 205,82 210,82 L215,82 C220,82 225,48 230,48 L235,48 C240,48 245,72 250,72';

  return (
    <section className="relative py-24 bg-black border-t-2 border-gray-800 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-900/20 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <div className="inline-block mb-4 px-3 py-1 border border-red-600 bg-red-600/10 text-red-500 font-mono text-xs font-bold tracking-widest uppercase">
              Data Analysis
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6 text-white leading-[0.9]">
              Precision{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                Telemetry
              </span>
            </h2>
            <p className="text-xl text-gray-400 font-mono mb-8 border-l-4 border-red-600 pl-6 leading-relaxed">
              Go beyond the broadcast. Analyze throttle traces, braking points, gear shifts, and
              cornering speeds with professional-grade telemetry.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900/50 border border-gray-800 p-4 hover:border-red-600/50 transition-colors group">
                <div className="text-red-600 font-bold text-2xl mb-1 group-hover:translate-x-1 transition-transform">
                  0.001s
                </div>
                <div className="text-gray-500 text-xs font-mono uppercase tracking-wider">
                  Data Granularity
                </div>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 p-4 hover:border-red-600/50 transition-colors group">
                <div className="text-red-600 font-bold text-2xl mb-1 group-hover:translate-x-1 transition-transform">
                  LIVE
                </div>
                <div className="text-gray-500 text-xs font-mono uppercase tracking-wider">
                  Sync Speed
                </div>
              </div>
            </div>

            <ul className="space-y-4 font-mono text-sm text-gray-300">
              <li className="flex items-center gap-3 group">
                <span className="w-1.5 h-1.5 bg-red-600 rotate-45 group-hover:scale-150 transition-transform"></span>
                <span className="group-hover:text-white transition-colors">
                  MULTI-DRIVER OVERLAY COMPARISON
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <span className="w-1.5 h-1.5 bg-red-600 rotate-45 group-hover:scale-150 transition-transform"></span>
                <span className="group-hover:text-white transition-colors">
                  THROTTLE & BRAKE INPUT TRACES
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <span className="w-1.5 h-1.5 bg-red-600 rotate-45 group-hover:scale-150 transition-transform"></span>
                <span className="group-hover:text-white transition-colors">
                  CORNER ANALYSIS & DELTA TIMING
                </span>
              </li>
            </ul>
          </div>

          {/* Visualization */}
          <div className="order-1 lg:order-2">
            <div className="bg-gray-900 border-2 border-gray-800 p-1 relative shadow-[20px_20px_0px_0px_rgba(20,20,20,1)] group">
              {/* Header Bar */}
              <div className="bg-black border-b border-gray-800 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono font-bold text-gray-300">
                    SPEED TRACE // LAP 14
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-red-600"></div>
                    <span className="text-[10px] font-mono text-gray-500">VER</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-gray-500"></div>
                    <span className="text-[10px] font-mono text-gray-500">HAM</span>
                  </div>
                </div>
              </div>

              {/* Graph Container */}
              <div className="h-[300px] bg-black relative overflow-hidden">
                {/* Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="border-r border-b border-gray-800/20"></div>
                  ))}
                </div>

                {/* SVG Graph */}
                <svg
                  className="absolute inset-0 w-full h-full p-6"
                  viewBox="0 0 250 100"
                  preserveAspectRatio="none"
                >
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity="1" />
                      <stop offset="100%" stopColor="#991B1B" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  {/* Driver 2 (Ghost) */}
                  <motion.path
                    d={tracePath2}
                    fill="none"
                    stroke="#4B5563"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
                  />

                  {/* Driver 1 (Main) */}
                  <motion.path
                    d={tracePath1}
                    fill="none"
                    stroke="url(#traceGradient)"
                    strokeWidth="2.5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    filter="drop-shadow(0 0 4px rgba(220, 38, 38, 0.5))"
                  />

                  {/* Active Data Point */}
                  <motion.circle
                    cx="150"
                    cy="25"
                    r="3"
                    fill="#fff"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                  </motion.circle>
                </svg>

                {/* Gear Shift Map (Bottom Strip) */}
                <div className="absolute bottom-0 left-0 right-0 h-6 border-t border-gray-800 flex">
                  {[8, 7, 6, 5, 4, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 8].map(
                    (gear, i) => (
                      <div
                        key={i}
                        className={`flex-1 flex items-center justify-center text-[8px] font-mono font-bold border-r border-gray-800/30 ${gear < 4 ? 'bg-red-900/20 text-red-500' : 'text-gray-600'}`}
                      >
                        {gear}
                      </div>
                    )
                  )}
                </div>

                {/* Tooltip Overlay */}
                <motion.div
                  className="absolute top-1/4 left-[60%] bg-gray-900/90 border border-gray-700 p-2 rounded backdrop-blur-sm"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.2 }}
                >
                  <div className="text-[10px] text-gray-400 font-mono mb-1">SPEED</div>
                  <div className="text-lg font-bold text-white leading-none">
                    324 <span className="text-xs font-normal text-gray-500">km/h</span>
                  </div>
                  <div className="text-[10px] text-red-500 font-mono mt-1">DRS OPEN</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { TelemetrySection };
export default TelemetrySection;
