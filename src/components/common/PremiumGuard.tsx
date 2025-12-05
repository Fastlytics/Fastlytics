import React, { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';

interface PremiumGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export const PremiumGuard: React.FC<PremiumGuardProps> = ({ children, fallback }) => {
    const { isPremium, isTrialing, status } = useSubscription();
    const navigate = useNavigate();
    const location = useLocation();

    if (isPremium) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[60vh] p-4">
            <div className="relative w-full max-w-md">
                {/* Decorative background glow */}
                <div className="absolute -inset-4 bg-red-600/20 blur-2xl rounded-full opacity-50 pointer-events-none" />

                <div className="relative bg-black border-2 border-zinc-800 p-8 md:p-10 flex flex-col items-center text-center overflow-hidden shadow-2xl">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-red-600" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-red-600" />

                    {/* Icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
                        <div className="relative w-16 h-16 bg-zinc-900 border-2 border-red-600 flex items-center justify-center transform rotate-3">
                            <Lock className="w-8 h-8 text-white transform -rotate-3" />
                        </div>
                    </div>

                    {/* Content */}
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">
                        Premium <span className="text-red-600">Locked</span>
                    </h2>

                    <p className="text-zinc-400 font-mono text-sm mb-8 leading-relaxed">
                        This data is restricted to Pro members.
                        Unlock full session replays, unlimited history, and advanced analytics.
                    </p>

                    {/* Actions */}
                    <div className="w-full space-y-3">
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider py-6 text-lg rounded-none border-2 border-transparent hover:border-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]"
                            onClick={() => navigate('/pricing', { state: { from: location.pathname + location.search } })}
                        >
                            Unlock Access
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-xs"
                            onClick={() => navigate('/')}
                        >
                            Return Home
                        </Button>
                    </div>

                    {/* Striped Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none opacity-20" />
                </div>
            </div>

        </div>
    );
};
