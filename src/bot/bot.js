require('dotenv').config();

const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getEngine, setEngine } = require('./engineManager');

const allowedUsers = (process.env.ALLOWED_USERS || '')
  .split(',')
  .map(id => parseInt(id.trim()))
  .filter(Boolean);

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set in .env');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Whitelist middleware
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
require('./commands/status')(bot);

// /start command
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
    '/status - Check engine status\n' +
    '/pk - Upload private keys file'
  );
});

// /pk command
bot.command('pk', async (ctx) => {
  await ctx.reply('Please send your pk.txt file (one private key per line).');
});

// Handle pk.txt upload
bot.on('document', async (ctx) => {
  if (ctx.message.document.file_name !== 'pk.txt') {
    return ctx.reply('❌ Please send a file named pk.txt');
  }

  try {
    const fileLink = await ctx.telegram.getFileLink(ctx.message.document.file_id);
    const response = await axios.get(fileLink, { responseType: 'text' });
    const content = response.data;

    // Validate private keys
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    if (lines.length === 0) {
      return ctx.reply('❌ File is empty or contains no valid keys.');
    }

    const validKeyPattern = /^(0x)?[0-9a-fA-F]{64}$/;
    const invalidLines = [];
    lines.forEach((line, i) => {
      if (!validKeyPattern.test(line)) {
        invalidLines.push(i + 1);
      }
    });

    if (invalidLines.length > 0) {
      return ctx.reply(`❌ Invalid private key format on line(s): ${invalidLines.join(', ')}.\nExpected: 64 hex characters (with optional 0x prefix).`);
    }

    const pkPath = path.join(process.cwd(), 'pk.txt');
    fs.writeFileSync(pkPath, content);

    ctx.reply(`✅ ${lines.length} private key(s) saved successfully.`);
  } catch (err) {
    ctx.reply('❌ Failed to save private keys.');
    console.error(err);
  }
});

// Global error handler
bot.catch((err, ctx) => {
  console.error(`[Bot Error] ${ctx.updateType}:`, err);
  ctx.reply('❌ An unexpected error occurred.').catch(() => {});
});

bot.launch();
console.log('🤖 Telegram bot started');

// Graceful shutdown — stop engine + bot
process.once('SIGINT', () => {
  const engine = getEngine();
  if (engine) {
    engine.stop();
    setEngine(null);
  }
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  const engine = getEngine();
  if (engine) {
    engine.stop();
    setEngine(null);
  }
  bot.stop('SIGTERM');
});