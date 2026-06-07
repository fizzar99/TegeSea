const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const chains = require('../../../config/chains');

// Shared engine instance
let engineInstance = null;

module.exports = (bot) => {
  bot.command('auto', async (ctx) => {
    if (engineInstance) {
      return ctx.reply('⚠️ Monitoring engine is already running.\nUse /stop to stop it first.');
    }

    try {
      const rpcUrl = chains.base || chains.ethereum;
      const privateKeys = loadPrivateKeys();

      if (privateKeys.length === 0) {
        return ctx.reply('❌ No private keys found. Use /pk to upload.');
      }

      // Create engine with alert callbacks
      engineInstance = new MintEngine({
        rpcUrl,
        privateKeys,
        onAlert: (drop) => {
          const timeLeft = Math.floor((drop.mintTime - Date.now()) / 60000);
          bot.telegram.sendMessage(
            ctx.chat.id,
            `⏰ Alert: Drop #${drop.id} will start in ~${timeLeft} minutes!\n` +
            `Contract: ${drop.contract}\n` +
            `Use /list to see details.`
          ).catch(console.error);
        },
        onComplete: (results) => {
          bot.telegram.sendMessage(
            ctx.chat.id,
            `✅ Mint completed!\n` +
            `Successful: ${results.successful} | Reverted: ${results.reverted} | Failed: ${results.failed || 0}`
          ).catch(console.error);
        }
      });

      engineInstance.start();

      ctx.reply(
        '🚀 Auto monitoring started!\n\n' +
        '• You will receive alerts 10 minutes before each drop\n' +
        '• Drops will be minted automatically at T-0\n' +
        '• Use /stop to stop monitoring'
      );

    } catch (err) {
      ctx.reply(`❌ Failed to start auto mode: ${err.message}`);
      console.error(err);
      engineInstance = null;
    }
  });

  // Export getter for stop command
  module.exports.getEngine = () => engineInstance;
  module.exports.setEngine = (engine) => { engineInstance = engine; };
};