// knip-ignore
import React, { useMemo, useState } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingSections';
import { BillingToggle } from '@/components/payments/BillingToggle';
import { PricingCard, PricingTier } from '@/components/payments/PricingCard';
import { Tick01Icon, Cancel01Icon } from 'hugeicons-react';
import { SEO } from '@/components/layout/SEO';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';

const DEFAULT_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Full platform access limited to the current season.',
    features: [
      'Full telemetry, standings, and calendars',
      'Tyre strategy & track evolution',
      'Pace distribution & race progression',
      'Current season only',
      '5 minutes of session replay',
      '300 MCP API calls/month',
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
      'Everything in Free, plus:',
      'All season archives (historical data)',
      'Unlimited session replay',
      '3,000 MCP API calls/month',
      'Support a solo dev who is a uni student',
    ],
    cta: 'Subscribe to Pro',
    productIdMonthly: 'pdt_0NePm9aNHnQh5KxB7bsJM',
    productIdYearly: 'pdt_0NePm9bSX5fcBlgltYiIe',
  },
];

interface FeatureRow {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}

const COMPARISON_ROWS: FeatureRow[] = [
  { feature: 'Current season data', free: true, pro: true },
  { feature: 'Historical seasons', free: false, pro: true },
  { feature: 'Telemetry (speed, brake, throttle, gear, RPM, DRS)', free: true, pro: true },
  { feature: 'Session replay', free: '5 minutes', pro: 'Unlimited' },
  { feature: 'Driver & team standings', free: true, pro: true },
  { feature: 'Race calendar', free: true, pro: true },
  { feature: 'Driver & team profiles', free: true, pro: true },
  { feature: 'Driver & sector comparisons', free: true, pro: true },
  { feature: 'Lap position & gap evolution', free: true, pro: true },
  { feature: 'Tyre strategy & stint analysis', free: true, pro: true },
  { feature: 'Track evolution charts', free: true, pro: true },
  { feature: 'Pace distribution box plots', free: true, pro: true },
  { feature: 'Championship progression', free: true, pro: true },
  { feature: 'Team pace analysis', free: true, pro: true },
  { feature: 'News feed & discussions', free: true, pro: true },
  { feature: 'Saved charts & folders', free: true, pro: true },
  { feature: 'Public profile & comments', free: true, pro: true },
  { feature: 'MCP API calls /month', free: '300', pro: '3,000' },
];

const CheckCell = () => <Tick01Icon className="size-4 text-emerald-400" />;
const CrossCell = () => <Cancel01Icon className="size-4 text-white/10" />;

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? <CheckCell /> : <CrossCell />;
  }
  return <span className="text-[13px] text-white/50">{value}</span>;
}

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const Pricing = () => {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [searchParams] = useSearchParams();
  const { data: products } = useProducts();

  const tiers = useMemo(() => {
    return DEFAULT_TIERS.map((tier) => {
      if (tier.id === 'pro' && products?.pro) {
        return {
          ...tier,
          monthlyPrice: products.pro.monthly?.price ?? tier.monthlyPrice,
          yearlyPrice: products.pro.yearly?.price ?? tier.yearlyPrice,
          productIdMonthly: products.pro.monthly?.product_id ?? tier.productIdMonthly,
          productIdYearly: products.pro.yearly?.product_id ?? tier.productIdYearly,
        };
      }
      return tier;
    });
  }, [products]);

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
        description="Choose your Fastlytics plan. Free for full platform access, Pro for historical data and unlimited replay."
        keywords={[
          'f1 analytics pricing',
          'formula 1 data subscription',
          'motorsport analytics plans',
        ]}
      />

      <LandingNavbar />

      <main className="pt-28 pb-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
              Pricing
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
              Choose your race plan
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/40">
              Start free with full platform access. Upgrade to Pro for historical archives and
              unlimited session replay.
            </p>
          </m.div>

          {/* Checkout status message */}
          {checkoutMessage && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-center text-[14px] text-amber-300"
            >
              {checkoutMessage}
            </m.div>
          )}

          {/* Billing toggle */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex justify-center"
          >
            <BillingToggle interval={interval} onChange={setInterval} />
          </m.div>

          {/* Pricing cards */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-10 grid gap-5 lg:grid-cols-2 max-w-4xl mx-auto"
          >
            {tiers.map((tier, i) => (
              <PricingCard key={tier.id} tier={tier} interval={interval} index={i} />
            ))}
          </m.div>

          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-[12px] text-white/20"
          >
            All prices in USD. Cancel anytime from your account settings.
          </m.p>

          {/* Feature comparison */}
          <section className="mt-20">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <p className="text-[13px] font-semibold uppercase tracking-widest text-red-400">
                Compare
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-white">
                Full feature comparison
              </h2>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-xl border border-white/[0.06]"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-6 py-4 text-left text-[13px] font-semibold text-white/60">
                        Feature
                      </th>
                      <th className="w-1/4 px-6 py-4 text-center text-[13px] font-semibold text-white/40">
                        Free
                      </th>
                      <th className="w-1/4 px-6 py-4 text-center text-[13px] font-semibold text-red-400">
                        Pro
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
                        <td className="bg-red-500/[0.02] px-6 py-3.5 text-center">
                          <div className="flex justify-center">
                            <FeatureCell value={row.pro} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </m.div>
          </section>

          {/* FAQ section */}
          <section className="mt-20">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8"
            >
              <h3 className="text-lg font-semibold tracking-[-0.01em] text-white text-center">
                Common questions
              </h3>
              <div className="mt-6 grid gap-6 text-left sm:grid-cols-2">
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">Can I cancel anytime?</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    Yes. Cancel from your account settings. Access continues until the end of your
                    billing period. No refund for remaining time after the 7-day window.
                  </p>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">
                    What payment methods do you accept?
                  </h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    All major credit and debit cards, Apple Pay, and Google Pay via Dodo Payments.
                    We don't store your card details.
                  </p>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">Can I switch plans?</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    Yes. Upgrade or downgrade anytime. Upgrades take effect immediately; downgrades
                    apply at the end of your billing cycle.
                  </p>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/80">
                    Is there a free trial?
                  </h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/40">
                    The Free tier is the trial — full platform access for the current season with no
                    time limit and no credit card required.
                  </p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/faq"
                  className="text-[13px] text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  View all frequently asked questions
                </Link>
              </div>
            </m.div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Pricing;
