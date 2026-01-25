const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');

let gameActive = false;
let score = 0;
let lastTap = 0;
let frameCount = 0;
let dragons = [], snow = [], castles = [], birds = [];

const eagle = {
    x: 80, y: 0, w: 50, h: 40,
    gravity: 0.38, lift: -7.8, velocity: 0,
    isAttacking: false, attackTimer: 0
};

const levels = {
    easy: { spawnRate: 110, dragonSpeed: 3, fireFreq: 0.015 },
    medium: { spawnRate: 80, dragonSpeed: 5.5, fireFreq: 0.035 },
    hard: { spawnRate: 55, dragonSpeed: 8.5, fireFreq: 0.07 }
};

function initWorld() {
    snow = []; castles = []; birds = [];
    // Snowflakes
    for(let i=0; i<70; i++) snow.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*3+1, v: Math.random()*1.5+0.5});
    // Parallax Castles & Guards
    castles.push({ icon: "🏰", x: 200, y: 0.85, s: 0.2, size: 160, knight: "💂" });
    castles.push({ icon: "🏯", x: 800, y: 0.88, s: 0.4, size: 120, knight: "🛡️" });
    // Ambient Birds
    for(let i=0; i<4; i++) birds.push({x: Math.random()*canvas.width, y: Math.random()*120+40, s: Math.random()*0.4+0.2, size: 25});
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
    if (now - lastTap < 250) { 
        eagle.isAttacking = true; eagle.attackTimer = 25;
    } else { eagle.velocity = eagle.lift; }
    lastTap = now;
};

canvas.addEventListener('mousedown', handleInput);
window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleInput(e); });
canvas.addEventListener('touchstart', handleInput, {passive: false});

function startGame(lvl) {
    difficulty = lvl;
    document.getElementById('menu').style.display = 'none';
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
        dragons.push({ x: canvas.width, y: Math.random()*(canvas.height-250)+50, w: 80, h: 70, isFiring: false, fireTimer: 0 });
    }

    dragons.forEach((d, i) => {
        d.x -= levels[difficulty].dragonSpeed;
        if (!d.isFiring && Math.random() < levels[difficulty].fireFreq) { d.isFiring = true; d.fireTimer = 55; }
        if (d.isFiring) d.fireTimer--; if (d.fireTimer <= 0) d.isFiring = false;

        let effectiveH = eagle.isAttacking ? eagle.h * 3.5 : eagle.h;
        let eagleTop = eagle.y - (effectiveH - eagle.h)/2;
        let eagleBottom = eagle.y + eagle.h + (effectiveH - eagle.h)/2;

        const hitBody = eagle.x < d.x + d.w && eagle.x + eagle.w > d.x && eagleTop < d.y + d.h && eagleBottom > d.y;
        const hitFlame = d.isFiring && eagle.x + eagle.w > d.x - 180 && eagle.x < d.x && eagleTop < d.y + d.h && eagleBottom > d.y;

        if (hitFlame) gameOver();
        else if (hitBody) {
            if (eagle.isAttacking) { 
                dragons.splice(i, 1); score += 250; 
                canvas.style.transform = "translate(5px, 5px)"; // Shake
                setTimeout(() => canvas.style.transform = "translate(0,0)", 50);
                if (navigator.vibrate) navigator.vibrate(60); 
            } else gameOver();
        }
        if (d.x + d.w < 0) { dragons.splice(i, 1); score += 10; }
    });

    birds.forEach(b => { b.x -= b.s; if (b.x < -50) b.x = canvas.width + 50; });
    castles.forEach(c => { c.x -= c.s; if (c.x + c.size < 0) c.x = canvas.width + 100; });
    snow.forEach(p => { p.y += p.v; if (p.y > canvas.height) p.y = -10; });
    scoreElement.innerText = `SCORE: ${score}`;
    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 1. Castles & Knights
    ctx.globalAlpha = 0.4;
    castles.forEach(c => {
        ctx.font = `${c.size}px serif`; ctx.fillText(c.icon, c.x, canvas.height * c.y);
        ctx.font = "35px serif"; ctx.fillText(c.knight, c.x + c.size/2.5, canvas.height * c.y + 25);
    });
    // 2. Ambient Birds
    ctx.globalAlpha = 0.3;
    birds.forEach(b => { ctx.font = `${b.size}px serif`; ctx.fillText("🕊️", b.x, b.y); });
    ctx.globalAlpha = 1.0;
    // 3. Snow
    ctx.fillStyle = "white";
    snow.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill(); });
    // 4. Eagle
    ctx.save();
    ctx.translate(eagle.x + eagle.w/2, eagle.y + eagle.h/2);
    ctx.scale(-1, eagle.isAttacking ? 3.5 : 1.0);
    if(eagle.isAttacking) { ctx.shadowBlur = 40; ctx.shadowColor = "gold"; }
    ctx.font = "50px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🦅", 0, 0);
    ctx.restore();
    // 5. Dragons & Fire
    dragons.forEach(d => {
        ctx.font = "75px serif"; ctx.fillText("🐉", d.x, d.y + d.h);
        if (d.isFiring) {
            ctx.save(); ctx.translate(d.x, d.y + d.h - 20);
            let flick = 4.5 + Math.sin(frameCount * 0.8) * 0.8;
            ctx.scale(flick, 1.4); ctx.font = "35px serif"; ctx.textAlign = "right";
            ctx.shadowBlur = 20; ctx.shadowColor = "red"; ctx.fillText("🔥", 0, 0); ctx.restore();
        }
    });
}

function animate() { if (!gameActive) return; update(); draw(); requestAnimationFrame(animate); }

function gameOver() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score').innerText = score;
}