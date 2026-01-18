/**
 * MINIMAL AFK BOT - Final Version
 * ✅ Auto-accept resource pack
 * ✅ Movement only (stay at spawn)
 * ✅ Smart reconnect
 * ✅ Ultra lightweight
 */

const mineflayer = require('mineflayer');
const config = require('./config.json');

let bot = null;
let reconnectAttempts = 0;
let isRunning = true;
let spawnPos = null;
let actionTimer = null;

// ============ UTILITY ============
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.random() * (max - min) + min;
const log = (icon, msg) => console.log(`[${new Date().toISOString().slice(11,19)}] ${icon} ${msg}`);

// ============ CONNECTION ============
function connect() {
  log('→', `Connecting to ${config.server.ip}:${config.server.port}...`);
  
  bot = mineflayer.createBot({
    host: config.server.ip,
    port: config.server.port,
    username: config.bot.username,
    version: config.server.version,
    auth: 'offline',
    viewDistance: 'tiny',
    checkTimeoutInterval: 30000,
    hideErrors: false
  });

  setupEvents();
}

function setupEvents() {
  // ============ RESOURCE PACK (AUTO-ACCEPT) ============
  bot.on('resourcePack', (url, hash) => {
    log('📦', 'Resource pack requested');
    bot.acceptResourcePack();
    log('✓', 'Resource pack accepted');
  });

  // ============ CONNECTION EVENTS ============
  bot.once('spawn', onSpawn);
  
  bot.on('kicked', (reason) => {
    log('⚠', `Kicked: ${JSON.stringify(reason)}`);
    reconnect('Kicked from server');
  });
  
  bot.on('error', (err) => {
    const errCode = err.code || 'UNKNOWN';
    const errMsg = err.message || 'Unknown error';
    
    log('⚠', `Error: ${errCode}`);
    
    // Helpful messages for common errors
    if (errCode === 'ECONNREFUSED') {
      log('→', 'Server offline or wrong port');
    } else if (errCode === 'ECONNRESET') {
      log('→', 'Connection reset - server may be restarting');
    } else if (errCode === 'ETIMEDOUT') {
      log('→', 'Connection timeout');
    } else if (errCode === 'ENOTFOUND') {
      log('→', 'Server not found - check IP address');
    }
    
    reconnect(`Error: ${errCode}`);
  });
  
  bot.on('end', () => {
    log('→', 'Connection ended');
    reconnect('Connection ended');
  });
  
  // ============ GAME EVENTS ============
  bot.on('death', () => {
    log('⚠', 'Died - respawning in 2s...');
    setTimeout(() => {
      if (bot) bot.respawn();
    }, 2000);
  });
  
  // ============ COMMANDS (OPTIONAL) ============
  if (config.bot?.allowCommands) {
    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
      
      const cmd = message.toLowerCase().trim();
      if (cmd === '!status') {
        const uptime = Math.floor((Date.now() - (bot._startTime || Date.now())) / 1000);
        bot.chat(`Online ${uptime}s | HP: ${bot.health || 20}`);
      }
    });
  }
}

function onSpawn() {
  log('✓', 'Joined server!');
  
  // Save spawn position
  spawnPos = bot.entity.position.clone();
  log('→', `Spawn: X:${spawnPos.x.toFixed(0)} Y:${spawnPos.y.toFixed(0)} Z:${spawnPos.z.toFixed(0)}`);
  
  // Reset reconnect counter
  reconnectAttempts = 0;
  bot._startTime = Date.now();
  
  // Start movement
  startMovement();
}

function reconnect(reason) {
  log('⚠', reason);
  stopMovement();
  
  if (!isRunning) return;
  
  reconnectAttempts++;
  
  // Smart backoff delays
  let delay;
  if (reconnectAttempts === 1) {
    delay = 20000; // 20s - give server time
  } else if (reconnectAttempts === 2) {
    delay = 30000; // 30s
  } else {
    delay = Math.min(15000 * Math.pow(1.5, reconnectAttempts - 2), 60000);
  }
  
  // Add jitter to avoid thundering herd
  delay += rand(-3000, 3000);
  
  log('→', `Reconnecting in ${(delay/1000).toFixed(0)}s (attempt ${reconnectAttempts})`);
  
  // Cleanup old bot instance
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.quit();
    } catch (e) {
      // Ignore cleanup errors
    }
    bot = null;
  }
  
  setTimeout(connect, delay);
}

