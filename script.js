let gameSettings = {
    audioEnabled: true
};
let gameData = {
    highScores: Array(10).fill(0),
    maxStreak: 0,
    playTimes: Array(10).fill(0),
    levelStreaks: Array(10).fill(0)
};
let currentLevel = 1;

// Skrip Animasi Loading Screen
const runBootSequence = () => {
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercent = document.getElementById('loading-percent');
    const loadingText = document.getElementById('loading-text');

    const bootLogs = [
        { at: 10, text: "INITIALIZING KERNEL..." },
        { at: 28, text: "LOADING NEON SHADERS & GRAPHICS PIPELINE..." },
        { at: 45, text: "MOUNTING TETROMINO MATRIX..." },
        { at: 65, text: "SYNCHRONIZING LOCAL STORAGE & RECORDS..." },
        { at: 82, text: "CALIBRATING AUDIO SYNTHESIZER..." },
        { at: 95, text: "ESTABLISHING SECURE NEURAL LINK..." },
        { at: 100, text: "SYSTEM READY. WELCOME, OPERATOR." }
    ];

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 4) + 2; // Naik acak 2-5%
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            // Transisi ke Menu Utama setelah jeda singkat
            setTimeout(() => {
                document.getElementById('screen-loading').classList.remove('active');
                navTo('screen-main');
            }, 400);
        }

        loadingBar.style.width = progress + '%';
        loadingPercent.innerText = progress + '%';

        // Update kalimat log berdasarkan progress
        const currentLog = bootLogs.slice().reverse().find(log => progress >= log.at);
        if (currentLog) {
            loadingText.innerText = currentLog.text;
        }
    }, 35);
};

const loadData = () => {
    const savedData = localStorage.getItem('neonTetrisData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        gameData.highScores = parsed.highScores || Array(10).fill(0);
        gameData.maxStreak = parsed.maxStreak || 0;
        gameData.playTimes = parsed.playTimes || Array(10).fill(0);
        gameData.levelStreaks = parsed.levelStreaks || Array(10).fill(0);
    }
    const savedSettings = localStorage.getItem('neonTetrisSettings');
    if (savedSettings) {
        gameSettings = JSON.parse(savedSettings);
    }
    updateSettingsUI();
};

const saveData = () => {
    localStorage.setItem('neonTetrisData', JSON.stringify(gameData));
};
const saveSettings = () => {
    localStorage.setItem('neonTetrisSettings', JSON.stringify(gameSettings));
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playSound = (type) => {
    if (!gameSettings.audioEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
        case 'move':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'rotate':
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.05);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'drop':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        case 'clear':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
            osc.frequency.linearRampToValueAtTime(1600, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);

            const osc2 = audioCtx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1000, now);
            osc2.connect(gainNode);
            osc2.start(now);
            osc2.stop(now + 0.3);
            break;
        case 'gameover':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 1);
            osc.start(now);
            osc.stop(now + 1);
            break;
    }
};

const toggleAudio = () => {
    gameSettings.audioEnabled = !gameSettings.audioEnabled;
    saveSettings();
    updateSettingsUI();
    if (gameSettings.audioEnabled && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

const updateSettingsUI = () => {
    const btn = document.getElementById('toggle-audio-btn');
    btn.innerText = gameSettings.audioEnabled ? 'ON' : 'OFF';
    btn.style.color = gameSettings.audioEnabled ? 'var(--neon-green)' : 'var(--neon-red)';
    btn.style.borderColor = gameSettings.audioEnabled ? 'var(--neon-green)' : 'var(--neon-red)';
};

const navTo = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (screenId === 'screen-stats') {
        renderStats();
    }
};

const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const renderStats = () => {
    for (let i = 1; i <= 10; i++) {
        const scoreEl = document.getElementById(`stat-grid-score-${i}`);
        if (scoreEl) {
            scoreEl.innerText = gameData.highScores[i - 1];
        }
    }
    document.getElementById('stat-max-streak').innerText = gameData.maxStreak;
};

const openStatDetail = (level) => {
    const idx = level - 1;
    document.getElementById('detail-level-title').innerText = `LEVEL ${level} RECORDS`;
    document.getElementById('detail-score').innerText = gameData.highScores[idx];
    document.getElementById('detail-time').innerText = formatTime(gameData.playTimes[idx]);
    document.getElementById('detail-streak').innerText = gameData.levelStreaks[idx];
    document.getElementById('modal-stat-detail').classList.add('active');
};

const closeStatDetail = () => {
    document.getElementById('modal-stat-detail').classList.remove('active');
};

const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 35;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const SHAPES = [
    [],
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]], // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]], // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]], // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]  // Z
];

