let engineInstance = null;

module.exports = (bot) => {
  bot.command('stop', (ctx) => {
    if (!engineInstance) {
      return ctx.reply('⚠️ Monitoring engine is not running.');
    }

    engineInstance.stop();
    engineInstance = null;
    ctx.reply('🛑 Monitoring stopped.');
  });
};