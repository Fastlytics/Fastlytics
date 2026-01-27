import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import { Tick01Icon, CheckmarkCircle02Icon, StarIcon } from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { startTrial } from '@/hooks/useSubscription';
import { toast } from 'sonner';

import MobileFooter from './MobileFooter';

interface LocationState {
  from?: string;
}

const MobilePricing: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'biannual' | 'yearly'>(
    'monthly'
  );
  const navigate = useNavigate();
  const location = useLocation();

  const featureFlag = import.meta.env.VITE_ENABLE_SUBSCRIPTIONS;
  const isSubscriptionsEnabled = featureFlag === undefined || featureFlag === 'true';

  const handleStartTrial = async () => {
    if (!isSubscriptionsEnabled) return;

    if (!user) {
      navigate('/register');
      return;
    }

    try {
      await startTrial(user.id);
      toast.success('Welcome on the grid!', {
        description: 'Your 14-day free trial has started.',
      });
      const from = (location.state as LocationState)?.from || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error(error);
      toast.error('Could not start trial', {
        description: 'There was an error starting your trial. Please try again.',
      });
    }
  };

  const proPrices = {
    monthly: { price: 6.99, label: '/mo', period: 'Monthly' },
    quarterly: { price: 19.99, label: '/3 mo', period: 'Quarterly' },
    biannual: { price: 32.99, label: '/6 mo', period: 'Semi-Annual' },
    yearly: { price: 59.99, label: '/yr', period: 'Yearly' },
  };

  const currentPro = proPrices[billingCycle];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      {/* Header */}
      <header className="relative z-20 sticky top-0 bg-black border-b-2 border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <Gauge className="h-6 w-6 text-red-600 transition-transform group-hover:rotate-180 duration-500" />
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Fast<span className="text-red-600">lytics</span>
            </span>
          </Link>
          <Link to={user ? '/dashboard' : '/auth'}>
            <button className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors">
              {user ? 'Dashboard' : 'Sign Up'}
            </button>
          </Link>
        </div>
      </header>

      <main className="px-4 pt-12 pb-20 relative">
        {/* OVERLAY FOR MOBILE COMING SOON */}
        {!isSubscriptionsEnabled && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-sm z-50">
              <div className="bg-black/95 border-2 border-red-600 p-6 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.5)] transform -rotate-3 text-center backdrop-blur-md">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">
                  Coming <span className="text-red-600">Soon</span>
                </h2>
                <p className="text-gray-400 font-mono uppercase tracking-widest text-[10px]">
                  Subscriptions are currently disabled
                </p>
                <p className="text-gray-500 font-mono text-[10px] mt-4 max-w-xs mx-auto">
                  All premium features are currently free for everyone during our beta period.
                </p>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left mb-12"
        >
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.85] mb-6">
            Choose Your <br />
            <span className="text-red-600">Pace</span>
          </h1>
          <p className="text-gray-400 text-sm font-mono uppercase leading-relaxed max-w-xs">
            Unlock advanced telemetry and gain the competitive edge.
          </p>
        </motion.div>

        <div
          className={cn(
            'space-y-8',
            !isSubscriptionsEnabled && 'opacity-30 grayscale pointer-events-none'
          )}
        >
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black border-2 border-white/20 p-6 relative"
          >
            <div className="mb-6">
              <h3 className="text-xl font-black uppercase italic mb-2 text-gray-300">Standard</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">Free</span>
              </div>
              <p className="text-gray-500 font-mono mt-2 text-xs uppercase">
                Essential telemetry for casual analysis.
              </p>
            </div>

            <ul className="space-y-3 mb-8 font-mono text-xs text-gray-400">
              <li className="flex items-center gap-3">
                <Tick01Icon className="w-4 h-4 text-gray-500" />
                <span>Standard Telemetry Data</span>
              </li>
              <li className="flex items-center gap-3">
                <Tick01Icon className="w-4 h-4 text-gray-500" />
                <span>Race Results & Standings</span>
              </li>
              <li className="flex items-center gap-3">
                <Tick01Icon className="w-4 h-4 text-gray-500" />
                <span>Basic Lap Times</span>
              </li>
            </ul>

            <Link to="/auth">
              <button className="w-full bg-transparent border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black py-4 tracking-wider transition-all text-sm">
                Get Started
              </button>
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-950 border-2 border-red-600 p-6 relative"
          >
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider flex items-center gap-1">
              14 Days Free
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-xl font-black uppercase italic mb-2 text-red-600 flex items-center gap-2">
                Pro{' '}
                <span className="text-white text-[10px] bg-red-600 px-2 py-0.5 border border-red-500 not-italic font-sans uppercase font-bold rounded-sm">
                  All Access
                </span>
              </h3>

              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-black tracking-tight">${currentPro.price}</span>
                <span className="text-gray-400 font-mono text-sm">{currentPro.label}</span>
              </div>
              <p className="text-gray-400 font-mono mt-2 text-xs uppercase">
                Advanced tools for serious analysis.
              </p>
            </div>

            {/* Billing Cycle Selector */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(Object.keys(proPrices) as Array<keyof typeof proPrices>).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    'px-2 py-2 text-[10px] font-bold uppercase border-2 transition-all duration-200 rounded-lg',
                    billingCycle === cycle
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-transparent border-white/20 text-gray-400 hover:border-white hover:text-white'
                  )}
                >
                  {proPrices[cycle].period}
                </button>
              ))}
            </div>

            <ul className="space-y-3 mb-8 font-mono text-xs text-gray-300">
              <li className="flex items-center gap-3">
                <CheckmarkCircle02Icon className="w-4 h-4 text-red-600" />
                <span className="font-bold text-white">Advanced Telemetry</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckmarkCircle02Icon className="w-4 h-4 text-red-600" />
                <span className="font-bold text-white">Session Replay Access</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckmarkCircle02Icon className="w-4 h-4 text-red-600" />
                <span className="font-bold text-white">Time Synced Data</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckmarkCircle02Icon className="w-4 h-4 text-red-600" />
                <span className="font-bold text-white">Unlimited History</span>
              </li>
            </ul>

            <button
              onClick={handleStartTrial}
              className="w-full bg-red-600 border-2 border-red-600 text-white font-black uppercase py-4 tracking-wider transition-all text-sm hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              Start 14-Day Free Trial
            </button>

            <p className="text-center text-[10px] text-gray-500 mt-4 font-mono uppercase opacity-50">
              Secure payment via Paddle. Cancel anytime.
            </p>
          </motion.div>
        </div>

        <div className="mt-12 text-center border-t border-white/10 pt-8">
          <p className="text-gray-500 text-xs font-mono uppercase">
            Need a custom enterprise plan?{' '}
            <Link to="/contact" className="text-red-600 hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <MobileFooter />
    </div>
  );
};

export { MobilePricing };
export default MobilePricing;
