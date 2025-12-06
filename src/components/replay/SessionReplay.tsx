import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionReplay, SessionReplayData } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import ReplayLoader from './ReplayLoader';
import { Play, Pause, FastForward, Rewind, Clock, X, Maximize, Minimize, Gauge, Flag, AlertTriangle, AlertCircle, CheckCircle, Search, Zap, ZapOff, Info } from 'lucide-react';

interface SessionReplayProps {
    year: number;
    event: string;
    session: string;
    className?: string;
}

const FPS = 25;

// Local fallback images from public/drivers
const DRIVER_IMAGE_MAP: Record<string, string> = {
    "VER": "/drivers/2025redbullracingmaxver01right.avif",
    "TSU": "/drivers/2025redbullracingyuktsu01right.avif",
    "LAW": "/drivers/2025racingbullslialaw01right.avif",
    "HAD": "/drivers/2025racingbullsisahad01right.avif",
    "RUS": "/drivers/2025mercedesgeorus01right.avif",
    "ANT": "/drivers/2025mercedesandant01right.avif", // Antonelli
    "PIA": "/drivers/2025mclarenoscpia01right.avif",
    "NOR": "/drivers/2025mclarenlannor01right.avif",
    "HUL": "/drivers/2025kicksaubernichul01right.avif",
    "BOR": "/drivers/2025kicksaubergabbor01right.avif", // Bortoleto
    "BEA": "/drivers/2025haasf1teamolibea01right.avif",
    "OCO": "/drivers/2025haasf1teamestoco01right.avif",
    "HAM": "/drivers/2025ferrarilewham01right.avif",
    "LEC": "/drivers/2025ferrarichalec01right.avif",
    "STR": "/drivers/2025astonmartinlanstr01right.avif",
    "ALO": "/drivers/2025astonmartinferalo01right.avif",
    "GAS": "/drivers/2025alpinepiegas01right.avif",
    "COL": "/drivers/2025alpinefracol01right.avif", // Colapinto?
    "ALB": "/drivers/2025williamsalealb01right.avif",
    "SAI": "/drivers/2025williamscarsai01right.avif",
};

