import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MobileFooter from './MobileFooter';

const MobileTermsOfService: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      <header className="relative z-20 sticky top-0 bg-black border-b-2 border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <Gauge className="h-6 w-6 text-red-600 transition-transform group-hover:rotate-180 duration-500" />
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Fast<span className="text-red-600">lytics</span>
            </span>
          </Link>
          <Link to={user ? '/dashboard' : '/pricing'}>
            <button className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors">
              {user ? 'Dashboard' : 'Get Started'}
            </button>
          </Link>
        </div>
      </header>

      <main className="px-4 pt-12 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8 leading-none">
            Terms of <br />
            <span className="text-red-600">Service</span>
          </h1>

          <div className="space-y-8 text-sm font-mono text-gray-400">
            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">1. Acceptance</h2>
              <p>
                By using Fastlytics, you agree to these Terms. Applies to all tiers — Free, Pro, and
                Ultra.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                2. Subscriptions
              </h2>
              <p className="mb-2">
                Paid plans are billed monthly or annually in advance via Dodo Payments. Cancel
                anytime — access continues until the end of your billing period.
              </p>
              <p>We do not store your full payment card details.</p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">3. Free Tier</h2>
              <p>
                Free tier includes current season data with a 5-minute session replay cap. Features
                may change.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                4. Acceptable Use
              </h2>
              <ul className="list-disc pl-4 space-y-1">
                <li>No scraping or systematic data extraction</li>
                <li>No account sharing or reselling access</li>
                <li>No unlawful use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">5. Disclaimer</h2>
              <p className="mb-2">
                Service provided "as is." We do not guarantee data accuracy or availability.
              </p>
              <div className="mt-4 p-3 bg-zinc-900 border border-white/10 text-xs">
                <strong className="text-white block mb-1">F1 Disclaimer</strong>
                This website is unofficial and is not associated in any way with the Formula 1
                companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND
                PRIX and related marks are trade marks of Formula One Licensing B.V.
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">6. Liability</h2>
              <p>
                Fastlytics is not liable for indirect or consequential damages from use of the
                Service.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <MobileFooter />
    </div>
  );
};

export { MobileTermsOfService };
export default MobileTermsOfService;
