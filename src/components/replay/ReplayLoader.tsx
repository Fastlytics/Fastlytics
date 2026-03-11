import React from 'react';

interface ReplayLoaderProps {
  message?: string;
  progress?: number; // 0-100
}

export function ReplayLoader({ message = 'Loading...', progress }: ReplayLoaderProps) {
  return (
    <div className="h-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-gray-800 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-red-600 rounded-full animate-spin" />
        </div>

        <div className="text-xs text-white font-sans mb-2">{message}</div>

        {progress != null && progress > 0 && (
          <div className="w-48 mx-auto">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="text-[10px] font-sans text-white/60 mt-1">{Math.round(progress)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
