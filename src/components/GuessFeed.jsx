import React from 'react';
import { ArrowUp } from 'lucide-react';
import { getDistanceWarmth } from '../utils/geo';

export default function GuessFeed({ guesses = [], maxGuesses = 6, isGameOver = false }) {
  if (guesses.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto mb-2 px-4 text-center pointer-events-none">
        <p className="text-xs sm:text-sm font-mono text-white/50 tracking-wider">
          Gaze at the sky. Enter a city below.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto mb-2 px-3 sm:px-4 flex flex-col space-y-1.5 pointer-events-auto max-h-[30dvh] overflow-y-auto">
      {/* List of guesses */}
      {guesses.map((guess, index) => {
        const warmth = getDistanceWarmth(guess.distanceKm);
        const isMatch = guess.distanceKm === 0;

        return (
          <div
            key={index}
            className="flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl glass-panel text-white animate-slide-up transition-all min-w-0"
            style={{
              borderColor: isMatch ? 'rgba(16, 185, 129, 0.4)' : warmth.bg,
              background: isMatch ? 'rgba(6, 78, 59, 0.5)' : 'rgba(12, 18, 32, 0.7)'
            }}
          >
            {/* City Info */}
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-[10px] font-mono text-white/40 w-3.5 shrink-0">
                #{index + 1}
              </span>
              <div className="truncate min-w-0 flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
                  {guess.city.name}
                </span>
                <span className="text-[11px] text-white/50 font-mono truncate hidden min-[370px]:inline">
                  {guess.city.country}
                </span>
              </div>
            </div>

            {/* Distance & Compass Arrow */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {isMatch ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                  Target Acquired
                </span>
              ) : (
                <>
                  <span
                    className="text-[11px] sm:text-xs font-mono font-medium"
                    style={{ color: warmth.color }}
                  >
                    {guess.distanceKm.toLocaleString()} km
                  </span>

                  {/* Compass Arrow rotating to target bearing */}
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-white/10 border border-white/15 shadow-sm shrink-0"
                    title={`Bearing: ${Math.round(guess.bearing)}° (${guess.direction.label})`}
                  >
                    <ArrowUp
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white compass-arrow"
                      style={{
                        transform: `rotate(${guess.bearing}deg)`
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5 pb-0.5">
        {Array.from({ length: maxGuesses }).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = i === guesses.length && !isGameOver;

          let dotClass = 'bg-white/20 border-white/20';
          if (guess) {
            dotClass = guess.distanceKm === 0
              ? 'bg-emerald-400 border-emerald-300 shadow-md shadow-emerald-400/50'
              : 'bg-rose-400/80 border-rose-400';
          } else if (isCurrent) {
            dotClass = 'bg-white/60 border-white animate-pulse';
          }

          return (
            <div
              key={i}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border transition-all ${dotClass}`}
            />
          );
        })}
      </div>
    </div>
  );
}
