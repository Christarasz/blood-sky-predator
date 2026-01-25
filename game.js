const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');
const powerContainer = document.getElementById('power-timer-container');
const powerBar = document.getElementById('power-timer-bar');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playScreech(isSuper = false) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = isSuper ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(isSuper ? 1200 : 850, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.4);
}

let gameActive = false, score = 0, frameCount = 0, superTimer = 0;
let thunderAlpha = 0, thunderX = 0;
let lastTap = 0, dragons = [], sith = [], spikes = [], snow = [], castles = [], planets = [];

const eagle = { x: 50, y: 0, w: 32, h: 26, gravity: 0.35, lift: -7.2, velocity: 0, isAttacking: false, attackTimer: 0 };
const levels = { easy: { rate: 120, speed: 2.5 }, medium: { rate: 85, speed: 4.5 }, hard: { rate: 60, speed: 7 } };

function initWorld() {
    snow = []; castles = []; planets = [];
    for(let i=0; i<40; i++) snow.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2+1, v: Math.random()*1+0.5});
    ["🌑", "🪐", "🔴"].forEach((icon, i) => {
        planets.push({ icon, centerX: Math.random()*canvas.width, centerY: Math.random()*(canvas.height*0.15), angle: Math.random()*Math.PI*2, radius: 40+(i*40), speed: 0.001, size: 25 });
    });
    castles.push({ icon: "🏰", x: 100, y: 0.88, s: 0.2, size: 100 });
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
    gameActive = true; score = 0; superTimer = 0;
    dragons = []; sith = []; spikes = [];
    eagle.y = canvas.height / 2; eagle.velocity = 0;
    animate();
}

function update() {
    eagle.velocity += eagle.gravity;
    eagle.y += eagle.velocity;
    if (eagle.isAttacking) { eagle.attackTimer--; if (eagle.attackTimer <= 0) eagle.isAttacking = false; }
    if (eagle.y + eagle.h > canvas.height || eagle.y < 0) gameOver();

    // Thunder Logic
    if (Math.random() < 0.01 && thunderAlpha <= 0) { 
        thunderAlpha = 1.0; thunderX = Math.random() * canvas.width; 
    }
    if (thunderAlpha > 0) thunderAlpha -= 0.05;

    if (superTimer > 0) {
        superTimer--;
        powerContainer.style.display = 'block';
        powerBar.style.width = (superTimer / 600) * 100 + "%";
    } else { powerContainer.style.display = 'none'; }

    if (frameCount % levels[difficulty].rate === 0) {
        let r = Math.random();
        if (r < 0.4) dragons.push({ x: canvas.width, y: Math.random()*(canvas.height-200)+50, w: 42, h: 38, f: false, ft: 0 });
        else if (r < 0.75) sith.push({ x: canvas.width, y: Math.random()*(canvas.height-200)+50, w: 40, h: 40, rot: 0 });
        else spikes.push({ x: canvas.width, y: Math.random()*(canvas.height-100)+50, w: 30, h: 30 });
    }

    // Collision Logic (Dragons, Sith, Spikes)
    dragons.forEach((d, i) => {
        d.x -= levels[difficulty].speed;
        if (eagle.x < d.x+d.w && eagle.x+eagle.w > d.x && eagle.y < d.y+d.h && eagle.y+eagle.h > d.y) {
            if (eagle.isAttacking || superTimer > 0) { dragons.splice(i,1); score += 200; playScreech(true); superTimer = 600; } 
            else gameOver();
        }
    });

    sith.forEach((s, i) => {
        s.x -= levels[difficulty].speed; s.rot += 0.18;
        let swX = s.x - Math.cos(s.rot)*45, swY = s.y+20+Math.sin(s.rot)*45;
        if (Math.hypot(eagle.x - swX, eagle.y - swY) < 25 && superTimer <= 0) gameOver();
        if (eagle.x < s.x+s.w && eagle.x+eagle.w > s.x && eagle.y < s.y+s.h && eagle.y+eagle.h > s.y) {
            if (eagle.isAttacking || superTimer > 0) { sith.splice(i,1); score += 500; playScreech(); } else gameOver();
        }
    });

    spikes.forEach((p, i) => {
        p.x -= levels[difficulty].speed;
        if (eagle.x < p.x+p.w && eagle.x+eagle.w > p.x && eagle.y < p.y+p.h && eagle.y+eagle.h > p.y) {
            if (superTimer > 0) { spikes.splice(i,1); score += 50; } else gameOver();
        }
    });

    planets.forEach(p => p.angle += p.speed);
    snow.forEach(p => { p.y += p.v; if (p.y > canvas.height) p.y = -10; });
    scoreElement.innerText = `SCORE: ${score}`;
    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Thunder Bolt
    if (thunderAlpha > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${thunderAlpha})`;
        ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(thunderX, 0); ctx.lineTo(thunderX - 20, 100); ctx.lineTo(thunderX + 10, 200); ctx.lineTo(thunderX - 5, 400);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${thunderAlpha * 0.3})`;
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }

    ctx.globalAlpha = 0.5;
    planets.forEach(p => {
        let x = p.centerX + Math.cos(p.angle) * p.radius, y = p.centerY + Math.sin(p.angle) * p.radius;
        ctx.font = "25px serif"; ctx.fillText(p.icon, x, y);
    });
    castles.forEach(c => { ctx.font = "100px serif"; ctx.fillText(c.icon, c.x, canvas.height * 0.9); });
    ctx.globalAlpha = 1.0;
    snow.forEach(p => { ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill(); });
    
    ctx.save(); ctx.translate(eagle.x + eagle.w/2, eagle.y + eagle.h/2);
    ctx.scale(-1, eagle.isAttacking ? 2.5 : 1);
    if (superTimer > 0) { ctx.shadowBlur = 20; ctx.shadowColor = "gold"; ctx.filter = "brightness(1.5) sepia(1)"; }
    ctx.font = "30px serif"; ctx.fillText("🦅", -15, 10); ctx.restore(); ctx.filter = "none";

    dragons.forEach(d => { ctx.font = "40px serif"; ctx.fillText("🐉", d.x, d.y + 35); });
    sith.forEach(s => {
        ctx.font = "40px serif"; ctx.fillText("👤", s.x, s.y + 35);
        ctx.strokeStyle = "red"; ctx.lineWidth = 4; ctx.beginPath();
        ctx.moveTo(s.x + 20, s.y + 20); ctx.lineTo(s.x + 20 - Math.cos(s.rot) * 55, s.y + 20 + Math.sin(s.rot) * 55); ctx.stroke();
    });
    spikes.forEach(p => { ctx.font = "30px serif"; ctx.fillText("📍", p.x, p.y + 25); });
}

function animate() { if (!gameActive) return; update(); draw(); requestAnimationFrame(animate); }

function gameOver() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score-display').innerText = `SCORE: ${score}`;
}