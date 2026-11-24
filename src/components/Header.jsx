import React, { useState, useEffect } from 'react';
import { GlyphBarChart, GlyphHelp } from './Glyphs';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function Header({
  dayNumber,
  isPractice,
  guessesCount = 0,
  maxGuesses = 6,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onOpenStats,
  onOpenHelp,
  onReturnHub
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

  const handleAction = (fn) => {
    sound.playTap();
    vibrateTap();
    if (fn) fn();
  };

  return (
    <div className="w-full flex flex-col select-none pt-[env(safe-area-inset-top,10px)] bg-[var(--bg-page)] z-20">
      {/* Top Nav Row */}
      <div className="w-full px-4 h-14 flex items-center justify-between">
        {/* Left: Wordmark & Mode Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction(onReturnHub)}
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)] lowercase hover:opacity-80 transition-opacity"
            title="Return to Hub"
          >
            aether
          </button>

          <span className="px-2.5 py-1 rounded-full surface-pill text-[11px] font-medium text-[var(--text-secondary)] tabular">
            {isPractice ? 'practice' : `daily · ${countdown}`}
          </span>
        </div>

        {/* Right: Sound, Theme, Stats, Help (24px icons, 44px touch targets) */}
        <div className="flex items-center gap-0.5">
          {/* Sound Toggle */}
          <button
            onClick={() => handleAction(onToggleSound)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 opacity-50" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => handleAction(onToggleTheme)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Stats Button */}
          <button
            onClick={() => handleAction(onOpenStats)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
            aria-label="Statistics"
          >
            <GlyphBarChart className="w-5 h-5" />
          </button>

          {/* Help Button */}
          <button
            onClick={() => handleAction(onOpenHelp)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
            aria-label="How to play"
          >
            <GlyphHelp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Thin 6-segment Progress Bar directly under header */}
      <div className="w-full px-4 pt-1 pb-2 flex gap-1.5">
        {Array.from({ length: maxGuesses }).map((_, i) => {
          const isFilled = i < guessesCount;
          return (
            <div
              key={i}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                isFilled ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-subtle)]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
