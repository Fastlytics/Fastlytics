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
    description: 'Current season access with core telemetry features.',
    features: [
      'Current season race data',
      'Full telemetry — speed, brake, throttle, gear, RPM, DRS',
      'Driver & team standings',
      'Race calendar & schedule',
      '5 minutes of session replay',
      'Driver and sector comparisons',
    ],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 5.99,
    yearlyPrice: 54.99,
    description: 'Full historical access, unlimited replay, and deeper analysis.',
    highlighted: true,
    features: [
      'Everything in Free',
      'All season archives — full historical data',
      'Unlimited session replay',
      'Lap position & gap evolution',
      'Tyre strategy & stint analysis',
      'Track evolution charts',
      'Pace distribution box plots',
    ],
    cta: 'Subscribe to Pro',
    productIdMonthly: 'pdt_pro_monthly',
    productIdYearly: 'pdt_pro_yearly',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    monthlyPrice: 10.99,
    yearlyPrice: 94.99,
    description: 'Complete platform access with upcoming AI-powered insights.',
    features: [
      'Everything in Pro',
      'Championship progression charts',
      'Team pace analysis & rankings',
      'AI race predictions (coming soon)',
      'AI strategy recommendations (coming soon)',
      'AI driver form analysis (coming soon)',
      'Priority support',
    ],
    cta: 'Subscribe to Ultra',
    productIdMonthly: 'pdt_ultra_monthly',
    productIdYearly: 'pdt_ultra_yearly',
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
            Start free. Upgrade for historical data, unlimited replay, and AI-powered analysis.
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
