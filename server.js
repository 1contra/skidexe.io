const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const app = express();
const config = require('./config');
const fs = require('fs');


const players = new Map();
const BULLET_POOL_SIZE = 10000;
const bulletPool = [];
const activeBullets = new Map();
const barrels = new Map();
let mapSize = 3000;
let gridSize = 50; 

port = config.port;
let server;

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
        //this.rotationSpeed = 0.02; // Speed of rotation
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

        //this.rotationAngle += this.rotationSpeed;

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
        const frames = 30;
        const damagePerFrame = amount / frames;
        let damageApplied = 0;

        const interval = setInterval(() => {
            if (damageApplied >= amount || this.health <= 0) {
                this.health = Math.max(this.health, 0);
                clearInterval(interval);
                if (this.health <= 0) {
                    this.startFading();
                }
                return;
            }
    
            this.health -= damagePerFrame;
            damageApplied += damagePerFrame;
        }, 1000 / 60); 
    
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
        context.globalAlpha = 1.0; // Reset alpha
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

// Rarity configuration
/*const polygonTypes = [
    { type: 'triangle', rarity: 0.5 },
    { type: 'square', rarity: 0.3 },
    { type: 'pentagon', rarity: 0.1 },
    { type: 'hexagon', rarity: 0.05 },
    { type: 'heptagon', rarity: 0.02 },
    { type: 'octagon', rarity: 0.01 },
    { type: 'nonagon', rarity: 0.005 },
    { type: 'decagon', rarity: 0.002 }
];*/

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
    'triangle': 10,
    'square': 20,
    'pentagon': 50,
    'hexagon': 100,
    'heptagon': 200,
    'octagon': 1000,
    'nonagon': 2000,
    'decagon': 3000
};

const polygonBaseHealth = {
    'triangle': 10,
    'square': 20,
    'pentagon': 50,
    'hexagon': 100,
    'heptagon': 200,
    'octagon': 1000,
    'nonagon': 2000,
    'decagon': 3000
};

const polygonScore = {
    'triangle': 10,
    'square': 20,
    'pentagon': 50,
    'hexagon': 100,
    'heptagon': 200,
    'octagon': 1000,
    'nonagon': 2000,
    'decagon': 3000
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

function getRadiantLevel(type) {
    // Ensure the provided type is valid
    const polygon = polygonTypes.find(p => p.type === type);
    
    if (!polygon) {
        console.error("Error: Invalid type provided.");
        return 0; // Return 0 as a default if type is invalid
    }

    // Get the radiant values for the polygon type
    const rarities = radiantVal[type];
    
    if (!rarities) {
        console.error("Error: Radiant values not defined for type.");
        return 0; // Return 0 as a default if radiant values are missing
    }

    // Calculate the total rarity
    const totalRarity = rarities.reduce((sum, rarity) => sum + rarity, 0);
    
    // Generate a random number between 0 and totalRarity
    const random = Math.random() * totalRarity;
    
    let cumulativeRarity = 0;
    
    // Determine the radiant level based on the random value
    for (let i = 0; i < rarities.length; i++) {
        cumulativeRarity += rarities[i];
        if (random < cumulativeRarity) {
            return i; // Return the index corresponding to the radiant level
        }
    }

    // Fallback case if something goes wrong
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
        const score = polygonScore[type] || 10;
        const radiant = getRadiantLevel(type) || 0;
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

        // Check collision with polygons
        let hitPolygon = null;
        for (const polygon of polygons) {
            if (isBulletCollidingWithPolygon(bullet, polygon)) {
                hitPolygon = polygon;
                break;
            }
        }

        if (hitPolygon) {
            if (hitPolygon.health > 0) {
                hitPolygon.takeDamage(10);

                if (hitPolygon.health <= 0) {
                    const player = [...players.values()].find(p => p.id === bullet.ownerId);
                    
                    if (player) {
                        player.score += hitPolygon.score;
                        console.log(`Player ${player.id} scored ${hitPolygon.score} points! Total Score: ${player.score}`);
                        
                        broadcast({
                            type: 'scoreUpdate',
                            playerId: player.id,
                            score: player.score
                        });
                    }
                }

                //console.log(`Bullet hit a shape ${hitPolygon}`);
                bulletsToRemove.push(bulletId);
                returnBulletToPool(bullet);

                broadcast({
                    type: 'bulletHit',
                    bulletId,
                    polygonId: hitPolygon.id
                });
            }
            return;
        }

        // Check collision with players
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
    }
}

