// knip-ignore
import React from 'react';
import { m } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;
const LAST_UPDATED = 'May 15, 2025';

const TOC_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'eligibility', label: 'Refund Eligibility' },
  { id: 'non-refundable', label: 'Non-Refundable' },
  { id: 'how-to', label: 'How to Request' },
  { id: 'cancellations', label: 'Cancellations' },
  { id: 'chargebacks', label: 'Chargebacks' },
];

const RefundPolicy = () => {
  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Refund Policy"
        description="Fastlytics refund policy - eligibility, process, and terms for subscription and digital purchases."
      />
      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
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
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
              <div className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-[12px] text-white/40">Last updated {LAST_UPDATED}</span>
            </div>
          </m.div>

          {/* Layout: TOC + Content */}
          <div className="mt-12 grid gap-12 lg:grid-cols-[220px_1fr]">
            {/* Sticky TOC */}
            <m.aside
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="hidden lg:block"
            >
              <nav className="sticky top-24 space-y-1">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/25">
                  On this page
                </p>
                {TOC_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-md px-2.5 py-1.5 text-[13px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </m.aside>

            {/* Content */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="max-w-3xl space-y-10"
            >
              {/* Quick Summary */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-[14px] font-semibold text-white mb-2">Quick summary</h3>
                <ul className="space-y-1.5 text-[13px] text-white/40">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-400">✓</span>
                    Full refund within 7 days of purchase or renewal
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-400">✓</span>
                    Prorated refund for extended service outages (&gt;48h)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-400">✓</span>
                    Full refund for billing errors
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-emerald-400">✓</span>
                    Cancel anytime — access continues until end of billing period
                  </li>
                </ul>
              </div>

              <section id="overview">
                <h2 className="text-[18px] font-semibold text-white mb-4">1. Overview</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    Fastlytics offers a Free tier and a Pro subscription plan. This policy governs
                    refunds for all paid purchases made through our platform, processed via Dodo
                    Payments.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="eligibility">
                <h2 className="text-[18px] font-semibold text-white mb-4">2. Refund Eligibility</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p className="mb-3">
                    Subscriptions are billed in advance on a monthly or annual basis. You may be
                    eligible for a refund under the following conditions:
                  </p>
                  <div className="space-y-4 mt-4">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <h4 className="text-[13px] font-semibold text-white/80 mb-1.5">
                        Within 7 days of purchase
                      </h4>
                      <p className="text-[13px] text-white/35">
                        Full refund available for any subscription plan if requested within 7 days
                        of the initial purchase or renewal. No questions asked.
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <h4 className="text-[13px] font-semibold text-white/80 mb-1.5">
                        Service unavailability
                      </h4>
                      <p className="text-[13px] text-white/35">
                        If core platform features (telemetry, session replay, race data) are
                        unavailable for more than 48 consecutive hours due to issues on our end, you
                        may request a prorated refund for the affected period.
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <h4 className="text-[13px] font-semibold text-white/80 mb-1.5">
                        Billing error
                      </h4>
                      <p className="text-[13px] text-white/35">
                        If you were charged incorrectly due to a technical error, we will issue a
                        full refund and correct the billing immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="non-refundable">
                <h2 className="text-[18px] font-semibold text-white mb-4">
                  3. Non-Refundable Situations
                </h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Requests made more than 7 days after the purchase or renewal date.</li>
                    <li>
                      Partial months or unused time on a subscription that has not been cancelled.
                    </li>
                    <li>Downgrades from Pro to Free after the refund window has closed.</li>
                    <li>
                      Account suspension or termination due to violation of our Terms of Service
                      (including abuse of community features).
                    </li>
                  </ul>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="how-to">
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
                    with:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 mt-3">
                    <li>Your account email address</li>
                    <li>The reason for your request</li>
                    <li>The approximate date of the charge</li>
                  </ul>
                  <p className="mt-3">
                    We review all refund requests within 5 business days. Approved refunds are
                    processed back to the original payment method within 5–10 business days.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="cancellations">
                <h2 className="text-[18px] font-semibold text-white mb-4">5. Cancellations</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    You can cancel your subscription at any time from your account settings.
                    Cancellation takes effect at the end of your current billing period — you retain
                    full Pro access until that date. No refunds are issued for the remaining portion
                    of a billing period after the 7-day window.
                  </p>
                  <p className="mt-3">
                    After cancellation, your account reverts to the Free tier. Your profile,
                    comments, saved charts, and community content are preserved.
                  </p>
                </div>
              </section>

              <div className="h-px w-full bg-white/[0.06]" />

              <section id="chargebacks">
                <h2 className="text-[18px] font-semibold text-white mb-4">6. Chargebacks</h2>
                <div className="text-[14px] leading-relaxed text-white/40">
                  <p>
                    If you initiate a chargeback with your bank or card issuer for a valid charge,
                    your account may be suspended pending resolution. We encourage you to contact us
                    first so we can resolve the issue directly — it's faster for both of us.
                  </p>
                </div>
              </section>
            </m.div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default RefundPolicy;
