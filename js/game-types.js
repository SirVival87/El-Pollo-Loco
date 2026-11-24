/** @file Shared JSDoc types for input, game state, and audio. */

/**
 * Game action. Supported values are `left`, `right`, `up`, and `action`.
 * @typedef {string} GameAction
 */

/**
 * Input source holding an on-screen action.
 * @typedef {(number|HTMLButtonElement)} ControlSource
 */

/**
 * Decides whether the game world processes a given action.
 * @callback AcceptGameAction
 * @param {GameAction} action - Requested game action.
 * @returns {boolean} Whether the game accepted the action.
 */

/**
 * Decides whether a specific on-screen button can trigger its action.
 * @callback ActionAvailabilityCheck
 * @returns {boolean} Whether the button and its action are available.
 */

/**
 * Notifies the interface when the end screen is first drawn.
 * @callback GameEndCallback
 * @param {boolean} won - Whether the round was won.
 */

/**
 * Notifies the interface when the pause state changes.
 * @callback PauseChangeCallback
 * @param {boolean} paused - Whether the game world is now paused.
 */

/**
 * Runs an event when its scheduled level time is reached.
 * @callback LevelChangeCallback
 */

/**
 * Axis-aligned hitbox in world coordinates.
 * @typedef {Object} CollisionBounds
 * @property {number} left - X coordinate of the left edge.
 * @property {number} top - Y coordinate of the top edge.
 * @property {number} right - X coordinate of the right edge.
 * @property {number} bottom - Y coordinate of the bottom edge.
 */

/**
 * Insets from the sprite edges to a collision rectangle.
 * @typedef {Object} CollisionOffsets
 * @property {number} left - Inset from the left edge in pixels.
 * @property {number} top - Inset from the top edge in pixels.
 * @property {number} right - Inset from the right edge in pixels.
 * @property {number} bottom - Inset from the bottom edge in pixels.
 */

/**
 * Source region and display size of a collectible sprite.
 * @typedef {Object} CollectibleSprite
 * @property {string} path - Relative path to the sprite file.
 * @property {number[]} source - Source rectangle in image pixels as X, Y, width, and height.
 * @property {number} width - Display width in pixels.
 * @property {number} height - Display height in pixels.
 */

/**
 * Audio preferences stored in the browser.
 * @typedef {Object} AudioPreferences
 * @property {boolean} [enabled] - Whether game audio is enabled.
 * @property {number} [volume] - Sound-effect volume setting from 0 to 100.
 * @property {number} [musicVolume] - Background music volume setting from 0 to 100.
 * @property {number} [volumeScale] - Scale version used to convert older preferences.
 */

/**
 * Synthesized tone layer or filtered noise layer.
 * @typedef {Object} SoundLayer
 * @property {number} start - Start frequency in hertz.
 * @property {number} end - End frequency in hertz.
 * @property {number} duration - Duration in seconds.
 * @property {number} volume - Peak gain before the sound-effect volume control.
 * @property {number} [delay=0] - Delay from the start of the effect, in seconds.
 * @property {number} [attack=0.004] - Gain attack time in seconds.
 * @property {OscillatorType} [shape=triangle] - Waveform of a tone layer.
 */

/**
 * Synthesized sound effect with one or more layers.
 * @typedef {Object} SoundCue
 * @property {SoundLayer[]} [tones] - Tone layers in the effect.
 * @property {SoundLayer[]} [noise] - Noise layers in the effect.
 * @property {number} [interval] - Minimum time between plays in seconds.
 */
