import { City, WeatherSnapshot } from './clues.js';

// In-memory snapshot cache keyed by date/mode
const snapshotCache = new Map<string, WeatherSnapshot>();

export async function fetchWeatherForCity(city: City, cacheKey: string): Promise<WeatherSnapshot> {
  const cached = snapshotCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo API returned status ${res.status}`);
    }

    const data = await res.json() as any;
    if (!data.current) {
      throw new Error('Malformed Open-Meteo response: missing current telemetry');
    }

    const snapshot: WeatherSnapshot = {
      cityId: city.id,
      cityName: city.name,
      country: city.country,
      timestamp: data.current.time || new Date().toISOString(),
      fetchedAt: Date.now(),
      current: {
        time: data.current.time,
        weather_code: Number(data.current.weather_code ?? 0),
        temperature_2m: Number(data.current.temperature_2m ?? 20),
        apparent_temperature: Number(data.current.apparent_temperature ?? data.current.temperature_2m ?? 20),
        relative_humidity_2m: Number(data.current.relative_humidity_2m ?? 50),
        wind_speed_10m: Number(data.current.wind_speed_10m ?? 10),
        surface_pressure: Number(data.current.surface_pressure ?? 1013),
        is_day: Number(data.current.is_day ?? 1)
      }
    };

    snapshotCache.set(cacheKey, snapshot);
    return snapshot;
  } catch (err) {
    console.warn(`[Weather] Direct fetch failed for ${city.name}, using resilient meteorological fallback:`, err);
    const fallback = getSyntheticWeatherFallback(city);
    snapshotCache.set(cacheKey, fallback);
    return fallback;
  }
}

function getSyntheticWeatherFallback(city: City): WeatherSnapshot {
  const now = new Date();
  const isNorthern = city.lat >= 0;
  const month = now.getUTCMonth(); // 0-11
  const isSummer = isNorthern ? (month >= 5 && month <= 8) : (month <= 1 || month >= 10);
  const baseTemp = isSummer ? 26 : 8;
  const tempVariance = ((Math.abs(Math.sin(city.lat)) * 10) % 6);
  const temp = Math.round(baseTemp + tempVariance);

  return {
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    timestamp: now.toISOString(),
    fetchedAt: Date.now(),
    current: {
      time: now.toISOString(),
      weather_code: 2, // Partly cloudy
      temperature_2m: temp,
      apparent_temperature: temp,
      relative_humidity_2m: 55,
      wind_speed_10m: 12,
      surface_pressure: 1014,
      is_day: 1
    }
  };
}
