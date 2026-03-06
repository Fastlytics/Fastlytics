import React from 'react';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import LandingFooter from '@/components/layout/LandingFooter';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
// Using hugeicons-react as requested.
import {
  ArrowRight01Icon,
  Database01Icon,
  DashboardSpeed01Icon,
  Analytics01Icon,
} from 'hugeicons-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAbout } from '@/components/mobile';

const AboutUs = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileAbout />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6">
            About <span className="text-red-600">Fastlytics</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium">
            Democratizing Formula 1 data analysis for fans everywhere.
          </p>
        </motion.div>
      </section>

      {/* Mission & Tech Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-black uppercase italic mb-6">
              The <span className="text-red-600">Mission</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Fastlytics was built to bridge the gap between complex telemetry data and the
              passionate F1 fan. Most data tools are either too basic or require an engineering
              degree to understand. We believe that every fan deserves access to the same insights
              as the race strategists, presented in a beautiful, intuitive interface.
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-black uppercase italic mb-6">
              The <span className="text-red-600">Vision</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Fastlytics is more than just a tool; it's a community-driven project aiming to be the
              ultimate open-source F1 analytics platform. We are constantly evolving, adding new
              features, and refining our data models to provide the most accurate insights possible.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              Join us in building the future of fan-powered analysis. Whether you're a developer, a
              strategist, or just a passionate fan, there's a place for you here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid (Previously Animated Illustrations) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-black uppercase italic">
            Core <span className="text-red-600">Features</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: Database01Icon,
              title: 'Deep Data',
              description: 'Processing gigabytes of telemetry data to extract meaningful insights.',
              delay: 0.2,
            },
            {
              icon: DashboardSpeed01Icon,
              title: 'Real-time Speed',
              description:
                'Instant access to lap times, sector performance, and race pace analysis.',
              delay: 0.4,
            },
            {
              icon: Analytics01Icon,
              title: 'Strategic Insights',
              description: 'Uncovering the strategy calls that win or lose races.',
              delay: 0.6,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: item.delay }}
              className="bg-zinc-900/50 border border-zinc-800 p-8 hover:border-red-600/50 transition-colors group"
            >
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <item.icon className="w-12 h-12 text-red-600 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold uppercase italic mb-4">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Me Section */}
      <section className="py-20 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-black uppercase italic mb-8">
                The <span className="text-red-600">Story</span>
              </h2>
              <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                <p>
                  I've been an F1 fan since I was 9 years old, way back in 2013. As a kid, I was
                  mesmerized by the speed, the technology, and the strategy behind each race. Little
                  did I know that this passion would eventually lead me to build Fastlytics.
                </p>
                <p>
                  The idea for Fastlytics wasn't born overnight. Back in high school, I started
                  experimenting with F1 data using clunky Python scripts. I always wondered: "What
                  if I could build a website where anyone could easily access this data?"
                </p>
                <p>
                  The project really took off just three weeks ago. After my mid-semester exams, I
                  stumbled upon a video about the FastF1 API. That was the catalyst. I immediately
                  started working on Fastlytics, transforming my years-old idea into reality.
                </p>
                <p>
                  My goal is simple: create a platform where F1 fans can access detailed race data,
                  driver comparisons, and strategic insights without needing an engineering degree.
                </p>
              </div>
            </motion.div>

            {/* Photo Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-zinc-800 border-2 border-zinc-700 relative overflow-hidden group">
                <img
                  src="/subhash.jpg"
                  alt="Subhash"
                  className="w-full h-full object-cover group-hover:grayscale-0 transition-all duration-500"
                />

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

                {/* Cyber overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              {/* Name Tag */}
              <div className="absolute -bottom-6 -right-6 bg-red-600 text-white px-8 py-4 skew-x-[-10deg] border-2 border-white/10">
                <div className="skew-x-[10deg]">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Creator</p>
                  <p className="text-xl font-black uppercase italic">Subhash</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-black uppercase italic mb-8">
            Ready to Dive <span className="text-red-600">Deep?</span>
          </h2>
          <Link to="/dashboard">
            <Button className="bg-red-600 hover:bg-red-700 text-white text-xl px-12 py-8 font-black uppercase italic tracking-widest border-2 border-red-600 hover:border-red-500 rounded-none skew-x-[-10deg] hover:skew-x-0 transition-all duration-300 group">
              <span className="skew-x-[10deg] group-hover:skew-x-0 flex items-center gap-3">
                Launch Dashboard <ArrowRight01Icon className="w-6 h-6" />
              </span>
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export { AboutUs };
export default AboutUs;