const getMessageConfig = (msg: { message: string, flag?: string }) => {
    const text = (msg.message + " " + (msg.flag || "")).toUpperCase();

    if (text.includes("RED FLAG") || text.includes("SUSPENDED")) {
        return { type: 'red', icon: Flag, color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-950/90', fill: true };
    }
    if (text.includes("GREEN") || text.includes("RESUMED") || text.includes("CLEAR")) {
        return { type: 'green', icon: Flag, color: 'text-green-500', border: 'border-green-500', bg: 'bg-green-950/90', fill: true };
    }
    // Specific status messages (Prioritize over generic flags)
    if (text.includes("PENALTY")) {
        return { type: 'penalty', icon: AlertCircle, color: 'text-orange-500', border: 'border-orange-500', bg: 'bg-orange-950/90', fill: false };
    }
    if (text.includes("NO INVESTIGATION")) {
        return { type: 'info', icon: CheckCircle, color: 'text-green-400', border: 'border-green-500', bg: 'bg-gray-900/90', fill: false };
    }
    if (text.includes("INVESTIGATION") || text.includes("NOTED") || text.includes("INCIDENT") || text.includes("INFRINGEMENT")) {
        return { type: 'investigation', icon: Search, color: 'text-indigo-400', border: 'border-indigo-500', bg: 'bg-indigo-950/90', fill: false };
    }
    // Track Status Flags
    if (text.includes("YELLOW") || text.includes("SAFETY CAR") || text.includes("SC") || text.includes("VSC")) {
        return { type: 'yellow', icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-950/90', fill: false };
    }
    if (text.includes("BLUE")) {
        return { type: 'blue', icon: Flag, color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-950/90', fill: true };
    }
    if (text.includes("DRS ENABLED")) {
        return { type: 'drs', icon: Zap, color: 'text-green-400', border: 'border-green-500', bg: 'bg-gray-900/90', fill: true };
    }
    if (text.includes("DRS DISABLED")) {
        return { type: 'drs', icon: ZapOff, color: 'text-red-400', border: 'border-red-500', bg: 'bg-gray-900/90', fill: false };
    }
    if (text.includes("CHEQUERED")) {
        return { type: 'finish', icon: Flag, color: 'text-white', border: 'border-white', bg: 'bg-black/90', fill: false };
    }

    return { type: 'other', icon: Info, color: 'text-gray-400', border: 'border-gray-600', bg: 'bg-gray-900/90', fill: false };
};

const SessionReplay: React.FC<SessionReplayProps> = ({ year, event, session, className }) => {
    const { data, isLoading, error } = useQuery<SessionReplayData>({
        queryKey: ['sessionReplay', year, event, session],
        queryFn: () => fetchSessionReplay(year, event, session),
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60,
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [leaderboardOrder, setLeaderboardOrder] = useState<string[]>([]);
    const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | null>(null);

    // Find absolute bounds for slider
    const { totalDuration, totalLaps } = useMemo(() => {
        if (!data?.time?.length) return { totalDuration: 0, totalLaps: 0 };

        const maxTime = data.time[data.time.length - 1];

        // Calculate Total Laps from data
        let maxLap = 0;
        if (data.drivers) {
            for (const d of Object.values(data.drivers)) {
                if (d.lap) {
                    const localMax = Math.max(...d.lap);
                    if (localMax > maxLap) maxLap = localMax;
                }
            }
        }

        return { totalDuration: maxTime, totalLaps: maxLap };
    }, [data]);

    // --- Zoom & Pan State ---
    const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isFollowing, setIsFollowing] = useState(true); // Default to following (Leader)
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Refs for accessing state in closures (event listeners / animation loop)
    const isFollowingRef = useRef(true);
    const viewStateRef = useRef({ scale: 1, x: 0, y: 0 }); // To avoid layout thrashing dependency loops
    const selectedDriverRef = useRef<string | null>(null);
    const leaderboardOrderRef = useRef<string[]>([]);

    // Sync refs
    useEffect(() => { isFollowingRef.current = isFollowing; }, [isFollowing]);
    useEffect(() => { viewStateRef.current = viewState; }, [viewState]);
    useEffect(() => { selectedDriverRef.current = selectedDriver; }, [selectedDriver]);
    useEffect(() => { leaderboardOrderRef.current = leaderboardOrder; }, [leaderboardOrder]);

    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    // Toggle Fullscreen
    const toggleFullscreen = () => {
        if (!rootRef.current) return;

        if (!document.fullscreenElement) {
            rootRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is an input (e.g. slider, though slider usually handles arrows natively, we might want custom seek)
            // But for the range slider, let's let it handle arrows if focused? 
            // Actually, global hotkeys usually override unless focusing a text input.
            // Our slider is type="range".

            if (e.target instanceof HTMLInputElement && e.target.type === 'text') return; // Ignore text inputs
            if (e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                case 'k': // YouTube style
                case 'K':
                    e.preventDefault(); // Prevent scroll
                    setIsPlaying(prev => !prev);
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
                case 'ArrowLeft':
                case 'j': // YouTube style (10s usually, but uniform 5s here)
                case 'J':
                    e.preventDefault();
                    setCurrentTime(prev => Math.max(0, prev - 5));
                    break;
                case 'ArrowRight':
                case 'l': // YouTube style
                case 'L':
                    e.preventDefault();
                    setCurrentTime(prev => Math.min(totalDuration, prev + 5));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalDuration]); // toggleFullscreen is stable/closure safe? toggleFullscreen uses refs so it's safe.

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        setIsDragging(true);
        setIsFollowing(false); // User wants to manually pan
        setDragStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart) return;
        setViewState(prev => ({
            ...prev,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    // Playback Loop
    const animate = (time: number) => {
        if (previousTimeRef.current !== null) {
            const deltaTime = (time - previousTimeRef.current) / 1000; // ms to s

            if (isPlaying) {
                setCurrentTime(prevTime => {
                    const newTime = prevTime + (deltaTime * playbackSpeed);
                    if (newTime >= totalDuration) {
                        setIsPlaying(false);
                        return totalDuration;
                    }
                    return newTime;
                });
            }
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, playbackSpeed, totalDuration]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            const scaleSensitivity = 0.001;
            const delta = -e.deltaY * scaleSensitivity;
            // Use functional update to avoid stale state in closure if we didn't use refs, 
            // but here we can just assume access to current state if we depend on it, 
            // OR better yet, use functional state update for setViewState
            // However, inside this native listener, 'viewState' from closure will be STALE unless we include it in dependency array.
            // But if we include it in dependency array, we re-bind listener every frame = bad performance.
            // Solution: Use a ref for viewState or functional update entirely.

            setViewState(prev => {
                const newScale = Math.min(Math.max(1, prev.scale + delta * prev.scale), 20);

                if (isFollowingRef.current) {
                    // Zoom to center (Driver)
                    // We don't need to weird math here, just update scale. 
                    // The Follow Logic in the effect will handle centering on next tick.
                    // BUT for smoothness, we can try to re-center immediately if we have data.
                    // Actually, let's just update scale and X/Y will be corrected by the Follow Effect almost instantly.
                    // To prevent jumpiness, we keep the center point stable relative to screen center?
                    // Actually if we just return X/Y unchanged, the next 'follow' tick will snap it.
                    // Let's try just updating scale.
                    return { ...prev, scale: newScale };
                }

                // Free Mode: Zoom to mouse
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const contentX = (mouseX - prev.x) / prev.scale;
                const contentY = (mouseY - prev.y) / prev.scale;

                const newX = mouseX - contentX * newScale;
                const newY = mouseY - contentY * newScale;

                return {
                    scale: newScale,
                    x: newX,
                    y: newY
                };
            });
        };

        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [isLoading]); // Re-attach when loading finishes and ref is available

    const currentFrameIndex = Math.floor(currentTime * FPS);
    // Ensure index is within bounds
    const safeIndex = Math.min(Math.max(0, currentFrameIndex), (data?.time?.length || 1) - 1);

    // Optimization: Cache last known path index for each driver to speed up search
    const lastTrackIndices = useRef<Record<string, number>>({});

    // Helper: Find nearest point index on the circuit path
    const getTrackIndex = (code: string, x: number, y: number, points: number[][]) => {
        if (!points || points.length === 0) return 0;

        // Start search from last known index or 0
        let startIdx = lastTrackIndices.current[code] || 0;
        const searchWindow = 500; // Look ahead/behind window (optimize for 60fps)

        let bestIdx = startIdx;
        let minDistSq = Infinity;

        const len = points.length;

        // Search in window around startIdx (accounting for wrap-around)
        // We actully primarily search FORWARD because cars move forward.
        // But we search a bit backward too just in case of jitter or visual interpolation lag.
        for (let offset = -50; offset < searchWindow; offset++) {
            let idx = (startIdx + offset);
            // Handle wrapping
            if (idx < 0) idx += len;
            if (idx >= len) idx %= len;

            const px = points[idx][0];
            const py = points[idx][1];
            const dSq = (px - x) ** 2 + (py - y) ** 2;

            if (dSq < minDistSq) {
                minDistSq = dSq;
                bestIdx = idx;
            }
        }

        // Fallback: If distance is too large (e.g. jumped track or first load), global search?
        // For now, assume local search is good enough after first frame (or effectively standard sort).
        // Actually, for first frame 'startIdx' is 0, so we might need global search if window misses.
        // Let's do a global search if we haven't seen this driver before.
        if (lastTrackIndices.current[code] === undefined) {
            minDistSq = Infinity;
            for (let i = 0; i < len; i += 5) { // coarse search first?
                const px = points[i][0];
                const py = points[i][1];
                const dSq = (px - x) ** 2 + (py - y) ** 2;
                if (dSq < minDistSq) {
                    minDistSq = dSq;
                    bestIdx = i;
                }
            }
        }

        lastTrackIndices.current[code] = bestIdx;
        return bestIdx;
    };

    // Reconstruct "Frame" view from Columnar data for easier rendering
    const currentFrameDrivers = useMemo(() => {
        if (!data) return {};
        const drivers: Record<string, any> = {};

        const pathPoints = data.circuit_points || [];
        const pathDists = data.circuit_distances || [];
        const pathLen = pathPoints.length;

        for (const [code, d] of Object.entries(data.drivers)) {
            // Access arrays at safeIndex
            const x = d.x[safeIndex];
            const y = d.y[safeIndex];

            // Calculate visual track position
            const trackIdx = getTrackIndex(code, x, y, pathPoints);

            // Calculate Standardized Distance (Reference Odometer)
            // If we have circuit_distances, use them. Otherwise fallback to raw.
            let refDist = 0;
            if (pathDists.length > 0 && trackIdx < pathDists.length) {
                refDist = pathDists[trackIdx];
            } else {
                refDist = d.dist[safeIndex]; // fallback
            }

            drivers[code] = {
                x,
                y,
                dist: d.dist[safeIndex], // Keep raw for debugging/telemetry
                ref_dist: refDist,       // NEW: Normalized distance for intervals
                rel_dist: d.rel_dist[safeIndex],
                speed: d.speed?.[safeIndex] ?? 0,
                gear: d.gear?.[safeIndex] ?? 0,
                drs: d.drs?.[safeIndex] ?? 0,
                rpm: d.rpm?.[safeIndex] ?? 0,
                lap: d.lap?.[safeIndex] ?? 0,
                tyre: d.tyre?.[safeIndex] ?? 0,
                throttle: d.throttle?.[safeIndex] ?? 0,
                brake: d.brake?.[safeIndex] ?? 0,
                track_index: trackIdx
            }
        }
        return drivers;
    }, [data, safeIndex]);

    // --- Following Logic ---
    useEffect(() => {
        if (!isFollowing || !containerRef.current || !data || Object.keys(currentFrameDrivers).length === 0) {
            return;
        }

        const container = containerRef.current;
        const { width, height } = container.getBoundingClientRect();

        let targetDriverCode = selectedDriverRef.current;
        if (!targetDriverCode && leaderboardOrderRef.current.length > 0) {
            targetDriverCode = leaderboardOrderRef.current[0]; // Follow leader if no driver selected
        }

        if (targetDriverCode) {
            const driver = currentFrameDrivers[targetDriverCode];
            if (driver) {
                // Calculate correct transform considering SVG Aspect Ratio (xMidYMid meet)
                const VIEWBOX_WIDTH = 1000;
                const VIEWBOX_HEIGHT = 500;

                // Calculate how the SVG is scaled within the container
                const scaleX = width / VIEWBOX_WIDTH;
                const scaleY = height / VIEWBOX_HEIGHT;
                const fitScale = Math.min(scaleX, scaleY);

                // Calculate offsets (bars)
                const offsetX = (width - (VIEWBOX_WIDTH * fitScale)) / 2;
                const offsetY = (height - (VIEWBOX_HEIGHT * fitScale)) / 2;

                setViewState(prev => {
                    // Driver Position in Screen Pixels (at Zoom 1)
                    // Visual position = Offset + (SVG_Coord * FitScale)
                    const visualDriverX = offsetX + (driver.x * fitScale);
                    const visualDriverY = offsetY + (driver.y * fitScale);

                    // We want visualDriverX to be at Center (width/2)
                    // Center = Translate + (VisualPos * ZoomScale)
                    // Translate = Center - (VisualPos * ZoomScale)

                    // Account for Leaderboard Overlay (w-64 = 256px) on Desktop (md: 768px)
                    // We want to center in the *visible* area.
                    // If desktop, visible width is (width - 256). Center is (width - 256) / 2.
                    const leaderboardOffset = window.innerWidth >= 768 ? 256 : 0;
                    const centerX = (width - leaderboardOffset) / 2;
                    const centerY = height / 2;

                    const newX = centerX - (visualDriverX * prev.scale);
                    const newY = centerY - (visualDriverY * prev.scale);

                    return {
                        ...prev,
                        x: newX,
                        y: newY
                    };
                });
            }
        }
    }, [isFollowing, currentTime, selectedDriver, currentFrameDrivers, data, leaderboardOrder]); // currentTime to trigger updates, selectedDriver/leaderboardOrder for target change

    // Helper: Calculate a sorting score (Lap takes precedence, then Visual Path Index)
    const getDriverScore = (d: any) => {
        if (!d) return -1;
        // visual sorting: Lap * totalPoints + trackIndex
        // data.circuit_points might not be available in closure if not passed, but we can assume nice range.
        // Using 1,000,000 as multiplier is safe as points < 1M.
        return (d.lap * 1000000) + (d.track_index || 0);
    };

    // Sort function for "Hard Sort" (Absolute distance)
    const getSortedOrder = (currentDrivers: Record<string, any>) => {
        return Object.entries(currentDrivers)
            .sort(([, a], [, b]) => {
                // START FIX: Grid Position for < 200m
                if (a.dist < 200 && b.dist < 200) {
                    const gA = data?.driver_grid_positions?.[a.code] ?? 99;
                    const gB = data?.driver_grid_positions?.[b.code] ?? 99;
                    return gA - gB;
                }
                return getDriverScore(b) - getDriverScore(a);
            })
            .map(([code]) => code);
    };

    // --- Leaderboard Logic with Hysteresis ---
    useEffect(() => {
        if (!data) return;

        // If not playing (Seeking/Paused) or first load, do a Hard Sort
        if (!isPlaying || leaderboardOrder.length === 0) {
            const newOrder = getSortedOrder(currentFrameDrivers);
            if (JSON.stringify(newOrder) !== JSON.stringify(leaderboardOrder)) {
                setLeaderboardOrder(newOrder);
            }
            return;
        }

        // --- HYSTERESIS SORT ---
        // While playing, we only swap if overtake is clearer (> 0.5m equivalent score)
        const OVERTAKE_THRESHOLD = 0.5; // meters

        let newOrder = [...leaderboardOrder];
        let swapped = false;

        // Bubble sort pass
        for (let i = 0; i < newOrder.length - 1; i++) {
            const driverA = newOrder[i];     // Currently Ahead
            const driverB = newOrder[i + 1];   // Currently Behind

            const dA = currentFrameDrivers[driverA];
            const dB = currentFrameDrivers[driverB];

            if (!dA || !dB) continue;

            // 1. Grid Logic (Start only)
            if (dA.dist < 200 && dB.dist < 200) {
                const gA = data?.driver_grid_positions?.[driverA] ?? 99;
                const gB = data?.driver_grid_positions?.[driverB] ?? 99;
                if (gB < gA) { // B should be ahead based on grid
                    newOrder[i] = driverB;
                    newOrder[i + 1] = driverA;
                    swapped = true;
                }
                continue;
            }

            // 2. Race Logic
            // Swap if B's Score > A's Score + Threshold
            const scoreA = getDriverScore(dA);
            const scoreB = getDriverScore(dB);

            if (scoreB > scoreA + OVERTAKE_THRESHOLD) {
                newOrder[i] = driverB;
                newOrder[i + 1] = driverA;
                swapped = true;
            }
        }

        if (swapped) {
            setLeaderboardOrder(newOrder);
        }

    }, [currentFrameDrivers, isPlaying, data]);

    // --- Session Logic (Race vs Qualy) ---
    const isRace = useMemo(() => {
        return session === 'Race' || session === 'R';
    }, [session]);

    // --- Qualifying Countdown Timer ---
    const sessionTimeRemaining = useMemo(() => {
        if (!data || isRace) return null;

        // 1. Determine Nominal Duration
        let duration = 0;
        const s = session.toUpperCase();
        if (s === 'Q1') duration = 18 * 60;
        else if (s === 'Q2') duration = 15 * 60;
        else if (s === 'Q3') duration = 12 * 60;
        else if (s === 'SQ1') duration = 12 * 60;
        else if (s === 'SQ2') duration = 10 * 60;
        else if (s === 'SQ3') duration = 8 * 60;
        else return null; // Practice or Unknown

        // 2. Adjust for Red Flags
        // We need to calculate how much time was LOST due to red flags UP TO currentTime.
        let lostTime = 0;
        let isRedFlagActive = false;

        // Ensure intervals are sorted
        /* Track Status Codes via FastF1: 
           '1': Green, '2': Yellow, '3': SC, '4': VSC, '5': Red, '6': Bat, '7': Null 
           In API response, we get objects with { status, start_time, end_time }
        */
        const statuses = data.track_statuses || [];

        for (const status of statuses) {
            if (status.status === '5' || status.status === 'Red') {
                const sStart = status.start_time;
                const sEnd = status.end_time || 999999;

                // Fix: Ignore Red Flags that happened entirely before the replay start (negative time)
                // And clamp partially overlapping ones to 0.
                if (sEnd <= 0) continue;

                const clampedStart = Math.max(0, sStart);
                const clampedEnd = Math.max(0, sEnd);

                // If red flag hasn't started yet relative to replay time, ignore
                if (clampedStart > currentTime) continue;

                if (currentTime >= clampedEnd) {
                    // This red flag is fully in the past (within our timeline).
                    lostTime += (clampedEnd - clampedStart);
                } else {
                    // We are currently INSIDE this red flag
                    lostTime += (currentTime - clampedStart);
                    isRedFlagActive = true;
                }
            }
        }

        const effectiveElapsed = currentTime - lostTime;
        const remaining = Math.max(0, duration - effectiveElapsed);

        return {
            remaining,
            isRed: isRedFlagActive,
            formatted: remaining === 0 ? '00:00' :
                `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(Math.floor(remaining) % 60).toString().padStart(2, '0')}`
        };
    }, [isRace, session, data, currentTime]);

    // --- Timing Standings (for Qualy/Practice) ---
    const timingStandings = useMemo(() => {
        if (isRace || !data?.completed_laps) return null;

        // 1. Filter laps completed so far
        const lapsSoFar = data.completed_laps.filter(l => l.timestamp <= currentTime);

        // 2. Find Best Lap per Driver
        const bestLaps: Record<string, typeof data.completed_laps[0]> = {};
        for (const lap of lapsSoFar) {
            if (!bestLaps[lap.driver] || lap.seconds < bestLaps[lap.driver].seconds) {
                bestLaps[lap.driver] = lap;
            }
        }

        // 3. Sort Drivers
        // Get all drivers from data.drivers to ensure we show everyone even if no lap
        const allDrivers = Object.keys(data.drivers || {});

        // Sort: Drivers with time < Drivers without time
        // Then by time ASC
        const sorted = allDrivers.sort((a, b) => {
            const lapA = bestLaps[a];
            const lapB = bestLaps[b];

            if (lapA && lapB) return lapA.seconds - lapB.seconds;
            if (lapA) return -1; // A has time, comes first
            if (lapB) return 1;  // B has time, comes first
            return a.localeCompare(b); // Alphabetical tie-break
        });

        return { sorted, bestLaps };

    }, [data, currentTime, isRace]);

    // --- Leaderboard Calculation ---
    const leaderboard = useMemo(() => {
        if (!data) return [];
        const drivers = currentFrameDrivers;

        const items = Object.entries(drivers).map(([code, d]) => ({
            code,
            ...d,
            pos: 0, // calc below
            grid: data.driver_grid_positions?.[code] || 0,
            color: data.driver_colors[code] || 'white'
        }));

        if (isRace) {
            // --- RACE MODE: Sort by Track Position ---
            // Sort by Lap (desc) then specific RefDist/Dist (desc)
            // Use leaderboardOrder from hysteresis for race mode
            if (!leaderboardOrder.length) return []; // Should not happen if data is present

            const raceItems = leaderboardOrder.map((code, index) => {
                const d = currentFrameDrivers[code];
                if (!d) return null;
                return {
                    pos: index + 1,
                    code,
                    ...d,
                    grid: data.driver_grid_positions?.[code] || 0,
                    color: data.driver_colors[code] || '#fff',
                    tyre: d.tyre
                };
            }).filter(d => d !== null);
            return raceItems;

        } else {
            // --- QUALY/PRACTICE MODE: Sort by Timing ---
            if (timingStandings) {
                const { sorted, bestLaps } = timingStandings;
                // Re-order items array to match 'sorted' list
                // Create lookup for efficiency
                const driverMap = new Map(items.map(i => [i.code, i]));

                // Clear items and rebuild from sorted list
                const newItems: typeof items = [];
                sorted.forEach(code => {
                    const d = driverMap.get(code);
                    if (d) {
                        // Attach timing info for render
                        (d as any).bestLap = bestLaps[code];
                        newItems.push(d);
                    }
                });

                return newItems.map((d, i) => ({ ...d, pos: i + 1 }));
            }
        }

        return []; // Fallback if no data or timingStandings not ready
    }, [currentFrameDrivers, data, isRace, timingStandings, leaderboardOrder]);

    // --- OpenF1 Driver Details (Headshots) ---
    const { data: openF1Drivers } = useQuery<OpenF1Driver[]>({
        queryKey: ['openf1', 'drivers', 'latest'],
        queryFn: () => fetchAllOpenF1Drivers('latest'),
        staleTime: 1000 * 60 * 60 * 24, // 24h
    });

    const driverHeadshots = useMemo(() => {
        const map: Record<string, string> = {};
        if (openF1Drivers) {
            for (const d of openF1Drivers) {
                if (d.name_acronym) map[d.name_acronym] = d.headshot_url;
            }
        }
        return map;
    }, [openF1Drivers]);

    const driverNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (openF1Drivers) {
            for (const d of openF1Drivers) {
                if (d.name_acronym) map[d.name_acronym] = d.full_name;
            }
        }
        return map;
    }, [openF1Drivers]);

    // Pre-calculate Lap Start Times for all drivers
    const driverLapStartTimes = useMemo(() => {
        if (!data) return {};
        const map: Record<string, Record<number, number>> = {};

        for (const [code, d] of Object.entries(data.drivers)) {
            map[code] = {};
            let currentLap = -1;

            // Iterate through the lap array
            // d.lap is array of lap numbers corresponding to data.time
            if (d.lap && data.time) {
                for (let i = 0; i < d.lap.length; i++) {
                    const lap = d.lap[i];
                    if (lap !== currentLap) {
                        // Lap changed (or started)
                        // Only record the *first* time we see a new lap number
                        if (map[code][lap] === undefined) {
                            map[code][lap] = data.time[i];
                        }
                        currentLap = lap;
                    }
                }
            }
        }
        return map;
    }, [data]);

    // Calculate Track Status Color
    const trackColor = useMemo(() => {
        if (!data?.race_control_messages) return '#1f2937';

        // Iterate backwards from current time to find last status update
        for (let i = data.race_control_messages.length - 1; i >= 0; i--) {
            const msg = data.race_control_messages[i];
            if (msg.time > currentTime) continue;

            const text = (msg.message + " " + (msg.flag || "")).toUpperCase();

            // Status Changes
            if (text.includes("RED FLAG") || text.includes("SUSPENDED")) return "#ef4444"; // Red
            if (text.includes("GREEN") || text.includes("CLEAR") || text.includes("RESUMED")) return "#1f2937"; // Back to Normal

            // Yellow / SC / VSC
            // Exclude "INFRINGEMENT", "PENALTY", "INCIDENT" to avoid false positives from race control NOTIFICATIONS
            if (
                (text.includes("YELLOW") || text.includes("SAFETY CAR") || text.includes("VIRTUAL") || text.includes("SC")) &&
                !text.includes("INFRINGEMENT") &&
                !text.includes("PENALTY") &&
                !text.includes("INVESTIGATION")
            ) {
                return "#eab308"; // Yellow
            }
        }

        return '#1f2937'; // Default
    }, [currentTime, data]);


    // --- Helper for Time Display ---
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- DNF / OUT Visual State Logic ---
    const driverOutTimes = useRef<Record<string, number>>({});

    const driverVisuals = useMemo(() => {
        if (!data || leaderboardOrder.length === 0) return { outStatus: {}, visibility: {} };

        const outStatus: Record<string, boolean> = {};

        // Determine "OUT" status (Stopped + Bottom of Active Pack)
        // Check from bottom (last place) up.
        let allBelowStopped = true;
        // leaderboard is sorted by position 1..N
        // We iterate N..1
        for (let i = leaderboardOrder.length - 1; i >= 0; i--) {
            const code = leaderboardOrder[i];
            const isStopped = data.driver_end_times?.[code] && currentTime > (data.driver_end_times[code] + 1);

            if (isStopped && allBelowStopped) {
                outStatus[code] = true;
            } else {
                outStatus[code] = false;
                if (!isStopped) allBelowStopped = false;
            }
        }

        const visibility: Record<string, 'visible' | 'out-dimmed' | 'hidden'> = {};
        const now = currentTime;

        // Determine Visibility based on 5s delay
        leaderboardOrder.forEach(code => {
            const isOut = outStatus[code];

            if (isOut) {
                if (driverOutTimes.current[code] === undefined) {
                    driverOutTimes.current[code] = now;
                }
                // Check 5s duration (allow 5s of "ghosting" before hiding)
                if (now > driverOutTimes.current[code] + 5) {
                    visibility[code] = 'hidden';
                } else {
                    visibility[code] = 'out-dimmed';
                }
            } else {
                if (driverOutTimes.current[code] !== undefined) {
                    delete driverOutTimes.current[code]; // Reset if back in race (rewind)
                }
                visibility[code] = 'visible';
            }
        });

        // Ensure all currentFrameDrivers have a status (default visible)
        // (Wait, leaderboardOrder contains all drivers, so we are good)
        return { outStatus, visibility };
    }, [leaderboardOrder, currentTime, data]);

    if (isLoading) {
        return <ReplayLoader year={year} event={event} session={session} />;
    }
    if (error) return <div className="p-12 text-center text-red-500">Error loading replay data.</div>;
    if (!data) return null;

    return (
        <div ref={rootRef} className={`flex flex-col bg-black text-white overflow-hidden ${isFullscreen ? 'h-full' : 'w-full aspect-[4/3]'} ${className}`}>

            {/* Main Content Area */}
            <div className="flex flex-1 relative overflow-hidden">

                {/* 1. Track Map Layer */}
                <div
                    ref={containerRef}
                    className="absolute inset-0 overflow-hidden bg-[#0d0d0d] cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Branding Logo */}
                    {isFullscreen && (
                        <div className="absolute top-6 left-6 flex items-center gap-2 z-50 pointer-events-none select-none">
                            <Gauge className="text-red-500" size={28} />
                            <span className="text-xl font-bold tracking-tighter">Fastlytics</span>
                        </div>
                    )}

                    <div
                        className="w-full h-full origin-top-left will-change-transform"
                        style={{
                            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
                        }}
                    >
                        <svg viewBox="0 0 1000 500" className="w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
                            {/* Background Path (Circuit) */}
                            <path
                                d={data.circuit_layout}
                                fill="none"
                                stroke={trackColor}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-colors duration-500 ease-in-out"
                            />
                            <path
                                d={data.circuit_layout}
                                fill="none"
                                stroke="#374151" // Lighter inner
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="4 4"
                                className="opacity-30"
                            />

                            {/* Cars Layer */}
                            {Object.entries(currentFrameDrivers).map(([code, car]) => {
                                // Check Visibility
                                if (driverVisuals.visibility[code] === 'hidden') return null;

                                // car.x/y are already normalized to the SVG viewbox by backend
                                const color = data.driver_colors[code] || 'white';
                                const isSelected = selectedDriver === code;

                                // Dim if OUT but not hidden yet
                                const isDimmed = driverVisuals.visibility[code] === 'out-dimmed';
                                const opacityClass = isDimmed ? 'opacity-50 grayscale' : '';

                                return (
                                    <g key={code}
                                        transform={`translate(${car.x}, ${car.y})`}
                                        className={`transition-transform duration-75 ease-linear cursor-pointer pointer-events-auto ${opacityClass}`}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            if (!isDragging) {
                                                e.stopPropagation();
                                                const newSelection = code === selectedDriver ? null : code;
                                                setSelectedDriver(newSelection);
                                                setIsFollowing(true); // Re-enable follow on selection
                                            }
                                        }}
                                    >
                                        {/* Selection Highlight */}
                                        {isSelected && (
                                            <circle r={12 / viewState.scale} fill="none" stroke={color} strokeWidth={2 / viewState.scale} className="animate-ping opacity-75" />
                                        )}

                                        {/* Car Marker */}
                                        <circle r={isSelected ? 8 : 5} fill={color} stroke="black" strokeWidth={1 / viewState.scale} />

                                        {/* Label */}
                                        {isSelected && (
                                            <text y={-15} textAnchor="middle" fill={color} fontSize={12} fontWeight="bold" className="drop-shadow-md select-none" style={{ fontSize: `${12 / Math.sqrt(viewState.scale)}px` }}>
                                                {code}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                </div>

                {/* Title Header (Top Center) */}
                {isFullscreen && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-40 pointer-events-none select-none text-center">
                        <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">
                            {event} "{session}"
                        </h1>
                    </div>
                )}

                {/* 2. Messages Overlay (Top Center) */}
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
                    {data.race_control_messages
                        .filter(m => {
                            const id = `${m.time}-${m.message}`;
                            return m.time <= currentTime && m.time > currentTime - 5 && !dismissedMessages.has(id);
                        }) // Show last 5s & not dismissed
                        .slice(-3) // Show max 3
                        .reverse() // Newest top
                        .map((msg, i) => {
                            const id = `${msg.time}-${msg.message}`;
                            const config = getMessageConfig(msg);
                            const Icon = config.icon;

                            return (
                                <div key={id} className={`
                                    ${config.bg} ${config.border} ${config.color}
                                    border-l-4 p-3 rounded-r shadow-lg max-w-xl w-full
                                    animate-in fade-in slide-in-from-top-4 duration-300
                                    pointer-events-auto flex items-center gap-4
                                `}>
                                    <div className="shrink-0 p-2 bg-black/20 rounded-full">
                                        <Icon size={24} fill={config.fill ? "currentColor" : "none"} />
                                    </div>

                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-bold text-sm tracking-wider uppercase opacity-90">
                                                {msg.flag || config.type}
                                            </span>
                                            <span className="text-[10px] font-mono opacity-60">
                                                {formatTime(msg.time)}
                                            </span>
                                        </div>
                                        <span className="text-white font-medium text-sm leading-tight break-words">
                                            {msg.message}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setDismissedMessages(prev => new Set(prev).add(id))}
                                        className="text-white/50 hover:text-white transition-colors p-1 shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })
                    }
                </div>

                {/* 3. Leaderboard Sidebar (Right) */}
                <div className="absolute top-0 right-0 max-h-full h-auto w-64 bg-black/50 backdrop-blur border-l border-b border-gray-800 rounded-bl-lg overflow-y-auto hidden md:block z-10">
                    <div className="p-3 border-b border-gray-800 font-bold text-sm tracking-widest uppercase flex justify-between items-center text-gray-200">
                        <span>{isRace ? 'Leaderboard' : 'Classification'}</span>
                        {isRace ? (
                            <span className="text-white">LAP {leaderboard[0]?.lap || 0} <span className="text-gray-500">/ {totalLaps}</span></span>
                        ) : sessionTimeRemaining ? (
                            <span className={`tabular-nums tracking-tight ${sessionTimeRemaining.isRed ? 'text-red-500 font-bold animate-pulse' : 'text-white'}`}>
                                TIME {sessionTimeRemaining.formatted}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex flex-col">
                        {leaderboard.map((driver, index) => {
                            const isOut = driverVisuals.outStatus?.[driver.code];

                            // Interval Calculation
                            let intervalText = 'LEADER';
                            let isPitting = false;

                            // Check Pit Status
                            if (data.pit_intervals?.[driver.code]) {
                                isPitting = data.pit_intervals[driver.code].some(interval =>
                                    currentTime >= interval.start && currentTime <= interval.end
                                );
                            }

                            if (isOut) {
                                intervalText = 'OUT';
                            } else if (isPitting) {
                                intervalText = 'PIT';
                            } else {
                                if (isRace) {
                                    // --- RACE INTERVALS ---
                                    if (index > 0) {
                                        const leader = leaderboard[index - 1];
                                        const circuitLength = data?.circuit_distances?.[data.circuit_distances.length - 1] || 5000;
                                        const distA = (leader.lap * circuitLength) + (leader.ref_dist || 0);
                                        const distB = (driver.lap * circuitLength) + (driver.ref_dist || 0);
                                        const deltaMeters = Math.max(0, distA - distB);
                                        const speedMs = Math.max(10, (driver.speed || 0) / 3.6);
                                        intervalText = `+${(deltaMeters / speedMs).toFixed(1)}s`;
                                    }
                                } else {
                                    // --- QUALY INTERVALS (Gap to P1) ---
                                    const bestLap = (driver as any).bestLap;
                                    const p1Best = (leaderboard[0] as any).bestLap;

                                    if (index === 0) {
                                        intervalText = bestLap?.time_str || 'NO TIME';
                                    } else {
                                        if (bestLap && p1Best) {
                                            const diff = bestLap.seconds - p1Best.seconds;
                                            intervalText = `+${diff.toFixed(3)}s`;
                                        } else {
                                            intervalText = 'NO TIME';
                                        }
                                    }
                                }
                            }

                            return (
                                <div
                                    key={driver.code}
                                    onClick={() => {
                                        setSelectedDriver(driver.code === selectedDriver ? null : driver.code);
                                        setIsFollowing(true); // Enable follow
                                    }}
                                    className={`flex items-center gap-2 py-0.5 px-2 border-b border-gray-800/50 cursor-pointer hover:bg-white/5 transition-colors ${selectedDriver === driver.code ? 'bg-white/10' : ''} ${isOut ? 'opacity-40 grayscale' : ''}`}
                                >
                                    <span className="w-4 text-center text-gray-500 font-mono text-[10px]">{driver.pos}</span>

                                    {/* Driver Image with Fallback */}
                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-900 rounded-full overflow-hidden border border-gray-700 shrink-0">
                                        <img
                                            src={driverHeadshots[driver.code] || DRIVER_IMAGE_MAP[driver.code] || '/placeholder.svg'}
                                            alt={driver.code}
                                            className="w-full h-full object-cover object-top transform scale-110"
                                            onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                const localSrc = DRIVER_IMAGE_MAP[driver.code];
                                                if (localSrc && !img.src.includes(localSrc)) {
                                                    img.src = localSrc;
                                                } else {
                                                    img.src = '/placeholder.svg';
                                                    img.onerror = null;
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="w-1 h-5 mx-1" style={{ backgroundColor: driver.color }}></div>
                                    <span className="font-bold text-xs min-w-[3ch]">{driver.code}</span>

                                    {/* Tyre Icon */}
                                    <div className="w-5 flex justify-center ml-auto">
                                        <img
                                            src={`/tyres/${driver.tyre === 0 ? 'soft' :
                                                driver.tyre === 1 ? 'medium' :
                                                    driver.tyre === 2 ? 'hard' :
                                                        driver.tyre === 3 ? 'intermediate' :
                                                            driver.tyre === 4 ? 'wet' : 'soft'
                                                }.png`}
                                            alt="Tyre"
                                            className="h-4 w-4 object-contain"
                                        />
                                    </div>

                                    {/* Interval */}
                                    <span className={`text-[10px] font-mono w-10 text-right ${intervalText === 'PIT' ? 'text-orange-500 font-bold animate-pulse' :
                                        intervalText === 'OUT' ? 'text-gray-500 font-bold' :
                                            'text-gray-400'
                                        }`}>
                                        {intervalText}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Selected Driver Telemetry Overlay */}
                {selectedDriver && (
                    <div className="absolute top-20 left-4 w-52 bg-black/90 border-l-4 p-3 rounded backdrop-blur z-20 shadow-2xl"
                        style={{ borderColor: data.driver_colors[selectedDriver] }}
                    >
                        <div className="flex items-center gap-3 mb-2 border-b border-gray-800 pb-2">
                            <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700 shrink-0">
                                <img
                                    src={driverHeadshots[selectedDriver] || DRIVER_IMAGE_MAP[selectedDriver] || '/placeholder.svg'}
                                    alt={selectedDriver}
                                    className="w-full h-full object-cover object-top transform scale-110"
                                    onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        const localSrc = DRIVER_IMAGE_MAP[selectedDriver];
                                        if (localSrc && !img.src.includes(localSrc)) {
                                            img.src = localSrc;
                                        } else {
                                            img.src = '/placeholder.svg';
                                            img.onerror = null;
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <div className="text-base font-bold leading-tight">{driverNameMap[selectedDriver] || selectedDriver}</div>
                            </div>
                        </div>

                        {(() => {
                            const driverData = currentFrameDrivers[selectedDriver];
                            if (!driverData) return null;

                            // Calculate Lap Stats
                            const driverLaps = data.completed_laps?.filter(l => l.driver === selectedDriver && l.timestamp <= currentTime) || [];

                            const fastestLap = driverLaps.length > 0
                                ? driverLaps.reduce((min, l) => l.seconds < min.seconds ? l : min, driverLaps[0])
                                : null;

                            const previousLap = driverLaps.length > 0 ? driverLaps[driverLaps.length - 1] : null;

                            const currentLapNum = driverData.lap;
                            const lapStartTime = driverLapStartTimes[selectedDriver]?.[currentLapNum] ?? 0;
                            const liveLapTime = Math.max(0, currentTime - lapStartTime);

                            const formatLapTime = (sec: number) => {
                                const m = Math.floor(sec / 60);
                                const s = (sec % 60).toFixed(3);
                                return `${m}:${s.padStart(6, '0')}`;
                            };

                            return (
                                <div className="space-y-1 font-mono text-xs">
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-[10px]">Current</span>
                                        <span className="text-yellow-400 text-base font-bold">{formatLapTime(liveLapTime)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-[10px]">Last</span>
                                        <span className="text-white text-base">{previousLap ? previousLap.time_str : '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-[10px]">Best</span>
                                        <span className="text-purple-400 text-base font-bold">{fastestLap ? fastestLap.time_str : '-'}</span>
                                    </div>

                                    {/* Throttle & Brake Bars */}
                                    <div className="flex gap-1 h-16 my-2">
                                        <div className="flex-1 bg-gray-800 rounded relative overflow-hidden flex flex-col justify-end">
                                            <div
                                                className="w-full bg-green-500 transition-all duration-75 ease-linear"
                                                style={{ height: `${driverData.throttle || 0}%` }}
                                            />
                                            <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold mix-blend-difference text-white">THR</span>
                                        </div>
                                        <div className="flex-1 bg-gray-800 rounded relative overflow-hidden flex flex-col justify-end">
                                            <div
                                                className="w-full bg-red-500 transition-all duration-75 ease-linear"
                                                style={{ height: `${driverData.brake > 1 ? driverData.brake : (driverData.brake * 100)}%` }}
                                            />
                                            <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold mix-blend-difference text-white">BRK</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-[10px]">RPM</span>
                                        <span className="text-white text-base font-bold">{Math.round(driverData.rpm || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-[10px]">Speed</span>
                                        <span className="text-purple-400 text-base font-bold">{Math.round(driverData.speed)} <span className="text-[10px] text-gray-500">kph</span></span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 w-1/2 uppercase text-[10px]">Gear</span>
                                        <span className="text-yellow-400 text-base font-bold">{driverData.gear}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 w-1/2 uppercase text-[10px]">DRS</span>
                                        <span className={`${driverData.drs >= 10 ? 'text-green-500 font-bold' : 'text-gray-600'} text-base`}>{driverData.drs >= 10 ? 'OPEN' : 'CLOSED'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-[10px]">Lap</span>
                                        <span className="text-white text-base">{driverData.lap}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* 5. Playback Controls (Auto-Hide Bottom Overlay) */}
            <div className={`absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center z-40 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100 pointer-events-none hover:pointer-events-auto' : 'opacity-100 pointer-events-auto'}`}>
                <div className="w-full bg-gray-900/90 backdrop-blur border-t border-gray-800 p-4 pointer-events-auto">
                    <div className="max-w-7xl mx-auto flex flex-col gap-4">
                        {/* Slider */}
                        <input
                            type="range"
                            min={0}
                            max={totalDuration}
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => {
                                setCurrentTime(parseFloat(e.target.value));
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />

                        <div className="flex items-center justify-between">
                            {/* Left Controls */}
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                </button>

                                <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
                                    <Clock size={16} className="text-gray-400" />
                                    <span className="font-mono text-sm">{formatTime(currentTime)}</span>
                                </div>
                            </div>

                            {/* Center Info */}
                            <div className="hidden md:block text-center">
                                <h2 className="font-bold text-sm tracking-widest text-gray-400">{event.toUpperCase()} - {session}</h2>
                            </div>

                            {/* Right Controls */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPlaybackSpeed(s => Math.max(0.25, s / 2))} className="p-1 hover:text-white text-gray-400 disabled:opacity-50" disabled={playbackSpeed <= 0.25}>
                                        <Rewind size={20} />
                                    </button>
                                    <span className="font-mono text-xs w-8 text-center">{playbackSpeed}x</span>
                                    <button onClick={() => setPlaybackSpeed(s => Math.min(8, s * 2))} className="p-1 hover:text-white text-gray-400 disabled:opacity-50" disabled={playbackSpeed >= 8}>
                                        <FastForward size={20} />
                                    </button>
                                </div>

                                <div className="w-px h-6 bg-gray-700 mx-2"></div>

                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionReplay;
