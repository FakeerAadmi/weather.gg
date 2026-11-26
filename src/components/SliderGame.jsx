import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import TemperatureDial, {
  cToF,
  getThermalColor,
  getThermalDescription
} from './TemperatureDial';
import {
  GlyphSun,
  GlyphMoon,
  GlyphCloud,
  GlyphCloudRain,
  GlyphWind,
  GlyphClose,
  GlyphShare,
  GlyphArrowRight
} from './Glyphs';
import { sound } from '../utils/sound';
import { vibrateWin, vibrateTap } from '../utils/haptics';
import {
  fetchSliderDailyFromBackend,
  submitSliderGuessToBackend,
  startSliderPracticeFromBackend,
  submitSliderPracticeGuess
} from '../utils/apiClient';

function getConditionGlyph(weatherCode, isDay) {
  if ([61, 63, 65, 80, 81, 82, 51, 53, 55, 56, 57, 95, 96, 99].includes(weatherCode)) {
    return GlyphCloudRain;
  }
  if ([2, 3].includes(weatherCode)) {
    return GlyphCloud;
  }
  if ([45, 48].includes(weatherCode)) {
    return GlyphWind;
  }
  return isDay ? GlyphSun : GlyphMoon;
}

function getRatingBadge(score) {
  if (score >= 10.0) {
    return {
      text: 'PERFECT',
      colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    };
  }
  if (score >= 9.0) {
    return {
      text: 'DIALED IN',
      colorClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    };
  }
  if (score >= 8.0) {
    return {
      text: 'EXCELLENT',
      colorClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30'
    };
  }
  if (score >= 7.0) {
    return {
      text: 'GREAT',
      colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    };
  }
  if (score >= 5.0) {
    return {
      text: 'CLOSE',
      colorClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    };
  }
  return {
    text: 'OFF TARGET',
    colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  };
}

