import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ArrowLeft01Icon } from 'hugeicons-react';
import { Gauge } from 'lucide-react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import LandingFooter from '@/components/layout/LandingFooter';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNotFound from '@/components/mobile/MobileNotFound';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  if (isMobile) {
    return <MobileNotFound />;
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white flex flex-col font-sans">
      <LandingNavbar />

      <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 -left-10 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px]"></div>

        <div className="relative z-10 text-center max-w-4xl px-6">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Gauge className="h-32 w-32 text-red-600 opacity-20 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-150 blur-sm" />
              <h1 className="text-[12rem] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                404
              </h1>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-8 text-white">
            Pit Lane <span className="text-red-600">Closed</span>
          </h2>

          <p className="text-xl text-gray-400 font-mono mb-12 max-w-2xl mx-auto leading-relaxed">
            The telemetry data for this sector is missing. You might have taken a wrong turn at the
            chicane.
          </p>

          <div className="flex flex-row gap-6 justify-center">
            <Button
              onClick={() => navigate(-1)}
              className="bg-transparent hover:bg-white hover:text-black text-white border-2 border-white/20 hover:border-white text-lg font-bold uppercase tracking-widest px-8 py-6 h-auto transition-all duration-300 rounded-none"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft01Icon className="h-5 w-5" />
                Go Back
              </span>
            </Button>

            <Button
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold uppercase tracking-widest px-8 py-6 h-auto transition-all duration-300 border-2 border-red-600 hover:border-red-500 rounded-none shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Return to Pits
            </Button>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export { NotFound };
export default NotFound;
