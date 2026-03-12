import React from 'react';
import { motion } from 'framer-motion';

const TrackDominance = () => {
  // Complex track path (simulating a technical circuit like Suzuka or Spa)
  const trackPath =
    'M100,300 C80,300 50,280 50,250 C50,220 80,200 120,200 L150,200 C180,200 200,180 200,150 C200,120 230,100 260,100 L300,100 C350,100 380,120 380,160 C380,190 360,210 330,210 L300,210 C270,210 250,230 250,260 C250,290 280,320 320,320 L380,320 C420,320 450,300 450,250 C450,200 420,150 380,150';

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-900/30 border border-gray-800 p-8 md:p-16 relative overflow-hidden group hover:border-red-600/30 transition-all duration-700">
      {/* Technical Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Radial Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 grid lg:grid-cols-3 gap-12 items-center">
        {/* Text Info */}
        <div className="col-span-1 space-y-8">
          <div className="border-l-2 border-red-600 pl-6">
            <div className="text-red-600 font-mono text-xs font-bold tracking-widest mb-2">
              LIVE ANALYSIS
            </div>
            <h3 className="text-3xl font-black uppercase italic text-white mb-2 tracking-tighter">
              Dominance Map
            </h3>
            <p className="text-gray-400 font-mono text-sm leading-relaxed">
              Real-time sector visualization. Pinpoint exactly where time is gained or lost against
              the delta.
            </p>
          </div>

          <div className="space-y-4 bg-black/40 p-6 border border-gray-800 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-mono text-gray-500">SECTOR 1</span>
              <span className="text-xs font-mono text-red-500 font-bold">-0.124s</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-mono text-gray-500">SECTOR 2</span>
              <span className="text-xs font-mono text-green-500 font-bold">+0.045s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500">SECTOR 3</span>
              <span className="text-xs font-mono text-red-500 font-bold">-0.210s</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">Verstappen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
              <span className="text-[10px] font-mono text-gray-400 uppercase">Leclerc</span>
            </div>
          </div>
        </div>

        {/* Animation Container */}
        <div className="col-span-2 h-[350px] md:h-[450px] flex items-center justify-center relative perspective-1000">
          <svg
            viewBox="0 0 500 400"
            className="w-full h-full drop-shadow-[0_0_30px_rgba(220,38,38,0.1)] transform rotate-x-12"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Track (Dark Grey) */}
            <path
              d={trackPath}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Track Outline (Lighter Grey) */}
            <path
              d={trackPath}
              fill="none"
              stroke="#333"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-50"
            />

            {/* Animated Segments - Simulating dominance */}
            {/* Segment 1 - Red Dominance (Verstappen) */}
            <motion.path
              d="M100,300 C80,300 50,280 50,250 C50,220 80,200 120,200 L150,200"
              fill="none"
              stroke="#DC2626"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              filter="url(#glow)"
            />

            {/* Segment 2 - Blue Dominance (Leclerc) */}
            <motion.path
              d="M150,200 C180,200 200,180 200,150 C200,120 230,100 260,100 L300,100"
              fill="none"
              stroke="#2563EB"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.2, ease: 'easeInOut' }}
              filter="url(#glow)"
            />

            {/* Segment 3 - Red Dominance (Verstappen) */}
            <motion.path
              d="M300,100 C350,100 380,120 380,160 C380,190 360,210 330,210 L300,210"
              fill="none"
              stroke="#DC2626"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 2.4, ease: 'easeInOut' }}
              filter="url(#glow)"
            />

            {/* Segment 4 - Blue Dominance (Leclerc) */}
            <motion.path
              d="M300,210 C270,210 250,230 250,260 C250,290 280,320 320,320 L380,320"
              fill="none"
              stroke="#2563EB"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 3.6, ease: 'easeInOut' }}
              filter="url(#glow)"
            />

            {/* Segment 5 - Red Dominance (Verstappen) */}
            <motion.path
              d="M380,320 C420,320 450,300 450,250 C450,200 420,150 380,150"
              fill="none"
              stroke="#DC2626"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 4.8, ease: 'easeInOut' }}
              filter="url(#glow)"
            />

            {/* Moving Car Marker */}
            <motion.circle r="4" fill="#fff" filter="drop-shadow(0 0 8px #fff)">
              <animateMotion dur="8s" repeatCount="indefinite" path={trackPath} rotate="auto" />
            </motion.circle>
          </svg>

          {/* Floating Data Points */}
          <motion.div
            className="absolute top-[20%] right-[20%] bg-black/90 border border-red-600/50 px-3 py-2 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5 }}
          >
            <div className="text-[10px] text-gray-400 font-mono mb-1">MAX SPEED</div>
            <div className="text-sm font-bold text-white font-mono">312 KM/H</div>
          </motion.div>

          <motion.div
            className="absolute bottom-[30%] left-[20%] bg-black/90 border border-blue-600/50 px-3 py-2 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 4 }}
          >
            <div className="text-[10px] text-gray-400 font-mono mb-1">MIN SPEED</div>
            <div className="text-sm font-bold text-white font-mono">68 KM/H</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { TrackDominance };
export default TrackDominance;
