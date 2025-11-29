import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}>
            </div>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Moving Lines */}
                <motion.div
                    className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1 }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase italic tracking-tighter leading-none mb-6 relative">
                            <span className="relative z-10">Race</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 relative z-10" style={{ WebkitTextStroke: '2px red' }}>Data</span>
                            <br />
                            <span className="text-white relative z-10">Unleashed</span>

                            {/* Glitch Effect Layers */}
                            <motion.span
                                className="absolute top-0 left-1 text-red-600 opacity-50 mix-blend-screen z-0"
                                animate={{ x: [-2, 2, -2], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                Race Data
                                <br />
                                Unleashed
                            </motion.span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-400 font-mono max-w-3xl mb-12 border-l-4 border-red-600 pl-6 text-left md:text-center md:border-l-0 md:pl-0"
                    >
                        The ultimate telemetry analysis tool for Formula 1 enthusiasts.
                        <span className="text-red-500 font-bold"> Brutally</span> fast.
                        <span className="text-red-500 font-bold"> Insanely</span> detailed.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="flex flex-col md:flex-row gap-6"
                    >
                        <Link to="/dashboard">
                            <button className="bg-red-600 text-white text-lg font-bold uppercase tracking-widest py-4 px-10 border-2 border-red-600 hover:bg-transparent hover:text-red-600 transition-all duration-300 skew-x-[-10deg] shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)]">
                                <span className="block skew-x-[10deg]">Start Analysis</span>
                            </button>
                        </Link>
                        <a href="#features">
                            <button className="bg-transparent text-white text-lg font-bold uppercase tracking-widest py-4 px-10 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 skew-x-[-10deg]">
                                <span className="block skew-x-[10deg]">Explore Features</span>
                            </button>
                        </a>
                    </motion.div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-20"></div>
        </section>
    );
};

export default HeroSection;
