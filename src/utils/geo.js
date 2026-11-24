/**
 * Geospatial distance & bearing calculations
 */

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates great-circle distance between two points in km (Haversine formula)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates initial bearing from point 1 toward point 2 (0-360 degrees)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.cos(toRadians(lon2 - lon1));

  let brng = toDegrees(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Converts bearing degrees to 8-point cardinal abbreviation and emoji arrow
 */
export function getBearingDirection(bearingDeg) {
  const points = [
    { label: "N", arrow: "⬆️", min: 337.5, max: 360 },
    { label: "N", arrow: "⬆️", min: 0, max: 22.5 },
    { label: "NE", arrow: "↗️", min: 22.5, max: 67.5 },
    { label: "E", arrow: "➡️", min: 67.5, max: 112.5 },
    { label: "SE", arrow: "↘️", min: 112.5, max: 157.5 },
    { label: "S", arrow: "⬇️", min: 157.5, max: 202.5 },
    { label: "SW", arrow: "↙️", min: 202.5, max: 247.5 },
    { label: "W", arrow: "⬅️", min: 247.5, max: 292.5 },
    { label: "NW", arrow: "↖️", min: 292.5, max: 337.5 }
  ];

  for (let p of points) {
    if (bearingDeg >= p.min && bearingDeg < p.max) {
      return p;
    }
  }
  return { label: "N", arrow: "⬆️" };
}

/**
 * Returns color category based on distance
 */
export function getDistanceWarmth(distanceKm) {
  if (distanceKm === 0) return { label: "Exact match", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)" };
  if (distanceKm < 800) return { label: "Scorching close", color: "#f97316", bg: "rgba(249, 115, 22, 0.2)" };
  if (distanceKm < 2000) return { label: "Very warm", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.2)" };
  if (distanceKm < 5000) return { label: "Lukewarm", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.2)" };
  return { label: "Freezing far", color: "#818cf8", bg: "rgba(129, 140, 248, 0.2)" };
}
