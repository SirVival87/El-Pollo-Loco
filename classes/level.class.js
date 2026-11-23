class Level {
    enemies;
    clouds;
    backgroundObjects;
    levelEndX;
    bottles;
    coins;

    /** Speichert Levelobjekte und die Längen der wiederholbaren Kulissen. */
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

    /** Berechnet die Breite einer Kulissenschleife aus ihren unterschiedlichen Kachelpositionen. */
    getSceneryLoopWidth(objects) {
        const tileCount = new Set(objects.map(object => object.x)).size;
        return tileCount * (objects[0]?.width ?? 0);
    }
}
