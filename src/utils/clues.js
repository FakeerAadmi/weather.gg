import { getTemperatureFeel, getTimeOfDayPhase } from '../engine/weatherCodes';

/**
 * Returns temperature band and color token based on temperature in Celsius
 */
export function getTemperatureBand(tempC) {
  if (tempC <= 0) return { band: 'freezing', label: 'Freezing', color: 'var(--temp-freezing)' };
  if (tempC <= 10) return { band: 'cold', label: 'Cold', color: 'var(--temp-cold)' };
  if (tempC <= 20) return { band: 'mild', label: 'Mild', color: 'var(--temp-mild)' };
  if (tempC <= 28) return { band: 'warm', label: 'Warm', color: 'var(--temp-warm)' };
  return { band: 'hot', label: 'Hot', color: 'var(--temp-hot)' };
}

/**
 * Generates the 5 progressive Clue Ladder v2 entries
 */
export function generateClues(targetCity, weatherSnapshot) {
  if (!targetCity || !weatherSnapshot || !weatherSnapshot.current) {
    return [];
  }

  const { current } = weatherSnapshot;
  const tempC = Math.round(current.temperature_2m);
  const feelsLikeC = Math.round(current.apparent_temperature ?? current.temperature_2m);
  const feelWord = getTemperatureFeel(tempC, feelsLikeC, current.weather_code);
  const tempBand = getTemperatureBand(tempC);

  // Format local solar time
  let localTimeFormatted = "Unknown";
  try {
    if (current.time) {
      const dt = new Date(current.time);
      const hours = String(dt.getHours()).padStart(2, '0');
      const mins = String(dt.getMinutes()).padStart(2, '0');
      localTimeFormatted = `${hours}:${mins}`;
    }
  } catch (e) {
    // ignore
  }

  const hemisphere = targetCity.lat >= 0 ? "Northern Hemisphere" : "Southern Hemisphere";
  const timePhase = getTimeOfDayPhase(current.time, current.is_day);

  return [
    {
      level: 1,
      category: "THERMAL",
      title: "Atmospheric Temperature",
      glyph: "thermometer",
      text: `${feelWord} (${tempC}°C / ${Math.round(tempC * 9/5 + 32)}°F)`,
      detail: `Apparent ${feelsLikeC}°C • ${current.relative_humidity_2m || 50}% humidity`,
      tint: tempBand.color
    },
    {
      level: 2,
      category: "SOLAR & HEMISPHERE",
      title: "Solar Position",
      glyph: current.is_day ? "sun" : "moon",
      text: `${hemisphere} • ${timePhase}`,
      detail: `Local time approx. ${localTimeFormatted}`,
      tint: tempBand.color
    },
    {
      level: 3,
      category: "CONTINENT",
      title: "Geographic Region",
      glyph: "globe",
      text: `Located in ${targetCity.continent}`,
      detail: `Latitude: ${Math.abs(targetCity.lat).toFixed(1)}°${targetCity.lat >= 0 ? 'N' : 'S'}`,
      tint: tempBand.color
    },
    {
      level: 4,
      category: "COUNTRY INITIAL",
      title: "Territory",
      glyph: "map-pin",
      text: `Country starts with "${targetCity.country.charAt(0)}"`,
      detail: `${targetCity.country.length} letters in country name`,
      tint: tempBand.color
    },
    {
      level: 5,
      category: "WIND & PRESSURE",
      title: "Barometric Dynamics",
      glyph: "wind",
      text: `Wind ${Math.round(current.wind_speed_10m)} km/h • ${Math.round(current.surface_pressure || 1013)} hPa`,
      detail: `Cloud cover ${current.cloud_cover}%`,
      tint: tempBand.color
    }
  ];
}
