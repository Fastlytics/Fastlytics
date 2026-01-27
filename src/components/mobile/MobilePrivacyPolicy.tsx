import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import MobileFooter from './MobileFooter';

const MobilePrivacyPolicy: React.FC = () => {
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
                        Privacy <br /><span className="text-red-600">Policy</span>
                    </h1>

                    <div className="space-y-8 text-sm font-mono text-gray-400">
                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">1. Introduction</h2>
                            <p>
                                Welcome to Fastlytics. We respect your privacy and are committed to protecting your personal data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">2. Data We Collect</h2>
                            <ul className="list-disc pl-4 space-y-2">
                                <li><strong className="text-white">Identity Data:</strong> Name, username.</li>
                                <li><strong className="text-white">Contact Data:</strong> Email address.</li>
                                <li><strong className="text-white">Usage Data:</strong> How you use our website.</li>
                                <li><strong className="text-white">Technical Data:</strong> IP address, browser type.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">3. Data Storage</h2>
                            <ul className="list-disc pl-4 space-y-2">
                                <li><strong className="text-white">Secure Storage:</strong> Provided by Supabase.</li>
                                <li><strong className="text-white">Analytics:</strong> Self-hosted Umami and PostHog. Data is <strong className="text-red-600">NOT</strong> shared with third parties.</li>
                            </ul>
                        </section>

                        <section className="bg-zinc-900/50 border-l-2 border-red-600 p-4">
                            <h2 className="text-lg font-black text-red-600 uppercase italic mb-2">4. Payment Info</h2>
                            <p className="text-white">
                                We do not store credit card details. Payments are handled securely by Paddle.com.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">5. Your Rights</h2>
                            <p>
                                You have the right to access, correct, or delete your data. You can view your activity history in your Account page.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">6. Contact</h2>
                            <p>
                                Questions? Email us at <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:underline">contact@fastlytics.app</a>.
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

export { MobilePrivacyPolicy };
export default MobilePrivacyPolicy;
