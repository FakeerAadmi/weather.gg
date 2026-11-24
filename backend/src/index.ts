import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import {
  cities,
  getOrLoadDailyPuzzle,
  getRandomCity,
  globalStats,
  recordGlobalWin,
  recordGlobalLoss
} from './puzzle.js';
import {
  getOrCreatePlayer,
  recordPlayerDailyResult,
  getDailySummary
} from './db.js';
import { calculateDistanceKm, calculateBearing, calculateProximity } from './geo.js';
import { fetchWeatherForCity } from './weather.js';
import { generateClues, City, WeatherSnapshot } from './clues.js';

const app = new Hono();

// Enable CORS for frontend
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })
);

// 1. Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'aether-edge-api', time: new Date().toISOString() });
});

// 2. Daily Puzzle Metadata (Authoritative: Target Identity is strictly hidden!)
app.get('/api/puzzle/today', async (c) => {
  try {
    const daily = await getOrLoadDailyPuzzle();

    // Sanitized cities list for client autocomplete (id, name, country, continent only; no lat/lon!)
    const safeCities = cities.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      continent: city.continent
    }));

    return c.json({
      dayNumber: daily.dayNumber,
      dateStr: daily.dateStr,
      expiresAt: daily.expiresAt,
      // Only Clue 0 is revealed initially
      initialClue: daily.clues[0],
      totalClues: daily.clues.length,
      cities: safeCities
    });
  } catch (err: any) {
    console.error('Failed to get today puzzle:', err);
    return c.json({ error: 'Failed to retrieve daily puzzle' }, 500);
  }
});

// 3. Daily Guess Evaluation (Authoritative secret comparison with percentile ranking)
app.post('/api/guess', async (c) => {
  try {
    const body = await c.req.json() as { guessCityId: string; guessCount?: number; playerId?: string };
    const { guessCityId, guessCount = 1 } = body;
    const playerId = c.req.header('x-player-token') || body.playerId || 'anonymous';

    if (!guessCityId) {
      return c.json({ error: 'Missing guessCityId' }, 400);
    }

    const guessedCity = cities.find((city) => city.id === guessCityId);
    if (!guessedCity) {
      return c.json({ error: 'City not recognized in database' }, 404);
    }

    const daily = await getOrLoadDailyPuzzle();
    const targetCity = daily.city;

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

    const proximity = calculateProximity(distanceKm);
    const isMatch = distanceKm === 0 || guessedCity.id === targetCity.id;

    if (isMatch) {
      recordGlobalWin(guessCount);
      const record = recordPlayerDailyResult({
        playerId,
        dateStr: daily.dateStr,
        dayNumber: daily.dayNumber,
        isWon: true,
        guessCount,
        guesses: [],
        completedAt: Date.now()
      });

      // VICTORY: Reveal target city, weather telemetry, and daily percentile rank
      return c.json({
        match: true,
        distanceKm: 0,
        bearing: 0,
        proximity: 100,
        revealedCity: targetCity,
        weather: daily.weather,
        allClues: daily.clues,
        percentile: record.percentile,
        totalPlayersToday: record.totalPlayersToday,
        playerProfile: record.player
      });
    }

    // WRONG GUESS: Unlock next progressive clue
    const nextClueIndex = Math.min(daily.clues.length - 1, guessCount);
    const nextClue = daily.clues[nextClueIndex];

    const isGameOver = guessCount >= 6;
    let endResultRecord: any = null;
    if (isGameOver) {
      recordGlobalLoss();
      endResultRecord = recordPlayerDailyResult({
        playerId,
        dateStr: daily.dateStr,
        dayNumber: daily.dayNumber,
        isWon: false,
        guessCount: 6,
        guesses: [],
        completedAt: Date.now()
      });
    }

    return c.json({
      match: false,
      distanceKm,
      bearing,
      proximity,
      nextClue,
      unlockedCluesCount: nextClueIndex + 1,
      isGameOver,
      ...(isGameOver ? {
        revealedCity: targetCity,
        weather: daily.weather,
        percentile: endResultRecord?.percentile ?? 10,
        totalPlayersToday: endResultRecord?.totalPlayersToday ?? 1,
        playerProfile: endResultRecord?.player
      } : {})
    });
  } catch (err: any) {
    console.error('Error handling guess:', err);
    return c.json({ error: 'Internal guess calculation error' }, 500);
  }
});

