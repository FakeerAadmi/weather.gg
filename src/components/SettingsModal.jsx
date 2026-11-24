import React from 'react';
import { GlyphClose, GlyphSettings } from './Glyphs';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isPractice,
  onTogglePractice,
  onOpenHelp,
  onOpenDebug
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    sound.playTap();
    vibrateTap();
    onClose();
  };

  const handleToggle = (key, val) => {
    sound.playTap();
    vibrateTap();
    onUpdateSettings({ [key]: val });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <GlyphSettings className="w-5 h-5 text-[var(--accent)]" />
            <h2 id="settings-heading" className="text-base font-semibold text-[var(--text-primary)]">
              Settings
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
            aria-label="Close settings"
          >
            <GlyphClose className="w-5 h-5" />
          </button>
        </div>

        {/* Settings List */}
        <div className="py-2 divide-y divide-[var(--border-subtle)]">
          {/* Hard Mode Toggle */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Hard Mode</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
                Every revealed clue must be strictly respected by subsequent guesses.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.hardMode}
              onClick={() => handleToggle('hardMode', !settings.hardMode)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.hardMode ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.hardMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Sound Effects</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Synthesized audio ticks, taps, clue chimes, and win fanfare.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.sound}
              onClick={() => handleToggle('sound', !settings.sound)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.sound ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.sound ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Haptic Vibration</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Tactile feedback on phone keypresses and guess submissions.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.haptics}
              onClick={() => handleToggle('haptics', !settings.haptics)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.haptics ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.haptics ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">High Contrast</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Boost text and border contrast for outdoor and sunlight visibility.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => handleToggle('highContrast', !settings.highContrast)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.highContrast ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Reduced Motion</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Minimize rolling numbers, screen transitions, and celebratory confetti.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => handleToggle('reducedMotion', !settings.reducedMotion)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.reducedMotion ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* How to Play Guide */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Game Guide</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Rules, clue ladder explanation, and worked examples.
              </div>
            </div>
            <button
              onClick={() => {
                sound.playTap();
                vibrateTap();
                onClose();
                if (onOpenHelp) onOpenHelp();
              }}
              className="px-3 py-1.5 rounded-full surface-pill text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all touch-target"
            >
              How to play
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center justify-between">
          <span>aether v1.2</span>
          <span>weather.gg</span>
        </div>
      </div>
    </div>
  );
}
