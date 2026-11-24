import citiesData from './cities.json' with { type: 'json' };
import { City, Clue, WeatherSnapshot, generateClues } from './clues.js';
import { fetchWeatherForCity } from './weather.js';
import { calculateDistanceKm, calculateBearing, calculateProximity } from './geo.js';

export const cities: City[] = citiesData as City[];

const EPOCH_DATE = new Date('2026-01-01T00:00:00Z');

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNumber(dateStr = getTodayDateString()): number {
  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  const diffTime = targetDate.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getDailyCity(dateStr = getTodayDateString()): {
  city: City;
  index: number;
  dayNumber: number;
  dateStr: string;
} {
  const hash = hashString(dateStr + '_weather_gg_v1');
  const index = hash % cities.length;
  return {
    city: cities[index],
    index,
    dayNumber: getDayNumber(dateStr),
    dateStr
  };
}

export function getRandomCity(excludeId?: string): City {
  const available = excludeId ? cities.filter((c) => c.id !== excludeId) : cities;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

export interface DailyPuzzleState {
  dateStr: string;
  dayNumber: number;
  expiresAt: string;
  clues: Clue[];
  weather: WeatherSnapshot;
  city: City;
}

let cachedDailyPuzzle: DailyPuzzleState | null = null;

export async function getOrLoadDailyPuzzle(): Promise<DailyPuzzleState> {
  const todayStr = getTodayDateString();

  if (cachedDailyPuzzle && cachedDailyPuzzle.dateStr === todayStr) {
    return cachedDailyPuzzle;
  }

  const { city, dayNumber } = getDailyCity(todayStr);
  const weather = await fetchWeatherForCity(city, `daily_${todayStr}`);
  const clues = generateClues(city, weather);

  // Compute UTC midnight expiration
  const now = new Date();
  const tomorrowUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );

  cachedDailyPuzzle = {
    dateStr: todayStr,
    dayNumber,
    expiresAt: tomorrowUTC.toISOString(),
    clues,
    weather,
    city
  };

  return cachedDailyPuzzle;
}

// In-memory global stats accumulator
export interface GlobalStats {
  gamesPlayed: number;
  gamesWon: number;
  distribution: Record<number, number>;
}

export const globalStats: GlobalStats = {
  gamesPlayed: 1420,
  gamesWon: 1198,
  distribution: { 1: 34, 2: 182, 3: 412, 4: 310, 5: 165, 6: 95 }
};

export function recordGlobalWin(guessCount: number) {
  globalStats.gamesPlayed += 1;
  globalStats.gamesWon += 1;
  globalStats.distribution[guessCount] = (globalStats.distribution[guessCount] || 0) + 1;
}

export function recordGlobalLoss() {
  globalStats.gamesPlayed += 1;
}
