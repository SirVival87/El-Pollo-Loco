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

    /** Verbindet die Tastatur und setzt die Eingabe beim Fensterwechsel zurück. */
    constructor(acceptAction = () => true) {
        document.addEventListener('keydown', event => this.handleKeyDown(event, acceptAction));
        document.addEventListener('keyup', event => this.pressed.delete(event.code));
        globalThis.addEventListener('blur', () => this.reset());
    }

    /** Erfasst einen neuen Tastendruck, wenn das Spiel die Aktion annimmt. */
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

    /** Hält eine Aktion für die angegebene Eingabequelle gedrückt. */
    holdControl(action, source) {
        this.heldControls.set(source, action);
    }

    /** Entfernt die gehaltene Aktion einer Eingabequelle. */
    releaseControl(source) {
        this.heldControls.delete(source);
    }

    /** Merkt eine einmalige Aktion für die nächste Aktualisierung vor. */
    tapControl(action) {
        this.tappedControls.add(action);
    }

    /** Liest und entfernt eine vorgemerkte Aktion. */
    consumeTap(action) {
        return this.tappedControls.delete(action);
    }

    /** Prüft, ob die Aktion über Tastatur oder Bildschirmtaste gehalten wird. */
    isPressed(action) {
        for (const heldAction of this.heldControls.values()) {
            if (heldAction === action) return true;
        }
        return this.controls[action].some((code) => this.pressed.has(code));
    }

    /** Verarbeitet eine vorgemerkte Aktion einmalig. */
    isPressedOnce(action) {
        return this.consumeTap(action);
    }
}
