const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');

// Synthetic Audio Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

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

let gameActive = false, frameCount = 0, distance = 0, time = 0;
let lastTap = 0;

// Game entities
let dragons = [];
let swords = [];
let toothFairies = [];
let teeth = [];
let aliens = [];
let lasers = [];
let spaceshipObstacles = []; 
let buildings = [];
let snow = [];
let planets = [];
let thunders = [];

const eagle = { 
    x: 100, 
    y: 0, 
    w: 32, 
    h: 26, 
    gravity: 0.35, 
    lift: -7.2, 
    velocity: 0, 
    isAttacking: false, 
    attackTimer: 0 
};

const levels = { 
    easy: { obstacleSpawnRate: 150, enemySpawnRate: 130, speed: 2.5, fireFreq: 0.008 }, 
    medium: { obstacleSpawnRate: 120, enemySpawnRate: 100, speed: 3.5, fireFreq: 0.015 }, 
    hard: { obstacleSpawnRate: 100, enemySpawnRate: 80, speed: 4.5, fireFreq: 0.025 } 
};

let difficulty = 'medium';

function initWorld() {
    snow = []; buildings = []; planets = []; spaceshipObstacles = [];
    dragons = []; swords = []; toothFairies = []; teeth = [];
    aliens = []; lasers = []; thunders = [];
    
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
        buildings.push({ x: i * 60, y: canvas.height - height - 50, width: 55, height: height });
    }
    
    ["🪐", "🌑", "☄️", "🔴"].forEach((icon, i) => {
        planets.push({ 
            icon, centerX: Math.random() * canvas.width, centerY: Math.random() * (canvas.height * 0.25), 
            angle: Math.random() * Math.PI * 2, radius: 40 + (i * 35), speed: 0.001 + (i * 0.0005), size: 20 + (i * 8) 
        });
    });
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
    if (now - lastTap < 220) { 
        eagle.isAttacking = true; 
        eagle.attackTimer = 20; 
    } else { 
        eagle.velocity = eagle.lift; 
    }
    lastTap = now;
};

canvas.addEventListener('touchstart', handleInput, {passive: false});
canvas.addEventListener('mousedown', handleInput);

function startGame(lvl) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    difficulty = lvl;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    gameActive = true; distance = 0; time = 0; frameCount = 0;
    eagle.y = canvas.height / 2; eagle.velocity = 0;
    animate();
}

