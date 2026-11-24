import React from 'react';
import { X, Award, Flame, Target, TrendingUp, Calendar } from 'lucide-react';

export default function StatsModal({ isOpen, onClose, stats }) {
  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const distribution = stats.guessDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const maxFreq = Math.max(1, ...Object.values(distribution));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0b101c]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading text-xl font-semibold tracking-wider text-white mb-5 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Expedition Statistics
        </h3>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {stats.gamesPlayed}
            </div>
            <div className="text-[10px] uppercase font-mono text-white/50 mt-0.5">
              Played
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400">
              {winRate}%
            </div>
            <div className="text-[10px] uppercase font-mono text-white/50 mt-0.5">
              Win Rate
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 flex items-center justify-center gap-1">
              {stats.currentStreak}
            </div>
            <div className="text-[10px] uppercase font-mono text-white/50 mt-0.5">
              Streak
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400">
              {stats.maxStreak}
            </div>
            <div className="text-[10px] uppercase font-mono text-white/50 mt-0.5">
              Max
            </div>
          </div>
        </div>

        {/* Guess Distribution Bars */}
        <div className="mb-4">
          <div className="text-xs font-mono uppercase tracking-wider text-white/60 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            Guess Distribution
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((guessNum) => {
              const count = distribution[guessNum] || 0;
              const pct = Math.max(8, (count / maxFreq) * 100);

              return (
                <div key={guessNum} className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-3 text-white/50">{guessNum}</span>
                  <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-md flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all duration-500 ${
                        count > 0 ? 'bg-gradient-to-r from-sky-500 to-indigo-500' : 'bg-transparent text-white/30'
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

        {/* Daily schedule note */}
        <div className="mt-2 pt-4 border-t border-white/10 text-center text-xs font-mono text-white/50 flex items-center justify-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          A new mystery sky emerges each midnight UTC.
        </div>
      </div>
    </div>
  );
}
