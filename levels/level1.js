const LEVEL_END_X = 720 * 15;

function createChickens(amount, levelEndX, ChickenType = Chicken) {
    const chickens = [];
    const characterStartX = 60;
    const safeDistance = 300;
    const minX = 0;
    const maxX = levelEndX;

    for (let i = 0; i < amount; i++) {
        const x = getRandomChickenX(minX, maxX, characterStartX, safeDistance);
        if (x === null) break;
        chickens.push(new ChickenType(x, levelEndX));
    }

    return chickens;
}

function getRandomChickenX(minX, maxX, playerX, safeDistance) {
    if (minX > maxX) return null;

    const leftEnd = Math.min(maxX, playerX - safeDistance);
    const rightStart = Math.max(minX, playerX + safeDistance);
    const leftWidth = Math.max(0, leftEnd - minX);
    const rightWidth = Math.max(0, maxX - rightStart);
    const availableWidth = leftWidth + rightWidth;

    if (availableWidth === 0) {
        if (Math.abs(minX - playerX) >= safeDistance) return minX;
        if (Math.abs(maxX - playerX) >= safeDistance) return maxX;
        return null;
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
    [6810, 208], [7570, 170],
    [8830, 305], [10020, 290],
];

function createLevel1() {
    const bottles = bottlePositions.map(x => new SalsaBottle(x));
    const coins = coinPositions.map(([x, y]) => new Collectible(x, y, coinSprite));

    return new level(
        [
            ...createChickens(10, LEVEL_END_X),
            ...createChickens(7, LEVEL_END_X, SmallChicken),
            new Endboss(LEVEL_END_X),
        ],
        [
            new Cloud('img/5_background/layers/4_clouds/2.png', -720),
            new Cloud('img/5_background/layers/4_clouds/1.png', 0),
            new Cloud('img/5_background/layers/4_clouds/2.png', 720),
            new Cloud('img/5_background/layers/4_clouds/1.png', 1440),
        ],
        [
            new BackgroundObject('img/5_background/layers/air.png', -720),
            new BackgroundObject('img/5_background/layers/3_third_layer/2.png', -720),
            new BackgroundObject('img/5_background/layers/2_second_layer/2.png', -720),
            new BackgroundObject('img/5_background/layers/1_first_layer/2.png', -720),
            new BackgroundObject('img/5_background/layers/air.png', 0),
            new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 0),
            new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 0),
            new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 0),
            new BackgroundObject('img/5_background/layers/air.png', 720),
            new BackgroundObject('img/5_background/layers/3_third_layer/2.png', 720),
            new BackgroundObject('img/5_background/layers/2_second_layer/2.png', 720),
            new BackgroundObject('img/5_background/layers/1_first_layer/2.png', 720),
            new BackgroundObject('img/5_background/layers/air.png', 1440),
            new BackgroundObject('img/5_background/layers/3_third_layer/1.png', 1440),
            new BackgroundObject('img/5_background/layers/2_second_layer/1.png', 1440),
            new BackgroundObject('img/5_background/layers/1_first_layer/1.png', 1440),
        ],
        LEVEL_END_X,
        bottles,
        coins,
    );
}
