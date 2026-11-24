/**
 * apiClient.js
 * Authoritative backend communication client with seamless offline/static fallback.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export function getPlayerToken() {
  const KEY = 'aether_player_token_v1';
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = 'usr_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem(KEY, token);
  }
  return token;
}

export async function fetchDailyPuzzleFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/puzzle/today`, {
      headers: {
        'Accept': 'application/json',
        'x-player-token': getPlayerToken()
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    // Backend unreachable (running purely client-side static)
    return null;
  }
}

export async function submitGuessToBackend(guessCityId, guessCount) {
  try {
    const res = await fetch(`${API_BASE}/api/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-player-token': getPlayerToken()
      },
      body: JSON.stringify({
        guessCityId,
        guessCount,
        playerId: getPlayerToken()
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchDailySummaryFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/daily/summary`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchGlobalStatsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
