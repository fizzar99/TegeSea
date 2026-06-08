const { createEngine, getEngine, setEngine } = require('../engineManager');

module.exports = (bot) => {
  bot.command('auto', async (ctx) => {
    if (getEngine()) {
      return ctx.reply('⚠️ Monitoring engine is already running.\nUse /stop to stop it first.');
    }

    try {
      const engine = createEngine({
        onAlert: (drop) => {
          const timeLeft = Math.floor((drop.mintTime - Date.now()) / 60000);
          bot.telegram.sendMessage(
            ctx.chat.id,
            `⏰ Alert: Drop #${drop.id} will start in ~${timeLeft} minutes!\n` +
            `Chain: ${drop.chain || 'default'}\n` +
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

      setEngine(engine);
      engine.start();

      ctx.reply(
        '🚀 Auto monitoring started!\n\n' +
        '• You will receive alerts 10 minutes before each drop\n' +
        '• Drops will be minted automatically at T-0\n' +
        '• Multi-chain drops are supported\n' +
        '• Use /stop to stop monitoring\n' +
        '• Use /status to check engine status'
      );

    } catch (err) {
      ctx.reply(`❌ Failed to start auto mode: ${err.message}`);
      console.error(err);
      setEngine(null);
    }
  });
};