import React from 'react';
import {
  GlyphClose,
  GlyphHelp,
  GlyphThermometer,
  GlyphGlobe,
  GlyphCheck
} from './Glyphs';
import CompassNeedle from './CompassNeedle';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleClose = () => {
    sound.playTap();
    vibrateTap();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-heading"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <GlyphHelp className="w-5 h-5 text-[var(--accent)]" />
            <h2 id="how-to-play-heading" className="text-base font-semibold text-[var(--text-primary)]">
              How to Play
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
            aria-label="Close how to play"
          >
            <GlyphClose className="w-5 h-5" />
          </button>
        </div>

        {/* Core Rules */}
        <div className="py-4 text-sm text-[var(--text-secondary)] space-y-2 leading-relaxed">
          <p>
            Deduce the mystery world city in <span className="font-semibold text-[var(--text-primary)]">6 guesses</span>.
          </p>
          <p>
            The atmosphere is your guide. Each wrong guess unlocks a clearer meteorological or geographical clue, while a compass needle and distance reveal how close you are.
          </p>
        </div>

        {/* Worked Example */}
        <div className="my-2 p-4 rounded-xl bg-[var(--bg-surface-elevated)]">
          <div className="text-xs font-semibold text-[var(--text-primary)] mb-3">
            Worked Example
          </div>

          <div className="space-y-3 text-xs">
            {/* Clue 0 */}
            <div className="p-3 rounded-lg bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <GlyphThermometer className="w-4 h-4 text-[var(--accent)]" />
                <span>Mild, 15–20°C. Partly cloudy.</span>
              </div>
            </div>

            {/* Guess 1 */}
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] tabular font-medium">1</span>
                <span className="font-semibold text-[var(--text-primary)]">Tokyo</span>
                <span className="text-[var(--text-muted)]">Japan</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--text-secondary)] tabular">8,420 km</span>
                <CompassNeedle angle={290} size={16} />
                <span className="text-[var(--accent)] font-semibold tabular">58%</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] px-1 leading-snug">
              The arrow rotates toward the destination with 58% proximity.
            </p>

            {/* Clue 1 unlocked */}
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] mt-2">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <GlyphGlobe className="w-4 h-4 text-[var(--accent)]" />
                <span>Located in Europe.</span>
              </div>
            </div>

            {/* Guess 2: Match */}
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] flex items-center justify-between text-[var(--status-success)]">
              <div className="flex items-center gap-2">
                <span className="opacity-70 tabular font-medium">2</span>
                <span className="font-bold">Madrid</span>
                <span className="opacity-70">Spain</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold tabular">
                <GlyphCheck className="w-4 h-4" />
                <span>0 km · 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="pt-3 text-xs text-[var(--text-muted)]">
          A new mystery city arrives every midnight UTC.
        </div>
      </div>
    </div>
  );
}
