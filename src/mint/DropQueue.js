/**
 * queue.js — Drop queue manager: add, list, remove, persist.
 */
const fs = require('fs');
const path = require('path');

class DropQueue {
  constructor(filePath) {
    this.file = path.resolve(filePath);
    this.drops = this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(this.file)) return [];
      const raw = fs.readFileSync(this.file, 'utf8');
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('[QUEUE] Failed to load drops file:', err.message);
      return [];
    }
  }

  _save() {
    fs.writeFileSync(this.file, JSON.stringify(this.drops, null, 2));
  }

  add({ contract, chain, rpcUrl, tokenId, mintTimeISO, maxPerWallet, notes }) {
    const id = `${contract.toLowerCase()}_${Date.now()}`;
    const drop = {
      id,
      contract: contract.toLowerCase(),
      chain: chain || null,
      rpcUrl: rpcUrl || null,
      tokenId: tokenId || null,
      mintTime: new Date(mintTimeISO).getTime(),
      maxPerWallet: maxPerWallet || 1,
      notes: notes || '',
      status: 'queued',      // queued | monitoring | fired | failed | expired
      createdAt: Date.now(),
      firedAt: null,
      results: [],
    };
    this.drops.push(drop);
    this._save();
    return drop;
  }

  remove(id) {
    const before = this.drops.length;
    this.drops = this.drops.filter(d => d.id !== id);
    this._save();
    return before !== this.drops.length;
  }

  getPending() {
    return this.drops.filter(d => d.status === 'queued');
  }

  getById(id) {
    return this.drops.find(d => d.id === id);
  }

  updateStatus(id, status, results = null) {
    const drop = this.getById(id);
    if (!drop) return false;
    drop.status = status;
    if (status === 'fired') drop.firedAt = Date.now();
    if (results) drop.results = results;
    this._save();
    return true;
  }

  list() {
    return this.drops.map(d => ({
      id: d.id,
      contract: d.contract,
      chain: d.chain || 'unknown',
      mintTime: new Date(d.mintTime).toISOString(),
      status: d.status,
      notes: d.notes,
    }));
  }

  pruneExpired(beforeMs = Date.now()) {
    let changed = false;
    for (const drop of this.drops) {
      if (drop.status === 'queued' && drop.mintTime > 0 && drop.mintTime < beforeMs) {
        drop.status = 'expired';
        changed = true;
      }
    }
    if (changed) this._save();
  }
}

module.exports = DropQueue;
