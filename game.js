const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');
const levelDisplay = document.getElementById('level-display');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let musicTimeout = null;
let musicPlaying = false;

function stopBackgroundMusic() {
    musicPlaying = false;
    if (musicTimeout) {
        clearTimeout(musicTimeout);
        musicTimeout = null;
    }
}

function playBackgroundMusic() {
    if (!musicPlaying) return;
    
    const melody = [
        {freq: 659.25, dur: 0.15}, // E5
        {freq: 659.25, dur: 0.15}, // E5
        {freq: 0, dur: 0.15},       // rest
        {freq: 659.25, dur: 0.15}, // E5
        {freq: 0, dur: 0.15},       // rest
        {freq: 523.25, dur: 0.15}, // C5
        {freq: 659.25, dur: 0.15}, // E5
        {freq: 0, dur: 0.15},       // rest
        {freq: 783.99, dur: 0.15}, // G5
        {freq: 0, dur: 0.45},       // rest
        {freq: 392.00, dur: 0.15}, // G4
        {freq: 0, dur: 0.45}        // rest
    ];
    
    let time = audioCtx.currentTime;
    
    melody.forEach((note) => {
        if (note.freq > 0) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = note.freq;
            
            gain.gain.setValueAtTime(0.06, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + note.dur);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(time);
            osc.stop(time + note.dur);
        }
        time += note.dur;
    });
    
    const totalDuration = melody.reduce((sum, n) => sum + n.dur, 0) * 1000;
    musicTimeout = setTimeout(() => {
        if (musicPlaying && gameActive) {
            playBackgroundMusic();
        }
    }, totalDuration);
}

function startMusic() {
    musicPlaying = true;
    playBackgroundMusic();
}

function playEagleScreech() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

function playFireThrowSound() {
    // Whoosh fire sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playShieldBreakSound() {
    // Removed - now just vibration
}

function playGlassBreakSound() {
    // Removed - now just vibration
}

function playLevelUpSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(523, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playBreakingGlassSound() {
    // Removed - now just vibration
}

function playGameOverSound() {
    const notes = [
        {freq: 523, time: 0, dur: 0.15},      // C
        {freq: 494, time: 0.15, dur: 0.15},   // B
        {freq: 466, time: 0.3, dur: 0.15},    // Bb
        {freq: 440, time: 0.45, dur: 0.15},   // A
        {freq: 392, time: 0.6, dur: 0.15},    // G
        {freq: 349, time: 0.75, dur: 0.15},   // F
        {freq: 330, time: 0.9, dur: 0.3},     // E
        {freq: 262, time: 1.2, dur: 0.5}      // Low C (dramatic end)
    ];
    
    notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.value = note.freq;
        
        const startTime = audioCtx.currentTime + note.time;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + note.dur);
    });
}

let gameActive = false, frameCount = 0, distance = 0, time = 0;
let lastTap = 0, isHoldingTap = false;
let currentLevel = 1;
let phaseTimer = 0, currentPhase = 'pipes';

let dragons = [], toothFairies = [], teeth = [];
let chimneyObstacles = [];
let buildings = [], snow = [], planets = [], thunders = [];
let swords = [];
let fireballs = []; // New array for eagle's fireballs

const eagle = { 
    x: 100, y: 0, w: 24, h: 20,
    gravity: 0.5, lift: -4, velocity: 0, 
    isAttacking: false, attackTimer: 0, shieldActive: false, shieldTimer: 0
};

const levelDistances = [
    0, 1050, 2100, 3150, 4200, 5250, 6300, 7350, 8400, 9450,
    10500, 11550, 12600, 13650, 14700, 15750, 16800, 17850, 18900, 19950
];

