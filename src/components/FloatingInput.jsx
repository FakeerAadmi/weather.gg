import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlyphSearch, GlyphClose, GlyphMapPin, GlyphArrowRight } from './Glyphs';
import cities from '../data/cities.json';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function FloatingInput({
  onGuess,
  disabled = false,
  guessedCityIds = [],
  keyboardOffset = 0
}) {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter cities as query changes
  useEffect(() => {
    // If city is already selected and query matches its name, don't reopen dropdown
    if (selectedCity && query === `${selectedCity.name}, ${selectedCity.country}`) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Match name or country
    const matches = cities
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(trimmed);
        const countryMatch = c.country.toLowerCase().includes(trimmed);
        return nameMatch || countryMatch;
      })
      .slice(0, 5);

    setSuggestions(matches);
    setSelectedIndex(matches.length > 0 ? 0 : -1);
    setIsOpen(matches.length > 0);
  }, [query, selectedCity]);

  // Handle outside click/tap
  useEffect(() => {
    const handleOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const handleSelectCity = (city) => {
    sound.playTap();
    vibrateTap();
    setSelectedCity(city);
    setQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    sound.playTap();
    setQuery('');
    setSelectedCity(null);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!selectedCity || disabled) return;
    onGuess(selectedCity);
    setQuery('');
    setSelectedCity(null);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedCity) {
        handleSubmit();
      } else if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectCity(suggestions[selectedIndex]);
      } else if (suggestions.length === 1) {
        handleSelectCity(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col items-center pointer-events-none transition-transform duration-150 ease-out"
      style={{
        transform: `translateY(-${keyboardOffset}px)`,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
      }}
    >
      <div className="relative w-full max-w-lg mx-auto px-4 pointer-events-auto">
        {/* Autocomplete List Opening Upward */}
        <AnimatePresence>
          {isOpen && suggestions.length > 0 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute bottom-full mb-2 inset-x-4 max-h-[36dvh] overflow-y-auto rounded-2xl surface-pill p-1.5 shadow-2xl z-40"
            >
              {suggestions.map((city, idx) => {
                const isSelected = idx === selectedIndex;
                const isAlreadyGuessed = guessedCityIds.includes(city.id);

                return (
                  <div
                    key={city.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      if (!isAlreadyGuessed) handleSelectCity(city);
                    }}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer text-sm font-medium transition-colors ${
                      isAlreadyGuessed
                        ? 'opacity-40 cursor-not-allowed text-[var(--text-muted)]'
                        : isSelected
                        ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                      <GlyphMapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {city.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] truncate">
                        {city.country}
                      </span>
                    </div>

                    <span className="text-xs text-[var(--text-muted)] uppercase shrink-0">
                      {isAlreadyGuessed ? 'Already guessed' : city.continent}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Input Pill */}
        <div className="h-14 w-full rounded-full surface-pill flex items-center px-4 gap-2.5 shadow-lg">
          <div className="text-[var(--text-muted)] shrink-0">
            <GlyphSearch className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedCity(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              sound.unlock();
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={disabled ? "Deduction completed" : "Where in the world?"}
            className="w-full min-w-0 bg-transparent text-base font-normal text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            autoComplete="off"
            spellCheck="false"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              aria-label="Clear input"
            >
              <GlyphClose className="w-4 h-4" />
            </button>
          )}

          {/* Animated Guess Button: Appears ONLY after a city is selected! */}
          <AnimatePresence>
            {selectedCity && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.85, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.85, width: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 22
                }}
                onClick={handleSubmit}
                className="h-10 px-5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-semibold flex items-center gap-1.5 shrink-0 hover:bg-[var(--accent-hover)] transition-colors active:scale-95"
              >
                <span>Guess</span>
                <GlyphArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
