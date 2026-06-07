const { DropQueue } = require('../../mint/DropQueue');
const path = require('path');

module.exports = (bot) => {
  bot.command('list', async (ctx) => {
    try {
      const queueFile = path.resolve(process.cwd(), 'drops.json');
      const queue = new DropQueue(queueFile);
      const drops = queue.list();

      if (drops.length === 0) {
        return ctx.reply('No drops queued.');
      }

      let message = '📋 Queued Drops:\n\n';
      drops.forEach(d => {
        const time = new Date(d.mintTime).toISOString();
        message += `• ${d.id} | ${d.contract} | ${time} | ${d.status}\n`;
      });

      ctx.reply(message);

    } catch (err) {
      ctx.reply('❌ Failed to list drops.');
      console.error(err);
    }
  });
};