import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { BillingToggle } from '@/components/payments/BillingToggle';
import { PricingCard, PricingTier } from '@/components/payments/PricingCard';
import { Tick01Icon, Cancel01Icon } from 'hugeicons-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SEO } from '@/components/layout/SEO';
import { useSearchParams } from 'react-router-dom';

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Full platform access limited to the current season.',
    features: [
      'Full telemetry — speed, brake, throttle, gear, RPM, DRS',
      'Driver & team standings',
      'Race calendar & schedule',
      'Driver & team profiles',
      'Lap position & gap evolution',
      'Tyre strategy & stint analysis',
      'Track evolution charts',
      'Pace distribution box plots',
      'Championship progression charts',
      'Team pace analysis & rankings',
      'Current season only',
      '5 minutes of session replay',
    ],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 5.99,
    yearlyPrice: 54.99,
    description: 'Unlock full historical data and unlimited session replay.',
    highlighted: true,
    features: [
      'Everything in Free',
      'All season archives — full historical data',
      'Unlimited session replay',
    ],
    cta: 'Subscribe to Pro',
    productIdMonthly: 'pdt_0NePm9aNHnQh5KxB7bsJM',
    productIdYearly: 'pdt_0NePm9bSX5fcBlgltYiIe',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    monthlyPrice: 10.99,
    yearlyPrice: 94.99,
    description: 'AI-powered insights and predictions. Coming soon.',
    comingSoon: true,
    features: [
      'Everything in Pro',
      'AI race predictions',
      'AI strategy recommendations',
      'AI driver form analysis',
      'Priority support',
    ],
    cta: 'Coming Soon',
    productIdMonthly: 'pdt_0NePm9cHvDbArb2hZoCjl',
    productIdYearly: 'pdt_0NePm9emnFj4lzDXEbwhH',
  },
];

interface FeatureRow {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  ultra: boolean | string;
}

const COMPARISON_ROWS: FeatureRow[] = [
  { feature: 'Current season data', free: true, pro: true, ultra: true },
  { feature: 'Historical seasons', free: false, pro: true, ultra: true },
  {
    feature: 'Telemetry (speed, brake, throttle, gear, RPM, DRS)',
    free: true,
    pro: true,
    ultra: true,
  },
  { feature: 'Session replay', free: '5 minutes', pro: 'Unlimited', ultra: 'Unlimited' },
  { feature: 'Driver & team standings', free: true, pro: true, ultra: true },
  { feature: 'Race calendar', free: true, pro: true, ultra: true },
  { feature: 'Driver & team profiles', free: true, pro: true, ultra: true },
  { feature: 'Driver & sector comparisons', free: true, pro: true, ultra: true },
  { feature: 'Lap position & gap evolution', free: true, pro: true, ultra: true },
  { feature: 'Tyre strategy & stint analysis', free: true, pro: true, ultra: true },
  { feature: 'Track evolution charts', free: true, pro: true, ultra: true },
  { feature: 'Pace distribution box plots', free: true, pro: true, ultra: true },
  { feature: 'Championship progression', free: true, pro: true, ultra: true },
  { feature: 'Team pace analysis', free: true, pro: true, ultra: true },
  { feature: 'AI race predictions', free: false, pro: false, ultra: 'Coming soon' },
  { feature: 'AI strategy recommendations', free: false, pro: false, ultra: 'Coming soon' },
  { feature: 'AI driver form analysis', free: false, pro: false, ultra: 'Coming soon' },
  { feature: 'Priority support', free: false, pro: false, ultra: 'Coming soon' },
];

const CheckCell = () => <Tick01Icon className="h-4 w-4 text-emerald-400" />;
const CrossCell = () => <Cancel01Icon className="h-4 w-4 text-white/10" />;

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? <CheckCell /> : <CrossCell />;
  }
  return <span className="text-[13px] text-white/50">{value}</span>;
}

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const Pricing = () => {
  const isMobile = useIsMobile();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [searchParams] = useSearchParams();
  const checkoutState = searchParams.get('checkout');
  const checkoutMessage = useMemo(() => {
    if (checkoutState === 'cancelled') {
      return 'Payment was cancelled. No charge was made.';
    }
    if (checkoutState === 'failed') {
      return 'Payment failed. Please try again.';
    }
    return null;
  }, [checkoutState]);

  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30"
    >
      <SEO
        title="Pricing — Fastlytics"
        description="Choose your Fastlytics plan. Free for full platform access, Pro for historical data and unlimited replay. Ultra with AI insights coming soon."
        keywords={[
          'f1 analytics pricing',
          'formula 1 data subscription',
          'motorsport analytics plans',
        ]}
      />

      <LandingNavbar />

      <main className="pt-24 pb-20">
        <section className="px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {checkoutMessage && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto mb-8 max-w-2xl rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-center text-[14px] text-amber-300"
              >
                {checkoutMessage}
              </motion.div>
            )}
            <div className="mx-auto max-w-2xl text-center">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
              >
                Choose your race plan
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/40"
              >
                Start free with full platform access. Upgrade to Pro for historical archives and
                unlimited session replay.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8"
              >
                <BillingToggle interval={interval} onChange={setInterval} />
              </motion.div>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {TIERS.map((tier, i) => (
                <PricingCard key={tier.id} tier={tier} interval={interval} index={i} />
              ))}
            </div>
          </div>
        </section>

        {!isMobile && (
          <section className="mt-20 px-5 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold tracking-[-0.01em] text-white text-center"
              >
                Full feature comparison
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-8 overflow-hidden rounded-xl border border-white/[0.06]"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                        <th className="px-6 py-4 text-left text-[13px] font-semibold text-white/60">
                          Feature
                        </th>
                        <th className="px-6 py-4 text-center text-[13px] font-semibold text-white/40">
                          Free
                        </th>
                        <th className="px-6 py-4 text-center text-[13px] font-semibold text-red-400">
                          Pro
                        </th>
                        <th className="px-6 py-4 text-center text-[13px] font-semibold text-white/40">
                          Ultra
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_ROWS.map((row, i) => (
                        <tr
                          key={row.feature}
                          className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.01] ${
                            i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.005]'
                          }`}
                        >
                          <td className="px-6 py-3.5 text-[13px] text-white/70">{row.feature}</td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex justify-center">
                              <FeatureCell value={row.free} />
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-center bg-red-500/[0.02]">
                            <div className="flex justify-center">
                              <FeatureCell value={row.pro} />
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex justify-center">
                              <FeatureCell value={row.ultra} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        <section className="mt-20 px-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center"
            >
              <h3 className="text-lg font-bold tracking-[-0.01em] text-white">
                Frequently asked questions
              </h3>
              <div className="mt-6 grid gap-6 text-left sm:grid-cols-2">
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">Can I cancel anytime?</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    Yes. You can cancel your subscription at any time from your account settings.
                    Your access continues until the end of the billing period.
                  </p>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">
                    What payment methods do you accept?
                  </h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    We accept all major credit and debit cards, Apple Pay, and Google Pay via Dodo
                    Payments.
                  </p>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">Can I switch plans?</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    Yes. Upgrade or downgrade anytime from your account. Upgrades take effect
                    immediately; downgrades apply at the end of your billing cycle.
                  </p>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">
                    Is there a free trial?
                  </h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    The Free tier gives you full platform access to the current season with 5
                    minutes of session replay. No credit card required.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export { Pricing };
export default Pricing;
