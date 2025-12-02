import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import MobileFooter from './MobileFooter';

const MobileRefundPolicy: React.FC = () => {
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
                >
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8 leading-none">
                        Refund <br /><span className="text-red-600">Policy</span>
                    </h1>

                    <div className="space-y-8 text-sm font-mono text-gray-400">
                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">Overview</h2>
                            <p>
                                We want you to be satisfied with Fastlytics. If you're not happy with your purchase, we're here to help.
                            </p>
                        </section>

                        <section className="bg-zinc-900/50 border-l-2 border-red-600 p-4">
                            <h2 className="text-lg font-black text-red-600 uppercase italic mb-2">14-Day Guarantee</h2>
                            <p className="text-white">
                                We offer a full refund within 14 days of your initial purchase, no questions asked.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">How to Request</h2>
                            <p>
                                To request a refund, simply email us at <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:underline">contact@fastlytics.app</a> with your order details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">Processing Time</h2>
                            <p>
                                Refunds are processed within 5-10 business days and will be returned to your original payment method.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <MobileFooter />
        </div>
    );
};

export default MobileRefundPolicy;
