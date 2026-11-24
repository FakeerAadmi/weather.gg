import React from 'react';
import { GlyphClose, GlyphBarChart } from './Glyphs';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function StatsModal({ isOpen, onClose, stats }) {
  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const distribution = stats.guessDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const maxFreq = Math.max(1, ...Object.values(distribution));

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
      aria-labelledby="stats-heading"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <GlyphBarChart className="w-5 h-5 text-[var(--accent)]" />
            <h2 id="stats-heading" className="text-base font-semibold text-[var(--text-primary)]">
              Statistics
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
            aria-label="Close statistics"
          >
            <GlyphClose className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-4 gap-2.5 my-6">
          <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular">
              {stats.gamesPlayed}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Played
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] text-center">
            <div className="text-2xl font-bold text-[var(--accent)] tabular">
              {winRate}%
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Win rate
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular">
              {stats.currentStreak}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Streak
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)] tabular">
              {stats.maxStreak}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Max
            </div>
          </div>
        </div>

        {/* Guess Distribution Bars */}
        <div className="mb-2">
          <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
            Guess Distribution
          </div>

          <div className="space-y-2 text-xs">
            {[1, 2, 3, 4, 5, 6].map((guessNum) => {
              const count = distribution[guessNum] || 0;
              const pct = Math.max(10, (count / maxFreq) * 100);

              return (
                <div key={guessNum} className="flex items-center gap-2.5">
                  <span className="w-3 text-[var(--text-muted)] font-medium tabular text-right">
                    {guessNum}
                  </span>
                  <div className="flex-1 h-6 bg-[var(--bg-surface-elevated)] rounded-md overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-md flex items-center justify-end px-2.5 text-xs font-bold text-white tabular transition-all duration-300 ${
                        count > 0 ? 'bg-[var(--accent)]' : 'bg-transparent text-[var(--text-muted)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
