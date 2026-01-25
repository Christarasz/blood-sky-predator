const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');

// Synthetic Audio Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playEagleScreech() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    // Frequency slide for a "screech" effect
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

let gameActive = false, score = 0, frameCount = 0;
let highScore = localStorage.getItem('predatorHighScore') || 0;
let lastTap = 0, dragons = [], snow = [], castles = [], birds = [], planets = [], spaceships = [];

const eagle = { x: 50, y: 0, w: 32, h: 26, gravity: 0.35, lift: -7.2, velocity: 0, isAttacking: false, attackTimer: 0 };
const levels = { easy: { spawnRate: 125, dragonSpeed: 2.5, fireFreq: 0.01 }, medium: { spawnRate: 95, dragonSpeed: 4.5, fireFreq: 0.025 }, hard: { spawnRate: 70, dragonSpeed: 7, fireFreq: 0.05 } };

function initWorld() {
    snow = []; castles = []; birds = []; planets = []; spaceships = [];
    for(let i=0; i<40; i++) snow.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2+1, v: Math.random()*1+0.5});
    ["🪐", "🌑", "☄️", "🔴"].forEach((icon, i) => {
        planets.push({ icon, centerX: Math.random()*canvas.width, centerY: Math.random()*(canvas.height*0.25), angle: Math.random()*Math.PI*2, radius: 40+(i*35), speed: 0.001+(i*0.0005), size: 20+(i*8) });
    });
    for(let i=0; i<2; i++) spaceships.push({ x: Math.random()*canvas.width, y: Math.random()*100+40, speed: 2+Math.random()*3, icon: i%2===0?"🚀":"🛸" });
    castles.push({ icon: "🏰", x: 150, y: 0.88, s: 0.18, size: 100, knight: "💂" }, { icon: "🏯", x: 700, y: 0.90, s: 0.3, size: 80, knight: "🛡️" });
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initWorld(); }
window.addEventListener('resize', resize);
resize();

const handleInput = (e) => {
    if (!gameActive) return;
    if (e.cancelable) e.preventDefault();
    const now = Date.now();
    if (now - lastTap < 220) { eagle.isAttacking = true; eagle.attackTimer = 20; }
    else { eagle.velocity = eagle.lift; }
    lastTap = now;
};

canvas.addEventListener('touchstart', handleInput, {passive: false});
canvas.addEventListener('mousedown', handleInput);

function startGame(lvl) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    difficulty = lvl;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    gameActive = true; score = 0; dragons = [];
    eagle.y = canvas.height / 2; eagle.velocity = 0;
    animate();
}

function update() {
    eagle.velocity += eagle.gravity;
    eagle.y += eagle.velocity;
    if (eagle.isAttacking) { eagle.attackTimer--; if (eagle.attackTimer <= 0) eagle.isAttacking = false; }
    if (eagle.y + eagle.h > canvas.height || eagle.y < 0) gameOver();

    if (frameCount % levels[difficulty].spawnRate === 0) {
        dragons.push({ x: canvas.width, y: Math.random()*(canvas.height-220)+60, w: 42, h: 38, isFiring: false, fireTimer: 0 });
    }

    dragons.forEach((d, i) => {
        d.x -= levels[difficulty].dragonSpeed;
        if (!d.isFiring && Math.random() < levels[difficulty].fireFreq) { d.isFiring = true; d.fireTimer = 45; }
        if (d.isFiring) d.fireTimer--; if (d.fireTimer <= 0) d.isFiring = false;

        let strikeScale = 2.5;
        let effH = eagle.isAttacking ? eagle.h * strikeScale : eagle.h;
        let eT = eagle.y - (effH - eagle.h)/2;
        let eB = eagle.y + eagle.h + (effH - eagle.h)/2;

        if (eagle.x < d.x + d.w && eagle.x + eagle.w > d.x && eT < d.y + d.h && eB > d.y) {
            if (eagle.isAttacking) { 
                dragons.splice(i, 1); score += 250;
                playEagleScreech(); // Play synthetic sound
                if (navigator.vibrate) navigator.vibrate(80);
                canvas.style.transform = "translate(5px, 5px)";
                setTimeout(() => canvas.style.transform = "translate(0,0)", 50);
            } else gameOver();
        } else if (d.isFiring && eagle.x + eagle.w > d.x - 90 && eagle.x < d.x && eT < d.y + d.h && eB > d.y) {
            gameOver();
        }
        if (d.x + d.w < 0) { dragons.splice(i, 1); score += 10; }
    });

    planets.forEach(p => p.angle += p.speed);
    spaceships.forEach(s => { s.x -= s.speed; if (s.x < -80) s.x = canvas.width + 80; });
    castles.forEach(c => { c.x -= c.s; if (c.x + c.size < 0) c.x = canvas.width + 100; });
    snow.forEach(p => { p.y += p.v; if (p.y > canvas.height) p.y = -10; });
    scoreElement.innerText = `SCORE: ${score}`;
    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.4;
    planets.forEach(p => {
        let x = p.centerX + Math.cos(p.angle) * p.radius;
        let y = p.centerY + Math.sin(p.angle) * p.radius;
        ctx.font = `${p.size}px serif`; ctx.fillText(p.icon, x, y);
    });
    ctx.globalAlpha = 0.5;
    spaceships.forEach(s => { ctx.font = "20px serif"; ctx.fillText(s.icon, s.x, s.y); });
    ctx.globalAlpha = 0.4;
    castles.forEach(c => {
        ctx.font = `${c.size}px serif`; ctx.fillText(c.icon, c.x, canvas.height * c.y);
        ctx.font = "22px serif"; ctx.fillText(c.knight, c.x + c.size/3, canvas.height * c.y + 15);
    });
    ctx.globalAlpha = 1.0; ctx.fillStyle = "white";
    snow.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill(); });
    ctx.save(); ctx.translate(eagle.x + eagle.w/2, eagle.y + eagle.h/2);
    ctx.scale(-1, eagle.isAttacking ? 2.5 : 1.0);
    if(eagle.isAttacking) { ctx.shadowBlur = 15; ctx.shadowColor = "gold"; }
    ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🦅", 0, 0); ctx.restore();
    dragons.forEach(d => {
        ctx.font = "42px serif"; ctx.fillText("🐉", d.x, d.y + d.h);
        if (d.isFiring) {
            ctx.save(); ctx.translate(d.x, d.y + d.h - 12);
            let flick = 2.2 + Math.sin(frameCount * 0.8) * 0.4;
            ctx.scale(flick, 1.2); ctx.font = "18px serif"; ctx.textAlign = "right";
            ctx.shadowBlur = 10; ctx.shadowColor = "red"; ctx.fillText("🔥", 0, 0); ctx.restore();
        }
    });
}

function animate() { if (!gameActive) return; update(); draw(); requestAnimationFrame(animate); }

function gameOver() {
    gameActive = false;
    if (score > highScore) { highScore = score; localStorage.setItem('predatorHighScore', highScore); }
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score-display').innerText = `SCORE: ${score} (BEST: ${highScore})`;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}