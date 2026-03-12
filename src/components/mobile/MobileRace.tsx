import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft01Icon,
  ChampionIcon,
  Clock01Icon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  Analytics01Icon,
  Cancel01Icon,
  StartUp02Icon,
  ArrowDown01Icon,
  GitCompareIcon,
  ChartLineData01Icon,
} from 'hugeicons-react';
import TireIcon from './tireicon';
import {
  fetchSpecificRaceResults,
  fetchAvailableSessions,
  fetchEventSessionSchedule,
  DetailedRaceResult,
  AvailableSession,
  EventSessionSchedule,
} from '@/lib/api';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import MobilePageHeader from './MobilePageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAnalytics } from '@/hooks/useAnalytics';
import MobileStrategy from './MobileStrategy';
import MobileLapTimes from './MobileLapTimes';
import MobileHeadToHead from './MobileHeadToHead';
import MobileTelemetry from './MobileTelemetry';
import { getDriverImage } from '@/utils/imageMapping';
import { GatedRoute } from '@/components/common/GatedRoute';
import { getTeamColorClass } from '@/lib/teamColors';

// --- Helper Functions ---
// Using shared getTeamColorClass from @/lib/teamColors
const _unused_getTeamColorClass = (teamName: string | undefined): string => {
  if (!teamName) return 'gray';
  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (simpleName.includes('mclaren')) return 'mclaren';
  if (simpleName.includes('mercedes')) return 'mercedes';
  if (simpleName.includes('redbull')) return 'redbull';
  if (simpleName.includes('ferrari')) return 'ferrari';
  if (simpleName.includes('alpine')) return 'alpine';
  if (simpleName.includes('astonmartin')) return 'astonmartin';
  if (simpleName.includes('williams')) return 'williams';
  if (simpleName.includes('haas')) return 'haas';
  if (simpleName.includes('sauber')) return 'alfaromeo';
  if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
  return 'gray';
};

const parseLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity;
  try {
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 1000;
    }
  } catch (e) {
    // Silent catch - return Infinity on parse error
  }
  return Infinity;
};

const TESTING_SESSION_ALIAS_PATTERN = /^DAY([1-3])_(AM|PM)$/i;

const parseTestingSessionAlias = (
  sessionType: string
): { day: number; window: 'morning' | 'afternoon' } | null => {
  const match = sessionType.match(TESTING_SESSION_ALIAS_PATTERN);
  if (!match) return null;
  return {
    day: Number(match[1]),
    window: match[2].toUpperCase() === 'AM' ? 'morning' : 'afternoon',
  };
};

const getTestingSessionOrder = (sessionType: string): number => {
  const parsed = parseTestingSessionAlias(sessionType);
  if (parsed) return parsed.day * 10 + (parsed.window === 'morning' ? 0 : 1);
  if (sessionType === 'FP1') return 11;
  if (sessionType === 'FP2') return 21;
  if (sessionType === 'FP3') return 31;
  return -1;
};

const resolveSessionForAnalysis = (sessionType: string): string => {
  const parsed = parseTestingSessionAlias(sessionType);
  if (!parsed) return sessionType;
  return `FP${parsed.day}`;
};

const formatRaceTime = (timeStr: string | null | undefined, isWinner: boolean = false): string => {
  if (!timeStr) return '-';
  if (isWinner) {
    try {
      const parts = timeStr.split(/[:.]/);
      if (parts.length === 3) {
        const totalMinutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const milliseconds = parts[2];
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
      }
    } catch (e) {
      return timeStr;
    }
    return timeStr;
  }
  if (timeStr.match(/^[A-Za-z]/)) return timeStr;
  const processedTime = timeStr.startsWith('+') ? timeStr.substring(1) : timeStr;
  try {
    const parts = processedTime.split(/[:.]/);
    if (parts.length === 3) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const milliseconds = parts[2];
      const totalSeconds = minutes * 60 + seconds;
      if (totalSeconds >= 60) {
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        return `+${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}.${milliseconds}`;
      } else {
        return `+${totalSeconds}.${milliseconds}`;
      }
    }
  } catch {
    // Invalid time string format, return original
  }
  return timeStr;
};

const calculateFullRaceTime = (
  winnerTime: string | null | undefined,
  gap: string | null | undefined
): string | null => {
  if (!winnerTime || !gap) return null;
  if (gap.includes('Lap')) return null;

  try {
    const winnerParts = winnerTime.split(/[:.]/);
    if (winnerParts.length !== 3) return null;

    const winnerTotalMs =
      parseInt(winnerParts[0], 10) * 60 * 1000 +
      parseInt(winnerParts[1], 10) * 1000 +
      parseInt(winnerParts[2], 10);

    const gapStr = gap.startsWith('+') ? gap.substring(1) : gap;
    const gapParts = gapStr.split(/[:.]/);

    let gapMs = 0;
    if (gapParts.length === 3) {
      gapMs =
        parseInt(gapParts[0], 10) * 60 * 1000 +
        parseInt(gapParts[1], 10) * 1000 +
        parseInt(gapParts[2], 10);
    } else if (gapParts.length === 2) {
      gapMs = parseInt(gapParts[0], 10) * 1000 + parseInt(gapParts[1], 10);
    } else {
      return null;
    }

    const totalMs = winnerTotalMs + gapMs;
    const totalMinutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  } catch {
    return null;
  }
};

