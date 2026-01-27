import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyLoadComponentProps {
    children: React.ReactNode;
    threshold?: number;
    className?: string;
    height?: string | number;
}

const LazyLoadComponent: React.FC<LazyLoadComponentProps> = ({
    children,
    threshold = 0.1,
    className,
    height = '400px'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                root: null,
                rootMargin: '50px', // Load slightly before it comes into view
                threshold
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    return (
        <div ref={ref} className={cn("w-full transition-opacity duration-500", isVisible ? "opacity-100" : "opacity-0", className)} style={{ minHeight: isVisible ? 'auto' : height }}>
            {isVisible ? children : (
                <div className="flex items-center justify-center w-full h-full bg-black/20 animate-pulse rounded-lg border border-gray-800/50">
                    <div className="w-8 h-8 border-2 border-gray-700 border-t-red-500 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export { LazyLoadComponent };
export default LazyLoadComponent;
