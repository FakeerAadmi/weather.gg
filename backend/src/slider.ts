import { cities, getTodayDateString, getDayNumber, getRandomCity } from './puzzle.js';
import { fetchWeatherForCity } from './weather.js';
import { City, WeatherSnapshot, getConditionGroup, getTimePhaseHuman } from './clues.js';

export interface SliderRoundPrompt {
  roundIndex: number;
  city: {
    id: string;
    name: string;
    country: string;
    continent: string;
  };
  localTime: string;
  timePhase: string;
  conditionGroup: string;
  weatherCode: number;
  isDay: number;
}

export interface SliderDailyChallenge {
  dateStr: string;
  dayNumber: number;
  expiresAt: string;
  rounds: SliderRoundPrompt[];
  _secretActualTemps: number[]; // Kept server-side
}

let cachedSliderChallenge: SliderDailyChallenge | null = null;

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 5 seeded cities across varied continents for a dynamic global challenge
export function getDailySliderCities(dateStr = getTodayDateString()): City[] {
  const selected: City[] = [];
  const usedContinents = new Set<string>();

  for (let offset = 0; offset < 40 && selected.length < 5; offset++) {
    const hash = hashString(`${dateStr}_slider_v1_round_${offset}`);
    const city = cities[hash % cities.length];

    if (!selected.some((c) => c.id === city.id)) {
      if (!usedContinents.has(city.continent) || selected.length >= 4) {
        selected.push(city);
        usedContinents.add(city.continent);
      }
    }
  }

  // Fallback to fill up to 5 if needed
  while (selected.length < 5) {
    const fallback = getRandomCity();
    if (!selected.some((c) => c.id === fallback.id)) {
      selected.push(fallback);
    }
  }

  return selected;
}

export async function getOrLoadDailySliderChallenge(): Promise<SliderDailyChallenge> {
  const todayStr = getTodayDateString();

  if (cachedSliderChallenge && cachedSliderChallenge.dateStr === todayStr) {
    return cachedSliderChallenge;
  }

  const selectedCities = getDailySliderCities(todayStr);
  const prompts: SliderRoundPrompt[] = [];
  const secretTemps: number[] = [];

  for (let idx = 0; idx < selectedCities.length; idx++) {
    const city = selectedCities[idx];
    const weather = await fetchWeatherForCity(city, `slider_${todayStr}_${city.id}`);
    const current = weather.current;
    const tempC = Math.round(current.temperature_2m);
    secretTemps.push(tempC);

    const localTime = current.time ? current.time.slice(11, 16) : '12:00';
    const timePhase = getTimePhaseHuman(current.time, current.is_day);
    const conditionGroup = getConditionGroup(current.weather_code);

    prompts.push({
      roundIndex: idx,
      city: {
        id: city.id,
        name: city.name,
        country: city.country,
        continent: city.continent
      },
      localTime,
      timePhase,
      conditionGroup,
      weatherCode: current.weather_code,
      isDay: current.is_day
    });
  }

  const now = new Date();
  const tomorrowUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );

  cachedSliderChallenge = {
    dateStr: todayStr,
    dayNumber: getDayNumber(todayStr),
    expiresAt: tomorrowUTC.toISOString(),
    rounds: prompts,
    _secretActualTemps: secretTemps
  };

  return cachedSliderChallenge;
}

/**
 * Dialed-grade scientific precision scoring formula:
 * Difference 0°C -> 10.0 (Perfect Dial)
 * Difference 1°C -> 9.4
 * Difference 2°C -> 8.6
 * Difference 3°C -> 7.8
 * Difference 4°C -> 6.8
 * Difference 6°C -> 4.8
 * Difference 10°C+ -> 0.0
 */
export function calculateDialScore(diffC: number): number {
  const abs = Math.abs(diffC);
  if (abs === 0) return 10.0;
  const penalty = Math.pow(abs, 1.18) * 0.62;
  const score = Math.max(0, 10 - penalty);
  return Math.round(score * 10) / 10;
}
