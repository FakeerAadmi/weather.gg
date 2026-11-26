import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

const MIN_TEMP_C = -25;
const MAX_TEMP_C = 45;

export function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}

export function getThermalDescription(c) {
  if (c <= -10) return 'Sub-zero deep freeze';
  if (c <= 0) return 'Freezing frost';
  if (c <= 7) return 'Cold winter air';
  if (c <= 14) return 'Cool crisp breeze';
  if (c <= 20) return 'Mild temperate';
  if (c <= 26) return 'Warm comfortable';
  if (c <= 32) return 'Very warm summer';
  return 'Hot intense heat';
}

export function getThermalColor(c) {
  // -25 to +45 mapped to 0 to 1
  const t = Math.max(0, Math.min(1, (c - MIN_TEMP_C) / (MAX_TEMP_C - MIN_TEMP_C)));
  if (t < 0.25) return '#38bdf8'; // Ice blue
  if (t < 0.45) return '#60a5fa'; // Blue
  if (t < 0.65) return '#34d399'; // Mild green
  if (t < 0.8) return '#fbbf24';  // Warm amber
  return '#f87171';              // Coral red
}

export default function TemperatureDial({
  valueC,
  onChange,
  disabled = false,
  actualTempC = null, // revealed on lock in
  unit = 'C',
  onToggleUnit
}) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTickValue = useRef(valueC);

  const displayVal = unit === 'F' ? cToF(valueC) : valueC;
  const unitSymbol = unit === 'F' ? '°F' : '°C';

  const pct = Math.max(0, Math.min(100, ((valueC - MIN_TEMP_C) / (MAX_TEMP_C - MIN_TEMP_C)) * 100));
  const actualPct =
    actualTempC !== null
      ? Math.max(0, Math.min(100, ((actualTempC - MIN_TEMP_C) / (MAX_TEMP_C - MIN_TEMP_C)) * 100))
      : null;

  const updateFromClientX = (clientX) => {
    if (disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawC = Math.round(MIN_TEMP_C + ratio * (MAX_TEMP_C - MIN_TEMP_C));

    if (rawC !== lastTickValue.current) {
      lastTickValue.current = rawC;
      sound.playTap();
      vibrateTap();
      onChange(rawC);
    }
  };

  const handlePointerDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    updateFromClientX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging && !disabled) {
      updateFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const adjustBy = (delta) => {
    if (disabled) return;
    const next = Math.max(MIN_TEMP_C, Math.min(MAX_TEMP_C, valueC + delta));
    if (next !== valueC) {
      sound.playTap();
      vibrateTap();
      onChange(next);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none py-2">
      {/* 1. Big Odometer-Style Temperature Readout */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-baseline gap-1">
          <span
            className="text-6xl sm:text-7xl font-bold tracking-[-0.04em] tabular transition-colors duration-200"
            style={{ color: getThermalColor(valueC) }}
          >
            {displayVal > 0 ? `+${displayVal}` : displayVal}
          </span>
          <button
            onClick={onToggleUnit}
            disabled={disabled}
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1 p-1"
            title="Toggle °C / °F"
          >
            {unitSymbol}
          </button>
        </div>

        {/* Ambient feeling description */}
        <div className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
          {getThermalDescription(valueC)}
        </div>
      </div>

      {/* 2. Tactile Linear Dial Slider */}
      <div className="w-full px-2 relative mb-6">
        {/* Track wrapper */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full h-12 flex items-center cursor-pointer touch-none ${
            disabled ? 'cursor-default opacity-85' : ''
          }`}
        >
          {/* Background Track Line */}
          <div className="w-full h-2 rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden relative border border-[var(--border-hairline)]">
            {/* Thermal Gradient Fill */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-75"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, #38bdf8 0%, #34d399 50%, #f87171 100%)`
              }}
            />
          </div>

          {/* Graduation Ticks (-20, -10, 0, 10, 20, 30, 40) */}
          <div className="absolute inset-x-0 top-7 flex justify-between pointer-events-none px-1 text-[10px] text-[var(--text-muted)] font-medium tabular">
            <span>-20°</span>
            <span>-10°</span>
            <span>0°</span>
            <span>10°</span>
            <span>20°</span>
            <span>30°</span>
            <span>40°</span>
          </div>

          {/* User Dial Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform"
            style={{
              left: `${pct}%`,
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`
            }}
          >
            <div
              className="w-7 h-7 rounded-full bg-white shadow-lg border-2 flex items-center justify-center transition-colors"
              style={{ borderColor: getThermalColor(valueC) }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getThermalColor(valueC) }}
              />
            </div>
          </div>

          {/* Revealed Actual Temperature Marker (if round ended) */}
          {actualPct !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
              style={{ left: `${actualPct}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--status-success)] text-white shadow-xl flex items-center justify-center font-bold text-xs ring-4 ring-black/40">
                ✓
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 3. Fine-Tune Nudge Buttons (-1° / +1°) */}
      {!disabled && (
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => adjustBy(-1)}
            className="px-4 py-2 rounded-full surface-pill text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all touch-target"
            aria-label="Decrease 1 degree"
          >
            − 1°
          </button>
          <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
            Fine tune
          </span>
          <button
            onClick={() => adjustBy(1)}
            className="px-4 py-2 rounded-full surface-pill text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all touch-target"
            aria-label="Increase 1 degree"
          >
            + 1°
          </button>
        </div>
      )}
    </div>
  );
}
