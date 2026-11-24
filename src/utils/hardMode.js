/**
 * hardMode.js
 * Solvability & Hard Mode validator.
 * Enforces that guesses in Hard Mode comply with all currently revealed clues.
 */

export function validateHardModeGuess(guessedCity, targetCity, unlockedCluesCount) {
  if (unlockedCluesCount < 2) {
    return { valid: true };
  }

  // Clue 2: Hemisphere check (unlocked at 2+ wrong guesses)
  if (unlockedCluesCount >= 2) {
    const targetIsNorth = targetCity.lat >= 0;
    const guessIsNorth = guessedCity.lat >= 0;
    if (targetIsNorth !== guessIsNorth) {
      return {
        valid: false,
        reason: `Hard Mode: Guess must be in the ${targetIsNorth ? 'Northern' : 'Southern'} Hemisphere`
      };
    }
  }

  // Clue 3: Continent check (unlocked at 3+ wrong guesses)
  if (unlockedCluesCount >= 3) {
    if (guessedCity.continent.toLowerCase() !== targetCity.continent.toLowerCase()) {
      return {
        valid: false,
        reason: `Hard Mode: Guess must be in ${targetCity.continent}`
      };
    }
  }

  // Clue 4: Country Initial check (unlocked at 5 clues revealed)
  if (unlockedCluesCount >= 5) {
    const targetInitial = targetCity.country.charAt(0).toUpperCase();
    const guessInitial = guessedCity.country.charAt(0).toUpperCase();
    if (targetInitial !== guessInitial) {
      return {
        valid: false,
        reason: `Hard Mode: Country must start with "${targetInitial}"`
      };
    }
  }

  return { valid: true };
}
