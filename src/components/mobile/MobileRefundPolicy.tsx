import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MobileFooter from './MobileFooter';

const MobileRefundPolicy: React.FC = () => {
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
            Refund <br />
            <span className="text-red-600">Policy</span>
          </h1>

          <div className="space-y-8 text-sm font-mono text-gray-400">
            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">1. Overview</h2>
              <p>
                Fastlytics offers Free and Pro tiers. This policy covers refunds for paid
                subscriptions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                2. Subscription Refunds
              </h2>
              <p className="mb-3">You may be eligible for a refund under these conditions:</p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <strong className="text-white">7-day window:</strong> Full refund if requested
                  within 7 days of purchase or renewal.
                </li>
                <li>
                  <strong className="text-white">Service downtime:</strong> Prorated refund if core
                  features are down for 48+ consecutive hours due to our systems.
                </li>
                <li>
                  <strong className="text-white">Billing errors:</strong> Full refund for incorrect
                  charges.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                3. Non-Refundable
              </h2>
              <ul className="list-disc pl-4 space-y-2">
                <li>Requests after 7 days from purchase</li>
                <li>Unused time on active subscriptions</li>
                <li>Downgrades past the refund window</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                4. Cancellations
              </h2>
              <p>
                Cancel anytime from account settings. Access continues until the end of your billing
                period.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">5. Contact</h2>
              <p>
                Email{' '}
                <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:underline">
                  contact@fastlytics.app
                </a>{' '}
                to request a refund. Reviewed within 5 business days.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <MobileFooter />
    </div>
  );
};

export { MobileRefundPolicy };
export default MobileRefundPolicy;
