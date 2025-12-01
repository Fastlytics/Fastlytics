import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';

const PrivacyPolicy = () => {
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
                Welcome to Fastlytics. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Identity Data includes first name, last name, username or similar identifier.</li>
                <li>Contact Data includes email address.</li>
                <li>Technical Data includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              </ul>
            </section>

            <section className="bg-zinc-900/50 border border-red-900/30 p-6 rounded-none">
              <h2 className="text-2xl font-bold text-red-500 mb-4">3. Payment Information</h2>
              <p className="font-medium text-white">
                We do not store your credit card details. All payment processing is handled by our Merchant of Record, Paddle.com. When you make a purchase, your payment details are securely processed by Paddle, and we never have access to your full credit card number.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:text-red-500">contact@fastlytics.app</a>.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
