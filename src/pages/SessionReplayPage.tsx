import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionReplay from '@/components/replay/SessionReplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft01Icon } from 'hugeicons-react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { SEO } from '@/components/layout/SEO';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileSessionReplay from '@/components/mobile/pages/MobileSessionReplay';

const SessionReplayPage: React.FC = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileSessionReplay />;

  return <SessionReplayPageDesktop />;
};

const SessionReplayPageDesktop: React.FC = () => {
  const { year, event, session } = useParams<{ year: string; event: string; session: string }>();
  const navigate = useNavigate();

  // Basic validation
  if (!year || !event || !session) {
    return (
      <>
        <SEO
          title="Session Replay"
          description="Replay view for race telemetry and session data."
          noIndex
        />
        <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Invalid Session Parameters</h1>
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Session Replay"
        description="Replay view for race telemetry and session data."
        noIndex
      />
      <GatedRoute
        featureName="Session Replay"
        description="Experience immersive race telemetry with real-time car positions and data overlays"
      >
        <div className="relative h-screen bg-zinc-950">
          {/* Back Button Overlay */}
          <div className="absolute top-4 left-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft01Icon className="size-6" />
            </Button>
          </div>

          <SessionReplay
            year={parseInt(year, 10)}
            event={event}
            session={session}
            className="h-full"
          />
        </div>
      </GatedRoute>
    </>
  );
};

export default SessionReplayPage;
