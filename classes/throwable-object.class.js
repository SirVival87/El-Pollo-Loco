/** Thrown bottle with a flight path and splash animation. */
class ThrowableObject extends MovableObject {
    static size = 44;
    static baseThrowSpeed = 650;
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

    /** Preloads the rotation and splash frames. */
    static preloadSprites() {
        DrawableObject.preloadImages([...this.rotationImages, ...this.splashImages]);
    }

    /**
     * Creates the projectile from a collected bottle.
     * @param {number} x - Starting position along the horizontal world axis.
     * @param {number} y - Starting position along the vertical world axis.
     * @param {number} direction - Throw direction. Use 1 for right or -1 for left.
     * @param {SalsaBottle} bottle - Thrown bottle with its damage value.
     * @param {boolean} [airborne=false] - Whether Pepe is airborne or taking off when throwing.
     */
    constructor(x, y, direction, bottle, airborne = false) {
        super();
        this.x = x;
        this.y = y;
        const rangeFactor = airborne ? 2 / 3 : 0.5;
        this.velocityX = direction * ThrowableObject.baseThrowSpeed * rangeFactor;
        this.sourceBottle = bottle;
        this.damage = bottle.damage;
    }

    /**
     * Checks whether the bottle is splashing.
     * @returns {boolean} Whether the splash animation has started.
     */
    get isSplashing() {
        return this.splashTime !== null;
    }

    /**
     * Checks whether the final splash frame has completed.
     * @returns {boolean} Whether the full splash animation has played.
     */
    get hasFinishedSplash() {
        return this.isSplashing &&
            this.splashTime >= ThrowableObject.splashImages.length * ThrowableObject.frameDuration;
    }

    /**
     * Advances projectile flight or splash timing.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
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

    /**
     * Computes the reflected trajectory toward Pepe's current position.
     * @param {CollisionBounds} target - Hitbox whose center the projectile aims at.
     */
    reflect(target) {
        this.isReflected = true;
        this.velocityX = -Math.sign(this.velocityX) * ThrowableObject.baseThrowSpeed;

        const targetX = (target.left + target.right) / 2;
        const targetY = (target.top + target.bottom) / 2;
        const distanceX = targetX - (this.x + this.width / 2);
        const distanceY = targetY - (this.y + this.height / 2);
        const travelTime = Math.max(0.12, Math.abs(distanceX / this.velocityX));

        // Aim the returning arc at Pepe's position at the moment of impact.
        this.velocityY = distanceY / travelTime - 0.5 * this.gravity * travelTime;
    }

    /** Starts the splash animation. */
    splash() {
        this.splashTime = 0;
    }

    /**
     * Checks whether the bottle has reached the ground while falling.
     * @returns {boolean} Whether the falling projectile has reached the ground.
     */
    hasLanded() {
        return this.velocityY >= 0 && this.y + this.height >= SalsaBottle.groundY;
    }

    /**
     * Draws the current bottle rotation or splash frame.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context for the game canvas.
     */
    draw(ctx) {
        if (this.isSplashing) {
            this.drawSplash(ctx);
            return;
        }

        const { frameDuration, rotationImages } = ThrowableObject;
        const index = Math.floor(this.flightTime / frameDuration) % rotationImages.length;
        const image = DrawableObject.getImage(rotationImages[index]);
        if (image.naturalWidth > 0) {
            ctx.drawImage(image, 54, 54, 292, 300, this.x, this.y, this.width, this.height);
        }
    }

    /**
     * Draws the splash frame for the current animation time.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context for the game canvas.
     */
    drawSplash(ctx) {
        const { frameDuration, splashImages } = ThrowableObject;
        const index = Math.min(Math.floor(this.splashTime / frameDuration), splashImages.length - 1);
        const image = DrawableObject.getImage(splashImages[index]);
        if (image.naturalWidth > 0) {
            ctx.drawImage(image, 70, 29, 354, 355, this.x - 18, this.y - 18, 80, 80);
        }
    }
}
