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
const endActions = document.getElementById('end-actions');
const settingsButton = document.getElementById('settings-button');
const settingsDialog = document.getElementById('settings-dialog');
const impressumDialog = document.getElementById('impressum-dialog');
const volumeInput = document.getElementById('volume-input');
const volumeValue = document.getElementById('volume-value');
const giveUpButton = document.getElementById('give-up-button');
const pauseIndicator = document.getElementById('pause-indicator');
const playButtons = document.querySelectorAll('[data-game-action]');

function startGame() {
    world?.stop();
    keyboard.reset();
    startScreen.hidden = true;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    gameAudio.unlock();
    world = new World(canvas, keyboard, showEndActions, gameAudio, showPauseState);
    playButtons.forEach(button => { button.disabled = false; });
    canvas.focus({ preventScroll: true });
}

function showEndActions() {
    pauseIndicator.hidden = true;
    keyboard.reset();
    playButtons.forEach(button => { button.disabled = true; });
    endActions.hidden = false;
    restartButton.focus({ preventScroll: true });
}

function toggleSound(event) {
    gameAudio.setEnabled(!gameAudio.enabled);
    updateSoundButton();
    focusGameAfterClick(event);
}

function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(gameAudio.enabled));
    soundButton.title = gameAudio.enabled ? 'Spielton ausschalten' : 'Spielton einschalten';
}

function updateVolume() {
    gameAudio.setVolume(Number(volumeInput.value));
    volumeValue.value = gameAudio.volume + ' %';
}

function openSettings() {
    if (world && !world.stopped) pauseGame();
    giveUpButton.hidden = !world || world.stopped;
    settingsDialog.showModal();
}

function returnToStart() {
    world?.stop();
    world = undefined;
    keyboard.reset();
    settingsDialog.close();
    startScreen.hidden = false;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    playButtons.forEach(button => { button.disabled = true; });
    startButton.focus({ preventScroll: true });
}

function closeOnBackdrop(dialog) {
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const { left, top, right, bottom } = dialog.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right ||
            event.clientY < top || event.clientY > bottom) dialog.close();
    });
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

    world.setPaused(true);
}

function showPauseState(paused) {
    if (paused) keyboard.reset();
    pauseIndicator.hidden = !paused;
}

function acceptGameAction(action) {
    if (settingsDialog.open || impressumDialog.open) return false;
    if (!world?.paused) return true;
    if (document.hidden || !document.hasFocus() ||
        (action !== 'left' && action !== 'right' && action !== 'up')) {
        return false;
    }

    world.setPaused(false);
    return true;
}

function connectPlayButton(button) {
    const action = button.dataset.gameAction;
    const holdToMove = action === 'left' || action === 'right';
    button.addEventListener('contextmenu', event => event.preventDefault());

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
document.getElementById('home-button').addEventListener('click', returnToStart);
giveUpButton.addEventListener('click', returnToStart);
settingsButton.addEventListener('click', openSettings);
volumeInput.value = gameAudio.volume;
volumeValue.value = gameAudio.volume + ' %';
volumeInput.addEventListener('input', updateVolume);
document.getElementById('impressum-link').addEventListener('click', event => {
    event.preventDefault();
    settingsDialog.close();
    impressumDialog.showModal();
});
impressumDialog.addEventListener('close', () => settingsDialog.showModal());
closeOnBackdrop(settingsDialog);
closeOnBackdrop(impressumDialog);
updateSoundButton();
soundButton.addEventListener('click', toggleSound);
fullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);
globalThis.addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
});
document.addEventListener('keydown', event => {
    if (settingsDialog.open || impressumDialog.open) return;
    if (event.key === 'Escape' && gameStage.classList.contains('viewport-fullscreen')) {
        gameStage.classList.remove('viewport-fullscreen');
        updateFullscreenButton();
    }
});
