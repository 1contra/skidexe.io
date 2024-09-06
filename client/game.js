const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const changelog = document.getElementById('changelog')
const playerNameInput = document.getElementById('playerName');
const chatInput = document.getElementById('chatInput');
const chatBox = document.getElementById('chatBox'); 
const instructionMessage = document.getElementById('instructionMessage');

const messages = [];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const mapColor = '#f0f0f0';
const outOfBoundsColor = '#808080';
const bullets = [];
const players = new Map();
const playerBarrels = new Map();
const barrels = [];
const polygons = []
let leaderboardPlayers = new Map();
let mapSize = 3000;
let gridSize = 50;

export { polygons }
export let gameStart = false;

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
    maxLifetime: 3000,
    damage: 10,
};

export function getPlayers() {
    return Array.from(players.values());
}

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
    bulletRadius: 7,
    bulletColor: '#00bbff',
    bulletBorderColor: '#006c9e',
    bulletBorderWidth: 2,
    bulletSpeed: 3,
    bulletMaxLifetime: 3000,
    bulletDamage: 10,
    get hitbox() {
        const totalRadius = this.radius + this.borderWidth;
        return {
            x: this.x - totalRadius,
            y: this.y - totalRadius,
            width: totalRadius * 2,
            height: totalRadius * 2
        };
    },
};

export { player };

function setRandomPlayerPosition() {
    player.x = Math.random() * (mapSize - player.radius * 2) + player.radius;
    player.y = Math.random() * (mapSize - player.radius * 2) + player.radius;
}

setRandomPlayerPosition();

