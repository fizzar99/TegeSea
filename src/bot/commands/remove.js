const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const chains = require('../../../config/chains');

module.exports = (bot) => {
  bot.command('remove', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('Usage: /remove <id>');
    }

    const [id] = args;

    try {
      const rpcUrl = chains.base || chains.ethereum;
      const privateKeys = loadPrivateKeys();
      const engine = new MintEngine({ rpcUrl, privateKeys });

      const success = engine.removeDrop(id);

      if (success) {
        ctx.reply(`✅ Drop ${id} removed.`);
      } else {
        ctx.reply('❌ Drop not found.');
      }
    } catch (err) {
      ctx.reply('❌ Failed to remove drop.');
      console.error(err);
    }
  });
};