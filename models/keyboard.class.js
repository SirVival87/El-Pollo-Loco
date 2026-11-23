class Keyboard {
  pressed = new Set();
  wasPressed = new Set();
  heldControls = new Map();
  tappedControls = new Set();
  controls = {
    up: ["KeyW", "ArrowUp", "Space"],
    left: ["KeyA", "ArrowLeft"],
    right: ["KeyD", "ArrowRight"],
    action: ["KeyE", "KeyF"],
  };


  constructor() {
    document.addEventListener("keydown", (event) => {
      if (event.code === 'Space' && event.target?.closest?.('button')) return;
      this.pressed.add(event.code);
    });

    document.addEventListener("keyup", (event) => {
      this.pressed.delete(event.code);
      this.wasPressed.delete(event.code);
    });

    globalThis.addEventListener('blur', () => this.reset());
  }


  reset() {
    this.pressed.clear();
    this.wasPressed.clear();
    this.heldControls.clear();
    this.tappedControls.clear();
  }

  holdControl(action, source) {
    this.heldControls.set(source, action);
  }

  releaseControl(source) {
    this.heldControls.delete(source);
  }

  tapControl(action) {
    this.tappedControls.add(action);
  }

  consumeTap(action) {
    return this.tappedControls.delete(action);
  }

  isPressed(action) {
    for (const heldAction of this.heldControls.values()) {
      if (heldAction === action) return true;
    }
    return this.controls[action].some((code) => this.pressed.has(code));
  }


  isPressedOnce(action) {
    if (this.consumeTap(action)) return true;

    const key = this.controls[action]?.find((code) => this.pressed.has(code));

    if (!key || this.wasPressed.has(key)) {
      return false;
    }

    this.wasPressed.add(key);
    return true;
  }
}