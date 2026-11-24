/**
 * atmosphere.js
 * Computes procedural ambient lighting tokens based on real weather telemetry
 * (lightweight CSS radial/linear gradient blends, zero canvas overhead).
 */

export function getAmbientGradients(weatherSnapshot) {
  if (!weatherSnapshot || !weatherSnapshot.current) {
    return {
      background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
      glowColor: 'rgba(59, 130, 246, 0.12)'
    };
  }

  const { current } = weatherSnapshot;
  const isDay = current.is_day;
  const weatherCode = current.weather_code;
  let hour = 12;

  if (current.time) {
    try {
      hour = new Date(current.time).getHours();
    } catch (e) {
      hour = isDay ? 12 : 0;
    }
  }

  // 1. Dawn / Sunrise (05:00 - 07:59)
  if (hour >= 5 && hour < 8) {
    return {
      background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(251, 146, 60, 0.15) 0%, rgba(244, 63, 94, 0.08) 45%, transparent 75%)',
      glowColor: 'rgba(251, 146, 60, 0.2)'
    };
  }

  // 2. Daytime Noon / Afternoon (08:00 - 16:59)
  if (isDay && hour >= 8 && hour < 17) {
    if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
      // Rainy daylight: muted steel-slate
      return {
        background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(148, 163, 184, 0.14) 0%, rgba(71, 85, 105, 0.08) 50%, transparent 80%)',
        glowColor: 'rgba(148, 163, 184, 0.15)'
      };
    }
    // Clear / mild daylight: azure ambient top-glow
    return {
      background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(56, 189, 248, 0.14) 0%, rgba(59, 130, 246, 0.06) 50%, transparent 80%)',
      glowColor: 'rgba(56, 189, 248, 0.18)'
    };
  }

  // 3. Dusk / Sunset (17:00 - 19:59)
  if (hour >= 17 && hour < 20) {
    return {
      background: 'radial-gradient(ellipse 90% 50% at 50% -10%, rgba(249, 115, 22, 0.16) 0%, rgba(168, 85, 247, 0.1) 45%, transparent 75%)',
      glowColor: 'rgba(249, 115, 22, 0.22)'
    };
  }

  // 4. Night / Deep Darkness (20:00 - 04:59)
  if ([0, 1].includes(weatherCode)) {
    // Clear night: cool moonlight
    return {
      background: 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(129, 140, 248, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 75%)',
      glowColor: 'rgba(129, 140, 248, 0.15)'
    };
  }

  // Sodium city night / overcast night
  return {
    background: 'radial-gradient(ellipse 80% 45% at 50% -10%, rgba(245, 158, 11, 0.09) 0%, rgba(15, 23, 42, 0.04) 50%, transparent 75%)',
    glowColor: 'rgba(245, 158, 11, 0.12)'
  };
}
