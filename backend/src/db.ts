import fs from 'node:fs';
import path from 'node:path';

export interface PlayerProfile {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: Record<number, number>;
}

export interface DailyResultRecord {
  playerId: string;
  dateStr: string;
  dayNumber: number;
  isWon: boolean;
  guessCount: number;
  guesses: Array<{
    cityId: string;
    cityName: string;
    distanceKm: number;
    bearing: number;
  }>;
  completedAt: number;
}

interface DBState {
  players: Record<string, PlayerProfile>;
  dailyResults: Record<string, DailyResultRecord[]>; // Keyed by dateStr
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'aether_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbState: DBState = {
  players: {},
  dailyResults: {}
};

// Seed baseline realistic global benchmarks if empty
function initializeSeedData() {
  const today = '2026-11-24';
  if (!dbState.dailyResults[today]) {
    dbState.dailyResults[today] = [];
    // Seed benchmark sample distribution
    const seedDist = [
      { count: 1, freq: 42 },
      { count: 2, freq: 178 },
      { count: 3, freq: 395 },
      { count: 4, freq: 312 },
      { count: 5, freq: 160 },
      { count: 6, freq: 88 }
    ];
    let idCounter = 1;
    for (const item of seedDist) {
      for (let i = 0; i < item.freq; i++) {
        dbState.dailyResults[today].push({
          playerId: `seed_player_${idCounter++}`,
          dateStr: today,
          dayNumber: 327,
          isWon: true,
          guessCount: item.count,
          guesses: [],
          completedAt: Date.now() - Math.floor(Math.random() * 36000000)
        });
      }
    }
  }
}

// Load database from disk
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbState = JSON.parse(raw);
  }
} catch (e) {
  console.warn('[DB] Failed to parse existing db file, initializing fresh:', e);
}

initializeSeedData();

function persistToDisk() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (e) {
    console.error('[DB] Failed to persist db to disk:', e);
  }
}

export function getOrCreatePlayer(playerId: string): PlayerProfile {
  if (dbState.players[playerId]) {
    dbState.players[playerId].lastActiveAt = Date.now();
    return dbState.players[playerId];
  }

  const newPlayer: PlayerProfile = {
    id: playerId,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    currentStreak: 0,
    maxStreak: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  };

  dbState.players[playerId] = newPlayer;
  persistToDisk();
  return newPlayer;
}

export function recordPlayerDailyResult(record: DailyResultRecord): {
  player: PlayerProfile;
  percentile: number;
  totalPlayersToday: number;
} {
  const { playerId, dateStr, isWon, guessCount } = record;
  const player = getOrCreatePlayer(playerId);

  if (!dbState.dailyResults[dateStr]) {
    dbState.dailyResults[dateStr] = [];
  }

  // Prevent duplicate submissions for the same day by the same player
  const existingIndex = dbState.dailyResults[dateStr].findIndex((r) => r.playerId === playerId);
  if (existingIndex >= 0) {
    dbState.dailyResults[dateStr][existingIndex] = record;
  } else {
    dbState.dailyResults[dateStr].push(record);
    player.gamesPlayed += 1;
    if (isWon) {
      player.gamesWon += 1;
      player.currentStreak += 1;
      if (player.currentStreak > player.maxStreak) {
        player.maxStreak = player.currentStreak;
      }
      player.guessDistribution[guessCount] = (player.guessDistribution[guessCount] || 0) + 1;
    } else {
      player.currentStreak = 0;
    }
  }

  persistToDisk();

  // Compute daily percentile
  const todayResults = dbState.dailyResults[dateStr];
  const total = todayResults.length;

  if (!isWon) {
    return { player, percentile: 10, totalPlayersToday: total };
  }

  // Count how many players performed worse (more guesses or failed)
  const worseCount = todayResults.filter((r) => !r.isWon || r.guessCount > guessCount).length;
  const sameCount = todayResults.filter((r) => r.isWon && r.guessCount === guessCount).length;

  // Mid-percentile formula
  const percentile = Math.min(99, Math.max(1, Math.round(((worseCount + sameCount * 0.5) / total) * 100)));

  return { player, percentile, totalPlayersToday: total };
}

export function getDailySummary(dateStr: string) {
  const results = dbState.dailyResults[dateStr] || [];
  const total = results.length;
  const won = results.filter((r) => r.isWon).length;

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const r of results) {
    if (r.isWon && dist[r.guessCount] !== undefined) {
      dist[r.guessCount] += 1;
    }
  }

  return {
    dateStr,
    totalPlayers: total,
    gamesWon: won,
    winRate: total > 0 ? Math.round((won / total) * 100) : 0,
    distribution: dist
  };
}
