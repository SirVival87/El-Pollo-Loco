const gameStage = document.getElementById('game-stage');
const fullscreenButton = document.getElementById('fullscreen-button');
const soundButton = document.getElementById('sound-button');
const settingsButton = document.getElementById('settings-button');
const settingsDialog = document.getElementById('settings-dialog');
const imprintDialog = document.getElementById('imprint-dialog');
const volumeInput = document.getElementById('volume-input');
const volumeValue = document.getElementById('volume-value');
const musicVolumeInput = document.getElementById('music-volume-input');
const musicVolumeValue = document.getElementById('music-volume-value');
const giveUpButton = document.getElementById('give-up-button');

/**
 * Toggles game audio from the toolbar.
 * @param {MouseEvent} event - Activation of the sound button.
 */
function toggleSound(event) {
    gameAudio.setEnabled(!gameAudio.enabled);
    updateSoundButton();
    focusGameAfterClick(event);
}

/** Updates the sound button state and label. */
function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(gameAudio.enabled));
    soundButton.title = gameAudio.enabled ? 'Spielton ausschalten' : 'Spielton einschalten';
}

/** Applies the slider value and displays the current sound-effect volume. */
function updateVolume() {
    gameAudio.setVolume(Number(volumeInput.value));
    volumeValue.value = gameAudio.volume + ' %';
}

/** Applies and saves the background music volume. */
function updateMusicVolume() {
    gameAudio.setMusicVolume(Number(musicVolumeInput.value));
    musicVolumeValue.value = gameAudio.musicVolume + ' %';
}

/** Opens settings and pauses a round if one is running. */
function openSettings() {
    if (world && !world.stopped) pauseGame();
    giveUpButton.hidden = !world || world.stopped;
    settingsDialog.showModal();
}

/**
 * Closes the dialog when the user clicks outside it.
 * @param {HTMLDialogElement} dialog - Modal dialog that closes when the user clicks outside it.
 */
function closeOnBackdrop(dialog) {
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const { left, top, right, bottom } = dialog.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right ||
            event.clientY < top || event.clientY > bottom) dialog.close();
    });
}

/** Updates the fullscreen button to match the current mode. */
function updateFullscreenButton() {
    const active = document.fullscreenElement === gameStage ||
        gameStage.classList.contains('viewport-fullscreen');
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.title = active ? 'Vollbild ausschalten' : 'Vollbild einschalten';
}

/**
 * Switches between windowed and fullscreen modes.
 * @param {MouseEvent} event - Activation of the fullscreen button.
 * @returns {Promise<void>} Resolves after switching modes and updating the button.
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
 * Requests native fullscreen and falls back to the CSS layout if needed.
 * @returns {Promise<void>} Resolves after entering native fullscreen or the CSS fallback.
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
 * Returns keyboard focus to the canvas after a pointer click.
 * @param {MouseEvent} event - Click event used to distinguish pointer and keyboard activation.
 */
function focusGameAfterClick(event) {
    if (event.detail > 0 && world?.win === null) {
        canvas.focus({ preventScroll: true });
    }
}

/**
 * Exits the CSS fullscreen fallback when Escape is pressed.
 * @param {KeyboardEvent} event - Keyboard event checked for Escape.
 */
function exitFallbackFullscreen(event) {
    if (settingsDialog.open || imprintDialog.open || event.key !== 'Escape' ||
        !gameStage.classList.contains('viewport-fullscreen')) return;
    gameStage.classList.remove('viewport-fullscreen');
    updateFullscreenButton();
}

/** Initializes settings with the saved audio preferences. */
function connectGameSettings() {
    giveUpButton.addEventListener('click', returnToStart);
    settingsButton.addEventListener('click', openSettings);
    connectVolumeControls();
    closeOnBackdrop(settingsDialog);
    closeOnBackdrop(imprintDialog);
    document.querySelectorAll('[data-impressum]').forEach(link => link.addEventListener('click', openImprint));
    connectToolbar();
}

/** Displays the saved volume values and connects both sliders. */
function connectVolumeControls() {
    volumeInput.value = gameAudio.volume;
    volumeValue.value = gameAudio.volume + ' %';
    volumeInput.addEventListener('input', updateVolume);
    musicVolumeInput.value = gameAudio.musicVolume;
    musicVolumeValue.value = gameAudio.musicVolume + ' %';
    musicVolumeInput.addEventListener('input', updateMusicVolume);
}

/** Connects the sound and fullscreen toolbar controls. */
function connectToolbar() {
    updateSoundButton();
    soundButton.addEventListener('click', toggleSound);
    fullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('keydown', exitFallbackFullscreen);
}

/**
 * Opens the static legal notice as an overlay and keeps the page available through the link.
 * @param {MouseEvent} event - Click on a legal-notice link.
 */
function openImprint(event) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pauseGame();
    if (!imprintDialog.open) imprintDialog.showModal();
}
