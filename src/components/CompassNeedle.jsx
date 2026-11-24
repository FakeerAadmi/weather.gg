import React from 'react';
import { motion } from 'framer-motion';

export default function CompassNeedle({ angle = 0, size = 18, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={`Bearing: ${Math.round(angle)}°`}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ rotate: 0 }}
        animate={{ rotate: angle }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 11,
          mass: 0.8
        }}
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="6 11 12 5 18 11" />
      </motion.svg>
    </div>
  );
}
