import React, { useState, useRef, useEffect } from 'react';
import { GlyphSearch, GlyphClose, GlyphMapPin, GlyphArrowRight } from './Glyphs';
import cities from '../data/cities.json';
import { sound } from '../utils/sound';
import { vibrateTap } from '../utils/haptics';

export default function GuessInput({
  onGuess,
  disabled = false,
  guessedCityIds = [],
  isShaking = false
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter cities as query changes
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const matches = cities.filter(c => {
      if (guessedCityIds.includes(c.id)) return false;
      const nameMatch = c.name.toLowerCase().includes(trimmed);
      const countryMatch = c.country.toLowerCase().includes(trimmed);
      return nameMatch || countryMatch;
    }).slice(0, 6);

    setSuggestions(matches);
    setSelectedIndex(matches.length > 0 ? 0 : -1);
    setIsOpen(matches.length > 0);
  }, [query, guessedCityIds]);

  // Handle outside click/tap to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelectCity = (city) => {
    if (!city || disabled) return;
    vibrateTap();
    sound.playTap();
    onGuess(city);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
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
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectCity(suggestions[selectedIndex]);
      } else if (suggestions.length === 1) {
        handleSelectCity(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto px-3 sm:px-4 z-20">
      {/* Upward Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 left-3 right-3 sm:left-4 sm:right-4 max-h-[35dvh] overflow-y-auto rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-1 shadow-xl z-30"
          role="listbox"
        >
          {suggestions.map((city, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={city.id}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelectCity(city)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer text-xs sm:text-sm font-sans transition-colors touch-target ${
                  isSelected
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                  <GlyphMapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="font-semibold text-[var(--text-primary)] truncate">
                    {city.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                    {city.country}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase shrink-0 ml-1">
                  {city.continent}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Pinned Input Container */}
      <div
        className={`flex items-center gap-1.5 p-1 rounded-lg border bg-[var(--bg-surface)] transition-all min-w-0 touch-target ${
          isShaking
            ? 'animate-shake border-[var(--status-error)]'
            : 'border-[var(--border-subtle)] focus-within:border-[var(--border-active)]'
        }`}
      >
        <div className="pl-3 text-[var(--text-muted)] shrink-0">
          <GlyphSearch className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            sound.unlock();
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={disabled ? "Game completed" : "Enter a world city..."}
          className="w-full min-w-0 bg-transparent px-2 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
          autoComplete="off"
          spellCheck="false"
          aria-label="Guess a city"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            aria-label="Clear input"
          >
            <GlyphClose className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          disabled={disabled || suggestions.length === 0}
          onClick={() => {
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
              handleSelectCity(suggestions[selectedIndex]);
            } else if (suggestions.length > 0) {
              handleSelectCity(suggestions[0]);
            }
          }}
          className={`px-4 py-2 rounded-md font-mono text-xs font-semibold tracking-wider flex items-center gap-1.5 shrink-0 touch-target transition-all ${
            disabled || suggestions.length === 0
              ? 'opacity-40 cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--text-muted)]'
              : 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] active:scale-95'
          }`}
        >
          <span>GUESS</span>
          <GlyphArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
