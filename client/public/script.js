import { player, startGame, getPlayers, gameStart } from './game.js';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
let gridSize = 50;

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
    drawGrid();
    drawPolygons(ctx);
});

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

drawGrid();