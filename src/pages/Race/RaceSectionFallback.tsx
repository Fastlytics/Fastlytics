import { Navigate, useParams, useLocation } from 'react-router-dom';

/**
 * Catch-all for unknown sub-routes under `/race/:raceId/*`.
 * Redirects to `/race/:raceId/overview` preserving all query params.
 */
export default function RaceSectionFallback() {
  const { raceId } = useParams<{ raceId: string }>();
  const location = useLocation();

  return (
    <Navigate to={{ pathname: `/race/${raceId}/overview`, search: location.search }} replace />
  );
}
