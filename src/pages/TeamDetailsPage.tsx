import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTeamDetails, TeamDetails as TeamDetailsType } from '@/lib/api'; // Import API function and type
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1'; // Corrected import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Local interface removed, using TeamDetailsType from api.ts

const TeamDetailsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [teamDetails, setTeamDetails] = useState<TeamDetailsType | null>(null); // Use imported type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!teamId) {
        setError('Team ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Use actual API call - teamId from params is already decoded by react-router
        const data = await getTeamDetails(teamId);
        setTeamDetails(data);
      } catch (err) {
        console.error('Error fetching team details:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to load team details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [teamId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinnerF1 /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!teamDetails) {
    return <div className="text-center mt-10">Team details not found.</div>;
  }

  // Helper function to safely get initials
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    // Handle potential multi-word team names for initials
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/40 p-4 md:p-6 flex flex-row items-center gap-4">
           <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-primary">
             {/* Use optional chaining and provide fallback image */}
             <AvatarImage src={teamDetails.imageUrl || '/placeholder.svg'} alt={teamDetails.name} className="object-contain p-1" />
             <AvatarFallback>{getInitials(teamDetails.name)}</AvatarFallback>
           </Avatar>
           <div className="grid gap-1">
             <CardTitle className="text-2xl md:text-4xl font-bold">{teamDetails.name || 'N/A'}</CardTitle>
             <p className="text-sm md:text-base text-muted-foreground">{teamDetails.nationality || 'N/A'}</p>
             <p className="text-sm md:text-base text-muted-foreground">Base: {teamDetails.base || 'N/A'}</p>
             <p className="text-sm md:text-base text-muted-foreground">First Entry: {teamDetails.firstEntry || 'N/A'}</p>
           </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 grid gap-6">
          {/* Conditionally render Team History if available */}
          {teamDetails.bio && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Team History</h3>
              <p className="text-muted-foreground text-sm md:text-base">{teamDetails.bio}</p>
            </div>
          )}
          {/* Conditionally render Career Stats if available */}
          {teamDetails.careerStats && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Career Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{teamDetails.careerStats.wins ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Wins</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{teamDetails.careerStats.podiums ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Podiums</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{teamDetails.careerStats.poles ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Pole Positions</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{teamDetails.careerStats.constructorsChampionships ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Constructors' Titles</p>
                </div>
                 <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{teamDetails.careerStats.driversChampionships ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Drivers' Titles</p>
                </div>
              </div>
            </div>
          )} {/* Closing parenthesis for careerStats condition */}
          {/* TODO: Add section for current drivers if data is available */}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamDetailsPage;
