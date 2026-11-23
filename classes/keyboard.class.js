/** Sammelt Tastatur- und Bildschirmaktionen für die Spielschleife. */
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
     * Verbindet die Tastatur und setzt die Eingabe beim Fensterwechsel zurück.
     * @param {AcceptGameAction} [acceptAction] - Entscheidet, ob das Spiel eine Eingabe annimmt. Standardmäßig sind alle Aktionen erlaubt.
     */
    constructor(acceptAction = () => true) {
        document.addEventListener('keydown', event => this.handleKeyDown(event, acceptAction));
        document.addEventListener('keyup', event => this.pressed.delete(event.code));
        globalThis.addEventListener('blur', () => this.reset());
    }

    /**
     * Erfasst einen neuen Tastendruck, wenn das Spiel die Aktion annimmt.
     * @param {KeyboardEvent} event - Tastendruck des Browsers.
     * @param {AcceptGameAction} acceptAction - Prüft, ob das Spiel die Aktion annimmt.
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

    /** Entfernt gehaltene Tasten und ausstehende Aktionen. */
    reset() {
        this.pressed.clear();
        this.heldControls.clear();
        this.tappedControls.clear();
    }

    /**
     * Hält eine Aktion für die angegebene Eingabequelle gedrückt.
     * @param {GameAction} action - Name der Spielaktion.
     * @param {ControlSource} source - Pointer-ID oder fokussierte Bildschirmtaste.
     */
    holdControl(action, source) {
        this.heldControls.set(source, action);
    }

    /**
     * Entfernt die gehaltene Aktion einer Eingabequelle.
     * @param {ControlSource} source - Pointer-ID oder fokussierte Bildschirmtaste.
     */
    releaseControl(source) {
        this.heldControls.delete(source);
    }

    /**
     * Merkt eine einmalige Aktion für die nächste Aktualisierung vor.
     * @param {GameAction} action - Name der Spielaktion.
     */
    tapControl(action) {
        this.tappedControls.add(action);
    }

    /**
     * Liest und entfernt eine vorgemerkte Aktion.
     * @param {GameAction} action - Name der Spielaktion.
     * @returns {boolean} Ob eine vorgemerkte Aktion entfernt wurde.
     */
    consumeTap(action) {
        return this.tappedControls.delete(action);
    }

    /**
     * Prüft, ob die Aktion über Tastatur oder Bildschirmtaste gehalten wird.
     * @param {GameAction} action - Name der Spielaktion.
     * @returns {boolean} Ob die Aktion gerade gehalten wird.
     */
    isPressed(action) {
        for (const heldAction of this.heldControls.values()) {
            if (heldAction === action) return true;
        }
        return this.controls[action].some((code) => this.pressed.has(code));
    }

    /**
     * Verarbeitet eine vorgemerkte Aktion einmalig.
     * @param {GameAction} action - Name der Spielaktion.
     * @returns {boolean} Ob eine einmalige Aktion zur Verarbeitung vorlag.
     */
    isPressedOnce(action) {
        return this.consumeTap(action);
    }
}
