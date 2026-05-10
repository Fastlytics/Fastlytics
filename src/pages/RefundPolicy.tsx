// knip-ignore
import React from 'react';
import { m } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const RefundPolicy = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Refunds"
        description="Fastlytics refund policy - eligibility, process, and terms for subscription and digital purchases."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Legal
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Refund Policy
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/40">
              Eligibility, process, and terms for subscription refunds.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-12 space-y-10"
          >
            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">1. Overview</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  Fastlytics offers both a Free tier and a Pro subscription plan. This policy
                  governs refunds for all purchases made through our platform.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">2. Subscription Refunds</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p className="mb-3">
                  Subscriptions are billed in advance on a monthly or annual basis. You may be
                  eligible for a refund under the following conditions:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong className="text-white/70">Within 7 days of purchase:</strong> Full
                    refund available for any subscription plan if requested within 7 days of the
                    initial purchase or renewal.
                  </li>
                  <li>
                    <strong className="text-white/70">Service unavailability:</strong> If core
                    platform features are unavailable for more than 48 consecutive hours due to
                    issues on our end, you may request a prorated refund for the affected period.
                  </li>
                  <li>
                    <strong className="text-white/70">Billing error:</strong> If you were charged
                    incorrectly due to a technical error, we will issue a full refund and correct
                    the billing.
                  </li>
                </ul>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">
                3. Non-Refundable Situations
              </h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Requests made more than 7 days after the purchase or renewal date.</li>
                  <li>
                    Partial months or unused time on a subscription that has not been cancelled.
                  </li>
                  <li>
                    Downgrades from a higher tier to a lower tier after the refund window has
                    closed.
                  </li>
                </ul>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">
                4. How to Request a Refund
              </h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  To request a refund, contact us at{' '}
                  <a
                    href="mailto:contact@fastlytics.app"
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    contact@fastlytics.app
                  </a>{' '}
                  with your account email and the reason for your request. We review all refund
                  requests within 5 business days.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">5. Cancellations</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  You can cancel your subscription at any time from your account settings.
                  Cancellation takes effect at the end of your current billing period - you retain
                  access until that date. No refunds are issued for the remaining portion of a
                  billing period after the 7-day window.
                </p>
              </div>
            </section>

            <div className="h-px w-full bg-white/[0.06]" />

            <section>
              <h2 className="text-[18px] font-semibold text-white mb-4">6. Chargebacks</h2>
              <div className="text-[14px] leading-relaxed text-white/40">
                <p>
                  If you initiate a chargeback with your bank or card issuer for a valid charge,
                  your account may be suspended pending resolution. We encourage you to contact us
                  first so we can resolve the issue directly.
                </p>
              </div>
            </section>
          </m.div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default RefundPolicy;
