const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const changelog = document.getElementById('changelog')
const startButton = document.getElementById('startButton');
const playerNameInput = document.getElementById('playerName');
const exitMenu = document.getElementById('exitMenu');
const resumeBtn = document.getElementById('resumeBtn');
const leaveBtn = document.getElementById('leaveBtn');

const messages = [];
let gameStart = false;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const mapColor = '#f0f0f0';
const outOfBoundsColor = '#808080';
const bullets = [];
const players = new Map();
const bulletSpeed = 3;
const playerBarrels = new Map();
const barrels = [];
const polygons = []

let mapSize = 3000;
let gridSize = 50;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const barrel = {
    length: 20,
    width: 7,
    color: '#8f8f8f',
    borderColor: '#6e6e6e',
    angle: 0
};

const bulletSettings = {
    radius: 7,
    color: '#00bbff',
    borderColor: '#006c9e',
    borderWidth: 2,
    speed: 3,
    maxLifetime: 3000
};

document.addEventListener('DOMContentLoaded', () => {
    const exitMenu = document.getElementById('exitMenu');
    const resumeBtn = document.getElementById('resumeBtn');
    const leaveBtn = document.getElementById('leaveBtn');
    const showFpsBtn = document.getElementById('showFpsBtn');
    const debugModeBtn = document.getElementById('debugModeBtn');

    function toggleMenu(show) {
        console.log('Toggling menu:', show);
        if (show) {
            exitMenu.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            exitMenu.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    showFpsBtn.addEventListener('click', () => {
        showFpsBtn.classList.toggle('active');
        showFPS = !showFPS;
        fpsDisplay.style.display = showFPS ? 'block' : 'none';
    });

    debugModeBtn.addEventListener('click', () => {
        debugModeBtn.classList.toggle('active');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && gameStart) {
            toggleMenu(true);
        }
    });

    resumeBtn.addEventListener('click', () => {
        toggleMenu(false);
    });

    leaveBtn.addEventListener('click', () => {
        location.reload();
    });
});

function addMessage(text) {
    if (!gameStart) return;
    messages.push({
        text,
        timestamp: Date.now()
    });
}

function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `Score: ${player.score}`;
}

function drawMessages() {
    if (!gameStart) return;
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    messages.forEach((msg, index) => {
        const yOffset = 30;
        const xOffset = 10;
        if (Date.now() - msg.timestamp < 5000) {
            ctx.fillText(msg.text, xOffset, yOffset + index * 25);
        }
    });
}

const player = {
    x: mapSize / 2,
    y: mapSize / 2,
    radius: 15,
    id: '',
    color: '#00bbff',
    borderColor: '#007fad',
    speed: 0.1,
    maxSpeed: 4,
    drag: 0.95,
    velocityX: 0,
    velocityY: 0,
    health: 100,
    barrelLength: 20,
    barrelWidth: 7,
    barrelColor: '#8f8f8f',
    barrelBorderColor: '#6e6e6e',
    angle: 0,
    score: 0,
    name: "",
    score: 0,
    get hitbox() {
        const totalRadius = this.radius + this.borderWidth;
        return {
            x: this.x - totalRadius,
            y: this.y - totalRadius,
            width: totalRadius * 2,
            height: totalRadius * 2
        };
    }
};

function setRandomPlayerPosition() {
    player.x = Math.random() * (mapSize - player.radius * 2) + player.radius;
    player.y = Math.random() * (mapSize - player.radius * 2) + player.radius;
}

setRandomPlayerPosition();

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

let randomNumber = getRandomInt(1, 1000);

