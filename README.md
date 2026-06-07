# TegeSea

Telegram bot for SeaDrop NFT minting engine. Supports multiple EVM chains with automatic discovery and parallel minting.

## Features

- **Multi-chain support** — Ethereum, Base, Arbitrum, Optimism, Polygon, BSC
- **Auto queue** — `/queue <chain> <contract>` with automatic on-chain discovery
- **10-minute alerts** — Get notified before a drop starts
- **Parallel minting** — All wallets fire simultaneously at T-0
- **Private key management** — Upload `pk.txt` directly via Telegram (`/pk`)
- **Whitelist protection** — Only allowed users can use the bot

## Dependencies

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Core Dependencies

| Package     | Purpose                        |
|-------------|--------------------------------|
| `telegraf`  | Telegram Bot Framework         |
| `ethers`    | EVM blockchain interaction     |
| `axios`     | HTTP requests                  |
| `dotenv`    | Environment variable management|

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/fizzar99/TegeSea.git
cd TegeSea
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# RPC Endpoints (at least one required per chain you use)
ETH_RPC=
BASE_RPC=https://mainnet.base.org
ARBITRUM_RPC=
OPTIMISM_RPC=
POLYGON_RPC=
BSC_RPC=

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
ALLOWED_USERS=123456789,987654321   # Comma separated Telegram user IDs

# Gas Settings
GAS_MULTIPLIER=1.5
PRIORITY_FEE_GWEI=2
```

### 4. Add Private Keys

Use the `/pk` command in Telegram after starting the bot to upload your `pk.txt` file (one private key per line).

## Usage

### Start the bot

```bash
npm start
# or
npm run bot
```

## Available Commands

| Command                              | Description |
|--------------------------------------|-----------|
| `/queue <chain> <contract>`          | Queue a drop (auto discovers start time) |
| `/list`                              | Show all queued drops |
| `/remove <id>`                       | Remove a drop from queue |
| `/fire <chain> <contract>`           | Immediate mint (bypasses queue) |
| `/discover <chain> <contract>`       | Check drop information on-chain |
| `/auto`                              | Start monitoring engine + 10-min alerts |
| `/pk`                                | Upload private keys file |
| `/start`                             | Show help message |

### Examples

```text
/queue base 0x35a06ee03e7785dae88d4a5cf5ad0b32505eb2df
/fire polygon 0x1234567890abcdef1234567890abcdef12345678
/discover arbitrum 0xabcdef1234567890abcdef1234567890abcdef12
```

## How It Works

1. User queues a drop using `/queue`
2. Bot automatically discovers start time from the SeaDrop contract
3. When `/auto` is activated, the engine monitors all queued drops
4. 10 minutes before a drop starts → user receives an alert
5. At T-0, all wallets fire simultaneously
6. After minting completes → user receives a summary report

## Security

- Only users listed in `ALLOWED_USERS` can interact with the bot
- Private keys are stored locally in `pk.txt`
- No private keys are ever sent back to the user

## License

MIT License — see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Fizzar