// ============ MOVEMENT (LIMITED AREA) ============
function startMovement() {
  log('✓', 'Starting movement (limited area)...');
  scheduleAction();
}

function stopMovement() {
  if (actionTimer) {
    clearTimeout(actionTimer);
    actionTimer = null;
  }
  if (bot) {
    try {
      bot.clearControlStates();
    } catch (e) {
      // Ignore if bot not ready
    }
  }
}

function scheduleAction() {
  if (!bot || !isRunning) return;

  // Weighted random actions
  const r = Math.random() * 100;
  
  if (r < 50) doSmallMovement();      // 50% - Small movement
  else if (r < 75) doLook();          // 25% - Look around
  else if (r < 85) doSneak();         // 10% - Sneak
  else if (r < 95) doJump();          // 10% - Jump
  else doSwing();                      // 5%  - Swing arm

  // Schedule next action (10-25 seconds)
  const delay = rand(10000, 25000);
  actionTimer = setTimeout(scheduleAction, delay);
}

function doSmallMovement() {
  if (!bot || !spawnPos) return;

  const currentPos = bot.entity.position;
  const distance = currentPos.distanceTo(spawnPos);
  
  // If too far from spawn, return
  if (distance > 5) {
    log('→', 'Too far - returning to spawn');
    returnToSpawn();
    return;
  }

  // Random small movement
  const movements = ['forward', 'back', 'left', 'right'];
  const direction = movements[rand(0, 3)];
  const duration = rand(500, 1500);
  
  bot.setControlState(direction, true);
  
  setTimeout(() => {
    if (bot) {
      bot.clearControlStates();
      log('→', `Moved ${direction} (${duration}ms)`);
    }
  }, duration);
}

function doLook() {
  if (!bot) return;
  
  const yaw = randFloat(-Math.PI, Math.PI);
  const pitch = randFloat(-0.3, 0.3);
  
  bot.look(yaw, pitch, false);
  log('→', 'Look around');
}

function doSneak() {
  if (!bot) return;
  
  bot.setControlState('sneak', true);
  
  const duration = rand(1000, 3000);
  setTimeout(() => {
    if (bot) {
      bot.setControlState('sneak', false);
      log('→', 'Sneak');
    }
  }, duration);
}

function doJump() {
  if (!bot) return;
  
  bot.setControlState('jump', true);
  
  setTimeout(() => {
    if (bot) {
      bot.setControlState('jump', false);
      log('→', 'Jump');
    }
  }, 300);
}

function doSwing() {
  if (!bot) return;
  bot.swingArm();
  log('→', 'Swing');
}

function returnToSpawn() {
  if (!bot || !spawnPos) return;
  
  const currentPos = bot.entity.position;
  const dx = spawnPos.x - currentPos.x;
  const dz = spawnPos.z - currentPos.z;
  
  // Determine direction to spawn
  let direction = '';
  if (Math.abs(dx) > Math.abs(dz)) {
    direction = dx > 0 ? 'forward' : 'back';
  } else {
    direction = dz > 0 ? 'left' : 'right';
  }
  
  // Look towards spawn
  const yaw = Math.atan2(-dx, -dz);
  bot.look(yaw, 0, true);
  
  // Walk towards spawn
  bot.setControlState(direction, true);
  
  setTimeout(() => {
    if (bot) {
      bot.clearControlStates();
      log('→', 'Returned to spawn area');
    }
  }, 2000);
}

// ============ LIFECYCLE ============
function shutdown() {
  log('✓', 'Shutting down...');
  isRunning = false;
  stopMovement();
  
  if (bot) {
    try {
      bot.quit();
    } catch (e) {
      // Ignore
    }
  }
  
  process.exit(0);
}

// ============ START ============
log('✓', '=== Minecraft AFK Bot ===');
log('→', `Server: ${config.server.ip}:${config.server.port}`);
log('→', `Username: ${config.bot.username}`);
log('→', `Version: ${config.server.version}`);
log('→', 'Features: Movement only, auto-accept resource pack');
log('→', '');

connect();

// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Optional: Memory cleanup
if (global.gc) {
  setInterval(() => {
    global.gc();
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    log('✓', `Memory: ${mem}MB`);
  }, 1800000);
}