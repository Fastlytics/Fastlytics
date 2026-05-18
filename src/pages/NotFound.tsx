import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, ArrowLeft01Icon } from 'hugeicons-react';
import LandingNavbar from '@/components/layout/LandingNavbar';
import { SEO } from '@/components/layout/SEO';

const INTER_STYLE = { fontFamily: "'Inter', sans-serif" } as const;

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location]);

  return (
    <div
      style={INTER_STYLE}
      className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/30 flex flex-col"
    >
      <SEO
        title="Page Not Found"
        description="The page you requested could not be found."
        noIndex
      />
      <LandingNavbar />

      <div className="flex-grow flex flex-col items-center justify-center px-5 py-32">
        <div className="text-center max-w-lg mx-auto">
          <div className="mb-4">
            <AlertCircleIcon className="size-12 text-red-400 mx-auto" />
          </div>
          <h1 className="text-7xl font-semibold tracking-[-0.03em] text-white">404</h1>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white/80">
            Page not found
          </h2>
          <p className="mt-3 text-[15px] text-white/40 leading-relaxed">
            The telemetry data for this sector is missing. You might have taken a wrong turn at the
            chicane.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-white/[0.08] bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white h-11 px-6 rounded-xl text-[13px]"
            >
              <ArrowLeft01Icon className="size-4 mr-1.5" />
              Go back
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="h-11 px-6 rounded-xl bg-white text-[13px] font-semibold text-black hover:bg-white/90"
            >
              Return home
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Fastlytics
      </footer>
    </div>
  );
};

export default NotFound;