function startGame() {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        gameStart = true;
        player.name = playerName;
        menu.style.display = 'none';
        canvas.style.display = 'block';
        changelog.style.display = 'none';
        connectWebSocket();
        gameLoop();
    } else {
        gameStart = true;
        player.name = `Player_${randomNumber}`;
        menu.style.display = 'none';
        canvas.style.display = 'block';
        changelog.style.display = 'none';
        connectWebSocket();
        gameLoop();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const serverTabElement = document.getElementById('serverTab');
    const leftArrowElement = document.getElementById('leftArrow');
    const rightArrowElement = document.getElementById('rightArrow');

    let servers = [];
    let currentIndex = 0;

    async function fetchServers() {
        try {
            const response = await fetch('/api/servers');
            if (response.ok) {
                servers = await response.json();
                updateServerTab();
            } else {
                console.error('Failed to fetch servers');
            }
        } catch (error) {
            console.error('Error fetching servers:', error);
        }
    }

    function updateServerTab() {
        if (servers.length > 0) {
            serverTabElement.textContent = servers[currentIndex].name;
        } else {
            serverTabElement.textContent = 'No servers available';
        }
    }

    leftArrowElement.addEventListener('click', () => {
        if (servers.length > 0) {
            currentIndex = (currentIndex - 1 + servers.length) % servers.length;
            updateServerTab();
        }
    });

    rightArrowElement.addEventListener('click', () => {
        if (servers.length > 0) {
            currentIndex = (currentIndex + 1) % servers.length;
            updateServerTab();
        }
    });
    fetchServers();
});

startButton.addEventListener('click', startGame);

function handleWebSocketMessage(event) {
    const message = JSON.parse(event.data);

    if (message.type === 'updateBarrels') {
        barrels.length = 0;
        barrels.push(...message.barrels);
    }
}

let isConnected = false;

function connectWebSocket() {
    if (isConnected) {
        console.log('WebSocket connection already established.');
        return;
    }

    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('Connected to WebSocket server');

        if (gameStart) {

            ws.send(JSON.stringify({
                type: 'initializePlayer',
                x: player.x,
                y: player.y,
                angle: player.angle,
                color: player.color,
                borderColor: player.borderColor,
                barrelLength: player.barrelLength,
                barrelWidth: player.barrelWidth,
                barrelColor: player.barrelColor,
                barrelBorderColor: player.barrelBorderColor,
                radius: player.radius,
                playerName: player.name

            }));

        }

        isConnected = true;
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error: ', error);
    };

    ws.onmessage = (event) => {

        const data = JSON.parse(event.data);

        if (data.type === 'welcome') {

            player.id = data.id;

        }

        else if (data.type === 'playerDisconnect') {

            players.delete(data.id);

            //addMessage(`Player ${data.playerName} left`);

        } 

        else if (data.type === 'playerJoin') {

            //addMessage(`Player ${data.playerName} joined`);

        } 

        else if (data.type === 'playerUpdate') {

            if (data.id !== player.id) {

                players.set(data.id, {
                    x: data.x,
                    y: data.y,
                    angle: data.angle,
                    color: data.color,
                    borderColor: data.borderColor,
                    barrelLength: data.barrelLength,
                    barrelWidth: data.barrelWidth,
                    barrelColor: data.barrelColor,
                    barrelBorderColor: data.barrelBorderColor,
                    radius: data.radius
                });

                playerBarrels.set(data.id, {
                    angle: data.angle,
                    length: data.barrelLength,
                    width: data.barrelWidth,
                    color: data.barrelColor,
                    borderColor: data.barrelBorderColor
                });

            }

        } 

        else if (data.type === 'bulletUpdate') {

            bullets.push(data.id, {

                x: data.x,
                y: data.y,
                speedX: data.speedX,
                speedY: data.speedY,
                ownerId: data.ownerId,
                color: data.color

            });

        }

        else if (data.type === 'bulletHit') {

            const { bulletId } = data;
    
            const index = bullets.findIndex(b => b.id === bulletId);
            if (index > -1) {
                
                bullets.splice(index, 1);

            }

        } 

        else if (data.type === 'updateBarrels') {

            barrels.length = 0;
            data.barrels.forEach(barrel => barrels.push(barrel));
        }

        
        else if (data.type === 'scoreUpdate') {
            const { playerId, score } = data;
    
            if (playerId === player.id) {
                player.score = score;
                updateScoreDisplay();
            }
        }

        else if (data.type === 'updatePolygons') {

            polygons.length = 0;
            data.data.forEach(polygon => {
                //console.log(`Polygon at (${polygon.x}, ${polygon.y}) with ${polygon.sides} sides.`);

                polygons.push({

                    x: polygon.x,
                    y: polygon.y,
                    angle: polygon.angle,
                    sides: polygon.sides,
                    radius: polygon.radius,
                    color: polygon.color,
                    score: polygon.score,
                    borderColor: polygon.borderColor,
                    speed: polygon.speed,
                    health: polygon.health,
                    opacity: polygon.opacity,
                    isFading: polygon.isFading,
                    baseHealth: polygon.baseHealth,
                    score: polygon.score,

                });

            });

        }

        else if (data.type === 'playerDisconnect') {

            players.delete(data.id);

        }

    };

    ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        isConnected = false;
        setTimeout(connectWebSocket, 5000);
    };

    return ws;
}

