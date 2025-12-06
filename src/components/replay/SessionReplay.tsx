import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionReplay, SessionReplayData } from '@/lib/api';
import { fetchAllOpenF1Drivers, OpenF1Driver } from '@/lib/openf1';
import ReplayLoader from './ReplayLoader';
import { Play, Pause, FastForward, Rewind, Clock, X, Maximize, Minimize, Gauge } from 'lucide-react';

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
    const totalDuration = useMemo(() => {
        if (!data?.time?.length) return 0;
        return data.time[data.time.length - 1];
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

                    const newX = (width / 2) - (visualDriverX * prev.scale);
                    const newY = (height / 2) - (visualDriverY * prev.scale);

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

    // Build final leaderboard array from order
    const leaderboard = useMemo(() => {
        if (!leaderboardOrder.length || !data) return [];
        return leaderboardOrder.map((code, index) => {
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
    }, [leaderboardOrder, currentFrameDrivers, data]);

    // --- OpenF1 Driver Details (Headshots) ---
    const { data: openF1Drivers } = useQuery<OpenF1Driver[]>({
        queryKey: ['openf1', 'drivers', 'latest'],
        queryFn: () => fetchAllOpenF1Drivers('latest'),
        staleTime: 1000 * 60 * 60 * 24, // 24h
        gcTime: 1000 * 60 * 60 * 24,
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

    // Calculate Track Status Color
    const trackColor = useMemo(() => {
        if (!data?.race_control_messages) return '#1f2937';

        // Iterate backwards from current time to find last status update
        for (let i = data.race_control_messages.length - 1; i >= 0; i--) {
            const msg = data.race_control_messages[i];
            if (msg.time > currentTime) continue;

            const text = (msg.message + " " + (msg.flag || "")).toUpperCase();

            if (text.includes("RED")) return "#ef4444"; // Red
            if (text.includes("GREEN") || text.includes("CLEAR") || text.includes("RESUMED")) return "#1f2937"; // Back to Normal
            if (text.includes("YELLOW") || text.includes("SAFETY CAR") || text.includes("VIRTUAL") || text.includes("SC")) return "#eab308"; // Yellow
        }

        return '#1f2937'; // Default
    }, [currentTime, data]);

    if (isLoading) {
        return <ReplayLoader year={year} event={event} session={session} />;
    }
    if (error) return <div className="p-12 text-center text-red-500">Error loading replay data.</div>;
    if (!data) return null;

    // --- Helper for Time Display ---
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div ref={rootRef} className={`flex flex-col h-full bg-black text-white overflow-hidden ${className}`}>

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
                                // car.x/y are already normalized to the SVG viewbox by backend
                                const color = data.driver_colors[code] || 'white';
                                const isSelected = selectedDriver === code;

                                return (
                                    <g key={code}
                                        transform={`translate(${car.x}, ${car.y})`}
                                        className="transition-transform duration-75 ease-linear cursor-pointer pointer-events-auto"
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
                            return m.time <= currentTime && m.time > currentTime - 30 && !dismissedMessages.has(id);
                        }) // Show last 30s & not dismissed
                        .slice(-3) // Show max 3
                        .reverse() // Newest top
                        .map((msg, i) => {
                            const id = `${msg.time}-${msg.message}`;
                            return (
                                <div key={id} className="bg-black/90 backdrop-blur border border-gray-700 p-2 pl-3 pr-2 rounded text-xs font-mono animate-in fade-in slide-in-from-top-2 pointer-events-auto flex items-start gap-3 shadow-lg max-w-md">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">[{formatTime(msg.time)}]</span>
                                            <span className={msg.flag?.includes('YELLOW') ? 'text-yellow-400 font-bold' : msg.flag?.includes('RED') ? 'text-red-500 font-bold' : 'text-white font-semibold'}>
                                                {msg.flag || 'INFO'}
                                            </span>
                                        </div>
                                        <span className="text-gray-300 leading-snug">
                                            {msg.message}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setDismissedMessages(prev => new Set(prev).add(id))}
                                        className="text-gray-500 hover:text-white transition-colors p-1 -mt-1 -mr-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })
                    }
                </div>

                {/* 3. Leaderboard Sidebar (Right) */}
                <div className="absolute top-0 right-0 max-h-full h-auto w-64 bg-black/50 backdrop-blur border-l border-b border-gray-800 rounded-bl-lg overflow-y-auto hidden md:block z-10">
                    <div className="p-3 border-b border-gray-800 font-bold text-sm tracking-widest uppercase">Leaderboard</div>
                    <div className="flex flex-col">
                        {leaderboard.map((driver, index) => {
                            // Interval Calculation
                            let intervalText = 'LEADER';
                            let isPitting = false;

                            // Check Pit Status
                            if (data.pit_intervals?.[driver.code]) {
                                isPitting = data.pit_intervals[driver.code].some(interval =>
                                    currentTime >= interval.start && currentTime <= interval.end
                                );
                            }

                            if (isPitting) {
                                intervalText = 'PIT';
                            } else if (index > 0) {
                                const leader = leaderboard[index - 1];
                                const circuitLength = data?.circuit_distances?.[data.circuit_distances.length - 1] || 5000;
                                const distA = (leader.lap * circuitLength) + (leader.ref_dist || 0);
                                const distB = (driver.lap * circuitLength) + (driver.ref_dist || 0);
                                const deltaMeters = Math.max(0, distA - distB);
                                const speedMs = Math.max(10, (driver.speed || 0) / 3.6);
                                intervalText = `+${(deltaMeters / speedMs).toFixed(1)}s`;
                            }

                            return (
                                <div
                                    key={driver.code}
                                    onClick={() => {
                                        setSelectedDriver(driver.code === selectedDriver ? null : driver.code);
                                        setIsFollowing(true); // Enable follow
                                    }}
                                    className={`flex items-center gap-2 py-0.5 px-2 border-b border-gray-800/50 cursor-pointer hover:bg-white/5 transition-colors ${selectedDriver === driver.code ? 'bg-white/10' : ''}`}
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
                                    <span className={`text-[10px] font-mono w-10 text-right ${intervalText === 'PIT' ? 'text-orange-500 font-bold animate-pulse' : 'text-gray-400'}`}>
                                        {intervalText}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Selected Driver Telemetry Overlay */}
                {selectedDriver && (
                    <div className="absolute top-20 left-4 w-64 bg-black/90 border-l-4 p-4 rounded backdrop-blur z-20 shadow-2xl"
                        style={{ borderColor: data.driver_colors[selectedDriver] }}
                    >
                        <div className="flex items-center gap-4 mb-4 border-b border-gray-800 pb-2">
                            <div className="w-16 h-16 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700 shrink-0">
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
                                <div className="text-3xl font-bold">{selectedDriver}</div>
                            </div>
                        </div>

                        {(() => {
                            const driverData = currentFrameDrivers[selectedDriver];
                            if (!driverData) return null;
                            return (
                                <div className="space-y-2 font-mono text-sm">
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-xs">RPM</span>
                                        <span className="text-white text-lg font-bold">{Math.round(driverData.rpm || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-xs">Speed</span>
                                        <span className="text-purple-400 text-lg font-bold">{Math.round(driverData.speed)} <span className="text-xs text-gray-500">kph</span></span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 w-1/2 uppercase text-xs">Gear</span>
                                        <span className="text-yellow-400 text-lg font-bold">{driverData.gear}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 w-1/2 uppercase text-xs">DRS</span>
                                        <span className={`${driverData.drs >= 10 ? 'text-green-500 font-bold' : 'text-gray-600'} text-lg`}>{driverData.drs >= 10 ? 'OPEN' : 'CLOSED'}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                                        <span className="text-gray-400 uppercase text-xs">Lap</span>
                                        <span className="text-white text-lg">{driverData.lap}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-800 pb-1 opacity-50">
                                        <span className="text-gray-500 uppercase text-[10px]">Dist</span>
                                        <span className="text-gray-500 text-[10px] font-mono">{Math.round(driverData.dist)}m</span>
                                    </div>
                                    <div className="flex justify-between items-center opacity-50">
                                        <span className="text-gray-500 uppercase text-[10px]">Score</span>
                                        <span className="text-gray-500 text-[10px] font-mono">{Math.round(getDriverScore(driverData))}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* 5. Playback Controls (Auto-Hide Bottom Overlay) */}
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center z-40 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none hover:pointer-events-auto">
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
