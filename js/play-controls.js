/**
 * Verbindet eine Bildschirmtaste mit Zeiger- und Tastatureingaben.
 * @param {HTMLButtonElement} button Taste mit einem data-game-action-Attribut.
 * @param {Keyboard} keyboard Eingabestatus der Spielrunde.
 * @param {Function} acceptAction Gibt die Aktion für den aktuellen Spielzustand frei.
 */
function connectPlayButton(button, keyboard, acceptAction) {
    const action = button.dataset.gameAction;
    const holdToMove = action === 'left' || action === 'right';
    /** Prüft, ob die Bildschirmtaste die Aktion auslösen darf. */
    const canUse = () => !button.disabled && acceptAction(action);
    button.addEventListener('contextmenu', event => event.preventDefault());
    /** Verarbeitet Drücken und Loslassen einer Bildschirmtaste per Zeiger. */
    connectPointerControl(button, keyboard, action, holdToMove, canUse);
    button.addEventListener('click', event => {
        if (event.detail === 0 && canUse()) keyboard.tapControl(action);
    });
    if (holdToMove) connectHoldKeys(button, keyboard, action, acceptAction);
}

function connectPointerControl(button, keyboard, action, holdToMove, canUse) {
    button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !canUse()) return;
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
}

/** Unterstützt das Halten fokussierter Richtungstasten per Tastatur. */
function connectHoldKeys(button, keyboard, action, acceptAction) {
    button.addEventListener('keydown', event => {
        if (!isActivationKey(event) || !acceptAction(action)) return;
        event.preventDefault();
        keyboard.holdControl(action, button);
    });
    button.addEventListener('keyup', event => {
        if (isActivationKey(event)) keyboard.releaseControl(button);
    });
    button.addEventListener('blur', () => keyboard.releaseControl(button));
}

/** Prüft, ob Enter oder Leertaste eine Schaltfläche aktivieren. */
function isActivationKey(event) {
    return event.key === 'Enter' || event.code === 'Space';
}
