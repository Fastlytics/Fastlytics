import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { AlertCircleIcon, ArrowLeft01Icon } from 'hugeicons-react'; // Assuming these icons are available based on NotFound.tsx usage
import MobileFooter from './MobileFooter';
import { motion } from 'framer-motion';

const MobileNotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-red-600 selection:text-white flex flex-col">
            {/* Header */}
            <header className="relative z-20 sticky top-0 bg-black border-b-2 border-white/10">
                <div className="flex items-center justify-between px-4 py-4">
                    <Link to="/" className="flex items-center gap-2 group">
                        <Gauge className="h-6 w-6 text-red-600 transition-transform group-hover:rotate-180 duration-500" />
                        <span className="text-xl font-black tracking-tighter uppercase italic">
                            Fast<span className="text-red-600">lytics</span>
                        </span>
                    </Link>
                    <Link to="/dashboard">
                        <button className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors">
                            Dashboard
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center px-4 py-16 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <AlertCircleIcon className="h-24 w-24 text-red-600 animate-pulse" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none"
                >
                    404
                </motion.h1>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold uppercase tracking-wide text-gray-300 mb-6"
                >
                    Wrong Turn
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-400 text-sm max-w-xs mb-10 font-mono leading-relaxed"
                >
                    Looks like you've gone off track. This sector is under yellow flags.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-xs space-y-3"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-white text-black font-black uppercase tracking-wider py-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft01Icon className="w-5 h-5" />
                        <span>Go Back</span>
                    </button>

                    <Link to="/" className="block w-full">
                        <button
                            className="w-full bg-black border-2 border-white/20 text-white font-black uppercase tracking-wider py-4 hover:bg-white hover:text-black transition-colors"
                        >
                            Return Home
                        </button>
                    </Link>
                </motion.div>

                {/* F1 Style Decorative Elements */}
                <div className="absolute top-1/4 left-0 w-8 h-1 bg-red-600 opacity-50"></div>
                <div className="absolute bottom-1/4 right-0 w-8 h-1 bg-red-600 opacity-50"></div>

            </main>

            {/* Footer */}
            <MobileFooter />
        </div>
    );
};

export { MobileNotFound };
export default MobileNotFound;
