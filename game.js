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
    
    // Mario Bros style adventurous melody
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

let gameActive = false, frameCount = 0, distance = 0, time = 0;
let lastTap = 0, isHoldingTap = false;
let currentLevel = 1;
let phaseTimer = 0, currentPhase = 'pipes';

let dragons = [], toothFairies = [], teeth = [];
let spaceshipObstacles = [];
let buildings = [], snow = [], planets = [], thunders = [];

const eagle = { 
    x: 100, y: 0, w: 24, h: 20,
    gravity: 0.3, lift: -6, velocity: 0, 
    isAttacking: false, attackTimer: 0 
};

const levelDistances = [
    0, 1050, 2100, 3150, 4200, 5250, 6300, 7350, 8400, 9450,
    10500, 11550, 12600, 13650, 14700, 15750, 16800, 17850, 18900, 19950
];

const levels = { 
    easy: { obstacleSpawnRate: 110, enemySpawnRate: 180, speed: 2.5, fireFreq: 0.005 }, 
    medium: { obstacleSpawnRate: 95, enemySpawnRate: 160, speed: 3.5, fireFreq: 0.01 }, 
    hard: { obstacleSpawnRate: 80, enemySpawnRate: 140, speed: 4.5, fireFreq: 0.018 } 
};

let difficulty = 'medium';

