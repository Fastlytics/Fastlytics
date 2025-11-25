import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Github, Twitter, Mail, Gauge, Heart, 
  ExternalLink
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };
  
  const featuresLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Races', href: '/races' },
    { name: 'Standings', href: '/standings/drivers' },
  ];
  
  const quickLinks = [
    { name: 'Discord', href: 'https://discord.gg/bSEGSMwFDn', external: true },
    { name: 'FAQ', href: '/faq' },
    { name: 'Privacy', href: '/privacy-policy' },
    { name: 'Pricing', href: '/#pricing' },
  ];
  
  const socialLinks = [
    { name: 'Twitter', href: 'https://x.com/fastlytics', icon: <Twitter className="h-5 w-5" /> },
    { name: 'GitHub', href: 'https://github.com/subhashhhhhh', icon: <Github className="h-5 w-5" /> },
    { name: 'Mail', href: 'mailto:contact@fastlytics.app', icon: <Mail className="h-5 w-5" /> },
  ];

  return (
    <footer className="bg-gradient-to-b from-black to-gray-950 border-t border-gray-800/30 mt-auto text-gray-400 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600/0 via-red-600 to-red-600/0"></div>
      <div className="absolute -top-64 -left-64 w-[500px] h-[500px] rounded-full bg-red-900/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-[300px] h-[300px] rounded-full bg-red-900/5 blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto py-12 px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="lg:col-span-6 space-y-4">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-white hover:text-red-500 transition-colors mb-2 w-fit"
            >
              <div className="relative">
                <Gauge className="h-6 w-6 text-red-500" />
                <motion.div 
                  className="absolute inset-0 rounded-full bg-red-500/20" 
                  animate={{ scale: [1, 1.3, 1] }} 
                  transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                />
              </div>
              <span className="font-bold text-xl tracking-tight">Fast<span className="text-red-500">lytics</span></span>
            </Link>
            
            <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
              Advanced F1 analytics and insights for racing fans.
            </p>
            
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white p-2 rounded-full bg-gray-900/70 border border-gray-800/50 hover:border-red-500/30 hover:bg-gray-800 transition-all duration-200"
                  aria-label={link.name}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold mb-4 text-white text-sm tracking-wide">
              Navigate
            </h3>
            <ul className="space-y-2">
              {featuresLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-gray-400 hover:text-white transition-colors text-sm hover:translate-x-1 transform duration-200 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold mb-4 text-white text-sm tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                    >
                      <span className="hover:translate-x-1 transition-transform duration-200">{link.name}</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  ) : (
                    <Link 
                      to={link.href} 
                      className="text-gray-400 hover:text-white transition-colors text-sm hover:translate-x-1 transform duration-200 inline-block"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-gray-500">
            <span>&copy; {currentYear} Fastlytics. All rights reserved.</span>
            <span>Not affiliated with Formula 1</span>
          </div>
          <div className="flex items-center text-gray-500 text-xs">
            <span>Made with</span>
            <Heart className="h-3 w-3 mx-1.5 text-red-500 fill-current animate-pulse" />
            <span>for F1 fans by <a href="https://github.com/subhashhhhhh" target="_blank" rel="noopener noreferrer" className="text-white hover:text-red-400 transition-colors">Subhash</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
