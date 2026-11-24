import React from 'react';
import {
  GlyphClose,
  GlyphHelp,
  GlyphThermometer,
  GlyphGlobe,
  GlyphCompassArrow,
  GlyphCheck
} from './Glyphs';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-heading"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <GlyphHelp className="w-5 h-5 text-[var(--accent)]" />
            <h2 id="how-to-play-heading" className="text-base font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">
              How to Play AETHER
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
            aria-label="Close how to play"
          >
            <GlyphClose className="w-5 h-5" />
          </button>
        </div>

        {/* Core Rules */}
        <div className="py-3 text-xs sm:text-sm text-[var(--text-secondary)] space-y-2.5 leading-relaxed">
          <p>
            Identify the mystery world city in <span className="font-semibold text-[var(--text-primary)]">6 guesses</span>.
          </p>
          <p>
            Every day, a new city is selected. Its real-time weather telemetries—temperature, cloud ceiling, solar altitude, wind, and pressure—fuel the progressive clue ladder.
          </p>
        </div>

        {/* Worked Example */}
        <div className="my-2 p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
            Worked Example
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* Clue 1 */}
            <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)]" style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--temp-mild)' }}>
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                <GlyphThermometer className="w-3.5 h-3.5 text-[var(--temp-mild)]" />
                <span>Thermal: Mild, temperate air (18°C / 64°F)</span>
              </div>
            </div>

            {/* Guess 1 */}
            <div className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">#1</span>
                <span className="font-semibold text-[var(--text-primary)]">Tokyo</span>
                <span className="text-[var(--text-muted)]">Japan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">8,420 km</span>
                <GlyphCompassArrow angle={290} className="w-3.5 h-3.5" />
                <span className="text-[var(--accent)] font-bold">58%</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-sans px-1">
              The arrow points toward the target city with 58% proximity.
            </p>

            {/* Clue 2 */}
            <div className="p-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-2" style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--temp-mild)' }}>
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                <GlyphGlobe className="w-3.5 h-3.5" />
                <span>Geographic: Located in Europe</span>
              </div>
            </div>

            {/* Guess 2: Match */}
            <div className="p-2 rounded border border-[var(--status-success)] bg-[var(--bg-surface)] flex items-center justify-between text-[var(--status-success)]">
              <div className="flex items-center gap-2">
                <span className="opacity-70">#2</span>
                <span className="font-bold">Madrid</span>
                <span className="opacity-70">Spain</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <GlyphCheck className="w-3.5 h-3.5" />
                <span>100% 0 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clue Ladder breakdown */}
        <div className="mt-2 space-y-1.5 text-xs text-[var(--text-secondary)] font-mono">
          <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] mt-2 mb-1">
            Progressive Clue Ladder
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-[var(--text-muted)]">#1</span>
            <span>Temperature feel & apparent humidity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-[var(--text-muted)]">#2</span>
            <span>Hemisphere & local solar time</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-[var(--text-muted)]">#3</span>
            <span>Continent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-[var(--text-muted)]">#4</span>
            <span>Country initial letter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 text-[var(--text-muted)]">#5</span>
            <span>Barometric wind speed & pressure</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-mono text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all touch-target active:scale-95"
        >
          START PLAYING
        </button>
      </div>
    </div>
  );
}
