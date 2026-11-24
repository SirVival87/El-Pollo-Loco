const LEVEL_END_X = 720 * 15;

/**
 * Places chickens of the selected type outside Pepe's starting area.
 * @param {number} amount - Requested number of chickens.
 * @param {number} levelEndX - Right level boundary in world coordinates.
 * @param {Function} [ChickenType=Chicken] - Constructor for the requested chicken type.
 * @returns {Chicken[]} Chickens placed outside the safe distance.
 */
function createChickens(amount, levelEndX, ChickenType = Chicken) {
    const chickens = [];
    const characterStartX = 60;
    const safeDistance = 300;

    for (let i = 0; i < amount; i++) {
        const x = getRandomChickenX(0, levelEndX, characterStartX, safeDistance);
        if (x === null) break;
        chickens.push(new ChickenType(x, levelEndX));
    }

    return chickens;
}

/**
 * Returns a valid random position or null if no position is available.
 * @param {number} minX - Left boundary in world coordinates.
 * @param {number} maxX - Right boundary in world coordinates.
 * @param {number} playerX - Current or expected horizontal position of Pepe.
 * @param {number} safeDistance - Minimum distance from Pepe in pixels.
 * @returns {?number} Valid X coordinate or null if no position is available.
 */
function getRandomChickenX(minX, maxX, playerX, safeDistance) {
    if (minX > maxX) return null;
    const leftEnd = Math.min(maxX, playerX - safeDistance);
    const rightStart = Math.max(minX, playerX + safeDistance);
    const leftWidth = Math.max(0, leftEnd - minX);
    const rightWidth = Math.max(0, maxX - rightStart);
    const availableWidth = leftWidth + rightWidth;

    if (availableWidth === 0) {
        return [minX, maxX].find(x => Math.abs(x - playerX) >= safeDistance) ?? null;
    }
    const offset = Math.random() * availableWidth;
    return offset < leftWidth ? minX + offset : rightStart + (offset - leftWidth);
}

const bottlePositions = [440, 2500, 5000, 7500, LEVEL_END_X - 740];

const coinSprite = {
    path: 'img/8_coin/coin_1.png',
    source: [96, 97, 108, 107],
    width: 38,
    height: 38,
};
const coinPositions = [
    [530, 335], [650, 305], [1900, 272],
    [3200, 345], [4350, 310], [5550, 270],
    [6810, 208], [7570, 190],
    [8830, 305], [10020, 290],
];

const sceneryTiles = [[-720, 2], [0, 1], [720, 2], [1440, 1]];
const groundLayers = ['3_third_layer', '2_second_layer', '1_first_layer'];

/**
 * Creates a new first level with fresh game objects.
 * @returns {Level} First level with fresh game objects.
 */
function createLevel1() {
    return new Level(
        createLevel1Enemies(),
        createClouds(),
        createBackground(),
        LEVEL_END_X,
        bottlePositions.map(x => new SalsaBottle(x)),
        coinPositions.map(([x, y]) => new Collectible(x, y, coinSprite)),
    );
}

/**
 * Creates the enemies for the first level.
 * @returns {Array<(Chicken|Endboss)>} Regular chickens, small chickens, and the boss.
 */
function createLevel1Enemies() {
    return [
        ...createChickens(10, LEVEL_END_X),
        ...createChickens(7, LEVEL_END_X, SmallChicken),
        new Endboss(LEVEL_END_X),
    ];
}

/**
 * Creates clouds from the tile configuration.
 * @returns {Cloud[]} Clouds at the configured tile positions.
 */
function createClouds() {
    return sceneryTiles.map(([x, variant]) => new Cloud(
        `img/5_background/layers/4_clouds/${variant}.png`, x
    ));
}

/**
 * Creates the background layers for each tile position in draw order.
 * @returns {BackgroundObject[]} Background tiles in draw order.
 */
function createBackground() {
    return sceneryTiles.flatMap(([x, variant]) => [
        new BackgroundObject('img/5_background/layers/air.png', x),
        ...groundLayers.map(layer => new BackgroundObject(
            `img/5_background/layers/${layer}/${variant}.png`, x
        )),
    ]);
}
