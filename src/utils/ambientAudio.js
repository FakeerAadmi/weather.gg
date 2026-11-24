/**
 * ambientAudio.js
 * Zero-asset procedural atmospheric audio using Web Audio API.
 * Synthesizes gentle wind and rain tones based on live weather data.
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.windNode = null;
    this.rainNode = null;
    this.masterGain = null;
    this.windGain = null;
    this.rainGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Wind Generator (Filtered pink noise with slow LFO)
    this.setupWind();

    // Rain Generator (Filtered crackle noise)
    this.setupRain();
  }

  setupWind() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate Pink Noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoise.start(0);
    this.windNode = whiteNoise;
  }

  setupRain() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.06;
    }

    const rainNoise = this.ctx.createBufferSource();
    rainNoise.buffer = noiseBuffer;
    rainNoise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    rainNoise.connect(bandpass);
    bandpass.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    rainNoise.start(0);
    this.rainNode = rainNoise;
  }

  updateWeather(weather) {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;

    // Adjust wind gain by wind speed
    const windSpeed = weather.windSpeed || 10;
    const targetWindGain = Math.min(0.25, 0.04 + (windSpeed / 60) * 0.2);
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(targetWindGain, now, 1.5);
    }

    // Adjust rain gain
    const precip = weather.precipitation || 0;
    const targetRainGain = precip > 0 ? Math.min(0.3, 0.05 + precip * 0.08) : 0.0;
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(targetRainGain, now, 1.5);
    }
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isPlaying ? 0.35 : 0.0, this.ctx.currentTime, 0.3);
    }
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientAudioEngine();
