import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionReplay from '@/components/replay/SessionReplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft01Icon } from 'hugeicons-react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { SEO } from '@/components/layout/SEO';

const MobileSessionReplay: React.FC = () => {
  const { year, event, session } = useParams<{ year: string; event: string; session: string }>();
  const navigate = useNavigate();

  if (!year || !event || !session) {
    return (
      <>
        <SEO
          title="Session Replay"
          description="Replay view for race telemetry and session data."
          noIndex
        />
        <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-semibold">Invalid Session Parameters</h1>
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
        <div className="fixed inset-0 z-50 bg-zinc-950">
          {/* Back Button Overlay */}
          <div className="absolute left-4 top-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/10"
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

export default MobileSessionReplay;
