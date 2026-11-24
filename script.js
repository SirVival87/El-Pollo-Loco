let world;
const keyboard = new Keyboard(acceptGameAction);
const canvas = document.getElementById('canvas');
const defaultCanvasWidth = canvas.width;
const gameAudio = new GameAudio(document.getElementById('background-music'));
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const endActions = document.getElementById('end-actions');
const pauseIndicator = document.getElementById('pause-indicator');
const pauseButton = document.getElementById('pause-button');
const mobileLandscape = matchMedia('(orientation: landscape) and (pointer: coarse) and (max-width: 1440px) and (max-height: 1080px)');
const rotationNotice = document.getElementById('rotation-notice');
const portraitMode = matchMedia('(orientation: portrait) and (pointer: coarse) and (max-width: 1080px) and (max-height: 1440px)');
const playButtons = document.querySelectorAll('[data-game-action]');

/** Starts a new round and resets input. */
function startGame() {
    if (portraitMode.matches) return;
    world?.stop();
    keyboard.reset();
    startScreen.hidden = true;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    prepareRoundPlayback();
    world = new World(canvas, keyboard, showEndActions, gameAudio, showPauseState);
    setRoundControlsEnabled(true);
    canvas.focus({ preventScroll: true });
}

/**
 * Shows the end-of-round actions and plays the corresponding sound effect.
 * @param {boolean} won - Whether the round was won.
 */
function showEndActions(won) {
    gameAudio.playResult(won);
    pauseIndicator.hidden = true;
    keyboard.reset();
    setRoundControlsEnabled(false);
    endActions.hidden = false;
    restartButton.focus({ preventScroll: true });
}

/** Ends the round and returns to the start screen. */
function returnToStart() {
    world?.stop();
    world = undefined;
    keyboard.reset();
    settingsDialog.close();
    startScreen.hidden = false;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    setRoundControlsEnabled(false);
    startButton.focus({ preventScroll: true });
}

/** Pauses the current round. */
function pauseGame() {
    if (!world || world.stopped) return;

    gameAudio.setSleeping(false);
    world.setPaused(true);
}

/**
 * Keeps the pause indicator and input state in sync with the game world.
 * @param {boolean} paused - Whether the game is paused.
 */
function showPauseState(paused) {
    if (paused) keyboard.reset();
    pauseIndicator.hidden = !paused;
    updatePauseButton(paused);
}

/**
 * Checks input and resumes a paused round on movement.
 * @param {GameAction} action - Name of the game action.
 * @returns {boolean} Whether the action is allowed in the current game state.
 */
function acceptGameAction(action) {
    if (portraitMode.matches || settingsDialog.open || imprintDialog.open) return false;
    if (!world?.paused) return true;
    if (document.hidden || !document.hasFocus() ||
        (action !== 'left' && action !== 'right' && action !== 'up')) {
        return false;
    }

    world.setPaused(false);
    return true;
}

/**
 * Enables or disables the touch and pause buttons.
 * @param {boolean} enabled - Whether the on-screen controls should be usable.
 */
function setRoundControlsEnabled(enabled) {
    playButtons.forEach(button => { button.disabled = !enabled; });
    pauseButton.disabled = !enabled;
    updatePauseButton(Boolean(enabled && world?.paused));
}

/** Updates the game and audio when the mobile device rotates. */
function updateOrientation() {
    const blocked = portraitMode.matches;
    gameAudio.setOrientationBlocked(blocked);
    if (!blocked) return;

    keyboard.reset();
    pauseGame();
    imprintDialog.close();
    settingsDialog.close();
    if (document.fullscreenElement === gameStage) document.exitFullscreen().catch(() => {});
    rotationNotice.focus({ preventScroll: true });
}

/** Pauses the round when the tab becomes hidden and updates audio playback. */
function updatePageVisibility() {
    if (document.hidden) pauseGame();
    gameAudio.updateVolume();
    gameAudio.syncMusicPlayback();
}

/** Retries music playback after a user interaction if autoplay was blocked. */
function startAudioFromInteraction() {
    if (!portraitMode.matches) gameAudio.startPlayback();
}

/** Starts audio and requests native fullscreen on mobile devices. */
function prepareRoundPlayback() {
    gameAudio.startPlayback();
    if (mobileLandscape.matches && !document.fullscreenElement) void enterFullscreen();
}

/**
 * Updates the pause button icon and label.
 * @param {boolean} paused - Whether the round is currently paused.
 */
function updatePauseButton(paused) {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.title = paused ? 'Spiel fortsetzen' : 'Spiel pausieren';
}

/**
 * Toggles the round between paused and running from the toolbar.
 * @param {MouseEvent} event - Click on the pause button.
 */
function toggleGamePause(event) {
    if (pauseButton.disabled || portraitMode.matches || settingsDialog.open || imprintDialog.open) return;
    if (world.paused) world.setPaused(false);
    else pauseGame();
    focusGameAfterClick(event);
}

/** Adjusts the visible world width to fit the canvas in mobile landscape mode. */
function updateCanvasWidth() {
    const { clientWidth, clientHeight, height } = canvas;
    if (!clientWidth || !clientHeight) return;

    const width = mobileLandscape.matches ?
        Math.round(clientWidth * height / clientHeight) : defaultCanvasWidth;
    if (canvas.width === width) return;

    canvas.width = width;
    if (world?.stopped && world.win !== null) {
        world.renderer.render(world);
        world.renderer.drawEndScreen(world.win);
    }
}

new ResizeObserver(updateCanvasWidth).observe(canvas);
pauseButton.addEventListener('click', toggleGamePause);
playButtons.forEach(button => connectPlayButton(button, keyboard, acceptGameAction));
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
document.getElementById('home-button').addEventListener('click', returnToStart);
connectGameSettings();
globalThis.addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', updatePageVisibility);
document.addEventListener('click', startAudioFromInteraction);
document.addEventListener('keydown', startAudioFromInteraction);
portraitMode.addEventListener('change', updateOrientation);
updateOrientation();