const ws = connectWebSocket();



function drawPolygons(ctx) {
    polygons.forEach(polygon => {

        ctx.save();
        ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);
        drawPolygon(ctx, polygon);
        ctx.restore();

    });
}

const baseHealthValues = [10, 20, 50, 100, 200, 1000, 2000, 3000];

function drawPolygon(ctx, polygon) {

    ctx.save();
    ctx.translate(polygon.x, polygon.y);
    ctx.rotate(polygon.angle);
    const cornerRadius = polygon.radius * 0.2;

    ctx.beginPath();
    const angleStep = (2 * Math.PI) / polygon.sides;
    //const startAngle = 0;
    let prevX, prevY, firstX, firstY;

    const sidesIndex = polygon.sides - 3; 
    polygon.baseHealth = baseHealthValues[sidesIndex] || 10;

    for (let i = 0; i < polygon.sides; i++) {
        const startAngle = polygon.angle;
        const angle = startAngle + i * angleStep;
        const x = Math.cos(angle) * polygon.radius;
        const y = Math.sin(angle) * polygon.radius;

        if (i === 0) {
            ctx.moveTo(x, y);
            firstX = x;
            firstY = y;
        } else {
            ctx.lineTo(x, y);
        }

        prevX = x;
        prevY = y;
    }

    ctx.lineTo(firstX, firstY);
    ctx.closePath();
    ctx.fillStyle = polygon.color;
    ctx.globalAlpha = polygon.opacity;
    ctx.fill();
    ctx.strokeStyle = polygon.borderColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();


    if (polygon.health <= .1) return;

    if (polygon.health >= baseHealthValues[sidesIndex]) return;

    const barWidth = polygon.radius * 1.5;
    const barHeight = 6;
    const healthPercentage = polygon.health / polygon.baseHealth;

    const healthBarWidth = barWidth * 1;
    const healthBarHeight = barHeight * 1;

    const healthBarX = polygon.x;
    const healthBarY = polygon.y + polygon.radius + barHeight + 10;

    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    drawRoundedRect(healthBarX - barWidth / 2, healthBarY, barWidth, barHeight, 5);
    ctx.fill();

    const HhealthBarX = polygon.x;
    const HhealthBarY = polygon.y + polygon.radius + barHeight + 10;

    ctx.fillStyle = polygon.color
    drawRoundedRect(HhealthBarX - healthBarWidth / 2, HhealthBarY, healthBarWidth * healthPercentage, healthBarHeight, 3);

    ctx.fill();

}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arc(x + width - radius, y + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arc(x + width - radius, y + height - radius, radius, 0, 0.5 * Math.PI);
    ctx.lineTo(x + radius, y + height);
    ctx.arc(x + radius, y + height - radius, radius, 0.5 * Math.PI, Math.PI);
    ctx.lineTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI);
    ctx.closePath();
}

function drawGrid() {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;

    const startX = Math.floor((player.x - canvas.width / 2) / gridSize) * gridSize;
    const startY = Math.floor((player.y - canvas.height / 2) / gridSize) * gridSize;
    
    const endX = startX + canvas.width;
    const endY = startY + canvas.height;

    for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - player.x + canvas.width / 2, 0);
        ctx.lineTo(x - player.x + canvas.width / 2, canvas.height);
        ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y - player.y + canvas.height / 2);
        ctx.lineTo(canvas.width, y - player.y + canvas.height / 2);
        ctx.stroke();
    }
}

