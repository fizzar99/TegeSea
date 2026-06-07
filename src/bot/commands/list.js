const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const chains = require('../../../config/chains');

module.exports = (bot) => {
  bot.command('list', async (ctx) => {
    try {
      // For simplicity, we use a default chain (base) to initialize engine
      const rpcUrl = chains.base || chains.ethereum;
      const privateKeys = loadPrivateKeys();

      if (!rpcUrl) {
        return ctx.reply('❌ No RPC configured');
      }

      const engine = new MintEngine({ rpcUrl, privateKeys });
      const drops = engine.listDrops();

      if (drops.length === 0) {
        return ctx.reply('No drops queued.');
      }

      let message = '📋 Queued Drops:\n\n';
      drops.forEach(d => {
        const time = new Date(d.mintTime).toISOString();
        message += `• ${d.id} | ${d.contract} | ${time} | ${d.status}\n`;
      });

      ctx.reply(message);

    } catch (err) {
      ctx.reply('❌ Failed to list drops.');
      console.error(err);
    }
  });
};