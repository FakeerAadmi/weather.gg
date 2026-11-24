const STATS_KEY = 'weather_gg_stats_v1';
const PREFS_KEY = 'weather_gg_prefs_v1';
const GAME_STATE_PREFIX = 'weather_gg_game_state_';

export function getInitialStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 },
    lastCompletedDate: null
  };
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      return { ...getInitialStats(), ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load stats:', e);
  }
  return getInitialStats();
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save stats:', e);
  }
}

export function recordGameCompletion(isWon, guessCount, dateStr) {
  const stats = loadStats();
  if (stats.lastCompletedDate === dateStr) {
    return stats; // Already recorded today
  }

  stats.gamesPlayed += 1;
  stats.lastCompletedDate = dateStr;

  if (isWon) {
    stats.gamesWon += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1;
  } else {
    stats.currentStreak = 0;
    stats.guessDistribution.fail = (stats.guessDistribution.fail || 0) + 1;
  }

  saveStats(stats);
  return stats;
}

export function loadGameState(dateStr, cityId) {
  const key = `${GAME_STATE_PREFIX}${dateStr}_${cityId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load game state:', e);
  }
  return null;
}

export function saveGameState(dateStr, cityId, state) {
  const key = `${GAME_STATE_PREFIX}${dateStr}_${cityId}`;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // default
  }
  return {
    unitTemp: 'C', // 'C' or 'F'
    unitDist: 'km', // 'km' or 'mi'
    soundEnabled: false
  };
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    // ignore
  }
}
