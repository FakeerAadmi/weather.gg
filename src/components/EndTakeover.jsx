import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlyphClose, GlyphShare, GlyphCheck } from './Glyphs';
import { getWeatherMeta } from '../engine/weatherCodes';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

function getCardinalArrow(deg) {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const idx = Math.round(deg / 45) % 8;
  return arrows[idx];
}

export default function EndTakeover({
  isOpen,
  onClose,
  isWon,
  city,
  weather,
  guesses,
  dayNumber,
  isPractice,
  streak = 0,
  percentile,
  onPlayAgain
}) {
  const [copied, setCopied] = useState(false);
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
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen || !city || !weather) return null;

  const meta = getWeatherMeta(weather.current.weather_code);
  const tempC = Math.round(weather.current.temperature_2m);
  const tempF = Math.round(tempC * 9/5 + 32);

  const humanHeadline = isWon
    ? (guesses.length === 1 ? 'Splendid. Solved in 1.' : `Nice. Found it in ${guesses.length}.`)
    : 'Not quite. Here is where it was.';

  const handleShare = async () => {
    sound.playTap();
    vibrateTap();

    const title = isPractice ? 'aether (practice)' : `aether #${dayNumber}`;
    const score = isWon ? `${guesses.length}/6` : 'X/6';
    const lines = guesses.map((g, i) => {
      if (g.distanceKm === 0) return `${i + 1}. 0 km · 100% [Solved]`;
      const prox = Math.max(0, Math.min(99, Math.round(100 - (g.distanceKm / 20015) * 100)));
      const arrow = getCardinalArrow(g.bearing);
      return `${i + 1}. ${g.distanceKm.toLocaleString()} km ${arrow} (${prox}%)`;
    }).join('\n');

    const shareBody = `${title} ${score}\n\n${lines}\n\nhttps://fakeeraadmi.github.io/weather.gg/`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `aether #${dayNumber}`, text: shareBody });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 bg-[var(--bg-page)] text-[var(--text-primary)] select-none overflow-y-auto"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)] tracking-wider uppercase">
          {humanHeadline}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close summary"
        >
          <GlyphClose className="w-5 h-5" />
        </button>
      </div>

      {/* Main City Revelation */}
      <div className="my-auto py-8 flex flex-col">
        <h2 className="text-5xl sm:text-7xl font-bold tracking-[-0.03em] text-[var(--text-primary)] leading-none">
          {city.name}
        </h2>
        <div className="text-xl sm:text-2xl text-[var(--text-secondary)] font-normal mt-2">
          {city.country} · {city.continent}
        </div>

        {/* Real Conditions (Clean typography with hairlines, no boxes) */}
        <div className="mt-8 pt-6 hairline-t flex flex-col space-y-2">
          <div className="text-3xl font-semibold text-[var(--text-primary)] tabular">
            {tempC}°C <span className="text-xl font-normal text-[var(--text-muted)]">/ {tempF}°F</span>
          </div>
          <div className="text-base text-[var(--text-secondary)]">
            {meta.label} · {meta.feel}
          </div>
          <div className="text-xs text-[var(--text-muted)] tabular pt-1">
            {Math.round(weather.current.wind_speed_10m)} km/h wind · {weather.current.relative_humidity_2m || 50}% humidity · {Math.round(weather.current.surface_pressure || 1013)} hPa
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 pt-6 hairline-t grid grid-cols-3 gap-4 text-center tabular">
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {isWon ? guesses.length : 'X'}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">guesses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--accent)]">
              {streak}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {isWon ? '100%' : `${Math.round(100 - (guesses[guesses.length - 1]?.distanceKm || 0) / 200)}%`}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">accuracy</div>
          </div>
        </div>

        {/* Global Percentile Ranking */}
        {percentile !== undefined && percentile !== null && isWon && (
          <div className="mt-4 px-4 py-2.5 rounded-xl surface-pill text-xs font-semibold text-[var(--accent)] flex items-center justify-between tabular">
            <span>Global benchmark</span>
            <span>Top {Math.max(1, 100 - percentile)}% today (beat {percentile}% of solvers)</span>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-sm mx-auto flex flex-col space-y-3">
        <button
          onClick={handleShare}
          className="w-full h-14 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-base font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-transform active:scale-[0.98] shadow-sm touch-target"
        >
          <GlyphShare className="w-5 h-5" />
          <span>{copied ? 'Copied to clipboard' : 'Share bulletin'}</span>
        </button>

        {!isPractice ? (
          <div className="flex flex-col items-center space-y-2.5 pt-1">
            <div className="text-center text-xs text-[var(--text-muted)] tabular">
              Next daily mystery in {countdown}
            </div>
            <button
              onClick={onPlayAgain}
              className="w-full h-12 rounded-full surface-pill text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
            >
              Play practice flight
            </button>
          </div>
        ) : (
          <button
            onClick={onPlayAgain}
            className="w-full h-12 rounded-full surface-pill text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
          >
            Practice another flight
          </button>
        )}
      </div>
    </motion.div>
  );
}
