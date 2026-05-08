import React from 'react';
import { motion } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const TermsOfService = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Terms"
        description="Read the terms governing access to Fastlytics, paid subscriptions, acceptable use, disclaimers, and service limitations."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/40">
              The rules governing your use of Fastlytics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-12 space-y-10"
          >
            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  By accessing Fastlytics ("the Service"), you agree to be bound by these Terms of
                  Service. If you do not agree, you may not use the Service. These terms apply to
                  all users, including those on the Free, Pro, and Ultra plans.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">2. Account Registration</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  You must provide accurate and complete information when creating an account. You
                  are responsible for maintaining the security of your account credentials and for
                  all activities that occur under your account.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">
                3. Subscriptions and Payments
              </h2>
              <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                <p>
                  Fastlytics offers tiered subscription plans (Free, Pro, Ultra). Paid subscriptions
                  are billed in advance on a monthly or annual basis. You authorize us to charge
                  your payment method on each billing date.
                </p>
                <p>
                  Prices are subject to change with 30 days notice. Price changes do not affect your
                  current billing cycle. You can view current pricing at{' '}
                  <a href="/pricing" className="text-red-400 hover:text-red-300 transition-colors">
                    fastlytics.app/pricing
                  </a>
                  .
                </p>
                <p>
                  All payments are processed by Dodo Payments. By subscribing, you agree to Dodo
                  Payments' terms and privacy policy. We do not store your full payment card
                  details.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">4. Free Tier Usage</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  The Free tier provides access to the current Formula 1 season with certain
                  limitations, including a 5-minute session replay cap. We reserve the right to
                  modify Free tier features at any time.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">5. Acceptable Use</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p className="mb-3">You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Use the Service for any unlawful purpose or in violation of any regulations
                  </li>
                  <li>Attempt to gain unauthorized access to any part of the Service</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>
                    Scrape, data-mine, or systematically extract data from the Service without
                    permission
                  </li>
                  <li>Resell or redistribute access to the Service</li>
                  <li>Share your account credentials with others</li>
                </ul>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">
                6. Intellectual Property
              </h2>
              <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                <p>
                  The Fastlytics platform, including its code, design, branding, and user interface,
                  is owned by Fastlytics. You may not copy, modify, distribute, or create derivative
                  works without permission.
                </p>
                <p>
                  Race data accessed through the Service is sourced from publicly available timing
                  data. Fastlytics does not claim ownership of underlying race data or telemetry.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">7. Disclaimer</h2>
              <div className="space-y-3 text-[14px] leading-relaxed text-white/40">
                <p>
                  The Service is provided "as is" without warranties of any kind. While we strive
                  for accuracy, we do not guarantee the completeness, timeliness, or accuracy of
                  race data, telemetry, or any analysis presented.
                </p>
                <p>
                  Data accuracy depends on upstream sources accessed through the FastF1 library.
                  Data availability may vary by session, season, or region.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">
                8. Limitation of Liability
              </h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  In no event shall Fastlytics be liable for any indirect, incidental, or
                  consequential damages arising from your use of the Service, including but not
                  limited to data loss, profit loss, or business interruption.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">9. Termination</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms.
                  You may cancel your subscription at any time from your account settings. Upon
                  termination of a paid subscription, your access reverts to the Free tier at the
                  end of your billing period.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">
                10. F1 Trademark Disclaimer
              </h2>
              <div className="text-[13px] leading-relaxed text-white/25">
                <p>
                  This website is unofficial and is not associated in any way with the Formula 1
                  companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND
                  PRIX and related marks are trade marks of Formula One Licensing B.V.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">11. Changes to Terms</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  We may update these terms from time to time. Material changes will be communicated
                  via email or in-app notification. Continued use after changes constitutes
                  acceptance.
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export { TermsOfService };
export default TermsOfService;
