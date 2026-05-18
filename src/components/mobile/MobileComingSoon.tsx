import React, { useState, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { IPhoneFrame } from './IPhoneFrame';
import { screenshots } from './AppScreenshots';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { supabase } from '@/lib/supabase';

export function MobileComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('mobile_waitlist')
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === '23505') {
          setStatus('success');
        } else {
          throw error;
        }
      } else {
        setStatus('success');
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / screenshots.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIdx(Math.min(idx, screenshots.length - 1));
  };

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col overflow-y-auto selection:bg-[#ff2a1a]/20"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[#ff2a1a]/[0.03] blur-[100px] pointer-events-none" />

      {/* Logo */}
      <m.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-center pt-14 pb-8"
      >
        <FastlyticsLogo size={14} disableAnimation />
      </m.header>

      {/* Hero text */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="px-8 text-center mb-6"
      >
        <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.03em]">
          The mobile app is
          <br />
          coming soon
        </h1>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="h-[2px] bg-[#ff2a1a] mx-auto mt-4 mb-4 rounded-full"
        />
        <p className="text-[13px] text-white/30 max-w-[240px] mx-auto leading-relaxed">
          Telemetry, replay, strategy — everything you love, in your pocket.
        </p>
      </m.div>

      {/* Waitlist — stacked, tight */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="px-8 mb-12"
      >
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <m.div
              key="success"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff2a1a]" />
              <span className="text-[13px] text-white/60">You're on the waitlist</span>
            </m.div>
          ) : (
            <m.form
              key="form"
              onSubmit={handleSubmit}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2.5"
            >
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[46px] rounded-full bg-white/[0.05] pl-5 pr-[110px] text-[13px] text-white placeholder:text-white/15 focus:outline-none focus:bg-white/[0.07] transition-colors"
                />
                <m.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileTap={{ scale: 0.93 }}
                  className="absolute right-[4px] top-[4px] h-[38px] px-5 rounded-full bg-[#ff2a1a] text-[12px] font-semibold text-white disabled:opacity-40 transition-opacity"
                >
                  {status === 'loading' ? '...' : 'Join waitlist'}
                </m.button>
              </div>
              {status === 'error' && (
                <p className="text-[11px] text-white/30 text-center">{errorMsg}</p>
              )}
            </m.form>
          )}
        </AnimatePresence>
      </m.div>

      {/* Screenshot carousel */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="relative"
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {screenshots.map((slide, i) => {
            const Screen = slide.screen;
            return (
              <m.div
                key={slide.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="snap-center shrink-0 w-[255px] rounded-[20px] overflow-hidden"
                style={{ background: slide.gradient }}
              >
                <div className="px-5 pt-5 pb-2.5">
                  <p className="text-[14px] font-bold leading-[1.2] text-white whitespace-pre-line tracking-[-0.01em]">
                    {slide.caption}
                  </p>
                  <p className="text-[10px] text-white/25 mt-1.5 leading-snug">
                    {slide.subcaption}
                  </p>
                </div>
                <div className="px-6 pb-0 flex justify-center">
                  <div className="w-[155px] translate-y-[10%]">
                    <IPhoneFrame>
                      <Screen />
                    </IPhoneFrame>
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-5">
          {screenshots.map((s, i) => (
            <m.div
              key={s.id}
              animate={{
                width: i === activeIdx ? 18 : 4,
                backgroundColor: i === activeIdx ? '#ff2a1a' : 'rgba(255,255,255,0.06)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="h-[4px] rounded-full"
            />
          ))}
        </div>
      </m.div>

      {/* Footer */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col items-center gap-4 mt-auto pt-10 pb-10"
      >
        <p className="font-bold text-[10px] text-white/40">
          Open on desktop for the full experience
        </p>
      </m.div>
    </div>
  );
}
