/**
 * Connects an on-screen button to pointer and keyboard input.
 * @param {HTMLButtonElement} button - On-screen button with a data-game-action attribute.
 * @param {Keyboard} keyboard - Input state used to control the game.
 * @param {AcceptGameAction} acceptAction - Checks whether the game accepts the action.
 */
function connectPlayButton(button, keyboard, acceptAction) {
    const action = button.dataset.gameAction;
    const holdToMove = action === 'left' || action === 'right';
    /** @returns {boolean} Whether the on-screen button can trigger this action. */
    const canUse = () => !button.disabled && acceptAction(action);
    button.addEventListener('contextmenu', event => event.preventDefault());
    connectPointerControl(button, keyboard, action, holdToMove, canUse);
    button.addEventListener('click', event => {
        if (event.detail === 0 && canUse()) keyboard.tapControl(action);
    });
    if (holdToMove) connectHoldKeys(button, keyboard, action, acceptAction);
}

/**
 * Handles pressing and releasing an on-screen button with a pointer.
 * @param {HTMLButtonElement} button - On-screen button with a data-game-action attribute.
 * @param {Keyboard} keyboard - Input state used to control the game.
 * @param {GameAction} action - Name of the game action.
 * @param {boolean} holdToMove - Whether to hold the action until the pointer is released.
 * @param {ActionAvailabilityCheck} canUse - Checks whether this specific button can be used.
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
 * Allows keyboard users to hold a focused direction button.
 * @param {HTMLButtonElement} button - On-screen button with a data-game-action attribute.
 * @param {Keyboard} keyboard - Input state used to control the game.
 * @param {GameAction} action - Name of the game action.
 * @param {AcceptGameAction} acceptAction - Checks whether the game accepts the action.
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
 * Checks whether Enter or Space activates a button.
 * @param {KeyboardEvent} event - Keyboard event to check.
 * @returns {boolean} Whether Enter or Space was used.
 */
function isActivationKey(event) {
    return event.key === 'Enter' || event.code === 'Space';
}
