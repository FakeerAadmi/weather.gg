# AETHER // weather.gg

> **The Atmosphere is Your Board.**  
> A daily single-page mystery sky game where the entire screen is a live procedural sky for a mystery city, driven by real-time meteorological conditions and local solar time. No instruments, gauges, or grids.

---

## 🌟 Concept

In **AETHER**, players identify a mystery global city purely by observing the living sky. 
- The sky gradient reflects the exact local solar altitude (dawn, noon glare, dusk, twilight, or sodium-lit city night).
- Real-time cloud cover, wind vectors, precipitation (rain streaks, mist, or drifting snowflakes), and lightning are dynamically rendered on an HTML5 Canvas with zero raster images.
- A procedural **Fog of Mystery** blankets the atmosphere at the start. With each deviation, the veil parts and thins while unlocking progressive meteorological clues.

---

## 🎮 Gameplay & Rules

1. **Daily Mystery**: Every day at 00:00 UTC, a date-based seed selects a city from a curated global catalog (~195 cities across all continents).
2. **Snapshot Caching**: Real-time atmospheric data is fetched from the Open-Meteo API and cached locally for the day so every player experiences the exact same conditions.
3. **6 Guesses via Autocomplete**: Type any city with keyboard navigation (`↑`/`↓`/`Enter`) or touch/click.
4. **Navigational Feedback**:
   - Haversine distance in kilometers (`km`).
   - Cardinal compass arrow dynamically rotated to point along the true bearing toward the target city.
   - Hot/Cold warmth badges (*Scorching close*, *Very warm*, *Lukewarm*, *Freezing far*).
5. **Clue Ladder**:
   - **Initial (0 wrong)**: 90% mystery fog veil.
   - **1st wrong guess**: Fog thins to 65% + **Temperature as a Feel Word** (e.g. *"Bone-chilling cold (-6°C)"*, *"Sweltering tropical heat (31°C)"*).
   - **2nd wrong guess**: Fog thins to 44% + **Hemisphere & Local Solar Time of Day** (e.g. *"Northern Hemisphere • Golden Dusk ~18:22 local"*).
   - **3rd wrong guess**: Fog thins to 25% + **Continent** (e.g. *"Located in Asia"*).
   - **4th wrong guess**: Fog thins to 12% + **Country Initial** (e.g. *"Country starts with 'J'"*).
   - **5th wrong guess**: Fog thins to 4% + **Barometric Dynamics** (e.g. *"Gales of 38 km/h from SW • 1012 hPa"*).
   - **Win / 6th wrong guess**: Fog dissolves completely (0%), revealing the city and full meteorological dispatch.
6. **Share Weather Bulletin**:
   - **Formatted Text Dispatch**: Formatted with arrows, distances, and meteorological summary for clipboard sharing.
   - **Downloadable Graphic Card**: Generates an editorial weather bulletin image card directly from canvas (`.png`).
7. **Stats & Streaks**: Tracks games played, win rate %, current streak, max streak, and guess distribution in `localStorage`.
8. **Practice / Free Flight Mode**: Toggle anytime between the Daily puzzle and Free Flight mode to practice on random world cities and explore different live microclimates.

---

## 🎨 Modular Procedural Sky Architecture (`SkyRenderer.js`)

The sky renderer is built as a standalone, zero-asset module designed for easy reusability across future game modes (e.g. time lapse mode, extreme weather survival, climate comparison).

### Public API:

```javascript
import { SkyRenderer } from './engine/SkyRenderer';

// 1. Initialize
const canvas = document.getElementById('sky-canvas');
const sky = new SkyRenderer(canvas, {
  enableStars: true,
  enableClouds: true,
  enablePrecipitation: true,
  enableLightning: true
});

// 2. Set live weather snapshot
sky.setWeather({
  time: "2026-11-24T18:30:00",
  sunrise: "2026-11-24T06:15:00",
  sunset: "2026-11-24T18:10:00",
  is_day: 0,
  temperature_2m: 3.5,
  cloud_cover: 65,
  precipitation: 1.2,
  rain: 1.2,
  snowfall: 0,
  wind_speed_10m: 22,
  wind_direction_10m: 240,
  weather_code: 61 // Rain
});

// 3. Control mystery veil (1.0 = opaque shroud, 0.0 = crystal clear)
sky.setFogLevel(0.45);

// 4. Start / Stop animation loop
sky.start();
sky.stop();

// 5. Clean up
sky.destroy();
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 + Custom Atmospheric Glassmorphism
- **Icons**: Lucide Icons
- **Visuals**: Procedural HTML5 Canvas 2D Engine (multi-layer gradients, volumetric noise puffs, particle velocity simulation, fork lightning, rolling mist)
- **Audio**: Web Audio API Procedural Synthesizer (zero network audio files; synthesizes ambient wind and rain tones in real time)
- **Data**: Open-Meteo API + Curated 195-city Global Geographic Registry

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```
