/**
 * engineManager.js — Shared MintEngine instance management
 */
const { MintEngine } = require('../mint/MintEngine');
const { loadPrivateKeys } = require('../mint/KeyLoader');
const chains = require('../../config/chains');

let engineInstance = null;
let botInstance = null;

function getDefaultRpcUrl() {
  return chains.base || chains.ethereum;
}

function createEngine(options = {}) {
  const rpcUrl = options.rpcUrl || getDefaultRpcUrl();
  const privateKeys = options.privateKeys || loadPrivateKeys();

  if (privateKeys.length === 0) {
    throw new Error('No private keys found. Use /pk to upload.');
  }

  return new MintEngine({
    rpcUrl,
    privateKeys,
    ...options
  });
}

function getEngine() {
  return engineInstance;
}

function setEngine(engine) {
  engineInstance = engine;
}

function setBot(bot) {
  botInstance = bot;
}

function getBot() {
  return botInstance;
}

module.exports = {
  createEngine,
  getEngine,
  setEngine,
  setBot,
  getBot,
  getDefaultRpcUrl
};