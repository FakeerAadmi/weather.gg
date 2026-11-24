import React from 'react';
import { X, Thermometer, Compass, Globe, MapPin, Wind, Lock, CheckCircle2, CloudFog } from 'lucide-react';

const ICONS = {
  Thermometer,
  Compass,
  Globe,
  MapPin,
  Wind
};

export default function ClueDrawer({
  isOpen,
  onClose,
  clues = [],
  unlockedCount = 0,
  fogPercent = 90
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-[#0b101c]/95 border-l border-white/10 shadow-2xl flex flex-col z-10 animate-slide-left overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CloudFog className="w-4 h-4 text-sky-400" />
              <h2 className="font-heading text-lg font-semibold tracking-wider text-white">
                Clue Ladder
              </h2>
            </div>
            <p className="text-xs text-white/60 font-mono mt-0.5">
              The fog thins with each deviation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fog Level Indicator */}
        <div className="px-5 py-3.5 bg-white/5 border-b border-white/5">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-white/60">Atmospheric Obscurity</span>
            <span className="text-sky-300 font-semibold">{Math.round(fogPercent)}% Veil</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-700 rounded-full"
              style={{ width: `${Math.max(5, fogPercent)}%` }}
            />
          </div>
        </div>

        {/* Clues List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {clues.map((clue, idx) => {
            const isUnlocked = idx < unlockedCount;
            const IconComponent = ICONS[clue.icon] || Globe;

            if (isUnlocked) {
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-sky-400/30 shadow-lg shadow-sky-950/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      {clue.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mt-2">
                    <div className="p-2 rounded-lg bg-sky-500/15 text-sky-300 shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/95 leading-snug">
                        {clue.text}
                      </h4>
                      {clue.detail && (
                        <p className="text-xs text-white/60 font-mono mt-1">
                          {clue.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Locked Clue Card
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 opacity-70 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-white/5 text-white/40">
                    {clue.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white/40">
                    <Lock className="w-3 h-3" />
                    Level {clue.level}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2 rounded-lg bg-white/5 text-white/30 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/40">
                      Veiled in mist
                    </h4>
                    <p className="text-xs text-white/30 font-mono mt-0.5">
                      Unlocks after {clue.level - unlockedCount} more {clue.level - unlockedCount === 1 ? 'guess' : 'guesses'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center text-xs font-mono text-white/40">
          6 attempts • No gauges or grids
        </div>
      </div>
    </div>
  );
}
