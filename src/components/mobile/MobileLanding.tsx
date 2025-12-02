import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { 
    Tick01Icon, 
    ArrowRight01Icon, 
    Analytics01Icon, 
    FlashIcon, 
    Time01Icon, 
    ChampionIcon 
} from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';

const MobileLanding: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const { user } = useAuth();

    const features = [
        {
            icon: <Analytics01Icon className="w-5 h-5" />,
            title: 'Track Dominance',
            description: 'Visualize where drivers gain time on every corner',
        },
        {
            icon: <FlashIcon className="w-5 h-5" />,
            title: 'Live Telemetry',
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

    const pricingPlans = [
        {
            name: 'Rookie',
            price: '$0',
            period: '/mo',
            features: ['Race Results', 'Driver Standings', 'Basic Lap Times'],
            highlight: false,
            buttonText: 'Get Started',
        },
        {
            name: 'Pro Driver',
            price: '$4.99',
            period: '/mo',
            features: ['Everything in Rookie', 'Live Telemetry', 'Speed Traces', 'Tire Strategy'],
            highlight: true,
            buttonText: 'Go Pro',
        },
        {
            name: 'Team Principal',
            price: '$49.99',
            period: '/yr',
            features: ['All Pro Features', '2 Months Free', 'Priority Support', 'API Access'],
            highlight: false,
            buttonText: 'Contact Sales',
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -left-[30%] w-[80%] h-[50%] bg-red-600/15 blur-[100px] rounded-full" />
                <div className="absolute bottom-[10%] -right-[30%] w-[70%] h-[40%] bg-red-600/10 blur-[80px] rounded-full" />
            </div>

            {/* Header */}
            <header className="relative z-20 sticky top-0 bg-black/95 backdrop-blur-md border-b border-gray-800/50">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link to="/" className="flex items-center gap-2">
                        <Gauge className="h-7 w-7 text-red-600" />
                        <span className="text-xl font-black tracking-tighter uppercase italic">
                            Fast<span className="text-red-600">lytics</span>
                        </span>
                    </Link>
                    <Link to={user ? "/dashboard" : "/auth"}>
                        <button className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg">
                            {user ? 'Dashboard' : 'Sign Up'}
                        </button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 px-4 pt-12 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    {/* Main Heading */}
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-4">
                        <span className="block">Race Data</span>
                        <span className="text-red-600">Unleashed</span>
                    </h1>

                    <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                        The ultimate telemetry analysis tool for F1 fans.{' '}
                        <span className="text-red-500 font-bold">Brutally</span> fast.{' '}
                        <span className="text-red-500 font-bold">Insanely</span> detailed.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <Link to="/dashboard" className="w-full">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-red-600 text-white font-bold uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2"
                            >
                                <span>Start Analysis</span>
                                <ArrowRight01Icon className="w-5 h-5" />
                            </motion.button>
                        </Link>
                        <a href="#features" className="w-full">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gray-900 border border-gray-700 text-white font-bold uppercase tracking-wider py-4 rounded-xl"
                            >
                                Explore Features
                            </motion.button>
                        </a>
                    </div>
                </motion.div>

                {/* Animated Preview Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 bg-gray-900/80 border border-gray-800 rounded-2xl p-4 relative overflow-hidden"
                >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-mono text-gray-400 uppercase">Live Telemetry</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                    </div>

                    {/* Speed Graph Visualization */}
                    <div className="h-32 relative bg-black/50 rounded-xl border border-gray-800 overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="speedGradientMobile" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                d="M0 70 L30 60 L60 40 L90 30 L120 20 L150 35 L180 60 L210 70 L240 50 L270 30 L300 25"
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                            <motion.path
                                d="M0 70 L30 60 L60 40 L90 30 L120 20 L150 35 L180 60 L210 70 L240 50 L270 30 L300 25 L300 100 L0 100 Z"
                                fill="url(#speedGradientMobile)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 1 }}
                            />
                        </svg>
                        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-gray-500">0km/h</div>
                        <div className="absolute top-2 left-3 text-[10px] font-mono text-gray-500">320km/h</div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {[
                            { label: 'Top Speed', value: '318' },
                            { label: 'Avg Speed', value: '215' },
                            { label: 'Lap Time', value: '1:23.4' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-black/50 rounded-lg p-2 text-center">
                                <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                                <div className="text-[9px] text-gray-500 uppercase">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 px-4 py-12 bg-gray-950/50">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                        Powerful <span className="text-red-600">Features</span>
                    </h2>
                    <p className="text-sm text-gray-400">Everything you need to analyze F1</p>
                </div>

                <div className="space-y-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`bg-gray-900/80 border rounded-xl p-4 transition-all ${
                                activeFeature === index
                                    ? 'border-red-600 bg-red-600/5'
                                    : 'border-gray-800'
                            }`}
                            onClick={() => setActiveFeature(index)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    activeFeature === index ? 'bg-red-600' : 'bg-gray-800'
                                }`}>
                                    {feature.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold uppercase text-sm mb-1">{feature.title}</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                                </div>
                                <ArrowRight01Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${
                                    activeFeature === index ? 'text-red-500 rotate-90' : 'text-gray-600'
                                }`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Strategy Preview Section */}
            <section className="relative z-10 px-4 py-12">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                        Master the <span className="text-red-600">Strategy</span>
                    </h2>
                    <p className="text-sm text-gray-400">Understand every pit stop decision</p>
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase text-red-500">Tire Strategy</span>
                        <span className="text-[10px] font-mono text-gray-500">LAP 1-57</span>
                    </div>

                    {/* Driver Stint Bars */}
                    <div className="space-y-4">
                        {[
                            { driver: 'VER', stops: 2, stints: [{ width: 40, color: 'bg-yellow-500' }, { width: 35, color: 'bg-white' }, { width: 25, color: 'bg-red-600' }] },
                            { driver: 'HAM', stops: 1, stints: [{ width: 55, color: 'bg-yellow-500' }, { width: 45, color: 'bg-white' }] },
                            { driver: 'NOR', stops: 2, stints: [{ width: 30, color: 'bg-red-600' }, { width: 40, color: 'bg-yellow-500' }, { width: 30, color: 'bg-white' }] },
                        ].map((data) => (
                            <div key={data.driver}>
                                <div className="flex justify-between text-xs font-mono text-gray-400 mb-1.5">
                                    <span className="font-bold text-white">{data.driver}</span>
                                    <span>{data.stops} STOPS</span>
                                </div>
                                <div className="flex h-6 w-full rounded overflow-hidden">
                                    {data.stints.map((stint, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${stint.width}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.2 }}
                                            viewport={{ once: true }}
                                            className={`${stint.color} h-full ${i < data.stints.length - 1 ? 'border-r-2 border-black' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-800">
                        {[
                            { color: 'bg-red-600', label: 'SOFT' },
                            { color: 'bg-yellow-500', label: 'MED' },
                            { color: 'bg-white', label: 'HARD' },
                        ].map((tire) => (
                            <div key={tire.label} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${tire.color}`} />
                                <span className="text-[10px] text-gray-400">{tire.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 px-4 py-12 bg-gray-950/50">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                        Pro <span className="text-red-600">Access</span>
                    </h2>
                    <p className="text-sm text-gray-400">Unlock the full potential</p>
                </div>

                <div className="space-y-4">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className={`rounded-xl p-5 relative ${
                                plan.highlight
                                    ? 'bg-gray-900 border-2 border-red-600'
                                    : 'bg-gray-900/80 border border-gray-800'
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-4 bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
                                    Most Popular
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className={`text-lg font-bold uppercase ${plan.highlight ? 'text-red-500' : ''}`}>
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black">{plan.price}</span>
                                        <span className="text-sm text-gray-500 font-mono">{plan.period}</span>
                                    </div>
                                </div>
                                <Link to="/auth">
                                    <button className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
                                        plan.highlight
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-800 text-white border border-gray-700'
                                    }`}>
                                        {plan.buttonText}
                                    </button>
                                </Link>
                            </div>

                            <div className="space-y-2">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-2">
                                        <Tick01Icon className={`w-4 h-4 ${plan.highlight ? 'text-red-500' : 'text-gray-500'}`} />
                                        <span className="text-xs text-gray-400">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-4 py-16 bg-red-600">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="relative text-center">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">
                        Ready to Dive <span className="text-black">Deep?</span>
                    </h2>
                    <p className="text-white/90 mb-8 max-w-xs mx-auto">
                        Join the most advanced F1 analytics platform today.
                    </p>
                    <Link to="/dashboard">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="bg-black text-white font-bold uppercase tracking-wider py-4 px-8 rounded-xl inline-flex items-center gap-2"
                        >
                            <span>Start Analyzing</span>
                            <ArrowRight01Icon className="w-5 h-5" />
                        </motion.button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-4 py-8 bg-black border-t border-gray-800">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Gauge className="h-6 w-6 text-red-600" />
                    <span className="text-lg font-black tracking-tighter uppercase italic">
                        Fast<span className="text-red-600">lytics</span>
                    </span>
                </div>

                {/* Quick Links */}
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <Link to="/dashboard" className="text-xs text-gray-400 hover:text-white uppercase font-bold">Dashboard</Link>
                    <Link to="/about" className="text-xs text-gray-400 hover:text-white uppercase font-bold">About</Link>
                    <Link to="/privacy-policy" className="text-xs text-gray-400 hover:text-white uppercase font-bold">Privacy</Link>
                    <Link to="/terms-of-service" className="text-xs text-gray-400 hover:text-white uppercase font-bold">Terms</Link>
                    <Link to="/contact" className="text-xs text-gray-400 hover:text-white uppercase font-bold">Contact</Link>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-gray-600 font-mono uppercase">
                        © {new Date().getFullYear()} Fastlytics. All rights reserved.
                    </p>
                    <p className="text-[9px] text-gray-700 mt-1">
                        Not affiliated with Formula One World Championship Limited.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MobileLanding;
