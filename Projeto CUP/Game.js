const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "Player.png";

// ================= INPUT =================
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// ================= Tempo de Jogo =================
let gameTime = 0;

// ================= Jogador =================
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 30,
    speed: 4,
    life: 3
};

let invincible = 0;

// ================= Effeito do BOSS =================
let bossHitEffect = 0;

let bossLaser = {
    active: false,
    timer: 0
};

// ================= Movimento do Jogador =================
function updatePlayer() {
    if (keys["ArrowUp"] || keys["KeyW"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["KeyS"]) player.y += player.speed;
    if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= player.speed;
    if (keys["ArrowRight"] || keys["KeyD"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    if (invincible > 0) invincible--;
}

function drawPlayer() {
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

// ================= Balas =================
let bullets = [];
let shootCooldown = 0;

function shoot() {
    if ((keys["Space"] || keys["Enter"]) && shootCooldown <= 0) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - 3,
            width: 10,
            height: 6,
            speed: 8
        });
        shootCooldown = 12;
    }
}

function updateBullets() {
    bullets.forEach((b, i) => {
        b.x += b.speed;
        if (b.x > canvas.width) bullets.splice(i, 1);
    });
    if (shootCooldown > 0) shootCooldown--;
}
// ================= não tenta mudar as balas =================
function drawBullets() {
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

// ================= Inimigos =================
let enemies = [];
let enemyTimer = 0;

function createEnemy() {
    enemies.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 40),
        width: 30,
        height: 30,
        speed: boss.active ? 3 : 2,
        life: boss.active ? 1 : 2
    });
}

function updateEnemies() {
    enemyTimer++;
    const spawnRate = boss.active ? 120 : 60;

    if (enemyTimer > spawnRate) {
        createEnemy();
        enemyTimer = 0;
    }

    enemies.forEach((e, i) => {
        e.x -= e.speed;
        if (e.x < -e.width) enemies.splice(i, 1);
    });
}

function drawEnemies() {
    ctx.fillStyle = "green";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
}

// ================= BOSS =================
const boss = {
    active: false,
    entered: false,
    x: canvas.width + 200,
    y: 200,
    width: 140,
    height: 140,
    life: 300,
    maxLife: 300,
    phase: 1,
    speed: 2,
    dirY: 1
};

let bossBullets = [];
let bossShootTimer = 0;

function updateBoss() {
    if (!boss.active) return;

    if (!boss.entered) {
        boss.x -= 2;
        if (boss.x <= canvas.width - 180) boss.entered = true;
        return;
    }

    if (boss.life > 200) boss.phase = 1;
    else if (boss.life > 100) boss.phase = 2;
    else boss.phase = 3;

    boss.speed = boss.phase + 1;
    boss.y += boss.speed * boss.dirY;

    if (boss.y <= 0 || boss.y + boss.height >= canvas.height) {
        boss.dirY *= -1;
    }

    bossShootTimer++;
    if (bossShootTimer > 60 - boss.phase * 10) {
        bossShootTimer = 0;
        bossBullets.push({
            x: boss.x,
            y: boss.y + boss.height / 2,
            width: 10,
            height: 10,
            speed: 4 + boss.phase
        });
    }

    // LASER FASE 3, tenho que ver como arrumar o bug do hit instataneo
    if (boss.phase === 3) {
        bossLaser.timer++;

        if (bossLaser.timer > 180) bossLaser.active = true;
        if (bossLaser.timer > 240) {
            bossLaser.active = false;
            bossLaser.timer = 0;
        }
    }
}

function updateBossBullets() {
    bossBullets.forEach((b, i) => {
        b.x -= b.speed;
        if (b.x < -20) bossBullets.splice(i, 1);
    });
}