export default function SliderGame({ onReturnHub, isPractice = false }) {
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [dialedTempC, setDialedTempC] = useState(18);
  const [unit, setUnit] = useState('C');

  // Round completion states
  const [isLocked, setIsLocked] = useState(false);
  const [roundResult, setRoundResult] = useState(null); // { actualTempC, diff, score }
  const [resultsHistory, setResultsHistory] = useState([]); // Array of results

  // Final summary state
  const [isGameOver, setIsGameOver] = useState(false);
  const [copied, setCopied] = useState(false);

  // Practice session id (if in practice mode)
  const [practiceSessionId, setPracticeSessionId] = useState(null);

  // Load Daily Challenge or Practice Round
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const init = async () => {
      if (isPractice) {
        const prac = await startSliderPracticeFromBackend();
        if (cancelled) return;
        if (prac) {
          setPracticeSessionId(prac.sessionId);
          setRounds([prac.prompt]);
        } else {
          // Synthetic fallback
          setRounds([
            {
              roundIndex: 0,
              city: { id: 'c1', name: 'Kyoto', country: 'Japan', continent: 'Asia' },
              localTime: '22:15',
              timePhase: 'Nightfall',
              conditionGroup: 'Partly cloudy',
              weatherCode: 2,
              isDay: 0
            }
          ]);
        }
      } else {
        const daily = await fetchSliderDailyFromBackend();
        if (cancelled) return;
        if (daily && daily.rounds) {
          setRounds(daily.rounds);
        } else {
          // Static fallback 5 cities
          setRounds([
            { roundIndex: 0, city: { id: '1', name: 'Reykjavik', country: 'Iceland', continent: 'Europe' }, localTime: '13:00', timePhase: 'Midday noon', conditionGroup: 'Light rainfall', weatherCode: 61, isDay: 1 },
            { roundIndex: 1, city: { id: '2', name: 'Nairobi', country: 'Kenya', continent: 'Africa' }, localTime: '16:30', timePhase: 'Afternoon', conditionGroup: 'Clear sky', weatherCode: 0, isDay: 1 },
            { roundIndex: 2, city: { id: '3', name: 'Tokyo', country: 'Japan', continent: 'Asia' }, localTime: '22:00', timePhase: 'Nightfall', conditionGroup: 'Partly cloudy', weatherCode: 2, isDay: 0 },
            { roundIndex: 3, city: { id: '4', name: 'Santiago', country: 'Chile', continent: 'South America' }, localTime: '10:00', timePhase: 'Morning sun', conditionGroup: 'Clear sky', weatherCode: 0, isDay: 1 },
            { roundIndex: 4, city: { id: '5', name: 'Chicago', country: 'United States', continent: 'North America' }, localTime: '07:30', timePhase: 'Morning sun', conditionGroup: 'Overcast', weatherCode: 3, isDay: 1 }
          ]);
        }
      }
      setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [isPractice]);

  const currentPrompt = rounds[currentRoundIdx] || null;

  // Handle Lock In
  const handleLockIn = async () => {
    if (isLocked || !currentPrompt) return;

    sound.playPop();
    vibrateTap();
    setIsLocked(true);

    let res;
    if (isPractice && practiceSessionId) {
      res = await submitSliderPracticeGuess(practiceSessionId, dialedTempC);
    } else {
      res = await submitSliderGuessToBackend(currentRoundIdx, dialedTempC);
    }

    if (!res) {
      // Local estimation fallback
      const mockActual = Math.round(14 + Math.sin(currentRoundIdx) * 12);
      const diff = dialedTempC - mockActual;
      const penalty = Math.pow(Math.abs(diff), 1.18) * 0.62;
      const score = Math.round(Math.max(0, 10 - penalty) * 10) / 10;
      res = { actualTempC: mockActual, diff, score };
    }

    setRoundResult(res);

    const updatedHistory = [
      ...resultsHistory,
      {
        roundIndex: currentRoundIdx,
        prompt: currentPrompt,
        dialedTempC,
        actualTempC: res.actualTempC,
        diff: res.diff,
        score: res.score
      }
    ];
    setResultsHistory(updatedHistory);

    if (res.score >= 9.0) {
      sound.playWin();
      vibrateWin();
    } else {
      sound.playTap();
    }
  };

  // Next Round / Finish
  const handleNextRound = () => {
    sound.playTap();
    vibrateTap();

    if (currentRoundIdx + 1 < rounds.length) {
      setCurrentRoundIdx((prev) => prev + 1);
      setIsLocked(false);
      setRoundResult(null);
      setDialedTempC(18); // default reset to comfortable temp
    } else {
      // Game Complete!
      setIsGameOver(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Keyboard support for swift play (unconditionally declared at top level)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (!isLocked && currentPrompt) {
          handleLockIn();
        } else if (isLocked && roundResult) {
          handleNextRound();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, currentPrompt, roundResult, currentRoundIdx]);

  // Practice Flight Replay
  const handleNextPracticeFlight = async () => {
    sound.playTap();
    vibrateTap();
    setLoading(true);
    setIsLocked(false);
    setRoundResult(null);
    setIsGameOver(false);
    setResultsHistory([]);
    setCurrentRoundIdx(0);
    setDialedTempC(18);

    const prac = await startSliderPracticeFromBackend();
    if (prac) {
      setPracticeSessionId(prac.sessionId);
      setRounds([prac.prompt]);
    }
    setLoading(false);
  };

  // Share Scorecard Bulletin
  const handleShare = async () => {
    sound.playTap();
    vibrateTap();

    const totalScore = resultsHistory.reduce((acc, r) => acc + r.score, 0).toFixed(1);
    const avgDiff = (
      resultsHistory.reduce((acc, r) => acc + Math.abs(r.diff), 0) / (resultsHistory.length || 1)
    ).toFixed(1);

    const lines = resultsHistory
      .map((r, i) => {
        const sign = r.diff > 0 ? `+${r.diff}` : r.diff;
        return `R${i + 1}: ${r.score.toFixed(1)}/10 (${r.prompt.city.name}, ${sign}°C)`;
      })
      .join('\n');

    const shareBody = `aether dial ${isPractice ? '(practice)' : 'daily'} · ${totalScore}/50.0\n\n${lines}\nAvg error: ${avgDiff}°C\nhttps://fakeeraadmi.github.io/weather.gg/`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'aether dial', text: shareBody });
        return;
      } catch (err) {
        // ignore
      }
    }

    try {
      await navigator.clipboard.writeText(shareBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="w-6 h-6 border-2 border-[var(--border-subtle)] border-t-[var(--accent)] rounded-full animate-spin mb-3" />
        <div className="text-xs text-[var(--text-muted)] font-medium">Tuning atmospheric frequencies...</div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Final Scorecard Screen (50.0 Total Points)
  // -------------------------------------------------------------
  if (isGameOver) {
    const totalScore = resultsHistory.reduce((acc, r) => acc + r.score, 0).toFixed(1);
    const avgDeviation = (
      resultsHistory.reduce((acc, r) => acc + Math.abs(r.diff), 0) / (resultsHistory.length || 1)
    ).toFixed(1);

    const headline =
      Number(totalScore) >= 45
        ? 'Perfect tuning. Dialed in.'
        : Number(totalScore) >= 38
        ? 'Impressive atmospheric intuition.'
        : 'Good effort. Keep tuning.';

    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 bg-[var(--bg-page)] text-[var(--text-primary)] select-none overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {headline}
          </span>
          <button
            onClick={onReturnHub}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Return to hub"
          >
            <GlyphClose className="w-5 h-5" />
          </button>
        </div>

        {/* Big Score Hero */}
        <div className="my-auto py-6 flex flex-col items-center text-center">
          <div className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-2">
            Final score
          </div>
          <div className="text-6xl sm:text-7xl font-bold tracking-tight text-[var(--text-primary)] tabular mb-1">
            {totalScore} <span className="text-2xl font-normal text-[var(--text-muted)]">/ 50.0</span>
          </div>
          <div className="text-sm text-[var(--accent)] font-semibold tabular">
            Average deviation: ±{avgDeviation}°C
          </div>

          {/* 5-Round Detailed Results Breakdown */}
          <div className="w-full max-w-sm mx-auto mt-8 flex flex-col space-y-2">
            {resultsHistory.map((item, idx) => {
              const sign = item.diff > 0 ? `+${item.diff}` : item.diff;
              return (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between hairline text-xs tabular"
                >
                  <div className="flex items-baseline gap-2 min-w-0 pr-2">
                    <span className="text-[var(--text-muted)] font-medium w-4">{idx + 1}</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate">
                      {item.prompt.city.name}
                    </span>
                    <span className="text-[var(--text-muted)] hidden sm:inline">
                      {item.prompt.city.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[var(--text-muted)]">
                      {item.dialedTempC}° / {item.actualTempC}° ({sign}°)
                    </span>
                    <span className="font-bold text-[var(--accent)] w-10 text-right">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm mx-auto flex flex-col space-y-3">
          <button
            onClick={handleShare}
            className="w-full h-14 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-base font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-transform active:scale-[0.98] shadow-sm touch-target"
          >
            <GlyphShare className="w-5 h-5" />
            <span>{copied ? 'Copied to clipboard' : 'Share bulletin'}</span>
          </button>

          {isPractice ? (
            <button
              onClick={handleNextPracticeFlight}
              className="w-full h-12 rounded-full surface-pill text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
            >
              Practice another round
            </button>
          ) : (
            <button
              onClick={onReturnHub}
              className="w-full h-12 rounded-full surface-pill text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-surface-elevated)] transition-colors touch-target"
            >
              Return to hub
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // Active Round Gameplay Screen
  // -------------------------------------------------------------
  const runningTotal = resultsHistory.reduce((acc, r) => acc + r.score, 0).toFixed(1);
  const ratingBadge = roundResult ? getRatingBadge(roundResult.score) : null;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col justify-between p-4 sm:p-8 bg-[var(--bg-page)] text-[var(--text-primary)] select-none overflow-hidden">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight lowercase">aether</span>
          <span className="px-2.5 py-0.5 rounded-full surface-pill text-[11px] font-medium text-[var(--text-secondary)] tabular">
            {isPractice ? 'practice dial' : `round ${currentRoundIdx + 1} of ${rounds.length}`}
          </span>
        </div>

        <button
          onClick={onReturnHub}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Exit to hub"
        >
          <GlyphClose className="w-5 h-5" />
        </button>
      </div>

      {/* 5-Segment Progress Bar */}
      {!isPractice && rounds.length > 1 && (
        <div className="w-full max-w-md mx-auto grid grid-cols-5 gap-1.5 py-1">
          {rounds.map((_, i) => {
            const hasPlayed = i < currentRoundIdx;
            const isCurrent = i === currentRoundIdx;
            const score = resultsHistory[i]?.score;

            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  hasPlayed
                    ? 'bg-[var(--accent)]'
                    : isCurrent
                    ? 'bg-[var(--text-primary)]'
                    : 'bg-[var(--border-subtle)]'
                }`}
                title={score !== undefined ? `Round ${i + 1}: ${score} pts` : `Round ${i + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Center Dynamic Content Area */}
      <div className="my-auto w-full max-w-md mx-auto flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {!roundResult ? (
            /* -------------------------------------------------------- */
            /* GUESSING STATE: Atmospheric Briefing & Interactive Dial  */
            /* -------------------------------------------------------- */
            <motion.div
              key="guessing-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="w-full flex flex-col items-center"
            >
              {currentPrompt && (() => {
                const ConditionIcon = getConditionGlyph(currentPrompt.weatherCode, currentPrompt.isDay);
                return (
                  <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
                    {/* 1. Location Eyebrow */}
                    <div className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                      <span>{currentPrompt.city.name}, {currentPrompt.city.country}</span>
                      {currentPrompt.city.continent && (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="opacity-75">{currentPrompt.city.continent}</span>
                        </>
                      )}
                    </div>

                    {/* 2. Hero Weather Phenomenon (The Headline) */}
                    <div className="flex items-center justify-center gap-3 my-1">
                      <ConditionIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent)] shrink-0" />
                      <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.035em] text-[var(--text-primary)] leading-tight">
                        {currentPrompt.conditionGroup}
                      </h1>
                    </div>

                    {/* 3. Atmospheric Telemetry Strip */}
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full surface-pill text-xs sm:text-sm text-[var(--text-secondary)] font-medium tabular">
                      <span className="font-semibold text-[var(--text-primary)]">{currentPrompt.localTime}</span>
                      <span className="text-[var(--border-strong)]">·</span>
                      <span>{currentPrompt.timePhase}</span>
                      <span className="text-[var(--border-strong)]">·</span>
                      <span className="text-[var(--text-muted)]">{currentPrompt.isDay ? 'Daylight' : 'Night'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* The Tactile Temperature Dial */}
              <TemperatureDial
                valueC={dialedTempC}
                onChange={(val) => setDialedTempC(val)}
                disabled={isLocked}
                actualTempC={null}
                unit={unit}
                onToggleUnit={() => setUnit(unit === 'C' ? 'F' : 'C')}
              />
            </motion.div>
          ) : (
            /* -------------------------------------------------------- */
            /* RESULT STATE: Dialed.gg Inspired Round Scorecard Overlay */
            /* -------------------------------------------------------- */
            <motion.div
              key="round-result-card"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="w-full flex flex-col items-center text-center py-2"
            >
              {/* Qualitative Rating Pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 }}
                className={`px-3.5 py-1 rounded-full text-xs font-black tracking-[0.2em] uppercase border mb-3 ${ratingBadge.colorClass}`}
              >
                {ratingBadge.text}
              </motion.div>

              {/* Hero Round Score Display */}
              <div className="flex items-baseline justify-center gap-1.5 mb-1">
                <span className="text-6xl sm:text-7xl font-extrabold tracking-[-0.04em] text-[var(--text-primary)] tabular">
                  +{roundResult.score.toFixed(1)}
                </span>
                <span className="text-xl sm:text-2xl font-medium text-[var(--text-muted)]">
                  / 10.0
                </span>
              </div>

              {/* Location & Context Recap */}
              <div className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mb-6">
                in <span className="text-[var(--text-primary)] font-semibold">{currentPrompt.city.name}</span> during {currentPrompt.timePhase.toLowerCase()}
              </div>

              {/* Dialed.gg Style Side-by-Side Comparison Matrix */}
              <div className="w-full grid grid-cols-3 gap-2.5 mb-6 tabular">
                {/* 1. Your Dial */}
                <div className="p-3 rounded-2xl surface-pill flex flex-col items-center">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] mb-1">
                    Your Dial
                  </span>
                  <span
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: getThermalColor(dialedTempC) }}
                  >
                    {unit === 'F' ? `${cToF(dialedTempC)}°` : `${dialedTempC > 0 ? `+${dialedTempC}` : dialedTempC}°`}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate max-w-full mt-1">
                    {getThermalDescription(dialedTempC)}
                  </span>
                </div>

                {/* 2. Deviation */}
                <div className="p-3 rounded-2xl surface-pill flex flex-col items-center">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] mb-1">
                    Deviation
                  </span>
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      Math.abs(roundResult.diff) <= 2
                        ? 'text-emerald-400'
                        : Math.abs(roundResult.diff) <= 5
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {roundResult.diff === 0
                      ? '0°'
                      : `${roundResult.diff > 0 ? `+${roundResult.diff}` : roundResult.diff}°`}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">
                    {roundResult.diff === 0
                      ? 'Bullseye'
                      : roundResult.diff > 0
                      ? 'Too warm'
                      : 'Too cold'}
                  </span>
                </div>

                {/* 3. Actual Temp */}
                <div className="p-3 rounded-2xl surface-pill flex flex-col items-center">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] mb-1">
                    Actual
                  </span>
                  <span
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: getThermalColor(roundResult.actualTempC) }}
                  >
                    {unit === 'F'
                      ? `${cToF(roundResult.actualTempC)}°`
                      : `${roundResult.actualTempC > 0 ? `+${roundResult.actualTempC}` : roundResult.actualTempC}°`}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] truncate max-w-full mt-1">
                    {getThermalDescription(roundResult.actualTempC)}
                  </span>
                </div>
              </div>

              {/* Running Score Ticker */}
              {!isPractice && (
                <div className="text-xs font-semibold text-[var(--text-secondary)] tabular flex items-center gap-1.5 px-3 py-1.5 rounded-full surface-pill">
                  <span className="text-[var(--text-muted)]">Running Total:</span>
                  <span className="text-[var(--accent)] font-bold">{runningTotal}</span>
                  <span className="text-[var(--text-muted)]">/ {((currentRoundIdx + 1) * 10).toFixed(1)}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Pinned Action Button */}
      <div className="w-full max-w-md mx-auto pb-4">
        {!isLocked ? (
          <button
            onClick={handleLockIn}
            className="w-full h-14 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-base font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-transform active:scale-[0.98] shadow-sm touch-target"
          >
            <span>Lock in temperature</span>
            <GlyphArrowRight className="w-5 h-5 opacity-80" />
          </button>
        ) : (
          <button
            onClick={handleNextRound}
            className="w-full h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg-page)] text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-transform active:scale-[0.98] shadow-sm touch-target"
          >
            <span>
              {currentRoundIdx + 1 < rounds.length
                ? `Next round (${currentRoundIdx + 2}/${rounds.length})`
                : 'View final scorecard'}
            </span>
            <GlyphArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
