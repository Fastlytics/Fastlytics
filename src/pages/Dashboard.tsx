import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTeamStandings,
  fetchDriverStandings,
  fetchSchedule,
  TeamStanding,
  DriverStanding,
  ScheduleEvent
} from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ChampionshipWidget from '@/components/dashboard/ChampionshipWidget';
import SeasonTimeline from '@/components/dashboard/SeasonTimeline';
import { Flag, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { selectedYear } = useSeason();
  const navigate = useNavigate();

  // --- Data Fetching ---

  // 1. Standings
  const { data: teamStandings, isLoading: isLoadingTeams } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  const { data: driverStandings, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  // 2. Schedule
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  // 3. Derived Data (Next Race, Last Race)
  const { nextRace, lastRace, currentRound, recentRaces } = useMemo(() => {
    if (!schedule || schedule.length === 0) return { nextRace: undefined, lastRace: undefined, currentRound: 0, recentRaces: [] };

    const now = new Date();
    const upcoming = schedule.find(e => new Date(e.EventDate) > now);
    const completed = [...schedule].reverse().find(e => new Date(e.EventDate) < now);

    // Calculate days until next race
    let daysUntil = 0;
    if (upcoming) {
      const diff = new Date(upcoming.EventDate).getTime() - now.getTime();
      daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Get 4 most recent completed races
    const recent = schedule
      .filter(e => new Date(e.EventDate) < now)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 4);

    return {
      nextRace: upcoming ? {
        name: upcoming.EventName,
        date: upcoming.EventDate,
        location: upcoming.Location,
        daysUntil
      } : undefined,
      lastRace: completed,
      currentRound: completed ? completed.RoundNumber : 0,
      recentRaces: recent
    };
  }, [schedule]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <DashboardNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <DashboardHeader
          selectedYear={selectedYear}
          nextRace={nextRace}
        />

        <SeasonTimeline
          schedule={schedule || []}
          currentRound={currentRound}
        />

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content Area (3 cols) */}
          <div className="lg:col-span-3 space-y-12">
            <section>
              <ChampionshipWidget
                drivers={driverStandings || []}
                teams={teamStandings || []}
                isLoading={isLoadingDrivers || isLoadingTeams}
              />
            </section>

            {/* Recent Races Section */}
            <div className="bg-black border-2 border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <span className="w-1 h-8 bg-red-600 block"></span>
                  Recent <span className="text-gray-500">Races</span>
                </h3>
                <button
                  onClick={() => navigate('/calendar')}
                  className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  View Calendar <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {recentRaces.map((race) => (
                  <div
                    key={race.EventName}
                    onClick={() => navigate(`/race/${selectedYear}-${race.EventName.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 hover:border-red-600/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-800 rounded text-red-600 group-hover:text-white transition-colors">
                        <Flag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-lg uppercase">{race.EventName}</div>
                        <div className="text-xs font-mono text-gray-500">{race.Location}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                  </div>
                ))}
                {recentRaces.length === 0 && (
                  <div className="text-center py-8 text-gray-500 font-mono text-sm">
                    No races completed yet this season.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Dashboard;
