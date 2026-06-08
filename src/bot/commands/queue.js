const chains = require('../../../config/chains');
const { loadPrivateKeys } = require('../../mint/KeyLoader');
const ParallelMinter = require('../../mint/ParallelMinter');
const DropQueue = require('../../mint/DropQueue');
const { isValidAddress } = require('../../utils/validate');
const path = require('path');

module.exports = (bot) => {
  bot.command('queue', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      return ctx.reply('Usage: /queue <chain> <contract>\nExample: /queue polygon 0x123...');
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
      
      // Use ParallelMinter directly for discovery (lighter)
      const minter = new ParallelMinter({ rpcUrl, privateKeys });
      const dropInfo = await minter.discover(contract);
      
      // Use DropQueue directly (no need for full MintEngine)
      const queueFile = path.resolve(process.cwd(), 'drops.json');
      const queue = new DropQueue(queueFile);

      const drop = queue.add({
        contract,
        chain: chainName.toLowerCase(),
        rpcUrl,
        mintTimeISO: new Date(dropInfo.startTime * 1000).toISOString(),
        maxPerWallet: dropInfo.maxPerWallet,
        notes: `Queued via Telegram on ${chainName}`,
      });

      ctx.reply(
        `✅ Drop queued successfully!\n\n` +
        `ID: ${drop.id}\n` +
        `Chain: ${chainName}\n` +
        `Contract: ${contract}\n` +
        `Start Time: ${new Date(dropInfo.startTime * 1000).toISOString()}\n` +
        `Price: ${Number(dropInfo.mintPrice) / 1e18} ETH`
      );

    } catch (err) {
      ctx.reply(`❌ Failed to queue drop: ${err.message}`);
    }
  });
};