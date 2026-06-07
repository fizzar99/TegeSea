const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const chains = require('../../../config/chains');

module.exports = (bot) => {
  bot.command('discover', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('Usage: /discover <chain> <contract>');
    }

    const [chainName, contract] = args;
    const rpcUrl = chains[chainName.toLowerCase()];

    if (!rpcUrl) {
      return ctx.reply(`❌ Unsupported chain: ${chainName}`);
    }

    try {
      const privateKeys = loadPrivateKeys();
      const engine = new MintEngine({ rpcUrl, privateKeys });

      const info = await engine.minter.discover(contract);

      ctx.reply(
        `🔍 Discovered Drop on ${chainName}:\n\n` +
        `NFT: ${info.nftAddress}\n` +
        `Price: ${Number(info.mintPrice) / 1e18} ETH\n` +
        `Start: ${new Date(info.startTime * 1000).toISOString()}\n` +
        `Max per wallet: ${info.maxPerWallet}\n` +
        `Fee: ${info.feeBps / 100}%`
      );
    } catch (err) {
      ctx.reply(`❌ Discovery failed: ${err.message}`);
      console.error(err);
    }
  });
};