import React from 'react';
import { GlyphBarChart, GlyphSettings, GlyphHelp } from './Glyphs';

export default function Header({
  dayNumber,
  isPractice,
  unlockedCluesCount,
  totalClues = 5,
  onOpenStats,
  onOpenSettings,
  onOpenHelp
}) {
  return (
    <header
      className="w-full border-b border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 py-2.5 flex items-center justify-between select-none"
      style={{
        paddingTop: 'max(10px, env(safe-area-inset-top, 10px))'
      }}
    >
      {/* Left: Help / Rules */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenHelp}
          className="w-10 h-10 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors touch-target"
          aria-label="How to play"
        >
          <GlyphHelp className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Title & Day Subtitle */}
      <div className="text-center">
        <h1 className="text-lg sm:text-xl font-bold tracking-[0.25em] text-[var(--text-primary)] font-mono leading-none">
          AETHER
        </h1>
        <div className="text-[10px] font-mono tracking-wider text-[var(--text-muted)] uppercase mt-0.5">
          {isPractice ? 'Free Practice' : `Daily #${dayNumber}`}
        </div>
      </div>

      {/* Right: Stats & Settings */}
      <div className="flex items-center gap-1">
        {/* Clue Count Pill */}
        <div
          className="hidden sm:flex items-center px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[10px] font-mono text-[var(--text-secondary)] mr-1"
          title="Revealed clues"
        >
          CLUES {unlockedCluesCount}/{totalClues}
        </div>

        <button
          onClick={onOpenStats}
          className="w-10 h-10 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors touch-target"
          aria-label="Expedition Statistics"
        >
          <GlyphBarChart className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors touch-target"
          aria-label="Settings"
        >
          <GlyphSettings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
