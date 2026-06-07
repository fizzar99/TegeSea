const { getEngine, setEngine } = require('../engineManager');

module.exports = (bot) => {
  bot.command('stop', (ctx) => {
    const engine = getEngine();

    if (!engine) {
      return ctx.reply('⚠️ Monitoring engine is not running.');
    }

    engine.stop();
    setEngine(null);
    ctx.reply('🛑 Monitoring stopped.');
  });
};