/**
 * clues.js
 * Clue Ladder v2 with friendly, human phrasing.
 * Clue 0 is immediately available on load (temperature band + condition group only).
 */

export function getTemperatureBandRange(tempC) {
  if (tempC <= -10) return { band: 'deep freeze', range: 'Below -10°C' };
  if (tempC <= 0) return { band: 'freezing', range: 'Sub-zero, -10 to 0°C' };
  if (tempC <= 7) return { band: 'cold', range: 'Cold, 1–7°C' };
  if (tempC <= 14) return { band: 'cool', range: 'Cool, 8–14°C' };
  if (tempC <= 20) return { band: 'mild', range: 'Mild, 15–20°C' };
  if (tempC <= 26) return { band: 'warm', range: 'Warm, 21–26°C' };
  if (tempC <= 32) return { band: 'very warm', range: 'Very warm, 27–32°C' };
  return { band: 'hot', range: 'Hot, above 32°C' };
}

export function getConditionGroup(weatherCode) {
  if ([0, 1].includes(weatherCode)) return 'Clear sky';
  if ([2, 3].includes(weatherCode)) return 'Partly cloudy';
  if ([45, 48].includes(weatherCode)) return 'Dense fog';
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'Light mist & drizzle';
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) return 'Rainfall';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'Snowfall';
  if ([95, 96, 99].includes(weatherCode)) return 'Thunderstorm';
  return 'Overcast';
}

export function getTimePhaseHuman(timeStr, isDay) {
  if (!timeStr) return isDay ? 'Daylight' : 'Night';
  try {
    const dt = new Date(timeStr);
    const h = dt.getHours();
    if (h >= 4 && h < 7) return 'Early morning dawn';
    if (h >= 7 && h < 11) return 'Morning sun';
    if (h >= 11 && h < 14) return 'Midday noon';
    if (h >= 14 && h < 17) return 'Afternoon';
    if (h >= 17 && h < 20) return 'Evening dusk';
    if (h >= 20 && h < 24) return 'Nightfall';
    return 'Dead of night';
  } catch (e) {
    return isDay ? 'Daylight' : 'Night';
  }
}

/**
 * Returns the full ladder of 5 clues for target city and weather
 */
export function generateClues(targetCity, weatherSnapshot) {
  if (!targetCity || !weatherSnapshot || !weatherSnapshot.current) {
    return [];
  }

  const { current } = weatherSnapshot;
  const tempC = Math.round(current.temperature_2m);
  const bandInfo = getTemperatureBandRange(tempC);
  const conditionGroup = getConditionGroup(current.weather_code);
  const hemisphere = targetCity.lat >= 0 ? 'Northern hemisphere' : 'Southern hemisphere';
  const timePhase = getTimePhaseHuman(current.time, current.is_day);

  return [
    // Clue 0: Visible on load
    {
      level: 0,
      label: 'Conditions',
      text: `${bandInfo.range}. ${conditionGroup}.`,
      icon: 'thermometer'
    },
    // Clue 1: Unlocks after 1 wrong guess
    {
      level: 1,
      label: 'Sun & hemisphere',
      text: `${hemisphere}. ${timePhase}.`,
      icon: current.is_day ? 'sun' : 'moon'
    },
    // Clue 2: Unlocks after 2 wrong guesses
    {
      level: 2,
      label: 'Region',
      text: `Located in ${targetCity.continent}.`,
      icon: 'globe'
    },
    // Clue 3: Unlocks after 3 wrong guesses
    {
      level: 3,
      label: 'Country initial',
      text: `Country starts with ${targetCity.country.charAt(0).toUpperCase()}.`,
      icon: 'map-pin'
    },
    // Clue 4: Unlocks after 4 wrong guesses
    {
      level: 4,
      label: 'Wind & atmosphere',
      text: `${Math.round(current.wind_speed_10m)} km/h breeze. ${Math.round(current.surface_pressure || 1013)} hPa.`,
      icon: 'wind'
    }
  ];
}
