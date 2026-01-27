
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ReplayLoaderProps {
    year: number;
    event: string;
    session: string;
}

interface ProgressData {
    message: string;
    percent: number;
}

const ReplayLoader: React.FC<ReplayLoaderProps> = ({ year, event, session }) => {
    const [progress, setProgress] = useState<ProgressData>({ message: 'Initializing...', percent: 0 });
    const [dots, setDots] = useState('');

    // Animated dots for "Initializing"
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Poll Backend
    useEffect(() => {
        let isMounted = true;
        const poll = async () => {
            try {
                // Construct URL matching the backend logic
                const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/replay/session/progress?year=${year}&event=${event}&session=${session}`;

                const res = await fetch(url, {
                    headers: {
                        'X-API-Key': import.meta.env.VITE_FASTLYTICS_API_KEY || ''
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data) {
                        setProgress(data);
                    }
                }
            } catch (e) {
                console.warn("Progress poll failed:", e);
            }
        };

        // Initial poll
        poll();

        // Interval poll
        const intervalId = setInterval(poll, 750); // Poll every 750ms

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [year, event, session]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-white/90 font-mono">
            {/* Loading Icon */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-8"
            >
                <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </motion.div>

            {/* Progress Bar Container */}
            <div className="w-64 md:w-96 h-2 bg-white/10 rounded-full overflow-hidden mb-4 border border-white/5">
                <motion.div
                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(5, progress.percent * 100)}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                />
            </div>

            {/* Status Text */}
            <div className="text-sm font-medium tracking-wide text-white/80 h-6">
                {progress.message ? progress.message : `Loading${dots}`}
            </div>

            {/* Percentage */}
            <div className="text-xs text-white/40 mt-1">
                {Math.round(progress.percent * 100)}%
            </div>
        </div>
    );
};

export { ReplayLoader };
export default ReplayLoader;
