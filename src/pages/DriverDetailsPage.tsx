import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDriverDetails, DriverDetails as DriverDetailsType } from '@/lib/api'; // Import API function and type
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1'; // Corrected import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Local interface removed, using DriverDetailsType from api.ts

const DriverDetailsPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const [driverDetails, setDriverDetails] = useState<DriverDetailsType | null>(null); // Use imported type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!driverId) {
        setError('Driver ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Use actual API call
        const data = await getDriverDetails(driverId);
        setDriverDetails(data);
      } catch (err) {
        console.error('Error fetching driver details:', err);
        // Provide a more specific error message if possible
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to load driver details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [driverId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinnerF1 /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!driverDetails) {
    return <div className="text-center mt-10">Driver details not found.</div>;
  }

  // Helper function to safely get initials
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/40 p-4 md:p-6 flex flex-row items-center gap-4">
           <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-primary">
             {/* Use optional chaining and provide fallback image */}
             <AvatarImage src={driverDetails.imageUrl || '/placeholder.svg'} alt={driverDetails.name} className="object-cover" />
             <AvatarFallback>{getInitials(driverDetails.name)}</AvatarFallback>
           </Avatar>
           <div className="grid gap-1">
             <CardTitle className="text-2xl md:text-4xl font-bold">{driverDetails.name || 'N/A'}</CardTitle>
             <p className="text-sm md:text-base text-muted-foreground">{driverDetails.nationality || 'N/A'}</p>
             {/* Safely format date */}
             <p className="text-sm md:text-base text-muted-foreground">
               Born: {driverDetails.dateOfBirth ? new Date(driverDetails.dateOfBirth).toLocaleDateString() : 'N/A'}
             </p>
           </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 grid gap-6">
          {/* Conditionally render Biography if available */}
          {driverDetails.bio && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Biography</h3>
              <p className="text-muted-foreground text-sm md:text-base">{driverDetails.bio}</p>
            </div>
          )}
          {/* Conditionally render Career Stats if available */}
          {driverDetails.careerStats && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">Career Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{driverDetails.careerStats.wins ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Wins</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{driverDetails.careerStats.podiums ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Podiums</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{driverDetails.careerStats.poles ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Pole Positions</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-2xl md:text-3xl font-bold">{driverDetails.careerStats.championships ?? '-'}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Championships</p>
                </div>
              </div>
            </div>
          )} {/* Closing parenthesis for careerStats condition */}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDetailsPage;
