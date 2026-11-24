import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import ClueStack from './components/ClueStack';
import GuessRows from './components/GuessRows';
import GuessInput from './components/GuessInput';
import SettingsModal from './components/SettingsModal';
import HowToPlayModal from './components/HowToPlayModal';
import ResultModal from './components/ResultModal';
import StatsModal from './components/StatsModal';
import SolvabilityDebugPanel from './components/SolvabilityDebugPanel';

import cities from './data/cities.json';
import { getTodayDateString, getDailyCity, getRandomCity } from './utils/gameSeed';
import { fetchWeatherSnapshot } from './utils/weatherApi';
import { calculateDistanceKm, calculateBearing, getBearingDirection } from './utils/geo';
import { generateClues } from './utils/clues';
import { loadStats, recordGameCompletion, loadGameState, saveGameState } from './utils/storage';
import { loadSettings, saveSettings, applySettingsToDOM } from './utils/settings';
import { sound } from './utils/sound';
import { vibrateWin, vibrateWrong, vibrateError } from './utils/haptics';
import { validateHardModeGuess } from './utils/hardMode';

const MAX_GUESSES = 6;
const HAS_SEEN_TUTORIAL_KEY = 'aether_has_seen_tutorial_v2';

export default function App() {
  const [dateStr] = useState(getTodayDateString());
  const [isPractice, setIsPractice] = useState(false);
  const [targetData, setTargetData] = useState(() => getDailyCity(getTodayDateString()));
  const [weatherSnapshot, setWeatherSnapshot] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Settings
  const [settings, setSettings] = useState(loadSettings);

  // Game state
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('in_progress'); // 'in_progress', 'won', 'lost'
  const [unlockedCluesCount, setUnlockedCluesCount] = useState(0);

  // UI States & Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Toast / Error banner for Hard Mode violations
  const [toastMessage, setToastMessage] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  // Stats
  const [stats, setStats] = useState(loadStats);

  // Keyboard offset for mobile
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Initialize Settings & Themes on document
  useEffect(() => {
    applySettingsToDOM(settings);
  }, [settings]);

  // First-run tutorial check & debug query check (?debug=1)
  useEffect(() => {
    const hasSeen = localStorage.getItem(HAS_SEEN_TUTORIAL_KEY);
    if (!hasSeen) {
      setIsHowToPlayOpen(true);
      localStorage.setItem(HAS_SEEN_TUTORIAL_KEY, 'true');
    }

    if (window.location.search.includes('debug=1')) {
      setIsDebugOpen(true);
    }
  }, []);

  // Visual Viewport tracking for mobile virtual keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      const diff = window.innerHeight - vv.height;
      setKeyboardOffset(Math.max(0, diff - (vv.offsetTop || 0)));
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Fetch weather and load saved game state
  useEffect(() => {
    let isCancelled = false;
    setLoadingWeather(true);
    setWeatherError(null);

    const initTarget = async () => {
      const city = targetData.city;
      try {
        const snapshot = await fetchWeatherSnapshot(
          city,
          isPractice ? `practice_${city.id}` : targetData.dateStr
        );
        if (isCancelled) return;
        setWeatherSnapshot(snapshot);
      } catch (err) {
        if (isCancelled) return;
        setWeatherError('Weather feed unavailable. Using cached meteorological snapshot.');
      } finally {
        if (!isCancelled) setLoadingWeather(false);
      }

      // Check saved daily game
      if (!isPractice) {
        const saved = loadGameState(targetData.dateStr, city.id);
        if (saved && saved.guesses) {
          setGuesses(saved.guesses);
          setGameStatus(saved.status || 'in_progress');
          const wrongCount = saved.guesses.filter(g => g.distanceKm > 0).length;
          setUnlockedCluesCount(Math.min(5, wrongCount));
          if (saved.status === 'won' || saved.status === 'lost') {
            setIsResultOpen(true);
          }
          return;
        }
      }

      // Fresh state
      setGuesses([]);
      setGameStatus('in_progress');
      setUnlockedCluesCount(0);
    };

    initTarget();

    return () => {
      isCancelled = true;
    };
  }, [targetData, isPractice]);

  // Compute Clue Ladder v2
  const clues = useMemo(() => {
    if (!targetData.city || !weatherSnapshot) return [];
    return generateClues(targetData.city, weatherSnapshot);
  }, [targetData.city, weatherSnapshot]);

  const handleUpdateSettings = (partial) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
    applySettingsToDOM(updated);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setIsShaking(true);
    sound.playError();
    vibrateError();
    setTimeout(() => setIsShaking(false), 400);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Guess submission
  const handleGuess = (guessedCity) => {
    if (gameStatus !== 'in_progress' || !weatherSnapshot) return;

    const targetCity = targetData.city;

    // Hard Mode Check
    if (settings.hardMode) {
      const validation = validateHardModeGuess(guessedCity, targetCity, unlockedCluesCount);
      if (!validation.valid) {
        showToast(validation.reason);
        return;
      }
    }

    const distanceKm = calculateDistanceKm(
      guessedCity.lat,
      guessedCity.lon,
      targetCity.lat,
      targetCity.lon
    );

    const bearing = calculateBearing(
      guessedCity.lat,
      guessedCity.lon,
      targetCity.lat,
      targetCity.lon
    );

    const direction = getBearingDirection(bearing);

    const newGuess = {
      city: guessedCity,
      distanceKm,
      bearing,
      direction,
      timestamp: Date.now()
    };

    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    const isMatch = distanceKm === 0 || guessedCity.id === targetCity.id;

    if (isMatch) {
      // VICTORY
      setGameStatus('won');
      sound.playWin();
      vibrateWin();

      if (!settings.reducedMotion) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (!isPractice) {
        const updatedStats = recordGameCompletion(true, newGuesses.length, targetData.dateStr);
        setStats(updatedStats);
        saveGameState(targetData.dateStr, targetCity.id, {
          guesses: newGuesses,
          status: 'won'
        });
      }

      setTimeout(() => {
        setIsResultOpen(true);
      }, 950);

    } else {
      // WRONG GUESS
      sound.playWrongGuess();
      vibrateWrong();

      const wrongCount = newGuesses.filter(g => g.distanceKm > 0).length;
      const nextUnlocked = Math.min(5, wrongCount);
      setUnlockedCluesCount(nextUnlocked);

      // Play soft clue reveal sound
      setTimeout(() => {
        sound.playClueReveal();
      }, 250);

      if (newGuesses.length >= MAX_GUESSES) {
        // DEFEAT
        setGameStatus('lost');

        if (!isPractice) {
          const updatedStats = recordGameCompletion(false, MAX_GUESSES, targetData.dateStr);
          setStats(updatedStats);
          saveGameState(targetData.dateStr, targetCity.id, {
            guesses: newGuesses,
            status: 'lost'
          });
        }

        setTimeout(() => {
          setIsResultOpen(true);
        }, 950);
      } else {
        // Save intermediate
        if (!isPractice) {
          saveGameState(targetData.dateStr, targetCity.id, {
            guesses: newGuesses,
            status: 'in_progress'
          });
        }
      }
    }
  };

  // Practice mode toggle
  const handleTogglePractice = () => {
    if (isPractice) {
      setIsPractice(false);
      setTargetData(getDailyCity(dateStr));
    } else {
      setIsPractice(true);
      const randomCity = getRandomCity(targetData.city?.id);
      setTargetData({
        city: randomCity,
        index: -1,
        dayNumber: '∞',
        dateStr: 'practice'
      });
    }
  };

  const handleNextPracticeCity = () => {
    const randomCity = getRandomCity(targetData.city?.id);
    setTargetData({
      city: randomCity,
      index: -1,
      dayNumber: '∞',
      dateStr: 'practice'
    });
    setGuesses([]);
    setGameStatus('in_progress');
    setUnlockedCluesCount(0);
    setIsResultOpen(false);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)] select-none">
      {/* 1. Header */}
      <Header
        dayNumber={targetData.dayNumber}
        isPractice={isPractice}
        unlockedCluesCount={unlockedCluesCount}
        totalClues={clues.length}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHowToPlayOpen(true)}
      />

      {/* Weather Fallback or Loading Notice */}
      {weatherError && (
        <div className="bg-[var(--status-warning)] text-black text-xs font-mono py-1 px-4 text-center">
          {weatherError}
        </div>
      )}

      {/* Toast Alert for Hard Mode violations */}
      {toastMessage && (
        <div className="fixed top-14 inset-x-4 z-40 flex justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-md bg-[var(--bg-elevated)] border border-[var(--status-error)] text-[var(--text-primary)] text-xs font-mono font-semibold shadow-xl">
            {toastMessage}
          </div>
        </div>
      )}

      {/* 2. Scrollable Middle Section: Clue Stack & Guess Rows */}
      <main className="flex-1 overflow-y-auto px-2 py-3 flex flex-col justify-start">
        {loadingWeather ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-[var(--text-muted)] space-y-2">
            <div className="w-5 h-5 border-2 border-[var(--border-subtle)] border-t-[var(--accent)] rounded-full animate-spin" />
            <div>Fetching real-time atmospheric telemetry...</div>
          </div>
        ) : (
          <>
            {/* Clue Stack */}
            <ClueStack
              clues={clues}
              unlockedCount={unlockedCluesCount}
            />

            {/* Guess Rows */}
            <GuessRows
              guesses={guesses}
              maxGuesses={MAX_GUESSES}
              isGameOver={gameStatus !== 'in_progress'}
            />
          </>
        )}
      </main>

      {/* 3. Bottom Pinned Section */}
      <footer
        className="w-full transition-transform duration-150 ease-out z-20"
        style={{
          transform: `translateY(-${keyboardOffset}px)`,
          paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))'
        }}
      >
        {gameStatus === 'in_progress' ? (
          <GuessInput
            onGuess={handleGuess}
            disabled={loadingWeather}
            guessedCityIds={guesses.map(g => g.city.id)}
            isShaking={isShaking}
          />
        ) : (
          <div className="px-4 max-w-lg mx-auto w-full">
            <button
              onClick={() => setIsResultOpen(true)}
              className="w-full py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-mono text-xs font-bold tracking-wider hover:bg-[var(--accent-hover)] transition-all touch-target active:scale-95"
            >
              VIEW RESULTS & SHARE BULLETIN
            </button>
          </div>
        )}
      </footer>

      {/* Modals & Dialogs */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isPractice={isPractice}
        onTogglePractice={handleTogglePractice}
        onOpenDebug={() => setIsDebugOpen(true)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <ResultModal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        isWon={gameStatus === 'won'}
        city={targetData.city}
        weather={weatherSnapshot}
        guesses={guesses}
        dayNumber={targetData.dayNumber}
        isPractice={isPractice}
        onPlayAgain={isPractice ? handleNextPracticeCity : handleTogglePractice}
      />

      <SolvabilityDebugPanel
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        targetCity={targetData.city}
        weatherSnapshot={weatherSnapshot}
        clues={clues}
        unlockedCluesCount={unlockedCluesCount}
        onSetUnlockedClues={(cnt) => setUnlockedCluesCount(cnt)}
      />
    </div>
  );
}