const COLORS = [
    null,
    '#00f3ff', // Cyan
    '#0055ff', // Blue
    '#ff8c00', // Orange
    '#fdfa66', // Yellow
    '#39ff14', // Green
    '#ff00ff', // Magenta
    '#ff3333'  // Red
];

let board = [];
let piece = null;
let nextPiece = null;
let pieceBag = [];

let gameState = {
    level: 1,
    score: 0,
    lines: 0,
    streak: 0,
    status: 'idle',
    dropCounter: 0,
    dropInterval: 1000,
    lastTime: 0,
    animationId: null,
    secondsElapsed: 0,
    timerInterval: null
};

const createBoard = () => {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
};

const generatePiece = () => {
    if (pieceBag.length === 0) {
        pieceBag = [1, 2, 3, 4, 5, 6, 7];
        for (let i = pieceBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieceBag[i], pieceBag[j]] = [pieceBag[j], pieceBag[i]];
        }
    }
    const typeId = pieceBag.pop();
    const shape = SHAPES[typeId];
    return {
        shape: shape,
        id: typeId,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
};

const drawBlock = (context, x, y, colorId, isGhost = false) => {
    if (!colorId) return;
    const color = COLORS[colorId];
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;

    if (isGhost) {
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.strokeRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
        context.fillStyle = `${color}33`;
        context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
    } else {
        context.fillStyle = color;
        context.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = 'rgba(255,255,255,0.8)';
        context.lineWidth = 1;
        context.strokeRect(px + 2, py + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
        context.fillStyle = 'rgba(0,0,0,0.3)';
        context.fillRect(px + 4, py + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
    }
};

const drawBoard = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * BLOCK_SIZE, 0); ctx.lineTo(i * BLOCK_SIZE, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * BLOCK_SIZE); ctx.lineTo(canvas.width, i * BLOCK_SIZE); ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }

    if (piece) {
        let ghostY = piece.y;
        while (!collide({ x: piece.x, y: ghostY + 1, shape: piece.shape })) {
            ghostY++;
        }
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) drawBlock(ctx, piece.x + x, ghostY + y, piece.id, true);
            });
        });

        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) drawBlock(ctx, piece.x + x, piece.y + y, piece.id);
            });
        });
    }
};

const drawNextPiece = () => {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;

    const bSize = 14;
    const offsetX = (nextCanvas.width - nextPiece.shape[0].length * bSize) / 2;
    const offsetY = (nextCanvas.height - nextPiece.shape.length * bSize) / 2;

    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const color = COLORS[nextPiece.id];
                const px = offsetX + x * bSize;
                const py = offsetY + y * bSize;

                nextCtx.fillStyle = color;
                nextCtx.fillRect(px, py, bSize, bSize);
                nextCtx.strokeStyle = 'rgba(255,255,255,0.8)';
                nextCtx.strokeRect(px + 1, py + 1, bSize - 2, bSize - 2);
                nextCtx.fillStyle = 'rgba(0,0,0,0.3)';
                nextCtx.fillRect(px + 2, py + 2, bSize - 4, bSize - 4);
            }
        });
    });
};

const collide = (p = piece) => {
    for (let y = 0; y < p.shape.length; y++) {
        for (let x = 0; x < p.shape[y].length; x++) {
            if (p.shape[y][x] !== 0) {
                let nx = p.x + x;
                let ny = p.y + y;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                if (ny >= 0 && board[ny][nx] !== 0) return true;
            }
        }
    }
    return false;
};

const merge = () => {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (piece.y + y >= 0) {
                    board[piece.y + y][piece.x + x] = piece.id;
                }
            }
        });
    });
};

const rotate = (matrix) => {
    return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse());
};

const playerRotate = () => {
    const pos = piece.x;
    let offset = 1;
    const newShape = rotate(piece.shape);
    const p = { ...piece, shape: newShape };

    while (collide(p)) {
        p.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.shape[0].length) {
            return;
        }
    }
    piece = p;
    playSound('rotate');
};

const playerMove = (dir) => {
    piece.x += dir;
    if (collide()) {
        piece.x -= dir;
    } else {
        playSound('move');
    }
};

const playerDrop = () => {
    piece.y++;
    if (collide()) {
        piece.y--;
        merge();
        clearLines();
        resetPiece();
    }
    gameState.dropCounter = 0;
};

