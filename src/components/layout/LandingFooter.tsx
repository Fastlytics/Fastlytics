import React from 'react';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';

const LandingFooter = () => {
  return (
    <footer className="bg-black border-t-4 border-red-600 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <Gauge className="h-8 w-8 text-red-600 group-hover:rotate-180 transition-transform duration-700" />
              <span className="text-2xl font-black tracking-tighter uppercase italic text-white">
                Fast<span className="text-red-600">lytics</span>
              </span>
            </Link>
            <p className="text-gray-400 text-lg max-w-md font-mono">
              Professional grade Formula 1 analytics for the modern fan. Data visualization
              redefined.
            </p>
          </div>

          <div>
            <h3 className="text-red-600 font-black uppercase tracking-widest mb-6 text-lg">
              Platform
            </h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/dashboard"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/races"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Races
                </Link>
              </li>
              <li>
                <Link
                  to="/standings/drivers"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Standings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-red-600 font-black uppercase tracking-widest mb-6 text-lg">
              Legal
            </h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Refunds
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white font-bold uppercase tracking-wide transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 font-mono text-sm">
            © {new Date().getFullYear()} FASTLYTICS. ALL RIGHTS RESERVED.
          </p>
          <p className="text-gray-600 font-mono text-xs uppercase">
            Not affiliated with Formula One World Championship Limited.
          </p>
        </div>
      </div>
    </footer>
  );
};

export { LandingFooter };
export default LandingFooter;
