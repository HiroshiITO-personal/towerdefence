const CONFIG = {
    tileSize: 40,
    cols: 20,
    rows: 9,
    startMoney: 150,
    startLives: 5,
    baseEnemyHp: 44,
    moneyPerKill: 6,
    bossWaveInterval: 5,
    upgradeCostShield: 0.9,
    maxTowerLevel: 5
};

const TOWERS = {
    spray: {id: 'spray', name: 'Sparkle', icon: '🦄', cost: 60, range: 3.5, damage: 20, cooldown: 15, color: '#ff7ac6', desc: 'Bright magical beams.'},
    trap: {id: 'trap', name: 'Star Trap', icon: '✨', cost: 90, range: 2.2, damage: 10, slow: 0.4, cooldown: 8, color: '#fbbf24', desc: 'Slows rainbow invaders.'},
    zapper: {id: 'zapper', name: 'Rainbow Bolt', icon: '🌈', cost: 220, range: 4.5, damage: 100, cooldown: 65, color: '#8b5cf6', desc: 'Heavy boss damage.'},
    poison: {id: 'poison', name: 'Moon Mist', icon: '💫', cost: 350, range: 3.0, damage: 5, cooldown: 5, area: true, color: '#34d399', desc: 'Area magic damage.'}
};

const ENEMIES = [
    {name: 'Spark Bug', icon: '🐞', speed: 0.06, hpMod: 1.0, reward: 5},
    {name: 'Rain Moth', icon: '🦋', speed: 0.09, hpMod: 1.2, reward: 12},
    {name: 'Cloud Bat', icon: '🦇', speed: 0.04, hpMod: 3.5, reward: 20},
    {name: 'Dew Fly', icon: '🪶', speed: 0.11, hpMod: 0.5, reward: 10}
];

const state = {
    money: CONFIG.startMoney,
    lives: CONFIG.startLives,
    wave: 1,
    isPlaying: false,
    isWaveActive: false,
    selectedTower: null,
    mode: null,
    map: [],
    navMap: [],
    startPoint: {c: 0, r: 0},
    endPoints: [],
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    waveQueue: [],
    waveTimer: 0,
    bossComing: false,
    shakeTimer: 0
};

function triggerShake(frames = 30) {
    state.shakeTimer = frames;
}


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLives = document.getElementById('lives');
const uiMoney = document.getElementById('money-display');
const uiWave = document.getElementById('wave-display');
const waveBtn = document.getElementById('wave-btn');
const towerControls = document.getElementById('tower-controls');
const upgradeBtn = document.getElementById('upgrade-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalBtn = document.getElementById('modal-btn');
const bossWarning = document.getElementById('boss-warning');
const towerButtons = [];

const audio = {ctx: null,master: null,fxBus: null,noiseBuffer: null,distCurve: null,bgmTimer: null,bgmStep: 0,unlocked: false};

function ensureAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audio.ctx) {
        audio.ctx = new AudioCtx();
        audio.master = audio.ctx.createGain();
        audio.master.gain.value = 0.22;

        const delay = audio.ctx.createDelay();
        const feedback = audio.ctx.createGain();
        const filter = audio.ctx.createBiquadFilter();

        delay.delayTime.value = 0.28;
        feedback.gain.value = 0.45;
        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        audio.fxBus = audio.ctx.createGain();
        audio.fxBus.connect(audio.master);
        audio.fxBus.connect(delay);
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        filter.connect(audio.master);

        audio.master.connect(audio.ctx.destination);

        const bufferSize = audio.ctx.sampleRate * 2;
        audio.noiseBuffer = audio.ctx.createBuffer(1, bufferSize, audio.ctx.sampleRate);
        const data = audio.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const k = 25, n = 44100, curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
        }
        audio.distCurve = curve;
    }
    if (audio.ctx.state !== 'running') {
        audio.ctx.resume().catch(() => {
            audio.unlocked = false;
        });
    }
    return audio.ctx;
}

function unlockAudio() {
    const ctx = ensureAudio();
    if (!ctx || audio.unlocked) return;
    audio.unlocked = true;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(audio.master || ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.09);
}

