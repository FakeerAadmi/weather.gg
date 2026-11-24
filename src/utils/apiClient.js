/**
 * apiClient.js
 * Authoritative backend communication client with seamless offline/static fallback.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchDailyPuzzleFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/puzzle/today`, {
      headers: { 'Accept': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guessCityId, guessCount })
    });
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
