/**
 * sound.js
 * Tactile Web Audio synth sounds.
 * tick on keypress, soft pop on guess, rising tone on new clue, chime on win.
 * Unlocks on first tap, master volume low by default, persists in settings.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.16;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
  }

  // Tick on keypress or tactile tap
  playTap() {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.012);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch (e) {
      // ignore
    }
  }

  // Soft pop on guess submission
  playPop() {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.07);

      gain.gain.setValueAtTime(this.volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // ignore
    }
  }

  // Rising tone on new clue reveal
  playRisingClue() {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37]; // A4 -> C#5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.55, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      // ignore
    }
  }

  // Chime on win (harmonic C-major chord)
  playWin() {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.7, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch (e) {
      // ignore
    }
  }

  // Calm soft tone on loss
  playLoss() {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.35);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {
      // ignore
    }
  }

  // Soft error buzz
  playError() {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(130, now + 0.05);

      gain.gain.setValueAtTime(this.volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      // ignore
    }
  }

  // Aliases
  playClueReveal() {
    this.playRisingClue();
  }

  playWrongGuess() {
    this.playPop();
  }
}

export const sound = new SoundEngine();