function playHarp(freq, duration = 1.2, volume = 0.08, delay = 0) {
    if (!audio.ctx || !audio.master) return;
    const t = audio.ctx.currentTime + delay;
    
    const osc1 = audio.ctx.createOscillator();
    const gain1 = audio.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = audio.ctx.createOscillator();
    const gain2 = audio.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(volume, t + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(volume * 0.4, t + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + (duration * 0.3));

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(audio.fxBus || audio.master);
    gain2.connect(audio.fxBus || audio.master);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
}

let activeSoundCount = 0;

function playTone(freq = 440, duration = 0.12, volume = 0.08, type = 'sine', delay = 0, targetFreq = null, sendFx = true) {
    if (!audio.ctx || !audio.master) return;
    if (activeSoundCount > 16) return;
    const t = audio.ctx.currentTime + delay;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();   
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    
    if (targetFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq), t + duration);
    }
    
    const attack = 0.015;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    
    osc.connect(gain);
    gain.connect(sendFx && audio.fxBus ? audio.fxBus : audio.master);
    activeSoundCount++;
    osc.start(t);
    osc.stop(t + duration + 0.05);
    osc.onended = () => { activeSoundCount = Math.max(0, activeSoundCount - 1); };
}

function playNoise(duration = 0.1, volume = 0.05, cutoff = 1000, delay = 0) {
    if (!audio.ctx || !audio.noiseBuffer) return;
    const t = audio.ctx.currentTime + delay;
    const noise = audio.ctx.createBufferSource();
    noise.buffer = audio.noiseBuffer;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);

    const gain = audio.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audio.fxBus || audio.master);
    noise.start(t);
    noise.stop(t + duration);
}

function playSfx(kind) {
    if (!audio.ctx) return;
    
    if (kind === 'build') {
        playNoise(0.15, 0.12, 400);
        playTone(180, 0.12, 0.08, 'sawtooth', 0, 90);
        playTone(880, 0.08, 0.03, 'triangle', 0.02);
    } else if (kind === 'upgrade') {
        playTone(523.25, 0.3, 0.06, 'sine');
        playTone(739.99, 0.35, 0.05, 'sine', 0.03);
        playTone(1046.50, 0.4, 0.04, 'triangle', 0.06);
        playTone(2093.00, 0.2, 0.02, 'sine', 0.1);
    } else if (kind === 'wave') {
        playTone(146.83, 0.45, 0.1, 'sawtooth', 0, 130.81);
        playTone(220.00, 0.45, 0.06, 'sawtooth', 0.02, 196.00);
        playNoise(0.3, 0.05, 800, 0.05);
    } else if (kind === 'spray') {
        playNoise(0.12, 0.08, 2500);
        playTone(880, 0.08, 0.04, 'sine', 0, 1760);
    } else if (kind === 'trap') {
        playTone(440, 0.22, 0.07, 'sawtooth', 0, 80);
        playTone(311.13, 0.25, 0.05, 'square', 0.02, 60);
    } else if (kind === 'zapper') {
        const now = audio.ctx.currentTime;
        const osc = audio.ctx.createOscillator();
        const shaper = audio.ctx.createWaveShaper();
        const gain = audio.ctx.createGain();

        shaper.curve = audio.distCurve;
        osc.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(shaper);
        shaper.connect(gain);
        gain.connect(audio.fxBus || audio.master);

        osc.start(now);
        osc.stop(now + 0.36);

        playNoise(0.25, 0.1, 300, 0.05);
    } else if (kind === 'poison') {
        playNoise(0.3, 0.06, 1800);
        playTone(659.25, 0.25, 0.03, 'sine', 0, 622.25);
        playTone(932.33, 0.25, 0.02, 'sine', 0.04);
    } else if (kind === 'lose') {
        playTone(110, 0.7, 0.12, 'sawtooth', 0, 45);
        playTone(155.56, 0.6, 0.08, 'square', 0.05, 50);
        playNoise(0.5, 0.08, 200, 0.1);
    } else {
        playTone(440, 0.08, 0.05, 'triangle');
    }
}

function startBGM() {
    const ctx = ensureAudio();
    if (!ctx || audio.bgmTimer) return;
    unlockAudio();

    const harpNotes = [
        [146.83, 220.00, 293.66, 349.23], // D3, A3, D4, F4
        [146.83, 220.00, 293.66, 370.00], // D3, A3, D4, F#4
        [138.59, 207.65, 277.18, 329.63], // C#3, G#3, C#4, E4
        [130.81, 196.00, 261.63, 311.13]  // C3, G3, C4, Eb4
    ];

    let step = 0;
    audio.bgmTimer = setInterval(() => {
        if (!state.isPlaying) return;

        const measure = Math.floor(step / 4) % harpNotes.length;
        const harpPattern = harpNotes[measure];
        
        const harpFreq = harpPattern[step % 4];
        playHarp(harpFreq, 1.4, 0.08, 0);

        if (step % 2 === 0) {
            playHarp(harpFreq * 2, 0.8, 0.035, 0.15);
        }

        step++;
    }, 450); 
}

