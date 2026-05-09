import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, X } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { request } from '@/lib/api-client';
import { BillingToggle } from '@/components/payments/BillingToggle';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  cancelPath: string;
}

const PRO_PRODUCTS = {
  monthly: {
    productId: 'pdt_0NePm9aNHnQh5KxB7bsJM',
    price: 5.99,
    suffix: '/mo',
  },
  yearly: {
    productId: 'pdt_0NePm9bSX5fcBlgltYiIe',
    price: 54.99,
    suffix: '/yr',
  },
} as const;

const PRO_FEATURES = [
  'Full historical season access',
  'Unlimited session replay',
  'All telemetry and analysis tools',
  'Driver and team profiles',
  'Championship progression',
  'Team pace analysis',
];

const ULTRA_FEATURES = [
  'Everything in Pro',
  'AI race predictions',
  'AI strategy recommendations',
  'AI driver form analysis',
];

function buildReturnUrl(path: string, status: 'cancelled' | 'failed') {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('checkout', status);
  return `${url.pathname}${url.search}`;
}

export function UpgradeModal({ open, onClose, cancelPath }: UpgradeModalProps) {
  const { user, profile } = useAuth();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = useMemo(() => PRO_PRODUCTS[interval], [interval]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleUpgrade = async () => {
    if (!user || isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await request<{ checkout_url: string }>('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedProduct.productId,
          customer_email: user.email || '',
          customer_name: profile?.full_name || user.email?.split('@')[0] || 'User',
          user_id: user.id,
          return_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}${buildReturnUrl(cancelPath, 'cancelled')}`,
        }),
      });

      window.location.assign(response.checkout_url);
    } catch (err) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-[#030406]/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 top-[8vh] z-[81] mx-auto w-[min(960px,calc(100vw-2rem))]"
          >
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09090b] shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
              <div className="border-b border-white/[0.06] px-6 py-5 lg:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-red-400">
                      Upgrade
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white lg:text-3xl">
                      Unlock historical seasons and unlimited replay
                    </h2>
                    <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/45">
                      Pro gives you the full Fastlytics experience without leaving the dashboard
                      flow.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/45 transition-colors hover:text-white"
                    aria-label="Close upgrade modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-6">
                  <BillingToggle interval={interval} onChange={setInterval} />
                </div>
              </div>

              <div className="grid gap-5 p-6 lg:grid-cols-2 lg:p-8">
                <div className="rounded-2xl border border-red-500/20 bg-[#0c0c0e] p-6 shadow-[0_0_0_1px_rgba(239,68,68,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-red-400">
                        Pro
                      </p>
                      <h3 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-white">
                        ${selectedProduct.price}
                        <span className="ml-1 text-[14px] font-medium text-white/35">
                          {selectedProduct.suffix}
                        </span>
                      </h3>
                    </div>
                    <div className="rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
                      Best Value
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {PRO_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        <span className="text-[14px] leading-relaxed text-white/62">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[13px] text-red-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {isLoading ? 'Opening Checkout...' : 'Upgrade to Pro'}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e] p-6 opacity-75">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      Ultra
                    </p>
                    <h3 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-white/85">
                      $10.99
                      <span className="ml-1 text-[14px] font-medium text-white/25">/mo</span>
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                      AI-powered features are planned but not live yet.
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    {ULTRA_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
                        <span className="text-[14px] leading-relaxed text-white/40">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 text-[14px] font-semibold text-white/25"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpgradeModal;
