/**
 * weatherApi.js
 * Open-Meteo API fetcher with daily snapshot caching and offline fallback.
 */

const CACHE_PREFIX = 'weather_gg_snapshot_';

export async function fetchWeatherSnapshot(city, dateStr) {
  const cacheKey = `${CACHE_PREFIX}${dateStr}_${city.id}`;

  // Check if we have a cached snapshot for this date & city
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.current) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached weather snapshot:', e);
  }

  // Fetch from Open-Meteo
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure&daily=sunrise,sunset&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error status ${response.status}`);
    }
    const data = await response.json();

    const snapshot = {
      cityId: city.id,
      cityName: city.name,
      country: city.country,
      dateStr,
      fetchedAt: new Date().toISOString(),
      timezone: data.timezone,
      timezoneAbbreviation: data.timezone_abbreviation,
      utcOffsetSeconds: data.utc_offset_seconds,
      current: {
        time: data.current.time,
        temperature_2m: data.current.temperature_2m,
        apparent_temperature: data.current.apparent_temperature,
        is_day: data.current.is_day,
        precipitation: data.current.precipitation,
        rain: data.current.rain,
        showers: data.current.showers,
        snowfall: data.current.snowfall,
        weather_code: data.current.weather_code,
        cloud_cover: data.current.cloud_cover,
        wind_speed_10m: data.current.wind_speed_10m,
        wind_direction_10m: data.current.wind_direction_10m,
        surface_pressure: data.current.surface_pressure,
        relative_humidity_2m: data.current.relative_humidity_2m
      },
      daily: {
        sunrise: data.daily?.sunrise?.[0],
        sunset: data.daily?.sunset?.[0]
      }
    };

    // Cache to localStorage
    try {
      localStorage.setItem(cacheKey, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Could not save weather snapshot to cache:', e);
    }

    return snapshot;
  } catch (err) {
    console.warn('Weather fetch failed, utilizing synthetic atmospheric fallback:', err);
    return getSyntheticWeatherFallback(city, dateStr);
  }
}

/**
 * High-quality fallback generator based on latitude, season, and time
 */
export function getSyntheticWeatherFallback(city, dateStr) {
  const isNorthern = city.lat >= 0;
  const now = new Date();
  const month = now.getMonth();
  // Is it winter? (Nov-Feb in north, May-Aug in south)
  const isWinter = isNorthern ? (month >= 10 || month <= 2) : (month >= 4 && month <= 8);

  const baseTemp = isWinter
    ? Math.round(25 - Math.abs(city.lat) * 0.75)
    : Math.round(35 - Math.abs(city.lat) * 0.45);

  const isDay = now.getHours() >= 6 && now.getHours() < 19 ? 1 : 0;
  const cloudCover = Math.min(100, Math.max(10, Math.floor(Math.abs(city.lon * 3) % 85)));

  return {
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    dateStr,
    fetchedAt: now.toISOString(),
    timezone: "UTC",
    current: {
      time: now.toISOString(),
      temperature_2m: baseTemp,
      apparent_temperature: baseTemp - 2,
      is_day: isDay,
      precipitation: cloudCover > 75 ? 1.5 : 0,
      rain: cloudCover > 75 ? 1.5 : 0,
      snowfall: baseTemp < 0 && cloudCover > 75 ? 1.0 : 0,
      weather_code: cloudCover > 80 ? 3 : (cloudCover > 40 ? 2 : 0),
      cloud_cover: cloudCover,
      wind_speed_10m: 14,
      wind_direction_10m: 210,
      surface_pressure: 1014,
      relative_humidity_2m: 65
    },
    daily: {
      sunrise: `${dateStr}T06:20`,
      sunset: `${dateStr}T18:40`
    }
  };
}
