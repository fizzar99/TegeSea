const autoCommand = require('./auto');

module.exports = (bot) => {
  bot.command('stop', (ctx) => {
    const engine = autoCommand.getEngine ? autoCommand.getEngine() : null;

    if (!engine) {
      return ctx.reply('⚠️ Monitoring engine is not running.');
    }

    engine.stop();
    autoCommand.setEngine(null);
    ctx.reply('🛑 Monitoring stopped.');
  });
};