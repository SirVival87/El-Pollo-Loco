/** Zeichenbares Sammelobjekt mit einem festgelegten Sprite-Ausschnitt. */
class Collectible extends DrawableObject {
    /**
     * Setzt Position, Bild und Ausschnitt des Sammelobjekts.
     * @param {number} x - Linke Kante in Weltkoordinaten.
     * @param {number} y - Obere Kante in Weltkoordinaten.
     * @param {CollectibleSprite} sprite - Bildpfad, Bildausschnitt und Anzeigegröße.
     */
    constructor(x, y, sprite) {
        super();
        this.x = x;
        this.y = y;
        this.width = sprite.width;
        this.height = sprite.height;
        this.source = sprite.source;
        this.loadImage(sprite.path);
    }

    /**
     * Zeichnet den für das Sammelobjekt festgelegten Bildausschnitt.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     */
    draw(ctx) {
        if (this.img.naturalWidth === 0) return;

        ctx.drawImage(
            this.img, ...this.source,
            this.x, this.y, this.width, this.height
        );
    }
}

/** Einsammelbare Salsa-Flasche mit einem festen Schadenswert. */
class SalsaBottle extends Collectible {
    static damage = 35;
    static width = 26;
    static height = 48;
    static groundY = 426;

    damage = SalsaBottle.damage;

    /**
     * Platziert eine Flasche standardmäßig auf dem Sand.
     * @param {number} x - Linke Kante in Weltkoordinaten.
     * @param {number} [y] - Obere Kante in Weltkoordinaten. Standardmäßig steht die Flasche auf dem Sand.
     */
    constructor(x, y = SalsaBottle.groundY - SalsaBottle.height) {
        super(x, y, {
            path: 'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
            source: [177, 78, 149, 277],
            width: SalsaBottle.width,
            height: SalsaBottle.height,
        });
    }
}
