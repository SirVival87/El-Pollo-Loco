/** Groups the scenery, enemies, and collectibles for a round. */
class Level {
    enemies;
    clouds;
    backgroundObjects;
    levelEndX;
    bottles;
    coins;

    /**
     * Stores the level objects and calculates the widths of repeating scenery.
     * @param {Array<(Chicken|Endboss)>} enemies - Enemies in the level.
     * @param {Cloud[]} clouds - Moving cloud tiles.
     * @param {BackgroundObject[]} backgroundObjects - Background tiles in draw order.
     * @param {number} [levelEndX] - Right level boundary in world coordinates. Defaults to five tile widths.
     * @param {SalsaBottle[]} [bottles] - Placed bottles. Defaults to an empty array.
     * @param {Collectible[]} [coins] - Placed coins. Defaults to an empty array.
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
     * Calculates the width of a scenery loop from its distinct tile positions.
     * @param {DrawableObject[]} objects - Scenery tiles of equal width.
     * @returns {number} Width of one full tile loop in pixels.
     */
    getSceneryLoopWidth(objects) {
        const tileCount = new Set(objects.map(object => object.x)).size;
        return tileCount * (objects[0]?.width ?? 0);
    }
}
