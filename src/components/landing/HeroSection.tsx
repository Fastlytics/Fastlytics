import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import HeroDashboard from './HeroDashboard';
import { ChartType, HeroWindowBounds } from './hero-types';
import {
  DEFAULT_HERO_VIEW,
  buildLandingHeroView,
  findNearestLandingFrameIndex,
  getExpandedHeroBounds,
  pickLandingReplayKey,
  prepareLandingReplayContext,
} from './hero-utils';
import { useLandingHeroSource } from './useLandingHeroSource';

const HERO_DRIVER_CODE_KEY = 'hero-driver-code-v1';

type HeroState = {
  playbackTime: number;
  chartType: ChartType;
  heroModalPhase: 'closed' | 'open' | 'closing';
  userSelectedDriverCode: string | null;
  heroWindowAnimation: { origin: HeroWindowBounds; target: HeroWindowBounds } | null;
};

type HeroAction =
  | { type: 'setPlaybackTime'; value: HeroState['playbackTime'] }
  | { type: 'setChartType'; value: ChartType }
  | { type: 'openHero'; origin: HeroWindowBounds; target: HeroWindowBounds }
  | { type: 'closeHero' }
  | { type: 'finishClosing' }
  | { type: 'setUserSelectedDriverCode'; value: string | null }
  | { type: 'resetForNewCache' };

const heroReducer = (state: HeroState, action: HeroAction): HeroState => {
  switch (action.type) {
    case 'setPlaybackTime':
      return { ...state, playbackTime: action.value };
    case 'setChartType':
      return { ...state, chartType: action.value };
    case 'openHero':
      return {
        ...state,
        heroModalPhase: 'open',
        heroWindowAnimation: { origin: action.origin, target: action.target },
      };
    case 'closeHero':
      return { ...state, heroModalPhase: state.heroModalPhase === 'closed' ? 'closed' : 'closing' };
    case 'finishClosing':
      return { ...state, heroModalPhase: 'closed' };
    case 'setUserSelectedDriverCode':
      return { ...state, userSelectedDriverCode: action.value };
    case 'resetForNewCache':
      return { ...state, playbackTime: 0, chartType: 'speed', userSelectedDriverCode: null };
    default:
      return state;
  }
};

