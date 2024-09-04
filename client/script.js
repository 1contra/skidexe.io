import { player, startGame, getPlayers, gameStart } from './game.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const changelog = document.getElementById('changelog');
const startButton = document.getElementById('startButton');
const playerNameInput = document.getElementById('playerName');
const exitMenu = document.getElementById('exitMenu');
const resumeBtn = document.getElementById('resumeBtn');
const leaveBtn = document.getElementById('leaveBtn');

const polygons = [
    {
        "x": 2342.3418658046276,
        "y": 414.24557730546223,
        "angle": 105.86866501969533,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 224.84697351410512,
        "y": 2990,
        "angle": 101.83217796967685,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2752.294731430286,
        "y": 2420.9209331910597,
        "angle": 134.5529945555351,
        "sides": 4,
        "radius": 20,
        "color": "#ffed4a",
        "score": 500,
        "borderColor": "#b8a81d",
        "speed": 0.002,
        "health": 19,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 19
    },
    {
        "x": 2549.7483152264326,
        "y": 763.4370105828082,
        "angle": 69.54778961365064,
        "sides": 5,
        "radius": 50,
        "color": "#2b99ff",
        "score": 1000,
        "borderColor": "#1e6ab0",
        "speed": 0.001,
        "health": 49,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 49
    },
    {
        "x": 2362.041106683647,
        "y": 1424.8418811565032,
        "angle": 71.1973389893037,
        "sides": 5,
        "radius": 50,
        "color": "#2b99ff",
        "score": 1000,
        "borderColor": "#1e6ab0",
        "speed": 0.001,
        "health": 49,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 49
    },
    {
        "x": 1834.9497689783052,
        "y": 383.7209475033289,
        "angle": 105.5067929772526,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1661.2531197138128,
        "y": 1349.8251007829133,
        "angle": 138.63337244518394,
        "sides": 4,
        "radius": 20,
        "color": "#ffed4a",
        "score": 500,
        "borderColor": "#b8a81d",
        "speed": 0.002,
        "health": 19,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 19
    },
    {
        "x": 1869.9424572390199,
        "y": 134.9603291109811,
        "angle": 106.1835201218152,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 200,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 1,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2305.38838675778,
        "y": 1444.6021778395302,
        "angle": 101.51923567774506,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2586.3703650872644,
        "y": 416.99168416359254,
        "angle": 137.67984708701843,
        "sides": 4,
        "radius": 20,
        "color": "#ffed4a",
        "score": 500,
        "borderColor": "#b8a81d",
        "speed": 0.002,
        "health": 19,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 19
    },
    {
        "x": 2761.1598980372873,
        "y": 1407.0124871030453,
        "angle": 105.24611319167943,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2172.4494382959006,
        "y": 2448.9013302404333,
        "angle": 101.30861389725257,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2990,
        "y": 658.7645901527961,
        "angle": 106.78852901413286,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2567.0134762638454,
        "y": 2728.9996878852717,
        "angle": 104.61059133993919,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2043.600311581269,
        "y": 1838.3147854120136,
        "angle": 103.36680715668709,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2529.144493245152,
        "y": 10,
        "angle": 105.4394066505108,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 200,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 1,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2421.0258905350206,
        "y": 1757.3687649397066,
        "angle": 103.8390341142492,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2413.823752640336,
        "y": 1483.9190935146844,
        "angle": 136.3982717550628,
        "sides": 4,
        "radius": 20,
        "color": "#ffed4a",
        "score": 500,
        "borderColor": "#b8a81d",
        "speed": 0.002,
        "health": 19,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 19
    },
    {
        "x": 396.08152825574047,
        "y": 613.7533210443268,
        "angle": 105.92336270314688,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1592.4828239493183,
        "y": 2904.671523745786,
        "angle": 102.66044223352718,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 200,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 1,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 916.4815379399379,
        "y": 429.2970009577083,
        "angle": 101.48096761160522,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2256.5398463422343,
        "y": 15.417811495866744,
        "angle": 105.20698494966382,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 851.385192528683,
        "y": 2971.018263878003,
        "angle": 103.50461481455395,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1615.5695757162512,
        "y": 2296.1185028862687,
        "angle": 102.90979695698991,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1654.6625553412514,
        "y": 495.5321041574682,
        "angle": 139.72692397894645,
        "sides": 4,
        "radius": 20,
        "color": "#ffed4a",
        "score": 500,
        "borderColor": "#b8a81d",
        "speed": 0.002,
        "health": 19,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 19
    },
    {
        "x": 1161.370092832984,
        "y": 2415.3587351345404,
        "angle": 102.81919965365175,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1987.068096091233,
        "y": 1313.2277193905481,
        "angle": 101.33527605107469,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 288.13285117243345,
        "y": 401.6417710826116,
        "angle": 106.60400788425414,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2774.0355407161155,
        "y": 166.54419983983394,
        "angle": 107.03364692898522,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 10,
        "y": 203.6242615847459,
        "angle": 103.40838927090492,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2440.8919063476455,
        "y": 2750.1230056491313,
        "angle": 106.4827409541179,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 763.4691932039175,
        "y": 784.625776816371,
        "angle": 103.94178720320363,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 295.9050303592834,
        "y": 49.50446416242295,
        "angle": 105.92675069056197,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2776.36219923184,
        "y": 1940.0860418302298,
        "angle": 106.32585074993382,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2009.7154532103768,
        "y": 1790.7641017418105,
        "angle": 53.94472510666021,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2750.5343167646834,
        "y": 2773.354629125108,
        "angle": 51.45294242998964,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1554.780913702636,
        "y": 161.2672683007432,
        "angle": 34.06676388409602,
        "sides": 5,
        "radius": 50,
        "color": "#2b99ff",
        "score": 1000,
        "borderColor": "#1e6ab0",
        "speed": 0.001,
        "health": 49,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 49
    },
    {
        "x": 2025.6163044710136,
        "y": 1008.100110117704,
        "angle": 16.334855096539936,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2226.188825800132,
        "y": 456.0233242835946,
        "angle": 15.833597478548135,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1417.2051270007362,
        "y": 2990,
        "angle": 20.18169163091722,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 444.8711510591957,
        "y": 10,
        "angle": 17.343031236011022,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2666.104158978898,
        "y": 2086.3217228471426,
        "angle": 14.20826773091077,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 40.95618893788682,
        "y": 10,
        "angle": 17.0262351983876,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1877.198728029864,
        "y": 1318.5870068240997,
        "angle": 12.995468883496885,
        "sides": 6,
        "radius": 100,
        "color": "#3F51B5",
        "score": 5000,
        "borderColor": "#303d85",
        "speed": 0.0008,
        "health": 99,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 99
    },
    {
        "x": 1663.2639561203766,
        "y": 2593.163079427048,
        "angle": 16.591014577396315,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2850.7081181238505,
        "y": 864.5886302001377,
        "angle": 13.675159616960288,
        "sides": 5,
        "radius": 50,
        "color": "#2b99ff",
        "score": 1000,
        "borderColor": "#1e6ab0",
        "speed": 0.001,
        "health": 49,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 49
    },
    {
        "x": 699.2377522746509,
        "y": 296.06185375314294,
        "angle": 14.16710936367034,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 1206.8518090817893,
        "y": 337.7892886742901,
        "angle": 17.172653521032796,
        "sides": 4,
        "radius": 20,
        "color": "#ffed4a",
        "score": 500,
        "borderColor": "#b8a81d",
        "speed": 0.002,
        "health": 19,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 19
    },
    {
        "x": 2701.820994475247,
        "y": 1052.0605983897988,
        "angle": 9.347336062325265,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    },
    {
        "x": 2511.78398561536,
        "y": 540.0120115110697,
        "angle": 10.238921312805058,
        "sides": 3,
        "radius": 10,
        "color": "#FF443D",
        "score": 50,
        "borderColor": "#ba322d",
        "speed": 0.0015,
        "health": 9,
        "radiant": 0,
        "opacity": 1,
        "isFading": false,
        "baseHealth": 9
    }
]

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
    drawGrid();
    drawPolygons(ctx);
    //drawPlayer();
});

let mapSize = 3000;
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

drawGrid();
drawPolygons(ctx);




