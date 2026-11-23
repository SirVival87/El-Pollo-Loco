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


  constructor() {
    document.addEventListener("keydown", (event) => {
      const { code, repeat, target } = event;
      if (code === 'Space' && target?.closest?.('button')) return;
      if (repeat || this.pressed.has(code)) return;

      const action = Object.keys(this.controls).find(name => this.controls[name].includes(code));
      if (!action) return;

      this.pressed.add(code);
      this.tapControl(action);
    });

    document.addEventListener("keyup", (event) => {
      this.pressed.delete(event.code);
    });

    globalThis.addEventListener('blur', () => this.reset());
  }


  reset() {
    this.pressed.clear();
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
    return this.consumeTap(action);
  }
}