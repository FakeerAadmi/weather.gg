import React, { useState, useEffect } from 'react';
import { GlyphCompassArrow, GlyphCheck } from './Glyphs';

const MAX_EARTH_DISTANCE_KM = 20015;

export function calculateProximity(distanceKm) {
  if (distanceKm === 0) return 100;
  const pct = Math.round(100 - (distanceKm / MAX_EARTH_DISTANCE_KM) * 100);
  return Math.max(0, Math.min(99, pct));
}

function AnimatedPercentage({ value, isLatest }) {
  const [displayValue, setDisplayValue] = useState(isLatest ? 0 : value);

  useEffect(() => {
    if (!isLatest) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 450;
    const startTime = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (value - start) * eased));
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [value, isLatest]);

  return <span className="font-mono font-bold">{displayValue}%</span>;
}

export default function GuessRows({ guesses = [], maxGuesses = 6, isGameOver = false }) {
  if (guesses.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto mb-2 px-3 sm:px-4 text-center">
        <div className="py-2 text-xs font-mono text-[var(--text-muted)] tracking-wide">
          6 attempts • No instruments or gauges
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-lg mx-auto mb-2 px-3 sm:px-4 flex flex-col space-y-2 overflow-y-auto max-h-[35dvh]"
      aria-live="polite"
      aria-label="Guess History"
    >
      {guesses.map((guess, index) => {
        const proximity = calculateProximity(guess.distanceKm);
        const isMatch = guess.distanceKm === 0;
        const isLatest = index === guesses.length - 1;

        return (
          <div
            key={index}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-[var(--bg-surface)] text-[var(--text-primary)] animate-row-slide"
            style={{
              borderColor: isMatch ? 'var(--status-success)' : 'var(--border-subtle)',
              backgroundColor: isMatch ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)'
            }}
          >
            {/* City Info */}
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)] w-4 shrink-0">
                #{index + 1}
              </span>
              <div className="truncate min-w-0">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {guess.city.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-mono ml-1.5">
                  {guess.city.country}
                </span>
              </div>
            </div>

            {/* Distance, Arrow & Proximity Percentage */}
            <div className="flex items-center gap-3 shrink-0">
              {isMatch ? (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--status-success)]">
                  <GlyphCheck className="w-4 h-4" />
                  <span>100% 0 km</span>
                </div>
              ) : (
                <>
                  {/* Distance */}
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    {guess.distanceKm.toLocaleString()} km
                  </span>

                  {/* Compass Arrow */}
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] shrink-0"
                    title={`Bearing: ${Math.round(guess.bearing)}° (${guess.direction.label})`}
                  >
                    <GlyphCompassArrow
                      angle={guess.bearing}
                      className="w-3.5 h-3.5"
                    />
                  </div>

                  {/* Proximity Badge (Counting up) */}
                  <div className="w-12 text-right text-xs text-[var(--accent)] font-mono">
                    <AnimatedPercentage value={proximity} isLatest={isLatest} />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {Array.from({ length: maxGuesses }).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = i === guesses.length && !isGameOver;

          let dotClass = 'bg-[var(--border-subtle)] border-[var(--border-subtle)]';
          if (guess) {
            dotClass = guess.distanceKm === 0
              ? 'bg-[var(--status-success)] border-[var(--status-success)]'
              : 'bg-[var(--status-error)] border-[var(--status-error)]';
          } else if (isCurrent) {
            dotClass = 'bg-[var(--accent)] border-[var(--accent)]';
          }

          return (
            <div
              key={i}
              className={`w-2 h-2 rounded-full border transition-all ${dotClass}`}
            />
          );
        })}
      </div>
    </div>
  );
}
