import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import TemperatureDial, { cToF } from './TemperatureDial';
import {
  GlyphSun,
  GlyphMoon,
  GlyphCloud,
  GlyphCloudRain,
  GlyphWind,
  GlyphThermometer,
  GlyphCheck,
  GlyphClose,
  GlyphShare,
  GlyphArrowRight
} from './Glyphs';
import { sound } from '../utils/sound';
import { vibrateWin, vibrateWrong, vibrateTap } from '../utils/haptics';
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

    const shareBody = `aether dial ${isPractice ? '(practice)' : 'daily'} · ${totalScore}/50.0 🌡️\n\n${lines}\nAvg error: ${avgDiff}°C\nhttps://fakeeraadmi.github.io/weather.gg/`;

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
  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col justify-between p-4 sm:p-8 bg-[var(--bg-page)] text-[var(--text-primary)] select-none">
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

      {/* Center Prompt & Slider */}
      <div className="my-auto w-full max-w-md mx-auto flex flex-col items-center text-center">
        {/* Atmospheric Cue is the Hero Main Info */}
        {currentPrompt && (() => {
          const ConditionIcon = getConditionGlyph(currentPrompt.weatherCode, currentPrompt.isDay);
          return (
            <div className="mb-6 flex flex-col items-center">
              {/* 1. Main Hero: Weather Condition & Time */}
              <div className="flex items-center gap-2.5 justify-center">
                <ConditionIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--accent)] shrink-0" />
                <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)] tabular">
                  {currentPrompt.conditionGroup} · {currentPrompt.localTime}
                </h2>
              </div>

              {/* 2. Secondary Atmospheric Phase */}
              <div className="text-sm sm:text-base text-[var(--text-secondary)] font-medium mt-1">
                {currentPrompt.timePhase}
              </div>

              {/* 3. Location Target Context */}
              <div className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] font-medium">
                in <span className="text-[var(--text-primary)] font-semibold">{currentPrompt.city.name}</span>, {currentPrompt.city.country}
              </div>
            </div>
          );
        })()}

        {/* The Tactile Temperature Dial */}
        <TemperatureDial
          valueC={dialedTempC}
          onChange={(val) => setDialedTempC(val)}
          disabled={isLocked}
          actualTempC={roundResult ? roundResult.actualTempC : null}
          unit={unit}
          onToggleUnit={() => setUnit(unit === 'C' ? 'F' : 'C')}
        />

        {/* Revealed Result Banner after Lock-In */}
        <AnimatePresence>
          {roundResult && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 px-4 py-3 rounded-2xl surface-pill flex items-center justify-between w-full max-w-sm tabular"
            >
              <div className="text-left">
                <div className="text-xs text-[var(--text-muted)] font-medium">Actual temperature</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {unit === 'F' ? `${cToF(roundResult.actualTempC)}°F` : `${roundResult.actualTempC}°C`}
                  <span className="text-xs font-normal text-[var(--text-muted)] ml-1.5">
                    ({roundResult.diff > 0 ? `+${roundResult.diff}` : roundResult.diff}° diff)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)] font-medium">Round score</div>
                <div className="text-lg font-bold text-[var(--accent)]">
                  +{roundResult.score.toFixed(1)} <span className="text-xs font-normal">/ 10</span>
                </div>
              </div>
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
            className="w-full h-14 rounded-full surface-pill text-[var(--text-primary)] text-base font-semibold flex items-center justify-center gap-2 hover:border-[var(--border-strong)] transition-transform active:scale-[0.98] shadow-sm touch-target"
          >
            <span>
              {currentRoundIdx + 1 < rounds.length ? 'Next city' : 'View final score'}
            </span>
            <GlyphArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
