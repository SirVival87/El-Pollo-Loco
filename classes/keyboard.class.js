/** Collects keyboard and on-screen input for the game loop. */
class Keyboard {
    pressed = new Set();
    heldControls = new Map();
    tappedControls = new Set();
    controls = {
        up: ["KeyW", "ArrowUp", "Space"],
        left: ["KeyA", "ArrowLeft"],
        right: ["KeyD", "ArrowRight"],
        action: ["KeyE", "KeyF"],
    };

    /**
     * Registers keyboard input and resets it when the window loses focus.
     * @param {AcceptGameAction} [acceptAction] - Decides whether the game accepts an action. Allows all actions by default.
     */
    constructor(acceptAction = () => true) {
        document.addEventListener('keydown', event => this.handleKeyDown(event, acceptAction));
        document.addEventListener('keyup', event => this.pressed.delete(event.code));
        globalThis.addEventListener('blur', () => this.reset());
    }

    /**
     * Records a new key press when the game accepts its action.
     * @param {KeyboardEvent} event - Browser keydown event.
     * @param {AcceptGameAction} acceptAction - Checks whether the game accepts the action.
     */
    handleKeyDown(event, acceptAction) {
        const { code, repeat, target } = event;
        if (code === 'Space' && target?.closest?.('button')) return;
        if (repeat || this.pressed.has(code)) return;

        const action = Object.keys(this.controls).find(name => this.controls[name].includes(code));
        if (!action || !acceptAction(action)) return;

        this.pressed.add(code);
        this.tapControl(action);
    }

    /** Clears held inputs and queued actions. */
    reset() {
        this.pressed.clear();
        this.heldControls.clear();
        this.tappedControls.clear();
    }

    /**
     * Holds an action for the specified input source.
     * @param {GameAction} action - Name of the game action.
     * @param {ControlSource} source - Pointer ID or focused on-screen button.
     */
    holdControl(action, source) {
        this.heldControls.set(source, action);
    }

    /**
     * Releases the action held by an input source.
     * @param {ControlSource} source - Pointer ID or focused on-screen button.
     */
    releaseControl(source) {
        this.heldControls.delete(source);
    }

    /**
     * Queues a one-time action for the next update.
     * @param {GameAction} action - Name of the game action.
     */
    tapControl(action) {
        this.tappedControls.add(action);
    }

    /**
     * Consumes a queued action.
     * @param {GameAction} action - Name of the game action.
     * @returns {boolean} Whether a queued action was removed.
     */
    consumeTap(action) {
        return this.tappedControls.delete(action);
    }

    /**
     * Checks whether an action is held on the keyboard or an on-screen button.
     * @param {GameAction} action - Name of the game action.
     * @returns {boolean} Whether the action is currently held.
     */
    isPressed(action) {
        for (const heldAction of this.heldControls.values()) {
            if (heldAction === action) return true;
        }
        return this.controls[action].some((code) => this.pressed.has(code));
    }

    /**
     * Consumes a queued action once.
     * @param {GameAction} action - Name of the game action.
     * @returns {boolean} Whether a one-time action was pending.
     */
    isPressedOnce(action) {
        return this.consumeTap(action);
    }
}
