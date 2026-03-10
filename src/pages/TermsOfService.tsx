import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import LandingFooter from '@/components/layout/LandingFooter';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTermsOfService } from '@/components/mobile';

const TermsOfService = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileTermsOfService />;
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
            Terms of <span className="text-red-600">Service</span>
          </h1>

          <div className="prose prose-invert prose-lg max-w-none space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing our website, you agree to be bound by these Terms of Service and to
                comply with all applicable laws and regulations. If you do not agree with these
                terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information
                or software) on Fastlytics' website for personal, non-commercial transitory viewing
                only. This is the grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>modify or copy the materials;</li>
                <li>
                  use the materials for any commercial purpose, or for any public display
                  (commercial or non-commercial);
                </li>
                <li>
                  attempt to decompile or reverse engineer any software contained on Fastlytics'
                  website;
                </li>
                <li>remove any copyright or other proprietary notations from the materials; or</li>
                <li>
                  transfer the materials to another person or "mirror" the materials on any other
                  server.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
              <p>
                The materials on Fastlytics' website are provided on an 'as is' basis. Fastlytics
                makes no warranties, expressed or implied, and hereby disclaims and negates all
                other warranties including, without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
              <p>
                In no event shall Fastlytics or its suppliers be liable for any damages (including,
                without limitation, damages for loss of data or profit, or due to business
                interruption) arising out of the use or inability to use the materials on
                Fastlytics' website, even if Fastlytics or a Fastlytics authorized representative
                has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. F1 Trademark Disclaimer</h2>
              <p className="text-sm text-zinc-500 italic">
                This website is unofficial and is not associated in any way with the Formula 1
                companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND
                PRIX and related marks are trade marks of Formula One Licensing B.V.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export { TermsOfService };
export default TermsOfService;
