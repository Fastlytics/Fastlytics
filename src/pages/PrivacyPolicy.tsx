import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePrivacyPolicy } from '@/components/mobile';

const PrivacyPolicy = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobilePrivacyPolicy />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white overflow-x-hidden flex flex-col">
      <LandingNavbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-12">
            Privacy <span className="text-red-600">Policy</span>
          </h1>

          <div className="prose prose-invert prose-lg max-w-none space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to Fastlytics. We respect your privacy and are committed to protecting your
                personal data. This privacy policy will inform you as to how we look after your
                personal data when you visit our website and tell you about your privacy rights and
                how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you
                which we have grouped together follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong className="text-white">Identity Data</strong> includes first name, last
                  name, username or similar identifier.
                </li>
                <li>
                  <strong className="text-white">Contact Data</strong> includes email address.
                </li>
                <li>
                  <strong className="text-white">Usage Data</strong> includes information about how
                  you use our website, such as pages viewed, buttons clicked, and time spent on
                  pages. This helps us improve the user experience.
                </li>
                <li>
                  <strong className="text-white">Technical Data</strong> includes internet protocol
                  (IP) address, your login data, browser type and version, time zone setting and
                  location, browser plug-in types and versions, operating system and platform, and
                  other technology on the devices you use to access this website.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage & Analytics</h2>
              <p className="mb-4">We are committed to data sovereignty and privacy.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-white">Secure Storage:</strong> Your personal data and
                  activity history are stored in a secure database provided by{' '}
                  <strong className="text-white">Supabase</strong>. This data is linked to your user
                  account to provide personalized features like activity history.
                </li>
                <li>
                  <strong className="text-white">Self-Hosted Analytics:</strong> We use self-hosted
                  instances of <strong className="text-white">Umami</strong> and{' '}
                  <strong className="text-white">PostHog</strong> for analytics. This means your
                  usage data is processed on our own controlled infrastructure and is{' '}
                  <strong className="text-red-500">NOT</strong> shared with third-party analytics
                  providers (like Google Analytics).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we
                will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  Where we need to perform the contract we are about to enter into or have entered
                  into with you.
                </li>
                <li>
                  Where it is necessary for our legitimate interests (or those of a third party) and
                  your interests and fundamental rights do not override those interests.
                </li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
              <p className="mb-4">
                Under certain circumstances, you have rights under data protection laws in relation
                to your personal data, including the right to access, correct, or delete your data.
              </p>
              <p>You can view your own activity history directly within your Account page.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please
                contact us at{' '}
                <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:text-red-500">
                  contact@fastlytics.app
                </a>
                .
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export { PrivacyPolicy };
export default PrivacyPolicy;
