import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { Tick01Icon } from 'hugeicons-react';

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  comingSoon?: boolean;
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
  const isComingSoon = tier.comingSoon;

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className={`relative flex flex-col rounded-xl border p-6 transition-colors ${
        isComingSoon
          ? 'border-white/[0.04] bg-[#0c0c0e]/50 opacity-60'
          : isHighlighted
            ? 'border-red-500/30 bg-gradient-to-b from-red-500/[0.03] to-transparent shadow-[0_0_40px_rgba(239,68,68,0.06)]'
            : 'border-white/[0.06] bg-[#0c0c0e] hover:border-white/[0.1]'
      }`}
    >
      {isComingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white/[0.06] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Coming Soon
        </div>
      )}
      {isHighlighted && !isComingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
          Most Popular
        </div>
      )}

      <div className="mb-5 flex-grow-0">
        <h3
          className={`text-[17px] font-semibold tracking-[-0.01em] ${isComingSoon ? 'text-white/30' : 'text-white'}`}
        >
          {tier.name}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/35 min-h-[40px]">
          {tier.description}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-0.5">
          {price > 0 ? (
            <>
              <span className={`text-[13px] ${isComingSoon ? 'text-white/15' : 'text-white/30'}`}>
                $
              </span>
              <span
                className={`text-[40px] font-bold tracking-[-0.03em] leading-none ${isComingSoon ? 'text-white/15' : 'text-white'}`}
              >
                {price}
              </span>
              <span className={`text-[13px] ${isComingSoon ? 'text-white/15' : 'text-white/30'}`}>
                /{interval === 'monthly' ? 'mo' : 'yr'}
              </span>
            </>
          ) : (
            <span className="text-[40px] font-bold tracking-[-0.03em] leading-none text-white">
              Free
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 flex-grow space-y-3">
        {tier.features.map((feature, featureIndex) => {
          const isEverythingPlus = feature.toLowerCase().includes('everything in');
          return (
            <div
              key={feature}
              className={`flex items-start ${isEverythingPlus ? 'gap-0 mb-3' : 'gap-2.5'}`}
            >
              {!isEverythingPlus && (
                <Tick01Icon
                  className={`mt-0.5 size-3.5 shrink-0 ${isComingSoon ? 'text-white/10' : 'text-emerald-400'}`}
                />
              )}
              <span
                className={`text-[13px] leading-relaxed ${
                  isEverythingPlus
                    ? 'font-semibold text-white/70'
                    : isComingSoon
                      ? 'text-white/25'
                      : 'text-white/55'
                }`}
              >
                {feature}
              </span>
            </div>
          );
        })}
      </div>

      {isComingSoon ? (
        <button
          disabled
          className="flex h-11 w-full items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.01] text-[13px] font-semibold text-white/20 cursor-not-allowed"
        >
          {tier.cta}
        </button>
      ) : price === 0 ? (
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
          to={`/signup?checkoutTier=${tier.id}&checkoutInterval=${interval}`}
          className={`flex h-11 w-full items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
            isHighlighted
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.25)]'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {tier.cta}
        </Link>
      )}
    </m.div>
  );
}