const hardDrop = () => {
    while (!collide()) {
        piece.y++;
    }
    piece.y--;
    merge();
    clearLines();
    resetPiece();
    playSound('drop');
    gameState.dropCounter = 0;
};

const resetPiece = () => {
    piece = nextPiece;
    nextPiece = generatePiece();
    drawNextPiece();

    if (collide()) {
        gameOverSequence();
    }
};

const gameOverSequence = () => {
    gameState.status = 'gameover';
    clearInterval(gameState.timerInterval);
    cancelAnimationFrame(gameState.animationId);
    document.getElementById('gameover-overlay').style.display = 'flex';
    document.getElementById('final-score').innerText = gameState.score;
    playSound('gameover');
    checkHighScoreAndRecords();
};

const clearLines = () => {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) continue outer;
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }

    if (linesCleared > 0) {
        playSound('clear');
        gameState.streak++;

        const streakEl = document.getElementById('ui-streak');
        streakEl.innerText = gameState.streak;
        streakEl.classList.remove('streak-anim');
        void streakEl.offsetWidth;
        streakEl.classList.add('streak-anim');

        if (gameState.streak > gameData.maxStreak) {
            gameData.maxStreak = gameState.streak;
        }

        const levelIdx = gameState.level - 1;
        if (gameState.streak > gameData.levelStreaks[levelIdx]) {
            gameData.levelStreaks[levelIdx] = gameState.streak;
        }

        const baseScore = [0, 100, 300, 500, 800][linesCleared];
        gameState.score += baseScore * gameState.level * (1 + (gameState.streak * 0.1));
        gameState.score = Math.floor(gameState.score);
        gameState.lines += linesCleared;

        updateUI();
        checkHighScoreAndRecords();
    } else {
        gameState.streak = 0;
        updateUI();
    }
};

const checkHighScoreAndRecords = () => {
    const levelIdx = gameState.level - 1;
    let updated = false;

    if (gameState.score > gameData.highScores[levelIdx]) {
        gameData.highScores[levelIdx] = gameState.score;
        document.getElementById('ui-highscore').innerText = gameData.highScores[levelIdx];
        updated = true;
    }

    if (gameState.secondsElapsed > gameData.playTimes[levelIdx]) {
        gameData.playTimes[levelIdx] = gameState.secondsElapsed;
        updated = true;
    }

    if (updated) {
        saveData();
    }
};

const updateUI = () => {
    document.getElementById('ui-score').innerText = gameState.score;
    document.getElementById('ui-lines').innerText = gameState.lines;
    document.getElementById('ui-streak').innerText = gameState.streak;
    document.getElementById('ui-timer').innerText = formatTime(gameState.secondsElapsed);
};

const calculateDropInterval = (level) => {
    return 1000 * Math.pow(0.8, level - 1);
};

const update = (time = 0) => {
    if (gameState.status !== 'playing') return;

    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;
    gameState.dropCounter += deltaTime;

    if (gameState.dropCounter > gameState.dropInterval) {
        playerDrop();
    }

    drawBoard();
    gameState.animationId = requestAnimationFrame(update);
};

const updatePauseButtonIcon = (isPaused) => {
    const iconSvg = document.getElementById('pause-icon-svg');
    if (isPaused) {
        iconSvg.innerHTML = '<path fill="var(--neon-magenta)" d="M6.5 4.5 C5.5 3.9 4 4.6 4 5.8 V18.2 C4 19.4 5.5 20.1 6.5 19.5 L18.5 13.3 C19.5 12.8 19.5 11.2 18.5 10.7 Z"/>';
    } else {
        iconSvg.innerHTML = '<path fill="var(--neon-magenta)" d="M5 4 h3.5 a2 2 0 0 1 2 2 v12 a2 2 0 0 1 -2 2 h-3.5 a2 2 0 0 1 -2 -2 v-12 a2 2 0 0 1 2 -2 Z M15.5 4 h3.5 a2 2 0 0 1 2 2 v12 a2 2 0 0 1 -2 2 h-3.5 a2 2 0 0 1 -2 -2 v-12 a2 2 0 0 1 2 -2 Z"/>';
    }
};

const togglePause = () => {
    if (gameState.status === 'playing') {
        pauseGame();
    } else if (gameState.status === 'paused') {
        resumeGame();
    }
};

