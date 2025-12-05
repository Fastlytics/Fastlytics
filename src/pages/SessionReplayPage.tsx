import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionReplay from '@/components/replay/SessionReplay';
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from 'lucide-react'; // Or hugeicons: ArrowLeft01Icon
import { PremiumGuard } from '@/components/common/PremiumGuard';

const SessionReplayPage: React.FC = () => {
    const { year, event, session } = useParams<{ year: string; event: string; session: string }>();
    const navigate = useNavigate();

    // Basic validation
    if (!year || !event || !session) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Invalid Session Parameters</h1>
                    <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <PremiumGuard>
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
        </PremiumGuard>
    );
};

export default SessionReplayPage;
