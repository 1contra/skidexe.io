require('dotenv').config(); 
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const uWS = require('uWebSockets.js');
const app = express();
const config = require('./config');
const fs = require('fs');
const adminToken = process.env.ADMIN_SECRET_KEY;
const adminTokens = new Map(); // Stores player IDs with admin status
const players = new Map();
const BULLET_POOL_SIZE = 10000;
const bulletPool = [];
const activeBullets = new Map();
const barrels = new Map();
let mapSize = 3000;
let gridSize = 50; 
port = config.port;
let server;
let leaderboard = [];
const scoreInterpolations = new Map();
if (config.isHosting) {
    if (!config.key || !config.cert) {
        throw new Error('SSL keyFile and certFile must be specified when isHosting is true');
    }

    const options = {
        key: fs.readFileSync(config.key),
        cert: fs.readFileSync(config.cert)
    };

    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}
const wss = new WebSocket.Server({ server });
const wssFFA = new WebSocket.Server({ noServer: true });
const wssTDM = new WebSocket.Server({ noServer: true });
const servers = [
    { id: 1, name: 'FFA', address: '127.0.0.1', port: 3000, mode: 'ffa' },
    { id: 2, name: '2 TDM', address: '127.0.0.1', port: 3001, mode: '2tdm' },
    //{ id: 3, name: '4 TDM', address: 'localhost', port: 3000, mode: '4tdm' }
];

app.use(express.static(path.join(config.staticDir)));

app.get('/api/servers', (req, res) => {
    res.json(servers);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(config.staticDir, 'index.html'));
});

app.get('/api/map-info', (req, res) => {
    res.json({ mapSize, gridSize });
});

//not in use
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

class Polygon {
    constructor(x, y, sides, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant = 0) {
        console.log('Polygon constructor params:', { x, y, sides, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant });
        this.x = x;
        this.y = y;
        this.sides = sides;
        this.radius = radius;
        this.color = color;
        this.borderColor = borderColor;
        this.speed = speed;
        this.score = score;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationAngle = 0;
        this.health = health;
        this.radiant = radiant;
        this.baseHealth = baseHealth;
        this.opacity = 1.0;
        this.fadeDuration = 350;
        this.fadeStartTime = null;
        this.isFading = false;
        this.id = generateUniqueId();
        this.centerX = x;
        this.centerY = y;
        this.pathRadius = 200;
        this.lastDamageTime = null; 
        this.regenInterval = 6000;

    }

    update() {

        if (this.isFading) {
            const elapsed = Date.now() - this.fadeStartTime;
            this.opacity = Math.max(1 - (elapsed / this.fadeDuration));

            if (this.opacity <= 0) {

                this.opacity = 0;
                spawnPolygon()
                return true;
            }

        }

        if (this.lastDamageTime && (Date.now() - this.lastDamageTime) >= this.regenInterval) {
            this.health = Math.min(this.health + 1, this.baseHealth);
            if (this.health === this.baseHealth) {
                this.lastDamageTime = null;
            }
        }

        this.angle += this.speed;
        this.x = this.centerX + Math.cos(this.angle) * this.pathRadius;
        this.y = this.centerY + Math.sin(this.angle) * this.pathRadius;

        const mapSize = 3000;
        const radius = this.radius;

        if (this.x - radius < 0) {
            this.x = radius;
        } else if (this.x + radius > mapSize) {
            this.x = mapSize - radius;
        }

        if (this.y - radius < 0) {
            this.y = radius;
        } else if (this.y + radius > mapSize) {
            this.y = mapSize - radius;
        }

        return false;
    }

    startFading() {
        this.isFading = true;
        this.fadeStartTime = Date.now();
    }

    takeDamage(amount) {

        this.health -= amount;
        this.health = Math.max(this.health, 0);

        if (this.health <= 0) {
            this.startFading();
        }

        this.lastDamageTime = Date.now();
    }

    respawn() {
        this.health = this.health;
        this.x = Math.random() * mapSize;
        this.y = Math.random() * mapSize;
        this.angle = Math.random() * Math.PI * 2;
        this.lastDamageTime = null;
    }

