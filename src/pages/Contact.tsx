import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import LandingFooter from '@/components/layout/LandingFooter';
import { Mail01Icon, Location01Icon } from 'hugeicons-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileContact } from '@/components/mobile';

const Contact = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileContact />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white overflow-x-hidden flex flex-col">
      <LandingNavbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6">
            Get in <span className="text-red-600">Touch</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Have questions? We're here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 p-10 hover:border-red-600/50 transition-colors group text-center"
          >
            <div className="mb-6 inline-flex p-4 bg-zinc-800/50 rounded-full group-hover:bg-red-600/20 transition-colors">
              <Mail01Icon className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black uppercase italic mb-4">Email Us</h2>
            <a
              href="mailto:contact@fastlytics.app"
              className="text-xl text-gray-300 hover:text-white transition-colors block"
            >
              contact@fastlytics.app
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-zinc-900/50 border border-zinc-800 p-10 hover:border-red-600/50 transition-colors group text-center"
          >
            <div className="mb-6 inline-flex p-4 bg-zinc-800/50 rounded-full group-hover:bg-red-600/20 transition-colors">
              <Location01Icon className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black uppercase italic mb-4">Office</h2>
            <p className="text-xl text-gray-300">
              Venture Labs,
              <br />
              Thapar Institute, Punjab, India
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export { Contact };
export default Contact;
