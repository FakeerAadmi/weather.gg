import React from 'react';
import { getAmbientGradients } from '../utils/atmosphere';

export default function AtmosphericAmbient({ weather }) {
  const ambient = getAmbientGradients(weather);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ease-out"
      style={{
        background: ambient.background,
        willChange: 'opacity'
      }}
    />
  );
}
