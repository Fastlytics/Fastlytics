import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { ArrowRight01Icon, Database01Icon, DashboardSpeed01Icon, Analytics01Icon } from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';

import MobileFooter from './MobileFooter';

const MobileAbout: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
            {/* Header */}
            <header className="relative z-20 sticky top-0 bg-black border-b-2 border-white/10">
                <div className="flex items-center justify-between px-4 py-4">
                    <Link to="/" className="flex items-center gap-2 group">
                        <Gauge className="h-6 w-6 text-red-600 transition-transform group-hover:rotate-180 duration-500" />
                        <span className="text-xl font-black tracking-tighter uppercase italic">
                            Fast<span className="text-red-600">lytics</span>
                        </span>
                    </Link>
                    <Link to={user ? "/dashboard" : "/auth"}>
                        <button className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors">
                            {user ? 'Dashboard' : 'Sign Up'}
                        </button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative px-4 pt-12 pb-16 border-b-2 border-white/10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-left"
                >
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.85] mb-6">
                        About <br />
                        <span className="text-red-600">Fastlytics</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-mono uppercase leading-relaxed max-w-xs">
                        Democratizing Formula 1 data analysis for fans everywhere.
                    </p>
                </motion.div>
            </section>

            {/* Mission & Vision */}
            <section className="px-4 py-16 border-b-2 border-white/10 bg-zinc-950">
                <div className="space-y-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">
                            The <span className="text-red-600">Mission</span>
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed font-mono">
                            Fastlytics was built to bridge the gap between complex telemetry data and the passionate F1 fan.
                            We believe that every fan deserves access to the same insights as the race strategists.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">
                            The <span className="text-red-600">Vision</span>
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed font-mono mb-4">
                            Fastlytics is a community-driven project aiming to be the ultimate open-source F1 analytics platform.
                        </p>
                        <p className="text-gray-400 text-sm leading-relaxed font-mono">
                            Join us in building the future of fan-powered analysis.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="px-4 py-16 border-b-2 border-white/10">
                <div className="mb-10">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
                        Core <span className="text-red-600">Features</span>
                    </h2>
                </div>
                <div className="space-y-4">
                    {[
                        {
                            icon: Database01Icon,
                            title: "Deep Data",
                            description: "Processing gigabytes of telemetry data."
                        },
                        {
                            icon: DashboardSpeed01Icon,
                            title: "Real-time Speed",
                            description: "Instant access to lap times and race pace."
                        },
                        {
                            icon: Analytics01Icon,
                            title: "Strategic Insights",
                            description: "Uncovering the strategy calls that win races."
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-black border-2 border-white/10 p-5"
                        >
                            <item.icon className="w-8 h-8 text-red-600 mb-4" />
                            <h3 className="text-lg font-black uppercase italic mb-2">{item.title}</h3>
                            <p className="text-xs text-gray-500 font-mono uppercase">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Story Section */}
            <section className="px-4 py-16 bg-zinc-900/30 border-b-2 border-white/10">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-6">
                        The <span className="text-red-600">Story</span>
                    </h2>

                    <div className="mb-8 relative">
                        <div className="aspect-[4/5] bg-zinc-800 border-2 border-white/20 relative overflow-hidden">
                            <img
                                src="/subhash.jpg"
                                alt="Subhash"
                                className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay" />
                        </div>
                        <div className="absolute -bottom-4 -right-2 bg-red-600 text-white px-4 py-2 border-2 border-black">
                            <p className="text-[10px] font-bold uppercase tracking-widest">Creator</p>
                            <p className="text-lg font-black uppercase italic">Subhash</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-gray-400 text-sm font-mono leading-relaxed">
                        <p>
                            I've been an F1 fan since 2013. Mesmerized by the speed and strategy, I wanted to understand more.
                        </p>
                        <p>
                            Fastlytics started as clunky Python scripts in high school. Now, it's a full platform for fans like me.
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* CTA */}
            <section className="px-4 py-20 bg-red-600">
                <div className="text-center">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-6 text-black leading-none">
                        Ready to Dive <br /><span className="text-white">Deep?</span>
                    </h2>
                    <Link to="/dashboard">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            className="bg-black text-white font-black uppercase tracking-wider py-4 px-8 inline-flex items-center gap-2 hover:bg-white hover:text-black transition-colors border-2 border-black"
                        >
                            <span>Launch Dashboard</span>
                            <ArrowRight01Icon className="w-5 h-5" />
                        </motion.button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <MobileFooter />
        </div>
    );
};

export { MobileAbout };
export default MobileAbout;