    draw(context) {
        context.beginPath();
        const angleStep = (Math.PI * 2) / this.sides;
        for (let i = 0; i < this.sides; i++) {
            const angle = angleStep * i + this.rotationAngle;
            const x = this.x + Math.cos(angle) * this.radius;
            const y = this.y + Math.sin(angle) * this.radius;
            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        context.closePath();

        const fadeColor = this.RadiantVFX(this.color, this.radiant);
        context.fillStyle = fadeColor;
        context.globalAlpha = this.opacity;
        context.fill();
        context.globalAlpha = 1.0;
    }

    RadiantVFX(color, radiant) {
        if (radiant > 0) {
            const x = Math.min(1, radiant / 10);
            const [r, g, b] = this.hexToRgb(color)
            const rDark = Math.floor(r * (1 - factor))
            const gDark = Math.floor(g * (1 - factor))
            const bDark = Math.floor(b * (1 - factor))
            return `rgb(${rDark}, ${gDark}, ${bDark})`
        }
        return color;
    }
    
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(7, 7), 16);
        return [r, g, b];
    }

    drawHitbox(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        context.stroke();
    }

    checkCollision(otherPolygon) {
        const dx = this.x - otherPolygon.x;
        const dy = this.y - otherPolygon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + otherPolygon.radius;
    }

    resolveCollision(otherPolygon) {
        const dx = this.x - otherPolygon.x;
        const dy = this.y - otherPolygon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const overlap = this.radius + otherPolygon.radius - distance;

        const nx = dx / distance;
        const ny = dy / distance;
        
        this.x += nx * overlap / 2;
        this.y += ny * overlap / 2;
        otherPolygon.x -= nx * overlap / 2;
        otherPolygon.y -= ny * overlap / 2;
    }
}

class Triangle extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 3, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Square extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 4, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Pentagon extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 5, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Hexagon extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 6, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Heptagon extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 7, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Octagon extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 8, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Nanogon extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 9, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

class Decagon extends Polygon {
    constructor(x, y, radius, color, borderColor, speed, health, fadeDuration = 200, baseHealth, score, radiant) {
        super(x, y, 10, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
    }
}

const polygonTypes = [
    { type: 'triangle', rarity: 1 },
    { type: 'square', rarity: 0.3 },
    { type: 'pentagon', rarity: 0.1 },
    { type: 'hexagon', rarity: 0.05 },
    { type: 'heptagon', rarity: 0.02 },
    { type: 'octagon', rarity: 0.01 },
    { type: 'nonagon', rarity: 0.005 },
    { type: 'decagon', rarity: 0.002 }
];

/*
const polygonTypes = [
    { type: 'triangle', rarity: 1 },
    { type: 'square', rarity: 0.8 },
    { type: 'pentagon', rarity: 0.7 },
    { type: 'hexagon', rarity: 0.5 },
    { type: 'heptagon', rarity: 0.04 },
    { type: 'octagon', rarity: 0.03 },
    { type: 'nonagon', rarity: 0.02 },
    { type: 'decagon', rarity: 0.01 }
];
*/

/*
const radiantVal = {
    triangle: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    square: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    pentagon: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    hexagon: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    heptagon: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    octagon: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    nonagon: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
    decagon: [0.7, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01, 0.004, 0.003, 0.001],
};
*/

const radiantVal = {
    triangle: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    square: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    pentagon: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    hexagon: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    heptagon: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    octagon: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    nonagon: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ],
    decagon: [
        2, 0.1, 0.05, 0.01, 0.005, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 
        0.000001, 0.0000005, 0.0000001, 0.00000005, 0.00000001, 0.000000005, 
        0.000000001, 0.0000000005, 0.0000000001, 0.00000000005, 0.00000000001
    ]
};

const polygonColors = {
    'triangle': '#FF443D',
    'square': '#ffed4a',
    'pentagon': '#2b99ff',
    'hexagon': '#3F51B5',
    'heptagon': '#ff80ab',
    'octagon': '#00dbc7',
    'nonagon': '#7affba',
    'decagon': '#09040a'
};

const borderColors = {
    'triangle': '#ba322d',
    'square': '#b8a81d',
    'pentagon': '#1e6ab0',
    'hexagon': '#303d85',
    'heptagon': '#ba5275',
    'octagon': '#00a394',
    'nonagon': '#57ba87',
    'decagon': '#000000'
};

