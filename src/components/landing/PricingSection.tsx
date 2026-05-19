import { useState, useMemo } from 'react';
import { m } from 'motion/react';
import { BillingToggle } from '@/components/payments/BillingToggle';
import { PricingCard, PricingTier } from '@/components/payments/PricingCard';
import { Link } from 'react-router-dom';
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
    ],
    cta: 'Subscribe to Pro',
    productIdMonthly: 'pdt_0NePm9aNHnQh5KxB7bsJM',
    productIdYearly: 'pdt_0NePm9bSX5fcBlgltYiIe',
  },
];

export function PricingSection() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
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

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-white/[0.04] py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <m.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[13px] font-semibold uppercase tracking-widest text-red-400"
          >
            Pricing
          </m.p>
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
          >
            Choose your race plan
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/40"
          >
            Start free with full platform access. Upgrade to Pro for historical archives and
            unlimited session replay, while supporting a solo dev who's a uni student! 🚀
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <BillingToggle interval={interval} onChange={setInterval} />
          </m.div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2 max-w-4xl mx-auto">
          {tiers.map((tier, i) => (
            <PricingCard key={tier.id} tier={tier} interval={interval} index={i} />
          ))}
        </div>

        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-[12px] text-white/20"
        >
          All prices in USD. Cancel anytime from your account settings.{' '}
          <Link
            to="/pricing"
            className="text-white/40 underline underline-offset-2 hover:text-white/60"
          >
            View full feature comparison
          </Link>
        </m.p>
      </div>
    </section>
  );
}
