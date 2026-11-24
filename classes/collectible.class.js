/** Drawable collectible with a specified sprite region. */
class Collectible extends DrawableObject {
    /**
     * Sets the collectible's position, image, and source region.
     * @param {number} x - Left edge in world coordinates.
     * @param {number} y - Top edge in world coordinates.
     * @param {CollectibleSprite} sprite - Image path, source region, and display dimensions.
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
     * Draws the configured source region for the collectible.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context for the game canvas.
     */
    draw(ctx) {
        if (this.img.naturalWidth === 0) return;

        ctx.drawImage(
            this.img, ...this.source,
            this.x, this.y, this.width, this.height
        );
    }
}

/** Collectible salsa bottle with a fixed damage value. */
class SalsaBottle extends Collectible {
    static damage = 35;
    static width = 26;
    static height = 48;
    static groundY = 426;

    damage = SalsaBottle.damage;

    /**
     * Places a bottle on the sand by default.
     * @param {number} x - Left edge in world coordinates.
     * @param {number} [y] - Top edge in world coordinates. The bottle rests on the sand by default.
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
