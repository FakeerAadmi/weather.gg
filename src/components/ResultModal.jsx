import React, { useState, useEffect } from 'react';
import {
  GlyphClose,
  GlyphShare,
  GlyphCheck,
  GlyphThermometer,
  GlyphWind,
  GlyphGlobe
} from './Glyphs';
import { getWeatherMeta } from '../engine/weatherCodes';
import { calculateProximity } from './GuessRows';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function ResultModal({
  isOpen,
  onClose,
  isWon,
  city,
  weather,
  guesses,
  dayNumber,
  isPractice,
  onPlayAgain
}) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Countdown to next midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ));
      const diff = Math.max(0, tomorrowUTC - now);
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      setCountdown(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen || !city || !weather) return null;

  const meta = getWeatherMeta(weather.current.weather_code);
  const tempC = Math.round(weather.current.temperature_2m);
  const tempF = Math.round(tempC * 9/5 + 32);

  const generateShareText = () => {
    const title = isPractice ? 'AETHER [Practice]' : `AETHER #${dayNumber}`;
    const score = isWon ? `${guesses.length}/6` : 'X/6';

    const guessLines = guesses.map((g, i) => {
      const prox = calculateProximity(g.distanceKm);
      if (g.distanceKm === 0) {
        return `${i + 1}. ${g.city.name} -> 0 km [100%]`;
      }
      return `${i + 1}. ${g.city.name} -> ${g.distanceKm.toLocaleString()} km [${prox}%]`;
    }).join('\n');

    return `${title} - ${score}\n\n${guessLines}\n\n${city.name}, ${city.country} (${tempC}°C, ${meta.label})\nhttps://fakeeraadmi.github.io/weather.gg/`;
  };

  const handleShare = async () => {
    vibrateTap();
    sound.playTap();
    const text = generateShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AETHER #${dayNumber}`,
          text
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Navigator share error:', err);
        }
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-heading"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors touch-target"
          aria-label="Close result dialog"
        >
          <GlyphClose className="w-5 h-5" />
        </button>

        {/* Status Header */}
        <div className="text-center pt-1 pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase mb-2 border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            {isWon ? (
              <span className="text-[var(--status-success)] flex items-center gap-1">
                <GlyphCheck className="w-3.5 h-3.5" />
                Solved in {guesses.length}/6 Guesses
              </span>
            ) : (
              <span className="text-[var(--status-error)]">
                Mystery Unresolved
              </span>
            )}
          </div>

          <h2 id="result-heading" className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)] tracking-wide">
            {city.name}
          </h2>
          <div className="text-sm text-[var(--text-secondary)] font-mono mt-0.5">
            {city.country} • {city.continent}
          </div>
          <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
            {Math.abs(city.lat).toFixed(2)}°{city.lat >= 0 ? 'N' : 'S'}, {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? 'E' : 'W'}
          </div>
        </div>

        {/* Live Weather Bulletin Summary */}
        <div className="my-2 p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Live Conditions
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {weather.timezone || 'Local'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {tempC}°C <span className="text-sm font-normal text-[var(--text-muted)]">/ {tempF}°F</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-[var(--text-primary)]">{meta.label}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">{meta.feel}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-center font-mono text-xs">
            <div className="p-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Wind</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">
                {Math.round(weather.current.wind_speed_10m)} km/h
              </div>
            </div>
            <div className="p-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Humidity</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">
                {weather.current.relative_humidity_2m || 50}%
              </div>
            </div>
            <div className="p-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Pressure</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">
                {Math.round(weather.current.surface_pressure || 1013)} hPa
              </div>
            </div>
          </div>
        </div>

        {/* Guesses Recap */}
        <div className="my-2 space-y-1 max-h-32 overflow-y-auto pr-1">
          {guesses.map((g, i) => {
            const prox = calculateProximity(g.distanceKm);
            return (
              <div
                key={i}
                className="flex items-center justify-between text-xs font-mono px-2.5 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                <span className="text-[var(--text-primary)]">#{i + 1} {g.city.name}</span>
                <span className={g.distanceKm === 0 ? 'text-[var(--status-success)] font-bold' : 'text-[var(--text-secondary)]'}>
                  {g.distanceKm === 0 ? '0 km [100%]' : `${g.distanceKm.toLocaleString()} km [${prox}%]`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Share Action */}
        <div className="mt-3">
          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-all touch-target active:scale-95"
          >
            <GlyphShare className="w-4 h-4" />
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'SHARE BULLETIN'}</span>
          </button>
        </div>

        {/* Next Puzzle Countdown */}
        {!isPractice && (
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-center font-mono">
            <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">
              Next Daily Mystery
            </div>
            <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
              {countdown}
            </div>
          </div>
        )}

        {/* Practice Mode Alternative */}
        {isPractice && (
          <div className="mt-3 text-center">
            <button
              onClick={onPlayAgain}
              className="text-xs font-mono text-[var(--accent)] hover:underline"
            >
              Next Practice City →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
