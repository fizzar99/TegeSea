const DropQueue = require('../../mint/DropQueue');
const path = require('path');

module.exports = (bot) => {
  bot.command('remove', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply('Usage: /remove <id>');
    }

    const [id] = args;

    try {
      const queueFile = path.resolve(process.cwd(), 'drops.json');
      const queue = new DropQueue(queueFile);

      const success = queue.remove(id);

      if (success) {
        ctx.reply(`✅ Drop ${id} removed.`);
      } else {
        ctx.reply('❌ Drop not found.');
      }
    } catch (err) {
      ctx.reply('❌ Failed to remove drop.');
      console.error(err);
    }
  });
};