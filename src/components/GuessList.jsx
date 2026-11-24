import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RollingNumber from './RollingNumber';
import CompassNeedle from './CompassNeedle';
import { calculateProximity } from '../utils/geo';
import { GlyphCheck } from './Glyphs';

export default function GuessList({ guesses = [] }) {
  if (guesses.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pt-3 pb-2 flex flex-col select-none">
      <AnimatePresence initial={false}>
        {guesses.map((guess, idx) => {
          const proximity = calculateProximity(guess.distanceKm);
          const isMatch = guess.distanceKm === 0;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 16
              }}
              className="py-3 flex items-center justify-between hairline"
            >
              {/* Left: Rank, City Bold, Country Muted */}
              <div className="flex items-baseline gap-2.5 min-w-0 pr-3">
                <span className="text-xs text-[var(--text-muted)] tabular w-3 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-base font-semibold text-[var(--text-primary)] truncate">
                  {guess.city.name}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate hidden sm:inline">
                  {guess.city.country}
                </span>
              </div>

              {/* Right: Distance, Rotating Arrow, Proximity % */}
              <div className="flex items-center gap-3 shrink-0 text-right">
                {isMatch ? (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--status-success)] tabular">
                    <GlyphCheck className="w-4 h-4" />
                    <span>0 km · 100%</span>
                  </div>
                ) : (
                  <>
                    {/* Rolling Distance */}
                    <span className="text-sm text-[var(--text-secondary)] tabular">
                      <RollingNumber
                        value={guess.distanceKm.toLocaleString()}
                        suffix=" km"
                      />
                    </span>

                    {/* Compass Needle rotating to bearing */}
                    <CompassNeedle
                      angle={guess.bearing}
                      size={18}
                      className="text-[var(--text-primary)]"
                    />

                    {/* Rolling Proximity % */}
                    <span className="text-sm font-semibold text-[var(--accent)] tabular w-10 text-right">
                      <RollingNumber
                        value={proximity}
                        suffix="%"
                      />
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
