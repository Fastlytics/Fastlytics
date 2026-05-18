import React from 'react';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

/**
 * Realistic iPhone 15 Pro frame (CSS-only).
 * Designed to sit inside app-store-style screenshot cards.
 */
export function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="relative" style={{ aspectRatio: '393/852' }}>
      {/* Outer shell */}
      <div className="absolute inset-0 rounded-[14%/6.5%] bg-gradient-to-b from-[#2C2C2E] to-[#1C1C1E] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.6)]">
        {/* Dynamic Island */}
        <div className="absolute top-[3.2%] left-1/2 -translate-x-1/2 z-20 w-[27%] h-[3.2%] bg-black rounded-full" />

        {/* Screen area */}
        <div className="absolute left-[4.8%] top-[2.2%] w-[90.4%] h-[95.6%] rounded-[11%/5%] overflow-hidden bg-black">
          {children}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-[1.5%] left-1/2 -translate-x-1/2 w-[35%] h-[0.5%] rounded-full bg-white/30" />
      </div>
    </div>
  );
}
