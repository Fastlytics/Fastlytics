import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import LandingFooter from '@/components/layout/LandingFooter';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileRefundPolicy } from '@/components/mobile';

const RefundPolicy = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileRefundPolicy />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white overflow-x-hidden flex flex-col">
      <LandingNavbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-12">
            Refund <span className="text-red-600">Policy</span>
          </h1>

          <div className="prose prose-invert prose-lg max-w-none">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-none">
              <p className="text-xl text-gray-300 leading-relaxed font-medium">
                Fastlytics is now free for everyone. No payment is required to use our services.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export { RefundPolicy };
export default RefundPolicy;
