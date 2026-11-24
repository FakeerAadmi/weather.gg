import { getWeatherMeta } from '../engine/weatherCodes';

/**
 * Generates formatted text bulletin for clipboard sharing
 */
export function generateShareText({ dayNumber, isWon, guesses, city, weather, isPractice }) {
  const title = isPractice ? `☁️ AETHER // Free Flight` : `☁️ AETHER // weather.gg #${dayNumber}`;
  const outcome = isWon ? `Solved in ${guesses.length}/6 guesses` : `Mystery unsolved (X/6)`;

  const guessRows = guesses.map((g, idx) => {
    if (g.distanceKm === 0) {
      return `${idx + 1}. ${g.city.name} ➔ 0 km 🎯`;
    }
    return `${idx + 1}. ${g.city.name} ➔ ${g.distanceKm.toLocaleString()} km ${g.direction.arrow}`;
  }).join('\n');

  const meta = getWeatherMeta(weather.current.weather_code);
  const tempC = Math.round(weather.current.temperature_2m);
  const conditions = `${tempC}°C • ${meta.label}`;

  return `${title}\n${outcome}\n\n${guessRows}\n\n📍 ${city.name}, ${city.country}\n🌡️ ${conditions}\nhttps://weather.gg`;
}

/**
 * Procedural HTML5 Canvas image card generator for downloading shareable graphic bulletin
 */
export function generateShareImageCard({ dayNumber, isWon, guesses, city, weather, isPractice }) {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Background gradient (deep obsidian indigo into midnight slate)
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#090d18');
  bg.addColorStop(0.5, '#0f172a');
  bg.addColorStop(1, '#05070e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle atmospheric noise / glowing orbs
  const glow = ctx.createRadialGradient(width * 0.75, height * 0.25, 50, width * 0.75, height * 0.25, 450);
  glow.addColorStop(0, isWon ? 'rgba(56, 189, 248, 0.18)' : 'rgba(239, 68, 68, 0.14)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // 3. Card Border / Frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 4. Header Bar
  ctx.fillStyle = '#38bdf8';
  ctx.font = '600 24px "JetBrains Mono", monospace';
  ctx.fillText('METEOROLOGICAL EXPEDITION DISPATCH', 70, 95);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '400 20px "JetBrains Mono", monospace';
  const issueDate = isPractice ? 'PRACTICE PROTOCOL' : `DAILY SKY #${dayNumber}`;
  ctx.fillText(issueDate, width - 70 - ctx.measureText(issueDate).width, 95);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(70, 120);
  ctx.lineTo(width - 70, 120);
  ctx.stroke();

  // 5. Outcome Badge
  ctx.fillStyle = isWon ? '#10b981' : '#f43f5e';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  const statusBadge = isWon ? `ATMOSPHERE IDENTIFIED [${guesses.length}/6]` : `SIGNAL LOST IN FOG [X/6]`;
  ctx.fillText(statusBadge, 70, 165);

  // 6. City Name & Location
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 68px "Cinzel", serif, Georgia';
  ctx.fillText(city.name, 70, 245);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${city.country} • ${city.continent}`, 70, 290);

  // 7. Live Weather Matrix Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(70, 330, width - 140, 190);
  ctx.strokeRect(70, 330, width - 140, 190);

  const meta = getWeatherMeta(weather.current.weather_code);
  const tempC = Math.round(weather.current.temperature_2m);
  const tempF = Math.round(tempC * 9/5 + 32);

  // Weather conditions readout
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 48px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${tempC}°C / ${tempF}°F`, 105, 400);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(meta.label, 105, 440);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '400 18px "JetBrains Mono", monospace';
  ctx.fillText(`WIND: ${Math.round(weather.current.wind_speed_10m)} km/h`, 105, 485);
  ctx.fillText(`CLOUD COVER: ${weather.current.cloud_cover}%`, 380, 485);
  ctx.fillText(`PRESSURE: ${Math.round(weather.current.surface_pressure || 1013)} hPa`, 680, 485);

  // 8. Guess Chronology Log
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText('EXPEDITION TRAIL', 70, 565);

  const startY = 605;
  const rowHeight = 48;

  guesses.forEach((g, idx) => {
    const curY = startY + idx * rowHeight;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(70, curY - 32, width - 140, 38);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillText(`#${idx + 1}`, 95, curY - 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${g.city.name}, ${g.city.country}`, 150, curY - 8);

    const isMatch = g.distanceKm === 0;
    ctx.fillStyle = isMatch ? '#10b981' : '#f59e0b';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    const distText = isMatch ? 'TARGET ACQUIRED (0 km)' : `${g.distanceKm.toLocaleString()} km ${g.direction.arrow}`;
    ctx.fillText(distText, width - 100 - ctx.measureText(distText).width, curY - 8);
  });

  // 9. Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '400 18px "JetBrains Mono", monospace';
  ctx.fillText('AETHER // weather.gg — The Sky Riddle', 70, height - 70);

  const coords = `${Math.abs(city.lat).toFixed(2)}°${city.lat >= 0 ? 'N' : 'S'}, ${Math.abs(city.lon).toFixed(2)}°${city.lon >= 0 ? 'E' : 'W'}`;
  ctx.fillText(coords, width - 70 - ctx.measureText(coords).width, height - 70);

  return canvas.toDataURL('image/png');
}
