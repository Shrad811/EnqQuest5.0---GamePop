const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const crystalsElement =
    document.getElementById("crystals");

const distanceElement =
    document.getElementById("distance");

const bestScoreElement =
    document.getElementById("bestScore");

const finalScoreElement =
    document.getElementById("finalScore");

const gameOverTitle =
    document.getElementById("gameOverTitle");

const levelText =
    document.getElementById("levelText");


/* =====================================
   GAME SETTINGS
===================================== */

let gameRunning = false;

let lastTime = 0;

let timer = 60;

let score = 0;

let distance = 0;

let crystals = 0;

const MAX_LIVES = 5;

let lives = MAX_LIVES;

let speed = 300;

let baseSpeed = 300;

let obstacleTimer = 1.8;

let crystalTimer = 2.5;

let orbTimer = 4;

let boostTimer = 7;

let groundOffset = 0;

let difficulty = 1;

let invincibleTimer = 0;

let speedBoostTimer = 0;

let bestScore =
    Number(localStorage.getItem("chronoBest")) || 0;

bestScoreElement.textContent = bestScore;


/* =====================================
   PLAYER
===================================== */

const player = {

    x: 120,

    y: 350,

    width: 45,

    height: 55,

    velocityY: 0,

    gravity: 1900,

    jumpPower: -700,

    grounded: true,

    animation: 0
};


/* =====================================
   OBJECT ARRAYS
===================================== */

let obstacles = [];

let crystalsList = [];

let energyOrbs = [];

let speedBoosts = [];

let particles = [];

let clouds = [];


/* =====================================
   START
===================================== */

startBtn.addEventListener(
    "click",
    startGame
);

restartBtn.addEventListener(
    "click",
    startGame
);


