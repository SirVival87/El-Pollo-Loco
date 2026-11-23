/** @file Gemeinsame JSDoc-Typen für Eingaben, Spielzustand und Audio. */

/**
 * Eine Spielaktion. Zulässige Werte sind `left`, `right`, `up` und `action`.
 * @typedef {string} GameAction
 */

/**
 * Auslöser einer gehaltenen Bildschirmaktion.
 * @typedef {(number|HTMLButtonElement)} ControlSource
 */

/**
 * Entscheidet, ob die Spielwelt eine Eingabe verarbeitet.
 * @callback AcceptGameAction
 * @param {GameAction} action - Angefragte Spielaktion.
 * @returns {boolean} Ob die Aktion angenommen wurde.
 */

/**
 * Entscheidet, ob eine bestimmte Bildschirmtaste die zugehörige Aktion auslösen darf.
 * @callback ActionAvailabilityCheck
 * @returns {boolean} Ob die Taste und die Spielaktion freigegeben sind.
 */

/**
 * Benachrichtigt die Oberfläche nach dem ersten gezeichneten Endbildschirm.
 * @callback GameEndCallback
 * @param {boolean} won - Ob die Runde gewonnen wurde.
 */

/**
 * Benachrichtigt die Oberfläche, wenn der Pausenzustand wechselt.
 * @callback PauseChangeCallback
 * @param {boolean} paused - Ob die Spielwelt jetzt pausiert.
 */

/**
 * Führt ein Ereignis bei Erreichen seiner geplanten Levelzeit aus.
 * @callback LevelChangeCallback
 */

/**
 * Achsenparallele Hitbox in Weltkoordinaten.
 * @typedef {Object} CollisionBounds
 * @property {number} left - X-Koordinate der linken Kante.
 * @property {number} top - Y-Koordinate der oberen Kante.
 * @property {number} right - X-Koordinate der rechten Kante.
 * @property {number} bottom - Y-Koordinate der unteren Kante.
 */

/**
 * Bildausschnitt und Anzeigegröße eines Sammelobjekts.
 * @typedef {Object} CollectibleSprite
 * @property {string} path - Relativer Pfad zur Sprite-Datei.
 * @property {number[]} source - Quellrechteck in Bildpixeln mit X, Y, Breite und Höhe.
 * @property {number} width - Anzeigebreite in Pixeln.
 * @property {number} height - Anzeigehöhe in Pixeln.
 */

/**
 * Im Browser gespeicherte Audioeinstellungen.
 * @typedef {Object} AudioPreferences
 * @property {boolean} [enabled] - Ob der Spielton aktiviert ist.
 * @property {number} [volume] - Einstellung für Soundeffekte zwischen 0 und 100.
 * @property {number} [musicVolume] - Einstellung für Hintergrundmusik zwischen 0 und 100.
 * @property {number} [volumeScale] - Version der Skala zur Umrechnung älterer Einstellungen.
 */

/**
 * Eine synthetisierte Tonspur oder gefilterte Rauschspur.
 * @typedef {Object} SoundLayer
 * @property {number} start - Startfrequenz in Hertz.
 * @property {number} end - Endfrequenz in Hertz.
 * @property {number} duration - Dauer in Sekunden.
 * @property {number} volume - Spitzenwert der Verstärkung vor dem Effektregler.
 * @property {number} [delay=0] - Verzögerung ab dem Beginn des Effekts in Sekunden.
 * @property {number} [attack=0.004] - Einschwingzeit der Verstärkung in Sekunden.
 * @property {OscillatorType} [shape=triangle] - Wellenform einer Tonspur.
 */
