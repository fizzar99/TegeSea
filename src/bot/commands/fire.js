const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const chains = require('../../../config/chains');
const { isValidAddress } = require('../../utils/validate');

module.exports = (bot) => {
  bot.command('fire', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('Usage: /fire <chain> <contract>\nExample: /fire base 0x123...');
    }

    const [chainName, contract] = args;

    if (!isValidAddress(contract)) {
      return ctx.reply('❌ Invalid contract address. Must be 0x followed by 40 hex characters.');
    }

    const rpcUrl = chains[chainName.toLowerCase()];

    if (!rpcUrl) {
      return ctx.reply(`❌ Unsupported chain: ${chainName}`);
    }

    try {
      const privateKeys = loadPrivateKeys();
      if (privateKeys.length === 0) {
        return ctx.reply('❌ No private keys found. Use /pk to upload.');
      }

      const engine = new MintEngine({ rpcUrl, privateKeys });
      
      ctx.reply(`🔥 Firing mint for ${contract} on ${chainName}...`);

      const results = await engine.fireNow(contract, rpcUrl);

      ctx.reply(
        `📊 Mint Results:\n` +
        `✅ Successful: ${results.successful}\n` +
        `❌ Reverted: ${results.reverted}\n` +
        `⚠️ Failed: ${results.failed}`
      );

    } catch (err) {
      ctx.reply(`❌ Fire failed: ${err.message}`);
      console.error(err);
    }
  });
};