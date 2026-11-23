const gameStage = document.getElementById('game-stage');
const fullscreenButton = document.getElementById('fullscreen-button');
const soundButton = document.getElementById('sound-button');
const settingsButton = document.getElementById('settings-button');
const settingsDialog = document.getElementById('settings-dialog');
const impressumDialog = document.getElementById('impressum-dialog');
const volumeInput = document.getElementById('volume-input');
const volumeValue = document.getElementById('volume-value');
const musicVolumeInput = document.getElementById('music-volume-input');
const musicVolumeValue = document.getElementById('music-volume-value');
const giveUpButton = document.getElementById('give-up-button');

/** Schaltet den Spielton über das Symbol um. */
function toggleSound(event) {
    gameAudio.setEnabled(!gameAudio.enabled);
    /** Synchronisiert Status und Beschriftung des Ton-Symbols. */
    updateSoundButton();
    focusGameAfterClick(event);
}

function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(gameAudio.enabled));
    soundButton.title = gameAudio.enabled ? 'Spielton ausschalten' : 'Spielton einschalten';
}

/** Übernimmt den Reglerwert und zeigt die aktuelle Lautstärke an. */
function updateVolume() {
    gameAudio.setVolume(Number(volumeInput.value));
    volumeValue.value = gameAudio.volume + ' %';
}

/** Übernimmt und speichert die Lautstärke der Hintergrundmusik. */
function updateMusicVolume() {
    gameAudio.setMusicVolume(Number(musicVolumeInput.value));
    musicVolumeValue.value = gameAudio.musicVolume + ' %';
}

/** Öffnet die Einstellungen und pausiert eine gegebenenfalls laufende Runde. */
function openSettings() {
    if (world && !world.stopped) pauseGame();
    giveUpButton.hidden = !world || world.stopped;
    settingsDialog.showModal();
}

/** Schließt den Dialog bei einem Klick außerhalb seiner sichtbaren Fläche. */
function closeOnBackdrop(dialog) {
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const { left, top, right, bottom } = dialog.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right ||
            event.clientY < top || event.clientY > bottom) dialog.close();
    });
}

/** Synchronisiert das Vollbild-Symbol mit dem aktuellen Modus. */
function updateFullscreenButton() {
    const active = document.fullscreenElement === gameStage ||
        gameStage.classList.contains('viewport-fullscreen');
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.title = active ? 'Vollbild ausschalten' : 'Vollbild einschalten';
}

/** Wechselt zwischen Fenster- und Vollbildansicht. */
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

/** Versucht natives Vollbild und nutzt bei Bedarf das Seitenlayout als Ersatz. */
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

/** Gibt der Spielfläche nach einem Zeigerklick den Tastaturfokus zurück. */
function focusGameAfterClick(event) {
    if (event.detail > 0 && world?.win === null) {
        canvas.focus({ preventScroll: true });
    }
}

/** Prüft, ob ein Einstellungsdialog den Tastaturfokus beansprucht. */
function isSettingsOpen() {
    return settingsDialog.open || impressumDialog.open;
}

/** Wechselt aus den Einstellungen zum Impressum. */
function openImpressum(event) {
    event.preventDefault();
    settingsDialog.close();
    impressumDialog.showModal();
}

/** Beendet das Vollbild-Ersatzlayout mit Escape. */
function exitFallbackFullscreen(event) {
    if (isSettingsOpen() || event.key !== 'Escape' ||
        !gameStage.classList.contains('viewport-fullscreen')) return;
    gameStage.classList.remove('viewport-fullscreen');
    updateFullscreenButton();
}

/** Initialisiert die Einstellungen mit den gespeicherten Audiowerten. */
function connectGameSettings() {
    giveUpButton.addEventListener('click', returnToStart);
    settingsButton.addEventListener('click', openSettings);
    connectVolumeControls();
    /** Bindet das Impressum und das Schließen beider Dialoge. */
    connectDialogs();
    /** Bindet Ton- und Vollbildsteuerung an die Werkzeugleiste. */
    connectToolbar();
}

/** Zeigt die gespeicherten Lautstärken an und bindet beide Regler. */
function connectVolumeControls() {
    volumeInput.value = gameAudio.volume;
    volumeValue.value = gameAudio.volume + ' %';
    volumeInput.addEventListener('input', updateVolume);
    musicVolumeInput.value = gameAudio.musicVolume;
    musicVolumeValue.value = gameAudio.musicVolume + ' %';
    musicVolumeInput.addEventListener('input', updateMusicVolume);
}

function connectDialogs() {
    document.getElementById('impressum-link').addEventListener('click', openImpressum);
    impressumDialog.addEventListener('close', () => settingsDialog.showModal());
    closeOnBackdrop(settingsDialog);
    closeOnBackdrop(impressumDialog);
}

function connectToolbar() {
    updateSoundButton();
    soundButton.addEventListener('click', toggleSound);
    fullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('keydown', exitFallbackFullscreen);
}