const levels = { 
    easy: { obstacleSpawnRate: 50, enemySpawnRate: 80, speed: 2.5, fireFreq: 0.005, maxEnemies: 4, swordSpawnRate: 90 }, 
    medium: { obstacleSpawnRate: 45, enemySpawnRate: 70, speed: 3.5, fireFreq: 0.01, maxEnemies: 5, swordSpawnRate: 75 }, 
    hard: { obstacleSpawnRate: 40, enemySpawnRate: 60, speed: 4.5, fireFreq: 0.018, maxEnemies: 6, swordSpawnRate: 60 } 
};

let difficulty = 'medium';

let lastChimneyGapStart = null;

function initWorld() {
    snow = []; buildings = []; planets = [];
    
    for(let i = 0; i < 150; i++) {
        snow.push({
            x: Math.random() * canvas.width, 
            y: Math.random() * canvas.height, 
            s: Math.random() * 2.5 + 0.8, 
            v: Math.random() * 1.2 + 0.4,
            isFancy: Math.random() > 0.5
        });
    }
    
    const buildingCount = Math.ceil(canvas.width / 60);
    for(let i = 0; i < buildingCount + 2; i++) {
        const height = 80 + Math.random() * 60;
        buildings.push({
            x: i * 60,
            y: canvas.height - height - 50,
            width: 55,
            height: height
        });
    }
    
    // More and bigger planets
    ["🪐", "🌑", "☄️", "🔴", "🌕", "⭐", "✨"].forEach((icon, i) => {
        planets.push({ 
            icon, 
            centerX: Math.random() * canvas.width, 
            centerY: Math.random() * (canvas.height * 0.3), 
            angle: Math.random() * Math.PI * 2, 
            radius: 50 + (i * 40), 
            speed: 0.0008 + (i * 0.0004), 
            size: 30 + (i * 10) 
        });
    });
    
    // Add spaceships
    ["🛸", "🚀", "🛰️"].forEach((icon, i) => {
        planets.push({ 
            icon, 
            centerX: Math.random() * canvas.width, 
            centerY: Math.random() * (canvas.height * 0.35), 
            angle: Math.random() * Math.PI * 2, 
            radius: 60 + (i * 45), 
            speed: 0.0012 + (i * 0.0006), 
            size: 28 + (i * 8) 
        });
    });
}

function getMaxUnlockedLevel() {
    const saved = localStorage.getItem('maxUnlockedLevel');
    if (!saved || saved === null || saved === 'null') {
        return 1;
    }
    return parseInt(saved);
}

function unlockLevel(level) {
    const current = getMaxUnlockedLevel();
    if (level > current) {
        localStorage.setItem('maxUnlockedLevel', String(level));
    }
}

function backToMenu() {
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
}

function showLevelSelect(diff) {
    difficulty = diff;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('level-select').style.display = 'block';
    
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';
    
    const maxUnlocked = getMaxUnlockedLevel();
    
    for(let i = 1; i <= 20; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-button';
        
        if (i <= maxUnlocked) {
            btn.textContent = i;
            btn.onclick = () => startGameFromLevel(diff, i);
        } else {
            btn.classList.add('locked');
            btn.textContent = '🔒';
            btn.disabled = true;
        }
        
        grid.appendChild(btn);
    }
}

function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    initWorld(); 
}

window.addEventListener('resize', resize);
resize();

const handleInput = (e) => {
    if (!gameActive) return;
    if (e.cancelable) e.preventDefault();
    
    const now = Date.now();
    isHoldingTap = true;
    
    if (now - lastTap < 220) { 
        // Double tap - throw fire
        eagle.isAttacking = true; 
        eagle.attackTimer = 30; // Short visual indicator
        
        // Create fireball
        fireballs.push({
            x: eagle.x + eagle.w,
            y: eagle.y + eagle.h / 2,
            vx: 8,
            vy: 0,
            size: 20,
            life: 100
        });
        
        playFireThrowSound();
    }
    lastTap = now;
};

const handleInputEnd = () => { isHoldingTap = false; };

canvas.addEventListener('touchstart', handleInput, {passive: false});
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchend', handleInputEnd, {passive: false});
canvas.addEventListener('mouseup', handleInputEnd);