const polygonSpeed = {
    'triangle': 0.0015,
    'square': 0.002,
    'pentagon': 0.001,
    'hexagon': 0.0008,
    'heptagon': 0.0005,
    'octagon': 0.0003,
    'nonagon': 0.0002,
    'decagon': 0.0001
};

const polygonHealth = {
    'triangle': 9,
    'square': 19,
    'pentagon': 49,
    'hexagon': 99,
    'heptagon': 199,
    'octagon': 999,
    'nonagon': 1999,
    'decagon': 2999
};

const polygonBaseHealth = {
    'triangle': 9,
    'square': 19,
    'pentagon': 49,
    'hexagon': 99,
    'heptagon': 199,
    'octagon': 999,
    'nonagon': 1999,
    'decagon': 2999
};

/*
const polygonScore = {
    'triangle': 50,
    'square': 500,
    'pentagon': 1000,
    'hexagon': 5000,
    'heptagon': 10000,
    'octagon': 250000,
    'nonagon': 500000,
    'decagon': 5600033404
};
*/

const polygonScore = {
    'triangle': 50,
    'square': 500,
    'pentagon': 1000,
    'hexagon': 5000,
    'heptagon': 10000,
    'octagon': 250000,
    'nonagon': 34000000,
    'decagon': 59600033404
};

const polygonRadius = {
    'triangle': 10,
    'square': 20,
    'pentagon': 50,
    'hexagon': 100,
    'heptagon': 200,
    'octagon': 300,
    'nonagon': 500,
    'decagon': 1000
};

const radiantScoreMultipliers = {
    0: 1,
    1: 4,
    2: 16,
    3: 64,
    4: 256,
    5: 1024,
    6: 4096,
    7: 16384,
    8: 65536,
    9: 262144,
    10: 1048576,
    11: 4194304,
    12: 16777216,
    13: 67108864,
    14: 268435456,
    15: 1073741824,
    16: 4294967296,
    17: 17179869184,
    18: 68719476736,
    19: 274877906944,
    20: 1099511627776
};

function addScorePlayer(bulletId, score) {
    const bullet = activeBullets.get(bulletId);
    if (!bullet) return;

    const player = players.get(bullet.ownerId);
    if (!player) return;

    startScoreInterpolation(player.id, score);
    console.log(`Player ${player.id} scored ${score} points! Total Score: ${player.score}`);

}

function startScoreInterpolation(playerId, scoreToAdd) {
    const duration = 1000;
    const frames = 60; 
    const increment = scoreToAdd / frames;
    let currentFrame = 0;

    const intervalId = setInterval(() => {
        const player = players.get(playerId);
        if (!player) {
            clearInterval(intervalId);
            return;
        }

        player.score += increment;
        currentFrame++;

        broadcast({
            type: 'scoreUpdate',
            playerId: player.id,
            score: Math.floor(player.score)
        });

        if (currentFrame >= frames) {
            clearInterval(intervalId);
            scoreInterpolations.delete(playerId);
        }
    }, duration / frames);

    scoreInterpolations.set(playerId, intervalId);
}

function getRadiantLevel(type) {
    const polygon = polygonTypes.find(p => p.type === type);
    
    if (!polygon) {
        console.error("Error: Invalid type provided.");
        return 0;
    }

    const rarities = radiantVal[type];
    
    if (!rarities) {
        console.error("Error: Radiant values not defined for type.");
        return 0;
    }

    const totalRarity = rarities.reduce((sum, rarity) => sum + rarity, 0);
    const random = Math.random() * totalRarity;
    let cumulativeRarity = 0;
    
    for (let i = 0; i < rarities.length; i++) {
        cumulativeRarity += rarities[i];
        if (random < cumulativeRarity) {
            return i;
        }
    }

    console.warn("Warning: Fallback to radiant 0.");
    return 0;
}

function getRandomPolygonType() {
    const totalRarity = polygonTypes.reduce((sum, polygon) => sum + polygon.rarity, 0);
    const random = Math.random() * totalRarity;
    let cumulativeRarity = 0;

    for (const polygon of polygonTypes) {
        cumulativeRarity += polygon.rarity;
        if (random < cumulativeRarity) {
            return polygon.type;
        }
    }

    return 'triangle';
}

