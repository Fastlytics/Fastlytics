import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tick01Icon } from 'hugeicons-react';

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  productIdMonthly?: string;
  productIdYearly?: string;
}

interface PricingCardProps {
  tier: PricingTier;
  interval: 'monthly' | 'yearly';
  index: number;
}

export function PricingCard({ tier, interval, index }: PricingCardProps) {
  const price = interval === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  const isHighlighted = tier.highlighted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className={`relative flex flex-col rounded-xl border p-6 transition-colors ${
        isHighlighted
          ? 'border-red-500/30 bg-gradient-to-b from-red-500/[0.03] to-transparent shadow-[0_0_40px_rgba(239,68,68,0.06)]'
          : 'border-white/[0.06] bg-[#0c0c0e] hover:border-white/[0.1]'
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
          Most Popular
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-[17px] font-bold tracking-[-0.01em] text-white">{tier.name}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/35">{tier.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[13px] text-white/30">$</span>
          <span className="text-[40px] font-bold tracking-[-0.03em] text-white leading-none">
            {price}
          </span>
          {price > 0 && (
            <span className="text-[13px] text-white/30">
              /{interval === 'monthly' ? 'mo' : 'yr'}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 flex-grow space-y-3">
        {tier.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2.5">
            <Tick01Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <span className="text-[13px] leading-relaxed text-white/55">{feature}</span>
          </div>
        ))}
      </div>

      {price === 0 ? (
        <Link
          to="/dashboard"
          className={`flex h-11 w-full items-center justify-center rounded-lg border text-[13px] font-semibold transition-all ${
            isHighlighted
              ? 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.06]'
              : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/[0.12] hover:text-white/80'
          }`}
        >
          {tier.cta}
        </Link>
      ) : (
        <Link
          to={`/checkout?tier=${tier.id}&interval=${interval}`}
          className={`flex h-11 w-full items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
            isHighlighted
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.25)]'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {tier.cta}
        </Link>
      )}
    </motion.div>
  );
}
