import { useState } from 'react';
import { motion } from 'motion/react';
import { BillingToggle } from '@/components/payments/BillingToggle';
import { PricingCard, PricingTier } from '@/components/payments/PricingCard';
import { Link } from 'react-router-dom';

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

export function PricingSection() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

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
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[13px] font-semibold uppercase tracking-widest text-red-400"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
          >
            Choose your race plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/40"
          >
            Start free with full platform access. Upgrade to Pro for historical data and unlimited
            session replay.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
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

        <motion.p
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
        </motion.p>
      </div>
    </section>
  );
}
