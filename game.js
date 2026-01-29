const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');
const levelDisplay = document.getElementById('level-display');

// Hide the static level display
levelDisplay.style.display = 'none';

// Make score font smaller, white, and optimal for phone
scoreElement.style.fontSize = '12px';
scoreElement.style.lineHeight = '1.4';
scoreElement.style.color = 'white';
scoreElement.style.display = 'none'; // Hidden by default

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

function playCherrySound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playBananaSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playAppleSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
}

function playFlapSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1400, audioCtx.currentTime + 0.05);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
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

let gameActive = false, frameCount = 0, distance = 0, time = 0, points = 0;
let lastTap = 0, isHoldingTap = false;
let currentLevel = 1;
let phaseTimer = 0, currentPhase = 'pipes';
let gracePeriod = 120; // 2 seconds at 60fps
let gracePeriodActive = false;
let lastFrameTime = 0;
let deltaTime = 0;
let gameStarted = false;

let dragons = [], toothFairies = [], teeth = [];
let chimneyObstacles = [];
let buildings = [], snow = [], planets = [], thunders = [], trees = [];
let swords = [];
let fireballs = [];
let cherries = [];
let bananas = [];
let apples = [];
let grapes = []; // NEW: Added grapes
let oranges = []; // NEW: Added oranges
let strawberries = []; // NEW: Added strawberries
let floatingPoints = []; // NEW: Array for floating point numbers

const eagle = { 
    x: 100, y: 0, w: 24, h: 20,
    gravity: 0.5, lift: -4, velocity: 0, 
    rotation: 0,
    isAttacking: false, attackTimer: 0, shieldActive: false, shieldTimer: 0
};

const levelDistances = [
    0, 210, 420, 630, 840, 1050, 1260, 1470, 1680, 1890,
    2100, 2310, 2520, 2730, 2940, 3150, 3360, 3570, 3780, 3990
];

const levels = { 
    easy: { obstacleSpawnRate: 70, enemySpawnRate: 100, speed: 3.0, fireFreq: 0.003, maxEnemies: 3, swordSpawnRate: 110, gapSize: 145 }, 
    medium: { obstacleSpawnRate: 55, enemySpawnRate: 80, speed: 3.0, fireFreq: 0.008, maxEnemies: 5, swordSpawnRate: 80, gapSize: 135 }, 
    hard: { obstacleSpawnRate: 45, enemySpawnRate: 65, speed: 3.0, fireFreq: 0.015, maxEnemies: 7, swordSpawnRate: 60, gapSize: 125 } 
};

let difficulty = 'medium';
let selectedLevel = null;

let lastChimneyGapStart = null;