function stopBGM() {
    if (audio.bgmTimer) {
        clearInterval(audio.bgmTimer);
        audio.bgmTimer = null;
    }
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const maxWidth = window.innerWidth - 20;
    const maxHeight = window.innerHeight - 200;
    const aspectRatio = CONFIG.cols / CONFIG.rows;
    
    let displayWidth = maxWidth;
    let displayHeight = maxWidth / aspectRatio;
    
    if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * aspectRatio;
    }
    
    state.canvasDisplayWidth = displayWidth;
    state.canvasDisplayHeight = displayHeight;
    state.scale = displayWidth / (CONFIG.cols * CONFIG.tileSize);
    
    canvas.width = CONFIG.cols * CONFIG.tileSize;
    canvas.height = CONFIG.rows * CONFIG.tileSize;
    container.style.width = displayWidth + 'px';
    container.style.height = displayHeight + 'px';
}

function init() {
    state.canvas = canvas;
    state.ctx = ctx;
    canvas.width = CONFIG.cols * CONFIG.tileSize;
    canvas.height = CONFIG.rows * CONFIG.tileSize;
    generateMap();
    setupUI();
    resetGame();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    state.money = CONFIG.startMoney;
    state.lives = CONFIG.startLives;
    state.wave = 1;
    state.isWaveActive = false;
    state.selectedTower = null;
    state.mode = null;
    state.towers = [];
    state.enemies = [];
    state.projectiles = [];
    state.particles = [];
    state.waveQueue = [];
    state.isPlaying = true;
    state.bossComing = false;
    updateUI();
    modalOverlay.style.display = 'none';
    waveBtn.disabled = false;
    waveBtn.textContent = 'Start Wave 1';
    bossWarning.style.opacity = 0;
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        state.particles.push({x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 1.0, color});
    }
}

function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.08;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

let lastTime = 0;
const FPS = 60;
const frameInterval = 1000 / FPS;

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    if (!currentTime) currentTime = performance.now();    
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (state.isPlaying) {
            if (state.isWaveActive) {
                state.waveTimer--;
                if (state.waveTimer <= 0 && state.waveQueue.length > 0) {
                    const enemyData = state.waveQueue.shift();
                    state.enemies.push(new Enemy(enemyData.idx, state.wave, enemyData.isBoss));
                    state.waveTimer = enemyData.isBoss ? 200 : Math.max(40, 55 - state.wave * 4);
                } else if (state.waveQueue.length === 0 && state.enemies.length === 0) {
                    endWave();
                }
            }
            state.towers.forEach(t => t.update());
            for (let i = state.enemies.length - 1; i >= 0; i--) {
                const enemy = state.enemies[i];
                const status = enemy.update();
                if (status === 'finished') {
                    state.lives -= enemy.isBoss ? 5 : 1;
                    state.enemies.splice(i, 1);
                    updateUI();
                    createParticles(enemy.x, enemy.y, '#fc8181', 15);
                    if (state.lives <= 0) gameOver();
                } else if (enemy.hp <= 0) {
                    state.money += enemy.reward;
                    if (enemy.isBoss) state.lives += 1;
                    state.enemies.splice(i, 1);
                    updateUI();
                    createParticles(enemy.x, enemy.y, '#68d391', 10);
                }
            }
            for (let i = state.projectiles.length - 1; i >= 0; i--) {
                const p = state.projectiles[i];
                if (p.type.id === 'spray' || p.type.id === 'trap') {
                    const speed = p.type.id === 'spray' ? 9 : 7;
                    const dx = p.target.x - p.x;
                    const dy = p.target.y - p.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < speed) {
                        p.target.hp -= p.type.damage;
                        if (p.type.id === 'trap') {
                            p.target.frozenTimer = 60;
                            p.target.frozenSpeedMultiplier = p.tower.getSlowMultiplier(p.target.isBoss);
                        }
                        state.projectiles.splice(i, 1);
                    } else {
                        p.x += (dx / dist) * speed;
                        p.y += (dy / dist) * speed;
                    }
                } else if (p.type.id === 'zapper') {
                    state.projectiles.splice(i, 1);
                }
            }
            updateParticles();
        }
        draw();
    }
}