function update() {
    const config = levels[difficulty];
    eagle.velocity += eagle.gravity;
    eagle.y += eagle.velocity;
    
    if (eagle.isAttacking) { 
        eagle.attackTimer--; 
        if (eagle.attackTimer <= 0) eagle.isAttacking = false; 
    }
    
    if (eagle.y + eagle.h > canvas.height || eagle.y < 0) gameOver();
    distance += config.speed * 0.1;
    if (frameCount % 60 === 0) time++; 
    
    if (Math.random() < 0.005) thunders.push({ x: Math.random() * canvas.width, life: 15, alpha: 1 });
    thunders.forEach((t, i) => { t.life--; t.alpha = t.life / 15; if (t.life <= 0) thunders.splice(i, 1); });
    
    // SPAWN SHORTER PIPES (STACKED SPACESHIPS)
    if (frameCount % config.obstacleSpawnRate === 0) {
        // Increased gapSize makes the "pipes" shorter and easier to fly through
        const gapSize = 320; 
        const buffer = 100;
        const gapStart = buffer + Math.random() * (canvas.height - gapSize - buffer * 2);
        
        const topShips = [];
        const numTopShips = Math.floor(gapStart / 45);
        for(let i = 0; i < numTopShips; i++) topShips.push({ y: i * 45, size: 40 });
        
        const bottomShips = [];
        const numBottomShips = Math.floor((canvas.height - (gapStart + gapSize)) / 45);
        for(let i = 0; i < numBottomShips; i++) {
            bottomShips.push({ y: (gapStart + gapSize) + (i * 45), size: 40 });
        }
        
        spaceshipObstacles.push({ x: canvas.width, topShips, bottomShips, gapStart, gapEnd: gapStart + gapSize, passed: false });
    }
    
    spaceshipObstacles.forEach((obstacle, i) => {
        obstacle.x -= config.speed;
        obstacle.topShips.forEach(ship => { if (eagle.x + eagle.w > obstacle.x - 20 && eagle.x < obstacle.x + 40 && eagle.y < ship.y + ship.size) gameOver(); });
        obstacle.bottomShips.forEach(ship => { if (eagle.x + eagle.w > obstacle.x - 20 && eagle.x < obstacle.x + 40 && eagle.y + eagle.h > ship.y) gameOver(); });
        if (obstacle.x < -100) spaceshipObstacles.splice(i, 1);
    });
    
    if (frameCount % config.enemySpawnRate === 0) {
        const enemyType = Math.random();
        const yPos = 80 + Math.random() * (canvas.height - 180);
        if (enemyType < 0.33) dragons.push({ x: canvas.width, y: yPos, w: 55, h: 50, isFiring: false, fireTimer: 0, wingFlap: 0, waveOffset: Math.random() * Math.PI * 2, waveSpeed: 0.04 });
        else if (enemyType < 0.66) swords.push({ x: canvas.width, y: yPos, w: 50, h: 50, rotation: 0, rotationSpeed: 0.2, bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.05 });
        else toothFairies.push({ x: canvas.width, y: yPos, w: 40, h: 40, shootTimer: 50, wingFlap: 0, wingSpeed: 0.25 });
    }
    
    if (frameCount % 180 === 0) aliens.push({ x: canvas.width, y: 60 + Math.random() * 100, w: 40, h: 40, shootTimer: 50 });
    
    dragons.forEach((d, i) => {
        d.x -= config.speed; d.wingFlap += 0.15; d.waveOffset += d.waveSpeed; d.y += Math.sin(d.waveOffset) * 1.5;
        if (!d.isFiring && Math.random() < config.fireFreq) { d.isFiring = true; d.fireTimer = 45; }
        if (d.isFiring) d.fireTimer--; if (d.fireTimer <= 0) d.isFiring = false;
        let strikeScale = 2.5;
        let effH = eagle.isAttacking ? eagle.h * strikeScale : eagle.h;
        let eT = eagle.y - (effH - eagle.h) / 2;
        let eB = eagle.y + eagle.h + (effH - eagle.h) / 2;
        if (eagle.x < d.x + d.w && eagle.x + eagle.w > d.x && eT < d.y + d.h && eB > d.y) {
            if (eagle.isAttacking) { dragons.splice(i, 1); playEagleScreech(); if (navigator.vibrate) navigator.vibrate(80); canvas.style.transform = "translate(5px, 5px)"; setTimeout(() => canvas.style.transform = "translate(0,0)", 50); }
            else gameOver();
        } else if (d.isFiring && eagle.x + eagle.w > d.x - 90 && eagle.x < d.x && eT < d.y + d.h && eB > d.y) gameOver();
        if (d.x + d.w < 0) dragons.splice(i, 1);
    });
    
    swords.forEach((s, i) => {
        s.x -= config.speed; s.rotation += s.rotationSpeed; s.bobOffset += s.bobSpeed; s.y += Math.sin(s.bobOffset) * 1.2;
        if (eagle.x < s.x + s.w && eagle.x + eagle.w > s.x && eagle.y < s.y + s.h && eagle.y + eagle.h > s.y) {
            if (eagle.isAttacking) { swords.splice(i, 1); playEagleScreech(); } else gameOver();
        }
        if (s.x < -100) swords.splice(i, 1);
    });
    
    toothFairies.forEach((fairy, i) => {
        fairy.x -= config.speed; fairy.wingFlap += fairy.wingSpeed; fairy.shootTimer--;
        if (fairy.shootTimer <= 0 && fairy.x < canvas.width - 100) {
            // FIRE SINGLE HORIZONTAL LINE
            for(let t = 0; t < 5; t++) {
                teeth.push({
                    x: fairy.x + (t * 28), // Spaced horizontally
                    y: fairy.y + 20,       // Same height
                    vx: -7, vy: 0, spin: 0, spinSpeed: 0.2
                });
            }
            fairy.shootTimer = 85;
        }
        if (eagle.x < fairy.x + fairy.w && eagle.x + eagle.w > fairy.x && eagle.y < fairy.y + fairy.h && eagle.y + eagle.h > fairy.y) {
            if (eagle.isAttacking) { toothFairies.splice(i, 1); playEagleScreech(); } else gameOver();
        }
        if (fairy.x < -100) toothFairies.splice(i, 1);
    });
    
    teeth.forEach((tooth, i) => {
        tooth.x += tooth.vx; tooth.y += tooth.vy; tooth.spin += tooth.spinSpeed;
        if (Math.hypot(eagle.x + eagle.w/2 - tooth.x, eagle.y + eagle.h/2 - tooth.y) < 20) gameOver();
        if (tooth.x < -200) teeth.splice(i, 1);
    });
    
    aliens.forEach((alien, i) => {
        alien.x -= config.speed * 0.8; alien.shootTimer--;
        if (alien.shootTimer <= 0 && alien.x < canvas.width - 100) {
            lasers.push({ x: alien.x, y: alien.y + 20, vx: -8, width: 40, height: 3 });
            alien.shootTimer = 60;
        }
        if (alien.x < -100) aliens.splice(i, 1);
    });
    
    lasers.forEach((laser, i) => {
        laser.x += laser.vx;
        if (eagle.x < laser.x + laser.width && eagle.x + eagle.w > laser.x && eagle.y < laser.y + laser.height && eagle.y + eagle.h > laser.y) gameOver();
        if (laser.x < -100) lasers.splice(i, 1);
    });
    
    planets.forEach(p => p.angle += p.speed);
    snow.forEach(p => { p.y += p.v; if (p.y > canvas.height) p.y = -10; });
    scoreElement.innerText = `DISTANCE: ${Math.floor(distance)}m | TIME: ${time}s`;
    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    thunders.forEach(t => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${t.alpha})`; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(t.x, 0); ctx.lineTo(t.x - 20, 100); ctx.lineTo(t.x + 10, 200); ctx.lineTo(t.x - 15, 350); ctx.stroke();
    });
    ctx.globalAlpha = 0.4;
    planets.forEach(p => {
        let x = p.centerX + Math.cos(p.angle) * p.radius;
        let y = p.centerY + Math.sin(p.angle) * p.radius;
        ctx.font = `${p.size}px serif`; ctx.fillText(p.icon, x, y);
    });
    ctx.globalAlpha = 0.5;
    buildings.forEach(b => {
        ctx.fillStyle = "#FFFFFF"; ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "#DDDDDD"; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.width, b.height);
        ctx.fillStyle = "#87CEEB";
        for(let row = 1; row < Math.floor(b.height / 20); row++) {
            for(let col = 0; col < 2; col++) ctx.fillRect(b.x + 10 + col * 25, b.y + row * 20, 12, 15);
        }
    });
    ctx.globalAlpha = 1.0;
    spaceshipObstacles.forEach(obstacle => {
        obstacle.topShips.forEach(ship => { ctx.font = ship.size + "px serif"; ctx.fillText("🚀", obstacle.x, ship.y + ship.size); });
        obstacle.bottomShips.forEach(ship => { ctx.font = ship.size + "px serif"; ctx.fillText("🚀", obstacle.x, ship.y + ship.size); });
    });
    ctx.fillStyle = "white";
    snow.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); });
    
    ctx.save(); 
    ctx.translate(eagle.x + eagle.w / 2, eagle.y + eagle.h / 2);
    ctx.scale(-1, eagle.isAttacking ? 2.5 : 1.0);
    if(eagle.isAttacking) { ctx.shadowBlur = 15; ctx.shadowColor = "gold"; }
    ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🦅", 0, 0); ctx.restore();
    
    dragons.forEach(d => {
        ctx.save(); ctx.translate(d.x + 27, d.y + 25);
        ctx.scale(1 + Math.sin(d.wingFlap) * 0.15, 1);
        ctx.font = "54px serif"; ctx.fillText("🐉", -27, 25); ctx.restore();
        if (d.isFiring) {
            ctx.save(); ctx.translate(d.x, d.y + d.h - 15);
            ctx.scale(2.2 + Math.sin(frameCount * 0.8) * 0.4, 1.2); 
            ctx.font = "24px serif"; ctx.textAlign = "right"; ctx.shadowBlur = 10; ctx.shadowColor = "red"; 
            ctx.fillText("🔥", 0, 0); ctx.restore();
        }
    });
    
    swords.forEach(s => {
        ctx.save(); ctx.translate(s.x + 25, s.y + 25); ctx.rotate(s.rotation);
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(255, 0, 0, 0.8)"; ctx.strokeStyle = "#FF0000"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(35, 0); ctx.stroke();
        ctx.fillStyle = "#FF0000"; ctx.beginPath(); ctx.arc(-35, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(35, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    
    toothFairies.forEach(fairy => {
        ctx.save(); ctx.translate(fairy.x + 20, fairy.y + 20);
        ctx.scale(1 + Math.sin(fairy.wingFlap) * 0.2, 1);
        ctx.font = "40px serif"; ctx.fillText("🧚", -20, 0); ctx.restore();
    });
    
    teeth.forEach(tooth => {
        ctx.save(); ctx.translate(tooth.x, tooth.y); ctx.rotate(tooth.spin);
        ctx.font = "18px serif"; ctx.fillText("🦷", -9, 9); ctx.restore();
    });
    
    aliens.forEach(alien => { ctx.font = "40px serif"; ctx.fillText("👽", alien.x, alien.y + 30); });
    lasers.forEach(laser => { ctx.fillStyle = "#FF0000"; ctx.shadowBlur = 8; ctx.shadowColor = "#FF0000"; ctx.fillRect(laser.x, laser.y, laser.width, laser.height); ctx.shadowBlur = 0; });
}

function animate() { if (!gameActive) return; update(); draw(); requestAnimationFrame(animate); }

function gameOver() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score-display').innerText = `DISTANCE: ${Math.floor(distance)}m | TIME: ${time}s`;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}