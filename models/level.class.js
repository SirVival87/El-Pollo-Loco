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
    }
}