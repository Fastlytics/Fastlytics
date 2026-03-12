import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionReplay from '@/components/replay/SessionReplay';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { GatedRoute } from '@/components/common/GatedRoute';

const SessionReplayPage: React.FC = () => {
  const { year, event, session } = useParams<{ year: string; event: string; session: string }>();
  const navigate = useNavigate();

  // Basic validation
  if (!year || !event || !session) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Session Parameters</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GatedRoute
      featureName="Session Replay"
      description="Experience immersive race telemetry with real-time car positions and data overlays"
    >
      <div className="relative h-screen bg-black">
        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6" />
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
  );
};

export { SessionReplayPage };
export default SessionReplayPage;
