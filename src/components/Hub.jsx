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

      {/* Big Tactile Mode Pill Buttons */}
      <div className="w-full max-w-sm mx-auto flex flex-col space-y-3 pb-4">
        {/* Play Daily Button */}
        <button
          onClick={() => handleTap(onPlayDaily)}
          className="w-full h-14 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-base font-semibold flex items-center justify-between px-6 shadow-sm hover:bg-[var(--accent-hover)] transition-transform active:scale-[0.98] touch-target"
        >
          <span>
            {dailyCompleted ? 'View daily summary' : (hasPlayedDaily ? 'Resume daily' : 'Play daily')}
          </span>
          {dailyCompleted ? (
            <GlyphCheck className="w-5 h-5 opacity-90" />
          ) : (
            <GlyphArrowRight className="w-5 h-5 opacity-90" />
          )}
        </button>

        {/* Practice Mode Button */}
        <button
          onClick={() => handleTap(onPlayPractice)}
          className="w-full h-14 rounded-full surface-pill text-[var(--text-primary)] text-base font-semibold flex items-center justify-between px-6 transition-transform active:scale-[0.98] touch-target"
        >
          <span>Practice flight</span>
          <GlyphArrowRight className="w-5 h-5 opacity-50" />
        </button>

        {/* Upcoming Extensible Modes */}
        <div className="pt-2 text-center text-xs text-[var(--text-muted)]">
          Coming soon: Temperature Slider · Higher or Lower
        </div>
      </div>
    </div>
  );
}