function drawPlayer() {
    if (!gameStart) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const barrelEndX = centerX + Math.cos(barrel.angle) * barrel.length;
    const barrelEndY = centerY + Math.sin(barrel.angle) * barrel.length;

    const angle = barrel.angle;
    const halfWidth = barrel.width / 2;
    const xOffset = Math.cos(angle + Math.PI / 2) * halfWidth;
    const yOffset = Math.sin(angle + Math.PI / 2) * halfWidth;
    
    const x1 = centerX - xOffset;
    const y1 = centerY - yOffset;
    const x2 = barrelEndX - xOffset;
    const y2 = barrelEndY - yOffset;
    const x3 = barrelEndX + xOffset;
    const y3 = barrelEndY + yOffset;
    const x4 = centerX + xOffset;
    const y4 = centerY + yOffset;

    ctx.strokeStyle = barrel.borderColor;
    ctx.lineWidth = barrel.width + 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = barrel.color;
    ctx.lineWidth = barrel.width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = player.color;
    ctx.strokeStyle = player.borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}



function drawBarrels() {
    playerBarrels.forEach((barrel, playerId) => {

        //TODO 
        //drawing barrels for other clients is fmessed up

        if (playerId === player.id) return;
        const playerData = players.get(playerId);
        if (!playerData) return;

        const centerX = playerData.x - player.x + canvas.width / 2;
        const centerY = playerData.y - player.y + canvas.height / 2;

        const barrelEndX = centerX + Math.cos(barrel.angle) * barrel.length;
        const barrelEndY = centerY + Math.sin(barrel.angle) * barrel.length;

        const angle = barrel.angle;
        const halfWidth = barrel.width / 2;
        const xOffset = Math.cos(angle + Math.PI / 2) * halfWidth;
        const yOffset = Math.sin(angle + Math.PI / 2) * halfWidth;

        const x1 = centerX - xOffset;
        const y1 = centerY - yOffset;
        const x2 = barrelEndX - xOffset;
        const y2 = barrelEndY - yOffset;
        const x3 = barrelEndX + xOffset;
        const y3 = barrelEndY + yOffset;
        const x4 = centerX + xOffset;
        const y4 = centerY + yOffset;

        ctx.strokeStyle = barrel.borderColor;
        ctx.lineWidth = barrel.width + 8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = barrel.color;
        ctx.lineWidth = barrel.width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.stroke();
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        const isOwnedBySelf = bullet.ownerId === player.id;
        const bulletColor = isOwnedBySelf ? bulletSettings.color : '#ff2a1c';
        const bulletBorderColor = isOwnedBySelf ? bulletSettings.borderColor : '#990900';

        ctx.strokeStyle = bulletBorderColor;
        ctx.lineWidth = bulletSettings.borderWidth * 2;
        ctx.beginPath();
        ctx.arc(bullet.x - player.x + canvas.width / 2, bullet.y - player.y + canvas.height / 2, bulletSettings.radius + bulletSettings.borderWidth, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(bullet.x - player.x + canvas.width / 2, bullet.y - player.y + canvas.height / 2, bulletSettings.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updatePlayer() {
    if (!gameStart) return;
    let accelerationX = 0;
    let accelerationY = 0;
    
    if (keys.w) accelerationY -= player.speed;
    if (keys.a) accelerationX -= player.speed;
    if (keys.s) accelerationY += player.speed;
    if (keys.d) accelerationX += player.speed;

    const magnitude = Math.sqrt(accelerationX * accelerationX + accelerationY * accelerationY);
    if (magnitude > 0) {
        accelerationX /= magnitude;
        accelerationY /= magnitude;
    }

    player.velocityX += accelerationX * player.speed;
    player.velocityY += accelerationY * player.speed;
    player.velocityX *= player.drag;
    player.velocityY *= player.drag;
    
    if (Math.abs(player.velocityX) > player.maxSpeed) player.velocityX = player.maxSpeed * Math.sign(player.velocityX);
    if (Math.abs(player.velocityY) > player.maxSpeed) player.velocityY = player.maxSpeed * Math.sign(player.velocityY);

    let newX = player.x + player.velocityX;
    let newY = player.y + player.velocityY;

    newX = Math.max(player.radius, Math.min(mapSize - player.radius, newX));
    newY = Math.max(player.radius, Math.min(mapSize - player.radius, newY));
    
    player.x += player.velocityX;
    player.y += player.velocityY;

    player.x = newX;
    player.y = newY;

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'updatePosition',
            x: player.x,
            y: player.y,
            angle: player.angle,
            color: player.color,
            borderColor: player.borderColor,
            barrelLength: player.barrelLength,
            barrelWidth: player.barrelWidth,
            barrelColor: player.barrelColor,
            barrelBorderColor: player.barrelBorderColor,
            radius: player.radius
        }));
    } else {
        console.warn('WebSocket is not open. Message not sent.');
    }
}

function updateBullets() {
    //if (!gameStart) return;
    bullets.forEach((bullet, index) => {
        if (typeof bullet !== 'object' || bullet === null) {
            //console.error(`Unexpected data type in bullets array at index ${index}:`, bullet);
            return;
        }
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        bullet.lifetime += 16.67;

        if (bullet.x < 0 || bullet.x > mapSize || bullet.y < 0 || bullet.y > mapSize || bullet.lifetime > bulletSettings.maxLifetime) {
            bullets.splice(index, 1);
            return;
        }

        if (bullet.ownerId !== player.id) {
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const expandedPlayerRadius = player.radius;

            if (distance < expandedPlayerRadius + bulletSettings.radius) {
                bullets.splice(index, 1);
                return;
            }
        }

        polygons.forEach(polygon => {
            if (checkBulletPolygonCollision(bullet, polygon)) {
                if (polygon.isFading) return;
                bullets.splice(index, 1);
                console.log("bullet hit polygon")
                return;
            }
        });

        players.forEach((p, id) => {
            if (id !== player.id && id !== bullet.ownerId) {
                const playerDx = p.x - bullet.x;
                const playerDy = p.y - bullet.y;
                const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);

                if (playerDistance < 15 + bulletSettings.radius) {
                    bullets.splice(index, 1);
                    console.log("bullet hit player")
                    return;
                }
            }
        });
    });
}