// ================= Desenho horripilante do Boss, melhorar depois =================
function drawBoss() {
    if (!boss.active) return;

    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    // FLASH DE DANO / quando ele apanha, não mecher nesse lugar
    if (bossHitEffect > 0) {
        ctx.fillStyle = "white";
        bossHitEffect--;
    } else {
        ctx.fillStyle =
            boss.phase === 3 ? "#4b0082" :
            boss.phase === 2 ? "#ff8c00" :
            "#1e90ff";
    }

    // CORPO
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 70, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // ASAS
    ctx.fillStyle = "#333";

    ctx.beginPath();
    ctx.moveTo(boss.x - 20, centerY);
    ctx.lineTo(boss.x + 30, boss.y + 20);
    ctx.lineTo(boss.x + 30, boss.y + boss.height - 20);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width + 20, centerY);
    ctx.lineTo(boss.x + boss.width - 30, boss.y + 20);
    ctx.lineTo(boss.x + boss.width - 30, boss.y + boss.height - 20);
    ctx.closePath();
    ctx.fill();

    // NÚCLEO COM BRILHO
    ctx.save();
    ctx.shadowColor = boss.phase === 3 ? "red" :
                      boss.phase === 2 ? "yellow" : "cyan";
    ctx.shadowBlur = 30;
    ctx.fillStyle = ctx.shadowColor;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 20 + Math.sin(gameTime * 0.1) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // RACHADURAS FASE 3, tenho que melhorar isso 
    if (boss.phase === 3) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(centerX - 40, centerY - 30);
        ctx.lineTo(centerX - 10, centerY);
        ctx.lineTo(centerX - 30, centerY + 40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 40, centerY - 20);
        ctx.lineTo(centerX + 10, centerY + 10);
        ctx.lineTo(centerX + 30, centerY + 40);
        ctx.stroke();
    }

    // VIDA
    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, 200 * (boss.life / boss.maxLife), 10);
}

function drawBossLaser() {
    if (!bossLaser.active) return;

    ctx.save();
    ctx.fillStyle = "red";
    ctx.shadowColor = "red";
    ctx.shadowBlur = 40;
    ctx.fillRect(0, boss.y + boss.height / 2 - 10, boss.x, 20);
    ctx.restore();
}

function drawBossBullets() {
    ctx.fillStyle = "pink";
    bossBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

// ================= Sistema de Colisão =================
function collide(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function checkCollisions() {
    enemies.forEach((e, ei) => {
        bullets.forEach((b, bi) => {
            if (collide(b, e)) {
                e.life--;
                bullets.splice(bi, 1);
                if (e.life <= 0) enemies.splice(ei, 1);
            }
        });

        if (collide(player, e)) damagePlayer();
    });

    if (boss.active) {
        bullets.forEach((b, bi) => {
            if (collide(b, boss)) {
                bullets.splice(bi, 1);
                boss.life -= 2;
                bossHitEffect = 8;
            }
        });
    }

    bossBullets.forEach((b, i) => {
        if (collide(player, b)) {
            bossBullets.splice(i, 1);
            damagePlayer();
        }
    });

    if (bossLaser.active) {
        if (
            player.y < boss.y + boss.height / 2 + 10 &&
            player.y + player.height > boss.y + boss.height / 2 - 10
        ) {
            damagePlayer();
        }
    }

    if (boss.life <= 0) {
        alert("VOCÊ VENCEU!");
        location.reload();
    }
}

// ================= PLAYER DAMAGE / tenho que consertar a invesibilidade visual =================
function damagePlayer() {
    if (invincible > 0) return;
    player.life--;
    invincible = 60;
    if (player.life <= 0) {
        alert("GAME OVER, agora terá que me contatar.");
        location.reload();
    }
}

// ================= UI =================
function drawUI() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Vida: " + player.life, 10, 50);
}

// ================= LOOP =================
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameTime++;

    if (!boss.active && gameTime > 600) boss.active = true;

    updatePlayer();
    shoot();
    updateBullets();
    updateEnemies();
    updateBoss();
    updateBossBullets();
    checkCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawBoss();
    drawBossLaser();
    drawBossBullets();
    drawUI();

    requestAnimationFrame(gameLoop);
}

playerImg.onload = () => gameLoop();