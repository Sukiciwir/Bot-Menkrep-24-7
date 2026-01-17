# 🚀 Deployment Guide - Minecraft AFK Bot

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Minecraft server (Aternos/VPS/Local)

---

## 🔧 Local Setup (Windows/Linux/Mac)

### 1. Install Dependencies

```bash
# Clone or create project folder
mkdir minecraft-afk-bot
cd minecraft-afk-bot

# Copy files: bot.js, config.json, package.json

# Install dependencies
npm install
```

### 2. Configure Bot

Edit `config.json`:

```json
{
  "server": {
    "ip": "YourServer.aternos.me",  // ← Change this
    "port": 25565,
    "version": "1.20.1"  // ← Match your server version
  },
  "bot": {
    "username": "YourBotName"  // ← Change this
  }
}
```

### 3. Run Bot

```bash
npm start

# Or with auto-restart on code changes
npm run dev
```

### 4. Keep Running 24/7 (Optional)

**Using PM2 (Recommended):**

```bash
npm install -g pm2
pm2 start bot.js --name minecraft-bot
pm2 save
pm2 startup
```

**Using Screen (Linux):**

```bash
screen -S minecraft-bot
npm start
# Press Ctrl+A then D to detach
# Reattach: screen -r minecraft-bot
```

---

## ☁️ Replit Deployment

### 1. Create New Repl

- Go to [replit.com](https://replit.com)
- Click **+ Create Repl**
- Select **Node.js**
- Name it (e.g., "minecraft-afk-bot")

### 2. Upload Files

Upload these files to your Repl:
- `bot.js`
- `config.json`
- `package.json`

### 3. Configure

Edit `config.json` with your server details.

### 4. Add Keep-Alive (Important!)

Create `keep-alive.js`:

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(3000, () => {
  console.log('Keep-alive server on port 3000');
});
```

Update `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    // ... other dependencies
  },
  "scripts": {
    "start": "node keep-alive.js & node bot.js"
  }
}
```

### 5. Use UptimeRobot

- Go to [uptimerobot.com](https://uptimerobot.com)
- Create free account
- Add Monitor: `https://your-repl-name.yourusername.repl.co`
- Set interval to 5 minutes

### 6. Run

Click **Run** button in Replit.

**⚠️ Replit Limitation:** Free tier may sleep after inactivity. Always active requires Replit Hacker plan or external keep-alive service.

---

## 🚂 Railway Deployment

### 1. Create Railway Account

