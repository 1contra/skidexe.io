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
export let gameStart = false;
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
let leaderboardPlayers = new Map();

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
    maxLifetime: 3000,
    damage: 10,
};

export function getPlayers() {
    return Array.from(players.values());
}

/*
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
*/

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

// Function to show the popup
function showPopup() {
    usernamePopup.classList.remove('hidden');
}

function generateRandomUsername() {
    const randomNumber = Math.floor(Math.random() * 10000);
    return `Player${randomNumber}`;
}

export function startGame() {

    const playerName = playerNameInput.value.trim() ||  generateRandomUsername();


    gameStart = true;
    player.name = playerName;
    menu.style.display = 'none';
    canvas.style.display = 'block';
    changelog.style.display = 'none';
    //connectWebSocket();

    function updateScoreDisplay() {
        const scoreElement = document.getElementById('scoreDisplay');
        scoreElement.textContent = `Score: ${player.score}`;
    
        /*
        // Send the updated score to the server
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'updateScore',
                score: player.score
            }));
        } else {
            console.error('WebSocket connection is not open.');
        }
            */
    
    }

    /*
    function updateLeaderboard() {
        const leaderboardElement =document.getElementById('leaderboard');
        const leaderboardList = domument.getElementById('leaderboard-list');
    
        if (gameStart) {
            leaderboardElement.style.display = 'block';
    
            const players = getPlayers();
            players.sort((a, b) => b.score - a.score);
            const top = players.lastIndexOf(0, 10);
    
            leaderboardList.innerHTML = '';
    
            top.array.forEach(player => {
                const listItem = document.createElement('li');
                listItem.textContent = `${player.name}: ${player.score}`;
                leaderboardList.appendChild(listItem);
            });
        } else {
            leaderboardElement.style.display = 'none';
        }
    }
    */

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
            //ws.close();
            console.log('WebSocket connection already established.');
            //return;
        }
        
        const ws = new WebSocket('ws://localhost:3000');
    
        ws.onopen = () => {
            //if (isConnected) return;
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
                    playerName: player.name,
                    score: player.score,
    
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

            else if (data.type === 'playerData') {
                // Update the Map with player data
                data.players.forEach(player => {
                    leaderboardPlayers.set(player.id, player);
                });

                // Optionally, sort and slice to get the top 10 players
                updateLeaderboard(); // Custom function to sort and update the leaderboard
            }
    
            else if (data.type === 'playerDisconnect') {
    
                players.delete(data.id);
    
                //addMessage(`Player ${data.playerName} left`);
    
            } 
    
            else if (data.type === 'playerJoin') {
    
                addMessage(`Player ${data.playerName} joined`);
    
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
                        radius: data.radius,
                        score: player.score,
                        playerName: player.name
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
                    color: data.color,
                    bullet: data.damage
    
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
                        radiant: polygon.radiant,
    
    
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

    function formatNumber(num) {
        if (num >= 1e12) {
            return (num / 1e12).toFixed(1) + 't'; // Trillion
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(1) + 'b'; // Billion
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'm'; // Million
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'k'; // Thousand
        } else {
            return num.toString();
        }
    }
    
    const previousPositions = new Map();
    const targetPositions = new Map();

    const x = canvas.width - 200;
    const y = 20;          // Define y here so it's accessible in both functions
    const lineHeight = 20; // Define lineHeight here so it's accessible in both functions

    function updateLeaderboard() {
        const playerArray = Array.from(leaderboardPlayers.values());
        playerArray.sort((a, b) => b.score - a.score);
    
        const topPlayers = playerArray.slice(0, 10);
        
        // Update the target positions map
        topPlayers.forEach((player, index) => {
            if (!targetPositions.has(player.id)) {
                targetPositions.set(player.id, y + lineHeight * (index + 1));
            } else {
                targetPositions.set(player.id, y + lineHeight * (index + 1));
            }
        });

        drawLeaderboard(topPlayers);
    }

    function drawLeaderboard() {

        if (gameStart) {

            const playerArray = Array.from(leaderboardPlayers.values());
            playerArray.sort((a, b) => b.score - a.score);

            const x = canvas.width - 200;
            //const y = 20;
            const lineHeight = 15;
            const fontSize = 20;
            const lineWidth = 5; // Adjust this value for line thickness

            //ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing

            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';

            ctx.fillText('Leaderboard', x, y);

            const myId = player.id;

            Array.from(targetPositions.keys()).forEach((playerId) => {
                const targetY = targetPositions.get(playerId);
                const previousY = previousPositions.get(playerId) || targetY;
                const playerY = previousY + (targetY - previousY) * 0.1; // Interpolate position
                const fontSize = 15;
                ctx.font = `${fontSize}px Arial`;
    
                previousPositions.set(playerId, playerY);
    
                const player = leaderboardPlayers.get(playerId);
                const isMyself = player.id === myId;
                

                
                
                
                ctx.fillStyle = isMyself ? '#00bbff' : '#ff2a1c';
    
                ctx.strokeStyle = 'black';
                ctx.lineWidth = lineWidth;
    
                // Draw background rectangle
                ctx.beginPath();
                ctx.roundRect(x, playerY - lineHeight / 2 + 10, 150, lineHeight, 7);
                ctx.stroke();
                ctx.fill();

                // Draw the player's tank
                const tankX = x - 20; // Position tank to the left of the text
                const tankY = playerY + lineHeight / 4 + 6; // Center tank vertically
                drawTank(ctx, tankX, tankY, player, myId);
    
                const formattedScore = formatNumber(player.score);
                ctx.fillStyle = 'black';
                ctx.fillText(`          ${player.playerName} - ${formattedScore}`, x, playerY + 3);
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
    
        // Draw the player's barrel
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
        
        // Draw the player's tank circle
        ctx.fillStyle = isMyself ? '#00bbff' : '#ff2a1c';
        ctx.strokeStyle = isMyself ? '#007fad' : '#990900';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, player.radius || 7, 0, Math.PI * 2); // Default radius of 10 if undefined
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
        10: { colorAdjustment: 400, oscillationRange: 4, oscillationSpeed: 0.01, tpLevel: 1 },
    };
    
    function hexToRgb(hex) {
        // Ensure hex is a string and has the correct length
        if (typeof hex !== 'string' || (hex.length !== 4 && hex.length !== 7)) {
            throw new Error('Invalid hex color format');
        }
    
        // Remove the leading '#' if it's present
        if (hex[0] === '#') {
            hex = hex.slice(1);
        }
    
        let r = 0, g = 0, b = 0;
    
        // 3 digits
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        }
        // 6 digits
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
    
            // Create variations in the range of the base color
            const r = Math.min(255, Math.max(0, baseR + Math.sin(timestamp * 0.001) * range));
            const g = Math.min(255, Math.max(0, baseG + Math.sin(timestamp * 0.002) * range));
            const b = Math.min(255, Math.max(0, baseB + Math.sin(timestamp * 0.003) * range));
    
            return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        } catch (e) {
            console.error('Error adjusting color:', e);
            return baseColor; // Fallback to base color if there's an error
        }
    }
    
    function darkenColor(color, factor = 0.7) {
        // Extract the RGB values from the color string
        const rgb = color.match(/\d+/g).map(Number);
        // Calculate the darker color
        const r = Math.max(Math.floor(rgb[0] * factor), 0);
        const g = Math.max(Math.floor(rgb[1] * factor), 0);
        const b = Math.max(Math.floor(rgb[2] * factor), 0);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function brightenColor(color, factor = 1.3) {
        // Extract the RGB values from the color string
        const rgb = color.match(/\d+/g).map(Number);
        
        // Ensure factor is greater than 1 to brighten
        factor = Math.max(factor, 1.0);
    
        // Calculate the brighter color
        const r = Math.min(Math.floor(rgb[0] * factor), 255);
        const g = Math.min(Math.floor(rgb[1] * factor), 255);
        const b = Math.min(Math.floor(rgb[2] * factor), 255);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    function drawPolygon(ctx, polygon, timestamp) {
        ctx.save();
        ctx.translate(polygon.x, polygon.y);
        ctx.rotate(polygon.angle);
        const cornerRadius = polygon.radius * 0.2;
    
    
        //ctx.beginPath();
        const angleStep = (2 * Math.PI) / polygon.sides;
        //const startAngle = 0;
        let prevX, prevY, firstX, firstY;
        
        const sidesIndex = polygon.sides - 3; 
        polygon.baseHealth = baseHealthValues[sidesIndex] || 10;
    
        // Parameters for the oscillating polygon
        const oscillationRange = 1; // Range of oscillation (e.g., 0.2 = +/-20%)
        const oscillationSpeed = .001; // Speed of oscillation (larger value = faster oscillation)
        const borderWidth = 4; // Width of the border
    
        if (oscillationRange > 0) {
    
            ctx.save();
    
            const baseColor = polygonColors[polygon.sides];
    
            // Get the settings for the current radiant level
            const settings = oscillationSettings[polygon.radiant] || { colorAdjustment: 0, oscillationRange: 0, oscillationSpeed: 0 };
            const { colorAdjustment, oscillationRange, oscillationSpeed, tpLevel } = settings;
    
            // Calculate oscillation size
            const minSizeFactor = 1; // Minimum size is the original size
            const maxSizeFactor = 1 + oscillationRange; // Maximum size increase factor
            const sizeFactor = minSizeFactor + (maxSizeFactor - minSizeFactor) * (0.5 * (Math.sin(timestamp * oscillationSpeed) + 1)); // Oscillates between minSizeFactor and maxSizeFactor
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
    
            // Use base color for the larger polygon
            const color = adjustColor(baseColor, timestamp, colorAdjustment); // Apply color adjustment
            ctx.fillStyle = brightenColor(color, 0.5); // Slightly darker color for effect
            ctx.fill();
            // Draw the border for the oscillated polygon
            ctx.strokeStyle = darkenColor(color, 0.7);
            ctx.lineWidth = borderWidth;
            ctx.stroke();
    
            ctx.restore(); // Restore context to previous state
        }
    
        //ctx.save();
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
    
        // Use base color for the polygon
        const baseColor = polygonColors[polygon.sides];
        if (!baseColor) {
            console.error('Unknown polygon shape:', polygon.shape);
            ctx.fillStyle = '#FFFFFF'; // Default to white if shape not found
        } else {
            // Check if polygon.radiant is 0
            if (polygon.radiant === 0) {
                ctx.fillStyle = polygon.color; // Use the base color directly
                ctx.strokeStyle = polygon.borderColor;
            } else if (polygon.radiant === 1) {
                const color = adjustColor(baseColor, timestamp, 20); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 2) {
                const color = adjustColor(baseColor, timestamp, 40); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 3) {
                const color = adjustColor(baseColor, timestamp, 60); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 4) {
                const color = adjustColor(baseColor, timestamp, 100); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 5) {
                const color = adjustColor(baseColor, timestamp, 150); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 6) {
                const color = adjustColor(baseColor, timestamp, 200); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 7) {
                const color = adjustColor(baseColor, timestamp, 250); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 8) {
                const color = adjustColor(baseColor, timestamp, 300); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 9) {
                const color = adjustColor(baseColor, timestamp, 350); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            } else if (polygon.radiant === 10) {
                const color = adjustColor(baseColor, timestamp, 400); // Apply color adjustment
                ctx.fillStyle = color;
                ctx.strokeStyle = darkenColor(color, 0.7);
            }
        }
    
        //ctx.fillStyle = color;
        ctx.globalAlpha = polygon.opacity;
        ctx.fill();
    
        //ctx.strokeStyle = darkenColor(color, 0.7)
        ctx.lineWidth = 4
        ctx.stroke();
        ctx.restore();
    
        /*
        ctx.save();
        ctx.translate(polygon.x, polygon.y);
        ctx.rotate(polygon.angle);
        ctx.font = '12px Arial'; // Set font style
        ctx.fillStyle = 'red'; // Set text color
        ctx.textAlign = 'center'; // Center align text
        ctx.textBaseline = 'middle'; // Middle align text
        ctx.fillText(`Radiant: ${polygon.radiant}`, 0, 0); // Draw text
        ctx.restore();
        */
    
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
                radius: player.radius,
                score: player.score,
                playerName: player.name
    
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
                if (checkBulletPolygonCollision(bullet, polygon) && !hitPolygons.has(polygon)) {
    
                        hitPolygons.add(polygon);
    
                        if (polygon.health <= 0) {
                            if (bullet.ownerId === player.id) {
                                //player.score += polygon.score;
                                //polygon.isFading = true;
                                console.log("Polygon destroyed. Player's new score:", player.score);
    
                                // Broadcast collision to server
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
            borderWidth: bulletSettings.borderWidth,
            damage: bulletSettings.damage,
        };
        //ws.send(JSON.stringify(bullet));
        ws.send(JSON.stringify({
            type: 'shoot',
            x: bullet.x,
            y: bullet.y,
            speedX: bullet.speedX,
            speedY: bullet.speedY,
            ownerId: bullet.ownerId,
            color: bullet.color,
            borderWidth: bulletSettings.borderWidth,
            damage: bulletSettings.damage,
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
            drawPolygons(ctx, timestamp);
            drawBullets();
            updatePlayer();
            updateBullets();
            drawOtherPlayers();
            drawPlayer();
            drawMessages(); 
            drawLeaderboard(ctx);
            //updateScoreDisplay();
    
        }
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
    
    gameLoop();
    



    const ws = connectWebSocket(); 
    gameLoop();
}

