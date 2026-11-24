import React from 'react';
import { GlyphClose, GlyphBarChart } from './Glyphs';

export default function StatsModal({ isOpen, onClose, stats }) {
  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const distribution = stats.guessDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const maxFreq = Math.max(1, ...Object.values(distribution));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-heading"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <GlyphBarChart className="w-5 h-5 text-[var(--accent)]" />
            <h2 id="stats-heading" className="text-base font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">
              Statistics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors touch-target"
            aria-label="Close statistics"
          >
            <GlyphClose className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-4 gap-2 my-5">
          <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-center">
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {stats.gamesPlayed}
            </div>
            <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mt-1">
              Played
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-center">
            <div className="text-2xl font-bold font-mono text-[var(--accent)]">
              {winRate}%
            </div>
            <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mt-1">
              Win Rate
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-center">
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {stats.currentStreak}
            </div>
            <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mt-1">
              Streak
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-center">
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {stats.maxStreak}
            </div>
            <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] mt-1">
              Max
            </div>
          </div>
        </div>

        {/* Guess Distribution Bars */}
        <div className="mb-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3">
            Guess Distribution
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {[1, 2, 3, 4, 5, 6].map((guessNum) => {
              const count = distribution[guessNum] || 0;
              const pct = Math.max(8, (count / maxFreq) * 100);

              return (
                <div key={guessNum} className="flex items-center gap-2">
                  <span className="w-3 text-[var(--text-muted)]">{guessNum}</span>
                  <div className="flex-1 h-5 bg-[var(--bg-subtle)] rounded overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all duration-300 ${
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
