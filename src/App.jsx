import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import Hub from './components/Hub';
import ClueDisplay from './components/ClueDisplay';
import GuessList from './components/GuessList';
import FloatingInput from './components/FloatingInput';
import EndTakeover from './components/EndTakeover';
import StatsModal from './components/StatsModal';
import HowToPlayModal from './components/HowToPlayModal';
import SolvabilityDebugPanel from './components/SolvabilityDebugPanel';

import cities from './data/cities.json';
import { getTodayDateString, getDailyCity, getRandomCity } from './utils/gameSeed';
import { fetchWeatherSnapshot } from './utils/weatherApi';
import { calculateDistanceKm, calculateBearing, getBearingDirection } from './utils/geo';
import { generateClues } from './utils/clues';
import { loadStats, recordGameCompletion, loadGameState, saveGameState } from './utils/storage';
import { loadSettings, saveSettings, applySettingsToDOM } from './utils/settings';
import { sound } from './utils/sound';
import { vibrateWin, vibrateWrong, vibrateError, vibrateTap } from './utils/haptics';
import { validateHardModeGuess } from './utils/hardMode';

const MAX_GUESSES = 6;
const HAS_SEEN_TUTORIAL_KEY = 'aether_has_seen_tutorial_v2';

export default function App() {
  const [dateStr] = useState(getTodayDateString());
  const [view, setView] = useState('hub'); // 'hub' | 'game'
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
  const [unlockedCluesCount, setUnlockedCluesCount] = useState(1); // Clue 0 is visible immediately on load

  // UI States & Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEndTakeoverOpen, setIsEndTakeoverOpen] = useState(false);
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
          setUnlockedCluesCount(Math.min(5, 1 + wrongCount));
          if (saved.status === 'won' || saved.status === 'lost') {
            setIsEndTakeoverOpen(true);
          }
          return;
        }
      }

      // Fresh state
      setGuesses([]);
      setGameStatus('in_progress');
      setUnlockedCluesCount(1);
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

  const handleToggleSound = () => {
    const nextSound = !settings.sound;
    const updated = { ...settings, sound: nextSound };
    setSettings(updated);
    saveSettings(updated);
    sound.setEnabled(nextSound);
  };

  const handleToggleTheme = () => {
    const currentTheme = settings.theme || 'dark';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    const updated = { ...settings, theme: nextTheme };
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
          particleCount: 90,
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
        setIsEndTakeoverOpen(true);
      }, 1000);

    } else {
      // WRONG GUESS: soft pop + vibration
      sound.playPop();
      vibrateWrong();

      const wrongCount = newGuesses.filter(g => g.distanceKm > 0).length;
      const nextUnlocked = Math.min(5, 1 + wrongCount);
      setUnlockedCluesCount(nextUnlocked);

      // Play soft rising clue reveal sound
      setTimeout(() => {
        sound.playRisingClue();
      }, 350);

      if (newGuesses.length >= MAX_GUESSES) {
        // DEFEAT
        setGameStatus('lost');
        sound.playLoss();

        if (!isPractice) {
          const updatedStats = recordGameCompletion(false, MAX_GUESSES, targetData.dateStr);
          setStats(updatedStats);
          saveGameState(targetData.dateStr, targetCity.id, {
            guesses: newGuesses,
            status: 'lost'
          });
        }

        setTimeout(() => {
          setIsEndTakeoverOpen(true);
        }, 1000);
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

  // Practice mode handler
  const handleStartPractice = () => {
    setIsPractice(true);
    const randomCity = getRandomCity(targetData.city?.id);
    setTargetData({
      city: randomCity,
      index: -1,
      dayNumber: '∞',
      dateStr: 'practice'
    });
    setGuesses([]);
    setGameStatus('in_progress');
    setUnlockedCluesCount(1);
    setView('game');
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
    setUnlockedCluesCount(1);
    setIsEndTakeoverOpen(false);
  };

  const handleStartDaily = () => {
    setIsPractice(false);
    setTargetData(getDailyCity(dateStr));
    setView('game');
  };

  // RENDER: Hub View
  if (view === 'hub') {
    return (
      <div className="w-full h-full">
        <Hub
          dayNumber={targetData.dayNumber}
          hasPlayedDaily={guesses.length > 0}
          dailyCompleted={!isPractice && (gameStatus === 'won' || gameStatus === 'lost')}
          onPlayDaily={handleStartDaily}
          onPlayPractice={handleStartPractice}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenHelp={() => setIsHowToPlayOpen(true)}
        />

        <StatsModal
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          stats={stats}
        />

        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
        />
      </div>
    );
  }

  // RENDER: Game View
  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)] select-none">
      {/* 1. Minimal Header */}
      <Header
        dayNumber={targetData.dayNumber}
        isPractice={isPractice}
        guessesCount={guesses.length}
        maxGuesses={MAX_GUESSES}
        soundEnabled={settings.sound}
        onToggleSound={handleToggleSound}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHowToPlayOpen(true)}
        onReturnHub={() => setView('hub')}
      />

      {/* Weather Fallback or Loading Notice */}
      {weatherError && (
        <div className="bg-[var(--status-warning)] text-black text-xs py-1 px-4 text-center">
          {weatherError}
        </div>
      )}

      {/* Toast Alert for Hard Mode violations */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-40 flex justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full surface-pill border border-[var(--status-error)] text-[var(--text-primary)] text-xs font-medium shadow-xl">
            {toastMessage}
          </div>
        </div>
      )}

      {/* 2. Scrollable Middle Section: Clue Stack & Borderless Guess Rows */}
      <main className="flex-1 overflow-y-auto px-2 py-4 flex flex-col justify-start">
        {loadingWeather ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--text-muted)] space-y-3">
            <div className="w-5 h-5 border-2 border-[var(--border-subtle)] border-t-[var(--accent)] rounded-full animate-spin" />
            <div className="text-sm font-medium">Reading the atmosphere...</div>
          </div>
        ) : (
          <>
            {/* Clue Display (Clue 0 immediately visible, newest largest, faint skeleton for unrevealed) */}
            <ClueDisplay
              clues={clues}
              unlockedCount={unlockedCluesCount}
            />

            {/* Guess Rows (Borderless, rolling numbers, spring compass arrow, proximity %) */}
            <GuessList
              guesses={guesses}
            />
          </>
        )}
      </main>

      {/* 3. Bottom Pinned Section */}
      {gameStatus === 'in_progress' ? (
        <FloatingInput
          onGuess={handleGuess}
          disabled={loadingWeather}
          guessedCityIds={guesses.map(g => g.city.id)}
          keyboardOffset={keyboardOffset}
        />
      ) : (
        <footer
          className="w-full transition-transform duration-150 ease-out z-20"
          style={{
            transform: `translateY(-${keyboardOffset}px)`,
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
          }}
        >
          <div className="px-4 max-w-lg mx-auto w-full">
            <button
              onClick={() => {
                sound.playTap();
                vibrateTap();
                setIsEndTakeoverOpen(true);
              }}
              className="w-full h-12 rounded-full surface-pill text-[var(--text-primary)] font-semibold text-sm hover:border-[var(--border-strong)] transition-all touch-target active:scale-[0.98] shadow-sm flex items-center justify-center"
            >
              View summary & share bulletin
            </button>
          </div>
        </footer>
      )}

      {/* End Game Takeover Screen */}
      <EndTakeover
        isOpen={isEndTakeoverOpen}
        onClose={() => setIsEndTakeoverOpen(false)}
        isWon={gameStatus === 'won'}
        city={targetData.city}
        weather={weatherSnapshot}
        guesses={guesses}
        dayNumber={targetData.dayNumber}
        isPractice={isPractice}
        streak={stats.currentStreak}
        onPlayAgain={isPractice ? handleNextPracticeCity : handleStartPractice}
      />

      {/* Modals & Dialogs */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      {/* Solvability Debug Panel (behind ?debug=1) */}
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
