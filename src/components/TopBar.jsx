import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, BarChart3, MoreHorizontal, Shuffle, Calendar, Volume2, VolumeX, HelpCircle, X } from 'lucide-react';

export default function TopBar({
  dayNumber,
  isPractice,
  onTogglePractice,
  unlockedCluesCount,
  totalClues = 5,
  hasNewClue,
  onOpenClues,
  onOpenStats,
  onOpenHelp,
  isAudioPlaying,
  onToggleAudio
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between min-w-0 pointer-events-auto"
      style={{
        paddingTop: 'max(10px, env(safe-area-inset-top, 10px))'
      }}
    >
      {/* Left: Title & Day Sky subtitle only */}
      <div className="flex flex-col min-w-0 pr-2">
        <h1 className="font-heading tracking-[0.2em] text-lg sm:text-xl font-semibold text-white truncate whitespace-nowrap leading-tight">
          AETHER
        </h1>
        <span className="text-[11px] font-mono text-white/60 tracking-wider truncate whitespace-nowrap">
          {isPractice ? 'Practice Sky' : `Daily Sky #${dayNumber}`}
        </span>
      </div>

      {/* Right: Exactly 3 icon-only 44x44px buttons */}
      <div className="flex items-center gap-2 shrink-0 relative" ref={menuRef}>
        {/* 1. Clues Button (with small "0/5" badge on the icon) */}
        <button
          onClick={onOpenClues}
          title={`Clues (${unlockedCluesCount}/${totalClues})`}
          className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-pill flex items-center justify-center text-white/80 hover:text-white border-white/15 transition-all shrink-0 active:scale-95"
          aria-label="Open Clue Ladder"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-black border border-black/40 shadow-sm leading-tight">
            {unlockedCluesCount}/{totalClues}
          </span>
          {hasNewClue && (
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          )}
        </button>

        {/* 2. Stats Button */}
        <button
          onClick={onOpenStats}
          title="Expedition Statistics"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-pill flex items-center justify-center text-white/80 hover:text-white border-white/15 transition-all shrink-0 active:scale-95"
          aria-label="View Statistics"
        >
          <BarChart3 className="w-5 h-5" />
        </button>

        {/* 3. Menu Button (⋯) */}
        <button
          onClick={() => setIsMenuOpen(prev => !prev)}
          title="Menu"
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full glass-pill flex items-center justify-center border-white/15 transition-all shrink-0 active:scale-95 ${
            isMenuOpen ? 'bg-white/25 text-white border-white/40' : 'text-white/80 hover:text-white'
          }`}
          aria-label="Toggle Menu"
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {/* Menu Dropdown Modal / Popover */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-card p-2 shadow-2xl z-40 border border-white/20 animate-slide-up">
            <div className="flex flex-col space-y-1">
              {/* Practice Toggle */}
              <button
                onClick={() => {
                  onTogglePractice();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/90 text-xs font-mono transition-colors text-left"
              >
                {isPractice ? (
                  <>
                    <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Daily Riddle</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Practice Mode</span>
                  </>
                )}
              </button>

              {/* Ambient Audio Toggle */}
              <button
                onClick={() => {
                  onToggleAudio();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/90 text-xs font-mono transition-colors text-left"
              >
                {isAudioPlaying ? (
                  <>
                    <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Mute Atmosphere</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-white/50 shrink-0" />
                    <span>Live Sky Sound</span>
                  </>
                )}
              </button>

              {/* How to Play & Help */}
              <button
                onClick={() => {
                  onOpenHelp();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/90 text-xs font-mono transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>How to Play</span>
              </button>
            </div>

            {/* Menu Footer with WEATHER.GG badge */}
            <div className="mt-2 pt-2 border-t border-white/10 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span className="uppercase tracking-wider">weather.gg</span>
              <span className="text-white/30">v1.0</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
