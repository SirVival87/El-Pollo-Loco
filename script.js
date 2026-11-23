let world;
const keyboard = new Keyboard(acceptGameAction);
const canvas = document.getElementById('canvas');
const gameAudio = new GameAudio(document.getElementById('background-music'));
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const endActions = document.getElementById('end-actions');
const pauseIndicator = document.getElementById('pause-indicator');
const rotationNotice = document.getElementById('rotation-notice');
const portraitMode = matchMedia('(orientation: portrait) and (any-pointer: coarse)');
const playButtons = document.querySelectorAll('[data-game-action]');

/** Startet eine neue Runde und setzt die Eingaben zurück. */
function startGame() {
    if (portraitMode.matches) return;
    world?.stop();
    keyboard.reset();
    startScreen.hidden = true;
    endActions.hidden = true;
    pauseIndicator.hidden = true;
    gameAudio.setPaused(false);
    gameAudio.startPlayback();
    world = new World(canvas, keyboard, showEndActions, gameAudio, showPauseState);
    setPlayButtonsEnabled(true);
    canvas.focus({ preventScroll: true });
}

/**
 * Zeigt die Aktionen der beendeten Runde an und spielt den passenden Effektsound.
 * @param {boolean} won - Ob die Runde gewonnen wurde.
 */
function showEndActions(won) {
    gameAudio.playResult(won);
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

/**
 * Synchronisiert Pausenanzeige und Eingabestatus mit der Spielwelt.
 * @param {boolean} paused - Ob das Spiel pausiert.
 */
function showPauseState(paused) {
    if (paused) keyboard.reset();
    pauseIndicator.hidden = !paused;
}

/**
 * Prüft Eingaben und setzt eine pausierte Runde bei Bewegung fort.
 * @param {GameAction} action - Name der Spielaktion.
 * @returns {boolean} Ob die Aktion im aktuellen Spielzustand zugelassen ist.
 */
function acceptGameAction(action) {
    if (portraitMode.matches || settingsDialog.open) return false;
    if (!world?.paused) return true;
    if (document.hidden || !document.hasFocus() ||
        (action !== 'left' && action !== 'right' && action !== 'up')) {
        return false;
    }

    world.setPaused(false);
    return true;
}

/**
 * Aktiviert oder sperrt die Bildschirmsteuerung.
 * @param {boolean} enabled - Ob die Bildschirmsteuerung bedienbar sein soll.
 */
function setPlayButtonsEnabled(enabled) {
    playButtons.forEach(button => { button.disabled = !enabled; });
}

/** Aktualisiert Spiel und Audio nach dem Drehen eines Mobilgeräts. */
function updateOrientation() {
    const blocked = portraitMode.matches;
    gameAudio.setOrientationBlocked(blocked);
    if (!blocked) return;

    keyboard.reset();
    pauseGame();
    settingsDialog.close();
    if (document.fullscreenElement === gameStage) document.exitFullscreen().catch(() => {});
    rotationNotice.focus({ preventScroll: true });
}

/** Pausiert die Runde beim Verlassen des Tabs und passt die Audioausgabe an. */
function updatePageVisibility() {
    if (document.hidden) pauseGame();
    gameAudio.updateVolume();
    gameAudio.syncMusicPlayback();
}

/** Wiederholt den Musikstart nach einer Nutzeraktion, wenn Autoplay blockiert wurde. */
function startAudioFromInteraction() {
    if (!portraitMode.matches) gameAudio.startPlayback();
}

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
