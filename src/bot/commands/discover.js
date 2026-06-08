const chains = require('../../../config/chains');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const ParallelMinter = require('../../mint/ParallelMinter');
const { isValidAddress } = require('../../utils/validate');

module.exports = (bot) => {
  bot.command('discover', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('Usage: /discover <chain> <contract>');
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
      const minter = new ParallelMinter({ rpcUrl, privateKeys });

      const info = await minter.discover(contract);

      ctx.reply(
        `🔍 Discovered Drop on ${chainName}:\n\n` +
        `NFT: ${info.nftAddress}\n` +
        `Price: ${Number(info.mintPrice) / 1e18} ETH\n` +
        `Start: ${new Date(info.startTime * 1000).toISOString()}\n` +
        `End: ${new Date(info.endTime * 1000).toISOString()}\n` +
        `Max per wallet: ${info.maxPerWallet}\n` +
        `Fee: ${info.feeBps / 100}%\n` +
        `Status: ${info.isActive ? '🔥 ACTIVE' : info.isUpcoming ? '⏳ Upcoming' : '❌ Ended'}`
      );
    } catch (err) {
      ctx.reply(`❌ Discovery failed: ${err.message}`);
      console.error(err);
    }
  });
};