function spawnPolygons(count) {
    const polygons = [];
    for (let i = 0; i < count; i++) {
        const x = Math.random() * mapSize || 1500;
        const y = Math.random() * mapSize || 1500;
        const type = getRandomPolygonType();
        const radius = polygonRadius[type] || 10;
        const color = polygonColors[type] || '#FFFFFF';
        const borderColor = borderColors[type] || '#000000';
        const speed = polygonSpeed[type] || 1;
        const health = polygonHealth[type] || 100;
        const baseHealth = polygonBaseHealth[type] || 100;
        const radiant = getRadiantLevel(type) || 0;
        const baseScore = polygonScore[type] || 0;
        const scoreMultiplier = radiantScoreMultipliers[radiant] || 0;
        const score = baseScore * scoreMultiplier;
        
        const fadeDuration = 200;
        
        let polygon;
        switch (type) {
            case 'triangle':
                polygon = new Triangle(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'square':
                polygon = new Square(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'pentagon':
                polygon = new Pentagon(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'hexagon':
                polygon = new Hexagon(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'heptagon':
                polygon = new Heptagon(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'octagon':
                polygon = new Octagon(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'nonagon':
                polygon = new Nanogon(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            case 'decagon':
                polygon = new Decagon(x, y, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
                console.log('Spawning Polygon:', {
                    x, y, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
                });
                break;
            default:
                console.error('Unknown polygon type:', type);
                continue;
        }
        polygons.push(polygon);
    }
    return polygons;
}

function updatePolygons() {
    let polygonsToRemove = [];
    polygons.forEach(polygon => {
        const shouldRemove = polygon.update();
        if (shouldRemove) {
            polygonsToRemove.push(polygon);
        }
    });
    polygons = polygons.filter(polygon => !polygonsToRemove.includes(polygon));
    polygons.forEach(polygon => polygon.update());
    resolvePolygonCollisions(polygons);
}

function broadcastPolygonUpdates(wss) {
    //console.log('Type of polygons:', typeof polygons);
    //console.log('Contents of polygons:', polygons);

    if (!Array.isArray(polygons)) {
        console.error('polygons is not an array');
        return;
    }

    const polygonData = polygons.map(polygon => ({
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
        radiant: polygon.radiant,
        opacity: polygon.opacity,
        isFading: polygon.isFading,
        baseHealth: polygon.baseHealth,
        
        
    }));

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'updatePolygons', data: polygonData }));
        }
    });
}

let polygons = spawnPolygons(50);

function spawnPolygon() {
    const polygon = spawnPolygons(1)[0];
    polygons.push(polygon);
    broadcastPolygonUpdates(wss);
}

function spawnPolygonADMIN(sides, radiant, playerX, playerY) {
    const type = getPolygonTypeBySides(sides);
    const radius = polygonRadius[type] || 10;
    const color = polygonColors[type] || '#FFFFFF';
    const borderColor = borderColors[type] || '#000000';
    const speed = polygonSpeed[type] || 1;
    const health = polygonHealth[type] || 100;
    const baseHealth = polygonBaseHealth[type] || 100;
    const baseScore = polygonScore[type] || 0;
    const scoreMultiplier = radiantScoreMultipliers[radiant] || 0;
    const score = baseScore * scoreMultiplier;
    
    const fadeDuration = 200;
    
    let polygon;
    switch (type) {
        case 'triangle':
            polygon = new Triangle(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'square':
            polygon = new Square(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'pentagon':
            polygon = new Pentagon(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'hexagon':
            polygon = new Hexagon(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'heptagon':
            polygon = new Heptagon(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'octagon':
            polygon = new Octagon(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'nonagon':
            polygon = new Nanogon(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        case 'decagon':
            polygon = new Decagon(playerX, playerY, radius, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant);
            break;
        default:
            console.error('Unknown polygon type:', type);
            return null;
    }

    console.log('Spawning Polygon:', {
        x: playerX, y: playerY, radius, type, color, borderColor, speed, health, fadeDuration, baseHealth, score, radiant
    });

    return polygon;
}

function isBulletCollidingWithPolygon(bullet, polygon) {
    const dx = bullet.x - polygon.x;
    const dy = bullet.y - polygon.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < polygon.radius;
}

function arePolygonsColliding(polygon1, polygon2) {
    const dx = polygon1.x - polygon2.x;
    const dy = polygon1.y - polygon2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const combinedRadii = polygon1.radius + polygon2.radius;
    return distance < combinedRadii;
}

function resolvePolygonCollisions(polygons) {
    for (let i = 0; i < polygons.length; i++) {
        for (let j = i + 1; j < polygons.length; j++) {
            const polygonA = polygons[i];
            const polygonB = polygons[j];
            if (polygonA.checkCollision(polygonB)) {
                polygonA.resolveCollision(polygonB);
            }
        }
    }
}


for (let i = 0; i < BULLET_POOL_SIZE; i++) {
    bulletPool.push({
        x: 0,
        y: 0,
        speedX: 0,
        speedY: 0,
        ownerId: null,
        color: '#000000',
        active: false
    });
}

function getBulletFromPool() {
    for (const bullet of bulletPool) {
        if (!bullet.active) {
            bullet.active = true;
            return bullet;
        }
    }
    return null;
}

function returnBulletToPool(bullet) {
    bullet.active = false;
}

function isColliding(bullet, player) {
    const collisionRadius = player.radius + bullet.borderWidth; 
    const dx = bullet.x - player.x;
    const dy = bullet.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < collisionRadius;
}

const scoreAddedMap = new Map();

function updateBullets() {
    const bulletsToRemove = [];
    activeBullets.forEach((bullet, bulletId) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        if (bullet.x < 0 || bullet.x > 3000 || bullet.y < 0 || bullet.y > 3000) {
            bulletsToRemove.push(bulletId);
            returnBulletToPool(bullet);
            return;
        }

        let hitPolygon = null;
        for (const polygon of polygons) {
            if (isBulletCollidingWithPolygon(bullet, polygon)) {
                hitPolygon = polygon;
                break;
            }
        }
        
        if (hitPolygon) {
            const player = players.get(bullet.ownerId);
            if (!player) return;

            if (hitPolygon.health > 0) {
                hitPolygon.takeDamage(bullet.damage);

                if (hitPolygon.health <= bullet.damage) {

                    if (hitPolygon.opacity <= 0.99) {
                        addScorePlayer(bulletId, hitPolygon.score);
                        broadcast({

                            type: 'bulletHit',
                            bulletId,
                            polygonId: hitPolygon.id

                        });
                    }

                }

                if (hitPolygon.health < 1) {
                   addScorePlayer(bulletId, hitPolygon.score);

                    
                    broadcast({
                        type: 'bulletHit',
                        bulletId,
                        polygonId: hitPolygon.id
                    });
                }
                bulletsToRemove.push(bulletId);
                returnBulletToPool(bullet);
            }
            return;
        }

        for (const player of players.values()) {
            if (bullet.ownerId !== player.id && isColliding(bullet, player)) {
                bulletsToRemove.push(bulletId);
                returnBulletToPool(bullet);
                console.log("Bullet hit a player");
                
                broadcast({
                    type: 'bulletHit',
                    bulletId
                });
                return;
            }
        }
    });
    bulletsToRemove.forEach(bulletId => activeBullets.delete(bulletId));
}

function broadcastBarrels() {
    const barrelData = Array.from(barrels.values()).map(barrel => ({
        id: barrel.id,
        x: barrel.x,
        y: barrel.y,
        angle: barrel.angle,
        color: barrel.color,
        width: barrel.width,
        length: barrel.length
    }));
    
    //console.log('Broadcasting barrels:', barrelData); // Debug log
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'updateBarrels', barrels: barrelData }));
        }
    });
}

function updatePlayer(id, data) {
    const player = players.get(id);
    if (player) {
        player.x = data.x;
        player.y = data.y;
        player.angle = data.angle;
        player.color = data.color;
        player.borderColor = data.borderColor;
        player.barrelLength = data.barrelLength;
        player.barrelWidth = data.barrelWidth;
        player.barrelColor = data.barrelColor;
        player.barrelBorderColor = data.barrelBorderColor;
        player.radius = data.radius;
        player.playerName = data.playerName;
        player.score = data.score;
        player.bulletRadius = data.bulletRadius;
        player.bulletSpeed = data. bulletSpeed;
        player.bulletBorderColor = data.bulletBorderColor;
        player.bulletBorderWidth = data.bulletBorderWidth;
        id;
    }
}

function broadcastPlayerUpdate(id) {
    const player = players.get(id);
    broadcast({
        type: 'playerUpdate',
        id,
        x: player.x,
        y: player.y,
        color: player.color,
        angle: player.angle,
        borderColor: player.borderColor,
        barrelLength: player.barrelLength,
        barrelWidth: player.barrelWidth,
        barrelColor: player.barrelColor,
        barrelBorderColor: player.barrelBorderColor,
        radius: player.radius,
        score: player.score,
        bulletRadius: player.bulletRadius,
        bulletSpeed: player.bulletSpeed,
        name: player.name,
        bulletBorderColor: player.bulletBorderColor,
        bulletBorderWidth: player.bulletBorderWidth,
    });
}

function broadcastPlayerJoin(id, playerName) {
    broadcast({
        type: 'playerJoin',
        id,
        playerName
    });
}

function updateBullet(data) {
    const existingBullet = activeBullets.get(data.id);
    if (existingBullet) {
        Object.assign(existingBullet, data);
    } else {
        activeBullets.set(data.id, { ...data, lifetime: 0 });
    }
}

function handlePolygonHit(data) {
    const { playerId, bulletId, polygonId, score } = data;

    const player = players.get(playerId);
    if (player) {
    } else {
        console.log(`Player ${playerId} not found.`);
    }
}

function getPlayerDataForBroadcast(player) {
    return {
        id: player.id,
        score: player.score,
        playerName: player.playerName
    };
}

function updateLeaderboard(playerName) {
    const playerArray = Array.from(players.values());
    playerArray.sort((a, b) => b.score - a.score);
    leaderboard = playerArray.slice(0, 10);

    const leaderboardData = leaderboard.map(getPlayerDataForBroadcast);
    broadcast({
        type: 'playerData',
        players: leaderboardData,
    });
}

function handleShoot(data) {
    let bullet = getBulletFromPool() || createNewBullet(data);
    const bulletId = generateUniqueId();
    activeBullets.set(bulletId, bullet);
    if (!bullet) {
        bullet = {
            x: data.x,
            y: data.y,
            speedX: data.speedX,
            speedY: data.speedY,
            ownerId: data.ownerId,
            color: data.color,
            active: true,
            damage: data.damage,
        };
    } else {
        bullet.x = data.x;
        bullet.y = data.y;
        bullet.speedX = data.speedX;
        bullet.speedY = data.speedY;
        bullet.ownerId = data.ownerId;
        bullet.color = data.color;
        bullet.active = true;
        bullet.damage = data.damage;
    }
    broadcast({
        type: 'bulletUpdate',
        id: bulletId,
        x: bullet.x,
        y: bullet.y,
        speedX: bullet.speedX,
        speedY: bullet.speedY,
        ownerId: bullet.ownerId,
        color: bullet.color,
        damage: bullet.damage,
    });
}

function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

wss.on('connection', (ws) => {
    const id = Date.now();
    const defaultPlayer = {
        ws,
        x: 0,
        y: 0,
        angle: 0,
        color: '#ff2a1c',
        borderColor: '#990900',
        barrelLength: 25,
        barrelWidth: 15,
        barrelColor: '#8f8f8f',
        barrelBorderColor: '#6e6e6e',
        radius: 15,
        playerName: `Player ${id}`,
        id: id,
        score: 0,
        bulletRadius: 0,
        bulletSpeed: 0,
        bulletBorderColor: '',
        bulletBorderWidth: 0,
    };
    const defaultBarrel = {
        id,
        x: 0,
        y: 0,
        angle: 0,
        color: '#8f8f8f',
        width: 15,
        length: 25,
    }

    players.set(id, { ...defaultPlayer });
    barrels.set(id, { ...defaultBarrel });
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'initializePlayer':
                updatePlayer(id, data);
                broadcastPlayerUpdate(id, data);
                broadcastPlayerJoin(id, data.playerName);
                updateLeaderboard();
                //console.log(`Player joined ${data.playerName}`)
                break;

            case 'updatePosition':
                updatePlayer(id, data);
                broadcastPlayerUpdate(id, data);
                updateLeaderboard();
                //console.log(`Update position ${data.playerName}`)
                break;

            case 'shoot':
                handleShoot(data);
                break;

            case 'updateBarrel':
                const barrel = data;
                if (barrels.has(barrel.id)) {
                    Object.assign(barrels.get(barrel.id), barrel);
                } else {
                    barrels.set(barrel.id, barrel);
                }
                broadcastBarrels();
                break;

            case 'bulletUpdate':
                updateBullet(data);
                updateBullets(data);
                break;

            case 'polygonHit':
                handlePolygonHit(data);
                break;

            case 'updateScore':
                updatePlayer(id, { score: data.score });
                break;

            case 'chatCommand':
                handleChatCommand(ws, message);
                break;

            default:
                console.log(`Unknown message type: ${data.type}`);
        }
    });
    ws.on('close', () => {

        const player = players.get(id);
        let playerName = player.playerName;
        console.log(`Player left: ${playerName}`);

        if (player) {
            let playerName = player.playerName;
            players.delete(id);
            broadcast({
                type: 'playerLeave',
                id,
                playerName
            });
            updateLeaderboard();
        }

        broadcast({
            type: 'leave',
            id,
            playerName: playerName,
        });
    
        players.delete(id);
        broadcast({
            type: 'playerDisconnect',
            id
        });
    });

    ws.send(JSON.stringify({
        type: 'welcome',
        id
    }));
});