export function startGame() {
    const playerName = playerNameInput.value.trim() ||  generateRandomUsername();
    gameStart = true;
    player.name = playerName;
    menu.style.display = 'none';
    canvas.style.display = 'block';
    changelog.style.display = 'none';
    let chatVisible = false;
    let chatBoxFocused = false; // Variable to track if chatbox is focused

    chatInput.addEventListener('focus', () => {
        chatBoxFocused = true;
    });
    
    chatInput.addEventListener('blur', () => {
        chatBoxFocused = false;
    });

    function updateScoreDisplay() {
        const scoreElement = document.getElementById('scoreDisplay');
        scoreElement.textContent = `Score: ${player.score}`;
    }

    function toggleChatVisibility() {
        if (chatVisible) {
            chatBox.classList.remove('visible');
            setTimeout(() => {
                chatBox.style.display = 'none';
            }, 500);
        } else {
            chatBox.style.display = 'block';
            setTimeout(() => {
                chatBox.classList.add('visible');
            }, 10);
        }
        chatVisible = !chatVisible;

        /*
        // Toggle instruction message visibility
        if (chatVisible) {
            instructionMessage.classList.add('hidden');
        } else {
            instructionMessage.classList.remove('hidden');
        }
            */
    }

    document.addEventListener('keydown', (event) => {
        if (!gameStart) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (chatVisible) {
                const message = chatInput.value.trim();
                chatInput.value = '';

                if (message.startsWith('/')) {
                    ws.send(JSON.stringify({
                        type: 'chatCommand',
                        command: message,
                        playerId: player.id,
                        playerX: player.x,
                        playerY: player.y
                    }));
                }
                toggleChatVisibility();
            } else {
                toggleChatVisibility();
                chatInput.focus();
            }
        }
    });

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
                sendPlayerInitialization(ws);
            }
            isConnected = true;
        };
    
        ws.onerror = (error) => {
            console.error('WebSocket Error: ', error);
        };
    
        ws.onmessage = handleMessage;
    
        ws.onclose = () => {
            console.log('WebSocket connection closed. Reconnecting...');
            isConnected = false;
            setTimeout(connectWebSocket, 5000);
            handlePlayerLeaveOnDisconnect();
        };
    
        return ws;
    }
    
    function sendPlayerInitialization(ws) {
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
            playerName: player.name,
            score: player.score,
            id: player.id,
        }));
    }
    
    function handleMessage(event) {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'welcome':
                handleWelcome(data);
                break;
            case 'playerData':
                handlePlayerData(data);
                break;
            case 'playerDisconnect':
                handlePlayerDisconnect(data);
                break;
            case 'playerJoin':
                handlePlayerJoin(data);
                break;
            case 'playerUpdate':
                handlePlayerUpdate(data);
                break;
            case 'bulletUpdate':
                handleBulletUpdate(data);
                break;
            case 'bulletHit':
                handleBulletHit(data);
                break;
            case 'updateBarrels':
                handleUpdateBarrels(data);
                break;
            case 'scoreUpdate':
                handleScoreUpdate(data);
                break;
            case 'updatePolygons':
                handleUpdatePolygons(data);
                break;
        }
    }
    
    function handleWelcome(data) {
        player.id = data.id;
    }
    
    function handlePlayerData(data) {
        data.players.forEach(p => leaderboardPlayers.set(p.id, p));
        updateLeaderboard();
    }
    
    function handlePlayerDisconnect(data) {
        players.delete(data.id);
        handlePlayerLeave(data.id);
        addMessage(`Player ${data.playerName} left`);
    }
    
    function handlePlayerJoin(data) {
        addMessage(`Player ${data.playerName} joined`);
    }
    
    function handlePlayerUpdate(data) {
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
                radius: data.radius,
                score: data.score,
                playerName: data.name,
                bulletRadius: data.bulletRadius,
                bulletSpeed: data.bulletSpeed,
                bulletBorderColor: data.bulletBorderColor,
                bulletBorderWidth: data.bulletBorderWidth,
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
    
    function handleBulletUpdate(data) {
        bullets.push({
            id: data.id,
            x: data.x,
            y: data.y,
            speedX: data.speedX,
            speedY: data.speedY,
            ownerId: data.ownerId,
            color: data.color,
            damage: data.damage
        });
    }
    
    function handleBulletHit(data) {
        const index = bullets.findIndex(b => b.id === data.bulletId);
        if (index > -1) {
            bullets.splice(index, 1);
        }
    }
    
    function handleUpdateBarrels(data) {
        barrels.length = 0;
        barrels.push(...data.barrels);
    }
    
    function handleScoreUpdate(data) {
        if (data.playerId === player.id) {
            player.score = data.score;
            updateScoreDisplay();
        }
    }
    
    function handleUpdatePolygons(data) {
        polygons.length = 0;
        polygons.push(...data.data);
    }
    
    function handlePlayerLeaveOnDisconnect() {
        const player = players.get(id);
        if (player) {
            const playerName = player.playerName;
            players.delete(id);
            broadcast({
                type: 'playerLeave',
                id,
                playerName
            });
            updateLeaderboard();
        }
    }

    function handlePlayerLeave(id) {
        leaderboardPlayers.delete(id);
        updateLeaderboard();
    }

    function formatNumber(num) {
        if (num >= 1e+63) {
            return (num / 1e+63).toFixed(1) + 'ViG'; // vigintillion
        }
        else if (num >= 1e+60) {
            return (num / 1e+60).toFixed(1) + 'NoV'; // novemdecillion
        }
        else if (num >= 1e+57) {
            return (num / 1e+57).toFixed(1) + 'OcToD'; // octodecillion
        }
        else if (num >= 1e+54) {
            return (num / 1e+54).toFixed(1) + 'SePtD'; // septendecillion
        }
        else if (num >= 1e+51) {
            return (num / 1e+51).toFixed(1) + 'SxD'; // sexdecillion
        }
        else if (num >= 1e+48) {
            return (num / 1e+48).toFixed(1) + 'QiD'; // quindecillion
        }
        else if (num >= 1e+45) {
            return (num / 1e+45).toFixed(1) + 'QatD'; // quattuordecillion
        }
        else if (num >= 1e+41) {
            return (num / 1e+41).toFixed(1) + 'TrD'; // tredecillion
        }
        else if (num >= 1e+39) {
            return (num / 1e+39).toFixed(1) + 'DuO'; // duodecillion
        } 
        else if (num >= 1e+36) {
            return (num / 1e+36).toFixed(1) + 'UnD'; // undecillion
        } 
        else if (num >= 1e+33) {
            return (num / 1e+33).toFixed(1) + 'DeC'; // Decillion
        } 
        else if (num >= 1e+30) {
            return (num / 1e+30).toFixed(1) + 'NoN'; // Nonillion
        } 
        else if (num >= 1e+27) {
            return (num / 1e+27).toFixed(1) + 'OcT'; // Octillion
        } 
        else if (num >= 1e+24) {
            return (num / 1e+24).toFixed(1) + 'SeP'; // Septillion
        } 
        else if (num >= 1e+21) {
            return (num / 1e+21).toFixed(1) + 'SeX'; // Sextillion
        } 
        else if (num >= 1e+18) {
            return (num / 1e+18).toFixed(1) + 'Qi'; // Quintillion
        } 
        else if (num >= 1e+15) {
            return (num / 1e+15).toFixed(1) + 'Qa'; // Quadrillion
        } 
        else if (num >= 1e+12) {
            return (num / 1e+12).toFixed(1) + 'T'; // Trillion
        } 
        else if (num >= 1e+9) {
            return (num / 1e+9).toFixed(1) + 'B'; // Billion
        } 
        else if (num >= 1e+6) {
            return (num / 1e+6).toFixed(1) + 'M'; // Million
        } 
        else if (num >= 1e+3) {
            return (num / 1e+3).toFixed(1) + 'K'; // Thousand
        } 
        else {
            return num.toString();
        }
    }
    
    const previousPositions = new Map();
    const targetPositions = new Map();

    const x = canvas.width - 200;
    const y = 20;
    const lineHeight = 20;

    function updateLeaderboard() {
        const playerArray = Array.from(leaderboardPlayers.values());
        playerArray.sort((a, b) => b.score - a.score);
        const topPlayers = playerArray.slice(0, 10);
        const spacing = 5;
        topPlayers.forEach((player, index) => {
            const newYPosition = y + (lineHeight + spacing) * (index + 1);
            if (!targetPositions.has(player.id)) {
                targetPositions.set(player.id, newYPosition);
            } else {
                targetPositions.set(player.id, newYPosition);
            }
        });

        drawLeaderboard(topPlayers);
    }

    function drawLeaderboard() {

        if (gameStart) {

            const playerArray = Array.from(leaderboardPlayers.values());
            playerArray.sort((a, b) => b.score - a.score);
            const x = canvas.width - 200;
            const lineHeight = 15;
            const fontSize = 30;
            const lineWidth = 5;
            ctx.font = `${fontSize}px Arial Black`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'white';
            ctx.strokeText('LEADERBOARD', x - 60, y);
            ctx.fillText('LEADERBOARD', x - 60, y);
            const myId = player.id;

            Array.from(targetPositions.keys()).forEach((playerId) => {
                const targetY = targetPositions.get(playerId);
                const previousY = previousPositions.get(playerId) || targetY;
                const playerY = previousY + (targetY - previousY) * 0.1;
                const fontSize = 13;
                ctx.font = `${fontSize}px Arial Black`;
                previousPositions.set(playerId, playerY);
                const player = leaderboardPlayers.get(playerId);

                if (!player) {
                    targetPositions.delete(playerId);
                    return;
                }

                const isMyself = player.id === myId;
                ctx.fillStyle = isMyself ? '#00bbff' : '#ff2a1c';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.roundRect(x - 20, playerY - lineHeight / 2 + 20, 200, lineHeight, 7);
                ctx.stroke();
                ctx.fill();
                const tankX = x - 40;
                const tankY = playerY + lineHeight / 4 + 16;
                drawTank(ctx, tankX, tankY, player, myId);
                const formattedScore = formatNumber(player.score);
                ctx.fillStyle = 'black';
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'black';
                ctx.fillStyle = 'white';
                ctx.strokeText(`${player.playerName} - ${formattedScore}`, x + 20, playerY + 14);
                ctx.fillText(`${player.playerName} - ${formattedScore}`, x + 20, playerY + 14);

                
            });

        }

    }

    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        const ctx = this;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arc(x + width - radius, y + radius, radius, -Math.PI / 2, 0);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
        ctx.lineTo(x + radius, y + height);
        ctx.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
        ctx.lineTo(x, y + radius);
        ctx.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);
        ctx.closePath();
    };

    function drawTank(ctx, centerX, centerY, player, myId) {
        const isMyself = player.id === myId;
        const barrel = {
            angle: player.barrelAngle || 0,
            length: player.barrelLength || 10,
            width: player.barrelWidth || 1,
            color: player.barrelColor || '#8f8f8f',
            borderColor: player.barrelBorderColor || '#6e6e6e'
        };

        ctx.fillStyle = isMyself ? '#00bbff' : '#ff2a1c';
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
        ctx.fillStyle = isMyself ? '#00bbff' : '#ff2a1c';
        ctx.strokeStyle = isMyself ? '#007fad' : '#990900';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, player.radius || 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    function drawPolygons(ctx, timestamp) {
        polygons.forEach(polygon => {
            ctx.save();
            ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);
            drawPolygon(ctx, polygon, timestamp);
            ctx.restore();
        });
    }
    
    const baseHealthValues = [9, 19, 49, 99, 199, 999, 1999, 2999];
    
    const polygonColors = {
        '3': '#FF443D',
        '4': '#ffed4a',
        '5': '#2b99ff',
        '6': '#3F51B5',
        '7': '#ff80ab',
        '8': '#00dbc7',
        '9': '#7affba',
        '10': '#09040a'
    };
    
    /*
    const oscillationSettings = {
        0: { colorAdjustment: 0, oscillationRange: 0, oscillationSpeed: 0, tpLevel: 0.1 },
        1: { colorAdjustment: 20, oscillationRange: 0, oscillationSpeed: 0, tpLevel: 0.1 },
        2: { colorAdjustment: 40, oscillationRange: 1, oscillationSpeed: 0.001, tpLevel: 0.2 },
        3: { colorAdjustment: 60, oscillationRange: 1.2, oscillationSpeed: 0.002, tpLevel: 0.3 },
        4: { colorAdjustment: 100, oscillationRange: 1.4, oscillationSpeed: 0.003, tpLevel: 0.4 },
        5: { colorAdjustment: 150, oscillationRange: 1.6, oscillationSpeed: 0.004, tpLevel: 0.5 },
        6: { colorAdjustment: 200, oscillationRange: 1.8, oscillationSpeed: 0.005, tpLevel: 0.6 },
        7: { colorAdjustment: 250, oscillationRange: 2, oscillationSpeed: 0.006, tpLevel: 0.7 },
        8: { colorAdjustment: 300, oscillationRange: 2.2, oscillationSpeed: 0.007, tpLevel: 0.8 },
        9: { colorAdjustment: 350, oscillationRange: 2.4, oscillationSpeed: 0.008, tpLevel: 0.9},
        10: { colorAdjustment: 400, oscillationRange: 4, oscillationSpeed: 0.01, tpLevel: .5 },
    };
    */

    const oscillationSettings = {
        0: { colorAdjustment: 0, oscillationRange: 0, oscillationSpeed: 0, tpLevel: 0.1 },
        1: { colorAdjustment: 50, oscillationRange: 0, oscillationSpeed: 0, tpLevel: 0.1 },
        2: { colorAdjustment: 50, oscillationRange: 1, oscillationSpeed: 0.001, tpLevel: 0.2 },
        3: { colorAdjustment: 50, oscillationRange: 1.2, oscillationSpeed: 0.0015, tpLevel: 0.25 },
        4: { colorAdjustment: 50, oscillationRange: 1.4, oscillationSpeed: 0.002, tpLevel: 0.27 },
        5: { colorAdjustment: 50, oscillationRange: 1.6, oscillationSpeed: 0.0025, tpLevel: 0.3 },
        6: { colorAdjustment: 60, oscillationRange: 1.8, oscillationSpeed: 0.003, tpLevel: 0.33 },
        7: { colorAdjustment: 70, oscillationRange: 2, oscillationSpeed: 0.0035, tpLevel: 0.39 },
        8: { colorAdjustment: 80, oscillationRange: 2.2, oscillationSpeed: 0.004, tpLevel: 0.42 },
        9: { colorAdjustment: 90, oscillationRange: 2.4, oscillationSpeed: 0.0045, tpLevel: 0.45 },
        10: { colorAdjustment: 100, oscillationRange: 2.6, oscillationSpeed: 0.005, tpLevel: 0.5 },
        11: { colorAdjustment: 110, oscillationRange: 2.8, oscillationSpeed: 0.055, tpLevel: 0.52 },
        12: { colorAdjustment: 120, oscillationRange: 3, oscillationSpeed: 0.06, tpLevel: 0.54 },
        13: { colorAdjustment: 130, oscillationRange: 3.2, oscillationSpeed: 0.0065, tpLevel: 0.56 },
        14: { colorAdjustment: 140, oscillationRange: 3.4, oscillationSpeed: 0.007, tpLevel: 0.58 },
        15: { colorAdjustment: 150, oscillationRange: 3.6, oscillationSpeed: 0.0075, tpLevel: 0.60 },
        16: { colorAdjustment: 160, oscillationRange: 3.8, oscillationSpeed: 0.008, tpLevel: 0.62 },
        17: { colorAdjustment: 170, oscillationRange: 4, oscillationSpeed: 0.0085, tpLevel: 0.64 },
        18: { colorAdjustment: 180, oscillationRange: 4.2, oscillationSpeed: 0.009, tpLevel: 0.66 },
        19: { colorAdjustment: 190, oscillationRange: 4.4, oscillationSpeed: 0.0095, tpLevel: 0.68 },
        20: { colorAdjustment: 200, oscillationRange: 4.6, oscillationSpeed: 0.01, tpLevel: 0.7 }
    };
    
    function hexToRgb(hex) {
        if (typeof hex !== 'string' || (hex.length !== 4 && hex.length !== 7)) {
            throw new Error('Invalid hex color format');
        }

        if (hex[0] === '#') {
            hex = hex.slice(1);
        }
    
        let r = 0, g = 0, b = 0;

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        }

        else if (hex.length === 6) {
            r = parseInt(hex[0] + hex[1], 16);
            g = parseInt(hex[2] + hex[3], 16);
            b = parseInt(hex[4] + hex[5], 16);
        }
    
        return [r, g, b];
    }
    
    function adjustColor(baseColor, timestamp, range = 50) {
        try {
            const [baseR, baseG, baseB] = hexToRgb(baseColor);
            const r = Math.min(255, Math.max(0, baseR + Math.sin(timestamp * 0.001) * range));
            const g = Math.min(255, Math.max(0, baseG + Math.sin(timestamp * 0.002) * range));
            const b = Math.min(255, Math.max(0, baseB + Math.sin(timestamp * 0.003) * range));
    
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        } catch (e) {
            console.error('Error adjusting color:', e);
            return baseColor;
        }
    }
    
    function darkenColor(color, factor = 0.7) {
        const rgb = color.match(/\d+/g).map(Number);
        const r = Math.max(Math.floor(rgb[0] * factor), 0);
        const g = Math.max(Math.floor(rgb[1] * factor), 0);
        const b = Math.max(Math.floor(rgb[2] * factor), 0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function brightenColor(color, factor = 1.3) {
        const rgb = color.match(/\d+/g).map(Number);
        factor = Math.max(factor, 1.0);
        const r = Math.min(Math.floor(rgb[0] * factor), 255);
        const g = Math.min(Math.floor(rgb[1] * factor), 255);
        const b = Math.min(Math.floor(rgb[2] * factor), 255);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    function drawPolygon(ctx, polygon, timestamp) {
        ctx.save();
        ctx.translate(polygon.x, polygon.y);
        ctx.rotate(polygon.angle);
        const angleStep = (2 * Math.PI) / polygon.sides;
        let prevX, prevY, firstX, firstY;
        const sidesIndex = polygon.sides - 3; 
        polygon.baseHealth = baseHealthValues[sidesIndex] || 10;
        const oscillationRange = 1;
        const borderWidth = 4;
    
        if (oscillationRange > 0) {
            ctx.save();
            const baseColor = polygonColors[polygon.sides];
            const settings = oscillationSettings[polygon.radiant] || { colorAdjustment: 0, oscillationRange: 0, oscillationSpeed: 0 };
            const { colorAdjustment, oscillationRange, oscillationSpeed, tpLevel } = settings;
            const minSizeFactor = 1; 
            const maxSizeFactor = 1 + oscillationRange;
            const sizeFactor = minSizeFactor + (maxSizeFactor - minSizeFactor) * (0.5 * (Math.sin(timestamp * oscillationSpeed) + 1));
            const largerRadius = polygon.radius * sizeFactor;
            ctx.globalAlpha = tpLevel;
            ctx.beginPath();
    
            for (let i = 0; i < polygon.sides; i++) {
                const startAngle = polygon.angle;
                const angle = startAngle + i * angleStep;
                const x = Math.cos(angle) * largerRadius;
                const y = Math.sin(angle) * largerRadius;
    
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
            const color = adjustColor(baseColor, timestamp, colorAdjustment);
            ctx.fillStyle = brightenColor(color, 0.5);
            ctx.fill();
            ctx.strokeStyle = darkenColor(color, 0.7);
            ctx.lineWidth = borderWidth;
            ctx.stroke();
            ctx.restore();
        }

        // Draw triangle spikes if polygon is radiant 10
        if (polygon.radiant === 10) {
            drawSpikes(ctx, polygon, timestamp);
        }
    
        ctx.beginPath();
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
        const baseColor = polygonColors[polygon.sides];

        function getAdjustmentValue(radiant) {
            // You can adjust this function to fit your specific pattern
            const baseValues = [0, 50, 50, 50, 50, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200 /*350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900*/];
            return baseValues[radiant] || 0;
        }

        const adjustment = getAdjustmentValue(polygon.radiant);

        if (!baseColor) {
            console.error('Unknown polygon shape:', polygon.shape);
            ctx.fillStyle = '#FFFFFF';
        } else {
            if (polygon.radiant === 0) {
                ctx.fillStyle = polygon.color;
                ctx.strokeStyle = polygon.borderColor;
            } else if (polygon.radiant >= 1) {
                const color = adjustColor(baseColor, timestamp, adjustment);
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            }
        }
    
        ctx.globalAlpha = polygon.opacity;
        ctx.fill();
        ctx.lineWidth = 4
        ctx.stroke();
        ctx.restore();
        if (polygon.health <= 0) return;
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

    function drawSpikes(ctx, polygon, timestamp) {
        const baseColor = polygonColors[polygon.sides];
        const settings = oscillationSettings[polygon.radiant] || { colorAdjustment: 0, oscillationRange: 0, oscillationSpeed: 0 };
        const { colorAdjustment, oscillationRange, oscillationSpeed, tpLevel } = settings;
        const minSizeFactor = 1; 
        const maxSizeFactor = 1 + oscillationRange;
        const sizeFactor = minSizeFactor + (maxSizeFactor - minSizeFactor) * (0.5 * (Math.sin(timestamp * oscillationSpeed) + 1));
        const largerRadius = polygon.radius * sizeFactor;
        const numSpikes = polygon.sides;
        const spikeCount = polygon.sides;; // Number of spikes
        //const spikeLength = polygon.radius * 1.5;
        const spikeWidth = polygon.radius / 4;
        const angleStep = (2 * Math.PI) / numSpikes;
        const spinSpeed = 0.01; // Speed of spinning
        const rotationSpeed = 0.002; // Speed of rotation

        // Function to convert hex color to RGBA
        function hexToRgba(hex, alpha) {
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    
        ctx.save();
        ctx.translate(0, 0); // Center of the polygon

        // Determine the current rotation angle based on the timestamp
        let rotationAngle = timestamp * rotationSpeed;

        let spikeLength = 20; // Length from the center to the tip of the triangle
        const baseLength = 10;  // Length of the base of the triangle, closer to the center
        const fasterRotationSpeed = 0.1; // Faster rotation speed for the second set

        for (let i = 0; i < spikeCount; i++) {
            const angle = i * angleStep + rotationAngle;

            // Calculate the tip point of the triangle (long end pointing outward)
            const xTip = Math.cos(angle) * (polygon.radius + spikeLength);
            const yTip = Math.sin(angle) * (polygon.radius + spikeLength);

            // Calculate the base points of the triangle (short end towards the center)
            const xBase1 = Math.cos(angle + angleStep / 2) * (polygon.radius);
            const yBase1 = Math.sin(angle + angleStep / 2) * (polygon.radius);

            const xBase2 = Math.cos(angle - angleStep / 2) * (polygon.radius);
            const yBase2 = Math.sin(angle - angleStep / 2) * (polygon.radius);

            ctx.beginPath();
            ctx.moveTo(xTip, yTip); // Tip of the triangle (pointy end)
            ctx.lineTo(xBase1, yBase1); // One base point of the triangle
            ctx.lineTo(xBase2, yBase2); // The other base point of the triangle
            ctx.closePath(); // Complete the triangle
            ctx.lineWidth = spikeWidth; // Adjust line width if needed
            const color = adjustColor(baseColor, timestamp, colorAdjustment);
            ctx.strokeStyle = darkenColor(color, 0.5);
            ctx.stroke();
            const color2 = darkenColor(baseColor, timestamp, colorAdjustment);
            ctx.fillStyle = brightenColor(color2, 0.8); // Optional: fill color
            ctx.fill(); // Fill the triangle with color
        }

        ctx.restore();
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

    function updatePlayerRadius(player) {
        const baseRadius = 15;
        const growthRate = 0.5; // Adjusted growth rate for more gradual growth
        const maxRadius = 100;
    
        // Using logarithm with a controlled growth
        player.radius = Math.min(baseRadius + growthRate * Math.log(player.score + 1), maxRadius);
    
        const baseBulletRadius = 7;
        const bulletGrowthRate = 0.5; // Adjusted growth rate for bullets
        const maxBulletRadius = 15;
    
        player.bulletRadius = Math.min(baseBulletRadius + bulletGrowthRate * Math.log(player.score + 1), maxBulletRadius);
    
        const baseBarrelLength = 20;
        const baseBarrelWidth = 7;
        const barrelGrowthRate = 1; // Adjusted growth rate for barrel
        const maxBarrelLength = 300;
        const maxBarrelWidth = 15;
    
        barrel.length = Math.min(baseBarrelLength + barrelGrowthRate * Math.log(player.score + 1), maxBarrelLength);
        barrel.width = Math.min(baseBarrelWidth + barrelGrowthRate * Math.log(player.score + .5), maxBarrelWidth);
    }
    
    function drawPlayer() {
        if (player.id !== player.id) return; 
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
    
    
        function drawBullets() {
            bullets.forEach(bullet => {
                // Get the player who owns the bullet from the players map
                const owner = players.get(bullet.ownerId);
                //console.log({players})
                
                // If the owner exists, proceed with drawing
                if (owner) {
                    const isOwnedBySelf = bullet.ownerId === player.id;
                    const bulletColor = isOwnedBySelf ? owner.bulletColor : '#ff2a1c';
                    const bulletBorderColor = isOwnedBySelf ? owner.bulletBorderColor : '#990900';
                    
                    ctx.strokeStyle = bulletBorderColor;
                    ctx.lineWidth = owner.bulletBorderWidth * 2; // Use the owner's bullet border width
                    ctx.beginPath();
                    ctx.arc(bullet.x - player.x + canvas.width / 2, bullet.y - player.y + canvas.height / 2, owner.bulletRadius + owner.bulletBorderWidth, 0, Math.PI * 2); // Use the owner's bullet radius
                    ctx.stroke();
                    
                    ctx.fillStyle = bulletColor;
                    ctx.beginPath();
                    ctx.arc(bullet.x - player.x + canvas.width / 2, bullet.y - player.y + canvas.height / 2, owner.bulletRadius, 0, Math.PI * 2); // Use the owner's bullet radius
                    ctx.fill();
                } 

                const isOwnedBySelf = bullet.ownerId === player.id;

                if (!isOwnedBySelf) return;

                const bulletColor = isOwnedBySelf ? player.bulletColor : '#ff2a1c';
                const bulletBorderColor = isOwnedBySelf ? player.bulletBorderColor : '#990900';
                ctx.strokeStyle = bulletBorderColor;
                ctx.lineWidth = player.bulletBorderWidth * 2;
                ctx.beginPath();
                ctx.arc(bullet.x - player.x + canvas.width / 2, bullet.y - player.y + canvas.height / 2, player.bulletRadius + player.bulletBorderWidth, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = bulletColor;
                ctx.beginPath();
                ctx.arc(bullet.x - player.x + canvas.width / 2, bullet.y - player.y + canvas.height / 2, player.bulletRadius, 0, Math.PI * 2);
                ctx.fill();



            });
        }
            

    const keys = {
        w: false,
        a: false,
        s: false,
        d: false
    };

    // Function to handle keydown events
    function handleKeyDown(event) {
        if (chatBoxFocused) return; // Do nothing if chatbox is focused

        switch (event.key) {
            case 'w':
                if (chatBoxFocused) return;
                keys.w = true;
                break;
            case 'a':
                if (chatBoxFocused) return;
                keys.a = true;
                break;
            case 's':
                if (chatBoxFocused) return;
                keys.s = true;
                break;
            case 'd':
                if (chatBoxFocused) return;
                keys.d = true;
                break;
        }
    }

    // Function to handle keyup events
    function handleKeyUp(event) {
        switch (event.key) {
            case 'w':
                keys.w = false;
                break;
            case 'a':
                keys.a = false;
                break;
            case 's':
                keys.s = false;
                break;
            case 'd':
                keys.d = false;
                break;
        }
    }

    // Attach event listeners for keydown and keyup
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    function updatePlayer() {
        if (!gameStart) return;
        let accelerationX = 0;
        let accelerationY = 0;
        if (!chatBoxFocused) { // Only process movement if chatbox is not focused
            if (keys.w) accelerationY -= player.speed;
            if (keys.a) accelerationX -= player.speed;
            if (keys.s) accelerationY += player.speed;
            if (keys.d) accelerationX += player.speed;
        }
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
                radius: player.radius,
                score: player.score,
                playerName: player.name,
                bulletRadius: player.bulletRadius,
                bulletSpeed: player.bulletSpeed,
                bulletBorderColor: player.bulletBorderColor,
                bulletBorderWidth: player.bulletBorderWidth,
    
            }));
        } else {
            console.warn('WebSocket is not open. Message not sent.');
        }
    }
    
    function updateBullets() {
        //if (!gameStart) return;
        const hitPolygons = new Set();
        bullets.forEach((bullet, index) => {

            if (typeof bullet !== 'object' || bullet === null) {
                return;
            }
            bullet.x += bullet.speedX;
            bullet.y += bullet.speedY;
            bullet.lifetime += 16.67;

            if (bullet.x < 0 || bullet.x > mapSize || bullet.y < 0 || bullet.y > mapSize || bullet.lifetime > player.bulletMaxLifetime) {
                bullets.splice(index, 1);
                return;
            }
    
            if (bullet.ownerId !== player.id) {
                const dx = player.x - bullet.x;
                const dy = player.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const expandedPlayerRadius = player.radius + 2;
    
                if (distance < expandedPlayerRadius + player.bulletRadius) {
                    bullets.splice(index, 1);
                    return;
                }
            }
    
            polygons.forEach(polygon => {
                if (checkBulletPolygonCollision(bullet, polygon) && !hitPolygons.has(polygon)) {
                        hitPolygons.add(polygon);
                        if (polygon.health <= 0) {
                            if (bullet.ownerId === player.id) {
                                //console.log("Polygon destroyed. Player's new score:", player.score);
                                const collisionData = {
                                    type: 'polygonHit',
                                    playerId: player.id,
                                    playerName: player.name,
                                    bulletId: bullet.id,
                                    polygonId: polygon.id,
                                    score: polygon.score
                                };
                                if (ws && ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify(collisionData));
                                }
                            }
                        }
    
                    if (polygon.isFading) return;
                    bullets.splice(index, 1);
                    //console.log("bullet hit polygon")
                    return;
                }
            });
    
            players.forEach((p, id) => {
                if (id !== player.id && id !== bullet.ownerId) {
                    const playerDx = p.x - bullet.x;
                    const playerDy = p.y - bullet.y;
                    const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
                    if (playerDistance < 15 + player.bulletRadius) {
                        bullets.splice(index, 1);
                        //console.log("bullet hit player")
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
            speedX: Math.cos(barrel.angle) * player.bulletSpeed,
            speedY: Math.sin(barrel.angle) * player.bulletSpeed,
            ownerId: player.id,
            color: player.bulletColor,
            borderWidth: player.bulletBorderWidth,
            damage: player.bulletDamage,
        };
        ws.send(JSON.stringify({
            type: 'shoot',
            x: bullet.x,
            y: bullet.y,
            speedX: bullet.speedX,
            speedY: bullet.speedY,
            ownerId: bullet.ownerId,
            color: bullet.color,
            borderWidth: player.bulletBorderWidth,
            damage: player.bulletDamage,
        }));
    }
    
    function drawOtherPlayers() {
        players.forEach((p, id) => {
            if (id !== player.id) {
                ctx.fillStyle = '#ff2a1c';
                ctx.strokeStyle = '#990900';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(p.x - player.x + canvas.width / 2, p.y - player.y + canvas.height / 2, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                //console.log({p})
    
                const barrel = {
                    angle: p.barrelAngle || 0,
                    length: p.barrelLength || 10,
                    width: p.barrelWidth || 1,
                    color: p.barrelColor || '#8f8f8f',
                    borderColor: p.barrelBorderColor || '#6e6e6e',
                };
    
                /* PLAYER NAME BROKEN
                ctx.font = '12px Arial';
                ctx.fillStyle = 'black';
                const textX = p.x;
                const textY = p.y;
                ctx.fillText(p.name, textX, textY);
                */
    
                const centerX = p.x - p.x + canvas.width / 2;
                const centerY = p.y - p.y + canvas.height / 2;
                const barrelEndX = centerX + Math.cos(p.barrelAngle) * p.barrelLength;
                const barrelEndY = centerY + Math.sin(p.barrelAngle) * p.barrelLength;
                const angle = p.barrelAngle;
                const halfWidth = p.barrelWidth / 2;
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
                ctx.strokeStyle = p.barrelBorderColor;
                ctx.lineWidth = p.barrelWidth + 8;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineTo(x4, y4);
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = p.barrelColor;
                ctx.lineWidth = p.barrelWidth;
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
    
    /*
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key in keys) keys[e.key] = false;
    });
    */
    
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
    const displayUpdateInterval = 500;
    let lastTime = 0;
    let frameCount = 0;
    let deltaTime = 0;
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
            //drawBarrels();
            updateFPS(timestamp);
            clearCanvas();
            drawOutOfBounds();
            drawMapArea();
            drawGrid();
            drawPolygons(ctx, timestamp);
            drawBullets();
            updateBullets();
            drawOtherPlayers();
            drawPlayer();
            drawMessages(); 
            drawLeaderboard(ctx);
            updateLeaderboard();
            updatePlayer();
            updatePlayerRadius(player);
            //renderInstructions();
            //handleChatVisibility();
            //updatePlayerRadius();
            //updateScoreDisplay();
            //console.log({players})
            console.log(polygons);
    
        }
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    
    const ws = connectWebSocket(); 
    gameLoop();
}

