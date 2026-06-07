const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const chains = require('../../../config/chains');

const allowedUsers = (process.env.ALLOWED_USERS || '')
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(Boolean);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.use((ctx, next) => {
  const userId = ctx.from?.id;
  if (!allowedUsers.includes(userId)) {
    return ctx.reply('❌ You are not authorized to use this bot.');
  }
  return next();
});

// Load commands
require('./commands/queue')(bot);
require('./commands/list')(bot);
require('./commands/remove')(bot);
require('./commands/fire')(bot);
require('./commands/discover')(bot);
require('./commands/auto')(bot);
require('./commands/stop')(bot);

bot.start((ctx) => {
  ctx.reply(
    '🚀 SeaDrop Mint Bot\n\n' +
    'Available commands:\n' +
    '/queue <chain> <contract>\n' +
    '/list\n' +
    '/remove <id>\n' +
    '/fire <chain> <contract>\n' +
    '/discover <chain> <contract>\n' +
    '/auto - Start auto monitoring\n' +
    '/stop - Stop monitoring\n' +
    '/pk - Upload private keys file'
  );
});

bot.command('pk', async (ctx) => {
  await ctx.reply('Please send your pk.txt file (one private key per line).');
});

bot.on('document', async (ctx) => {
  if (ctx.message.document.file_name !== 'pk.txt') {
    return ctx.reply('❌ Please send a file named pk.txt');
  }

  try {
    const fileLink = await ctx.telegram.getFileLink(ctx.message.document.file_id);
    const response = await fetch(fileLink);
    const content = await response.text();

    const pkPath = path.join(process.cwd(), 'pk.txt');
    fs.writeFileSync(pkPath, content);

    ctx.reply('✅ Private keys have been added');
  } catch (err) {
    ctx.reply('❌ Failed to save private keys.');
    console.error(err);
  }
});

bot.launch();
console.log('🤖 Telegram bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));