function initWorld() {
    snow = []; buildings = []; planets = []; trees = [];
    
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
    
    // Add bigger, dark green trees - taller than buildings
    for(let i = 0; i < buildingCount + 2; i++) {
        const treeHeight = 120 + Math.random() * 80; // Much bigger trees (was 40+30)
        trees.push({
            x: i * 60 + 30, // Offset between buildings
            y: canvas.height - treeHeight - 50,
            height: treeHeight,
            trunkWidth: 15 + Math.random() * 10 // Wider trunks for bigger trees
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
    scoreElement.style.display = 'none';
}

function showLevelSelect(diff) {
    difficulty = diff;
    selectedLevel = null;
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
            btn.onclick = () => selectLevel(i);
        } else {
            btn.classList.add('locked');
            btn.textContent = '🔒';
            btn.disabled = true;
        }
        
        grid.appendChild(btn);
    }
    
    // Add Start Game button if it doesn't exist
    let startBtn = document.getElementById('start-game-btn');
    if (!startBtn) {
        startBtn = document.createElement('button');
        startBtn.id = 'start-game-btn';
        startBtn.textContent = 'Start Game';
        startBtn.style.display = 'none';
        startBtn.style.marginTop = '20px';
        startBtn.style.padding = '15px 40px';
        startBtn.style.fontSize = '20px';
        startBtn.style.backgroundColor = '#00ff00';
        startBtn.style.border = 'none';
        startBtn.style.borderRadius = '10px';
        startBtn.style.cursor = 'pointer';
        startBtn.style.fontWeight = 'bold';
        startBtn.onclick = () => {
            if (selectedLevel !== null) {
                startGameFromLevel(difficulty, selectedLevel);
            }
        };
        document.getElementById('level-select').appendChild(startBtn);
    } else {
        startBtn.style.display = 'none';
    }
}

function selectLevel(level) {
    selectedLevel = level;
    
    // Remove red background from all buttons
    const buttons = document.querySelectorAll('.level-button');
    buttons.forEach(btn => {
        btn.style.backgroundColor = '';
    });
    
    // Add red background to selected button
    const selectedBtn = buttons[level - 1];
    if (selectedBtn) {
        selectedBtn.style.backgroundColor = 'red';
    }
    
    // Show Start Game button
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.style.display = 'block';
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
    
    // CHANGE 1: If game hasn't started yet, start it with upward velocity
    if (!gameStarted) {
        gameStarted = true;
        eagle.velocity = eagle.lift; // Make bird go UP on first tap
        playFlapSound();
        return;
    }
    
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
    } else {
        // Single tap - play flap sound
        playFlapSound();
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
    scoreElement.style.display = 'block';
    
    gameActive = true;
    gameStarted = false;
    distance = levelDistances[level - 1];
    time = 0;
    points = 0;
    frameCount = 0;
    phaseTimer = 0;
    currentPhase = 'pipes';
    lastChimneyGapStart = null;
    gracePeriodActive = true;
    gracePeriod = 5; 
    lastFrameTime = performance.now();
    deltaTime = 0;
    
    dragons = []; toothFairies = []; teeth = [];
    chimneyObstacles = []; thunders = [];
    swords = [];
    fireballs = [];
    cherries = [];
    bananas = [];
    apples = [];
    grapes = []; // NEW
    oranges = []; // NEW
    strawberries = []; // NEW
    floatingPoints = []; // NEW
    
    eagle.y = canvas.height / 2; 
    eagle.velocity = 0;
    eagle.rotation = 0;
    
    animate();
}

function update() {
    const config = levels[difficulty];
    
    if (!gameStarted) {
        return;
    }
    
    // Handle grace period countdown
    if (gracePeriodActive) {
        gracePeriod -= deltaTime;
        if (gracePeriod <= 0) {
            gracePeriodActive = false;
        }
    }
    
    // Apply physics only after grace period
    if (!gracePeriodActive) {
        if (isHoldingTap) {
            eagle.velocity = eagle.lift;
        } else {
            eagle.velocity += eagle.gravity * deltaTime;
        }
        eagle.y += eagle.velocity * deltaTime;
        
        // Update rotation based on velocity (Flappy Bird style)
        if (eagle.velocity < 0) {
            // Rising - tilt up
            eagle.rotation = Math.max(-0.5, eagle.velocity * 0.05);
        } else {
            // Falling - tilt down
            eagle.rotation = Math.min(1.2, eagle.velocity * 0.08);
        }
    } else {
        // During grace period, keep eagle at starting position
        eagle.velocity = 0;
        eagle.rotation = 0;
    }
    
    if (eagle.shieldActive) { 
        eagle.shieldTimer -= deltaTime; 
        if (eagle.shieldTimer <= 0) eagle.shieldActive = false; 
    }
    
    if (eagle.isAttacking) {
        eagle.attackTimer -= deltaTime;
        if (eagle.attackTimer <= 0) eagle.isAttacking = false;
    }
    
    // Bottom collision only - can touch the sky
    if (eagle.y + eagle.h > canvas.height) gameOver();
    if (eagle.y < 0) eagle.y = 0;
    
    distance += config.speed * 0.1 * deltaTime;
    if (frameCount % 60 === 0) time++;
    
    // Level up every 60 seconds
    const targetLevel = Math.floor(time / 60) + 1;
    if (targetLevel > currentLevel && targetLevel <= 20) {
        currentLevel = targetLevel;
        unlockLevel(currentLevel);
        playLevelUpSound();
    }
    
    // Level now shown in scoreElement
    
    phaseTimer += deltaTime;
    
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
    
    if (Math.random() < 0.005 * deltaTime) {
        thunders.push({ x: Math.random() * canvas.width, life: 15, alpha: 1 });
    }
    
    thunders.forEach((t, i) => {
        t.life -= deltaTime;
        t.alpha = t.life / 15;
        if (t.life <= 0) thunders.splice(i, 1);
    });
    
    // Update fireballs
    fireballs.forEach((fb, i) => {
        fb.x += fb.vx * deltaTime;
        fb.life -= deltaTime;
        
        if (fb.life <= 0 || fb.x > canvas.width) {
            fireballs.splice(i, 1);
        }
    });
    
    // NEW: Update floating points
    floatingPoints.forEach((fp, i) => {
        fp.y -= fp.vy * deltaTime;
        fp.life -= deltaTime;
        fp.alpha = fp.life / 60; // Fade out over 1 second
        
        if (fp.life <= 0) {
            floatingPoints.splice(i, 1);
        }
    });
    
    // Spawn chimneys during pipes phase
    if (currentPhase === 'pipes' && frameCount % config.obstacleSpawnRate === 0) {
        const gapSize = config.gapSize;
        
        let gapStart;
        if (lastChimneyGapStart === null) {
            // First chimney - place it in a safe middle area
            gapStart = canvas.height / 2 - gapSize / 2;
        } else {
            // Subsequent chimneys - gradual change like Flappy Bird
            const maxChange = 60;
            const minGap = 80;
            const maxGap = canvas.height - gapSize - 80;
            
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
        
        // CHANGE 2: Spawn more varied fruits with different point values
        const fruitRoll = Math.random();
        
        // Spawn fruit in the gap (60% chance - increased from 50%)
        if (Math.random() < 0.6) {
            const fruitType = Math.random();
            let fruit;
            
            if (fruitType < 0.16) {
                // Cherry - 10 points
                fruit = { x: canvas.width + 25, y: gapStart + gapSize / 2, size: 18, type: 'cherry', points: 10 };
                cherries.push(fruit);
            } else if (fruitType < 0.32) {
                // Banana - 15 points
                fruit = { x: canvas.width + 25, y: gapStart + gapSize / 2, size: 20, type: 'banana', points: 15 };
                bananas.push(fruit);
            } else if (fruitType < 0.48) {
                // Apple - 20 points
                fruit = { x: canvas.width + 25, y: gapStart + gapSize / 2, size: 19, type: 'apple', points: 20 };
                apples.push(fruit);
            } else if (fruitType < 0.64) {
                // Grapes - 25 points
                fruit = { x: canvas.width + 25, y: gapStart + gapSize / 2, size: 18, type: 'grapes', points: 25 };
                grapes.push(fruit);
            } else if (fruitType < 0.82) {
                // Orange - 30 points
                fruit = { x: canvas.width + 25, y: gapStart + gapSize / 2, size: 19, type: 'orange', points: 30 };
                oranges.push(fruit);
            } else {
                // Strawberry - 35 points
                fruit = { x: canvas.width + 25, y: gapStart + gapSize / 2, size: 18, type: 'strawberry', points: 35 };
                strawberries.push(fruit);
            }
        }
        
        // Spawn fruit at different heights in the gap (40% chance - increased from 30%)
        if (Math.random() < 0.4) {
            const fruitType2 = Math.random();
            const safeY = gapStart + 30 + Math.random() * (gapSize - 60);
            
            if (fruitType2 < 0.16) {
                cherries.push({ x: canvas.width + 25, y: safeY, size: 18, type: 'cherry', points: 10 });
            } else if (fruitType2 < 0.32) {
                bananas.push({ x: canvas.width + 25, y: safeY, size: 20, type: 'banana', points: 15 });
            } else if (fruitType2 < 0.48) {
                apples.push({ x: canvas.width + 25, y: safeY, size: 19, type: 'apple', points: 20 });
            } else if (fruitType2 < 0.64) {
                grapes.push({ x: canvas.width + 25, y: safeY, size: 18, type: 'grapes', points: 25 });
            } else if (fruitType2 < 0.82) {
                oranges.push({ x: canvas.width + 25, y: safeY, size: 19, type: 'orange', points: 30 });
            } else {
                strawberries.push({ x: canvas.width + 25, y: safeY, size: 18, type: 'strawberry', points: 35 });
            }
        }
        
        lastChimneyGapStart = gapStart;
    }
    
    chimneyObstacles.forEach((chimney, i) => {
        chimney.x -= config.speed * deltaTime;
        
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
    
    // Update cherries
    cherries.forEach((cherry, i) => {
        cherry.x -= config.speed * deltaTime;
        
        // Check collision with eagle
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - cherry.x, eagleCenterY - cherry.y);
        
        if (dist < cherry.size + 15) {
            points += 10;
            playCherrySound();
            // NEW: Create floating point
            floatingPoints.push({ x: cherry.x, y: cherry.y, value: '+10', life: 60, vy: 1.5, alpha: 1 });
            cherries.splice(i, 1);
        }
        
        if (cherry.x < -50) cherries.splice(i, 1);
    });
    
    // Update bananas
    bananas.forEach((banana, i) => {
        banana.x -= config.speed * deltaTime;
        
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - banana.x, eagleCenterY - banana.y);
        
        if (dist < banana.size + 15) {
            points += 15;
            playBananaSound();
            // NEW: Create floating point
            floatingPoints.push({ x: banana.x, y: banana.y, value: '+15', life: 60, vy: 1.5, alpha: 1 });
            bananas.splice(i, 1);
        }
        
        if (banana.x < -50) bananas.splice(i, 1);
    });
    
    // Update apples
    apples.forEach((apple, i) => {
        apple.x -= config.speed * deltaTime;
        
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - apple.x, eagleCenterY - apple.y);
        
        if (dist < apple.size + 15) {
            points += 20;
            playAppleSound();
            // NEW: Create floating point
            floatingPoints.push({ x: apple.x, y: apple.y, value: '+20', life: 60, vy: 1.5, alpha: 1 });
            apples.splice(i, 1);
        }
        
        if (apple.x < -50) apples.splice(i, 1);
    });
    
    // NEW: Update grapes
    grapes.forEach((grape, i) => {
        grape.x -= config.speed * deltaTime;
        
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - grape.x, eagleCenterY - grape.y);
        
        if (dist < grape.size + 15) {
            points += 25;
            playCherrySound(); // Reuse sound
            floatingPoints.push({ x: grape.x, y: grape.y, value: '+25', life: 60, vy: 1.5, alpha: 1 });
            grapes.splice(i, 1);
        }
        
        if (grape.x < -50) grapes.splice(i, 1);
    });
    
    // NEW: Update oranges
    oranges.forEach((orange, i) => {
        orange.x -= config.speed * deltaTime;
        
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - orange.x, eagleCenterY - orange.y);
        
        if (dist < orange.size + 15) {
            points += 30;
            playAppleSound(); // Reuse sound
            floatingPoints.push({ x: orange.x, y: orange.y, value: '+30', life: 60, vy: 1.5, alpha: 1 });
            oranges.splice(i, 1);
        }
        
        if (orange.x < -50) oranges.splice(i, 1);
    });
    
    // NEW: Update strawberries
    strawberries.forEach((strawberry, i) => {
        strawberry.x -= config.speed * deltaTime;
        
        let eagleCenterX = eagle.x + eagle.w/2;
        let eagleCenterY = eagle.y + eagle.h/2;
        let dist = Math.hypot(eagleCenterX - strawberry.x, eagleCenterY - strawberry.y);
        
        if (dist < strawberry.size + 15) {
            points += 35;
            playBananaSound(); // Reuse sound
            floatingPoints.push({ x: strawberry.x, y: strawberry.y, value: '+35', life: 60, vy: 1.5, alpha: 1 });
            strawberries.splice(i, 1);
        }
        
        if (strawberry.x < -50) strawberries.splice(i, 1);
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
        sword.x -= config.speed * deltaTime;
        sword.rotation += sword.rotationSpeed * deltaTime;
        
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
        d.x -= config.speed * deltaTime;
        d.wingFlap += 0.15 * deltaTime;
        
        if (!d.isFiring && Math.random() < config.fireFreq * deltaTime) { 
            d.isFiring = true; 
            d.fireTimer = 45; 
        }
        if (d.isFiring) d.fireTimer -= deltaTime; 
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
        fairy.x -= config.speed * deltaTime;
        fairy.wingFlap += fairy.wingSpeed * deltaTime;
        fairy.shootTimer -= deltaTime;
        
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
                   eagle.y < fairy.y + fairy.h && eagle.y + fairy.h > fairy.y) {
            gameOver();
        }
        
        if (fairy.x < -100) toothFairies.splice(i, 1);
    });
    
    teeth.forEach((tooth, i) => {
        tooth.x += tooth.vx * deltaTime;
        tooth.y += tooth.vy * deltaTime;
        tooth.spin += tooth.spinSpeed * deltaTime;
        
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
    
    planets.forEach(p => p.angle += p.speed * deltaTime);
    snow.forEach(p => { 
        p.y += p.v * deltaTime; 
        if (p.y > canvas.height) p.y = -10; 
    });
    
    scoreElement.innerText = `Level: ${currentLevel}\nDistance: ${Math.floor(distance)}m\nPoints: ${points}`;
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
        ctx.fillStyle = "#66ff00";
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "#3a8f11";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        
        ctx.fillStyle = "#000000";
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
            ctx.fillStyle = "#ff00ff";
            ctx.fillRect(chimney.x, 0, chimney.width, topHeight);
            
            // Brick pattern
            ctx.strokeStyle = "#cc00cc";
            ctx.lineWidth = 2;
            for(let y = 0; y < topHeight; y += 15) {
                for(let x = 0; x < chimney.width; x += 25) {
                    ctx.strokeRect(chimney.x + x, y, 25, 15);
                }
            }
            
            // Chimney cap
            ctx.fillStyle = "#cc00cc";
            ctx.fillRect(chimney.x - 5, topHeight - 10, chimney.width + 10, 10);
        }
        
        // Bottom chimney
        if (bottomHeight > 0) {
            ctx.fillStyle = "#ff00ff";
            ctx.fillRect(chimney.x, bottomY, chimney.width, bottomHeight);
            
            // Brick pattern
            ctx.strokeStyle = "#cc00cc";
            ctx.lineWidth = 2;
            for(let y = bottomY; y < canvas.height; y += 15) {
                for(let x = 0; x < chimney.width; x += 25) {
                    ctx.strokeRect(chimney.x + x, y, 25, 15);
                }
            }
            
            // Chimney cap
            ctx.fillStyle = "#cc00cc";
            ctx.fillRect(chimney.x - 5, bottomY, chimney.width + 10, 10);
        }
    });
    
    // CHANGE 2: Draw fruits with golden framework
    const drawFruitWithGlow = (emoji, x, y, size) => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFD700"; // Golden glow
        ctx.font = `${size}px serif`;
        ctx.fillText(emoji, x - size/2, y + size/2);
        ctx.restore();
    };
    
    cherries.forEach(cherry => drawFruitWithGlow("🍒", cherry.x, cherry.y, cherry.size));
    bananas.forEach(banana => drawFruitWithGlow("🍌", banana.x, banana.y, banana.size));
    apples.forEach(apple => drawFruitWithGlow("🍎", apple.x, apple.y, apple.size));
    grapes.forEach(grape => drawFruitWithGlow("🍇", grape.x, grape.y, grape.size));
    oranges.forEach(orange => drawFruitWithGlow("🍊", orange.x, orange.y, orange.size));
    strawberries.forEach(strawberry => drawFruitWithGlow("🍓", strawberry.x, strawberry.y, strawberry.size));
    
    // NEW: Draw floating points (Mario-style)
    floatingPoints.forEach(fp => {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = `rgba(255, 215, 0, ${fp.alpha})`; // Golden color with fade
        ctx.strokeStyle = `rgba(0, 0, 0, ${fp.alpha})`;
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        
        // Shadow for extra pop
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(255, 215, 0, ${fp.alpha * 0.5})`;
        
        ctx.strokeText(fp.value, fp.x, fp.y);
        ctx.fillText(fp.value, fp.x, fp.y);
        ctx.restore();
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
    ctx.rotate(eagle.rotation); // Apply rotation based on velocity
    ctx.scale(0.75, 0.75); // Make bird smaller
    
    // Golden framework glow
    ctx.shadowBlur = 35;
    ctx.shadowColor = "#FFD700";
    
    if(eagle.isAttacking) { 
        ctx.shadowBlur = 45; 
        ctx.shadowColor = "#FF4500"; // Orange-red glow when throwing fire
    }
        
    // Draw fancy red bird - horizontal orientation, optimized for pipeline game
    ctx.filter = 'brightness(1.1) contrast(1.2)'; // Vibrant red bird

    // Body (streamlined horizontal oval - compact for pipelines) - 30% increase
    ctx.beginPath();
    ctx.ellipse(0, 0, 18.2, 10.4, 0, 0, Math.PI * 2); // 14*1.3=18.2, 8*1.3=10.4
    ctx.fillStyle = '#DC143C'; // Crimson red
    ctx.fill();
    ctx.strokeStyle = '#8B0000'; // Dark red outline
    ctx.lineWidth = 1.95; // 1.5*1.3
    ctx.stroke();

    // Head (proportional circle at front) - 30% increase
    ctx.beginPath();
    ctx.arc(15.6, 0, 10.4, 0, Math.PI * 2); // 12*1.3=15.6, 8*1.3=10.4
    ctx.fillStyle = '#DC143C'; // Same red
    ctx.fill();
    ctx.strokeStyle = '#8B0000';
    ctx.stroke();

    // Beak (pointing right - golden/orange) - 30% increase
    ctx.beginPath();
    ctx.moveTo(23.4, 0); // 18*1.3
    ctx.lineTo(31.2, -3.25); // 24*1.3, -2.5*1.3
    ctx.lineTo(31.2, 3.25);
    ctx.closePath();
    ctx.fillStyle = '#FF8C00'; // Orange beak
    ctx.fill();
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1.3; // 1*1.3
    ctx.stroke();

    // Eye - big and white with black pupil - 30% increase
    ctx.beginPath();
    ctx.arc(18.2, -1.95, 5.85, 0, Math.PI * 2); // 14*1.3, -1.5*1.3, 4.5*1.3
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.65; // 0.5*1.3
    ctx.stroke();

    // Pupil - 30% increase
    ctx.beginPath();
    ctx.arc(18.2, -1.95, 2.6, 0, Math.PI * 2); // 14*1.3, -1.5*1.3, 2*1.3
    ctx.fillStyle = '#000';
    ctx.fill();

    // Tail feathers (sleek, flowing back) - 30% increase
    ctx.beginPath();
    ctx.moveTo(-18.2, 0); // -14*1.3
    ctx.lineTo(-26, -6.5); // -20*1.3, -5*1.3
    ctx.lineTo(-23.4, 0); // -18*1.3
    ctx.lineTo(-26, 6.5); // -20*1.3, 5*1.3
    ctx.closePath();
    ctx.fillStyle = '#B22222'; // Darker red for tail
    ctx.fill();
    ctx.strokeStyle = '#8B0000';
    ctx.stroke();

    // Small wing accent (single top wing for detail) - 30% increase
    ctx.beginPath();
    ctx.ellipse(0, -7.8, 6.5, 3.9, -0.2, 0, Math.PI * 2); // 0, -6*1.3, 5*1.3, 3*1.3
    ctx.fillStyle = '#B22222'; // Darker red
    ctx.fill();
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1.04; // 0.8*1.3
    ctx.stroke();

    ctx.restore();
    
    if (!gameStarted) {
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = 'TAP TO START';
        const x = canvas.width / 2;
        const y = canvas.height / 2 + 80;
        
        // Pulsing effect
        const scale = 1 + Math.sin(frameCount * 0.1) * 0.1;
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
        
        ctx.restore();
    }
    
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
    
    const currentTime = performance.now();
    const rawDelta = (currentTime - lastFrameTime) / 16.67; // Normalize to 60fps
    deltaTime = Math.min(rawDelta, 2); // Cap at 2x to prevent huge jumps
    lastFrameTime = currentTime;
    
    update(); 
    draw(); 
    requestAnimationFrame(animate); 
}

function gameOver() {
    gameActive = false;
    gameStarted = false;
    stopBackgroundMusic();
    playGameOverSound();
    scoreElement.style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score-display').innerText = `Distance: ${Math.floor(distance)}m | Level: ${currentLevel} | Points: ${points}`;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}