function broadcastPlayerUpdate(id, data) {
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
        radius: player.radius
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
            active: true
        };
    } else {
        bullet.x = data.x;
        bullet.y = data.y;
        bullet.speedX = data.speedX;
        bullet.speedY = data.speedY;
        bullet.ownerId = data.ownerId;
        bullet.color = data.color;
        bullet.active = true;
    }
    broadcast({
        type: 'bulletUpdate',
        id: bulletId,
        x: bullet.x,
        y: bullet.y,
        speedX: bullet.speedX,
        speedY: bullet.speedY,
        ownerId: bullet.ownerId,
        color: bullet.color
    });
}

function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

wss.on('connection', (ws) => {
    const id = Date.now();
    //let playerName = Player${id}; // Use player ID or another method to assign a name
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
        playerName: "player",
        id: '1'
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
        if (data.type === 'initializePlayer') {
            /*
            const player = players.get(id);
            if (player) {
                //Object.assign(player, data);
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
            }
            let playerName = player.playerName;
            broadcast({
                type: 'playerUpdate',
                id,
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
                playerName: playerName,
            });
            broadcast({
                type: 'playerJoin',
                id: id,
                playerName: playerName
            });
            */
            updatePlayer(id, data);
            broadcastPlayerUpdate(id, data);
            broadcastPlayerJoin(id, data.playerName);

        } else if (data.type === 'updatePosition') {
            /*
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
            }
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
                radius: player.radius
            });
            */
            updatePlayer(id, data);
            broadcastPlayerUpdate(id, data);

        } else if (data.type === 'shoot') {
            /*
            let bullet = getBulletFromPool();
            if (!bullet) {
                bullet = {
                    x: data.x,
                    y: data.y,
                    speedX: data.speedX,
                    speedY: data.speedY,
                    ownerId: data.ownerId,
                    color: data.color,
                    active: true
                };
            } else {
                bullet.x = data.x;
                bullet.y = data.y;
                bullet.speedX = data.speedX;
                bullet.speedY = data.speedY;
                bullet.ownerId = data.ownerId;
                bullet.color = data.color;
                bullet.active = true;
            }
            const bulletId = Date.now();
            activeBullets.set(bulletId, bullet);
            broadcast({
                type: 'bulletUpdate',
                id: bulletId,
                x: bullet.x,
                y: bullet.y,
                speedX: bullet.speedX,
                speedY: bullet.speedY,
                ownerId: bullet.ownerId,
                color: bullet.color
            });
            */
            handleShoot(data);
        } 

        //messed up
        else if (data.type === 'updateBarrel') {

            const barrel = data;

            if (barrel) {
                Object.assign(barrel, data);
            } else {
                barrels.push(data);
            }

            broadcastBarrels();

        } 

        else if (data.type === 'bulletUpdate') {
            /*
            const existingBullet = bullets.find(b => b.id === data.id);

            if (existingBullet) {

                existingBullet.x = data.x;
                existingBullet.y = data.y;
                existingBullet.speedX = data.speedX;
                existingBullet.speedY = data.speedY;
                existingBullet.ownerId = data.ownerId;
                existingBullet.color = data.color;
                existingBullet.lifetime = 0;
            } 

            else {

                bullets.push({
                    id: data.id,
                    x: data.x,
                    y: data.y,
                    speedX: data.speedX,
                    speedY: data.speedY,
                    ownerId: data.ownerId,
                    color: data.color,
                    lifetime: 0
                });
            }
            */
            updateBullet(data);
        }
    });
    ws.on('close', () => {

        const player = players.get(id);

        let playerName = player.playerName;

        console.log(`Player name: ${playerName}`);

        broadcast({

            type: 'leave',
            id,
            playerName: playerName,

        });
        
        players.delete(id);

        broadcast({

            type: 'playerLeave',
            id: id,
            name: playerName

        });

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


function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

/*
// Upgrade HTTP server to WebSocket server for specific paths
server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (pathname === '/ffa') {
        wssFFA.handleUpgrade(request, socket, head, (ws) => {
            wssFFA.emit('connection', ws, request);
        });
    } else if (pathname === '/tdm') {
        wssTDM.handleUpgrade(request, socket, head, (ws) => {
            wssTDM.emit('connection', ws, request);
        });
    } else {
        socket.destroy(); // Close connection if path is unknown
    }
});
*/

server.listen(port, config.host, () => {
    console.log(`Server running at ${config.host}:${port}`);
    setInterval(() => {

        updateBullets();
        updatePolygons();
        broadcastPolygonUpdates(wss);

    }, 1000 / 120)

});