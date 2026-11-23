/**
 * Verbindet eine Bildschirmtaste mit Zeiger- und Tastatureingaben.
 * @param {HTMLButtonElement} button - Bildschirmtaste mit einem data-game-action-Attribut.
 * @param {Keyboard} keyboard - Eingabestatus für die Spielsteuerung.
 * @param {AcceptGameAction} acceptAction - Prüft, ob das Spiel die Aktion annimmt.
 */
function connectPlayButton(button, keyboard, acceptAction) {
    const action = button.dataset.gameAction;
    const holdToMove = action === 'left' || action === 'right';
    /** @returns {boolean} Ob die Bildschirmtaste diese Aktion auslösen darf. */
    const canUse = () => !button.disabled && acceptAction(action);
    button.addEventListener('contextmenu', event => event.preventDefault());
    connectPointerControl(button, keyboard, action, holdToMove, canUse);
    button.addEventListener('click', event => {
        if (event.detail === 0 && canUse()) keyboard.tapControl(action);
    });
    if (holdToMove) connectHoldKeys(button, keyboard, action, acceptAction);
}

/**
 * Verarbeitet Drücken und Loslassen einer Bildschirmtaste per Zeiger.
 * @param {HTMLButtonElement} button - Bildschirmtaste mit einem data-game-action-Attribut.
 * @param {Keyboard} keyboard - Eingabestatus für die Spielsteuerung.
 * @param {GameAction} action - Name der Spielaktion.
 * @param {boolean} holdToMove - Ob die Aktion bis zum Loslassen gehalten wird.
 * @param {ActionAvailabilityCheck} canUse - Prüft den Freigabestatus genau dieser Taste.
 */
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

/**
 * Unterstützt das Halten fokussierter Richtungstasten per Tastatur.
 * @param {HTMLButtonElement} button - Bildschirmtaste mit einem data-game-action-Attribut.
 * @param {Keyboard} keyboard - Eingabestatus für die Spielsteuerung.
 * @param {GameAction} action - Name der Spielaktion.
 * @param {AcceptGameAction} acceptAction - Prüft, ob das Spiel die Aktion annimmt.
 */
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

/**
 * Prüft, ob Enter oder Leertaste eine Schaltfläche aktivieren.
 * @param {KeyboardEvent} event - Zu prüfender Tastendruck.
 * @returns {boolean} Ob Enter oder die Leertaste verwendet wurde.
 */
function isActivationKey(event) {
    return event.key === 'Enter' || event.code === 'Space';
}