export default function HeroSection() {
  const [heroState, dispatch] = useReducer(heroReducer, {
    playbackTime: 0,
    chartType: 'speed',
    heroModalPhase: 'closed',
    userSelectedDriverCode: null,
    heroWindowAnimation: null,
  });
  const { playbackTime, chartType, heroModalPhase, userSelectedDriverCode, heroWindowAnimation } =
    heroState;
  const {
    selectedCache,
    metadata,
    chunk,
    loadedDuration,
    playbackStartTime,
    playbackEndTime,
    canSelectDifferentCache,
    selectDifferentCache,
  } = useLandingHeroSource(playbackTime);
  const cacheKey = selectedCache ? pickLandingReplayKey(selectedCache) : '';
  const cacheKeyRef = useRef(cacheKey);
  const compactHeroWindowRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const isHeroExpanded = heroModalPhase !== 'closed';
  const isHeroClosing = heroModalPhase === 'closing';
  const leaderCode = metadata?.selected_drivers?.[0] || chunk?.selected_drivers?.[0] || null;

  const derivedDriverCode = useMemo(() => {
    if (!leaderCode) return null;
    const availableDrivers = metadata?.selected_drivers || chunk?.selected_drivers || [];
    const storedDriverCode =
      typeof window === 'undefined' ? null : sessionStorage.getItem(HERO_DRIVER_CODE_KEY);
    if (storedDriverCode && availableDrivers.includes(storedDriverCode)) return storedDriverCode;
    return leaderCode;
  }, [leaderCode, metadata?.selected_drivers, chunk?.selected_drivers]);

  const selectedDriverCode = userSelectedDriverCode || derivedDriverCode;

  const handleSelectDriver = useCallback((value: string) => {
    dispatch({ type: 'setUserSelectedDriverCode', value });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(HERO_DRIVER_CODE_KEY, value);
    }
  }, []);

  useEffect(() => {
    if (cacheKeyRef.current !== cacheKey) {
      cacheKeyRef.current = cacheKey;
      dispatch({ type: 'resetForNewCache' });
    }
  }, [cacheKey]);

  useEffect(() => {
    if (!chunk || chunk.time.length <= 1 || playbackEndTime <= playbackStartTime) return;

    const intervalId = window.setInterval(() => {
      const baseTime = playbackTime < playbackStartTime ? playbackStartTime : playbackTime;
      const next = baseTime + 1 / 25;
      const totalEnd = playbackEndTime;
      const hasFullTail = loadedDuration >= totalEnd;
      const playableEnd = hasFullTail
        ? totalEnd
        : Math.max(playbackStartTime, Math.min(totalEnd, loadedDuration - 0.25));

      const newTime =
        next >= totalEnd
          ? playbackStartTime
          : !hasFullTail && next >= playableEnd
            ? playableEnd
            : next;
      dispatch({ type: 'setPlaybackTime', value: newTime });
    }, 1000 / 25);

    return () => window.clearInterval(intervalId);
  }, [chunk, loadedDuration, playbackEndTime, playbackStartTime]);

  const frameIndex = useMemo(() => {
    if (!chunk?.time?.length) return 0;
    return findNearestLandingFrameIndex(playbackTime, chunk.time);
  }, [chunk, playbackTime]);

  const closeExpandedHero = useCallback(() => {
    dispatch({ type: 'closeHero' });
    closeTimeoutRef.current = window.setTimeout(() => {
      dispatch({ type: 'finishClosing' });
      closeTimeoutRef.current = null;
    }, 420);
  }, []);

  const closeExpandedHeroRef = useRef(closeExpandedHero);
  useEffect(() => {
    closeExpandedHeroRef.current = closeExpandedHero;
  }, [closeExpandedHero]);

  useEffect(() => {
    if (!isHeroExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeExpandedHeroRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHeroExpanded]);

  const preparedReplay = useMemo(() => {
    if (!selectedCache || !metadata || !chunk) return null;
    return prepareLandingReplayContext(selectedCache, metadata, chunk);
  }, [selectedCache, metadata, chunk]);

  const hero = useMemo(() => {
    if (!preparedReplay || !selectedDriverCode) return null;
    try {
      return buildLandingHeroView(preparedReplay, selectedDriverCode, frameIndex, chartType);
    } catch {
      return null;
    }
  }, [preparedReplay, selectedDriverCode, frameIndex, chartType]);

  const openExpandedHero = () => {
    const target = getExpandedHeroBounds();
    const rect = compactHeroWindowRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 12,
        }
      : target;

    dispatch({ type: 'openHero', origin, target });
  };

  const isHeroLoading = !hero;

  return (
    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 size-[600px] -translate-x-1/2 rounded-full bg-red-500/[0.07] blur-[120px]" />
        <div className="absolute right-1/4 top-20 size-[400px] rounded-full bg-orange-500/[0.05] blur-[100px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Race intelligence <span className="text-red-500">for every</span> Formula 1 session
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50"
          >
            Telemetry, strategy, pace and championship context wired into one live race desk. See
            what the pit wall sees.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              to="/dashboard"
              className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-white px-6 text-[14px] font-semibold text-black transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
              Open race desk
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M1 7h12M8 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-[14px] font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              See features
            </a>
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="relative mx-auto mt-16 max-w-7xl lg:mt-20"
        >
          <div className="absolute -inset-6 rounded-2xl bg-gradient-to-b from-red-500/10 via-transparent to-transparent blur-2xl" />
          <div
            ref={compactHeroWindowRef}
            className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_120px_rgba(0,0,0,0.6)] ${
              isHeroExpanded ? 'pointer-events-none opacity-0' : ''
            }`}
          >
            {isHeroLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-red-500/[0.03] via-transparent to-black/10" />
            )}
            <HeroDashboard
              hero={hero || DEFAULT_HERO_VIEW}
              variant="compact"
              isLoading={isHeroLoading}
              chartType={chartType}
              setChartType={(value: ChartType) => dispatch({ type: 'setChartType', value })}
              selectedDriverCode={selectedDriverCode}
              canSelectDifferentCache={canSelectDifferentCache}
              selectDifferentCache={selectDifferentCache}
              setUserSelectedDriverCode={handleSelectDriver}
              onChromeAction={openExpandedHero}
            />
          </div>
          <div className="absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-t from-red-500/5 to-transparent blur-3xl" />
        </m.div>

        {hero && heroWindowAnimation && heroModalPhase !== 'closed' && (
          <>
            <m.div
              key="hero-expanded-backdrop"
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHeroClosing ? 0 : 1 }}
              transition={{ duration: isHeroClosing ? 0.22 : 0.42 }}
              onMouseDown={closeExpandedHero}
            />
            <m.div
              key="hero-expanded-window"
              className="fixed z-[80] flex flex-col overflow-hidden border border-white/[0.10] bg-[#0c0c0e] shadow-[0_40px_180px_rgba(0,0,0,0.75)]"
              initial={heroWindowAnimation.origin}
              animate={isHeroClosing ? heroWindowAnimation.origin : heroWindowAnimation.target}
              transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.95 }}
            >
              <HeroDashboard
                hero={hero}
                variant={isHeroClosing ? 'compact' : 'expanded'}
                isLoading={false}
                chartType={chartType}
                setChartType={(value: ChartType) => dispatch({ type: 'setChartType', value })}
                selectedDriverCode={selectedDriverCode}
                canSelectDifferentCache={canSelectDifferentCache}
                selectDifferentCache={selectDifferentCache}
                setUserSelectedDriverCode={handleSelectDriver}
                onChromeAction={closeExpandedHero}
              />
            </m.div>
          </>
        )}
      </div>
    </section>
  );
}
