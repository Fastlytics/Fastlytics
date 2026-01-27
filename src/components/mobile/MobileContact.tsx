import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { Mail01Icon, Location01Icon } from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';

import MobileFooter from './MobileFooter';

const MobileContact: React.FC = () => {
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

            <main className="px-4 pt-12 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-left"
                >
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.85] mb-6">
                        Get in <br />
                        <span className="text-red-600">Touch</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-mono uppercase leading-relaxed max-w-xs mb-12">
                        Have questions? We're here to help.
                    </p>

                    <div className="space-y-6">
                        {/* Email Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-black border-2 border-white/10 p-6"
                        >
                            <div className="mb-4 inline-flex p-3 bg-zinc-900 border border-white/10">
                                <Mail01Icon className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-xl font-black uppercase italic mb-2">Email Us</h2>
                            <a href="mailto:contact@fastlytics.app" className="text-gray-400 font-mono text-sm hover:text-white transition-colors block">
                                contact@fastlytics.app
                            </a>
                        </motion.div>

                        {/* Location Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-black border-2 border-white/10 p-6"
                        >
                            <div className="mb-4 inline-flex p-3 bg-zinc-900 border border-white/10">
                                <Location01Icon className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-xl font-black uppercase italic mb-2">Office</h2>
                            <p className="text-gray-400 font-mono text-sm">
                                Venture Labs,<br />
                                Thapar Institute, Punjab, India
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <MobileFooter />
        </div>
    );
};

export { MobileContact };
export default MobileContact;
