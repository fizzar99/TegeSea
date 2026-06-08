/**
 * MintEngine — FCFS Minting Engine with Telegram support
 */
const fs = require('fs');
const path = require('path');
const { JsonRpcProvider } = require('ethers');
const DropQueue = require('./DropQueue');
const ParallelMinter = require('./ParallelMinter');

class MintEngine {
  constructor({
    rpcUrl,
    privateKeys,
    gasMultiplier = parseFloat(process.env.GAS_MULTIPLIER || '1.5'),
    priorityFeeGwei = parseInt(process.env.PRIORITY_FEE_GWEI || '2'),
    queueFile = process.env.QUEUE_FILE || './drops.json',
    logFile = process.env.LOG_FILE || './mint-log.jsonl',
    pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || '500'),
    preTriggerOffsetMs = parseInt(process.env.PRE_TRIGGER_OFFSET_MS || '500'),
    jitterMsMax = 500,
    onAlert = null,
    onComplete = null,
  }) {
    this.defaultRpcUrl = rpcUrl;
    this.privateKeys = privateKeys;
    this.gasMultiplier = gasMultiplier;
    this.priorityFeeGwei = priorityFeeGwei;

    this.provider = new JsonRpcProvider(rpcUrl);
    this.minter = new ParallelMinter({
      rpcUrl,
      privateKeys,
      gasMultiplier,
      priorityFeeGwei,
    });

    // Cache of ParallelMinter per rpcUrl for multi-chain
    this._minterCache = new Map();
    this._minterCache.set(rpcUrl, this.minter);

    this.queue = new DropQueue(queueFile);
    this.logFile = path.resolve(logFile);
    this.pollIntervalMs = pollIntervalMs;
    this.preTriggerOffsetMs = preTriggerOffsetMs;
    this.jitterMsMax = jitterMsMax;
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.onAlert = onAlert;
    this.onComplete = onComplete;
    this.alertSent = new Set(); // Track which drops have sent 10-min alert
  }

  /**
   * Get or create a ParallelMinter for the given rpcUrl.
   * Falls back to default minter if no rpcUrl specified.
   */
  _getMinter(rpcUrl) {
    if (!rpcUrl) return this.minter;
    if (this._minterCache.has(rpcUrl)) return this._minterCache.get(rpcUrl);

    const minter = new ParallelMinter({
      rpcUrl,
      privateKeys: this.privateKeys,
      gasMultiplier: this.gasMultiplier,
      priorityFeeGwei: this.priorityFeeGwei,
    });
    this._minterCache.set(rpcUrl, minter);
    return minter;
  }

  log(event, data = {}) {
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...data,
    });
    fs.appendFileSync(this.logFile, entry + '\n');
    console.log(`[LOG] ${event}`, data);
  }

  /**
   * Discover drop config from on-chain data.
   */
  async discoverDrop(contract, rpcUrl) {
    const minter = this._getMinter(rpcUrl);
    return minter.discover(contract);
  }

  addDrop({ contract, chain, rpcUrl, startTimeISO, notes = '' }) {
    const drop = this.queue.add({
      contract,
      chain,
      rpcUrl,
      mintTimeISO: startTimeISO,
      notes,
    });
    this.log('drop_queued', { id: drop.id, contract, chain, startTime: startTimeISO });
    return drop;
  }

  removeDrop(id) {
    const ok = this.queue.remove(id);
    this.log('drop_removed', { id, ok });
    return ok;
  }

  listDrops() {
    return this.queue.list();
  }

  start() {
    if (this.isMonitoring) {
      console.log('[ENGINE] Already monitoring');
      return;
    }
    this.isMonitoring = true;
    console.log('[ENGINE] Monitoring started');
    this.log('monitoring_started');

    this.monitorInterval = setInterval(() => this._tick(), this.pollIntervalMs);
  }

  stop() {
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log('[ENGINE] Monitoring stopped');
    this.log('monitoring_stopped');
  }

  async _tick() {
    const pending = this.queue.getPending();
    if (pending.length === 0) return;

    const now = Date.now();

    for (const drop of pending) {
      try {
        if (!drop.mintTime || drop.mintTime === 0) {
          const minter = this._getMinter(drop.rpcUrl);
          const config = await minter.discover(drop.contract);
          drop.mintTime = config.startTime * 1000;
          this.queue._save();
          this.log('drop_discovered', { id: drop.id, startTime: config.startTime });
        }

        const timeUntilDrop = drop.mintTime - now;

        // === 10 MINUTE ALERT ===
        const tenMinutes = 10 * 60 * 1000;
        if (
          timeUntilDrop > 0 &&
          timeUntilDrop <= tenMinutes &&
          !this.alertSent.has(drop.id) &&
          this.onAlert
        ) {
          this.alertSent.add(drop.id);
          this.onAlert(drop);
          this.log('drop_alert_sent', { id: drop.id, timeUntilDrop });
        }

        // Pre-trigger window
        if (timeUntilDrop > 0 && timeUntilDrop <= this.preTriggerOffsetMs) {
          console.log(`[ENGINE] Drop ${drop.id} approaching T-0 in ${timeUntilDrop}ms`);
          this.log('drop_approaching', { id: drop.id, timeUntilDrop });
          continue;
        }

        // Fire when time has come
        if (timeUntilDrop <= 0) {
          const results = await this._fireDrop(drop);
          
          // Send completion summary
          if (this.onComplete) {
            this.onComplete(results);
          }
        }
      } catch (err) {
        console.error(`[ENGINE] Error processing drop ${drop.id}:`, err.message);
        this.log('drop_error', { id: drop.id, error: err.message });
      }
    }

    this.queue.pruneExpired();
  }

  async _fireDrop(drop) {
    this.queue.updateStatus(drop.id, 'monitoring');
    console.log(`\n[ENGINE] 🔥 FIRING DROP ${drop.id}`);
    console.log(`  Contract: ${drop.contract}`);
    console.log(`  Chain: ${drop.chain || 'default'}`);
    console.log(`  T-0: ${new Date(drop.mintTime).toISOString()}`);
    this.log('drop_firing', { id: drop.id, contract: drop.contract, chain: drop.chain });

    try {
      const minter = this._getMinter(drop.rpcUrl);
      const config = await minter.discover(drop.contract);
      console.log(`  Mint price: ${Number(config.mintPrice) / 1e18} ETH | Max/wallet: ${config.maxPerWallet}`);

      const preflight = await minter.preflight(config, 1);
      if (!preflight.ok) {
        console.warn(`[ENGINE] Pre-flight warnings:`);
        preflight.issues.forEach(i => console.warn(`  ! ${i}`));
      }

      const results = await minter.fire(config, 1);

      this.queue.updateStatus(drop.id, 'fired', results.results);
      this.log('drop_complete', {
        id: drop.id,
        broadcastTime: results.broadcastTime,
        successful: results.successful,
        reverted: results.reverted,
        failed: results.failed,
      });

      console.log(`\n[ENGINE] Drop ${drop.id} complete. ${results.successful} success, ${results.reverted} reverted, ${results.failed} failed.`);
      
      return results;
    } catch (err) {
      console.error(`[ENGINE] Fire failed for drop ${drop.id}:`, err.message);
      this.queue.updateStatus(drop.id, 'failed');
      this.log('drop_failed', { id: drop.id, error: err.message });
      return { successful: 0, reverted: 0, failed: 1 };
    }
  }

  async fireNow(contract, rpcUrl) {
    const minter = this._getMinter(rpcUrl);
    const config = await minter.discover(contract);
    console.log(`[ENGINE] Manual fire for ${contract}`);
    return minter.fire(config, 1);
  }
}

module.exports = { MintEngine };