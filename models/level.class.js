class level {
    enemies;
    clouds;
    backgroundObjects;
    level_end_x;
    bottles;
    coins;

    constructor(enemies, clouds, backgroundObjects, levelEndX = 720 * 5, bottles = [], coins = []) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.level_end_x = levelEndX;
        this.bottles = bottles;
        this.coins = coins;
        this.backgroundLoopWidth = this.getSceneryLoopWidth(backgroundObjects);
        this.cloudLoopWidth = this.getSceneryLoopWidth(clouds);
    }

    getSceneryLoopWidth(objects) {
        const tileCount = new Set(objects.map(object => object.x)).size;
        return tileCount * (objects[0]?.width ?? 0);
    }
}