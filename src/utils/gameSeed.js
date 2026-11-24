import cities from '../data/cities.json';

const EPOCH_DATE = new Date('2026-01-01T00:00:00Z');

/**
 * Returns formatted date string in YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates game day number since epoch
 */
export function getDayNumber(dateStr = getTodayDateString()) {
  const targetDate = new Date(`${dateStr}T00:00:00Z`);
  const diffTime = targetDate.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Deterministic hash function (DJB2 variant) for string
 */
export function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets daily city based on date string
 */
export function getDailyCity(dateStr = getTodayDateString()) {
  const hash = hashString(dateStr + "_weather_gg_v1");
  const index = hash % cities.length;
  return {
    city: cities[index],
    index,
    dayNumber: getDayNumber(dateStr),
    dateStr
  };
}

/**
 * Get city for practice mode by id or random
 */
export function getRandomCity(excludeId = null) {
  const available = excludeId ? cities.filter(c => c.id !== excludeId) : cities;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}
