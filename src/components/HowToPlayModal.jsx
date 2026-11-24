import React from 'react';
import { X, CloudFog, Navigation, Sparkles, Eye } from 'lucide-react';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0b101c]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white">
            How to Play AETHER
          </h3>
          <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
            WEATHER.GG
          </span>
        </div>
        <p className="text-xs font-mono text-sky-400/80 mb-5">
          The Sky is the Board • No instruments or grids
        </p>

        <div className="space-y-3.5 text-sm text-white/80">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-300 shrink-0 h-fit">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                The Atmosphere is Your Riddle
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                The entire screen renders the live celestial sky of a mystery city based on real-time satellite telemetry: solar angle, cloud cover, wind speed, rain streaks, snow, and urban sodium glow.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 shrink-0 h-fit">
              <CloudFog className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                The Fog Thins As You Guess
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                At the start, the sky is veiled in dense mystery fog. With each incorrect guess, the fog lifts visibly, revealing true cloud contours, celestial bodies, and lighting.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 shrink-0 h-fit">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                Navigational Bearings
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Every wrong guess calculates great-circle distance in kilometers and rotates a compass arrow directly toward the mystery city.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 shrink-0 h-fit">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                Progressive Clue Ladder
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Unlock 5 escalating meteorological clues: temperature feel, hemisphere & local solar time, continent, initial letter of country, and barometric wind dynamics.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-mono text-xs font-semibold shadow-lg shadow-sky-500/20 hover:brightness-110 transition-all active:scale-95"
        >
          Begin Observation
        </button>
      </div>
    </div>
  );
}
