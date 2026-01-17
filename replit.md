# Minecraft AFK Bot

## Overview
Enterprise-grade Minecraft AFK bot with anti-detection and auto-reconnect capabilities. Designed to keep Minecraft servers (especially Aternos) online by maintaining an active player presence.

## Project Structure
```
minecraft-afk-bot/
├── bot.js              # Main bot engine
├── config.json         # Configuration file (server, bot settings)
├── package.json        # Node.js dependencies
└── README.md           # Full documentation
```

## How to Run
The bot runs automatically via the "Minecraft AFK Bot" workflow which executes `node bot.js`.

## Configuration
Edit `config.json` to configure:
- `server.ip` - Minecraft server address
- `server.port` - Server port (default: 25565)
- `server.version` - Minecraft version (e.g., "1.21.4")
- `bot.username` - Bot's username
- `bot.allowCommands` - Enable/disable in-game commands

## Features
- Non-deterministic movement to avoid detection
- Auto-reconnect with exponential backoff
- Stays within spawn area (configurable radius)
- In-game `!status` command support

## Tech Stack
- Node.js 20+
- Mineflayer (Minecraft bot framework)
- mineflayer-pathfinder, mineflayer-auto-eat, mineflayer-armor-manager
