import { getTemperatureFeel, getTimeOfDayPhase } from '../engine/weatherCodes';

/**
 * Returns the fog density based on wrong guess count
 */
export function getFogDensityForGuessCount(wrongCount, isComplete = false) {
  if (isComplete) return 0.0;
  switch (wrongCount) {
    case 0: return 0.90;
    case 1: return 0.65;
    case 2: return 0.44;
    case 3: return 0.25;
    case 4: return 0.12;
    case 5: return 0.04;
    default: return 0.0;
  }
}

/**
 * Generates all 5 progressive clues based on target city and weather snapshot
 */
export function generateClues(targetCity, weatherSnapshot) {
  if (!targetCity || !weatherSnapshot || !weatherSnapshot.current) {
    return [];
  }

  const { current } = weatherSnapshot;
  const tempC = Math.round(current.temperature_2m);
  const feelsLikeC = Math.round(current.apparent_temperature ?? current.temperature_2m);
  const feelWord = getTemperatureFeel(tempC, feelsLikeC, current.weather_code);

  // Format local time
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
      title: "Atmospheric Temperature",
      category: "Thermal Feel",
      icon: "Thermometer",
      text: `${feelWord} (${tempC}°C / ${Math.round(tempC * 9/5 + 32)}°F)`,
      detail: `Feels like ${feelsLikeC}°C with ${current.relative_humidity_2m || 50}% humidity`
    },
    {
      level: 2,
      title: "Solar Position & Hemisphere",
      category: "Celestial Coordinates",
      icon: "Compass",
      text: `${hemisphere} • ${timePhase}`,
      detail: `Local time approx. ${localTimeFormatted}`
    },
    {
      level: 3,
      title: "Global Region",
      category: "Continent",
      icon: "Globe",
      text: `Located in ${targetCity.continent}`,
      detail: `Latitude: ${Math.abs(targetCity.lat).toFixed(1)}°${targetCity.lat >= 0 ? 'N' : 'S'}`
    },
    {
      level: 4,
      title: "Territory Origin",
      category: "Country Initial",
      icon: "MapPin",
      text: `Country starts with "${targetCity.country.charAt(0)}"`,
      detail: `${targetCity.country.length} letters in country name`
    },
    {
      level: 5,
      title: "Barometric Dynamics",
      category: "Wind & Pressure",
      icon: "Wind",
      text: `Gales of ${Math.round(current.wind_speed_10m)} km/h • ${Math.round(current.surface_pressure || 1013)} hPa`,
      detail: `Cloud cover at ${current.cloud_cover}%`
    }
  ];
}