function startGame() {

    gameRunning = true;

    timer = 60;

    score = 0;

    distance = 0;

    crystals = 0;

    lives = MAX_LIVES;

    speed = 300;

    baseSpeed = 300;

    difficulty = 1;

    obstacleTimer = 1.5;

    crystalTimer = 2;

    orbTimer = 3;

    boostTimer = 6;

    invincibleTimer = 0;

    speedBoostTimer = 0;

    groundOffset = 0;

    obstacles = [];

    crystalsList = [];

    energyOrbs = [];

    speedBoosts = [];

    particles = [];

    clouds = [];

    player.y = 350;

    player.velocityY = 0;

    player.grounded = true;

    startScreen.classList.add("hidden");

    gameOverScreen.classList.add("hidden");

    updateUI();

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


/* =====================================
   INPUT
===================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code === "Space" ||
            event.code === "ArrowUp"
        ) {

            event.preventDefault();

            jump();
        }
    }
);


function jump() {

    if (!gameRunning) return;

    if (!player.grounded) return;

    player.velocityY =
        player.jumpPower;

    player.grounded = false;

    createParticles(
        player.x + 20,
        player.y + player.height,
        8
    );
}


/* =====================================
   GAME LOOP
===================================== */

function gameLoop(currentTime) {

    if (!gameRunning) return;

    let dt =
        (currentTime - lastTime) / 1000;

    lastTime = currentTime;

    if (dt > 0.05) {
        dt = 0.05;
    }

    update(dt);

    draw();

    requestAnimationFrame(gameLoop);
}


/* =====================================
   UPDATE
===================================== */

function update(dt) {

    /* -----------------------------
       TIMER
    ----------------------------- */

    timer -= dt;

    if (timer <= 0) {

        timer = 0;

        endGame("TIME'S UP");

        return;
    }


    /* -----------------------------
       DIFFICULTY
    ----------------------------- */

    difficulty =
        1 + distance / 1200;

    baseSpeed =
        Math.min(
            480,
            300 + distance * 0.035
        );


    /* SPEED BOOST */

    if (speedBoostTimer > 0) {

        speedBoostTimer -= dt;

        speed = baseSpeed + 150;

    } else {

        speed = baseSpeed;
    }


    /* -----------------------------
       INVINCIBILITY
    ----------------------------- */

    if (invincibleTimer > 0) {

        invincibleTimer -= dt;
    }


    /* -----------------------------
       SCORE
    ----------------------------- */

    score += dt * 12;

    distance +=
        speed * dt / 10;


    /* -----------------------------
       PLAYER
    ----------------------------- */

    player.velocityY +=
        player.gravity * dt;

    player.y +=
        player.velocityY * dt;

    player.animation +=
        dt * 10;


    if (
        player.y + player.height >= 405
    ) {

        player.y =
            405 - player.height;

        player.velocityY = 0;

        player.grounded = true;
    }


    /* =================================
       OBSTACLE SPAWN
    ================================= */

    obstacleTimer -= dt;

    if (obstacleTimer <= 0) {

        createObstacle();

        /*
          Bigger gap between obstacles.
          As difficulty increases,
          gap slowly becomes smaller.
        */

        obstacleTimer =
            Math.max(
                1.05,
                1.8 - difficulty * 0.12
            );
    }


    obstacles.forEach(
        obstacle => {

            obstacle.x -=
                speed * dt;
        }
    );


    obstacles =
        obstacles.filter(
            obstacle =>
                obstacle.x +
                obstacle.width > -80
        );


    /* =================================
       TIME CRYSTALS
    ================================= */

    crystalTimer -= dt;

    if (crystalTimer <= 0) {

        createCrystal();

        crystalTimer =
            2.5 +
            Math.random() * 2.5;
    }


    crystalsList.forEach(
        crystal => {

            crystal.x -=
                speed * dt;

            crystal.rotation +=
                dt * 4;
        }
    );


    crystalsList =
        crystalsList.filter(
            crystal =>
                crystal.x > -60
        );


    /* =================================
       ENERGY ORBS
    ================================= */

    orbTimer -= dt;

    if (orbTimer <= 0) {

        createEnergyOrb();

        orbTimer =
            4 +
            Math.random() * 3;
    }


    energyOrbs.forEach(
        orb => {

            orb.x -=
                speed * dt;

            orb.float +=
                dt * 4;
        }
    );


    energyOrbs =
        energyOrbs.filter(
            orb =>
                orb.x > -60
        );


    /* =================================
       SPEED BOOST
    ================================= */

    boostTimer -= dt;

    if (boostTimer <= 0) {

        createSpeedBoost();

        boostTimer =
            7 +
            Math.random() * 4;
    }


    speedBoosts.forEach(
        boost => {

            boost.x -=
                speed * dt;

            boost.rotation +=
                dt * 3;
        }
    );


    speedBoosts =
        speedBoosts.filter(
            boost =>
                boost.x > -60
        );


    /* =================================
       CLOUDS
    ================================= */

    if (
        Math.random() < dt * 0.4
    ) {

        createCloud();
    }


    clouds.forEach(
        cloud => {

            cloud.x -=
                cloud.speed * dt;
        }
    );


    clouds =
        clouds.filter(
            cloud =>
                cloud.x > -200
        );


    /* =================================
       COLLISIONS
    ================================= */

    checkObstacleCollision();

    checkCrystalCollision();

    checkEnergyCollision();

    checkBoostCollision();


    /* =================================
       PARTICLES
    ================================= */

    particles.forEach(
        particle => {

            particle.x +=
                particle.vx * dt;

            particle.y +=
                particle.vy * dt;

            particle.life -= dt;

            particle.vy +=
                400 * dt;
        }
    );


    particles =
        particles.filter(
            particle =>
                particle.life > 0
        );


    groundOffset +=
        speed * dt;

    updateUI();
}


/* =====================================
   CREATE OBSTACLE
===================================== */

function createObstacle() {

    let type =
        Math.random();

    let obstacle;


    /*
       SMALL OBSTACLE
    */

    if (type < 0.55) {

        obstacle = {

            x: canvas.width + 30,

            y: 360,

            width: 35,

            height: 45,

            type: "small",

            passed: false
        };

    }

    /*
       LARGE OBSTACLE
    */

    else {

        obstacle = {

            x: canvas.width + 30,

            y: 340,

            width: 55,

            height: 65,

            type: "large",

            passed: false
        };
    }


    obstacles.push(obstacle);
}


/* =====================================
   CREATE CRYSTAL
===================================== */

function createCrystal() {

    crystalsList.push({

        x: canvas.width + 40,

        y:
            240 +
            Math.random() * 110,

        width: 25,

        height: 30,

        rotation: 0
    });
}


/* =====================================
   ENERGY ORB
===================================== */

function createEnergyOrb() {

    energyOrbs.push({

        x: canvas.width + 40,

        y:
            230 +
            Math.random() * 120,

        width: 24,

        height: 24,

        float: Math.random() * 6
    });
}


/* =====================================
   SPEED BOOST
===================================== */

function createSpeedBoost() {

    speedBoosts.push({

        x: canvas.width + 40,

        y: 250,

        width: 28,

        height: 28,

        rotation: 0
    });
}


/* =====================================
   CLOUD
===================================== */

function createCloud() {

    clouds.push({

        x: canvas.width + 100,

        y:
            50 +
            Math.random() * 120,

        width:
            70 +
            Math.random() * 70,

        speed:
            25 +
            Math.random() * 20
    });
}


/* =====================================
   OBSTACLE COLLISION
===================================== */

function checkObstacleCollision() {

    /*
       Player cannot be damaged
       during invincibility.
    */

    if (invincibleTimer > 0) {
        return;
    }


    let playerBox = {

        x: player.x + 10,

        y: player.y + 8,

        width: player.width - 18,

        height: player.height - 12
    };


    for (
        let i = 0;
        i < obstacles.length;
        i++
    ) {

        let obstacle =
            obstacles[i];


        let hit =

            playerBox.x <
            obstacle.x +
            obstacle.width &&

            playerBox.x +
            playerBox.width >
            obstacle.x &&

            playerBox.y <
            obstacle.y +
            obstacle.height &&

            playerBox.y +
            playerBox.height >
            obstacle.y;


        if (hit) {

            hitObstacle(i);

            break;
        }
    }
}


/* =====================================
   HIT OBSTACLE
===================================== */

function hitObstacle(index) {

    obstacles.splice(index, 1);

    lives--;


    /*
       Only 2 seconds penalty.
    */

    timer =
        Math.max(
            0,
            timer - 2
        );


    /*
       1.5 second invincibility.
    */

    invincibleTimer = 1.5;


    createParticles(
        player.x + 20,
        player.y + 25,
        25
    );


    /*
       Small knockback.
    */

    player.velocityY = -250;


    if (lives <= 0) {

        endGame("RUN FAILED");
    }
}


/* =====================================
   CRYSTAL COLLISION
===================================== */

function checkCrystalCollision() {

    for (
        let i = crystalsList.length - 1;
        i >= 0;
        i--
    ) {

        let crystal =
            crystalsList[i];


        if (
            player.x <
            crystal.x +
            crystal.width &&

            player.x +
            player.width >
            crystal.x &&

            player.y <
            crystal.y +
            crystal.height &&

            player.y +
            player.height >
            crystal.y
        ) {

            crystalsList.splice(i, 1);

            crystals++;

            /*
               +5 seconds
            */

            timer =
                Math.min(
                    60,
                    timer + 5
                );

            score += 100;


            createParticles(
                crystal.x,
                crystal.y,
                20
            );
        }
    }
}


/* =====================================
   ENERGY ORB COLLISION
===================================== */

function checkEnergyCollision() {

    for (
        let i = energyOrbs.length - 1;
        i >= 0;
        i--
    ) {

        let orb =
            energyOrbs[i];


        if (
            player.x <
            orb.x +
            orb.width &&

            player.x +
            player.width >
            orb.x &&

            player.y <
            orb.y +
            orb.height &&

            player.y +
            player.height >
            orb.y
        ) {

            energyOrbs.splice(i, 1);

            score += 150;


            createParticles(
                orb.x,
                orb.y,
                18
            );
        }
    }
}


/* =====================================
   BOOST COLLISION
===================================== */

function checkBoostCollision() {

    for (
        let i = speedBoosts.length - 1;
        i >= 0;
        i--
    ) {

        let boost =
            speedBoosts[i];


        if (
            player.x <
            boost.x +
            boost.width &&

            player.x +
            player.width >
            boost.x &&

            player.y <
            boost.y +
            boost.height &&

            player.y +
            player.height >
            boost.y
        ) {

            speedBoosts.splice(i, 1);

            /*
               4 second speed boost
            */

            speedBoostTimer = 4;

            score += 200;


            createParticles(
                boost.x,
                boost.y,
                25
            );
        }
    }
}


/* =====================================
   PARTICLES
===================================== */

function createParticles(
    x,
    y,
    count
) {

    for (
        let i = 0;
        i < count;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            vx:
                (Math.random() - 0.5) *
                280,

            vy:
                (Math.random() - 0.8) *
                280,

            life:
                0.4 +
                Math.random() * 0.7,

            size:
                2 +
                Math.random() * 4
        });
    }
}


