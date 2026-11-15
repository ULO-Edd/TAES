/**
 * Generates a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random username
 * @param {string} prefix - Optional prefix for the username (default: 'User')
 * @returns {string} Random username
 */
export function randomUsername(prefix = 'User') {
  const adjectives = [
    'Swift',
    'Brave',
    'Clever',
    'Mighty',
    'Silent',
    'Golden',
    'Shadow',
    'Cosmic',
    'Thunder',
    'Crystal',
    'Royal',
    'Fierce',
    'Epic',
    'Wild',
    'Mystic',
    'Blazing',
    'Frozen',
    'Storm',
    'Lunar',
    'Solar',
    'Neon',
    'Cyber',
    'Turbo',
    'Mega',
  ];

  const nouns = [
    'Wolf',
    'Dragon',
    'Phoenix',
    'Tiger',
    'Eagle',
    'Falcon',
    'Panther',
    'Lion',
    'Hawk',
    'Bear',
    'Fox',
    'Shark',
    'Cobra',
    'Raven',
    'Viper',
    'Ninja',
    'Warrior',
    'Knight',
    'Samurai',
    'Hunter',
    'Ranger',
    'Wizard',
    'Mage',
    'Hero',
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9999);

  return `${prefix}${adjective}${noun}${number}`;
}

/**
 * Generates a simple random username with just prefix and number
 * @param {string} prefix - Optional prefix for the username (default: 'User')
 * @returns {string} Random username like 'User1234'
 */
export function simpleUsername(prefix = 'User') {
  const number = Math.floor(Math.random() * 10000);
  return `${prefix}${number}`;
}

/**
 * Generates an array of random leaderboard entries
 * @param {number} count - Number of entries to generate
 * @param {number} minScore - Minimum score value
 * @param {number} maxScore - Maximum score value
 * @param {string} scoreField - Name of the score field (default: 'matches_won')
 * @returns {Array} Array of leaderboard entries
 */
export function generateLeaderboard(
  count = 10,
  minScore = 0,
  maxScore = 100,
  scoreField = 'matches_won',
) {
  const entries = [];

  for (let i = 0; i < count; i++) {
    entries.push({
      player_id: generateUUID(),
      username: randomUsername(),
      [scoreField]: randomNumber(minScore, maxScore),
    });
  }

  // Sort by score descending
  return entries.sort((a, b) => b[scoreField] - a[scoreField]);
}

/**
 * Generates a random UUID v4
 * @returns {string} Random UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a random array of numbers
 * @param {number} length - Length of array
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} Array of random numbers
 */
export function randomNumberArray(length, min, max) {
  return Array.from({ length }, () => randomNumber(min, max));
}