function draw() {
    ctx.save();
    if (state.shakeTimer > 0) {
        const intensity = 7; // 揺れの強さ（ピクセル数）
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        ctx.translate(dx, dy);
        state.shakeTimer--;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < CONFIG.rows; r++) {
        for (let c = 0; c < CONFIG.cols; c++) {
            ctx.fillStyle = state.map[r][c] === 1 ? '#bfe7ff' : '#f3d9ff';
            ctx.fillRect(c * CONFIG.tileSize, r * CONFIG.tileSize, CONFIG.tileSize, CONFIG.tileSize);
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.strokeRect(c * CONFIG.tileSize, r * CONFIG.tileSize, CONFIG.tileSize, CONFIG.tileSize);
        }
    }
    if (state.startPoint) {
        ctx.font = `${CONFIG.tileSize * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌳', state.startPoint.c * CONFIG.tileSize + CONFIG.tileSize / 2, state.startPoint.r * CONFIG.tileSize + CONFIG.tileSize / 2);
        for (let end of state.endPoints) {
            ctx.fillStyle = '#f9a8d4';
            ctx.fillRect(end.c * CONFIG.tileSize, end.r * CONFIG.tileSize, CONFIG.tileSize, CONFIG.tileSize);
            ctx.fillStyle = '#7c3aed';
            ctx.fillText('🏰', end.c * CONFIG.tileSize + CONFIG.tileSize / 2, end.r * CONFIG.tileSize + CONFIG.tileSize / 2);
        }
    }
    state.towers.forEach(t => t.draw(ctx));
    state.enemies.forEach(e => e.draw(ctx));
    state.projectiles.forEach(p => {
        if (p.type.id === 'spray') {
            ctx.fillStyle = '#63b3ed';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type.id === 'trap') {
            ctx.fillStyle = '#ed8936';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type.id === 'zapper') {
            ctx.strokeStyle = '#d6bcfa';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.tx, p.ty);
            ctx.stroke();
        }
    });
    state.towers.filter(t => t.type.id === 'poison').forEach(t => {
        ctx.fillStyle = 'rgba(72, 187, 120, 0.15)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.type.range * CONFIG.tileSize, 0, Math.PI * 2);
        ctx.fill();
    });
    for (const p of state.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();
}

function startWave() {
    if (state.isWaveActive) return;
    ensureAudio();
    playSfx('wave');
    state.isWaveActive = true;
    waveBtn.disabled = true;
    waveBtn.textContent = 'Storm in progress...';
    state.waveQueue = [];
    const isBossWave = state.wave % CONFIG.bossWaveInterval === 0;
    if (isBossWave) showBossWarning();
    const count = 10 + Math.floor(state.wave * 3) + Math.floor(state.wave / 5) * 2;
    for (let i = 0; i < count; i++) {
        let typesAvailable = 1;
        if (state.wave >= 3) typesAvailable = 2;
        if (state.wave >= 6) typesAvailable = 3;
        if (state.wave >= 10) typesAvailable = 4;
        let typeIdx = Math.floor(Math.random() * typesAvailable);
        if (state.wave > 15 && typeIdx === 0 && Math.random() > 0.5) {
            typeIdx = Math.floor(Math.random() * (typesAvailable - 1)) + 1;
        }
        state.waveQueue.push({idx: typeIdx, isBoss: false});
    }
    if (isBossWave) {
        state.waveQueue.push({idx: Math.floor(Math.random() * 2) + 1, isBoss: true});
    }
    state.waveTimer = 30;
}

function showBossWarning() {
    triggerShake(20);
    bossWarning.style.opacity = 1;
    bossWarning.style.transform = 'translate(-50%, -50%) scale(1.2)';
    setTimeout(() => {
        bossWarning.style.opacity = 0;
        bossWarning.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 2000);
}

function endWave() {
    state.isWaveActive = false;
    state.wave++;
    updateUI();
    waveBtn.disabled = false;
    waveBtn.textContent = `Start Wave ${state.wave}`;
    if (state.wave % CONFIG.bossWaveInterval === 0) {
        waveBtn.style.background = 'linear-gradient(135deg, #fb7185, #f59e0b, #a78bfa)';
        waveBtn.textContent = `⚠️ Wave ${state.wave} Boss`;
    } else {
        waveBtn.style.background = '';
    }
}

function gameOver() {
    state.isPlaying = false;
    stopBGM();
    playSfx('lose');
    modalTitle.textContent = 'Magic Faded';
    modalMessage.innerHTML = `The castle was overrun by the storm...<br>Reached: Wave ${state.wave}`;
    modalBtn.onclick = () => init();
    modalOverlay.style.display = 'flex';
}

function setupUI() {
    towerControls.innerHTML = '';
    towerButtons.length = 0;
    const keys = Object.keys(TOWERS);
    keys.forEach(key => {
        const t = TOWERS[key];
        const btn = document.createElement('div');
        btn.className = 'tower-btn';
        btn.innerHTML = `<div class="tower-icon">${t.icon}</div><div class="tower-cost">$${t.cost}</div><div class="tower-name">${t.name}</div>`;
        btn.onclick = () => selectTower(key, btn);
        towerControls.appendChild(btn);
        towerButtons.push(btn);
    });
    waveBtn.onclick = () => {
        unlockAudio();
        startBGM();
        startWave();
    };
}

function selectTower(key, btnElement) {
    if (state.selectedTower === key && state.mode === 'build') {
        state.selectedTower = null;
        state.mode = null;
    } else {
        state.selectedTower = key;
        state.mode = 'build';
    }
    towerButtons.forEach(btn => btn.classList.remove('selected'));
    if (state.mode === 'build') btnElement.classList.add('selected');
    upgradeBtn.classList.remove('selected');
}

function updateTowerButtons() {
    const keys = Object.keys(TOWERS);
    towerButtons.forEach((btn, idx) => {
        const key = keys[idx];
        btn.classList.toggle('selected', state.mode === 'build' && state.selectedTower === key);
    });
    upgradeBtn.classList.toggle('selected', state.mode === 'upgrade');
}

function updateUI() {
    uiMoney.textContent = Math.floor(state.money);
    uiLives.textContent = state.lives;
    uiWave.textContent = state.wave;
    const keys = Object.keys(TOWERS);
    towerButtons.forEach((btn, idx) => {
        const cost = TOWERS[keys[idx]].cost;
        const enabled = state.money >= cost;
        btn.style.opacity = enabled ? '1' : '0.4';
        btn.style.filter = enabled ? 'none' : 'grayscale(100%)';
    });
}

function selectUpgradeMode() {
    state.selectedTower = null;
    state.mode = state.mode === 'upgrade' ? null : 'upgrade';
    towerButtons.forEach(b => b.classList.remove('selected'));
    upgradeBtn.classList.toggle('selected', state.mode === 'upgrade');
}

function handleInput(e) {
    if (!state.isPlaying) return;
    if (e.type === 'touchstart') e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    const c = Math.floor(x / CONFIG.tileSize);
    const r = Math.floor(y / CONFIG.tileSize);
    if (c < 0 || c >= CONFIG.cols || r < 0 || r >= CONFIG.rows) return;
    if (state.mode === 'upgrade') {
        const tower = state.towers.find(t => t.c === c && t.r === r);
        if (!tower || tower.level >= CONFIG.maxTowerLevel) return;
        const cost = Math.floor(tower.type.cost * CONFIG.upgradeCostShield);
        if (state.money < cost) return;
        state.money -= cost;
        tower.upgrade ? tower.upgrade() : tower.level++;
        playSfx('upgrade');
        createParticles(tower.x, tower.y, '#faf089', 15);
        updateUI();
        return;
    }
    if (state.mode !== 'build' || !state.selectedTower) return;
    if (state.map[r][c] === 1) return;
    if (state.towers.some(t => t.c === c && t.r === r)) return;
    const towerInfo = TOWERS[state.selectedTower];
    if (state.money < towerInfo.cost) return;
    state.money -= towerInfo.cost;
    state.towers.push(new Tower(c, r, state.selectedTower));
    playSfx('build');
    createParticles(c * CONFIG.tileSize + CONFIG.tileSize / 2, r * CONFIG.tileSize + CONFIG.tileSize / 2, '#feb2b2', 8);
    updateUI();
}

document.addEventListener('keydown', e => {
    unlockAudio();
    if (!state.isPlaying) return;
    if (e.key === 'ArrowLeft') {
        selectNextTower(-1);
        e.preventDefault();
    } else if (e.key === 'ArrowRight') {
        selectNextTower(1);
        e.preventDefault();
    } else if (e.key === '1') {
        selectTower('spray', towerButtons[0]);
        e.preventDefault();
    } else if (e.key === '2') {
        selectTower('trap', towerButtons[1]);
        e.preventDefault();
    } else if (e.key === '3') {
        selectTower('zapper', towerButtons[2]);
        e.preventDefault();
    } else if (e.key === '4') {
        selectTower('poison', towerButtons[3]);
        e.preventDefault();
    } else if (e.key === '5') {
        selectUpgradeMode();
        e.preventDefault();
    }
});

window.addEventListener('pointerdown', () => {
    unlockAudio();
    startBGM();
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audio.ctx) ensureAudio();
});

function selectNextTower(direction) {
    const towerKeys = Object.keys(TOWERS);
    let currentIndex = towerKeys.indexOf(state.selectedTower);
    currentIndex = currentIndex === -1 ? 0 : (currentIndex + direction + towerKeys.length) % towerKeys.length;
    state.selectedTower = towerKeys[currentIndex];
    updateTowerButtons();
}

async function saveGame() {
    ensureAudio();
    playSfx('build');
    if (state.enemies.length > 0 && !confirm('Saving while a wave is active will reset enemy positions until the next wave begins.\nProceed?')) return;
    const saveData = {
        wave: state.wave,
        money: state.money,
        lives: state.lives,
        map: state.map,
        startPoint: state.startPoint,
        endPoints: state.endPoints,
        towers: state.towers.map(t => ({c: t.c, r: t.r, type: t.type.id}))
    };
    try {
        await navigator.clipboard.writeText(JSON.stringify(saveData));
        alert('✅ Saved to clipboard!\n\nPaste it into a notes app or text file to keep your rainbow progress safe.');
    } catch (err) {
        console.error(err);
        alert('Save failed because clipboard access was denied.');
    }
}

function loadGame() {
    ensureAudio();
    playSfx('upgrade');
    const json = prompt('Paste your saved JSON data here:');
    if (!json) return;
    try {
        const data = JSON.parse(json);
        state.wave = data.wave;
        state.money = data.money;
        state.lives = data.lives;
        state.map = data.map;
        state.startPoint = data.startPoint;
        state.endPoints = data.endPoints || [{c: CONFIG.cols - 1, r: Math.floor(CONFIG.rows / 2)}];
        if (typeof rebuildNavMap === 'function') {
            rebuildNavMap();
        } else {
            console.error('rebuildNavMap function is missing!');
            alert('Error: rebuildNavMap was not found. Check the map generation code.');
            return;
        }
        state.towers = data.towers.map(tData => new Tower(tData.c, tData.r, tData.type));
        state.enemies = [];
        state.projectiles = [];
        state.particles = [];
        state.waveQueue = [];
        state.selectedTower = null;
        state.mode = null;
        state.isPlaying = true;
        state.isWaveActive = false;
        modalOverlay.style.display = 'none';
        waveBtn.disabled = false;
        waveBtn.textContent = `Start Wave ${state.wave}`;
        if (state.wave % CONFIG.bossWaveInterval === 0) {
            waveBtn.style.background = 'linear-gradient(135deg, #fb7185, #f59e0b, #a78bfa)';
            waveBtn.textContent = `⚠️ Wave ${state.wave} Boss`;
        } else {
            waveBtn.style.background = '';
        }
        draw();
        updateUI();
        alert(`📂 Loaded! You can continue from Wave ${state.wave}.`);
    } catch (err) {
        console.error(err);
        alert('❌ Load failed: the data is corrupted or the game code has an error.\n' + err.message);
    }
}

class Enemy {
    constructor(typeIdx, wave, isBoss = false) {
        const type = ENEMIES[typeIdx];
        this.type = type;
        this.isBoss = isBoss;
        this.col = state.startPoint.c;
        this.row = state.startPoint.r;
        this.prevC = this.col;
        this.prevR = this.row;
        this.targetC = this.col;
        this.targetR = this.row;
        this.x = this.col * CONFIG.tileSize + CONFIG.tileSize / 2;
        this.y = this.row * CONFIG.tileSize + CONFIG.tileSize / 2;
        let hpMultiplier = Math.pow(1.08, wave - 1);
        hpMultiplier += wave * 0.9;
        if (isBoss) {
            hpMultiplier *= 5;
            this.speed = type.speed * CONFIG.tileSize * 0.5;
            this.radius = CONFIG.tileSize * 0.6;
            this.reward = type.reward * 7;
        } else {
            this.speed = type.speed * CONFIG.tileSize;
            this.radius = CONFIG.tileSize * 0.35;
            this.reward = type.reward;
        }
        const speedBoost = 1 + Math.min(0.5, wave * 0.01);
        this.speed *= speedBoost;
        this.maxHp = Math.floor(CONFIG.baseEnemyHp * type.hpMod * hpMultiplier);
        this.hp = this.maxHp;
        this.baseSpeed = this.speed;
        this.frozenTimer = 0;
        this.frozenSpeedMultiplier = 1;
    }

    update() {
        if (this.frozenTimer > 0) {
            this.frozenTimer--;
            this.speed = this.baseSpeed * this.frozenSpeedMultiplier;
        } else {
            this.speed = this.baseSpeed;
            this.frozenSpeedMultiplier = 1;
        }
        const tx = this.targetC * CONFIG.tileSize + CONFIG.tileSize / 2;
        const ty = this.targetR * CONFIG.tileSize + CONFIG.tileSize / 2;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.speed) {
            this.prevC = this.col;
            this.prevR = this.row;
            this.x = tx;
            this.y = ty;
            this.col = this.targetC;
            this.row = this.targetR;
            const isGoal = state.endPoints.some(p => p.c === this.col && p.r === this.row);
            if (isGoal) return 'finished';
            const nextOptions = state.navMap[this.row][this.col];
            if (!nextOptions || nextOptions.length === 0) {
                this.targetC = this.col;
                this.targetR = this.row;
                return 'active';
            }
            const goal = state.endPoints[0];
            const candidates = nextOptions.filter(next => !(next.c === this.prevC && next.r === this.prevR && nextOptions.length > 1));
            if (candidates.length === 0) {
                const prevPos = nextOptions.find(opt => opt.c === this.prevC && opt.r === this.prevR);
                if (prevPos) candidates.push(prevPos);
            }
            candidates.sort((a, b) => {
                const da = Math.abs(goal.c - a.c) + Math.abs(goal.r - a.r);
                const db = Math.abs(goal.c - b.c) + Math.abs(goal.r - b.r);
                return da - db;
            });
            let next = candidates[0] || nextOptions[0];
            if (candidates.length > 1 && Math.random() < Math.max(0, 0.3 - (state.wave - 1) * 0.02)) {
                next = candidates[1 + Math.floor(Math.random() * (candidates.length - 1))];
            }
            this.targetC = next.c;
            this.targetR = next.r;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        return 'active';
    }

    draw(ctx) {
        const scale = this.isBoss ? 1.8 : 1.0;
        ctx.font = `${CONFIG.tileSize * 0.7 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.isBoss) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
        }
        ctx.fillText(this.type.icon, this.x, this.y);
        ctx.shadowBlur = 0;
        const hpPercent = this.hp / this.maxHp;
        const barWidth = this.isBoss ? 40 : 20;
        const barY = this.y - (this.isBoss ? 25 : 15);
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, 4);
        ctx.fillStyle = hpPercent < 0.3 ? '#fc8181' : (hpPercent < 0.6 ? '#f6ad55' : '#68d391');
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hpPercent, 4);
        if (this.frozenTimer > 0) {
            ctx.fillStyle = 'rgba(99, 179, 237, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Tower {
    constructor(c, r, typeKey) {
        this.c = c;
        this.r = r;
        this.x = c * CONFIG.tileSize + CONFIG.tileSize / 2;
        this.y = r * CONFIG.tileSize + CONFIG.tileSize / 2;
        this.type = TOWERS[typeKey];
        this.level = 1;
        this.cooldown = 0;
        this.angle = 0;
    }

    upgrade() {
        if (this.level < CONFIG.maxTowerLevel) {
            this.level++;
            return true;
        }
        return false;
    }

    getDamage() {
        return this.type.damage * (1 + (this.level - 1) * 0.5);
    }

    getRange() {
        return this.type.range * CONFIG.tileSize * (1 + (this.level - 1) * 0.1);
    }

    getSlowMultiplier(isBoss) {
        const baseMultiplier = isBoss ? 0.7 : this.type.slow;
        return Math.max(0.2, baseMultiplier - (this.level - 1) * 0.05);
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
        const range = this.getRange();
        let target = null;
        let minDist = Infinity;
        for (const enemy of state.enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= range && dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }
        if (!target) return;
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        if (this.cooldown <= 0) {
            this.fire(target);
            this.cooldown = this.type.cooldown;
        }
    }

    fire(target) {
        if (this.type.id === 'spray' || this.type.id === 'zapper') {
            state.projectiles.push({x: this.x, y: this.y, tx: target.x, ty: target.y, target, type: this.type, active: true});
            playSfx(this.type.id);
            if (this.type.id === 'zapper') {
                target.hp -= this.type.damage;
                createParticles(target.x, target.y, '#f6e05e', 5);
            }
        } else if (this.type.id === 'trap') {
            state.projectiles.push({x: this.x, y: this.y, target, tower: this, type: this.type, active: true, speed: 6});
            playSfx(this.type.id);
        } else if (this.type.id === 'poison') {
            for (const enemy of state.enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.type.range * CONFIG.tileSize) {
                    enemy.hp -= this.type.damage;
                    if (Math.random() < 0.2) createParticles(enemy.x, enemy.y, '#68d391', 1);
                }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(this.c * CONFIG.tileSize + 2, this.r * CONFIG.tileSize + 2, CONFIG.tileSize - 4, CONFIG.tileSize - 4);
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.c * CONFIG.tileSize + 4, this.r * CONFIG.tileSize + 4, CONFIG.tileSize - 8, CONFIG.tileSize - 8);
        ctx.font = `${CONFIG.tileSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, this.y);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Lv' + this.level, this.x, this.y + 15);
        if (this.type.id !== 'poison') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = this.type.color;
            ctx.fillRect(0, -3, 16, 6);
            ctx.restore();
        }
        if (this.cooldown > 0) {
            const percent = this.cooldown / this.type.cooldown;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, CONFIG.tileSize / 2 - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
            ctx.fill();
        }
    }
}

function generateMap() {
    state.map = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill(0));
    const centerR = 5;
    state.startPoint = {c: 0, r: centerR};
    state.endPoints = [{c: CONFIG.cols - 1, r: centerR}];
    const minR = 1;
    const maxR = 7;
    let stack = [];
    state.map[centerR][1] = 1;
    stack.push({r: centerR, c: 1});
    const dirs = [{r:-2,c:0}, {r:2,c:0}, {r:0,c:-2}, {r:0,c:2}];
    while (stack.length > 0) {
        let curr = stack[stack.length - 1];
        const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);
        const neighbors = [];
        for (let d of shuffledDirs) {
            let nr = curr.r + d.r;
            let nc = curr.c + d.c;
            if (nr >= minR && nr <= maxR && nc >= 1 && nc <= CONFIG.cols - 2 && state.map[nr][nc] === 0) {
                neighbors.push({r: nr, c: nc, dr: d.r, dc: d.c});
            }
        }
        if (neighbors.length > 0) {
            let next = neighbors[0];
            state.map[next.r][next.c] = 1;
            state.map[curr.r + next.dr/2][curr.c + next.dc/2] = 1;
            stack.push({r: next.r, c: next.c});
        } else {
            stack.pop();
        }
    }
    state.map[centerR][0] = 1;
    state.map[centerR][CONFIG.cols - 1] = 1;
    for (let c = CONFIG.cols - 2; c >= 1; c--) {
        if (state.map[centerR][c] === 1) break;
        state.map[centerR][c] = 1;
    }
    rebuildNavMap();
}

function rebuildNavMap() {
    const distGrid = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill(Infinity));
    state.navMap = Array(CONFIG.rows).fill().map(() => Array(CONFIG.cols).fill().map(() => []));
    const goal = state.endPoints[0];
    let queue = [{r: goal.r, c: goal.c, d: 0}];
    distGrid[goal.r][goal.c] = 0;
    const dirs = [{r:1,c:0}, {r:-1,c:0}, {r:0,c:1}, {r:0,c:-1}];
    while (queue.length > 0) {
        let curr = queue.shift();
        for (let dir of dirs) {
            let nr = curr.r + dir.r;
            let nc = curr.c + dir.c;
            if (nr >= 0 && nr < CONFIG.rows && nc >= 0 && nc < CONFIG.cols && state.map[nr][nc] === 1 && distGrid[nr][nc] === Infinity) {
                distGrid[nr][nc] = curr.d + 1;
                queue.push({r: nr, c: nc, d: curr.d + 1});
            }
        }
    }
    for (let r = 0; r < CONFIG.rows; r++) {
        for (let c = 0; c < CONFIG.cols; c++) {
            if (state.map[r][c] === 1) {
                let neighbors = [];
                for (let dir of dirs) {
                    let nr = r + dir.r;
                    let nc = c + dir.c;
                    if (nr >= 0 && nr < CONFIG.rows && nc >= 0 && nc < CONFIG.cols && state.map[nr][nc] === 1) {
                        neighbors.push({r: nr, c: nc, dist: distGrid[nr][nc]});
                    }
                }
                neighbors.sort((a, b) => a.dist - b.dist);
                state.navMap[r][c] = neighbors.map(n => ({r: n.r, c: n.c}));
            }
        }
    }
}

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput, {passive: false});
window.onload = init;
window.onresize = init;