/* =====================================
   DRAW
===================================== */

function draw() {

    drawSky();

    drawStars();

    drawMoon();

    drawClouds();

    drawMountains();

    drawGround();

    drawCrystals();

    drawEnergyOrbs();

    drawSpeedBoosts();

    drawObstacles();

    drawPlayer();

    drawParticles();
}


/* =====================================
   SKY
===================================== */

function drawSky() {

    let gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );


    gradient.addColorStop(
        0,
        "#071126"
    );

    gradient.addColorStop(
        0.6,
        "#102544"
    );

    gradient.addColorStop(
        1,
        "#17283b"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


/* =====================================
   STARS
===================================== */

function drawStars() {

    ctx.fillStyle =
        "rgba(255,255,255,0.7)";


    for (
        let i = 0;
        i < 45;
        i++
    ) {

        let x =
            (i * 137) %
            canvas.width;

        let y =
            (i * 71) %
            220;


        ctx.fillRect(
            x,
            y,
            2,
            2
        );
    }
}


/* =====================================
   MOON
===================================== */

function drawMoon() {

    ctx.beginPath();

    ctx.arc(
        820,
        90,
        42,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#d9f7ff";

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        840,
        75,
        42,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#071126";

    ctx.fill();
}


/* =====================================
   CLOUDS
===================================== */

function drawClouds() {

    clouds.forEach(
        cloud => {

            ctx.fillStyle =
                "rgba(160,190,220,0.15)";


            ctx.beginPath();

            ctx.arc(
                cloud.x,
                cloud.y,
                20,
                0,
                Math.PI * 2
            );

            ctx.arc(
                cloud.x + 25,
                cloud.y - 10,
                25,
                0,
                Math.PI * 2
            );

            ctx.arc(
                cloud.x + 55,
                cloud.y,
                20,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );
}


/* =====================================
   MOUNTAINS
===================================== */

function drawMountains() {

    ctx.fillStyle =
        "#0b1829";


    ctx.beginPath();

    ctx.moveTo(
        0,
        405
    );


    for (
        let x = 0;
        x <= canvas.width;
        x += 100
    ) {

        let height =
            70 +
            ((x * 17) % 70);


        ctx.lineTo(
            x,
            405 - height
        );
    }


    ctx.lineTo(
        canvas.width,
        405
    );


    ctx.closePath();

    ctx.fill();
}


/* =====================================
   GROUND
===================================== */

function drawGround() {

    ctx.fillStyle =
        "#05090f";


    ctx.fillRect(
        0,
        405,
        canvas.width,
        95
    );


    ctx.fillStyle =
        "#00e5ff";


    ctx.fillRect(
        0,
        405,
        canvas.width,
        3
    );


    ctx.strokeStyle =
        "#162536";

    ctx.lineWidth = 2;


    let offset =
        -(groundOffset % 50);


    for (
        let x = offset;
        x < canvas.width;
        x += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            425
        );

        ctx.lineTo(
            x + 20,
            425
        );

        ctx.stroke();
    }
}


/* =====================================
   PLAYER
===================================== */

function drawPlayer() {

    /*
       Blink while invincible
    */

    if (
        invincibleTimer > 0 &&
        Math.floor(
            invincibleTimer * 10
        ) % 2 === 0
    ) {

        return;
    }


    let bounce =
        player.grounded
            ? Math.sin(
                player.animation
            ) * 2
            : 0;


    let x =
        player.x;

    let y =
        player.y + bounce;


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#00e5ff";


    /* BODY */

    ctx.fillStyle =
        "#00e5ff";


    ctx.fillRect(
        x + 10,
        y + 15,
        25,
        35
    );


    /* HEAD */

    ctx.fillRect(
        x + 17,
        y,
        27,
        25
    );


    /* VISOR */

    ctx.fillStyle =
        "#06101b";


    ctx.fillRect(
        x + 27,
        y + 6,
        15,
        8
    );


    /* LEGS */

    ctx.fillStyle =
        "#00e5ff";


    let leg =
        Math.sin(
            player.animation
        ) * 5;


    ctx.fillRect(
        x + 10,
        y + 45,
        9,
        12 + leg
    );


    ctx.fillRect(
        x + 27,
        y + 45,
        9,
        12 - leg
    );


    ctx.shadowBlur = 0;
}


/* =====================================
   OBSTACLES
===================================== */

function drawObstacles() {

    obstacles.forEach(
        obstacle => {

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                "#ff3158";


            ctx.fillStyle =
                "#ff3158";


            if (
                obstacle.type === "small"
            ) {

                ctx.fillRect(
                    obstacle.x + 12,
                    obstacle.y,
                    12,
                    obstacle.height
                );


                ctx.fillRect(
                    obstacle.x,
                    obstacle.y + 18,
                    obstacle.width,
                    12
                );

            } else {

                ctx.fillRect(
                    obstacle.x,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height
                );


                ctx.fillStyle =
                    "#071126";


                ctx.fillRect(
                    obstacle.x + 8,
                    obstacle.y + 10,
                    10,
                    10
                );
            }


            ctx.shadowBlur = 0;
        }
    );
}


/* =====================================
   CRYSTALS
===================================== */

function drawCrystals() {

    crystalsList.forEach(
        crystal => {

            ctx.save();


            ctx.translate(
                crystal.x +
                crystal.width / 2,

                crystal.y +
                crystal.height / 2
            );


            ctx.rotate(
                crystal.rotation
            );


            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#c65cff";


            ctx.fillStyle =
                "#c65cff";


            ctx.beginPath();

            ctx.moveTo(
                0,
                -15
            );

            ctx.lineTo(
                12,
                0
            );

            ctx.lineTo(
                0,
                15
            );

            ctx.lineTo(
                -12,
                0
            );

            ctx.closePath();

            ctx.fill();


            ctx.restore();
        }
    );
}


/* =====================================
   ENERGY ORBS
===================================== */

function drawEnergyOrbs() {

    energyOrbs.forEach(
        orb => {

            let y =
                orb.y +
                Math.sin(
                    orb.float
                ) * 6;


            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#ffd43b";


            ctx.fillStyle =
                "#ffd43b";


            ctx.beginPath();

            ctx.arc(
                orb.x + 12,
                y + 12,
                11,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.fillStyle =
                "#fff7b0";


            ctx.beginPath();

            ctx.arc(
                orb.x + 8,
                y + 8,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.shadowBlur = 0;
        }
    );
}


/* =====================================
   SPEED BOOST
===================================== */

function drawSpeedBoosts() {

    speedBoosts.forEach(
        boost => {

            ctx.save();


            ctx.translate(
                boost.x + 14,
                boost.y + 14
            );


            ctx.rotate(
                boost.rotation
            );


            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#48ff91";


            ctx.fillStyle =
                "#48ff91";


            ctx.beginPath();

            ctx.moveTo(
                0,
                -15
            );

            ctx.lineTo(
                10,
                0
            );

            ctx.lineTo(
                0,
                15
            );

            ctx.lineTo(
                -10,
                0
            );

            ctx.closePath();

            ctx.fill();


            ctx.fillStyle =
                "#071126";


            ctx.beginPath();

            ctx.moveTo(
                2,
                -9
            );

            ctx.lineTo(
                -4,
                1
            );

            ctx.lineTo(
                1,
                1
            );

            ctx.lineTo(
                -2,
                9
            );

            ctx.lineTo(
                6,
                -2
            );

            ctx.lineTo(
                1,
                -2
            );

            ctx.closePath();

            ctx.fill();


            ctx.restore();
        }
    );
}


/* =====================================
   PARTICLES
===================================== */

function drawParticles() {

    particles.forEach(
        particle => {

            ctx.globalAlpha =
                Math.max(
                    0,
                    particle.life
                );


            ctx.fillStyle =
                "#00e5ff";


            ctx.fillRect(
                particle.x,
                particle.y,
                particle.size,
                particle.size
            );
        }
    );


    ctx.globalAlpha = 1;
}


/* =====================================
   UI
===================================== */

function updateUI() {

    timerElement.textContent =
        Math.ceil(timer);


    scoreElement.textContent =
        Math.floor(score);


    crystalsElement.textContent =
        crystals;


    distanceElement.textContent =
        Math.floor(distance);


    livesElement.textContent =
        "♥".repeat(lives) +
        "♡".repeat(
            MAX_LIVES - lives
        );
}


/* =====================================
   SPEED MESSAGE
===================================== */

function showSpeedMessage() {

    levelText.classList.remove(
        "show"
    );

    void levelText.offsetWidth;

    levelText.classList.add(
        "show"
    );
}


/* =====================================
   GAME OVER
===================================== */

function endGame(reason) {

    gameRunning = false;

    let final =
        Math.floor(score);


    finalScoreElement.textContent =
        final;


    gameOverTitle.textContent =
        reason;


    if (final > bestScore) {

        bestScore = final;

        localStorage.setItem(
            "chronoBest",
            bestScore
        );
    }


    bestScoreElement.textContent =
        bestScore;


    gameOverScreen.classList.remove(
        "hidden"
    );
}