function checkBulletPolygonCollision(bullet, polygon) {
    const boundingBox = getBoundingBox(polygon);

    if (bullet.x < boundingBox.minX || bullet.x > boundingBox.maxX || bullet.y < boundingBox.minY || bullet.y > boundingBox.maxY) {
        return false;
    }

    return isPointInPolygon(bullet.x, bullet.y, getPolygonVertices(polygon));
}

function getBoundingBox(polygon) {
    const vertices = getPolygonVertices(polygon);
    const minX = Math.min(...vertices.map(v => v.x));
    const maxX = Math.max(...vertices.map(v => v.x));
    const minY = Math.min(...vertices.map(v => v.y));
    const maxY = Math.max(...vertices.map(v => v.y));
    
    return { minX, maxX, minY, maxY };
}

function getPolygonVertices(polygon) {
    const { x, y, radius, sides } = polygon;
    const vertices = [];
    const angleStep = (2 * Math.PI) / sides;

    for (let i = 0; i < sides; i++) {
        const angle = i * angleStep;
        vertices.push({
            x: x + radius * Math.cos(angle),
            y: y + radius * Math.sin(angle)
        });
    }

    return vertices;
}

function isPointInPolygon(x, y, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function shootBullet() {
    if (!gameStart) return;
    const barrelEndX = player.x + Math.cos(barrel.angle) * barrel.length;
    const barrelEndY = player.y + Math.sin(barrel.angle) * barrel.length;
    const bullet = {
        x: barrelEndX,
        y: barrelEndY,
        speedX: Math.cos(barrel.angle) * bulletSettings.speed,
        speedY: Math.sin(barrel.angle) * bulletSettings.speed,
        ownerId: player.id,
        color: bulletSettings.color,
        borderWidth: bulletSettings.borderWidth
    };
    ws.send(JSON.stringify(bullet));
    ws.send(JSON.stringify({
        type: 'shoot',
        x: bullet.x,
        y: bullet.y,
        speedX: bullet.speedX,
        speedY: bullet.speedY,
        ownerId: bullet.ownerId,
        color: bullet.color,
        borderWidth: bulletSettings.borderWidth
    }));
}

function drawOtherPlayers() {
    players.forEach((p, id) => {
        if (id !== player.id) {
            
            //for ffa hard code enemy tank colors
            ctx.fillStyle = '#ff2a1c';
            //console.log({p})
            ctx.strokeStyle = '#990900';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x - player.x + canvas.width / 2, p.y - player.y + canvas.height / 2, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const barrel = {
                angle: p.barrelAngle,
                length: p.barrelLength,
                width: p.barrelWidth,
                color: p.barrelColor,
                borderColor: p.barrelBorderColor
            };

            /* PLAYER NAME BROKEN
            ctx.font = '12px Arial';
            ctx.fillStyle = 'black';
            const textX = p.x;
            const textY = p.y;
            ctx.fillText(p.name, textX, textY);
            */

            const centerX = p.x - player.x + canvas.width / 2;
            const centerY = p.y - player.y + canvas.height / 2;

            const barrelEndX = centerX + Math.cos(barrel.angle) * barrel.length;
            const barrelEndY = centerY + Math.sin(barrel.angle) * barrel.length;

            const angle = barrel.angle;
            const halfWidth = barrel.width / 2;
            const xOffset = Math.cos(angle + Math.PI / 2) * halfWidth;
            const yOffset = Math.sin(angle + Math.PI / 2) * halfWidth;

            const x1 = centerX - xOffset;
            const y1 = centerY - yOffset;
            const x2 = barrelEndX - xOffset;
            const y2 = barrelEndY - yOffset;
            const x3 = barrelEndX + xOffset;
            const y3 = barrelEndY + yOffset;
            const x4 = centerX + xOffset;
            const y4 = centerY + yOffset;

            ctx.strokeStyle = barrel.borderColor;
            ctx.lineWidth = barrel.width + 8;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = barrel.color;
            ctx.lineWidth = barrel.width;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.closePath();
            ctx.stroke();

        }
    });
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    barrel.angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
});

