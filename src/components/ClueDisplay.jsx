import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlyphThermometer,
  GlyphSun,
  GlyphMoon,
  GlyphGlobe,
  GlyphMapPin,
  GlyphWind
} from './Glyphs';

const ICON_MAP = {
  thermometer: GlyphThermometer,
  sun: GlyphSun,
  moon: GlyphMoon,
  globe: GlyphGlobe,
  'map-pin': GlyphMapPin,
  wind: GlyphWind
};

export default function ClueDisplay({ clues = [], unlockedCount = 1 }) {
  // Clue 0 is always visible immediately on load (minimum 1 clue revealed)
  const activeCluesCount = Math.max(1, Math.min(clues.length, unlockedCount));
  const revealedClues = clues.slice(0, activeCluesCount);
  const unrevealedRemaining = Math.max(0, clues.length - activeCluesCount);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-3 flex flex-col space-y-4 select-none">
      <AnimatePresence initial={false}>
        {revealedClues.map((clue, idx) => {
          const isLatest = idx === revealedClues.length - 1;
          const Icon = ICON_MAP[clue.icon] || GlyphGlobe;

          return (
            <motion.div
              key={clue.level}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: isLatest ? 1 : 0.55,
                scale: isLatest ? 1 : 0.94,
                y: 0
              }}
              exit={{ opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 18,
                mass: 0.8
              }}
              className="origin-left flex flex-col"
            >
              {/* Muted label with icon */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium mb-1">
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span>{clue.label}</span>
              </div>

              {/* Bold Grotesque Clue Typography (28-34px, -0.02em) */}
              <div
                className={`font-semibold tracking-[-0.02em] leading-tight text-[var(--text-primary)] ${
                  isLatest ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                }`}
              >
                {clue.text}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Unrevealed clues: 2-3 faint skeleton lines with subtle shimmer, zero text */}
      {unrevealedRemaining > 0 && (
        <div className="pt-2 flex flex-col space-y-2.5 opacity-60 pointer-events-none">
          {Array.from({ length: Math.min(2, unrevealedRemaining) }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-1.5 animate-skeleton">
              <div className="w-20 h-2 rounded bg-[var(--text-muted)]" />
              <div
                className="h-4 rounded bg-[var(--text-muted)]"
                style={{ width: `${65 + i * 15}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
