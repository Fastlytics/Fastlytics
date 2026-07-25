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
          <Link to={user ? '/dashboard' : '/auth'}>
            <button className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors">
              {user ? 'Dashboard' : 'Sign Up'}
            </button>
          </Link>
        </div>
      </header>

      <main className="px-4 pt-12 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8 leading-none">
            Privacy <br />
            <span className="text-red-600">Policy</span>
          </h1>

          <div className="space-y-8 text-sm font-mono text-gray-400">
            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                1. Introduction and Scope
              </h2>
              <p className="mb-3">
                This Privacy Policy governs the collection, processing, storage, and disclosure of
                personal information by Fastlytics in connection with your use of our Services.
              </p>
              <p>
                By accessing or utilizing the Services, you acknowledge that you have read,
                understood, and agree to be bound by the terms of this Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                2. Information We Collect
              </h2>
              <p className="mb-3">
                We collect various categories of information to provide and improve our Services:
              </p>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li>
                  <strong className="text-white">Personal Identifiable Information:</strong> Account
                  credentials, name, username, email address, and profile information.
                </li>
                <li>
                  <strong className="text-white">Technical and Device Information:</strong> Device
                  identifier, browser configuration, operating system, IP address, ISP details,
                  geographic location data derived from network coordinates, and device fingerprint.
                </li>
                <li>
                  <strong className="text-white">Usage and Behavioral Data:</strong> Pages visited,
                  features accessed, session duration, navigation patterns, and engagement metrics.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                3. Data Processing and Legal Basis
              </h2>
              <p className="mb-3">We process your personal information based on:</p>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li>Performance of contractual obligations</li>
                <li>
                  Legitimate business interests (service improvement, security, fraud prevention)
                </li>
                <li>Legal compliance requirements</li>
                <li>Your informed consent, where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                4. Storage and Security
              </h2>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <strong className="text-white">Secure Storage:</strong> Personal data and activity
                  history are stored in our Supabase database infrastructure with encryption at rest
                  and in transit.
                </li>
                <li>
                  <strong className="text-white">Analytics:</strong> Self-hosted Umami and PostHog
                  analytics (including heatmaps and session recordings) operated on our proprietary
                  infrastructure. Data is <strong className="text-red-600">NOT</strong> transmitted
                  to third-party advertising networks or external data brokers.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                5. Your Rights
              </h2>
              <p className="mb-3">
                Subject to applicable data protection laws, you may exercise the following rights:
              </p>
              <ul className="list-disc pl-4 space-y-2 mb-3">
                <li>Right to access personal information we hold about you</li>
                <li>Right to request correction of inaccurate data</li>
                <li>Right to request deletion of your personal data</li>
                <li>Right to object to processing based on legitimate interests</li>
              </ul>
              <p>
                You may exercise these rights through your account settings or by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                6. International Data Transfers
              </h2>
              <p>
                Your personal information may be transferred to and processed in countries other
                than your country of residence. By using our Services, you consent to such
                transfers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-white uppercase italic mb-3">
                7. Contact Information
              </h2>
              <p>
                For questions, concerns, or requests regarding this Policy or our data practices,
                please contact us at{' '}
                <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:underline">
                  contact@fastlytics.app
                </a>
                .
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