function initWorld() {
    snow = []; buildings = []; planets = [];
    
    for(let i = 0; i < 150; i++) {
        snow.push({
            x: Math.random() * canvas.width, 
            y: Math.random() * canvas.height, 
            s: Math.random() * 2.5 + 0.8, 
            v: Math.random() * 1.2 + 0.4
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
    
    ["🪐", "🌑", "☄️", "🔴"].forEach((icon, i) => {
        planets.push({ 
            icon, 
            centerX: Math.random() * canvas.width, 
            centerY: Math.random() * (canvas.height * 0.25), 
            angle: Math.random() * Math.PI * 2, 
            radius: 40 + (i * 35), 
            speed: 0.001 + (i * 0.0005), 
            size: 20 + (i * 8) 
        });
    });
}

function getMaxUnlockedLevel() {
    const saved = localStorage.getItem('maxUnlockedLevel');
    if (!saved || saved === null || saved === 'null') {
        localStorage.setItem('maxUnlockedLevel', '1');
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
        eagle.isAttacking = true; 
        eagle.attackTimer = 20; 
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
    
    dragons = []; toothFairies = []; teeth = [];
    spaceshipObstacles = []; thunders = [];
    
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
    
    if (eagle.isAttacking) { 
        eagle.attackTimer--; 
        if (eagle.attackTimer <= 0) eagle.isAttacking = false; 
    }
    
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
    
    if (currentPhase === 'pipes' && frameCount % config.obstacleSpawnRate === 0) {
        const gapSize = 220;
        const gapStart = 100 + Math.random() * (canvas.height - gapSize - 200);
        
        const topShips = [];
        const numTopShips = Math.floor(gapStart / 45);
        for(let i = 0; i < numTopShips; i++) {
            topShips.push({ y: i * 45, size: 38 });
        }
        
        const bottomShips = [];
        const numBottomShips = Math.floor((canvas.height - gapStart - gapSize) / 45);
        for(let i = 0; i < numBottomShips; i++) {
            bottomShips.push({ y: gapStart + gapSize + (i * 45), size: 38 });
        }
        
        spaceshipObstacles.push({
            x: canvas.width,
            topShips: topShips,
            bottomShips: bottomShips
        });
    }
    
    spaceshipObstacles.forEach((obstacle, i) => {
        obstacle.x -= config.speed;
        
        obstacle.topShips.forEach(ship => {
            if (eagle.x + eagle.w > obstacle.x - 15 && eagle.x < obstacle.x + 35 &&
                eagle.y < ship.y + ship.size) {
                gameOver();
            }
        });
        
        obstacle.bottomShips.forEach(ship => {
            if (eagle.x + eagle.w > obstacle.x - 15 && eagle.x < obstacle.x + 35 &&
                eagle.y + eagle.h > ship.y) {
                gameOver();
            }
        });
        
        if (obstacle.x < -100) spaceshipObstacles.splice(i, 1);
    });
    
    // ONLY dragons and tooth fairies, MAX 2 enemies vertically at a time
    if (currentPhase === 'enemies' && frameCount % config.enemySpawnRate === 0) {
        // Check current enemies on screen vertically
        const allEnemies = [...dragons, ...toothFairies];
        
        // Only spawn if we have less than 2 enemies currently
        if (allEnemies.length < 2) {
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
    
    dragons.forEach((d, i) => {
        d.x -= config.speed;
        d.wingFlap += 0.15;
        
        if (!d.isFiring && Math.random() < config.fireFreq) { 
            d.isFiring = true; 
            d.fireTimer = 45; 
        }
        if (d.isFiring) d.fireTimer--; 
        if (d.fireTimer <= 0) d.isFiring = false;

        let strikeScale = 2.5;
        let effH = eagle.isAttacking ? eagle.h * strikeScale : eagle.h;
        let eT = eagle.y - (effH - eagle.h) / 2;
        let eB = eagle.y + eagle.h + (effH - eagle.h) / 2;

        if (eagle.x < d.x + d.w && eagle.x + eagle.w > d.x && eT < d.y + d.h && eB > d.y) {
            if (eagle.isAttacking) { 
                dragons.splice(i, 1); 
                playEagleScreech();
                if (navigator.vibrate) navigator.vibrate(80);
            } else gameOver();
        } else if (d.isFiring && eagle.x + eagle.w > d.x - 90 && eagle.x < d.x && eT < d.y + d.h && eB > d.y) {
            gameOver();
        }
        
        if (d.x + d.w < 0) dragons.splice(i, 1);
    });
    
    toothFairies.forEach((fairy, i) => {
        fairy.x -= config.speed;
        fairy.wingFlap += fairy.wingSpeed;
        fairy.shootTimer--;
        
        if (fairy.shootTimer <= 0 && fairy.x < canvas.width - 100) {
            for(let t = 0; t < 5; t++) {
                teeth.push({
                    x: fairy.x,
                    y: fairy.y + 20 + (t - 2) * 15,
                    vx: -6,
                    vy: 0,
                    spin: 0,
                    spinSpeed: 0.2
                });
            }
            fairy.shootTimer = 70;
        }
        
        if (eagle.x < fairy.x + fairy.w && eagle.x + fairy.w > fairy.x && 
            eagle.y < fairy.y + fairy.h && eagle.y + eagle.h > fairy.y) {
            if (eagle.isAttacking) {
                toothFairies.splice(i, 1);
                playEagleScreech();
            } else {
                gameOver();
            }
        }
        
        if (fairy.x < -100) toothFairies.splice(i, 1);
    });
    
    teeth.forEach((tooth, i) => {
        tooth.x += tooth.vx;
        tooth.y += tooth.vy;
        tooth.spin += tooth.spinSpeed;
        
        const dist = Math.hypot(eagle.x + eagle.w/2 - tooth.x, eagle.y + eagle.h/2 - tooth.y);
        if (dist < 20) gameOver();
        
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
    
    ctx.globalAlpha = 0.4;
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
    
    spaceshipObstacles.forEach(obstacle => {
        obstacle.topShips.forEach(ship => {
            ctx.font = ship.size + "px serif";
            ctx.fillText("🚀", obstacle.x, ship.y + ship.size);
        });
        
        obstacle.bottomShips.forEach(ship => {
            ctx.font = ship.size + "px serif";
            ctx.fillText("🚀", obstacle.x, ship.y + ship.size);
        });
    });
    
    ctx.fillStyle = "white";
    snow.forEach(p => { 
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); 
        ctx.fill(); 
    });
    
    ctx.save(); 
    ctx.translate(eagle.x + eagle.w / 2, eagle.y + eagle.h / 2);
    ctx.scale(-1, eagle.isAttacking ? 2.5 : 1.0);
    if(eagle.isAttacking) { 
        ctx.shadowBlur = 15; 
        ctx.shadowColor = "gold"; 
    }
    ctx.font = "24px serif"; 
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle";
    ctx.fillText("🦅", 0, 0); 
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
    stopBackgroundMusic();  // STOP MUSIC ON GAME OVER
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score-display').innerText = `DISTANCE: ${Math.floor(distance)}m | TIME: ${time}s | LEVEL: ${currentLevel}`;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}