function startGame(lvl) {
    showLevelSelect(lvl);
}

function startGameFromLevel(lvl, level) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    startMusic();
    
    difficulty = lvl;
    currentLevel = level;
    
    document.getElementById('menu').style.display = 'none';
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    
    gameActive = true; 
    distance = levelDistances[level - 1];
    time = 0;
    frameCount = 0;
    phaseTimer = 0;
    currentPhase = 'pipes';
    lastChimneyGapStart = null;
    
    dragons = []; toothFairies = []; teeth = [];
    chimneyObstacles = []; thunders = [];
    swords = [];
    fireballs = [];
    
    eagle.y = canvas.height / 2; 
    eagle.velocity = 0;
    
    animate();
}

function update() {
    const config = levels[difficulty];
    
    if (isHoldingTap) {
        eagle.velocity = eagle.lift;
    } else {
        eagle.velocity += eagle.gravity;
    }
    eagle.y += eagle.velocity;
    
    if (eagle.shieldActive) { 
        eagle.shieldTimer--; 
        if (eagle.shieldTimer <= 0) eagle.shieldActive = false; 
    }
    
    if (eagle.isAttacking) {
        eagle.attackTimer--;
        if (eagle.attackTimer <= 0) eagle.isAttacking = false;
    }
    
    // Bottom collision only - can touch the sky
    if (eagle.y + eagle.h > canvas.height) gameOver();
    if (eagle.y < 0) eagle.y = 0;
    
    distance += config.speed * 0.1;
    if (frameCount % 60 === 0) time++;
    
    for(let i = currentLevel; i < 20; i++) {
        if (distance >= levelDistances[i]) {
            currentLevel = i + 1;
            unlockLevel(currentLevel);
            playLevelUpSound();
            break;
        }
    }
    
    levelDisplay.innerText = `LEVEL: ${currentLevel}`;
    
    phaseTimer++;
    
    if (currentPhase === 'pipes') {
        if (phaseTimer > 1800) {
            currentPhase = 'enemies';
            phaseTimer = 0;
        }
    } else if (currentPhase === 'enemies') {
        if (phaseTimer > 900) {
            currentPhase = 'pipes';
            phaseTimer = 0;
        }
    }
    
    if (Math.random() < 0.005) {
        thunders.push({ x: Math.random() * canvas.width, life: 15, alpha: 1 });
    }
    
    thunders.forEach((t, i) => {
        t.life--;
        t.alpha = t.life / 15;
        if (t.life <= 0) thunders.splice(i, 1);
    });
    
    // Update fireballs
    fireballs.forEach((fb, i) => {
        fb.x += fb.vx;
        fb.life--;
        
        if (fb.life <= 0 || fb.x > canvas.width) {
            fireballs.splice(i, 1);
        }
    });
    
    // Spawn chimneys during pipes phase
    if (currentPhase === 'pipes' && frameCount % config.obstacleSpawnRate === 0) {
        const gapSize = 180; // Reduced from 200 to make more challenging for smaller bird
        
        let gapStart;
        if (lastChimneyGapStart === null) {
            // First chimney - place it in a safe middle area
            gapStart = canvas.height / 2 - gapSize / 2;
        } else {
            // Subsequent chimneys - gradual change like Flappy Bird
            // Allow movement up or down, but limit the change to avoid steep slopes
            const maxChange = 70; // Increased from 60 for more challenge
            const minGap = 80; // Reduced padding for tighter spaces
            const maxGap = canvas.height - gapSize - 80; // Reduced padding
            
            // Random change within allowed range
            const change = (Math.random() - 0.5) * 2 * maxChange;
            gapStart = lastChimneyGapStart + change;
            
            // Clamp to safe boundaries
            gapStart = Math.max(minGap, Math.min(maxGap, gapStart));
        }
        
        chimneyObstacles.push({
            x: canvas.width,
            gapStart: gapStart,
            gapSize: gapSize,
            width: 50
        });
        
        lastChimneyGapStart = gapStart;
    }
    
    chimneyObstacles.forEach((chimney, i) => {
        chimney.x -= config.speed;
        
        // Collision detection
        if (eagle.x + eagle.w > chimney.x && eagle.x < chimney.x + chimney.width) {
            // Hit top chimney
            if (eagle.y < chimney.gapStart) {
                gameOver();
            }
            // Hit bottom chimney
            if (eagle.y + eagle.h > chimney.gapStart + chimney.gapSize) {
                gameOver();
            }
        }
        
        if (chimney.x < -100) chimneyObstacles.splice(i, 1);
    });
    
    // Spawn enemies during enemies phase - more balanced density
    if (currentPhase === 'enemies' && frameCount % config.enemySpawnRate === 0) {
        const allEnemies = [...dragons, ...toothFairies];
        
        // Allow multiple enemies but not too many
        if (allEnemies.length < config.maxEnemies) {
            const enemyType = Math.random();
            const yPos = 80 + Math.random() * (canvas.height - 180);
            
            if (enemyType < 0.5) {
                dragons.push({ 
                    x: canvas.width, 
                    y: yPos, 
                    w: 55, 
                    h: 50, 
                    isFiring: false, 
                    fireTimer: 0, 
                    wingFlap: 0
                });
            } else {
                toothFairies.push({ 
                    x: canvas.width, 
                    y: yPos, 
                    w: 40, 
                    h: 40, 
                    shootTimer: 50, 
                    wingFlap: 0, 
                    wingSpeed: 0.25
                });
            }
        }
    }
    
    // Spawn swords during enemies phase
    if (currentPhase === 'enemies' && frameCount % config.swordSpawnRate === 0) {
        swords.push({
            x: canvas.width,
            y: 80 + Math.random() * (canvas.height - 160),
            size: 32,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.15 + Math.random() * 0.1
        });
    }
    
    swords.forEach((sword, i) => {
        sword.x -= config.speed;
        sword.rotation += sword.rotationSpeed;
        
        // Check collision with fireballs
        let hitByFireball = false;
        fireballs.forEach((fb, fbIndex) => {
            const dist = Math.hypot(fb.x - sword.x, fb.y - sword.y);
            if (dist < fb.size + sword.size/2) {
                swords.splice(i, 1);
                fireballs.splice(fbIndex, 1);
                if (navigator.vibrate) navigator.vibrate(100);
                hitByFireball = true;
            }
        });
        
        if (hitByFireball) return;
        
        // Collision detection with eagle
        let shieldRadius = 30;
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - sword.x, eagleCenterY - sword.y);
        
        if (!eagle.isAttacking && dist < sword.size + 12) {
            gameOver();
        }
        
        if (sword.x < -50) swords.splice(i, 1);
    });
    
    dragons.forEach((d, i) => {
        d.x -= config.speed;
        d.wingFlap += 0.15;
        
        if (!d.isFiring && Math.random() < config.fireFreq) { 
            d.isFiring = true; 
            d.fireTimer = 45; 
        }
        if (d.isFiring) d.fireTimer--; 
        if (d.fireTimer <= 0) d.isFiring = false;

        // Check collision with fireballs
        let hitByFireball = false;
        fireballs.forEach((fb, fbIndex) => {
            let dragonCenterX = d.x + d.w/2;
            let dragonCenterY = d.y + d.h/2;
            const dist = Math.hypot(fb.x - dragonCenterX, fb.y - dragonCenterY);
            if (dist < fb.size + d.w/2) {
                dragons.splice(i, 1);
                fireballs.splice(fbIndex, 1);
                if (navigator.vibrate) navigator.vibrate(100);
                hitByFireball = true;
            }
        });
        
        if (hitByFireball) return;

        let shieldRadius = 30;
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dragonCenterX = d.x + d.w/2;
        let dragonCenterY = d.y + d.h/2;
        
        let dist = Math.hypot(eagleCenterX - dragonCenterX, eagleCenterY - dragonCenterY);

        if (eagle.shieldActive && dist < shieldRadius + d.w/2) {
            dragons.splice(i, 1); 
            if (navigator.vibrate) navigator.vibrate(100);
        } else if (!eagle.shieldActive && eagle.x < d.x + d.w && eagle.x + eagle.w > d.x && 
                   eagle.y < d.y + d.h && eagle.y + eagle.h > d.y) {
            gameOver();
        } else if (d.isFiring && eagle.x + eagle.w > d.x - 90 && eagle.x < d.x && 
                   eagle.y < d.y + d.h && eagle.y + eagle.h > d.y) {
            gameOver();
        }
        
        if (d.x + d.w < 0) dragons.splice(i, 1);
    });
    
    toothFairies.forEach((fairy, i) => {
        fairy.x -= config.speed;
        fairy.wingFlap += fairy.wingSpeed;
        fairy.shootTimer--;
        
        // Shoot line of teeth horizontally (5 teeth in a horizontal line)
        if (fairy.shootTimer <= 0 && fairy.x < canvas.width - 100) {
            for (let j = 0; j < 5; j++) {
                teeth.push({
                    x: fairy.x - (j * 25),
                    y: fairy.y + 20,
                    vx: -6,
                    vy: 0,
                    spin: 0,
                    spinSpeed: 0.2
                });
            }
            fairy.shootTimer = 70;
        }
        
        // Check collision with fireballs
        let hitByFireball = false;
        fireballs.forEach((fb, fbIndex) => {
            let fairyCenterX = fairy.x + fairy.w/2;
            let fairyCenterY = fairy.y + fairy.h/2;
            const dist = Math.hypot(fb.x - fairyCenterX, fb.y - fairyCenterY);
            if (dist < fb.size + fairy.w/2) {
                toothFairies.splice(i, 1);
                fireballs.splice(fbIndex, 1);
                if (navigator.vibrate) navigator.vibrate(100);
                hitByFireball = true;
            }
        });
        
        if (hitByFireball) return;
        
        let shieldRadius = 30;
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let fairyCenterX = fairy.x + fairy.w/2;
        let fairyCenterY = fairy.y + fairy.h/2;
        
        let dist = Math.hypot(eagleCenterX - fairyCenterX, eagleCenterY - fairyCenterY);
        
        if (eagle.shieldActive && dist < shieldRadius + fairy.w/2) {
            toothFairies.splice(i, 1);
            if (navigator.vibrate) navigator.vibrate(100);
        } else if (!eagle.shieldActive && eagle.x < fairy.x + fairy.w && eagle.x + fairy.w > fairy.x && 
                   eagle.y < fairy.y + fairy.h && eagle.y + eagle.h > fairy.y) {
            gameOver();
        }
        
        if (fairy.x < -100) toothFairies.splice(i, 1);
    });
    
    teeth.forEach((tooth, i) => {
        tooth.x += tooth.vx;
        tooth.y += tooth.vy;
        tooth.spin += tooth.spinSpeed;
        
        // Check collision with fireballs
        let hitByFireball = false;
        fireballs.forEach((fb, fbIndex) => {
            const dist = Math.hypot(fb.x - tooth.x, fb.y - tooth.y);
            if (dist < fb.size) {
                teeth.splice(i, 1);
                if (navigator.vibrate) navigator.vibrate(100);
                hitByFireball = true;
            }
        });
        
        if (hitByFireball) return;
        
        let shieldRadius = 30;
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        const dist = Math.hypot(eagleCenterX - tooth.x, eagleCenterY - tooth.y);
        
        if (eagle.shieldActive && dist < shieldRadius) {
            teeth.splice(i, 1);
        } else if (!eagle.shieldActive && dist < 20) {
            gameOver();
        }
        
        if (tooth.x < -50) teeth.splice(i, 1);
    });
    
    planets.forEach(p => p.angle += p.speed);
    snow.forEach(p => { 
        p.y += p.v; 
        if (p.y > canvas.height) p.y = -10; 
    });
    
    scoreElement.innerText = `DISTANCE: ${Math.floor(distance)}m | TIME: ${time}s`;
    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    thunders.forEach(t => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${t.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(t.x, 0);
        ctx.lineTo(t.x - 20, 100);
        ctx.lineTo(t.x + 10, 200);
        ctx.lineTo(t.x - 15, 350);
        ctx.stroke();
    });
    
    ctx.globalAlpha = 0.3;
    planets.forEach(p => {
        let x = p.centerX + Math.cos(p.angle) * p.radius;
        let y = p.centerY + Math.sin(p.angle) * p.radius;
        ctx.font = `${p.size}px serif`; 
        ctx.fillText(p.icon, x, y);
    });
    ctx.globalAlpha = 1.0;
    
    ctx.globalAlpha = 0.5;
    buildings.forEach(b => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "#DDDDDD";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        
        ctx.fillStyle = "#87CEEB";
        for(let row = 1; row < Math.floor(b.height / 20); row++) {
            for(let col = 0; col < 2; col++) {
                ctx.fillRect(b.x + 10 + col * 25, b.y + row * 20, 12, 15);
            }
        }
    });
    ctx.globalAlpha = 1.0;
    
    // Draw chimneys
    chimneyObstacles.forEach(chimney => {
        const topHeight = chimney.gapStart;
        const bottomY = chimney.gapStart + chimney.gapSize;
        const bottomHeight = canvas.height - bottomY;
        
        // Top chimney
        if (topHeight > 0) {
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(chimney.x, 0, chimney.width, topHeight);
            
            // Brick pattern
            ctx.strokeStyle = "#654321";
            ctx.lineWidth = 2;
            for(let y = 0; y < topHeight; y += 15) {
                for(let x = 0; x < chimney.width; x += 25) {
                    ctx.strokeRect(chimney.x + x, y, 25, 15);
                }
            }
            
            // Chimney cap
            ctx.fillStyle = "#654321";
            ctx.fillRect(chimney.x - 5, topHeight - 10, chimney.width + 10, 10);
        }
        
        // Bottom chimney
        if (bottomHeight > 0) {
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(chimney.x, bottomY, chimney.width, bottomHeight);
            
            // Brick pattern
            ctx.strokeStyle = "#654321";
            ctx.lineWidth = 2;
            for(let y = bottomY; y < canvas.height; y += 15) {
                for(let x = 0; x < chimney.width; x += 25) {
                    ctx.strokeRect(chimney.x + x, y, 25, 15);
                }
            }
            
            // Chimney cap
            ctx.fillStyle = "#654321";
            ctx.fillRect(chimney.x - 5, bottomY, chimney.width + 10, 10);
        }
    });
    
    snow.forEach(p => { 
        if (p.isFancy) {
            ctx.font = `${p.s * 3}px serif`;
            ctx.fillText("❄️", p.x, p.y);
        } else {
            ctx.fillStyle = "white";
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); 
            ctx.fill();
        }
    });
    
    // Draw Star Wars style lightsaber swords
    swords.forEach(sword => {
        ctx.save();
        ctx.translate(sword.x, sword.y);
        ctx.rotate(sword.rotation);
        
        // Intense red glow for lightsaber effect
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#FF0000";
        
        // Draw lightsaber blade as vertical red beam
        const bladeLength = 40;
        const bladeWidth = 4;
        
        // Outer glow
        ctx.strokeStyle = "#FF6666";
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, -bladeLength/2);
        ctx.lineTo(0, bladeLength/2);
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = bladeWidth;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, -bladeLength/2);
        ctx.lineTo(0, bladeLength/2);
        ctx.stroke();
        
        // Inner bright core
        ctx.strokeStyle = "#FFAAAA";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -bladeLength/2);
        ctx.lineTo(0, bladeLength/2);
        ctx.stroke();
        
        // Hilt
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#333333";
        ctx.globalAlpha = 1.0;
        ctx.fillRect(-3, bladeLength/2, 6, 8);
        
        ctx.restore();
    });
    
    // Draw fireballs
    fireballs.forEach(fb => {
        ctx.save();
        
        // Fire glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF4500";
        
        // Outer flame
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#FF4500";
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Middle flame
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#FF6347";
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#FFA500";
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Draw FANCY HORIZONTAL BIRD with gold framework (small/no wings)
    ctx.save(); 
    ctx.translate(eagle.x + eagle.w / 2, eagle.y + eagle.h / 2);
    ctx.scale(0.75, 0.75); // Make bird smaller
    
    // Golden framework glow
    ctx.shadowBlur = 35;
    ctx.shadowColor = "#FFD700";
    
    if(eagle.isAttacking) { 
        ctx.shadowBlur = 45; 
        ctx.shadowColor = "#FF4500"; // Orange-red glow when throwing fire
    }
    
    // Draw fancy black bird with minimal wings - horizontal orientation
    ctx.filter = 'brightness(0.3) contrast(1.5)'; // Black/dark fancy bird
    
    // Body (streamlined horizontal oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a'; // Dark black
    ctx.fill();
    ctx.strokeStyle = '#FFD700'; // Gold outline
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Head (smaller circle at front)
    ctx.beginPath();
    ctx.arc(14, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // Beak (pointing right)
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(24, -2);
    ctx.lineTo(24, 2);
    ctx.closePath();
    ctx.fillStyle = '#FFD700'; // Gold beak
    ctx.fill();
    
    // Eye
    ctx.beginPath();
    ctx.arc(16, -2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(16, -2, 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    
    // Tail feathers (back)
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-22, -4);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-22, 4);
    ctx.closePath();
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // Minimal wings (very small, barely visible)
    // Top wing stub
    ctx.beginPath();
    ctx.ellipse(2, -8, 3, 2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    
    // Bottom wing stub
    ctx.beginPath();
    ctx.ellipse(2, 8, 3, 2, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    
    ctx.restore();
    
    dragons.forEach(d => {
        ctx.save();
        ctx.translate(d.x + 27, d.y + 25);
        const wingScale = 1 + Math.sin(d.wingFlap) * 0.15;
        ctx.scale(wingScale, 1);
        ctx.font = "54px serif"; 
        ctx.fillText("🐉", -27, 25);
        ctx.restore();
        
        if (d.isFiring) {
            ctx.save(); 
            ctx.translate(d.x, d.y + d.h - 15);
            let flick = 2.2 + Math.sin(frameCount * 0.8) * 0.4;
            ctx.scale(flick, 1.2); 
            ctx.font = "24px serif"; 
            ctx.textAlign = "right";
            ctx.shadowBlur = 10; 
            ctx.shadowColor = "red"; 
            ctx.fillText("🔥", 0, 0); 
            ctx.restore();
        }
    });
    
    toothFairies.forEach(fairy => {
        ctx.save();
        ctx.translate(fairy.x + 20, fairy.y + 20);
        const wingFlutter = Math.sin(fairy.wingFlap);
        ctx.scale(1 + wingFlutter * 0.2, 1);
        ctx.font = "40px serif";
        ctx.fillText("🧚", -20, 0);
        ctx.restore();
    });
    
    teeth.forEach(tooth => {
        ctx.save();
        ctx.translate(tooth.x, tooth.y);
        ctx.rotate(tooth.spin);
        ctx.fillStyle = "#8B0000";
        ctx.font = "18px serif";
        ctx.fillText("🦷", -9, 9);
        ctx.restore();
    });
}

function animate() { 
    if (!gameActive) return; 
    update(); 
    draw(); 
    requestAnimationFrame(animate); 
}

function gameOver() {
    gameActive = false;
    stopBackgroundMusic();
    playGameOverSound();
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score-display').innerText = `DISTANCE: ${Math.floor(distance)}m | TIME: ${time}s | LEVEL: ${currentLevel}`;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}