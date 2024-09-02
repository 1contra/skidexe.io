import { startGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const changelog = document.getElementById('changelog');
const startButton = document.getElementById('startButton');
const playerNameInput = document.getElementById('playerName');
const exitMenu = document.getElementById('exitMenu');
const resumeBtn = document.getElementById('resumeBtn');
const leaveBtn = document.getElementById('leaveBtn');

document.addEventListener('DOMContentLoaded', () => {
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

// Start the game only when the start button is clicked
startButton.addEventListener('click', () => {
    startGame(); // Call the function imported from game.js
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    clearCanvas();
    //drawPlayer();
});