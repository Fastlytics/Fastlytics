import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTeamStandings,
  fetchDriverStandings,
  fetchSchedule,
  fetchRaceResults,
  TeamStanding,
  DriverStanding,
  ScheduleEvent,
  RaceResult
} from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ChampionshipWidget from '@/components/dashboard/ChampionshipWidget';
import { Flag01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { getCountryCode } from '@/utils/countryUtils';

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

  // 3. Race Results (for Championship calculation)
  const { data: raceResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
  });

  // 3. Derived Data (Next Session, Last Race)
  const { nextSession, recentRaces } = useMemo(() => {
    if (!schedule || schedule.length === 0) return { nextSession: undefined, recentRaces: [] };

    const now = new Date();

    // Find the next upcoming session
    let upcomingSession = undefined;

    // Sort schedule by date to ensure we check in order
    const sortedSchedule = [...schedule].sort((a, b) => new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime());

    for (const event of sortedSchedule) {
      // Check all 5 possible sessions
      const sessions = [
        { name: event.Session1, date: event.Session1Date },
        { name: event.Session2, date: event.Session2Date },
        { name: event.Session3, date: event.Session3Date },
        { name: event.Session4, date: event.Session4Date },
        { name: event.Session5, date: event.Session5Date },
      ].filter(s => s.name && s.date); // Filter out null sessions

      for (const session of sessions) {
        if (session.date && new Date(session.date) > now) {
          upcomingSession = {
            eventName: event.EventName,
            sessionName: session.name!,
            date: session.date,
            location: event.Location,
            country: event.Country
          };
          break; // Found the very first upcoming session
        }
      }
      if (upcomingSession) break; // Stop checking events if we found a session
    }

    // Get 4 most recent completed races
    const recent = schedule
      .filter(e => new Date(e.EventDate) < now)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 4);

    return {
      nextSession: upcomingSession,
      recentRaces: recent
    };
  }, [schedule]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      <DashboardNavbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <DashboardHeader
          selectedYear={selectedYear}
          nextSession={nextSession}
        />

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content Area (3 cols) */}
          <div className="lg:col-span-3 space-y-12">
            <section>
              <ChampionshipWidget
                drivers={driverStandings || []}
                teams={teamStandings || []}
                schedule={schedule || []}
                raceResults={raceResults || []}
                isLoading={isLoadingDrivers || isLoadingTeams || isLoadingSchedule}
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
                  View Calendar <ArrowRight01Icon className="w-4 h-4" />
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
                      <div className="w-10 h-7 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={`https://flagcdn.com/h40/${getCountryCode(race.Country || race.Location)}.png`}
                          alt={race.Country || race.Location}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-lg uppercase">{race.EventName}</div>
                        <div className="text-xs font-mono text-gray-500">{race.Location}</div>
                      </div>
                    </div>
                    <ArrowRight01Icon className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
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
