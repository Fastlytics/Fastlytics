import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import LandingFooter from '@/components/layout/LandingFooter';
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
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction and Scope</h2>
              <p className="mb-4">
                This Privacy Policy ("Policy") governs the collection, processing, storage, and
                disclosure of personal information by Fastlytics ("we," "us," or "our") in
                connection with your use of our web application and associated services
                (collectively, the "Services").
              </p>
              <p className="mb-4">
                By accessing or utilizing the Services, you ("User" or "you") acknowledge that you
                have read, understood, and agree to be bound by the terms of this Policy. If you do
                not agree to the terms herein, please refrain from using the Services.
              </p>
              <p>
                We reserve the right to modify this Policy at any time without prior notice. Your
                continued use of the Services following any such modifications constitutes your
                acceptance of the revised Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              <p className="mb-4">
                We collect various categories of information to provide, improve, and personalize
                our Services. This collection may occur automatically through your interactions with
                the platform or through explicit submissions by you.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                2.1 Personal Identifiable Information
              </h3>
              <p className="mb-4">
                Personal information that you voluntarily provide may include, but is not limited
                to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Account credentials and authentication data</li>
                <li>First name, last name, and username</li>
                <li>Email address and other contact information</li>
                <li>Profile information and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                2.2 Technical and Device Information
              </h3>
              <p className="mb-4">
                As part of our commitment to security and fraud prevention, we automatically collect
                technical information regarding your device and network environment. This may
                include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Device identifier and fingerprinting data</li>
                <li>Browser type, version, and configuration</li>
                <li>Operating system and platform information</li>
                <li>Hardware specifications (processor cores, memory)</li>
                <li>Network protocol address (IP address)</li>
                <li>Internet service provider and autonomous system information</li>
                <li>Geographic location data (derived from network coordinates)</li>
                <li>Language preferences and locale settings</li>
                <li>Device capabilities and input methods</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                2.3 Usage and Behavioral Data
              </h3>
              <p className="mb-4">
                We collect information about your interactions with our Services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pages visited, features accessed, and content consumed</li>
                <li>Session duration, navigation patterns, and engagement metrics</li>
                <li>Actions performed within the application</li>
                <li>Referring URLs and exit points</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                3. Data Processing and Legal Basis
              </h2>
              <p className="mb-4">
                We process your personal information based on one or more of the following legal
                bases:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong className="text-white">Performance of Contract:</strong> Processing
                  necessary to fulfill our obligations under the terms of service agreed upon
                  between you and Fastlytics.
                </li>
                <li>
                  <strong className="text-white">Legitimate Interests:</strong> Processing necessary
                  for our legitimate business interests, including service improvement, security
                  enhancement, fraud prevention, and operational optimization, where such interests
                  are not overridden by your rights and freedoms.
                </li>
                <li>
                  <strong className="text-white">Legal Compliance:</strong> Processing necessary to
                  comply with applicable laws, regulations, legal processes, or governmental
                  requests.
                </li>
                <li>
                  <strong className="text-white">Consent:</strong> Where expressly permitted, we may
                  process certain data based on your informed consent.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                4. Data Storage, Security, and Third-Party Processing
              </h2>
              <p className="mb-4">
                Your personal data is stored on infrastructure operated by Supabase, Inc., a
                third-party cloud database provider. All data is maintained in encrypted form at
                rest and in transit utilizing industry-standard cryptographic protocols.
              </p>
              <p className="mb-4">
                For analytics and usage intelligence purposes, we deploy self-hosted instances of
                Umami and PostHog analytics platforms. These analytics services are operated on our
                proprietary infrastructure and are not integrated with, nor do they transmit data
                to, third-party advertising networks or external data brokers.
              </p>
              <p>
                We implement appropriate technical and organizational measures to safeguard your
                information against unauthorized access, alteration, disclosure, or destruction.
                However, no method of electronic transmission or storage is entirely secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention</h2>
              <p className="mb-4">
                We retain personal information only for as long as necessary to fulfill the purposes
                for which we collected it, including for the purposes of satisfying any legal,
                accounting, or reporting requirements.
              </p>
              <p>
                To determine the appropriate retention period, we consider the amount, nature, and
                sensitivity of the personal data, the potential risk of harm from unauthorized use
                or disclosure, and the purposes for which we process the data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
              <p className="mb-4">
                Subject to applicable data protection laws, you may exercise the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>The right to access personal information we hold about you</li>
                <li>The right to request correction of inaccurate personal data</li>
                <li>The right to request deletion of your personal data</li>
                <li>The right to object to processing based on legitimate interests</li>
                <li>The right to data portability, where applicable</li>
                <li>The right to withdraw consent, where processing is based on consent</li>
              </ul>
              <p>
                You may exercise these rights by accessing your account settings or contacting us at
                the email address provided herein. We will respond to your request within the time
                frame required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">
                7. International Data Transfers
              </h2>
              <p>
                Your personal information may be transferred to, and processed in, countries other
                than the country in which you reside. These countries may have data protection laws
                that are different from the laws of your jurisdiction. By using our Services, you
                consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Policy from time to time to reflect changes in our practices,
                technologies, or legal requirements. We will post any material changes on this page
                and, where appropriate, notify you through the Services or via email.
              </p>
              <p>
                We encourage you to review this Policy periodically to stay informed about our data
                practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
              <p className="mb-4">
                For questions, concerns, or requests regarding this Policy or our data practices,
                please contact us at:
              </p>
              <p className="mb-4">
                <strong className="text-white">Email:</strong>{' '}
                <a href="mailto:contact@fastlytics.app" className="text-red-600 hover:text-red-500">
                  contact@fastlytics.app
                </a>
              </p>
              <p>
                For data protection inquiries, you may also contact our designated privacy
                representative.
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
