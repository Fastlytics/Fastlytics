import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import MobileFooter from './MobileFooter';

const MobileTermsOfService: React.FC = () => {
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
                        Terms of <br /><span className="text-red-600">Service</span>
                    </h1>

                    <div className="space-y-8 text-sm font-mono text-gray-400">
                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">1. Acceptance</h2>
                            <p>
                                By accessing Fastlytics, you agree to be bound by these Terms of Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">2. Use License</h2>
                            <p>
                                Permission is granted to temporarily download one copy of the materials (information or software) on Fastlytics' website for personal, non-commercial transitory viewing only.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">3. Disclaimer</h2>
                            <p>
                                The materials on Fastlytics' website are provided on an 'as is' basis. Fastlytics makes no warranties, expressed or implied.
                            </p>
                            <div className="mt-4 p-3 bg-zinc-900 border border-white/10 text-xs">
                                <strong className="text-white block mb-1">F1 Disclaimer</strong>
                                This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">4. Limitations</h2>
                            <p>
                                In no event shall Fastlytics or its suppliers be liable for any damages arising out of the use or inability to use the materials on Fastlytics' website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-white uppercase italic mb-3">5. Revisions</h2>
                            <p>
                                The materials appearing on Fastlytics' website could include technical, typographical, or photographic errors. Fastlytics does not warrant that any of the materials on its website are accurate, complete, or current.
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

export { MobileTermsOfService };
export default MobileTermsOfService;
