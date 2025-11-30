import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDriverDetails, DriverDetails as DriverDetailsType } from '@/lib/api'; // Import API function and type
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1'; // Corrected import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft01Icon } from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { getTeamLogo } from '@/lib/teamUtils';

// Local interface removed, using DriverDetailsType from api.ts

const DriverDetailsPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
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
    return <div className="flex justify-center items-center h-screen bg-black text-white"><LoadingSpinnerF1 /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10 bg-black min-h-screen pt-20">{error}</div>;
  }

  if (!driverDetails) {
    return <div className="text-center mt-10 bg-black min-h-screen pt-20 text-white">Driver details not found.</div>;
  }

  // Helper function to safely get initials
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <DashboardNavbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Button
            variant="ghost"
            className="pl-0 text-gray-500 hover:text-white hover:bg-transparent -ml-2 mb-6"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft01Icon className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="overflow-hidden bg-gray-900 border-gray-800">
            <CardHeader className="bg-black/50 p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 border-b border-gray-800">
            <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 shadow-2xl" style={{ borderColor: driverDetails.team_colour ? `#${driverDetails.team_colour}` : 'var(--primary)' }}>
                {/* Use optional chaining and provide fallback image */}
                <AvatarImage src={driverDetails.imageUrl || '/placeholder.svg'} alt={driverDetails.name} className="object-cover bg-gray-800" />
                <AvatarFallback className="text-4xl bg-gray-800 text-gray-400">{getInitials(driverDetails.name)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-2 text-center md:text-left">
                <CardTitle className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">{driverDetails.name || 'N/A'}</CardTitle>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start">
                    <p className="text-lg text-gray-400 font-mono">{driverDetails.nationality || 'N/A'}</p>
                    {driverDetails.team_name && (
                        <>
                            <span className="hidden md:inline text-gray-600">•</span>
                            <div className="flex items-center gap-2">
                                {getTeamLogo(driverDetails.team_name) && (
                                    <img src={getTeamLogo(driverDetails.team_name)!} alt={driverDetails.team_name} className="h-6 w-auto" />
                                )}
                                <span className="text-lg font-bold uppercase tracking-wider" style={{ color: driverDetails.team_colour ? `#${driverDetails.team_colour}` : 'inherit' }}>
                                    {driverDetails.team_name}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                {/* Safely format date */}
                <p className="text-sm text-gray-500 font-mono mt-2">
                Born: {driverDetails.dateOfBirth ? new Date(driverDetails.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
            </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 grid gap-10">
            {/* Conditionally render Biography if available */}
            {driverDetails.bio && (
                <div>
                <h3 className="text-2xl font-bold uppercase italic tracking-wider mb-4 text-white border-l-4 border-red-600 pl-4">Biography</h3>
                <p className="text-gray-300 leading-relaxed text-lg">{driverDetails.bio}</p>
                </div>
            )}
            {/* Conditionally render Career Stats if available */}
            {driverDetails.careerStats && (
                <div>
                <h3 className="text-2xl font-bold uppercase italic tracking-wider mb-6 text-white border-l-4 border-red-600 pl-4">Career Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="bg-black border border-gray-800 p-6 rounded-xl hover:border-red-600/50 transition-colors group">
                    <p className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-red-500 transition-colors">{driverDetails.careerStats.wins ?? '-'}</p>
                    <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Wins</p>
                    </div>
                    <div className="bg-black border border-gray-800 p-6 rounded-xl hover:border-red-600/50 transition-colors group">
                    <p className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-red-500 transition-colors">{driverDetails.careerStats.podiums ?? '-'}</p>
                    <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Podiums</p>
                    </div>
                    <div className="bg-black border border-gray-800 p-6 rounded-xl hover:border-red-600/50 transition-colors group">
                    <p className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-red-500 transition-colors">{driverDetails.careerStats.poles ?? '-'}</p>
                    <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Pole Positions</p>
                    </div>
                    <div className="bg-black border border-gray-800 p-6 rounded-xl hover:border-red-600/50 transition-colors group">
                    <p className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-yellow-500 transition-colors">{driverDetails.careerStats.championships ?? '-'}</p>
                    <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Championships</p>
                    </div>
                </div>
                </div>
            )} {/* Closing parenthesis for careerStats condition */}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDetailsPage;
