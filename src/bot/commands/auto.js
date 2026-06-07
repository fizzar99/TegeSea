const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const chains = require('../../../config/chains');

let engineInstance = null;

module.exports = (bot) => {
  bot.command('auto', async (ctx) => {
    if (engineInstance) {
      return ctx.reply('⚠️ Monitoring engine is already running.');
    }

    try {
      const rpcUrl = chains.base || chains.ethereum;
      const privateKeys = loadPrivateKeys();

      if (privateKeys.length === 0) {
        return ctx.reply('❌ No private keys found. Use /pk to upload.');
      }

      engineInstance = new MintEngine({
        rpcUrl,
        privateKeys,
      });

      ctx.reply('🚀 Auto monitoring started!\nYou will receive alerts 10 minutes before drops.');

      // Start engine with alert integration
      engineInstance.start({
        onAlert: (drop) => {
          const timeLeft = Math.floor((drop.mintTime - Date.now()) / 60000);
          bot.telegram.sendMessage(
            ctx.chat.id,
            `⏰ Alert: Drop ${drop.id} will start in ~${timeLeft} minutes!\nContract: ${drop.contract}`
          );
        },
        onComplete: (results) => {
          bot.telegram.sendMessage(
            ctx.chat.id,
            `✅ Mint completed!\nSuccessful: ${results.successful} | Reverted: ${results.reverted}`
          );
        }
      });

    } catch (err) {
      ctx.reply(`❌ Failed to start auto mode: ${err.message}`);
      console.error(err);
      engineInstance = null;
    }
  });
};