import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Gauge } from 'lucide-react';

const ProtectedRoute = () => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin">
                    <Gauge className="h-10 w-10 text-red-600" />
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Check if onboarding is complete
    // If profile is null (fetch failed or new user without trigger run yet), we might want to let them through or send to onboarding
    // Assuming profile creation trigger works, profile should exist.
    // If profile exists and onboarding_completed is false, redirect.
    // BUT skip if we are already on /onboarding to avoid loop
    if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