// 4. Practice Mode Sessions (In-memory tokenized practice)
interface PracticeSession {
  targetCity: City;
  weather: WeatherSnapshot;
  clues: any[];
  guesses: number;
}
const practiceSessions = new Map<string, PracticeSession>();

app.post('/api/practice/start', async (c) => {
  try {
    const targetCity = getRandomCity();
    const weather = await fetchWeatherForCity(targetCity, `practice_${targetCity.id}_${Date.now()}`);
    const clues = generateClues(targetCity, weather);

    const sessionId = `prac_${Math.random().toString(36).substring(2, 11)}`;
    practiceSessions.set(sessionId, {
      targetCity,
      weather,
      clues,
      guesses: 0
    });

    return c.json({
      sessionId,
      initialClue: clues[0],
      totalClues: clues.length
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to create practice flight' }, 500);
  }
});

app.post('/api/practice/guess', async (c) => {
  try {
    const body = await c.req.json() as { sessionId: string; guessCityId: string };
    const { sessionId, guessCityId } = body;

    const session = practiceSessions.get(sessionId);
    if (!session) {
      return c.json({ error: 'Practice session expired or not found' }, 404);
    }

    const guessedCity = cities.find((c) => c.id === guessCityId);
    if (!guessedCity) {
      return c.json({ error: 'City not recognized' }, 404);
    }

    session.guesses += 1;
    const target = session.targetCity;

    const distanceKm = calculateDistanceKm(
      guessedCity.lat,
      guessedCity.lon,
      target.lat,
      target.lon
    );
    const bearing = calculateBearing(
      guessedCity.lat,
      guessedCity.lon,
      target.lat,
      target.lon
    );
    const proximity = calculateProximity(distanceKm);
    const isMatch = distanceKm === 0 || guessedCity.id === target.id;

    if (isMatch) {
      practiceSessions.delete(sessionId);
      return c.json({
        match: true,
        distanceKm: 0,
        bearing: 0,
        proximity: 100,
        revealedCity: target,
        weather: session.weather
      });
    }

    const nextClueIndex = Math.min(session.clues.length - 1, session.guesses);
    const isGameOver = session.guesses >= 6;

    if (isGameOver) {
      practiceSessions.delete(sessionId);
    }

    return c.json({
      match: false,
      distanceKm,
      bearing,
      proximity,
      nextClue: session.clues[nextClueIndex],
      unlockedCluesCount: nextClueIndex + 1,
      isGameOver,
      ...(isGameOver ? { revealedCity: target, weather: session.weather } : {})
    });
  } catch (err: any) {
    return c.json({ error: 'Error calculating practice guess' }, 500);
  }
});

// 5. Global Stats & Daily Summary Endpoints
app.get('/api/daily/summary', async (c) => {
  const daily = await getOrLoadDailyPuzzle();
  const summary = getDailySummary(daily.dateStr);
  return c.json(summary);
});

app.post('/api/player/sync', async (c) => {
  try {
    const body = await c.req.json() as { playerId: string };
    if (!body.playerId) {
      return c.json({ error: 'Missing playerId' }, 400);
    }
    const player = getOrCreatePlayer(body.playerId);
    return c.json(player);
  } catch (err: any) {
    return c.json({ error: 'Failed to sync player profile' }, 500);
  }
});

app.get('/api/stats', (c) => {
  const winRate =
    globalStats.gamesPlayed > 0
      ? Math.round((globalStats.gamesWon / globalStats.gamesPlayed) * 100)
      : 0;

  return c.json({
    gamesPlayed: globalStats.gamesPlayed,
    gamesWon: globalStats.gamesWon,
    winRate,
    distribution: globalStats.distribution
  });
});

const PORT = Number(process.env.PORT) || 3001;

console.log(`[AETHER Backend] Starting Hono HTTP server on port ${PORT}...`);
serve({
  fetch: app.fetch,
  port: PORT
});
