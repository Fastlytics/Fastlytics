import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity01Icon,
  Calendar03Icon,
  Settings02Icon,
  ArrowLeft01Icon,
  AlertCircleIcon, // Added for error state
} from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar'; // Changed from DashboardHeader
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  fetchTeamPaceSummary,
  fetchTeamPaceEvent,
  TeamPaceSummary,
  TeamPaceEvent,
} from '@/lib/api';
import { Button } from '@/components/ui/button'; // Added
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Added
import { cn } from '@/lib/utils';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';
import type { CustomTooltipProps, CustomLegendProps } from '@/types';

const TeamPaceAnalysis = () => {
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useAnalytics();
  const {
    chartRef: evolutionRef,
    exportChart: exportEvolution,
    isExporting: isExportingEvolution,
  } = useChartExport();
  const {
    chartRef: paceGapRef,
    exportChart: exportPaceGap,
    isExporting: isExportingPaceGap,
  } = useChartExport();
  const {
    chartRef: scatterRef,
    exportChart: exportScatter,
    isExporting: isExportingScatter,
  } = useChartExport();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [summaryList, setSummaryList] = useState<TeamPaceSummary[]>([]);
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(null);
  const [eventData, setEventData] = useState<TeamPaceEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTeams, setActiveTeams] = useState<string[]>([]);
  const [selectedEventName, setSelectedEventName] = useState<string>(''); // For display in Select

  // Track page view
  useEffect(() => {
    trackPageView('team_pace_analysis', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Constants
  const availableYears = [2026, 2025, 2024];

  // Fetch Summary List
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await fetchTeamPaceSummary(selectedYear);
        setSummaryList(data);
        if (data.length > 0) {
          // Set initial event if none or current invalid for new year
          if (
            !selectedEventSlug ||
            !data.find((e) => {
              const s = e.eventName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
              return s === selectedEventSlug;
            })
          ) {
            const firstEvent = data[0];
            const slug = firstEvent.eventName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
            setSelectedEventSlug(slug);
            setSelectedEventName(firstEvent.eventName);
          }
        } else {
          setSelectedEventSlug(null);
          setSelectedEventName('');
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
        setSummaryList([]);
      }
    };
    fetchSummary();
  }, [selectedYear, selectedEventSlug]);

  const [selectedSession, setSelectedSession] = useState<string>('R'); // Default to Race, will update on load

  // Fetch Event Data
  useEffect(() => {
    if (!selectedEventSlug) return;

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const data = await fetchTeamPaceEvent(selectedYear, selectedEventSlug);
        setEventData(data);

        // Determine latest available session
        const sessionOrder = ['FP1', 'FP2', 'FP3', 'Q', 'Sprint Shootout', 'Sprint', 'R'];
        let latestSession = 'R';
        // Find the last session in our order that exists in the data
        for (let i = sessionOrder.length - 1; i >= 0; i--) {
          if (data.sessions[sessionOrder[i]]) {
            latestSession = sessionOrder[i];
            break;
          }
        }

        // If the currently selected session doesn't exist in the new event, switch to latest
        // Or just always switch to latest on new event load? User request: "by default, it shows the graph for latest completed session"
        setSelectedSession(latestSession);

        // Initialize active teams from Race session if available, else latest
        const sessionForTeams = data.sessions['R'] ? 'R' : latestSession;
        if (data.sessions[sessionForTeams]) {
          const teams = data.sessions[sessionForTeams].map((t) => t.teamName);
          setActiveTeams(teams);
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        setEventData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [selectedEventSlug, selectedYear]);

  // Update selected event name when slug or list changes
  useEffect(() => {
    if (selectedEventSlug && summaryList.length > 0) {
      const event = summaryList.find(
        (e) =>
          e.eventName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') === selectedEventSlug
      );
      if (event) setSelectedEventName(event.eventName);
    }
  }, [selectedEventSlug, summaryList]);

  // Format Data for Evolution Chart
  const getEvolutionData = () => {
    if (!eventData) return [];

    interface EvolutionDataPoint {
      name: string;
      [teamName: string]: string | number;
    }

    const sessionsOrder = ['FP1', 'FP2', 'FP3', 'Q', 'Sprint', 'R'];
    const data: EvolutionDataPoint[] = [];

    sessionsOrder.forEach((session) => {
      if (eventData.sessions[session]) {
        const sessionPoint: EvolutionDataPoint = {
          name: session,
        };
        eventData.sessions[session].forEach((team) => {
          sessionPoint[team.teamName] = team.rank;
        });
        data.push(sessionPoint);
      }
    });
    return data;
  };

  // Format Data for Pace Gap Bar Chart
  const getPaceGapData = () => {
    if (!eventData?.sessions[selectedSession]) return [];
    const sessionData = eventData.sessions[selectedSession];

    // Find the best median time to use as baseline
    // Note: The data might already be sorted by rank, but let's be safe
    // Assuming the first item is the fastest matching the backend sort usually
    // But let's find the minimum medianTime just in case
    if (sessionData.length === 0) return [];

    const bestTime = Math.min(...sessionData.map((t) => t.medianTime));

    return sessionData
      .map((t) => ({
        ...t,
        gapToLeader: t.medianTime - bestTime,
      }))
      .sort((a, b) => a.gapToLeader - b.gapToLeader); // Sort by gap ascending
  };

  // Format Scatter Data
  const getScatterData = () => {
    const sessionKey = eventData?.sessions['R']
      ? 'R'
      : eventData?.sessions['Q']
        ? 'Q'
        : Object.keys(eventData?.sessions || {})[0];
    if (!eventData?.sessions[sessionKey]) return [];
    const sessionData = eventData.sessions[sessionKey];

    return sessionData.map((t) => ({
      teamName: t.teamName,
      // Use teamName for color lookup to ensure consistency with Pace Evolution chart
      teamColor: getTeamColorHex(t.teamName),
      x: t.medianTime,
      y: t.fastestLapTime,
      z: 1,
    }));
  };

  const getTeamColorHex = (colorName: string) => {
    const colors: Record<string, string> = {
      redbull: '#4781D7',
      redbullracing: '#4781D7',
      mercedes: '#6CD3BF',
      ferrari: '#F91536',
      mclaren: '#F58020',
      astonmartin: '#229971',
      alpine: '#0093CC',
      williams: '#64C4FF',
      haas: '#B6BABD',
      alfaromeo: '#C92D4B',
      kicksauber: '#52E252',
      sauber: '#52E252',
      audi: '#00E701',
      cadillac: '#C6A664',
      alphatauri: '#5E8FAA',
      vcarb: '#6692FF',
      racingbulls: '#6692FF',
      rb: '#6692FF',
      gray: '#666666',
    };
    const normalized = colorName.toLowerCase().replace(/\s+/g, '');
    return colors[normalized] || '#666666';
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps<number>) => {
    if (active && payload && payload.length) {
      // Sort by rank ascending (1 is best, so 1 at top)
      const sortedPayload = [...payload].sort((a, b) => (a.value || 0) - (b.value || 0));

      return (
        <div className="bg-black/95 border border-gray-800 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
          <p className="text-gray-400 font-mono text-xs mb-3 uppercase tracking-wider border-b border-gray-800 pb-2">
            {label}
          </p>
          {sortedPayload.map((entry, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-200 font-bold text-sm">{entry.name}</span>
              </div>
              <span className="text-white font-mono text-sm font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Legend Component
  const CustomLegend = ({ payload }: CustomLegendProps) => {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-gray-800/50 mt-4">
        {payload.map((entry, index: number) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div
              className="w-2 h-2 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.2)]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white flex flex-col">
      <DashboardNavbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header (Matching ChampionshipProgression Style) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b-2 border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-white hover:bg-gray-800"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft01Icon className="h-6 w-6" />
              </Button>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                Team Pace <span className="text-red-600">Analysis</span>
                <Activity01Icon className="h-8 w-8 text-gray-600 md:h-10 md:w-10" />
              </h1>
            </div>
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest ml-14">
              Weekend Performance Evolution & Race Pace
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 ml-14 md:ml-0">
            {/* Year Selector */}
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                trackEvent('season_changed', { page: 'team_pace', year: Number(value) });
              }}
            >
              <SelectTrigger className="w-[120px] bg-black border-2 border-gray-800 text-white hover:border-red-600 rounded-none font-bold uppercase tracking-widest">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-black border-2 border-gray-800 text-white rounded-none">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase p-2">Season</SelectLabel>
                  {availableYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={String(year)}
                      className="cursor-pointer focus:bg-red-600 focus:text-white font-bold"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Event Selector */}
            <Select
              value={selectedEventSlug || ''}
              onValueChange={(value) => {
                setSelectedEventSlug(value);
                trackEvent('event_changed', {
                  page: 'team_pace',
                  event_slug: value,
                  year: selectedYear,
                });
              }}
              disabled={summaryList.length === 0}
            >
              <SelectTrigger className="w-[240px] bg-black border-2 border-gray-800 text-white hover:border-red-600 rounded-none font-bold uppercase tracking-widest">
                <SelectValue
                  placeholder={summaryList.length === 0 ? 'No Events' : 'Select Event'}
                />
              </SelectTrigger>
              <SelectContent className="bg-black border-2 border-gray-800 text-white rounded-none max-h-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-xs text-gray-500 uppercase p-2">
                    Race Weekend
                  </SelectLabel>
                  {summaryList.map((event) => {
                    const slug = event.eventName
                      .toLowerCase()
                      .replace(/\s+/g, '_')
                      .replace(/-/g, '_');
                    return (
                      <SelectItem
                        key={event.round}
                        value={slug}
                        className="cursor-pointer focus:bg-red-600 focus:text-white font-bold"
                      >
                        R{event.round} - {event.eventName}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="w-full h-[400px] flex flex-col items-center justify-center bg-zinc-950/50 border border-gray-800 rounded-xl relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            ></div>
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin z-10 mb-4"></div>
            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest animate-pulse z-10">
              Loading Pace Analysis...
            </p>
          </div>
        ) : eventData ? (
          <div className="space-y-6">
            {/* 1. Weekend Evolution Chart */}
            <div
              ref={evolutionRef}
              className="w-full bg-zinc-950 border border-gray-800 rounded-xl p-4 md:p-8 h-[550px]"
            >
              <h3 className="text-xl font-black uppercase italic text-white mb-6 flex items-center gap-2">
                Pace <span className="text-red-600">Evolution</span>
                <span className="text-gray-600 text-sm font-mono not-italic ml-auto font-normal normal-case border border-gray-800 px-2 py-1 rounded">
                  Rank per session
                </span>
                <ChartExportMenu
                  onExport={(format) =>
                    exportEvolution(format, {
                      title: 'Pace Evolution',
                      subtitle: 'Team rank per session across the weekend',
                      year: selectedYear,
                      event: selectedEventName,
                    })
                  }
                  isExporting={isExportingEvolution}
                />
              </h3>
              <div className="h-[430px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getEvolutionData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                      tick={(props) => {
                        const { x, y, payload } = props as {
                          x: number;
                          y: number;
                          payload: { value: string };
                        };
                        return (
                          <text
                            x={x}
                            y={y + 15}
                            textAnchor="middle"
                            fill="#666"
                            fontSize={12}
                            fontWeight="bold"
                            fontFamily="Geist"
                            style={{ textTransform: 'uppercase' }}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      height={40}
                    />
                    <YAxis
                      reversed={true}
                      domain={[1, 'auto']}
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold' }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                    {activeTeams.map((team) => (
                      <Line
                        key={team}
                        type="monotone"
                        dataKey={team}
                        stroke={getTeamColorHex(team)}
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#000', strokeWidth: 2 }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        connectNulls={true}
                        animationDuration={1500}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2. Pace Gap Analysis */}
              <div
                ref={paceGapRef}
                className="w-full bg-zinc-950 border border-gray-800 rounded-xl p-4 md:p-8 h-[450px]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                    Pace <span className="text-red-600">Gap</span>
                    <ChartExportMenu
                      onExport={(format) =>
                        exportPaceGap(format, {
                          title: 'Pace Gap',
                          subtitle: `Gap to leader — ${selectedSession}`,
                          year: selectedYear,
                          event: selectedEventName,
                          session: selectedSession,
                        })
                      }
                      isExporting={isExportingPaceGap}
                    />
                  </h3>

                  {/* Session Selector */}
                  <Select
                    value={selectedSession}
                    onValueChange={(value) => {
                      setSelectedSession(value);
                      trackEvent('session_changed', {
                        page: 'team_pace',
                        session: value,
                        event: selectedEventName,
                        year: selectedYear,
                      });
                    }}
                    disabled={!eventData}
                  >
                    <SelectTrigger className="w-[100px] bg-zinc-900 border-gray-700 text-white h-8 text-xs font-bold uppercase tracking-wider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-gray-700 text-white">
                      {eventData &&
                        Object.keys(eventData.sessions)
                          .sort((a, b) => {
                            const order = [
                              'FP1',
                              'FP2',
                              'FP3',
                              'Q',
                              'Sprint Shootout',
                              'Sprint',
                              'R',
                            ];
                            return order.indexOf(a) - order.indexOf(b);
                          })
                          .map((session) => (
                            <SelectItem
                              key={session}
                              value={session}
                              className="font-bold text-xs uppercase tracking-wider cursor-pointer focus:bg-zinc-800 focus:text-white"
                            >
                              {session}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[350px] w-full">
                  {getPaceGapData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={getPaceGapData()}
                        margin={{ left: 20, right: 30 }}
                      >
                        <CartesianGrid stroke="#333" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="teamName"
                          type="category"
                          width={100}
                          tick={{ fill: '#999', fontSize: 12, fontWeight: 'bold' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-black/95 border border-gray-800 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                  <p className="text-white font-bold mb-1">{data.teamName}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider">
                                      Median:
                                    </span>
                                    <span className="text-white font-mono font-bold text-sm">
                                      {data.medianTime.toFixed(3)}s
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider">
                                      Gap:
                                    </span>
                                    <span className="text-red-500 font-mono font-bold text-sm">
                                      +{data.gapToLeader.toFixed(3)}s
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="gapToLeader"
                          radius={[0, 4, 4, 0]}
                          barSize={24}
                          animationDuration={1000}
                        >
                          {getPaceGapData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getTeamColorHex(entry.teamName)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600 font-mono text-sm uppercase tracking-widest">
                      No data available for {selectedSession}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Scatter Plot */}
              <div
                ref={scatterRef}
                className="w-full bg-zinc-950 border border-gray-800 rounded-xl p-4 md:p-8 h-[450px]"
              >
                <h3 className="text-xl font-black uppercase italic text-white mb-6 flex items-center gap-2">
                  Peak <span className="text-gray-600">vs</span> Consistent
                  <ChartExportMenu
                    onExport={(format) =>
                      exportScatter(format, {
                        title: 'Peak vs Consistent',
                        subtitle: 'Fastest lap vs median pace',
                        year: selectedYear,
                        event: selectedEventName,
                      })
                    }
                    isExporting={isExportingScatter}
                    className="ml-auto"
                  />
                </h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Median Pace"
                        unit="s"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#666', fontSize: 10 }}
                        label={{
                          value: 'Consistency (Median Time)',
                          position: 'bottom',
                          fill: '#666',
                          fontSize: 10,
                          dy: 10,
                        }}
                        stroke="#444"
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Fastest Lap"
                        unit="s"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#666', fontSize: 10 }}
                        label={{
                          value: 'Peak (Fastest Lap)',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#666',
                          fontSize: 10,
                        }}
                        stroke="#444"
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: '#666' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-black/95 border border-gray-800 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                <p
                                  className="text-white font-bold mb-2 border-b border-gray-800 pb-1"
                                  style={{ color: data.teamColor }}
                                >
                                  {data.teamName}
                                </p>
                                <div className="space-y-1">
                                  <p className="text-gray-400 text-xs flex justify-between gap-4">
                                    <span>Median:</span>{' '}
                                    <span className="text-white font-mono">
                                      {data.x.toFixed(3)}s
                                    </span>
                                  </p>
                                  <p className="text-gray-400 text-xs flex justify-between gap-4">
                                    <span>Fastest:</span>{' '}
                                    <span className="text-white font-mono">
                                      {data.y.toFixed(3)}s
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Teams" data={getScatterData()} fill="#8884d8">
                        {getScatterData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.teamColor}
                            stroke="white"
                            strokeWidth={1}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-800 rounded-xl bg-zinc-950">
            <Activity01Icon className="w-16 h-16 text-gray-700 mb-4" />
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">
              Select an event to view analysis
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export { TeamPaceAnalysis };
export default TeamPaceAnalysis;
