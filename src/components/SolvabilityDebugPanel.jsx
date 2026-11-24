import React, { useState } from 'react';
import { GlyphClose, GlyphCheck } from './Glyphs';
import cities from '../data/cities.json';
import { validateHardModeGuess } from '../utils/hardMode';

export default function SolvabilityDebugPanel({
  isOpen,
  onClose,
  targetCity,
  weatherSnapshot,
  clues,
  unlockedCluesCount,
  onSetUnlockedClues
}) {
  const [testCityQuery, setTestCityQuery] = useState('');
  const [testResult, setTestResult] = useState(null);

  if (!isOpen || !targetCity) return null;

  const handleTestCity = (city) => {
    const res = validateHardModeGuess(city, targetCity, unlockedCluesCount);
    setTestResult({ city, ...res });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-bold text-[var(--accent)] uppercase tracking-wider">
            Solvability & Clue Debugger (?debug=1)
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <GlyphClose className="w-4 h-4" />
          </button>
        </div>

        {/* Target City Data */}
        <div className="my-3 p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-1">
          <div className="font-bold text-[var(--text-primary)]">
            TARGET: {targetCity.name}, {targetCity.country} ({targetCity.continent})
          </div>
          <div className="text-[var(--text-secondary)]">
            Coordinates: {targetCity.lat}° / {targetCity.lon}°
          </div>
          <div className="text-[var(--text-muted)]">
            Hemisphere: {targetCity.lat >= 0 ? 'Northern' : 'Southern'} • Initial: {targetCity.country.charAt(0)}
          </div>
          {weatherSnapshot?.current && (
            <div className="text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
              Temp: {weatherSnapshot.current.temperature_2m}°C • Clouds: {weatherSnapshot.current.cloud_cover}% • Wind: {weatherSnapshot.current.wind_speed_10m} km/h • Day: {weatherSnapshot.current.is_day ? 'Yes' : 'No'}
            </div>
          )}
        </div>

        {/* Clue Ladder Simulation */}
        <div className="my-2">
          <div className="flex items-center justify-between mb-1.5 font-bold text-[var(--text-primary)]">
            <span>CLUE LADDER ({unlockedCluesCount} of 5 Revealed)</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => onSetUnlockedClues(cnt)}
                  className={`px-1.5 py-0.5 rounded border ${
                    unlockedCluesCount === cnt
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-bold'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            {clues.map((c, i) => (
              <div
                key={c.level}
                className={`p-2 rounded border ${
                  i < unlockedCluesCount
                    ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">CLUE {c.level}: {c.category}</span>
                  <span>{i < unlockedCluesCount ? 'UNLOCKED' : 'LOCKED'}</span>
                </div>
                <div className="text-xs mt-0.5">{c.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hard Mode Solvability Tester */}
        <div className="my-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="font-bold text-[var(--text-primary)] mb-1">
            TEST HARD MODE SOLVABILITY
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mb-2">
            Type any city to test if it passes hard-mode validation against the currently revealed clues.
          </p>

          <input
            type="text"
            placeholder="Type city name to test..."
            value={testCityQuery}
            onChange={(e) => setTestCityQuery(e.target.value)}
            className="w-full p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)]"
          />

          {testCityQuery && (
            <div className="mt-1.5 max-h-32 overflow-y-auto border border-[var(--border-subtle)] rounded bg-[var(--bg-subtle)] divide-y divide-[var(--border-subtle)]">
              {cities
                .filter(c => c.name.toLowerCase().includes(testCityQuery.toLowerCase()))
                .slice(0, 5)
                .map(city => (
                  <button
                    key={city.id}
                    onClick={() => handleTestCity(city)}
                    className="w-full p-2 text-left hover:bg-[var(--bg-elevated)] flex items-center justify-between"
                  >
                    <span>{city.name}, {city.country} ({city.continent})</span>
                    <span className="text-[10px] text-[var(--accent)]">Test →</span>
                  </button>
                ))}
            </div>
          )}

          {testResult && (
            <div className={`mt-2 p-2.5 rounded border ${
              testResult.valid
                ? 'border-[var(--status-success)] bg-[rgba(16,185,129,0.1)] text-[var(--status-success)]'
                : 'border-[var(--status-error)] bg-[rgba(239,68,68,0.1)] text-[var(--status-error)]'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {testResult.valid ? <GlyphCheck className="w-4 h-4" /> : 'X'}
                <span>{testResult.city.name}: {testResult.valid ? 'VALID GUESS' : 'VIOLATION'}</span>
              </div>
              {!testResult.valid && (
                <div className="text-[11px] mt-0.5">{testResult.reason}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
