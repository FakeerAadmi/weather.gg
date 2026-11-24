/**
 * SkyRenderer.js
 * High-performance, zero-asset procedural atmospheric sky renderer.
 * Visual board engine for weather.gg / Aether.
 */

export class SkyRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.options = {
      enableStars: true,
      enableClouds: true,
      enablePrecipitation: true,
      enableLightning: true,
      ...options
    };

    // Internal resolution & scaling
    this.width = canvas.width || 800;
    this.height = canvas.height || 600;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Weather state
    this.weather = {
      isDay: true,
      cloudCover: 30, // 0 - 100
      temperature: 18,
      apparentTemperature: 18,
      precipitation: 0, // mm
      rain: 0,
      snowfall: 0,
      windSpeed: 10, // km/h
      windDirection: 180, // degrees (0 = from North, 180 = from South)
      weatherCode: 0,
      localHour: 13.5, // 0.0 - 24.0
      sunriseHour: 6.0,
      sunsetHour: 18.5,
      isSodiumNight: true
    };

    // Gameplay mystery fog level (1.0 = shrouded, 0.0 = completely clear)
    this.fogTargetDensity = 0.92;
    this.fogCurrentDensity = 0.92;

    // Animation & simulation state
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = performance.now();
    this.elapsed = 0;

    // Celestial state
    this.stars = this.generateStars(160);
    this.sunPosition = { x: 0.5, y: 0.3 };
    this.moonPosition = { x: 0.75, y: 0.25 };
    this.moonPhase = 0.45; // 0 = new, 0.5 = full

    // Clouds
    this.cloudLayers = this.initCloudLayers();

    // Rain / Snow particles
    this.particles = [];
    this.maxParticles = 600;
    this.initParticles();

    // Lightning
    this.lightning = {
      active: false,
      flashAlpha: 0,
      branches: [],
      nextStrikeTime: 5 + Math.random() * 8
    };

    // Fog particles / rolling mist
    this.fogRollers = this.initFogRollers();

    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  // -------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------

  /**
   * Set raw or normalized weather snapshot from Open-Meteo
   */
  setWeather(data) {
    if (!data) return;

    // Calculate local hour from local time string or UTC
    let localHour = 12;
    if (data.time) {
      const d = new Date(data.time);
      localHour = d.getHours() + d.getMinutes() / 60;
    } else if (typeof data.localHour === 'number') {
      localHour = data.localHour;
    }

    // Sunrise / sunset hours
    let sunriseHour = 6.0;
    let sunsetHour = 18.5;
    if (data.sunrise) {
      const sr = new Date(data.sunrise);
      sunriseHour = sr.getHours() + sr.getMinutes() / 60;
    }
    if (data.sunset) {
      const ss = new Date(data.sunset);
      sunsetHour = ss.getHours() + ss.getMinutes() / 60;
    }

    const isDay = typeof data.is_day === 'number' ? data.is_day === 1 : (localHour >= sunriseHour && localHour < sunsetHour);

    this.weather = {
      isDay,
      cloudCover: Math.max(0, Math.min(100, data.cloud_cover ?? data.cloudCover ?? 30)),
      temperature: data.temperature_2m ?? data.temperature ?? 15,
      apparentTemperature: data.apparent_temperature ?? data.apparentTemperature ?? (data.temperature_2m ?? 15),
      precipitation: data.precipitation ?? 0,
      rain: data.rain ?? 0,
      snowfall: data.snowfall ?? 0,
      windSpeed: data.wind_speed_10m ?? data.windSpeed ?? 12,
      windDirection: data.wind_direction_10m ?? data.windDirection ?? 180,
      weatherCode: data.weather_code ?? data.weatherCode ?? 0,
      localHour,
      sunriseHour,
      sunsetHour,
      isSodiumNight: !isDay && (data.population ? data.population > 50000 : true)
    };

    this.updateCelestialPositions();
    this.updateParticleCounts();
  }

  /**
   * Sets mystery fog veil level: 1.0 (thickest) -> 0.0 (crystal clear)
   */
  setFogLevel(level, immediate = false) {
    this.fogTargetDensity = Math.max(0, Math.min(1, level));
    if (immediate) {
      this.fogCurrentDensity = this.fogTargetDensity;
    }
  }

  resize(width, height) {
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.updateCelestialPositions();
    this.resetCloudLayerPositions();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    const loop = (currentTime) => {
      if (!this.isRunning) return;
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;
      this.elapsed += dt;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy() {
    this.stop();
    this.particles = [];
    this.cloudLayers = [];
  }

  // -------------------------------------------------------------
  // Internal Generation & Init
  // -------------------------------------------------------------

  generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.75, // Mostly in upper sky
        radius: 0.5 + Math.random() * 1.5,
        baseAlpha: 0.2 + Math.random() * 0.8,
        twinkleSpeed: 0.8 + Math.random() * 2.5,
        twinklePhase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.85 ? '#b8d5ff' : (Math.random() > 0.75 ? '#ffe9b8' : '#ffffff')
      });
    }
    return stars;
  }

  initCloudLayers() {
    // 3 parallax layers: High Cirrus (0), Mid Cumulus (1), Low Scud (2)
    return [
      {
        speedMultiplier: 0.2,
        baseY: 0.18,
        scale: 1.4,
        puffs: this.generateCloudPuffs(14, 0.15, 120, 220)
      },
      {
        speedMultiplier: 0.55,
        baseY: 0.38,
        scale: 1.0,
        puffs: this.generateCloudPuffs(20, 0.35, 160, 280)
      },
      {
        speedMultiplier: 0.9,
        baseY: 0.62,
        scale: 0.8,
        puffs: this.generateCloudPuffs(16, 0.55, 100, 200)
      }
    ];
  }

  generateCloudPuffs(count, yCenterRel, minRadius, maxRadius) {
    const puffs = [];
    for (let i = 0; i < count; i++) {
      puffs.push({
        relX: (i / count) + (Math.random() - 0.5) * 0.15,
        relY: yCenterRel + (Math.random() - 0.5) * 0.16,
        radius: minRadius + Math.random() * (maxRadius - minRadius),
        opacity: 0.3 + Math.random() * 0.45,
        aspectRatio: 1.2 + Math.random() * 1.4, // wider than tall
        rotation: (Math.random() - 0.5) * 0.2
      });
    }
    return puffs;
  }

  resetCloudLayerPositions() {
    // Keep relative coordinates stable
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.spawnParticle(true));
    }
  }

  spawnParticle(randomY = false) {
    const isSnow = this.isSnowing();
    const isDrizzle = this.isDrizzle();
    return {
      x: Math.random() * (this.width + 200) - 100,
      y: randomY ? Math.random() * this.height : -30,
      length: isSnow ? (2 + Math.random() * 3) : (isDrizzle ? (4 + Math.random() * 6) : (14 + Math.random() * 22)),
      speed: isSnow ? (35 + Math.random() * 45) : (isDrizzle ? (120 + Math.random() * 80) : (450 + Math.random() * 350)),
      drift: (Math.random() - 0.5) * 20,
      opacity: 0.25 + Math.random() * 0.65,
      radius: isSnow ? (1.2 + Math.random() * 2.4) : (0.7 + Math.random() * 0.8),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 1 + Math.random() * 3
    };
  }

  initFogRollers() {
    const rollers = [];
    for (let i = 0; i < 7; i++) {
      rollers.push({
        x: Math.random() * 2 - 1,
        y: 0.15 + (i / 7) * 0.75,
        widthRel: 0.6 + Math.random() * 0.8,
        heightRel: 0.25 + Math.random() * 0.35,
        speed: (0.01 + Math.random() * 0.02) * (i % 2 === 0 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        density: 0.5 + Math.random() * 0.5
      });
    }
    return rollers;
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------

  isRaining() {
    const { weatherCode, precipitation, rain } = this.weather;
    return (precipitation > 0.1 || rain > 0.1 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(weatherCode)) && !this.isSnowing();
  }

  isSnowing() {
    const { weatherCode, snowfall, temperature } = this.weather;
    return (snowfall > 0 || [71,73,75,77,85,86].includes(weatherCode) || (temperature <= 0 && this.weather.precipitation > 0));
  }

  isDrizzle() {
    return [51, 53, 55, 56, 57].includes(this.weather.weatherCode);
  }

  isThunderstorm() {
    return [95, 96, 99].includes(this.weather.weatherCode);
  }

  updateCelestialPositions() {
    const { localHour, sunriseHour, sunsetHour, isDay } = this.weather;

    if (isDay) {
      // Day arc from sunrise to sunset
      const dayProgress = Math.max(0, Math.min(1, (localHour - sunriseHour) / (sunsetHour - sunriseHour)));
      // Arc: x travels from 0.1 to 0.9, y dips lowest at solar noon
      this.sunPosition.x = 0.1 + dayProgress * 0.8;
      this.sunPosition.y = 0.65 - Math.sin(dayProgress * Math.PI) * 0.45;
    } else {
      // Night: calculate night progress
      let nightProgress;
      if (localHour >= sunsetHour) {
        nightProgress = (localHour - sunsetHour) / (24 - sunsetHour + sunriseHour);
      } else {
        nightProgress = (24 - sunsetHour + localHour) / (24 - sunsetHour + sunriseHour);
      }
      nightProgress = Math.max(0, Math.min(1, nightProgress));
      this.moonPosition.x = 0.15 + nightProgress * 0.7;
      this.moonPosition.y = 0.6 - Math.sin(nightProgress * Math.PI) * 0.4;
    }
  }

  updateParticleCounts() {
    // Adjust active particle density dynamically
    let desired = 0;
    if (this.isSnowing()) {
      desired = Math.min(this.maxParticles, 120 + (this.weather.snowfall || 1) * 80);
    } else if (this.isRaining()) {
      desired = Math.min(this.maxParticles, 80 + (this.weather.precipitation || 1) * 75);
    }
    if (this.particles.length > desired) {
      this.particles.length = Math.floor(desired);
    } else {
      while (this.particles.length < desired) {
        this.particles.push(this.spawnParticle(true));
      }
    }
  }

  // -------------------------------------------------------------
  // Simulation Update Loop
  // -------------------------------------------------------------

  update(dt) {
    // 1. Smoothly ease mystery fog
    this.fogCurrentDensity += (this.fogTargetDensity - this.fogCurrentDensity) * Math.min(dt * 3.5, 0.2);

    // 2. Wind drift vector
    // windDirection is in meteorological degrees (from North clockwise)
    // Convert to radians and determine horizontal drift
    const windRad = (this.weather.windDirection * Math.PI) / 180;
    // Wind vector pushing particles
    const windSpeedNorm = (this.weather.windSpeed || 10) / 40; // baseline ~1.0
    const windDriftX = Math.sin(windRad) * windSpeedNorm;

    // 3. Move Clouds
    const cloudSpeedBase = dt * (0.015 + windSpeedNorm * 0.04);
    for (let layer of this.cloudLayers) {
      const shift = cloudSpeedBase * layer.speedMultiplier * (windDriftX >= 0 ? 1 : -1);
      for (let puff of layer.puffs) {
        puff.relX += shift;
        if (puff.relX > 1.3) puff.relX -= 1.6;
        if (puff.relX < -0.3) puff.relX += 1.6;
      }
    }

    // 4. Move Precipitation Particles
    const isSnow = this.isSnowing();
    for (let p of this.particles) {
      if (isSnow) {
        p.wobblePhase += dt * p.wobbleSpeed;
        p.y += p.speed * dt;
        p.x += (Math.sin(p.wobblePhase) * 22 + windDriftX * 60) * dt;
      } else {
        p.y += p.speed * dt;
        p.x += windDriftX * (p.speed * 0.4) * dt;
      }

      if (p.y > this.height + 20) {
        p.y = -20 - Math.random() * 20;
        p.x = Math.random() * (this.width + 200) - 100;
      }
    }

    // 5. Update Lightning
    if (this.isThunderstorm()) {
      this.lightning.nextStrikeTime -= dt;
      if (this.lightning.nextStrikeTime <= 0) {
        this.triggerLightning();
        this.lightning.nextStrikeTime = 4 + Math.random() * 9;
      }
    }

    if (this.lightning.active) {
      this.lightning.flashAlpha -= dt * 3.5;
      if (this.lightning.flashAlpha <= 0) {
        this.lightning.active = false;
        this.lightning.flashAlpha = 0;
      }
    }

    // 6. Update Fog Rollers
    for (let roller of this.fogRollers) {
      roller.x += roller.speed * dt;
      if (roller.x > 1.6) roller.x = -0.6;
      if (roller.x < -0.6) roller.x = 1.6;
    }
  }

  triggerLightning() {
    this.lightning.active = true;
    this.lightning.flashAlpha = 0.85 + Math.random() * 0.15;

    // Generate main fork bolt
    const startX = (0.2 + Math.random() * 0.6) * this.width;
    const branches = [];

    const generateBranch = (x, y, targetY, depth) => {
      let curX = x;
      let curY = y;
      const points = [{ x: curX, y: curY }];

      while (curY < targetY) {
        const segLen = 12 + Math.random() * 24;
        curY += segLen;
        curX += (Math.random() - 0.5) * 45;
        points.push({ x: curX, y: curY });

        if (depth > 0 && Math.random() < 0.28) {
          generateBranch(curX, curY, curY + (targetY - curY) * 0.6, depth - 1);
        }
      }
      branches.push(points);
    };

    generateBranch(startX, 0, this.height * (0.6 + Math.random() * 0.35), 2);
    this.lightning.branches = branches;
  }

  // -------------------------------------------------------------
  // Rendering Pipeline
  // -------------------------------------------------------------

  render() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    // Layer 1: Base Sky Gradient
    this.drawSkyGradient();

    // Layer 2: Celestial Bodies & Stars
    if (!this.weather.isDay || this.weather.cloudCover < 85) {
      this.drawStars();
    }
    if (this.weather.isDay) {
      this.drawSun();
    } else {
      this.drawMoon();
    }

    // Layer 3: Clouds (Driven by cloudCover & wind)
    if (this.weather.cloudCover > 2) {
      this.drawClouds();
    }

    // Layer 4: Precipitation (Rain or Snow)
    if (this.particles.length > 0) {
      this.drawPrecipitation();
    }

    // Layer 5: Lightning Flash & Bolts
    if (this.lightning.active) {
      this.drawLightning();
    }

    // Layer 6: Temperature / Noon Glare Haze (Atmospheric shimmer)
    this.drawAtmosphericFilters();

    // Layer 7: The Fog of Mystery (The Gameplay veil that lifts with guesses)
    if (this.fogCurrentDensity > 0.005) {
      this.drawMysteryFog();
    }
  }

  /**
   * Procedural Sky Gradient driven by exact solar hour, sunrise/sunset, and weather
   */
  drawSkyGradient() {
    const { ctx, width, height } = this;
    const { localHour, sunriseHour, sunsetHour, isDay, cloudCover, isSodiumNight, weatherCode } = this.weather;

    const grad = ctx.createLinearGradient(0, 0, 0, height);

    // Weather overcast factor: 0.0 (clear) to 1.0 (heavy overcast/storm)
    const overcastFactor = Math.min(1, (cloudCover / 100) * (this.isRaining() || this.isThunderstorm() ? 1.4 : 1.0));

    // Time-based key colors
    let topColor, midColor, botColor;

    if (!isDay) {
      // Night or Twilight
      const isNearDawn = Math.abs(localHour - sunriseHour) < 1.2;
      const isNearDusk = Math.abs(localHour - sunsetHour) < 1.2;

      if (isNearDawn) {
        // Astronomical/nautical dawn
        topColor = [16, 20, 48];
        midColor = [55, 34, 66];
        botColor = [180, 95, 65];
      } else if (isNearDusk) {
        // Deep dusk
        topColor = [14, 18, 42];
        midColor = [62, 30, 58];
        botColor = [160, 68, 40];
      } else if (isSodiumNight) {
        // Sodium-lit urban night sky
        topColor = [6, 10, 20];
        midColor = [18, 22, 38];
        botColor = [82, 45, 20]; // warm amber sodium glow on lower horizon
      } else {
        // Deep pristine dark night
        topColor = [4, 7, 15];
        midColor = [10, 16, 32];
        botColor = [18, 28, 50];
      }
    } else {
      // Day
      const hoursFromNoon = Math.abs(localHour - 12);
      const isSunrise = Math.abs(localHour - sunriseHour) < 1.0;
      const isSunset = Math.abs(localHour - sunsetHour) < 1.0;

      if (isSunrise) {
        // Golden Sunrise
        topColor = [28, 45, 85];
        midColor = [180, 85, 80];
        botColor = [245, 175, 95];
      } else if (isSunset) {
        // Dramatic Sunset
        topColor = [24, 32, 68];
        midColor = [185, 62, 55];
        botColor = [250, 150, 52];
      } else if (hoursFromNoon < 2.5) {
        // High harsh noon
        topColor = [18, 92, 178];
        midColor = [68, 148, 218];
        botColor = [165, 212, 245];
      } else {
        // Normal morning / afternoon
        topColor = [22, 85, 158];
        midColor = [72, 140, 205];
        botColor = [175, 208, 235];
      }
    }

    // Blend in overcast/storm desaturation & dark slate
    if (overcastFactor > 0.05) {
      const stormTop = isDay ? [45, 52, 62] : [12, 14, 20];
      const stormMid = isDay ? [85, 92, 102] : [24, 28, 36];
      const stormBot = isDay ? [128, 134, 144] : [40, 44, 52];

      topColor = this.lerpColor(topColor, stormTop, overcastFactor * 0.85);
      midColor = this.lerpColor(midColor, stormMid, overcastFactor * 0.85);
      botColor = this.lerpColor(botColor, stormBot, overcastFactor * 0.85);
    }

    grad.addColorStop(0, `rgb(${topColor.join(',')})`);
    grad.addColorStop(0.55, `rgb(${midColor.join(',')})`);
    grad.addColorStop(1, `rgb(${botColor.join(',')})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  lerpColor(c1, c2, t) {
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t)
    ];
  }

  drawStars() {
    const { ctx, width, height } = this;
    const { cloudCover, isDay } = this.weather;
    if (isDay) return;

    // Cloud occlusion factor
    const starAlphaFactor = Math.max(0, 1 - (cloudCover / 80));
    if (starAlphaFactor <= 0.01) return;

    for (let star of this.stars) {
      const twinkle = Math.sin(this.elapsed * star.twinkleSpeed + star.twinklePhase);
      const alpha = Math.max(0.05, star.baseAlpha + twinkle * 0.35) * starAlphaFactor;

      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  drawSun() {
    const { ctx, width, height } = this;
    const { cloudCover, temperature, localHour } = this.weather;
    const sx = this.sunPosition.x * width;
    const sy = this.sunPosition.y * height;

    const sunAlpha = Math.max(0.1, 1 - (cloudCover / 110));

    // Outer atmospheric glow bloom
    const glowRadius = Math.max(80, Math.min(width, height) * 0.35);
    const glowGrad = ctx.createRadialGradient(sx, sy, 10, sx, sy, glowRadius);

    const isHighNoon = Math.abs(localHour - 12) < 2.5;
    const glowColor = isHighNoon ? '255, 245, 220' : '255, 200, 140';

    glowGrad.addColorStop(0, `rgba(${glowColor}, ${0.55 * sunAlpha})`);
    glowGrad.addColorStop(0.35, `rgba(${glowColor}, ${0.2 * sunAlpha})`);
    glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Brilliant Sun Core
    const coreRadius = Math.max(16, Math.min(width, height) * 0.04);
    const coreGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, coreRadius);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.98 * sunAlpha})`);
    coreGrad.addColorStop(0.7, `rgba(255, 250, 220, ${0.85 * sunAlpha})`);
    coreGrad.addColorStop(1, `rgba(255, 230, 160, 0)`);

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Harsh noon lens flare rays
    if (isHighNoon && cloudCover < 50) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.elapsed * 0.04);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * sunAlpha})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, glowRadius * 1.25);
        ctx.stroke();
        ctx.rotate(Math.PI / 4);
      }
      ctx.restore();
    }
  }

  drawMoon() {
    const { ctx, width, height } = this;
    const { cloudCover } = this.weather;
    const mx = this.moonPosition.x * width;
    const my = this.moonPosition.y * height;
    const moonAlpha = Math.max(0.1, 1 - (cloudCover / 100));

    const radius = Math.max(14, Math.min(width, height) * 0.038);

    // Subtle moon corona haze
    const haze = ctx.createRadialGradient(mx, my, radius * 0.8, mx, my, radius * 3.5);
    haze.addColorStop(0, `rgba(200, 220, 255, ${0.35 * moonAlpha})`);
    haze.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(mx, my, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Moon disc
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 245, 255, ${0.9 * moonAlpha})`;
    ctx.shadowColor = 'rgba(180, 210, 255, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();

    // Moon crater markings
    ctx.fillStyle = `rgba(180, 190, 210, ${0.28 * moonAlpha})`;
    ctx.beginPath();
    ctx.arc(mx - radius * 0.3, my - radius * 0.2, radius * 0.28, 0, Math.PI * 2);
    ctx.arc(mx + radius * 0.25, my + radius * 0.15, radius * 0.35, 0, Math.PI * 2);
    ctx.arc(mx - radius * 0.1, my + radius * 0.4, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClouds() {
    const { ctx, width, height } = this;
    const { cloudCover, isDay, localHour, sunriseHour, sunsetHour, precipitation } = this.weather;

    // Density factor
    const densityScale = Math.min(1.5, cloudCover / 55);

    // Cloud illumination color
    let cloudFill, cloudShadow;
    const isStormy = precipitation > 1.5 || this.isThunderstorm();

    if (!isDay) {
      // Night clouds
      cloudFill = isStormy ? 'rgba(18, 22, 32, 0.75)' : 'rgba(32, 40, 58, 0.55)';
      cloudShadow = 'rgba(10, 14, 22, 0.85)';
    } else {
      const isSunriseDusk = Math.abs(localHour - sunriseHour) < 1.2 || Math.abs(localHour - sunsetHour) < 1.2;
      if (isStormy) {
        cloudFill = 'rgba(65, 72, 85, 0.85)';
        cloudShadow = 'rgba(40, 46, 56, 0.95)';
      } else if (isSunriseDusk) {
        cloudFill = 'rgba(245, 180, 155, 0.75)';
        cloudShadow = 'rgba(145, 95, 115, 0.8)';
      } else {
        cloudFill = 'rgba(255, 255, 255, 0.72)';
        cloudShadow = 'rgba(185, 200, 218, 0.75)';
      }
    }

    // Render each cloud layer
    for (let layer of this.cloudLayers) {
      const layerPuffsToDraw = Math.floor(layer.puffs.length * Math.min(1.0, cloudCover / 70));

      for (let i = 0; i < layerPuffsToDraw; i++) {
        const puff = layer.puffs[i];
        const px = puff.relX * width;
        const py = (puff.relY + Math.sin(this.elapsed * 0.1 + i) * 0.02) * height;
        const r = puff.radius * (width / 900) * layer.scale * densityScale;

        // Draw soft cloud puff cluster
        const grad = ctx.createRadialGradient(px, py - r * 0.2, r * 0.1, px, py, r);
        grad.addColorStop(0, cloudFill);
        grad.addColorStop(0.65, cloudShadow);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(puff.rotation);
        ctx.scale(puff.aspectRatio, 1);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawPrecipitation() {
    const { ctx, width, height } = this;
    const isSnow = this.isSnowing();
    const isDrizzle = this.isDrizzle();
    const windRad = (this.weather.windDirection * Math.PI) / 180;
    const windTilt = Math.sin(windRad) * ((this.weather.windSpeed || 10) / 45);

    if (isSnow) {
      // Draw Snowflakes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      for (let p of this.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    } else {
      // Draw Rain Streaks
      ctx.lineWidth = isDrizzle ? 1.0 : 1.6;
      ctx.strokeStyle = isDrizzle ? 'rgba(210, 230, 255, 0.45)' : 'rgba(200, 225, 255, 0.65)';
      ctx.beginPath();

      for (let p of this.particles) {
        const dropLen = p.length;
        const endX = p.x + windTilt * dropLen;
        const endY = p.y + dropLen;

        ctx.moveTo(p.x, p.y);
        ctx.lineTo(endX, endY);
      }
      ctx.stroke();
    }
  }

  drawLightning() {
    const { ctx, width, height } = this;
    const alpha = this.lightning.flashAlpha;

    // 1. Sky flash
    ctx.fillStyle = `rgba(240, 245, 255, ${alpha * 0.75})`;
    ctx.fillRect(0, 0, width, height);

    // 2. Bolt strokes
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.5)})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#8bc4ff';
    ctx.shadowBlur = 18;

    for (let branch of this.lightning.branches) {
      if (branch.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(branch[0].x, branch[0].y);
      for (let i = 1; i < branch.length; i++) {
        ctx.lineTo(branch[i].x, branch[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAtmosphericFilters() {
    const { ctx, width, height } = this;
    const { temperature, isDay, localHour } = this.weather;

    // Extreme heat haze bloom at noon (> 32°C)
    if (isDay && temperature >= 30 && Math.abs(localHour - 12) < 2) {
      const heatGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
      heatGrad.addColorStop(0, 'rgba(255, 220, 160, 0)');
      heatGrad.addColorStop(1, 'rgba(255, 200, 120, 0.12)');
      ctx.fillStyle = heatGrad;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);
    }
  }

  /**
   * The Fog of Mystery:
   * Starts at ~0.92 opacity and thins as the player submits guesses!
   */
  drawMysteryFog() {
    const { ctx, width, height } = this;
    const density = this.fogCurrentDensity;
    if (density <= 0.005) return;

    // 1. Ambient Fog Blanket
    ctx.fillStyle = `rgba(28, 36, 52, ${density * 0.82})`;
    ctx.fillRect(0, 0, width, height);

    // 2. Multi-layer procedural rolling mist bands
    for (let roller of this.fogRollers) {
      const rx = roller.x * width;
      const ry = roller.y * height;
      const rw = roller.widthRel * width;
      const rh = roller.heightRel * height;

      const mistGrad = ctx.createRadialGradient(rx, ry, 10, rx, ry, rw * 0.65);
      const mistColor = '195, 208, 225';
      const mistAlpha = density * roller.density * 0.35;

      mistGrad.addColorStop(0, `rgba(${mistColor}, ${mistAlpha})`);
      mistGrad.addColorStop(0.5, `rgba(${mistColor}, ${mistAlpha * 0.6})`);
      mistGrad.addColorStop(1, 'rgba(195, 208, 225, 0)');

      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(rw / rh, 1);
      ctx.fillStyle = mistGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rh, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Render static clean snapshot to offscreen canvas (for high-res share card)
   */
  renderStaticSnapshot(targetCanvas, width, height) {
    const origW = this.width;
    const origH = this.height;
    const origFog = this.fogCurrentDensity;

    // Temporarily set fog to 0 for a pristine landscape share view
    this.fogCurrentDensity = 0.0;
    this.resize(width, height);
    this.render();

    // Copy onto target canvas
    const targetCtx = targetCanvas.getContext('2d');
    targetCtx.drawImage(this.canvas, 0, 0, width, height);

    // Restore
    this.fogCurrentDensity = origFog;
    this.resize(origW, origH);
  }
}