// Countdown Component
const MobileCountdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        return {
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        };
      }
      return { d: 0, h: 0, m: 0, s: 0 };
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect -- timer initialization requires immediate setState
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-3">
      {[
        { value: timeLeft.d, label: 'Days' },
        { value: timeLeft.h, label: 'Hrs' },
        { value: timeLeft.m, label: 'Min' },
        { value: timeLeft.s, label: 'Sec', highlight: true },
      ].map((item, idx) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center">
            <div
              className={`text-3xl font-black font-mono ${item.highlight ? 'text-red-600' : 'text-white'}`}
            >
              {pad(item.value)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              {item.label}
            </div>
          </div>
          {idx < 3 && <span className="text-2xl font-bold text-gray-700 -mt-4">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// Session Selector Modal
interface SessionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: AvailableSession[];
  selectedSession: string;
  onSelect: (session: string) => void;
}

const SessionSelector: React.FC<SessionSelectorProps> = ({
  isOpen,
  onClose,
  sessions,
  selectedSession,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-black border-t-2 border-white/20 pb-24"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-800" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
              Select Session
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors">
              <Cancel01Icon className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="p-3 max-h-80 overflow-y-auto space-y-2">
            {sessions.some((s) => s.type === 'Summary') && (
              <button
                key="Summary"
                onClick={() => {
                  onSelect('Summary');
                  onClose();
                }}
                className={`w-full p-4 text-left transition-all flex items-center justify-between border-2 ${
                  selectedSession === 'Summary'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-black border-red-600/30 hover:border-red-600/60 text-red-500'
                }`}
              >
                <span className="text-base font-black uppercase tracking-wide">
                  3-Day Testing Summary
                </span>
                {selectedSession === 'Summary' && <CheckmarkCircle02Icon className="w-5 h-5" />}
              </button>
            )}
            {sessions
              .filter((s) => s.type !== 'Q' && s.type !== 'Summary')
              .map((session) => (
                <button
                  key={session.type}
                  onClick={() => {
                    onSelect(session.type);
                    onClose();
                  }}
                  className={`w-full p-4 text-left transition-all flex items-center justify-between border-2 ${
                    selectedSession === session.type
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-black border-white/10 hover:border-white/30 text-gray-300'
                  }`}
                >
                  <span className="text-base font-black uppercase tracking-wide">
                    {session.name}
                  </span>
                  {selectedSession === session.type && (
                    <CheckmarkCircle02Icon className="w-5 h-5" />
                  )}
                </button>
              ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Schedule Session Card
interface ScheduleSessionCardProps {
  session: { name: string; date: string; localTime: string | null };
  isNext: boolean;
  isLive: boolean;
  isAvailable: boolean;
  is24Hour: boolean;
  onViewResults: (sessionName: string) => void;
}

const ScheduleSessionCard: React.FC<ScheduleSessionCardProps> = ({
  session,
  isNext,
  isLive,
  isAvailable,
  is24Hour,
  onViewResults,
}) => {
  const sessionDate = new Date(session.date);
  const dayName = sessionDate.toLocaleDateString(undefined, { weekday: 'short' });
  const dayNum = sessionDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  const formatLocalTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    if (is24Hour) return timeStr;
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatUserTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour,
      });
    } catch (e) {
      return '-';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'overflow-hidden relative',
        isNext ? 'bg-black border-2 border-red-600' : 'bg-black border border-white/10'
      )}
    >
      {/* Decorative Corners for Next Session */}
      {isNext && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-600" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-600" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-600" />
        </>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Date & Session Name */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 flex flex-col items-center justify-center border',
                isNext
                  ? 'bg-red-600/10 border-red-600 text-red-600'
                  : 'bg-zinc-900 border-white/10 text-gray-400'
              )}
            >
              <span className="text-[10px] uppercase font-black tracking-wider">{dayName}</span>
              <span className="text-lg font-black leading-none">{sessionDate.getDate()}</span>
            </div>
            <div>
              <h3
                className={cn(
                  'font-black text-base uppercase italic tracking-tighter',
                  isNext ? 'text-white' : 'text-gray-300'
                )}
              >
                {session.name}
              </h3>
              {isNext && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-red-600 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold">
                    Next Up
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Time or Status */}
          <div className="text-right">
            {isLive ? (
              <div className="flex items-center gap-2 text-red-600 border border-red-600 px-2 py-1 bg-red-600/10">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </div>
                <span className="font-black uppercase text-xs tracking-wider">LIVE</span>
              </div>
            ) : isAvailable ? (
              <button
                onClick={() => {
                  onViewResults(session.name);
                }}
                className="bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-2 hover:bg-red-600 hover:text-white transition-colors border border-transparent hover:border-white"
              >
                OPEN
              </button>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    Local
                  </span>
                  <span className="text-sm font-mono text-gray-400">
                    {formatLocalTime(session.localTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    You
                  </span>
                  <span
                    className={cn(
                      'text-sm font-mono font-bold',
                      isNext ? 'text-white' : 'text-gray-300'
                    )}
                  >
                    {formatUserTime(session.date)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Race Analysis Bottom Nav
interface RaceBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasStrategy: boolean;
  isSummarySession?: boolean;
}

const RaceBottomNav: React.FC<RaceBottomNavProps> = ({
  activeTab,
  onTabChange,
  hasStrategy,
  isSummarySession,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChampionIcon },
    ...(isSummarySession
      ? []
      : [
          ...(hasStrategy ? [{ id: 'strategy', label: 'Strategy', icon: TireIcon }] : []),
          { id: 'laptimes', label: 'Laps', icon: ChartLineData01Icon },
          { id: 'h2h', label: 'H2H', icon: GitCompareIcon },
          { id: 'telemetry', label: 'Data', icon: Analytics01Icon },
        ]),
  ];

  if (isSummarySession) return null; // Or return a simplified nav if needed later, but standard is to hide telemetry for summary

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-2 border-white/10 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 transition-colors min-w-[60px] relative',
                isActive ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-[2px] left-0 right-0 h-[2px] bg-red-600"
                />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Highlight Card Types
type HighlightType = 'winner' | 'fastestLap' | 'pole';

interface HighlightCardData {
  type: HighlightType;
  driver: DetailedRaceResult;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  textColor: string;
  timeLabel: string;
  timeValue: string;
  driverNumber?: number;
}

// Individual Highlight Card
interface HighlightCardProps {
  data: HighlightCardData;
  getDriverImage: (code: string, name: string) => string | undefined;
  getTeamColorClass: (team: string | undefined) => string;
}

const HighlightCard: React.FC<HighlightCardProps> = ({
  data,
  getDriverImage,
  getTeamColorClass,
}) => {
  const Icon = data.icon;
  const teamColorClass = getTeamColorClass(data.driver.team);

  // Helper to get a color value for inline styles (approximate based on team)
  // In a real app, we'd want exact hex codes, but we can rely on Tailwind classes or CSS variables if set up.
  // For now, we'll use a mapping or just rely on the class names for background.
  // We'll use a dark card with a gradient overlay.

  const firstName = data.driver.fullName.split(' ')[0];
  const lastName = data.driver.fullName.split(' ').slice(1).join(' ');

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-zinc-950 shadow-2xl border border-white/5">
      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

      {/* Content Container */}
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        {/* Header: Label & Number */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
              {data.label}
            </span>
          </div>
          {data.driverNumber && (
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  'text-3xl font-black italic leading-none opacity-30',
                  `text-f1-${teamColorClass}`
                )}
              >
                {data.driverNumber}
              </span>
            </div>
          )}
        </div>

        {/* Main Content: Driver Image & Name */}
        <div className="flex items-end gap-4 mt-2">
          <div className="relative">
            <div
              className={cn(
                'absolute -inset-1 rounded-2xl opacity-30 blur-md',
                `bg-f1-${teamColorClass}`
              )}
            ></div>
            <Avatar className="relative w-20 h-20 rounded-xl border border-white/10 shadow-2xl bg-zinc-900">
              <AvatarImage
                src={getDriverImage(data.driver.driverCode, data.driver.fullName)}
                className="object-cover object-top"
              />
              <AvatarFallback
                className={cn(
                  'text-xl font-black rounded-xl text-white',
                  `bg-f1-${teamColorClass}`
                )}
              >
                {data.driver.driverCode}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 pb-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase text-white/50 tracking-wider truncate">
                {data.driver.team}
              </span>
            </div>
            <h3 className="text-2xl font-black italic uppercase text-white leading-none tracking-tighter truncate">
              {lastName}
            </h3>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{firstName}</p>
          </div>
        </div>

        {/* Footer: Stats */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent -mx-5 px-5 -mb-5 pb-5">
          <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">
            {data.timeLabel}
          </span>
          <span className={cn('text-xl font-mono font-black tracking-tight', data.textColor)}>
            {data.timeValue}
          </span>
        </div>
      </div>
    </div>
  );
};

// Stacked Swipeable Cards Component
interface StackedHighlightCardsProps {
  highlights: HighlightCardData[];
  getDriverImage: (code: string, name: string) => string | undefined;
  getTeamColorClass: (team: string | undefined) => string;
}

const StackedHighlightCards: React.FC<StackedHighlightCardsProps> = ({
  highlights,
  getDriverImage,
  getTeamColorClass,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (Math.abs(info.offset.x) > threshold) {
        // Swipe detected
        if (info.offset.x < 0) {
          // Swipe left - go to next
          setCurrentIndex((prev) => (prev + 1) % highlights.length);
        } else {
          // Swipe right - go to previous
          setCurrentIndex((prev) => (prev - 1 + highlights.length) % highlights.length);
        }
      }
      x.set(0);
    },
    [highlights.length, x]
  );

  if (highlights.length === 0) return null;

  return (
    <div className="relative h-[240px]">
      {/* Card Stack */}
      {highlights.map((highlight, index) => {
        // Calculate position relative to current
        const relativeIndex = (index - currentIndex + highlights.length) % highlights.length;
        const isTop = relativeIndex === 0;
        const isSecond = relativeIndex === 1;
        const isThird = relativeIndex === 2;

        // Stack effect: cards behind are slightly scaled down and offset
        const scale = isTop ? 1 : isSecond ? 0.95 : 0.9;
        const yOffset = isTop ? 0 : isSecond ? 10 : 20;
        const zIndex = isTop ? 30 : isSecond ? 20 : 10;
        const opacity = isTop ? 1 : isSecond ? 0.6 : 0.3;

        return (
          <motion.div
            key={highlight.type}
            className="absolute inset-0"
            style={{
              zIndex,
              x: isTop ? x : 0,
            }}
            animate={{
              scale,
              y: yOffset,
              opacity,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={isTop ? handleDragEnd : undefined}
          >
            <HighlightCard
              data={highlight}
              getDriverImage={getDriverImage}
              getTeamColorClass={getTeamColorClass}
            />
          </motion.div>
        );
      })}

      {/* Indicator Dots */}
      {highlights.length > 1 && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {highlights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-1 transition-all rounded-full',
                index === currentIndex ? 'bg-red-600 w-8' : 'bg-gray-800 w-4'
              )}
            />
          ))}
        </div>
      )}

      {/* Swipe hint */}
      {highlights.length > 1 && (
        <div className="absolute -bottom-6 right-0 flex items-center gap-1 text-gray-600">
          <span className="text-[10px] uppercase tracking-wider font-bold">Swipe</span>
          <ArrowLeft01Icon className="w-3 h-3 rotate-180" />
        </div>
      )}
    </div>
  );
};

// Result Row Component with Driver Image
interface ResultRowProps {
  result: DetailedRaceResult;
  position: number;
  sessionType: string;
  isFavorite: boolean;
  driverImage?: string;
  isExpanded: boolean;
  onToggle: () => void;
  fastestLapHolder?: DetailedRaceResult | null;
  winnerTime?: string | null;
}

const ResultRow: React.FC<ResultRowProps> = ({
  result,
  position,
  sessionType,
  isFavorite,
  driverImage,
  isExpanded,
  onToggle,
  fastestLapHolder,
  winnerTime,
}) => {
  const isRaceOrSprint = sessionType === 'R' || sessionType === 'Sprint';
  const isPodium = position <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'transition-colors overflow-hidden rounded-xl border border-white/10',
        isFavorite ? 'bg-red-900/10' : 'bg-black'
      )}
    >
      {/* Main Row - Clickable */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer active:bg-zinc-900"
        onClick={onToggle}
      >
        {/* Position */}
        <div
          className={cn(
            'w-8 h-8 flex items-center justify-center font-black text-sm font-mono border',
            isPodium
              ? position === 1
                ? 'bg-yellow-500 text-black border-yellow-500'
                : position === 2
                  ? 'bg-gray-300 text-black border-gray-300'
                  : 'bg-amber-700 text-white border-amber-700'
              : 'bg-black text-gray-500 border-white/20'
          )}
        >
          {position}
        </div>

        {/* Driver Avatar */}
        <Avatar className="w-10 h-10 border border-white/10 rounded-lg">
          <AvatarImage src={driverImage} className="object-cover object-top" />
          <AvatarFallback
            className={cn(
              'text-xs font-bold rounded-lg',
              `bg-f1-${getTeamColorClass(result.team)}`
            )}
          >
            {result.driverCode}
          </AvatarFallback>
        </Avatar>

        {/* Driver Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm text-white truncate uppercase italic tracking-tight">
              {result.fullName}
            </span>
            {((fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) ||
              (!fastestLapHolder && result.isFastestLap)) && (
              <Clock01Icon className="w-3 h-3 text-purple-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn('w-1.5 h-1.5 flex-shrink-0', `bg-f1-${getTeamColorClass(result.team)}`)}
            />
            <span className="text-xs text-gray-500 truncate font-mono uppercase">
              {result.team}
            </span>
          </div>
        </div>

        {/* Time/Gap + Expand Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right flex-shrink-0">
            {isRaceOrSprint ? (
              <>
                <div className="text-xs font-mono text-white font-bold">
                  {(() => {
                    const isLapped = result.status.includes('Lap');
                    const isFinished =
                      result.status === 'Finished' || result.status.startsWith('+') || isLapped;

                    if (isFinished) {
                      if (result.time) return formatRaceTime(result.time, position === 1);
                      if (isLapped) return result.status;
                      return '-';
                    }
                    return (
                      <span className="text-red-500 font-bold uppercase text-[10px]">
                        {result.status}
                      </span>
                    );
                  })()}
                </div>
                {result.points !== null && result.points > 0 && (
                  <div className="text-[10px] font-black text-red-600 bg-red-600/10 px-1 border border-red-600/20 inline-block mt-0.5">
                    +{result.points} PTS
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs font-mono text-white font-bold">
                {result.fastestLapTime || '-'}
              </div>
            )}
          </div>
          <ArrowDown01Icon
            className={cn('w-4 h-4 text-gray-500 transition-transform', isExpanded && 'rotate-180')}
          />
        </div>
      </div>

      {/* Expanded Stats */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-zinc-900/30"
          >
            <div className="px-3 pb-3 pt-2 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                {/* Race Time */}
                {isRaceOrSprint && result.time && (
                  <div className="bg-black border border-white/10 p-2">
                    <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                      Race Time
                    </div>
                    <div className="text-xs font-mono text-white">
                      {position === 1
                        ? formatRaceTime(result.time, true)
                        : calculateFullRaceTime(winnerTime, result.time) || result.time}
                    </div>
                  </div>
                )}

                {/* Fastest Lap */}
                {isRaceOrSprint && (
                  <div
                    className={cn(
                      'p-2 border',
                      (fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) ||
                        (!fastestLapHolder && result.isFastestLap)
                        ? 'bg-purple-900/10 border-purple-600/50'
                        : 'bg-black border-white/10'
                    )}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <div
                        className={cn(
                          'text-[9px] uppercase font-bold tracking-wider',
                          (fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) ||
                            (!fastestLapHolder && result.isFastestLap)
                            ? 'text-purple-400'
                            : 'text-gray-500'
                        )}
                      >
                        Fastest Lap
                      </div>
                      {((fastestLapHolder && result.driverCode === fastestLapHolder.driverCode) ||
                        (!fastestLapHolder && result.isFastestLap)) && (
                        <Clock01Icon className="w-3 h-3 text-purple-500" />
                      )}
                    </div>
                    <div className="text-xs font-mono text-white">
                      {result.driverFastestLapTime || '-'}
                    </div>
                    {result.driverFastestLapNumber && (
                      <div className="text-[9px] text-gray-500 font-mono">
                        Lap {result.driverFastestLapNumber}
                      </div>
                    )}
                  </div>
                )}

                {/* Laps Completed */}
                {(result.laps || result.lapsCompleted) && (
                  <div className="bg-black border border-white/10 p-2">
                    <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                      Laps
                    </div>
                    <div className="text-xs font-mono text-white">
                      {result.laps || result.lapsCompleted}
                    </div>
                  </div>
                )}

                {/* Grid Position */}
                {isRaceOrSprint &&
                  result.gridPosition !== null &&
                  result.gridPosition !== undefined && (
                    <div className="bg-black border border-white/10 p-2">
                      <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                        Started
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-mono text-white">P{result.gridPosition}</div>
                        {result.gridPosition !== position && (
                          <div
                            className={cn(
                              'text-[9px] font-black px-1',
                              result.gridPosition > position
                                ? 'text-green-500 bg-green-500/10'
                                : 'text-red-500 bg-red-500/10'
                            )}
                          >
                            {result.gridPosition > position
                              ? `↑ ${result.gridPosition - position}`
                              : `↓ ${position - result.gridPosition}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Status */}
                {result.status && result.status !== 'Finished' && (
                  <div className="bg-black border border-white/10 p-2">
                    <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">
                      Status
                    </div>
                    <div className="text-xs text-orange-500 font-bold uppercase">
                      {result.status}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Component
const MobileRace: React.FC = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSession = searchParams.get('session') || '';
  const showAnalysis = searchParams.get('view') === 'analysis';

  // Parse ID
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const { year, eventSlug, eventName } = useMemo(() => {
    if (!raceId) return { year: null, eventSlug: null, eventName: 'Race' };
    const parts = raceId.split('-');
    const parsedYear = parseInt(parts[0], 10);
    if (isNaN(parsedYear)) return { year: null, eventSlug: raceId, eventName: 'Invalid Race ID' };
    const slug = parts.slice(1).join('-');
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return { year: parsedYear, eventSlug: slug, eventName: name };
  }, [raceId]);

  const isTestingEvent = useMemo(() => {
    const format = eventName?.toLowerCase() ?? '';
    return format.includes('testing') || format.includes('test');
  }, [eventName]);

  const [now, setNow] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const { trackEvent, trackInteraction } = useAnalytics();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const setSelectedSession = (session: string) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('session', session);
        return newParams;
      },
      { replace: true }
    );
    trackEvent('session_changed', {
      session_type: session,
      race_name: eventName,
      year: year,
    });
  };

  const setShowAnalysisView = (show: boolean) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (show) {
        newParams.set('view', 'analysis');
      } else {
        newParams.delete('view');
      }
      return newParams;
    });
  };

  // Parse ID

  // Removed duplicate useMemo block
  // Get driver image
  const getDriverImg = (driverCode: string, _driverName: string) => {
    return getDriverImage(driverCode, year || 2025);
  };

  // Queries
  const { data: fetchedAvailableSessions, isLoading: isLoadingSessions } = useQuery<
    AvailableSession[]
  >({
    queryKey: ['availableSessions', year, eventName],
    queryFn: () => fetchAvailableSessions(year!, eventName),
    enabled: !!year && !!eventName,
  });

  const { data: sessionSchedule } = useQuery<EventSessionSchedule>({
    queryKey: ['sessionSchedule', year, eventSlug],
    queryFn: () => fetchEventSessionSchedule(year!, eventSlug!),
    enabled:
      !!year &&
      !!eventSlug &&
      !isLoadingSessions &&
      (!fetchedAvailableSessions || !fetchedAvailableSessions.some((s) => s.type === 'R')),
  });

  const availableSessions = useMemo(
    () => fetchedAvailableSessions ?? [],
    [fetchedAvailableSessions]
  );

  const selectedSession = useMemo(() => {
    if (urlSession) return urlSession;
    if (!fetchedAvailableSessions || fetchedAvailableSessions.length === 0) return '';
    const hasRace = fetchedAvailableSessions.some((s) => s.type === 'R');

    if (isTestingEvent && fetchedAvailableSessions.some((s) => s.type === 'Summary')) {
      return 'Summary';
    } else if (hasRace) {
      return 'R';
    }

    return (
      [...fetchedAvailableSessions].sort(
        (a, b) => getTestingSessionOrder(b.type) - getTestingSessionOrder(a.type)
      )[0]?.type ?? fetchedAvailableSessions[fetchedAvailableSessions.length - 1].type
    );
  }, [urlSession, fetchedAvailableSessions, isTestingEvent]);

  const analysisSession = useMemo(() => {
    const resolved = resolveSessionForAnalysis(selectedSession);
    // "Summary" is not a real FastF1 session — map to first FP in available sessions
    if (resolved === 'Summary' && fetchedAvailableSessions && fetchedAvailableSessions.length > 0) {
      const firstFP = fetchedAvailableSessions.find((s) => s.type.startsWith('FP'));
      return firstFP?.type ?? 'FP1';
    }
    return resolved;
  }, [selectedSession, fetchedAvailableSessions]);

  const { data: standardResults, isLoading: isLoadingStandard } = useQuery<DetailedRaceResult[]>({
    queryKey: ['raceResults', year, eventSlug, selectedSession],
    queryFn: () => fetchSpecificRaceResults(year!, eventSlug!, selectedSession),
    enabled: !!year && !!eventSlug && !!selectedSession && selectedSession !== 'Summary',
  });

  const { data: summaryResults, isLoading: isLoadingSummary } = useQuery<DetailedRaceResult[]>({
    queryKey: ['summaryResult', year, eventSlug],
    queryFn: async () => {
      if (!year || !eventSlug || !fetchedAvailableSessions) return [];

      const fetchingSessions = fetchedAvailableSessions.filter((s) => s.type !== 'Summary');

      const allResultsPromises = fetchingSessions.map((s) =>
        fetchSpecificRaceResults(year, eventSlug, s.type)
      );

      const allResultsArray = await Promise.all(allResultsPromises);

      const aggregatedMap: { [driverCode: string]: DetailedRaceResult } = {};

      allResultsArray.forEach((sessionResults) => {
        sessionResults.forEach((result) => {
          if (!aggregatedMap[result.driverCode]) {
            aggregatedMap[result.driverCode] = {
              ...result,
              lapsCompleted: 0,
              fastestLapTime: null,
            };
          }

          const aggr = aggregatedMap[result.driverCode];

          if (result.lapsCompleted) {
            aggr.lapsCompleted = (aggr.lapsCompleted || 0) + result.lapsCompleted;
          }

          if (result.fastestLapTime) {
            const currentFastest = parseLapTime(aggr.fastestLapTime);
            const newTime = parseLapTime(result.fastestLapTime);
            if (!aggr.fastestLapTime || newTime < currentFastest) {
              aggr.fastestLapTime = result.fastestLapTime;
            }
          }
        });
      });

      return Object.values(aggregatedMap);
    },
    enabled: isTestingEvent && selectedSession === 'Summary' && !!fetchedAvailableSessions,
  });

  const raceResults = selectedSession === 'Summary' ? summaryResults : standardResults;
  const isLoadingResults = selectedSession === 'Summary' ? isLoadingSummary : isLoadingStandard;

  // Derived State
  const currentSessionName =
    availableSessions.find((s) => s.type === selectedSession)?.name || 'Session';
  const isRaceOrSprint = selectedSession === 'R' || selectedSession === 'Sprint';

  const isTestingSession =
    isTestingEvent &&
    (selectedSession.startsWith('FP') ||
      selectedSession === 'Summary' ||
      !!parseTestingSessionAlias(selectedSession));

  const fastestLapHolder = useMemo(() => {
    if (!isRaceOrSprint || !raceResults) return null;

    const validResults = raceResults.filter(
      (r) => !['Disqualified', 'DSQ', 'EXC'].includes(r.status) && r.driverFastestLapTime
    );

    if (validResults.length === 0) return null;

    return validResults.sort(
      (a, b) => parseLapTime(a.driverFastestLapTime) - parseLapTime(b.driverFastestLapTime)
    )[0];
  }, [raceResults, isRaceOrSprint]);

  const displayResults = useMemo(() => {
    if (!raceResults) return [];
    if (isRaceOrSprint) return raceResults;
    return [...raceResults].sort((a, b) => {
      const lapDelta = parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime);
      if (lapDelta !== 0) return lapDelta;
      return (b.lapsCompleted ?? 0) - (a.lapsCompleted ?? 0);
    });
  }, [raceResults, isRaceOrSprint]);

  // Highlights Logic
  const highlights = useMemo(() => {
    if (!raceResults || raceResults.length === 0) return [];
    const cards: HighlightCardData[] = [];

    const getDriverNumber = (_driverCode: string, _name: string): number | undefined => {
      return undefined;
    };

    if (isRaceOrSprint) {
      const winner = raceResults.find((r) => r.position === 1);
      if (winner) {
        cards.push({
          type: 'winner',
          driver: winner,
          label: 'Race Winner',
          icon: ChampionIcon,
          bgColor: 'bg-black',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-500',
          timeLabel: 'Race Time',
          timeValue: formatRaceTime(winner.time, true),
          driverNumber: getDriverNumber(winner.driverCode, winner.fullName),
        });
      }

      if (fastestLapHolder) {
        cards.push({
          type: 'fastestLap',
          driver: fastestLapHolder,
          label: 'Fastest Lap',
          icon: Clock01Icon,
          bgColor: 'bg-black',
          borderColor: 'border-purple-600',
          textColor: 'text-purple-500',
          timeLabel: 'Lap Time',
          timeValue: fastestLapHolder.driverFastestLapTime || '-',
          driverNumber: getDriverNumber(fastestLapHolder.driverCode, fastestLapHolder.fullName),
        });
      }

      const pole = raceResults.find((r) => r.gridPosition === 1);
      if (pole) {
        cards.push({
          type: 'pole',
          driver: pole,
          label: 'Pole Position',
          icon: StartUp02Icon,
          bgColor: 'bg-black',
          borderColor: 'border-red-600',
          textColor: 'text-red-600',
          timeLabel: 'Pole Time',
          timeValue: pole.poleLapTimeValue || '-',
          driverNumber: getDriverNumber(pole.driverCode, pole.fullName),
        });
      }
    } else if (isTestingSession) {
      const fastest = [...raceResults]
        .filter((result) => !!result.fastestLapTime)
        .sort((a, b) => parseLapTime(a.fastestLapTime) - parseLapTime(b.fastestLapTime))[0];

      const mileageLeader = [...raceResults].sort(
        (a, b) => (b.lapsCompleted ?? 0) - (a.lapsCompleted ?? 0)
      )[0];

      if (fastest) {
        cards.push({
          type: 'fastestLap',
          driver: fastest,
          label: 'Fastest Lap',
          icon: Clock01Icon,
          bgColor: 'bg-black',
          borderColor: 'border-purple-600',
          textColor: 'text-purple-500',
          timeLabel: 'Lap Time',
          timeValue: fastest.fastestLapTime || '-',
          driverNumber: getDriverNumber(fastest.driverCode, fastest.fullName),
        });
      }

      if (mileageLeader) {
        cards.push({
          type: 'winner',
          driver: mileageLeader,
          label: 'Mileage Leader',
          icon: StartUp02Icon,
          bgColor: 'bg-black',
          borderColor: 'border-green-600',
          textColor: 'text-green-500',
          timeLabel: 'Total Laps',
          timeValue: `${mileageLeader.lapsCompleted ?? 0}`,
          driverNumber: getDriverNumber(mileageLeader.driverCode, mileageLeader.fullName),
        });
      }
    }

    return cards;
  }, [raceResults, fastestLapHolder, isRaceOrSprint, isTestingSession]);

  // Loading State
  if (isLoadingSessions) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-red-600 font-black uppercase tracking-widest text-sm animate-pulse">
            Loading Race Data...
          </div>
        </div>
      </div>
    );
  }

  // Schedule View (No Race Results Yet)
  const hasRaceData = isTestingEvent
    ? availableSessions.length > 0
    : availableSessions.some((s) => s.type === 'R');
  if (!hasRaceData && sessionSchedule && !showAnalysis) {
    const upcomingSession = sessionSchedule.sessions.find((s) => new Date(s.date) > now);
    const nextSession =
      upcomingSession || sessionSchedule.sessions[sessionSchedule.sessions.length - 1];

    return (
      <div className="min-h-screen bg-black text-white pb-20 font-sans">
        <MobilePageHeader title={eventName} showBack />

        <div className="p-4 space-y-6">
          {/* Countdown */}
          {nextSession && new Date(nextSession.date) > now && (
            <div className="py-8">
              <div className="text-center mb-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Next Session
                </h2>
                <h1 className="text-3xl font-black uppercase italic text-white">
                  {nextSession.name}
                </h1>
              </div>
              <MobileCountdown targetDate={new Date(nextSession.date)} />
            </div>
          )}

          {/* Schedule List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar01Icon className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-black uppercase italic tracking-tight">
                Weekend Schedule
              </h3>
            </div>
            {sessionSchedule.sessions.map((session) => {
              const sessionDate = new Date(session.date);
              const isNext = nextSession === session && sessionDate > now;
              const isLive =
                sessionDate <= now && new Date(sessionDate.getTime() + 2 * 60 * 60 * 1000) > now; // Approx 2h duration

              // Map session name to type for available check
              let sessionType = '';
              const lowerName = session.name.toLowerCase();
              if (lowerName.includes('practice 1')) sessionType = 'FP1';
              else if (lowerName.includes('practice 2')) sessionType = 'FP2';
              else if (lowerName.includes('practice 3')) sessionType = 'FP3';
              else if (
                lowerName.includes('sprint qualifying') ||
                lowerName.includes('sprint shootout')
              )
                sessionType = 'SQ';
              else if (lowerName.includes('sprint') && !lowerName.includes('qualifying'))
                sessionType = 'Sprint';
              else if (lowerName.includes('qualifying') && !lowerName.includes('sprint'))
                sessionType = 'Q';
              else if (lowerName === 'race') sessionType = 'R';

              const isAvailable = availableSessions.some((s) => {
                if (sessionType === 'Q')
                  return s.type === 'Q' || s.type === 'Q1' || s.type === 'Q2' || s.type === 'Q3';
                if (sessionType === 'SQ')
                  return (
                    s.type === 'SQ' || s.type === 'SQ1' || s.type === 'SQ2' || s.type === 'SQ3'
                  );
                return s.type === sessionType;
              });

              return (
                <ScheduleSessionCard
                  key={session.name}
                  session={session}
                  isNext={isNext}
                  isLive={isLive}
                  isAvailable={isAvailable}
                  is24Hour={is24Hour}
                  onViewResults={() => {
                    let targetSession = sessionType;
                    if (sessionType === 'Q' && !availableSessions.some((s) => s.type === 'Q')) {
                      if (availableSessions.some((s) => s.type === 'Q3')) targetSession = 'Q3';
                      else if (availableSessions.some((s) => s.type === 'Q2')) targetSession = 'Q2';
                      else if (availableSessions.some((s) => s.type === 'Q1')) targetSession = 'Q1';
                    }
                    if (sessionType === 'SQ' && !availableSessions.some((s) => s.type === 'SQ')) {
                      if (availableSessions.some((s) => s.type === 'SQ3')) targetSession = 'SQ3';
                      else if (availableSessions.some((s) => s.type === 'SQ2'))
                        targetSession = 'SQ2';
                      else if (availableSessions.some((s) => s.type === 'SQ1'))
                        targetSession = 'SQ1';
                    }
                    setSelectedSession(targetSession);
                    setShowAnalysisView(true);
                    trackInteraction('view_results_clicked', { session: targetSession });
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-[80px] font-sans selection:bg-red-600 selection:text-white">
      <MobilePageHeader title={eventName} showBack />

      {/* Session Selector Header */}
      <div className="sticky top-[58px] z-40 bg-black/95 backdrop-blur-md border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: GP Name */}
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white truncate max-w-[60%]">
            {eventName}
          </h2>

          {/* Right: Session Selector */}
          <button
            onClick={() => setShowSessionSelector(true)}
            className="flex items-center gap-2 active:opacity-70"
          >
            <span className="text-sm font-bold uppercase tracking-wider text-gray-400">
              {currentSessionName}
            </span>
            <ArrowDown01Icon className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'h2h' && (
          <GatedRoute
            featureName="Head to Head Analysis"
            description="Compare driver performance lap-by-lap with detailed head-to-head analysis."
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              <MobileHeadToHead
                year={year!}
                event={eventName}
                session={analysisSession}
                raceResults={raceResults}
              />
            </motion.div>
          </GatedRoute>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Highlights Carousel */}
            {highlights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                  {isTestingSession ? 'Testing Highlights' : 'Highlights'}
                </h3>
                <StackedHighlightCards
                  highlights={highlights}
                  getDriverImage={getDriverImg}
                  getTeamColorClass={getTeamColorClass}
                />
              </div>
            )}

            {/* Results Table */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Classification
                </h3>
                <span className="text-[10px] font-mono text-gray-600">
                  {displayResults.length} DRIVERS
                </span>
              </div>

              {isTestingSession && (
                <div className="mb-3 p-2 border border-blue-500/30 bg-blue-500/10 rounded-lg">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-blue-300">
                    Sorted by fastest lap. Expand rows for mileage and reliability context.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {isLoadingResults ? (
                  <div className="p-8 text-center text-gray-500 animate-pulse bg-black">
                    Loading results...
                  </div>
                ) : (
                  displayResults.map((result, index) => (
                    <ResultRow
                      key={`${result.driverCode}-${index}`}
                      result={result}
                      position={isRaceOrSprint ? (result.position ?? index + 1) : index + 1}
                      sessionType={selectedSession}
                      isFavorite={profile?.favorite_driver === result.driverCode}
                      driverImage={getDriverImg(result.driverCode, result.fullName)}
                      isExpanded={expandedDriver === result.driverCode}
                      onToggle={() =>
                        setExpandedDriver(
                          expandedDriver === result.driverCode ? null : result.driverCode
                        )
                      }
                      fastestLapHolder={fastestLapHolder}
                      winnerTime={displayResults.find((r) => r.position === 1)?.time}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'strategy' && year && (
          <GatedRoute
            featureName="Tyre Strategy"
            description="Analyze pit stops, tyre compounds, and race strategy decisions."
          >
            <MobileStrategy
              year={year}
              event={eventName}
              session={analysisSession}
              raceResults={raceResults}
              getDriverImage={getDriverImg}
            />
          </GatedRoute>
        )}

        {activeTab === 'laptimes' && year && (
          <GatedRoute
            featureName="Lap Times Analysis"
            description="Deep dive into lap-by-lap timing data and performance trends."
          >
            <MobileLapTimes
              year={year}
              event={eventName}
              session={analysisSession}
              raceResults={raceResults}
            />
          </GatedRoute>
        )}

        {activeTab === 'telemetry' && (
          <GatedRoute
            featureName="Advanced Telemetry"
            description="Access detailed car telemetry including throttle, brake, gear, and speed data."
          >
            <MobileTelemetry
              year={year!}
              event={eventName}
              session={analysisSession}
              raceResults={raceResults}
            />
          </GatedRoute>
        )}
      </div>

      {/* Bottom Nav */}
      <RaceBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          trackInteraction('mobile_tab_changed', { tab });
        }}
        hasStrategy={isRaceOrSprint}
      />

      {/* Session Selector Modal */}
      <SessionSelector
        isOpen={showSessionSelector}
        onClose={() => setShowSessionSelector(false)}
        sessions={availableSessions}
        selectedSession={selectedSession}
        onSelect={setSelectedSession}
      />
    </div>
  );
};

export { MobileRace };
export default MobileRace;
