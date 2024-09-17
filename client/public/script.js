import { player, startGame, getPlayers, gameStart } from './game.js';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');

function addMessage(text) {
    if (!gameStart) return;
    messages.push({
        text,
        timestamp: Date.now()
    });
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

startButton.addEventListener('click', () => {
    startGame();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    clearCanvas();
    drawGrid();
    drawPolygons(ctx);
});

let gridSize = 50;

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

function drawPolygons(ctx, timestamp) {
    console.log('ctx:', ctx);
    console.log('polygons:', polygons);
    console.log('player:', player);

    if (!ctx) {
        console.error('CanvasRenderingContext2D is undefined');
        return;
    }
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
    9: { colorAdjustment: 350, oscillationRange: 2.4, oscillationSpeed: 0.008, tpLevel: 0.9 },
    10: { colorAdjustment: 400, oscillationRange: 4, oscillationSpeed: 0.01, tpLevel: 0.5 },
    11: { colorAdjustment: 450, oscillationRange: 4.2, oscillationSpeed: 0.012, tpLevel: 0.6 },
    12: { colorAdjustment: 500, oscillationRange: 4.4, oscillationSpeed: 0.014, tpLevel: 0.7 },
    13: { colorAdjustment: 550, oscillationRange: 4.6, oscillationSpeed: 0.016, tpLevel: 0.8 },
    14: { colorAdjustment: 600, oscillationRange: 4.8, oscillationSpeed: 0.018, tpLevel: 0.9 },
    15: { colorAdjustment: 650, oscillationRange: 5, oscillationSpeed: 0.02, tpLevel: 1.0 },
    16: { colorAdjustment: 700, oscillationRange: 5.2, oscillationSpeed: 0.022, tpLevel: 1.1 },
    17: { colorAdjustment: 750, oscillationRange: 5.4, oscillationSpeed: 0.024, tpLevel: 1.2 },
    18: { colorAdjustment: 800, oscillationRange: 5.6, oscillationSpeed: 0.026, tpLevel: 1.3 },
    19: { colorAdjustment: 850, oscillationRange: 5.8, oscillationSpeed: 0.028, tpLevel: 1.4 },
    20: { colorAdjustment: 900, oscillationRange: 6, oscillationSpeed: 0.03, tpLevel: 1.5 }
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

function parseColor(color) {
    const match = color.match(/\d+/g);
    if (!match || match.length !== 3) {
        console.error('Invalid color format:', color);
        return [0, 0, 0]; // Default to black if invalid
    }
    return match.map(Number);
}

function darkenColor(color, factor = 0.7) {
    const rgb = parseColor(color);
    const r = Math.max(Math.floor(rgb[0] * factor), 0);
    const g = Math.max(Math.floor(rgb[1] * factor), 0);
    const b = Math.max(Math.floor(rgb[2] * factor), 0);
    return `rgb(${r}, ${g}, ${b})`;
}

function brightenColor(color, factor = 1.3) {
    const rgb = parseColor(color);
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

    if (!baseColor) {
        console.error('Unknown polygon shape:', polygon.shape);
        ctx.fillStyle = '#FFFFFF';
    } else {
        if (polygon.radiant === 0) {
            ctx.fillStyle = polygon.color;
            ctx.strokeStyle = polygon.borderColor;
        } else if (polygon.radiant === 1) {
            const color = adjustColor(baseColor, timestamp, 20);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 2) {
            const color = adjustColor(baseColor, timestamp, 40);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 3) {
            const color = adjustColor(baseColor, timestamp, 60);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 4) {
            const color = adjustColor(baseColor, timestamp, 100);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 5) {
            const color = adjustColor(baseColor, timestamp, 150);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 6) {
            const color = adjustColor(baseColor, timestamp, 200);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 7) {
            const color = adjustColor(baseColor, timestamp, 250);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 8) {
            const color = adjustColor(baseColor, timestamp, 300);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 9) {
            const color = adjustColor(baseColor, timestamp, 350);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 10) {
            const color = adjustColor(baseColor, timestamp, 400);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 11) {
            const color = adjustColor(baseColor, timestamp, 450);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 12) {
            const color = adjustColor(baseColor, timestamp, 500);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 13) {
            const color = adjustColor(baseColor, timestamp, 550);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 14) {
            const color = adjustColor(baseColor, timestamp, 600);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 15) {
            const color = adjustColor(baseColor, timestamp, 650);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 16) {
            const color = adjustColor(baseColor, timestamp, 700);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 17) {
            const color = adjustColor(baseColor, timestamp, 750);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 18) {
            const color = adjustColor(baseColor, timestamp, 800);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 19) {
            const color = adjustColor(baseColor, timestamp, 850);
            ctx.fillStyle = color;
            ctx.strokeStyle = darkenColor(color, 0.7);
        } else if (polygon.radiant === 10) {
            const color = adjustColor(baseColor, timestamp, 900);
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
    const numSpikes = polygon.sides;
    const spikeCount = polygon.sides;;
    const spikeWidth = polygon.radius / 4;
    const angleStep = (2 * Math.PI) / numSpikes;
    const rotationSpeed = 0.002;
    ctx.save();
    ctx.translate(0, 0);
    let rotationAngle = timestamp * rotationSpeed;
    let spikeLength = 20;


    for (let i = 0; i < spikeCount; i++) {
        const angle = i * angleStep + rotationAngle;
        const xTip = Math.cos(angle) * (polygon.radius + spikeLength);
        const yTip = Math.sin(angle) * (polygon.radius + spikeLength);
        const xBase1 = Math.cos(angle + angleStep / 2) * (polygon.radius);
        const yBase1 = Math.sin(angle + angleStep / 2) * (polygon.radius);
        const xBase2 = Math.cos(angle - angleStep / 2) * (polygon.radius);
        const yBase2 = Math.sin(angle - angleStep / 2) * (polygon.radius);
        ctx.beginPath();
        ctx.moveTo(xTip, yTip);
        ctx.lineTo(xBase1, yBase1);
        ctx.lineTo(xBase2, yBase2);
        ctx.closePath();
        ctx.lineWidth = spikeWidth;
        const color = adjustColor(baseColor, timestamp, colorAdjustment);
        ctx.strokeStyle = darkenColor(color, 0.5);
        ctx.stroke();
        const color2 = darkenColor(baseColor, timestamp, colorAdjustment);
        ctx.fillStyle = brightenColor(color2, 0.8);
        ctx.fill();
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

drawGrid();
//drawPolygons(ctx);




