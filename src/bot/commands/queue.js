const chains = require('../../../config/chains');
const { MintEngine } = require('../../mint/MintEngine');
const { loadPrivateKeys } = require('../../mint/KeyLoader');

module.exports = (bot) => {
  bot.command('queue', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      return ctx.reply('Usage: /queue <chain> <contract>\nExample: /queue polygon 0x123...');
    }

    const [chainName, contract] = args;
    const rpcUrl = chains[chainName.toLowerCase()];

    if (!rpcUrl) {
      return ctx.reply(`❌ Unsupported chain: ${chainName}`);
    }

    try {
      const privateKeys = loadPrivateKeys();
      
      const engine = new MintEngine({
        rpcUrl,
        privateKeys,
      });

      const dropInfo = await engine.minter.discover(contract);
      
      const drop = engine.addDrop({
        contract,
        startTimeISO: new Date(dropInfo.startTime * 1000).toISOString(),
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