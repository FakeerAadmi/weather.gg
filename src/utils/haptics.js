/**
 * haptics.js
 * Hardware vibration patterns via navigator.vibrate with feature detection.
 */

let hapticsEnabled = true;

export function setHapticsEnabled(enabled) {
  hapticsEnabled = !!enabled;
}

export function vibrateTap() {
  if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(10);
  } catch (e) {
    // ignore
  }
}

export function vibrateWrong() {
  if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate([15, 40, 15]);
  } catch (e) {
    // ignore
  }
}

export function vibrateWin() {
  if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    // Rising pattern on win
    navigator.vibrate([20, 50, 30, 50, 50]);
  } catch (e) {
    // ignore
  }
}

export function vibrateError() {
  if (!hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    // Short buzz on invalid
    navigator.vibrate(50);
  } catch (e) {
    // ignore
  }
}
