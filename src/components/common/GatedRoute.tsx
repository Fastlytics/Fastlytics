import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from './FeatureGate';

interface GatedRouteProps {
  featureName: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * GatedRoute - Shows FeatureGate for unauthenticated users, content for authenticated users
 */
export const GatedRoute = ({ featureName, description, children }: GatedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) {
    return <FeatureGate featureName={featureName} description={description} />;
  }

  return <>{children}</>;
};

export default GatedRoute;
