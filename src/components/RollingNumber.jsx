import React from 'react';
import { motion } from 'framer-motion';

function DigitColumn({ digit, delay = 0 }) {
  const num = parseInt(digit, 10);
  if (isNaN(num)) {
    return <span className="inline-block tabular">{digit}</span>;
  }

  return (
    <span
      className="inline-block h-[1.25em] overflow-hidden align-baseline tabular"
      style={{ width: '0.62em' }}
    >
      <motion.span
        className="flex flex-col text-center"
        initial={{ y: '0%' }}
        animate={{ y: `-${num * 10}%` }}
        transition={{
          type: 'spring',
          stiffness: 90,
          damping: 14,
          delay: delay
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1.25em] leading-[1.25em] block">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export default function RollingNumber({ value, suffix = '', className = '' }) {
  const str = String(value);
  let digitIndex = 0;

  return (
    <span className={`inline-flex items-baseline tabular ${className}`}>
      {str.split('').map((char, i) => {
        const isDigit = /\d/.test(char);
        const delay = isDigit ? (digitIndex++) * 0.06 : 0;

        if (!isDigit) {
          return (
            <span key={i} className="inline-block px-[0.05em] tabular">
              {char}
            </span>
          );
        }

        return <DigitColumn key={i} digit={char} delay={delay} />;
      })}
      {suffix && <span className="ml-[0.1em]">{suffix}</span>}
    </span>
  );
}