canvas.addEventListener('mousedown', shootBullet);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    clearCanvas();
    drawPlayer();
});

function drawMapArea() {
    const mapX = canvas.width / 2 - mapSize / 2;
    const mapY = canvas.height / 2 - mapSize / 2;
    ctx.fillStyle = mapColor;
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
}

function drawOutOfBounds() {
    ctx.fillStyle = outOfBoundsColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const fps = 120;
const frameInterval = 1000 / fps;
const fpsDisplay = document.getElementById('fps');
const msDisplay = document.getElementById('ms');
const displayUpdateInterval = 500;
let lastTime = 0;
let frameCount = 0;
let deltaTime = 0;
let msPerFrame = 0;
let lastUpdate = 0;
let fps1 = 0;
let showFPS = false;

function updateFPS(timestamp) {
    frameCount++;
    deltaTime = timestamp - lastUpdate;
    if (deltaTime >= displayUpdateInterval) {
        fps1 = Math.round((frameCount * 1000) / deltaTime);
        if (showFPS) {
            fpsDisplay.textContent = `FPS: ${fps1}`;
        }
        frameCount = 0;
        lastUpdate = timestamp;
    }
}

function gameLoop(timestamp) {
    deltaTime = timestamp - lastTime;
    if (deltaTime >= frameInterval) {
        lastTime = timestamp - (deltaTime % frameInterval);
        //drawBarrels(); // Draw other players' barrels
        updateFPS(timestamp);
        clearCanvas();
        drawOutOfBounds();
        drawMapArea();
        drawGrid();
        drawPolygons(ctx);
        drawBullets();
        updatePlayer();
        updateBullets();
        drawOtherPlayers();
        drawPlayer();
        drawMessages(); 
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

gameLoop();