function handleChatCommand(ws, message) {
    try {
        const { command, playerId, playerX, playerY } = JSON.parse(message); 
        console.log("Received command:", command);
        console.log("Player ID:", playerId);
        console.log("Player X:", playerX);
        console.log("Player Y:", playerY);
        
        if (command.startsWith('/')) {
            const password = command.slice(1); // Extract the password from the command

            if (password === process.env.ADMIN_PASSWORD) {
                adminTokens.set(playerId, true);
                console.log(`Player ${playerId} got admin`);
                ws.send(JSON.stringify({
                    type: 'adminCommandResponse',
                    message: 'You are now an admin!'
                }));
            } else if (adminTokens.has(playerId)) { // Check if the player is already an admin for other commands
                const [cmd, ...args] = command.slice(1).split(' ');

                if (cmd === 'polygon') {
                    const [sidesStr, radiantStr] = args;
                    const sides = parseInt(sidesStr, 10);
                    const radiant = parseInt(radiantStr, 10);
                    
                    if (Number.isInteger(sides) && Number.isInteger(radiant)) {
                        const polygon = spawnPolygonADMIN(sides, radiant, playerX, playerY);
                        if (polygon) {
                            polygons.push(polygon);
                            broadcast({
                                type: 'spawnPolygon',
                                sides,
                                radiant,
                                x: polygon.x,
                                y: polygon.y,
                                color: polygon.color,
                                borderColor: polygon.borderColor,
                                speed: polygon.speed,
                                health: polygon.health,
                                fadeDuration: polygon.fadeDuration,
                                baseHealth: polygon.baseHealth,
                                score: polygon.score
                            });
                            
                            ws.send(JSON.stringify({
                                type: 'adminCommandResponse',
                                message: `Spawned a polygon with ${sides} sides and radiant ${radiant}.`
                            }));
                        } else {
                            ws.send(JSON.stringify({
                                type: 'adminCommandResponse',
                                message: 'Error spawning polygon.'
                            }));
                        }
                    } else {
                        ws.send(JSON.stringify({
                            type: 'adminCommandResponse',
                            message: 'Invalid parameters for spawn command.'
                        }));
                    }
                } else {
                    ws.send(JSON.stringify({
                        type: 'chatResponse',
                        message: `Command received: ${command}`
                    }));
                }
            } else {
                ws.send(JSON.stringify({
                    type: 'chatResponse',
                    message: `Invalid command or you are not an admin.`
                }));
            }
        }
    } catch (error) {
        console.error('Error handling chat command:', error);
        ws.send(JSON.stringify({
            type: 'adminCommandResponse',
            message: 'Error processing command.'
        }));
    }
}

function getPolygonTypeBySides(sides) {
    switch (sides) {
        case 3: return 'triangle';
        case 4: return 'square';
        case 5: return 'pentagon';
        case 6: return 'hexagon';
        case 7: return 'heptagon';
        case 8: return 'octagon';
        case 9: return 'nonagon';
        case 10: return 'decagon';
        default: return 'triangle';
    }
}

function broadcast(data) {
    const serializableData = JSON.parse(JSON.stringify(data));
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(serializableData));
        }
    });
}

server.listen(port, config.host, () => {
    console.log(`Server running at ${config.host}:${port}`);
    setInterval(() => {
        updateBullets();
        updatePolygons();
        broadcastPolygonUpdates(wss);
    }, 1000 / 60)
});