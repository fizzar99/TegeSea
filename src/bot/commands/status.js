const { getEngine } = require('../engineManager');
const DropQueue = require('../../mint/DropQueue');
const path = require('path');

module.exports = (bot) => {
  bot.command('status', async (ctx) => {
    const engine = getEngine();

    let message = '📊 Bot Status\n\n';

    // Engine status
    if (engine) {
      message += '🟢 Monitoring engine: RUNNING\n';
      message += `   Poll interval: ${engine.pollIntervalMs}ms\n`;
      message += `   Alerts sent: ${engine.alertSent.size}\n\n`;
    } else {
      message += '🔴 Monitoring engine: STOPPED\n';
      message += '   Use /auto to start\n\n';
    }

    // Queue status
    try {
      const queueFile = path.resolve(process.cwd(), 'drops.json');
      const queue = new DropQueue(queueFile);
      const drops = queue.list();

      const queued = drops.filter(d => d.status === 'queued').length;
      const fired = drops.filter(d => d.status === 'fired').length;
      const failed = drops.filter(d => d.status === 'failed').length;
      const expired = drops.filter(d => d.status === 'expired').length;

      message += `📋 Queue: ${drops.length} total\n`;
      message += `   ⏳ Queued: ${queued}\n`;
      message += `   ✅ Fired: ${fired}\n`;
      message += `   ❌ Failed: ${failed}\n`;
      message += `   ⌛ Expired: ${expired}\n`;

      // Next upcoming drop
      const pending = drops
        .filter(d => d.status === 'queued')
        .sort((a, b) => new Date(a.mintTime) - new Date(b.mintTime));

      if (pending.length > 0) {
        const next = pending[0];
        const timeUntil = new Date(next.mintTime).getTime() - Date.now();
        const minutesUntil = Math.floor(timeUntil / 60000);

        message += `\n⏰ Next drop: ${next.chain} | ${next.contract.slice(0, 10)}...\n`;
        if (minutesUntil > 0) {
          message += `   Starts in: ${minutesUntil} minutes`;
        } else {
          message += `   ⚡ Should fire any moment!`;
        }
      }
    } catch (err) {
      message += '❌ Could not read queue file.';
    }

    ctx.reply(message);
  });
};
