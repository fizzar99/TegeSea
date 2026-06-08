/**
 * validate.js — Input validation helpers
 */

/**
 * Check if a string is a valid Ethereum address (0x + 40 hex chars).
 * @param {string} address
 * @returns {boolean}
 */
function isValidAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

module.exports = { isValidAddress };
