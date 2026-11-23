class Collectible extends DrawableObject {
    constructor(x, y, sprite) {
        super();
        this.x = x;
        this.y = y;
        this.width = sprite.width;
        this.height = sprite.height;
        this.source = sprite.source;
        this.loadImage(sprite.path);
    }

    draw(ctx) {
        if (this.img.naturalWidth === 0) return;

        ctx.drawImage(
            this.img, ...this.source,
            this.x, this.y, this.width, this.height
        );
    }
}

class SalsaBottle extends Collectible {
    static damage = 35;
    static width = 26;
    static height = 48;
    static groundY = 426;

    damage = SalsaBottle.damage;

    constructor(x, y = SalsaBottle.groundY - SalsaBottle.height) {
        super(x, y, {
            path: 'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
            source: [177, 78, 149, 277],
            width: SalsaBottle.width,
            height: SalsaBottle.height,
        });
        this.spawnX = x;
        this.spawnY = y;
    }

    returnToSpawn() {
        this.x = this.spawnX;
        this.y = this.spawnY;
    }
}
