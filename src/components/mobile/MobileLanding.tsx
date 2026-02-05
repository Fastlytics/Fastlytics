import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import {
  Tick01Icon,
  ArrowRight01Icon,
  Analytics01Icon,
  FlashIcon,
  Time01Icon,
  ChampionIcon,
  Database01Icon,
  DashboardSpeed01Icon,
} from 'hugeicons-react';
import MobileFooter from './MobileFooter';
import { useAuth } from '@/contexts/AuthContext';

const MobileLanding: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show minimal loading screen while checking auth to prevent flash of landing page
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: <Analytics01Icon className="w-5 h-5" />,
      title: 'Track Dominance',
      description: 'Visualize where drivers gain time on every corner',
    },
    {
      icon: <FlashIcon className="w-5 h-5" />,
      title: 'Telemetry',
      description: 'Real-time speed, throttle, and brake data',
    },
    {
      icon: <Time01Icon className="w-5 h-5" />,
      title: 'Lap Analysis',
      description: 'Compare lap times and sector breakdowns',
    },
    {
      icon: <ChampionIcon className="w-5 h-5" />,
      title: 'Race Strategy',
      description: 'Tire strategies and pit stop analysis',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* Header */}
      <header className="relative z-20 sticky top-0 bg-black border-b-2 border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <Gauge className="h-6 w-6 text-red-600 transition-transform group-hover:rotate-180 duration-500" />
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Fast<span className="text-red-600">lytics</span>
            </span>
          </Link>
          <Link to={user ? '/dashboard' : '/auth'}>
            <button className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors">
              {user ? 'Dashboard' : 'Sign Up'}
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 pt-16 pb-20 border-b-2 border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
        >
          {/* Main Heading */}
          <div className="mb-8 flex justify-start">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/80 backdrop-blur-md border border-white/20 pl-3 pr-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-lg"
            >
              <div className="bg-red-600 text-white text-[10px] font-black uppercase px-1.5 py-0.5 rounded-sm">
                NEW
              </div>
              <p className="text-xs font-mono text-gray-300">
                <span className="text-white font-bold">Fastlytics 2.0</span> is here
              </p>
            </motion.div>
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.85] mb-6">
            Race Data
            <br />
            <span className="text-red-600">Unleashed</span>
          </h1>

          <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed font-mono uppercase">
            The ultimate telemetry analysis tool for F1 fans. <br />
            <span className="text-white">Brutally fast. Insanely detailed.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="w-full">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full bg-red-600 text-white font-black uppercase tracking-wider py-4 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors border-2 border-transparent hover:border-white"
              >
                <span>Start Analysis</span>
                <ArrowRight01Icon className="w-5 h-5" />
              </motion.button>
            </Link>
            <a href="#features" className="w-full">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black border-2 border-white/20 text-white font-black uppercase tracking-wider py-4 hover:bg-white hover:text-black transition-colors"
              >
                Explore Features
              </motion.button>
            </a>
          </div>
        </motion.div>

        {/* Animated Preview Card - Brutalist Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-black border-2 border-white/20 p-1 relative"
        >
          {/* Decorative Corners */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-600" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-600" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-600" />

          <div className="bg-zinc-900/50 p-4">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  Telemetry
                </span>
              </div>
              <div className="font-mono text-[10px] text-red-600">REC ●</div>
            </div>

            {/* Speed Graph Visualization */}
            <div className="h-32 relative bg-black border border-white/10 overflow-hidden mb-4">
              <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                <motion.path
                  d="M0 70 L30 60 L60 40 L90 30 L120 20 L150 35 L180 60 L210 70 L240 50 L270 30 L300 25"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M0 70 L30 60 L60 40 L90 30 L120 20 L150 35 L180 60 L210 70 L240 50 L270 30 L300 25 L300 100 L0 100 Z"
                  fill="#dc2626"
                  fillOpacity="0.1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                />
              </svg>
              <div className="absolute bottom-1 left-2 text-[9px] font-mono text-gray-500">0</div>
              <div className="absolute top-1 left-2 text-[9px] font-mono text-gray-500">320</div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Top Speed', value: '318' },
                { label: 'Avg Speed', value: '215' },
                { label: 'Lap Time', value: '1:23.4' },
              ].map((stat) => (
                <div key={stat.label} className="bg-black border border-white/10 p-2 text-center">
                  <div className="text-lg font-black text-white font-mono leading-none mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 px-4 py-16 bg-zinc-950 border-b-2 border-white/10"
      >
        <div className="mb-10">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
            Powerful <span className="text-red-600">Features</span>
          </h2>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Everything you need to analyze F1
          </p>
        </div>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`bg-black border-2 p-5 transition-all cursor-pointer group ${
                activeFeature === index ? 'border-red-600' : 'border-white/10 hover:border-white/30'
              }`}
              onClick={() => setActiveFeature(index)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 flex items-center justify-center flex-shrink-0 border ${
                    activeFeature === index
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-black border-white/20 text-gray-400'
                  }`}
                >
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-black uppercase text-sm mb-1 ${activeFeature === index ? 'text-white' : 'text-gray-300'}`}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <ArrowRight01Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    activeFeature === index ? 'text-red-600 -rotate-45' : 'text-gray-700'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Strategy Preview Section */}
      <section className="relative z-10 px-4 py-16 border-b-2 border-white/10">
        <div className="mb-10">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
            Master the <span className="text-red-600">Strategy</span>
          </h2>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Understand every pit stop decision
          </p>
        </div>

        <div className="bg-black border-2 border-white/10 p-1">
          <div className="bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase text-red-600 tracking-wider">
                Tire Strategy
              </span>
              <span className="text-[10px] font-mono text-gray-500">LAP 1-57</span>
            </div>

            {/* Driver Stint Bars */}
            <div className="space-y-5">
              {[
                {
                  driver: 'VER',
                  stops: 2,
                  stints: [
                    { width: 40, color: 'bg-yellow-500' },
                    { width: 35, color: 'bg-white' },
                    { width: 25, color: 'bg-red-600' },
                  ],
                },
                {
                  driver: 'HAM',
                  stops: 1,
                  stints: [
                    { width: 55, color: 'bg-yellow-500' },
                    { width: 45, color: 'bg-white' },
                  ],
                },
                {
                  driver: 'NOR',
                  stops: 2,
                  stints: [
                    { width: 30, color: 'bg-red-600' },
                    { width: 40, color: 'bg-yellow-500' },
                    { width: 30, color: 'bg-white' },
                  ],
                },
              ].map((data) => (
                <div key={data.driver}>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                    <span className="font-bold text-white bg-black px-1 border border-white/20">
                      {data.driver}
                    </span>
                    <span className="text-[10px]">{data.stops} STOPS</span>
                  </div>
                  <div className="flex h-4 w-full border border-white/10">
                    {data.stints.map((stint, i) => (
                      <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${stint.width}%` }}
                        transition={{ duration: 0.8, delay: i * 0.2 }}
                        viewport={{ once: true }}
                        className={`${stint.color} h-full ${i < data.stints.length - 1 ? 'border-r border-black' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-start gap-6 mt-6 pt-4 border-t border-white/10">
              {[
                { color: 'bg-red-600', label: 'SOFT' },
                { color: 'bg-yellow-500', label: 'MED' },
                { color: 'bg-white', label: 'HARD' },
              ].map((tire) => (
                <div key={tire.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${tire.color} border border-black`} />
                  <span className="text-[10px] font-mono text-gray-400">{tire.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20 bg-red-600 border-b-2 border-white/10">
        <div className="relative text-center">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-6 text-black leading-none">
            Explore <br />
            <span className="text-white">F1 Analytics</span>
          </h2>
          <p className="text-black/80 mb-8 max-w-xs mx-auto font-bold uppercase text-sm tracking-wide">
            Free access to race data. Sign in for advanced features.
          </p>
          <Link to="/dashboard">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="bg-black text-white font-black uppercase tracking-wider py-4 px-8 inline-flex items-center gap-2 hover:bg-white hover:text-black transition-colors border-2 border-black"
            >
              <span>Start Analyzing</span>
              <ArrowRight01Icon className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <MobileFooter />
    </div>
  );
};

export { MobileLanding };
export default MobileLanding;
