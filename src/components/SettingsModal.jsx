import React from 'react';
import { GlyphClose, GlyphSettings } from './Glyphs';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isPractice,
  onTogglePractice,
  onOpenDebug
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <GlyphSettings className="w-5 h-5 text-[var(--accent)]" />
            <h2 id="settings-heading" className="text-base font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors touch-target"
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
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Subsequent guesses must comply with all revealed clues (hemisphere, continent, initial).
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.hardMode}
              onClick={() => onUpdateSettings({ hardMode: !settings.hardMode })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.hardMode ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.hardMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Theme</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Color scheme appearance
              </div>
            </div>
            <div className="flex rounded-md border border-[var(--border-subtle)] p-0.5 bg-[var(--bg-subtle)] text-xs font-mono">
              {['system', 'dark', 'light'].map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdateSettings({ theme: t })}
                  className={`px-2.5 py-1 rounded capitalize transition-colors ${
                    settings.theme === t
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Sound Effects</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Synthesized audio cues for clues, guesses, and results
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.sound}
              onClick={() => onUpdateSettings({ sound: !settings.sound })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.sound ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'
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
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Haptic Vibration</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Vibration feedback on tap, wrong guess, and victory
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.haptics}
              onClick={() => onUpdateSettings({ haptics: !settings.haptics })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.haptics ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'
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
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">High Contrast</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Elevates border contrast and text clarity
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.highContrast ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'
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
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Reduced Motion</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Disables transitions and row entry animations
              </div>
            </div>
            <button
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                settings.reducedMotion ? 'bg-[var(--accent)]' : 'bg-[var(--bg-elevated)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Game Mode Toggle */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Mode</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Switch between Daily mystery and Unlimited Practice
              </div>
            </div>
            <button
              onClick={() => {
                onTogglePractice();
                onClose();
              }}
              className="px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              {isPractice ? 'Switch to Daily' : 'Switch to Practice'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span>AETHER // weather.gg v2.0</span>
          <button
            onClick={() => {
              onOpenDebug();
              onClose();
            }}
            className="hover:text-[var(--text-secondary)] underline"
          >
            Debug Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
