const gameStage = document.getElementById('game-stage');
const fullscreenButton = document.getElementById('fullscreen-button');
const soundButton = document.getElementById('sound-button');
const settingsButton = document.getElementById('settings-button');
const settingsDialog = document.getElementById('settings-dialog');
const volumeInput = document.getElementById('volume-input');
const volumeValue = document.getElementById('volume-value');
const musicVolumeInput = document.getElementById('music-volume-input');
const musicVolumeValue = document.getElementById('music-volume-value');
const giveUpButton = document.getElementById('give-up-button');

/**
 * Schaltet den Spielton über das Symbol um.
 * @param {MouseEvent} event - Aktivierung des Ton-Buttons.
 */
function toggleSound(event) {
    gameAudio.setEnabled(!gameAudio.enabled);
    updateSoundButton();
    focusGameAfterClick(event);
}

/** Synchronisiert Status und Beschriftung des Ton-Symbols. */
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

/**
 * Schließt den Dialog bei einem Klick außerhalb seiner sichtbaren Fläche.
 * @param {HTMLDialogElement} dialog - Modaler Dialog, der außerhalb seiner Box geschlossen werden soll.
 */
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

/**
 * Wechselt zwischen Fenster- und Vollbildansicht.
 * @param {MouseEvent} event - Aktivierung des Vollbild-Buttons.
 * @returns {Promise<void>} Wird nach dem Moduswechsel und der Aktualisierung des Buttons erfüllt.
 */
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

/**
 * Versucht natives Vollbild und nutzt bei Bedarf das Seitenlayout als Ersatz.
 * @returns {Promise<void>} Wird nach dem Wechsel in natives Vollbild oder das CSS-Ersatzlayout erfüllt.
 */
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

/**
 * Gibt der Spielfläche nach einem Zeigerklick den Tastaturfokus zurück.
 * @param {MouseEvent} event - Klickereignis zur Unterscheidung von Zeiger- und Tastaturaktivierung.
 */
function focusGameAfterClick(event) {
    if (event.detail > 0 && world?.win === null) {
        canvas.focus({ preventScroll: true });
    }
}

/**
 * Beendet das Vollbild-Ersatzlayout mit Escape.
 * @param {KeyboardEvent} event - Tastendruck, der auf Escape geprüft wird.
 */
function exitFallbackFullscreen(event) {
    if (settingsDialog.open || event.key !== 'Escape' ||
        !gameStage.classList.contains('viewport-fullscreen')) return;
    gameStage.classList.remove('viewport-fullscreen');
    updateFullscreenButton();
}

/** Initialisiert die Einstellungen mit den gespeicherten Audiowerten. */
function connectGameSettings() {
    giveUpButton.addEventListener('click', returnToStart);
    settingsButton.addEventListener('click', openSettings);
    connectVolumeControls();
    closeOnBackdrop(settingsDialog);
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

/** Bindet Ton- und Vollbildsteuerung an die Werkzeugleiste. */
function connectToolbar() {
    updateSoundButton();
    soundButton.addEventListener('click', toggleSound);
    fullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('keydown', exitFallbackFullscreen);
}
