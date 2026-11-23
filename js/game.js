let world;
const keyboard = new Keyboard(acceptGameAction);
const canvas = document.getElementById('canvas');
const gameStage = document.getElementById('game-stage');
const fullscreenButton = document.getElementById('fullscreen-button');
const soundButton = document.getElementById('sound-button');
const gameAudio = new GameAudio();
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const pauseIndicator = document.getElementById('pause-indicator');
const playButtons = document.querySelectorAll('[data-game-action]');

function startGame() {
    world?.stop();
    keyboard.reset();
    startScreen.hidden = true;
    restartButton.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    gameAudio.unlock();
    world = new World(canvas, keyboard, showRestartButton, gameAudio);
    playButtons.forEach(button => { button.disabled = false; });
    canvas.focus({ preventScroll: true });
}

function showRestartButton() {
    pauseIndicator.hidden = true;
    keyboard.reset();
    playButtons.forEach(button => { button.disabled = true; });
    restartButton.hidden = false;
    restartButton.focus({ preventScroll: true });
}

function toggleSound(event) {
    gameAudio.setEnabled(!gameAudio.enabled);
    soundButton.setAttribute('aria-pressed', String(gameAudio.enabled));
    soundButton.title = gameAudio.enabled ? 'Spielton ausschalten' : 'Spielton einschalten';
    focusGameAfterClick(event);
}

function updateFullscreenButton() {
    const active = document.fullscreenElement === gameStage ||
        gameStage.classList.contains('viewport-fullscreen');
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.title = active ? 'Vollbild ausschalten' : 'Vollbild einschalten';
}

async function toggleFullscreen(event) {
    if (gameStage.classList.contains('viewport-fullscreen')) {
        gameStage.classList.remove('viewport-fullscreen');
    } else if (document.fullscreenElement === gameStage) {
        await document.exitFullscreen();
    } else {
        await enterFullscreen();
    }

    updateFullscreenButton();
    focusGameAfterClick(event);
}

async function enterFullscreen() {
    if (document.fullscreenEnabled) {
        try {
            await gameStage.requestFullscreen();
            return;
        } catch {
            // Use the page's viewport if the browser refuses native fullscreen.
        }
    }
    gameStage.classList.add('viewport-fullscreen');
}

function focusGameAfterClick(event) {
    if (event.detail > 0 && world?.win === null) {
        canvas.focus({ preventScroll: true });
    }
}

function pauseGame() {
    if (!world || world.stopped) return;

    keyboard.reset();
    world.setPaused(true);
    pauseIndicator.hidden = false;
}

function acceptGameAction(action) {
    if (!world?.paused) return true;
    if (document.hidden || !document.hasFocus() ||
        (action !== 'left' && action !== 'right' && action !== 'up')) {
        return false;
    }

    world.setPaused(false);
    pauseIndicator.hidden = true;
    return true;
}

function connectPlayButton(button) {
    const action = button.dataset.gameAction;
    const holdToMove = action === 'left' || action === 'right';

    button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || button.disabled || !acceptGameAction(action)) return;
        if (holdToMove) {
            button.setPointerCapture(event.pointerId);
            keyboard.holdControl(action, event.pointerId);
        } else {
            keyboard.tapControl(action);
        }
    });

    for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        button.addEventListener(eventName, event => keyboard.releaseControl(event.pointerId));
    }

    button.addEventListener('click', event => {
        if (event.detail === 0 && !button.disabled && acceptGameAction(action)) keyboard.tapControl(action);
    });

    if (holdToMove) {
        button.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.code !== 'Space') return;
            if (!acceptGameAction(action)) return;
            event.preventDefault();
            keyboard.holdControl(action, button);
        });
        button.addEventListener('keyup', event => {
            if (event.key === 'Enter' || event.code === 'Space') keyboard.releaseControl(button);
        });
        button.addEventListener('blur', () => keyboard.releaseControl(button));
    }
}

playButtons.forEach(connectPlayButton);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
soundButton.addEventListener('click', toggleSound);
fullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);
globalThis.addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && gameStage.classList.contains('viewport-fullscreen')) {
        gameStage.classList.remove('viewport-fullscreen');
        updateFullscreenButton();
    }
});