const startGame = (level) => {
    currentLevel = level;
    if (audioCtx.state === 'suspended' && gameSettings.audioEnabled) {
        audioCtx.resume();
    }

    navTo('screen-game');
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('gameover-overlay').style.display = 'none';

    clearInterval(gameState.timerInterval);
    pieceBag = [];

    gameState = {
        level: level,
        score: 0,
        lines: 0,
        streak: 0,
        status: 'playing',
        dropCounter: 0,
        dropInterval: calculateDropInterval(level),
        lastTime: performance.now(),
        animationId: null,
        secondsElapsed: 0,
        timerInterval: setInterval(() => {
            if (gameState.status === 'playing') {
                gameState.secondsElapsed++;
                document.getElementById('ui-timer').innerText = formatTime(gameState.secondsElapsed);
            }
        }, 1000)
    };

    updatePauseButtonIcon(false);
    document.getElementById('ui-level').innerText = level;
    document.getElementById('ui-highscore').innerText = gameData.highScores[level - 1];
    updateUI();

    createBoard();
    nextPiece = generatePiece();
    resetPiece();

    cancelAnimationFrame(gameState.animationId);
    update();
};

const retryGame = () => {
    startGame(currentLevel);
};

const pauseGame = () => {
    if (gameState.status === 'playing') {
        gameState.status = 'paused';
        cancelAnimationFrame(gameState.animationId);
        document.getElementById('pause-overlay').style.display = 'flex';
        updatePauseButtonIcon(true);
    }
};

const resumeGame = () => {
    if (gameState.status === 'paused') {
        gameState.status = 'playing';
        document.getElementById('pause-overlay').style.display = 'none';
        updatePauseButtonIcon(false);
        gameState.lastTime = performance.now();
        update();
    }
};

const quitToLevelSelect = () => {
    gameState.status = 'idle';
    clearInterval(gameState.timerInterval);
    cancelAnimationFrame(gameState.animationId);
    navTo('screen-level');
};

const quitGame = () => {
    gameState.status = 'idle';
    clearInterval(gameState.timerInterval);
    cancelAnimationFrame(gameState.animationId);
    navTo('screen-main');
};

document.addEventListener('keydown', event => {
    if (event.keyCode === 27) {
        togglePause();
        return;
    }

    if (gameState.status !== 'playing') return;

    switch (event.keyCode) {
        case 37: playerMove(-1); break;
        case 39: playerMove(1); break;
        case 40: playerDrop(); break;
        case 38: playerRotate(); break;
        case 32: hardDrop(); break;
    }
    if ([37, 39, 40, 38, 32].includes(event.keyCode)) {
        event.preventDefault();
        drawBoard();
    }
});

let touchInterval = null;
let touchTimeout = null;

const bindTouchBtn = (id, actionStr, continuous = false) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const startAction = (e) => {
        e.preventDefault();
        if (gameState.status !== 'playing') return;

        clearInterval(touchInterval);
        clearTimeout(touchTimeout);
        touchInterval = null;
        touchTimeout = null;

        if (actionStr === 'left') playerMove(-1);
        if (actionStr === 'right') playerMove(1);
        if (actionStr === 'down') playerDrop();
        if (actionStr === 'rotate') playerRotate();
        if (actionStr === 'drop') hardDrop();

        drawBoard();

        if (continuous && ['left', 'right', 'down'].includes(actionStr)) {
            touchTimeout = setTimeout(() => {
                if (gameState.status !== 'playing') return;
                touchInterval = setInterval(() => {
                    if (actionStr === 'left') playerMove(-1);
                    if (actionStr === 'right') playerMove(1);
                    if (actionStr === 'down') playerDrop();
                    drawBoard();
                }, 120);
            }, 400);
        }
    };

    const stopAction = (e) => {
        if (e) e.preventDefault();
        clearInterval(touchInterval);
        clearTimeout(touchTimeout);
        touchInterval = null;
        touchTimeout = null;
    };

    btn.addEventListener('touchstart', startAction, { passive: false });
    btn.addEventListener('touchend', stopAction, { passive: false });
    btn.addEventListener('touchcancel', stopAction, { passive: false });
    btn.addEventListener('mousedown', startAction);
    btn.addEventListener('mouseup', stopAction);
    btn.addEventListener('mouseleave', stopAction);
};

bindTouchBtn('btn-left', 'left', true);
bindTouchBtn('btn-right', 'right', true);
bindTouchBtn('btn-down', 'down', true);
bindTouchBtn('btn-rotate', 'rotate');
bindTouchBtn('btn-drop', 'drop');

window.onload = () => {
    loadData();
    runBootSequence(); // Menjalankan animasi loading saat halaman dimuat
};