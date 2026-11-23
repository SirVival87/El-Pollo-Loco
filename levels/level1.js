const LEVEL_END_X = 720 * 15;

/**
 * Platziert Hühner des gewählten Typs außerhalb von Pepes Startbereich.
 * @param {number} amount - Gewünschte Anzahl Hühner.
 * @param {number} levelEndX - Rechte Levelgrenze in Weltkoordinaten.
 * @param {Function} [ChickenType=Chicken] - Konstruktor für den gewünschten Hühnertyp.
 * @returns {Chicken[]} Erstellte Hühner außerhalb des Sicherheitsabstands.
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
 * Liefert eine zulässige zufällige Position oder null, falls es keine gibt.
 * @param {number} minX - Linke Grenze in Weltkoordinaten.
 * @param {number} maxX - Rechte Grenze in Weltkoordinaten.
 * @param {number} playerX - Aktuelle oder vorgesehene horizontale Position von Pepe.
 * @param {number} safeDistance - Mindestabstand zu Pepe in Pixeln.
 * @returns {?number} Zulässige X-Position oder null, falls keine Stelle verfügbar ist.
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
    [6810, 208], [7570, 170],
    [8830, 305], [10020, 290],
];

const sceneryTiles = [[-720, 2], [0, 1], [720, 2], [1440, 1]];
const groundLayers = ['3_third_layer', '2_second_layer', '1_first_layer'];

/**
 * Erstellt eine neue Instanz des ersten Levels mit frischen Spielobjekten.
 * @returns {Level} Erstes Level mit frischen Spielobjekten.
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
 * Erstellt die Gegner des ersten Levels.
 * @returns {Array<(Chicken|Endboss)>} Normale Hühner, kleine Hühner und der Boss.
 */
function createLevel1Enemies() {
    return [
        ...createChickens(10, LEVEL_END_X),
        ...createChickens(7, LEVEL_END_X, SmallChicken),
        new Endboss(LEVEL_END_X),
    ];
}

/**
 * Erstellt Wolken aus der Kachelkonfiguration.
 * @returns {Cloud[]} Wolken an den konfigurierten Kachelpositionen.
 */
function createClouds() {
    return sceneryTiles.map(([x, variant]) => new Cloud(
        `img/5_background/layers/4_clouds/${variant}.png`, x
    ));
}

/**
 * Erstellt für jede Kachelposition die Hintergrundebenen in Zeichenreihenfolge.
 * @returns {BackgroundObject[]} Hintergrundkacheln in Zeichenreihenfolge.
 */
function createBackground() {
    return sceneryTiles.flatMap(([x, variant]) => [
        new BackgroundObject('img/5_background/layers/air.png', x),
        ...groundLayers.map(layer => new BackgroundObject(
            `img/5_background/layers/${layer}/${variant}.png`, x
        )),
    ]);
}
