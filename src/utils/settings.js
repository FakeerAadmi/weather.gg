import { sound } from './sound';
import { setHapticsEnabled } from './haptics';

const SETTINGS_KEY = 'aether_settings_v2';

export const DEFAULT_SETTINGS = {
  theme: 'system', // 'system' | 'dark' | 'light'
  sound: true,
  haptics: true,
  reducedMotion: false,
  highContrast: false,
  hardMode: false
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export function applySettingsToDOM(settings) {
  const root = document.documentElement;

  // Theme
  let activeTheme = settings.theme;
  if (activeTheme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    activeTheme = prefersDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', activeTheme);

  // High contrast
  root.setAttribute('data-high-contrast', settings.highContrast ? 'true' : 'false');

  // Reduced motion
  root.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false');

  // Audio & Haptics sync
  sound.setEnabled(settings.sound);
  setHapticsEnabled(settings.haptics);
}
