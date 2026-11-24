import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, X, MapPin } from 'lucide-react';
import cities from '../data/cities.json';

export default function GuessInput({ onGuess, disabled = false, guessedCityIds = [] }) {
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
    }).slice(0, 7); // Show top 7 matches

    setSuggestions(matches);
    setSelectedIndex(matches.length > 0 ? 0 : -1);
    setIsOpen(matches.length > 0);
  }, [query, guessedCityIds]);

  // Handle outside click or tap to close dropdown
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
    <div className="relative w-full max-w-lg mx-auto px-3 sm:px-4 z-20 pointer-events-auto">
      {/* Autocomplete Dropdown (pops UP above the input) */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 left-3 right-3 sm:left-4 sm:right-4 max-h-[35dvh] overflow-y-auto rounded-2xl glass-card p-1.5 shadow-2xl z-30 animate-slide-up"
        >
          {suggestions.map((city, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={city.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelectCity(city)}
                className={`flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl cursor-pointer text-xs sm:text-sm font-sans transition-colors ${
                  isSelected
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-semibold truncate">{city.name}</span>
                  <span className="text-[11px] text-white/50 font-mono truncate">
                    {city.country}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase shrink-0 ml-1">
                  {city.continent}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Low-Pinned Input Pill */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full glass-pill border border-white/20 transition-all min-w-0">
        <div className="pl-2.5 sm:pl-3 text-white/50 shrink-0">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={disabled ? "Game completed" : "Identify this city..."}
          className="w-full min-w-0 bg-transparent px-1.5 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none font-sans"
          autoComplete="off"
          spellCheck="false"
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
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Clear input"
          >
            <X className="w-3.5 h-3.5" />
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
          className={`px-3.5 sm:px-4 py-2 rounded-full font-mono text-xs font-semibold tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${
            disabled || suggestions.length === 0
              ? 'opacity-40 cursor-not-allowed bg-white/10 text-white/50'
              : 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-95'
          }`}
        >
          <span>Guess</span>
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
