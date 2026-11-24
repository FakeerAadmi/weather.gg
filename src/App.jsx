import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import SkyView from './components/SkyView';
import TopBar from './components/TopBar';
import GuessInput from './components/GuessInput';
import GuessFeed from './components/GuessFeed';
import ClueDrawer from './components/ClueDrawer';
import EndModal from './components/EndModal';
import StatsModal from './components/StatsModal';
import HowToPlayModal from './components/HowToPlayModal';

import cities from './data/cities.json';
import { getTodayDateString, getDailyCity, getRandomCity } from './utils/gameSeed';
import { fetchWeatherSnapshot } from './utils/weatherApi';
import { calculateDistanceKm, calculateBearing, getBearingDirection } from './utils/geo';
import { generateClues, getFogDensityForGuessCount } from './utils/clues';
import { loadStats, recordGameCompletion, loadGameState, saveGameState, loadPreferences, savePreferences } from './utils/storage';
import { ambientAudio } from './utils/ambientAudio';
import { Trophy } from 'lucide-react';

const MAX_GUESSES = 6;

export default function App() {
  const [dateStr] = useState(getTodayDateString());
  const [isPractice, setIsPractice] = useState(false);
  const [targetData, setTargetData] = useState(() => getDailyCity(getTodayDateString()));
  const [weatherSnapshot, setWeatherSnapshot] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Game state
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('in_progress'); // 'in_progress', 'won', 'lost'
  const [unlockedCluesCount, setUnlockedCluesCount] = useState(0);
  const [hasNewClueNotification, setHasNewClueNotification] = useState(false);

  // Modals & Drawers
  const [isCluesOpen, setIsCluesOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Audio & Preferences
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [stats, setStats] = useState(loadStats);

  // Visual viewport keyboard offset
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Sky renderer reference for direct calls
  const skyRendererRef = useRef(null);

  // Listen to visualViewport resize/scroll to dynamically lift the input bar above the mobile virtual keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      // Calculate how much keyboard has encroached on the screen
      const currentHeight = vv.height;
      const fullHeight = window.innerHeight;
      const diff = fullHeight - currentHeight;
      const offset = Math.max(0, diff - (vv.offsetTop || 0));
      setKeyboardOffset(offset);
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Load weather and saved state whenever target city changes
  useEffect(() => {
    let isCancelled = false;
    setLoadingWeather(true);

    const initTarget = async () => {
      const city = targetData.city;
      const snapshot = await fetchWeatherSnapshot(city, isPractice ? `practice_${city.id}` : targetData.dateStr);

      if (isCancelled) return;
      setWeatherSnapshot(snapshot);
      setLoadingWeather(false);

      // Check saved game state for today
      if (!isPractice) {
        const saved = loadGameState(targetData.dateStr, city.id);
        if (saved && saved.guesses) {
          setGuesses(saved.guesses);
          setGameStatus(saved.status || 'in_progress');
          const wrongCount = saved.guesses.filter(g => g.distanceKm > 0).length;
          setUnlockedCluesCount(Math.min(5, wrongCount));
          if (saved.status === 'won' || saved.status === 'lost') {
            setIsEndModalOpen(true);
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

  // Compute clues
  const clues = useMemo(() => {
    if (!targetData.city || !weatherSnapshot) return [];
    return generateClues(targetData.city, weatherSnapshot);
  }, [targetData.city, weatherSnapshot]);

  // Calculate fog density
  const wrongGuessesCount = guesses.filter(g => g.distanceKm > 0).length;
  const isComplete = gameStatus === 'won' || gameStatus === 'lost';
  const fogDensity = getFogDensityForGuessCount(wrongGuessesCount, isComplete);

  // Sync ambient audio with weather
  useEffect(() => {
    if (weatherSnapshot && weatherSnapshot.current && isAudioPlaying) {
      ambientAudio.updateWeather({
        windSpeed: weatherSnapshot.current.wind_speed_10m,
        precipitation: weatherSnapshot.current.precipitation
      });
    }
  }, [weatherSnapshot, isAudioPlaying]);

  // Handle Guess Submission
  const handleGuess = (guessedCity) => {
    if (gameStatus !== 'in_progress' || !weatherSnapshot) return;

    const targetCity = targetData.city;
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
      // VICTORY!
      setGameStatus('won');
      confetti({
        particleCount: 120,
        spread: 85,
        origin: { y: 0.65 }
      });

      if (!isPractice) {
        const updatedStats = recordGameCompletion(true, newGuesses.length, targetData.dateStr);
        setStats(updatedStats);
        saveGameState(targetData.dateStr, targetCity.id, {
          guesses: newGuesses,
          status: 'won'
        });
      }

      setTimeout(() => {
        setIsEndModalOpen(true);
      }, 1100);

    } else {
      // Wrong guess: check if game over
      const wrongCount = newGuesses.filter(g => g.distanceKm > 0).length;
      setUnlockedCluesCount(Math.min(5, wrongCount));
      setHasNewClueNotification(true);

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
          setIsEndModalOpen(true);
        }, 1100);
      } else {
        // Save intermediate state
        if (!isPractice) {
          saveGameState(targetData.dateStr, targetCity.id, {
            guesses: newGuesses,
            status: 'in_progress'
          });
        }
      }
    }
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const active = ambientAudio.toggle();
    setIsAudioPlaying(active);
    if (active && weatherSnapshot && weatherSnapshot.current) {
      ambientAudio.updateWeather({
        windSpeed: weatherSnapshot.current.wind_speed_10m,
        precipitation: weatherSnapshot.current.precipitation
      });
    }
  };

  // Switch between Daily Puzzle and Free Flight Practice
  const handleTogglePractice = () => {
    if (isPractice) {
      // Switch back to Daily
      setIsPractice(false);
      setTargetData(getDailyCity(dateStr));
    } else {
      // Switch to Practice
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
    setIsEndModalOpen(false);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden overflow-x-hidden bg-black select-none font-sans">
      {/* Zero-Asset Procedural Sky Board */}
      <SkyView
        weatherSnapshot={weatherSnapshot}
        fogLevel={fogDensity}
        onReady={(renderer) => {
          skyRendererRef.current = renderer;
        }}
      />

      {/* Atmospheric Top Navigation */}
      <TopBar
        dayNumber={targetData.dayNumber}
        isPractice={isPractice}
        onTogglePractice={handleTogglePractice}
        unlockedCluesCount={unlockedCluesCount}
        totalClues={clues.length}
        hasNewClue={hasNewClueNotification}
        onOpenClues={() => {
          setIsCluesOpen(true);
          setHasNewClueNotification(false);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
      />

      {/* Game Content Floating Over Sky, pinned low */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center pointer-events-none transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(-${keyboardOffset}px)`,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
        }}
      >
        {/* Previous Guesses Log */}
        <GuessFeed
          guesses={guesses}
          maxGuesses={MAX_GUESSES}
          isGameOver={isComplete}
        />

        {/* Input Bar */}
        {gameStatus === 'in_progress' ? (
          <GuessInput
            onGuess={handleGuess}
            disabled={loadingWeather}
            guessedCityIds={guesses.map(g => g.city.id)}
          />
        ) : (
          /* When Game Completed: Floating Action to re-open Bulletin */
          <div className="pointer-events-auto animate-slide-up px-3 sm:px-4 w-full max-w-lg">
            <button
              onClick={() => setIsEndModalOpen(true)}
              className="w-full py-3 rounded-full glass-pill border-white/20 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 hover:border-white/40 shadow-xl transition-all active:scale-95"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>View Weather Dispatch & Share Card</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <ClueDrawer
        isOpen={isCluesOpen}
        onClose={() => setIsCluesOpen(false)}
        clues={clues}
        unlockedCount={unlockedCluesCount}
        fogPercent={fogDensity * 100}
      />

      <EndModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        isWon={gameStatus === 'won'}
        city={targetData.city}
        weather={weatherSnapshot}
        guesses={guesses}
        dayNumber={targetData.dayNumber}
        isPractice={isPractice}
        onPlayAgain={isPractice ? handleNextPracticeCity : handleTogglePractice}
        onInspectSky={() => setIsEndModalOpen(false)}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <HowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
