class ThrowableObject extends MovableObject {
    static size = 44;
    static frameDuration = 0.075;
    static rotationImages = [1, 2, 3, 4].map(frame =>
        `img/6_salsa_bottle/bottle_rotation/${frame}_bottle_rotation.png`
    );
    static splashImages = [1, 2, 3, 4, 5, 6].map(frame =>
        `img/6_salsa_bottle/bottle_rotation/bottle_splash/${frame}_bottle_splash.png`
    );

    width = ThrowableObject.size;
    height = ThrowableObject.size;
    isReflected = false;
    flightTime = 0;
    splashTime = null;
    velocityY = -380;
    gravity = 1350;

    static preloadSprites() {
        DrawableObject.preloadImages([...this.rotationImages, ...this.splashImages]);
    }

    constructor(x, y, direction, bottle) {
        super();
        this.x = x;
        this.y = y;
        this.velocityX = direction * 650;
        this.sourceBottle = bottle;
        this.damage = bottle.damage;
    }

    get isSplashing() {
        return this.splashTime !== null;
    }

    get hasFinishedSplash() {
        return this.isSplashing &&
            this.splashTime >= ThrowableObject.splashImages.length * ThrowableObject.frameDuration;
    }

    update(deltaTime) {
        if (this.isSplashing) {
            this.splashTime += deltaTime;
            return;
        }

        this.flightTime += deltaTime;
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime + 0.5 * this.gravity * deltaTime ** 2;
        this.velocityY += this.gravity * deltaTime;
    }

    reflect(target) {
        this.isReflected = true;
        this.velocityX *= -1;

        const targetX = (target.left + target.right) / 2;
        const targetY = (target.top + target.bottom) / 2;
        const distanceX = targetX - (this.x + this.width / 2);
        const distanceY = targetY - (this.y + this.height / 2);
        const travelTime = Math.max(0.12, Math.abs(distanceX / this.velocityX));

        // Aim the returning arc at Pepe's position at the moment of impact.
        this.velocityY = distanceY / travelTime - 0.5 * this.gravity * travelTime;
    }

    splash() {
        this.splashTime = 0;
    }

    hasLanded() {
        return this.velocityY >= 0 && this.y + this.height >= SalsaBottle.groundY;
    }

    draw(ctx) {
        const { frameDuration, rotationImages, splashImages } = ThrowableObject;
        if (this.isSplashing) {
            const index = Math.min(Math.floor(this.splashTime / frameDuration), splashImages.length - 1);
            const image = DrawableObject.getImage(splashImages[index]);
            if (image.naturalWidth > 0) {
                ctx.drawImage(image, 70, 29, 354, 355, this.x - 18, this.y - 18, 80, 80);
            }
            return;
        }

        const index = Math.floor(this.flightTime / frameDuration) % rotationImages.length;
        const image = DrawableObject.getImage(rotationImages[index]);
        if (image.naturalWidth > 0) {
            ctx.drawImage(image, 54, 54, 292, 300, this.x, this.y, this.width, this.height);
        }
    }
}