- Go to [railway.app](https://railway.app)
- Sign in with GitHub

### 2. Deploy

**Method A: GitHub**

```bash
# Push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

Then in Railway:
- Click **New Project**
- Select **Deploy from GitHub repo**
- Choose your repository

**Method B: CLI**

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### 3. Environment Variables (Optional)

In Railway dashboard:
- Go to **Variables**
- Add:
  - `SERVER_IP`: your.server.me
  - `SERVER_PORT`: 25565
  - `BOT_USERNAME`: YourBotName

Update `bot.js` to read from env:

```javascript
const config = {
  server: {
    ip: process.env.SERVER_IP || require('./config.json').server.ip,
    port: process.env.SERVER_PORT || require('./config.json').server.port,
    // ...
  }
};
```

### 4. Monitor

Railway provides 24/7 uptime on free tier (500 hours/month).

---

## 🖥️ VPS Deployment (Ubuntu/Debian)

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Upload Files

```bash
# Using SCP
scp -r minecraft-afk-bot user@your-vps-ip:/home/user/

# Or clone from GitHub
git clone YOUR_REPO_URL
cd YOUR_REPO
```

### 3. Install Dependencies

```bash
npm install --production
```

### 4. Run with PM2

```bash
sudo npm install -g pm2
pm2 start bot.js --name minecraft-bot
pm2 save
pm2 startup systemd
```

### 5. Verify

```bash
pm2 status
pm2 logs minecraft-bot
```

---

## 🎯 Aternos-Specific Tips

### Why Aternos Kicks Bots

Aternos has anti-AFK detection that kicks players who:
- Stand still for 15+ minutes
- Have predictable movement patterns
- Spam commands
- Use VPN/proxy IPs

### How This Bot Avoids Detection

✅ **Randomized Intervals**
- Movement: 8-27 seconds (non-deterministic)
- Look: 12-35 seconds
- Sneak: 45-120 seconds

✅ **Multiple Action Types**
- Walk, jump, look, sneak, swing, chat
- Combined actions (move + look simultaneously)

✅ **Natural Behavior**
- Doesn't spam
- Responds to environment (void, hunger)
- Auto-respawns on death

✅ **Smart Reconnect**
- Exponential backoff (5s → 60s max)
- Jitter added to avoid pattern detection

### Best Practices

1. **Username**: Use realistic names, not "AFKBot123"
2. **Chat**: Enable but don't spam (60-180s interval)
3. **Version Match**: Always match server version exactly
4. **Start Time**: Wait 30s after Aternos server starts before connecting
5. **Multiple Bots**: If running 2+ bots, stagger their join by 2-3 minutes

### If Still Getting Kicked

**Option 1: Reduce Action Frequency**

```json
{
  "behavior": {
    "movementInterval": [15000, 40000],  // Slower
    "lookInterval": [20000, 50000]
  }
}
```

**Option 2: Disable Chat**

```json
{
  "bot": {
    "enableChat": false
  }
}
```

**Option 3: Use Residential IP**

Aternos may block datacenter IPs. Deploy from:
- Home computer
- Residential VPS
- Avoid AWS/Google Cloud

---

## 🐛 Troubleshooting

### "ENOTFOUND" Error

**Cause:** Server IP not found

**Fix:**
1. Verify Aternos server is **online** (not queued)
2. Check IP in config matches Aternos exactly
3. Wait 30-60s after server starts

### Bot Connects But Gets Kicked Immediately

**Cause:** Version mismatch

**Fix:**

```json
{
  "server": {
    "version": "1.20.1"  // ← Must match server exactly
  }
}
```

Check server version in Aternos → Software → Version

### Bot Stops After Few Hours

**Possible Causes:**

1. **Hosting service killed process**
   - Replit: Use keep-alive + UptimeRobot
   - Railway: Check logs for errors

2. **Network timeout**
   - Bot has auto-reconnect, check logs

3. **Memory leak** (rare)
   - Restart bot daily using cron:
     ```bash
     crontab -e
     # Add: 0 4 * * * pm2 restart minecraft-bot
     ```

### High CPU Usage

**Normal:** 1-5% CPU when idle

**If 20%+:**
- Reduce action frequency in config
- Check for pathfinder errors in logs
- Disable auto-eat if not needed

---

## 📊 Monitoring

### View Logs

```bash
# PM2
pm2 logs minecraft-bot

# Railway
railway logs

# Replit
Check Console tab
```

### Check Uptime

In-game: Type `!status` (if bot has command enabled)

Response: `Online for 3245s | HP: 20.0 | Food: 20`

### External Monitoring

**UptimeRobot** (for web-exposed bots):
- Monitor every 5 minutes
- Email alerts on downtime

**Discord Webhook** (optional enhancement):

```javascript
// Add to onSpawn() in bot.js
const webhook = 'YOUR_DISCORD_WEBHOOK_URL';
fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: `✅ Bot connected to ${config.server.ip}`
  })
});
```

---

## 🔒 Security & Ethics

### ⚠️ Important Notes

1. **Terms of Service**: Using bots may violate some server rules. Only use on servers where you have permission.

2. **Not for Griefing**: This bot is designed ONLY to keep servers online, not for:
   - PvP automation
   - Resource farming
   - Exploiting game mechanics
   - Disrupting other players

3. **Privacy**: Don't log chat messages from other players without consent.

4. **Fair Use**: One bot per player is reasonable. Don't run 50 bots on one server.

### Recommended Use Cases

✅ Keeping your personal Aternos server alive  
✅ Testing server plugins  
✅ Learning Node.js + Minecraft protocol  
✅ Maintaining server uptime for small communities

---

## 🆘 Getting Help

### Error Logs

Always include:
1. Full error message from console
2. `config.json` (remove sensitive data)
3. Server version
4. Hosting platform

### Common Issues

**Bot joins but doesn't move:**
- Check `bot.entity` is defined in logs
- Verify pathfinder loaded correctly

**Chat commands not working:**
- Ensure `allowCommands: true` in config
- Check bot has chat permissions on server

**Random disconnects:**
- Normal for Aternos (server restarts)
- Auto-reconnect will handle it
- Check if IP banned (use VPN)

---

## 📈 Next Steps

### Enhancements

1. **Database Logging**: Store uptime in SQLite
2. **Web Dashboard**: Create Express server with stats
3. **Multi-Bot Manager**: Control multiple bots from one interface
4. **Advanced Pathfinding**: Make bot walk specific routes
5. **Discord Integration**: Send status updates to Discord channel

### Advanced Config

```json
{
  "advanced": {
    "useProxy": false,
    "proxyHost": "proxy.example.com",
    "proxyPort": 1080,
    "discordWebhook": "https://discord.com/api/webhooks/...",
    "logToFile": true,
    "logPath": "./logs/bot.log"
  }
}
```

---

## 📝 License & Credits

**License:** MIT (use freely, modify as needed)

**Credits:**
- [Mineflayer](https://github.com/PrismarineJS/mineflayer) - Minecraft bot framework
- [Prismarine](https://github.com/PrismarineJS) - Minecraft protocol implementation

**Support:**
- Star the repo if this helped you
- Report bugs via Issues
- Contribute improvements via Pull Requests

---

**Made with ❤️ for the Minecraft community**

*Last updated: 2025*