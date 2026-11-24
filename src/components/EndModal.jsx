import React, { useState } from 'react';
import { X, Copy, Download, Check, MapPin, Wind, Droplets, Gauge, Eye, RefreshCw, Sparkles } from 'lucide-react';
import { getWeatherMeta } from '../engine/weatherCodes';
import { generateShareText, generateShareImageCard } from '../utils/shareCard';

export default function EndModal({
  isOpen,
  onClose,
  isWon,
  city,
  weather,
  guesses,
  dayNumber,
  isPractice,
  onPlayAgain,
  onInspectSky
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !city || !weather) return null;

  const meta = getWeatherMeta(weather.current.weather_code);
  const tempC = Math.round(weather.current.temperature_2m);
  const tempF = Math.round(tempC * 9/5 + 32);

  const handleCopyText = async () => {
    const text = generateShareText({
      dayNumber,
      isWon,
      guesses,
      city,
      weather,
      isPractice
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleDownloadImage = () => {
    setDownloading(true);
    try {
      const dataUrl = generateShareImageCard({
        dayNumber,
        isWon,
        guesses,
        city,
        weather,
        isPractice
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `aether-${city.name.toLowerCase().replace(/\s+/g, '-')}-bulletin.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0b101c]/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Victory / Defeat Header */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wider uppercase mb-3 border">
            {isWon ? (
              <span className="text-emerald-300 bg-emerald-500/20 border-emerald-400/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Solved in {guesses.length}/6 Guesses
              </span>
            ) : (
              <span className="text-rose-300 bg-rose-500/20 border-rose-400/30 px-3 py-0.5 rounded-full">
                Atmosphere Unresolved
              </span>
            )}
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-wide">
            {city.name}
          </h2>
          <p className="text-sm font-sans text-sky-300/90 font-medium mt-1">
            {city.country} • {city.continent}
          </p>
          <p className="text-[11px] font-mono text-white/40 mt-1">
            {Math.abs(city.lat).toFixed(2)}°{city.lat >= 0 ? 'N' : 'S'}, {Math.abs(city.lon).toFixed(2)}°{city.lon >= 0 ? 'E' : 'W'}
          </p>
        </div>

        {/* Live Weather Bulletin Card */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 my-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono tracking-widest uppercase text-sky-400">
              Live Conditions
            </span>
            <span className="text-xs font-mono text-white/50">
              {weather.timezone || 'Local Time'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold font-sans text-white">
              {tempC}°C <span className="text-lg font-normal text-white/50">/ {tempF}°F</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white/90">{meta.label}</div>
              <div className="text-xs text-white/50 font-mono">{meta.feel}</div>
            </div>
          </div>

          {/* Meteorological Matrix */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center font-mono">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center justify-center gap-1 text-[11px] text-white/50 mb-0.5">
                <Wind className="w-3 h-3 text-sky-400" /> Wind
              </div>
              <div className="text-xs font-semibold text-white">
                {Math.round(weather.current.wind_speed_10m)} km/h
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center justify-center gap-1 text-[11px] text-white/50 mb-0.5">
                <Droplets className="w-3 h-3 text-blue-400" /> Humidity
              </div>
              <div className="text-xs font-semibold text-white">
                {weather.current.relative_humidity_2m || 55}%
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center justify-center gap-1 text-[11px] text-white/50 mb-0.5">
                <Gauge className="w-3 h-3 text-indigo-400" /> Pressure
              </div>
              <div className="text-xs font-semibold text-white">
                {Math.round(weather.current.surface_pressure || 1013)} hPa
              </div>
            </div>
          </div>
        </div>

        {/* Guesses Recap */}
        <div className="my-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {guesses.map((g, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-white/80"
            >
              <span>#{i + 1} {g.city.name}</span>
              <span className={g.distanceKm === 0 ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                {g.distanceKm === 0 ? 'Exact Match (0 km)' : `${g.distanceKm.toLocaleString()} km ${g.direction.arrow}`}
              </span>
            </div>
          ))}
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl glass-pill border-white/20 text-white font-mono text-xs font-semibold hover:border-white/40 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sky-400" />
                <span>Copy Dispatch</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-mono text-xs font-semibold shadow-lg shadow-sky-500/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Card</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10">
          <button
            onClick={onInspectSky}
            className="flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Gaze at Clear Sky</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="flex items-center gap-1.5 text-xs font-mono text-amber-300 hover:text-amber-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isPractice ? "Next Mystery City" : "Practice Mode"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
