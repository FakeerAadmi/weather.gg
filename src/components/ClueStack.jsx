import React from 'react';
import {
  GlyphThermometer,
  GlyphSun,
  GlyphMoon,
  GlyphGlobe,
  GlyphMapPin,
  GlyphWind,
  GlyphLock
} from './Glyphs';

const GLYPH_MAP = {
  thermometer: GlyphThermometer,
  sun: GlyphSun,
  moon: GlyphMoon,
  globe: GlyphGlobe,
  'map-pin': GlyphMapPin,
  wind: GlyphWind
};

export default function ClueStack({ clues = [], unlockedCount = 0 }) {
  if (unlockedCount === 0) {
    return (
      <div className="w-full max-w-lg mx-auto mb-3 px-3 sm:px-4">
        <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center">
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            Atmosphere hidden. Submit your first guess to reveal Clue #1.
          </p>
        </div>
      </div>
    );
  }

  const unlockedClues = clues.slice(0, unlockedCount);

  return (
    <div
      className="w-full max-w-lg mx-auto mb-3 px-3 sm:px-4 flex flex-col space-y-2"
      aria-live="polite"
      aria-label="Revealed Clues"
    >
      {unlockedClues.map((clue, idx) => {
        const GlyphComponent = GLYPH_MAP[clue.glyph] || GlyphGlobe;
        const isLatest = idx === unlockedCount - 1;

        return (
          <div
            key={clue.level}
            className={`p-3 rounded-lg border bg-[var(--bg-surface)] transition-all animate-clue-reveal ${
              isLatest ? 'animate-highlight' : 'border-[var(--border-subtle)]'
            }`}
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: clue.tint
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-[var(--text-muted)]">
                {clue.category}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                Clue {clue.level}/5
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="text-[var(--text-primary)] shrink-0 mt-0.5">
                <GlyphComponent className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                  {clue.text}
                </div>
                {clue.detail && (
                  <div className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    {clue.detail}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Next locked clue teaser */}
      {unlockedCount < clues.length && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <GlyphLock className="w-3.5 h-3.5" />
            Clue {unlockedCount + 1} of {clues.length}
          </span>
          <span>Reveals on next wrong guess</span>
        </div>
      )}
    </div>
  );
}
