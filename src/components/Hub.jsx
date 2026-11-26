import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlyphArrowRight, GlyphCheck, GlyphBarChart, GlyphHelp } from './Glyphs';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function Hub({
  dayNumber,
  hasPlayedDaily,
  dailyCompleted,
  onPlayDaily,
  onPlayPractice,
  onPlaySliderDaily,
  onPlaySliderPractice,
  onOpenStats,
  onOpenHelp
}) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ));
      const diff = Math.max(0, tomorrowUTC - now);
      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTap = (callback) => {
    sound.playTap();
    vibrateTap();
    callback();
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col justify-between p-6 sm:p-10 select-none bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Top Bar on Hub */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-muted)] font-medium tabular">
          Daily #{dayNumber} · {countdown}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTap(onOpenHelp)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="How to play"
          >
            <GlyphHelp className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTap(onOpenStats)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Statistics"
          >
            <GlyphBarChart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Center */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="my-auto flex flex-col items-center text-center max-w-sm mx-auto"
      >
        <h1 className="text-6xl sm:text-7xl font-bold tracking-[-0.04em] text-[var(--text-primary)] lowercase mb-3">
          aether
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] font-normal leading-snug">
          Deduce the mystery city by reading the atmosphere.
        </p>
      </motion.div>

      {/* Tactile Mode Selectors */}
      <div className="w-full max-w-sm mx-auto flex flex-col space-y-3 pb-2">
        {/* Mode 1: Guess the City */}
        <div className="flex flex-col space-y-1.5">
          <button
            onClick={() => handleTap(onPlayDaily)}
            className="w-full h-14 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-base font-semibold flex items-center justify-between px-6 shadow-sm hover:bg-[var(--accent-hover)] transition-transform active:scale-[0.98] touch-target"
          >
            <span>
              {dailyCompleted ? 'View daily summary' : (hasPlayedDaily ? 'Resume mystery city' : 'Guess mystery city')}
            </span>
            {dailyCompleted ? (
              <GlyphCheck className="w-5 h-5 opacity-90" />
            ) : (
              <GlyphArrowRight className="w-5 h-5 opacity-90" />
            )}
          </button>
        </div>

        {/* Mode 2: Dial the Temperature (Dialed-Grade Slider) */}
        <div className="flex flex-col space-y-1.5">
          <button
            onClick={() => handleTap(onPlaySliderDaily)}
            className="w-full h-14 rounded-full surface-pill text-[var(--text-primary)] text-base font-semibold flex items-center justify-between px-6 hover:border-[var(--border-strong)] transition-transform active:scale-[0.98] touch-target"
          >
            <div className="flex items-center gap-2">
              <span>Dial the temperature</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] uppercase font-bold tracking-wider">
                5 rounds
              </span>
            </div>
            <GlyphArrowRight className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Practice Flight Links */}
        <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium text-[var(--text-muted)]">
          <button
            onClick={() => handleTap(onPlayPractice)}
            className="hover:text-[var(--text-primary)] transition-colors underline-offset-4 hover:underline"
          >
            Practice city flight
          </button>
          <span>·</span>
          <button
            onClick={() => handleTap(onPlaySliderPractice)}
            className="hover:text-[var(--text-primary)] transition-colors underline-offset-4 hover:underline"
          >
            Practice dial
          </button>
        </div>
      </div>
    </div>
  );
}
