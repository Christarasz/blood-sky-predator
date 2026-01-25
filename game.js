const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');
const killSound = document.getElementById('eagleSound');

let gameActive = false, score = 0, frameCount = 0;
let highScore = localStorage.getItem('predatorHighScore') || 0;
let lastTap = 0, dragons = [], snow = [], castles = [], birds = [];
let planets = [], spaceships = [];

const eagle = {
    x: 50, y: 0, w: 35, h: 28,
    gravity: 0.35, lift: -7.2, velocity: 0,
    isAttacking: false, attackTimer: 0
};

const levels = {
    easy: { spawnRate: 120, dragonSpeed: 2.5, fireFreq: 0.01 },
    medium: { spawnRate: 90, dragonSpeed: 4.5, fireFreq: 0.025 },
    hard: { spawnRate: 65, dragonSpeed: 7, fireFreq: 0.05 }
};

function initWorld() {
    snow = []; castles = []; birds = []; planets = []; spaceships = [];
    
    // Background Elements
    for(let i=0; i<40; i++) snow.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2+1, v: Math.random()*1+0.5});
    
    // Orbiting Planets (Random start angles)
    const planetIcons = ["🪐", "🌍", "🌑", "🔴"];
    planetIcons.forEach((icon, i) => {
        planets.push({
            icon: icon,
            centerX: Math.random() * canvas.width,
            centerY: Math.random() * (canvas.height / 2),
            angle: Math.random() * Math.PI * 2,
            radius: 50 + (i * 40),
            speed: 0.002 + (i * 0.001),
            size: 30 + (i * 10)
        });
    });

    // Spaceships
    for(let i=0; i<3; i++) {
        spaceships.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150 + 50,
            speed: 2 + Math.random() * 3,
            icon: i % 2 === 0 ? "🚀" : "🛸"
        });
    }

    castles.push({ icon: "🏰", x: 100, y: 0.85, s: 0.15, size: 120, knight: "💂" });
    castles.push({ icon: "🏯", x: 600, y: 0.88, s: 0.3, size: 90, knight: "🛡️" });
}

function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initWorld();
}
window.addEventListener('resize', resize);
resize();

const handleInput = (e) => {
    if (!gameActive) return;
    if (e.cancelable) e.preventDefault();
    const now = Date.now();
    if (now - lastTap < 220) { 
        eagle.isAttacking = true; eagle.attackTimer = 20;
    } else { eagle.velocity = eagle.lift; }
    lastTap = now;
};

canvas.addEventListener('mousedown', handleInput);
window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleInput(e); });
canvas.addEventListener('touchstart', handleInput, {passive: false});

function startGame(lvl) {
    killSound.play().then(() => { killSound.pause(); killSound.currentTime = 0; }).catch(()=>{});
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
        dragons.push({ x: canvas.width, y: Math.random()*(canvas.height-200)+50, w: 50, h: 45, isFiring: false, fireTimer: 0 });
    }

    dragons.forEach((d, i) => {
        d.x -= levels[difficulty].dragonSpeed;
        if (!d.isFiring && Math.random() < levels[difficulty].fireFreq) { d.isFiring = true; d.fireTimer = 45; }
        if (d.isFiring) d.fireTimer--; if (d.fireTimer <= 0) d.isFiring = false;

        let effH = eagle.isAttacking ? eagle.h * 2.8 : eagle.h;
        let eT = eagle.y - (effH - eagle.h)/2;
        let eB = eagle.y + eagle.h + (effH - eagle.h)/2;

        const hitBody = eagle.x < d.x + d.w && eagle.x + eagle.w > d.x && eT < d.y + d.h && eB > d.y;
        const hitFlame = d.isFiring && eagle.x + eagle.w > d.x - 100 && eagle.x < d.x && eT < d.y + d.h && eB > d.y;

        if (hitFlame) gameOver();
        else if (hitBody) {
            if (eagle.isAttacking) { 
                dragons.splice(i, 1); score += 250;
                killSound.currentTime = 0; killSound.play().catch(()=>{});
                if (navigator.vibrate) navigator.vibrate(80);
                canvas.style.transform = "translate(5px, 5px)";
                setTimeout(() => canvas.style.transform = "translate(0,0)", 50);
            } else gameOver();
        }
        if (d.x + d.w < 0) { dragons.splice(i, 1); score += 10; }
    });

    // Animate Planets
    planets.forEach(p => { p.angle += p.speed; });

    // Animate Spaceships
    spaceships.forEach(s => {
        s.x -= s.speed;
        if (s.x < -100) s.x = canvas.width + 100;
    });

    castles.forEach(c => { c.x -= c.s; if (c.x + c.size < 0) c.x = canvas.width + 100; });
    snow.forEach(p => { p.y += p.v; if (p.y > canvas.height) p.y = -10; });
    scoreElement.innerText = `SCORE: ${score}`;
    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Planet Orbitals (Deep Background)
    ctx.globalAlpha = 0.5;
    planets.forEach(p => {
        let x = p.centerX + Math.cos(p.angle) * p.radius;
        let y = p.centerY + Math.sin(p.angle) * p.radius;
        ctx.font = `${p.size}px serif`;
        ctx.fillText(p.icon, x, y);
    });

    // 2. Spaceships (Distant)
    ctx.globalAlpha = 0.6;
    spaceships.forEach(s => {
        ctx.font = "25px serif";
        ctx.fillText(s.icon, s.x, s.y);
    });

    // 3. Castles
    ctx.globalAlpha = 0.4;
    castles.forEach(c => {
        ctx.font = `${c.size}px serif`; ctx.fillText(c.icon, c.x, canvas.height * c.y);
        ctx.font = "25px serif"; ctx.fillText(c.knight, c.x + c.size/3, canvas.height * c.y + 20);
    });

    // 4. Snow
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "white";
    snow.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill(); });

    // 5. Player Eagle
    ctx.save(); ctx.translate(eagle.x + eagle.w/2, eagle.y + eagle.h/2);
    ctx.scale(-1, eagle.isAttacking ? 2.8 : 1.0);
    if(eagle.isAttacking) { ctx.shadowBlur = 20; ctx.shadowColor = "gold"; }
    ctx.font = "35px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🦅", 0, 0); ctx.restore();

    // 6. Enemy Dragons
    dragons.forEach(d => {
        ctx.font = "50px serif"; ctx.fillText("🐉", d.x, d.y + d.h);
        if (d.isFiring) {
            ctx.save(); ctx.translate(d.x, d.y + d.h - 15);
            let flick = 2.5 + Math.sin(frameCount * 0.8) * 0.5;
            ctx.scale(flick, 1.2); ctx.font = "20px serif"; ctx.textAlign = "right";
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