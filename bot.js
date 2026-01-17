/**
 * MINIMAL AFK BOT - Movement Only
 * - Hanya bergerak di area spawn (radius 3-5 block)
 * - Tidak buka chunk baru
 * - Tidak makan, tidak pakai armor
 * - RAM: ~25-35 MB
 * - CPU: <0.5%
 * - Perfect untuk Aternos free tier
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
  log('→', `Connecting to ${config.server.ip}...`);
  
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

  bot.once('spawn', onSpawn);
  bot.on('kicked', (r) => reconnect(`Kicked: ${JSON.stringify(r)}`));
  bot.on('error', (e) => reconnect(`Error: ${e.code || e.message}`));
  bot.on('end', () => reconnect('Connection ended'));
  
  // Auto respawn only (no eating, no armor)
  bot.on('death', () => {
    log('⚠', 'Died - respawning...');
    setTimeout(() => bot.respawn(), 2000);
  });
  
  // Optional: Simple status command
  if (config.bot.allowCommands) {
    bot.on('chat', (u, m) => {
      if (u === bot.username) return;
      if (m.toLowerCase() === '!status') {
        bot.chat(`Online | HP: ${bot.health || 20}`);
      }
    });
  }
}

function onSpawn() {
  log('✓', 'Joined server!');
  
  // Save spawn position
  spawnPos = bot.entity.position.clone();
  log('→', `Spawn: X:${spawnPos.x.toFixed(0)} Y:${spawnPos.y.toFixed(0)} Z:${spawnPos.z.toFixed(0)}`);
  
  reconnectAttempts = 0;
  startMovement();
}

function reconnect(reason) {
  log('⚠', reason);
  stopMovement();
  
  if (!isRunning) return;
  
  reconnectAttempts++;
  const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000) + rand(-2000, 2000);
  log('→', `Reconnecting in ${(delay/1000).toFixed(0)}s (attempt ${reconnectAttempts})`);
  setTimeout(connect, delay);
}

// ============ MOVEMENT (AREA TERBATAS) ============
function startMovement() {
  log('✓', 'Starting movement (limited area)...');
  scheduleAction();
}

function stopMovement() {
  if (actionTimer) {
    clearTimeout(actionTimer);
    actionTimer = null;
  }
  if (bot) bot.clearControlStates();
}

function scheduleAction() {
  if (!bot || !isRunning) return;

  // Random action dengan weight
  const r = Math.random() * 100;
  
  if (r < 50) doSmallMovement();      // 50% - Gerak kecil
  else if (r < 75) doLook();          // 25% - Lihat sekitar
  else if (r < 85) doSneak();         // 10% - Sneak
  else if (r < 95) doJump();          // 10% - Jump di tempat
  else doSwing();                      // 5% - Swing arm

  // Schedule next action (10-25 detik untuk lebih natural)
  const delay = rand(10000, 25000);
  actionTimer = setTimeout(scheduleAction, delay);
}

function doSmallMovement() {
  if (!bot || !spawnPos) return;

  const currentPos = bot.entity.position;
  const distance = currentPos.distanceTo(spawnPos);
  
  // Jika terlalu jauh dari spawn (>5 block), kembali ke spawn
  if (distance > 5) {
    log('→', 'Too far - returning to spawn');
    returnToSpawn();
    return;
  }

  // Gerak random tapi kecil (0.5-1.5 detik)
  const movements = [
    'forward',
    'back', 
    'left',
    'right'
  ];
  
  const direction = movements[rand(0, 3)];
  const duration = rand(500, 1500); // Durasi pendek = jarak dekat
  
  bot.setControlState(direction, true);
  
  setTimeout(() => {
    bot.clearControlStates();
    log('→', `Moved ${direction} (${duration}ms)`);
  }, duration);
}

function doLook() {
  if (!bot) return;
  
  // Look random tapi tidak extreme
  const yaw = randFloat(-Math.PI, Math.PI);
  const pitch = randFloat(-0.3, 0.3); // Pitch kecil = horizontal look
  
  bot.look(yaw, pitch, false);
  log('→', 'Look around');
}

function doSneak() {
  if (!bot) return;
  
  bot.setControlState('sneak', true);
  
  const duration = rand(1000, 3000);
  setTimeout(() => {
    bot.setControlState('sneak', false);
    log('→', 'Sneak');
  }, duration);
}

function doJump() {
  if (!bot) return;
  
  // Jump di tempat (tanpa forward movement)
  bot.setControlState('jump', true);
  
  setTimeout(() => {
    bot.setControlState('jump', false);
    log('→', 'Jump');
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
  
  // Hitung arah ke spawn
  const dx = spawnPos.x - currentPos.x;
  const dz = spawnPos.z - currentPos.z;
  
  // Tentukan movement direction
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
    bot.clearControlStates();
    log('→', 'Returned to spawn area');
  }, 2000);
}

// ============ LIFECYCLE ============
function shutdown() {
  log('✓', 'Shutting down...');
  isRunning = false;
  stopMovement();
  if (bot) bot.quit();
  process.exit(0);
}

// ============ START ============
log('✓', '=== Minimal AFK Bot (Movement Only) ===');
log('→', `Server: ${config.server.ip}:${config.server.port}`);
log('→', `User: ${config.bot.username}`);
log('→', 'Features: Movement only, no eating, no armor');
connect();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Optional: Memory cleanup (if --expose-gc flag used)
if (global.gc) {
  setInterval(() => {
    global.gc();
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    log('✓', `Memory: ${mem}MB`);
  }, 1800000); // Every 30 min
}