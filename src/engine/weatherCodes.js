/**
 * WMO Weather interpretation codes (WW)
 * https://open-meteo.com/en/docs
 */
export const WMO_CODES = {
  0: { label: "Clear sky", type: "clear", feel: "Serene & crystal clear" },
  1: { label: "Mainly clear", type: "clear", feel: "Crisp with bright sun" },
  2: { label: "Partly cloudy", type: "cloudy", feel: "Scattered sunlit clouds" },
  3: { label: "Overcast", type: "overcast", feel: "Heavy grey ceiling" },
  45: { label: "Foggy", type: "fog", feel: "Dense blinding fog" },
  48: { label: "Depositing rime fog", type: "fog", feel: "Freezing mist and frost" },
  51: { label: "Light drizzle", type: "drizzle", feel: "Gentle cool misting" },
  53: { label: "Moderate drizzle", type: "drizzle", feel: "Steady persistent dampness" },
  55: { label: "Dense drizzle", type: "drizzle", feel: "Soaking fine drizzle" },
  56: { label: "Light freezing drizzle", type: "freezing_drizzle", feel: "Icy stinging drizzle" },
  57: { label: "Dense freezing drizzle", type: "freezing_drizzle", feel: "Glaze of subzero moisture" },
  61: { label: "Slight rain", type: "rain", feel: "Soft patter of raindrops" },
  63: { label: "Moderate rain", type: "rain", feel: "Rhythmic steady rainfall" },
  65: { label: "Heavy rain", type: "rain", feel: "Torrential cascading rain" },
  66: { label: "Light freezing rain", type: "freezing_rain", feel: "Sleet-laden freezing rain" },
  67: { label: "Heavy freezing rain", type: "freezing_rain", feel: "Severe icy deluge" },
  71: { label: "Slight snow fall", type: "snow", feel: "Quiet fluttering snowflakes" },
  73: { label: "Moderate snow fall", type: "snow", feel: "Swirling blankets of snow" },
  75: { label: "Heavy snow fall", type: "snow", feel: "Blinding whiteout blizzard" },
  77: { label: "Snow grains", type: "snow", feel: "Tapping frosty grains" },
  80: { label: "Slight rain showers", type: "rain", feel: "Passing quick shower" },
  81: { label: "Moderate rain showers", type: "rain", feel: "Sudden sweeping squall" },
  82: { label: "Violent rain showers", type: "rain", feel: "Violent cloudburst" },
  85: { label: "Slight snow showers", type: "snow", feel: "Drifting snow flurries" },
  86: { label: "Heavy snow showers", type: "snow", feel: "Fierce gusting snowburst" },
  95: { label: "Thunderstorm", type: "thunderstorm", feel: "Rumbling electrified skies" },
  96: { label: "Thunderstorm with slight hail", type: "thunderstorm", feel: "Flashing lightning with hail" },
  99: { label: "Thunderstorm with heavy hail", type: "thunderstorm", feel: "Severe storm and deafening thunder" }
};

export function getWeatherMeta(code) {
  return WMO_CODES[code] || { label: "Variable conditions", type: "cloudy", feel: "Atmosphere in flux" };
}

/**
 * Returns an evocative "feel word / phrase" for temperature and conditions
 */
export function getTemperatureFeel(tempC, apparentTempC, weatherCode) {
  const effective = apparentTempC !== undefined ? apparentTempC : tempC;

  if (effective <= -20) return "Bitter arctic freeze (extreme sub-zero)";
  if (effective <= -10) return "Bone-chilling biting cold";
  if (effective <= 0) return "Freezing frosty chill";
  if (effective <= 7) return "Crisp, cold winter air";
  if (effective <= 14) return "Brisk, cool sweater weather";
  if (effective <= 20) return "Mild, pleasant temperate air";
  if (effective <= 26) return "Balmy, gentle comfortable warmth";
  if (effective <= 32) return "Warm, sun-soaked afternoon";
  if (effective <= 38) return "Sweltering humid heat";
  return "Scorching, intense desert heat";
}

/**
 * Categorizes local time into evocative atmospheric phase
 */
export function getTimeOfDayPhase(isoString, isDay) {
  if (!isoString) return isDay ? "Daylight" : "Night";
  const date = new Date(isoString);
  const hours = date.getHours() + date.getMinutes() / 60;

  if (hours >= 4 && hours < 6) return "Astronomical Dawn";
  if (hours >= 6 && hours < 8) return "Golden Dawn";
  if (hours >= 8 && hours < 11) return "Morning Light";
  if (hours >= 11 && hours < 14) return "Harsh High Noon";
  if (hours >= 14 && hours < 17) return "Mellow Afternoon";
  if (hours >= 17 && hours < 19.5) return "Golden Dusk / Sunset";
  if (hours >= 19.5 && hours < 21.5) return "Twilight & Blue Hour";
  if (hours >= 21.5 || hours < 1) return "Sodium-lit City Night";
  return "Dead of Night";
}
