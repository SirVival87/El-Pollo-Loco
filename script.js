let world;
const keyboard = new Keyboard(acceptGameAction);
const canvas = document.getElementById('canvas');
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

/** Startet eine neue Runde und setzt die Eingaben zurück. */
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
 * Zeigt die Aktionen der beendeten Runde an und spielt den passenden Effektsound.
 * @param {boolean} won - Ob die Runde gewonnen wurde.
 */
function showEndActions(won) {
    gameAudio.playResult(won);
    pauseIndicator.hidden = true;
    keyboard.reset();
    setRoundControlsEnabled(false);
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
    setRoundControlsEnabled(false);
    startButton.focus({ preventScroll: true });
}

/** Pausiert eine laufende Spielrunde. */
function pauseGame() {
    if (!world || world.stopped) return;

    gameAudio.setSleeping(false);
    world.setPaused(true);
}

/**
 * Synchronisiert Pausenanzeige und Eingabestatus mit der Spielwelt.
 * @param {boolean} paused - Ob das Spiel pausiert.
 */
function showPauseState(paused) {
    if (paused) keyboard.reset();
    pauseIndicator.hidden = !paused;
    updatePauseButton(paused);
}

/**
 * Prüft Eingaben und setzt eine pausierte Runde bei Bewegung fort.
 * @param {GameAction} action - Name der Spielaktion.
 * @returns {boolean} Ob die Aktion im aktuellen Spielzustand zugelassen ist.
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
 * Aktiviert oder sperrt Touch- und Pause-Tasten.
 * @param {boolean} enabled - Ob die Bildschirmsteuerung bedienbar sein soll.
 */
function setRoundControlsEnabled(enabled) {
    playButtons.forEach(button => { button.disabled = !enabled; });
    pauseButton.disabled = !enabled;
    updatePauseButton(Boolean(enabled && world?.paused));
}

/** Aktualisiert Spiel und Audio nach dem Drehen eines Mobilgeräts. */
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

/** Startet die Audioausgabe und fordert auf Mobilgeräten natives Vollbild an. */
function prepareRoundPlayback() {
    gameAudio.startPlayback();
    if (mobileLandscape.matches && !document.fullscreenElement) void enterFullscreen();
}

/**
 * Aktualisiert das Pause-Symbol und seine Beschreibung.
 * @param {boolean} paused - Ob die Runde gerade pausiert.
 */
function updatePauseButton(paused) {
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.title = paused ? 'Spiel fortsetzen' : 'Spiel pausieren';
}

/**
 * Wechselt per Werkzeugleiste zwischen Pause und laufendem Spiel.
 * @param {MouseEvent} event - Klick auf die Pause-Taste.
 */
function toggleGamePause(event) {
    if (pauseButton.disabled || portraitMode.matches || settingsDialog.open || imprintDialog.open) return;
    if (world.paused) world.setPaused(false);
    else pauseGame();
    focusGameAfterClick(event);
}

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
