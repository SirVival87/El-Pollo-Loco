let world;
const keyboard = new Keyboard(acceptGameAction);
const canvas = document.getElementById('canvas');
const gameAudio = new GameAudio();
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const endActions = document.getElementById('end-actions');
const pauseIndicator = document.getElementById('pause-indicator');
const playButtons = document.querySelectorAll('[data-game-action]');

/** Startet eine neue Runde und setzt die Eingaben zurück. */
function startGame() {
    world?.stop();
    keyboard.reset();
    startScreen.hidden = true;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    gameAudio.unlock();
    world = new World(canvas, keyboard, showEndActions, gameAudio, showPauseState);
    setPlayButtonsEnabled(true);
    canvas.focus({ preventScroll: true });
}

/** Zeigt die Aktionen der beendeten Runde an. */
function showEndActions() {
    pauseIndicator.hidden = true;
    keyboard.reset();
    setPlayButtonsEnabled(false);
    endActions.hidden = false;
    restartButton.focus({ preventScroll: true });
}

/** Beendet die Runde und stellt den Startbildschirm wieder her. */
function returnToStart() {
    world?.stop();
    world = undefined;
    keyboard.reset();
    settingsDialog.close();
    startScreen.hidden = false;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    setPlayButtonsEnabled(false);
    startButton.focus({ preventScroll: true });
}

/** Pausiert eine laufende Spielrunde. */
function pauseGame() {
    if (!world || world.stopped) return;

    world.setPaused(true);
}

/** Synchronisiert Pausenanzeige und Eingabestatus mit der Spielwelt. */
function showPauseState(paused) {
    if (paused) keyboard.reset();
    pauseIndicator.hidden = !paused;
}

/**
 * Prüft Eingaben und setzt eine pausierte Runde bei Bewegung fort.
 * @param {string} action Name der Spielaktion.
 * @returns {boolean} Ob die Aktion verarbeitet werden darf.
 */
function acceptGameAction(action) {
    if (isSettingsOpen()) return false;
    if (!world?.paused) return true;
    if (document.hidden || !document.hasFocus() ||
        (action !== 'left' && action !== 'right' && action !== 'up')) {
        return false;
    }

    world.setPaused(false);
    return true;
}

/** Aktiviert oder sperrt die Bildschirmsteuerung. */
function setPlayButtonsEnabled(enabled) {
    playButtons.forEach(button => { button.disabled = !enabled; });
}

playButtons.forEach(button => connectPlayButton(button, keyboard, acceptGameAction));
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
document.getElementById('home-button').addEventListener('click', returnToStart);
connectGameSettings();
globalThis.addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
});
