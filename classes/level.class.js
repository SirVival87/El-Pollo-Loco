/** Gruppiert die Kulissen, Gegner und Sammelobjekte einer Runde. */
class Level {
    enemies;
    clouds;
    backgroundObjects;
    levelEndX;
    bottles;
    coins;

    /**
     * Speichert Levelobjekte und die Längen der wiederholbaren Kulissen.
     * @param {Array<(Chicken|Endboss)>} enemies - Gegner des Levels.
     * @param {Cloud[]} clouds - Bewegliche Wolkenkacheln.
     * @param {BackgroundObject[]} backgroundObjects - Hintergrundkacheln in Zeichenreihenfolge.
     * @param {number} [levelEndX] - Rechte Levelgrenze in Weltkoordinaten. Der Standard entspricht fünf Kachelbreiten.
     * @param {SalsaBottle[]} [bottles] - Ausgelegte Flaschen. Standardmäßig leer.
     * @param {Collectible[]} [coins] - Ausgelegte Münzen. Standardmäßig leer.
     */
    constructor(enemies, clouds, backgroundObjects, levelEndX = 720 * 5, bottles = [], coins = []) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.levelEndX = levelEndX;
        this.bottles = bottles;
        this.coins = coins;
        this.backgroundLoopWidth = this.getSceneryLoopWidth(backgroundObjects);
        this.cloudLoopWidth = this.getSceneryLoopWidth(clouds);
    }

    /**
     * Berechnet die Breite einer Kulissenschleife aus ihren unterschiedlichen Kachelpositionen.
     * @param {DrawableObject[]} objects - Gleich breite Kacheln einer Kulisse.
     * @returns {number} Breite eines vollständigen Kachelzyklus in Pixeln.
     */
    getSceneryLoopWidth(objects) {
        const tileCount = new Set(objects.map(object => object.x)).size;
        return tileCount * (objects[0]?.width ?? 0);
    }
}
