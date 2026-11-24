/** Adds movement, animation, damage, and energy to drawable objects. */
class MovableObject extends DrawableObject {
    static maxEnergy = 100;

    animationImages = null;
    animationElapsed = 0;
    speed = 0.3;
    otherDirection = false;
    speedY = 0;
    acceleration = 5;
    groundY;
    energy = this.maxEnergy;
    lastHit = -Infinity;
    hitCooldown = 1000;
    contactDamage = 20;

    /** Moves the object right and updates its facing direction. */
    moveRight() {
        this.x += this.speed;
        this.otherDirection = false;
    }


    /** Moves the object left and updates its facing direction. */
    moveLeft() {
        this.x -= this.speed;
        this.otherDirection = true;
    }


    /**
     * Returns the maximum energy for this object type.
     * @returns {number} Maximum energy for this object type.
     */
    get maxEnergy() {
        return this.constructor.maxEnergy;
    }

    /**
     * Selects the current animation frame based on elapsed game time.
     * @param {string[]} images - Image paths in playback order.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     * @param {number} frameDuration - Display time per frame in seconds.
     * @param {boolean} [loop=true] - Whether to loop the frame sequence.
     */
    playAnimation(images, deltaTime, frameDuration, loop = true) {
        if (this.animationImages === images) {
            this.animationElapsed += deltaTime;
        } else {
            this.animationImages = images;
            this.animationElapsed = 0;
        }

        const frame = Math.floor((this.animationElapsed + 1e-9) / frameDuration);
        const index = loop ? frame % images.length : Math.min(frame, images.length - 1);
        this.loadImage(images[index]);
    }

    /** Updates falling speed and position until the object lands. */
    updateGravity() {
        if (this.isAboveGround() || this.speedY > 0) {
            this.y -= this.speedY;
            this.speedY -= this.acceleration;

            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.speedY = 0;
            }
        }
    }


    /**
     * Checks whether the object is above its ground position.
     * @returns {boolean} Whether its Y coordinate is above the ground position.
     */
    isAboveGround() {
        return this.y < this.groundY;
    }


    /** Sets the initial vertical speed of a jump. */
    jump() {
        this.speedY = 30;
    }

    /**
     * Checks both objects' collision rectangles for overlap.
     * @param {DrawableObject} movableObject - Object with one or more hitboxes.
     * @returns {boolean} Whether at least one pair of rectangles overlaps.
     */
    isColliding(movableObject) {
        const otherBoxes = movableObject.getCollisionBoxes();
        return this.getCollisionBoxes().some(a => otherBoxes.some(b =>
            a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top
        ));
    }

    /**
     * Applies valid damage outside the hit cooldown.
     * @param {number} damage - Amount of energy to subtract.
     * @returns {boolean} Whether the hit reduced energy.
     */
    hit(damage) {
        const now = performance.now();
        if (!Number.isFinite(damage) || damage <= 0 ||
            this.isDead() || now - this.lastHit < this.hitCooldown) {
            return false;
        }

        this.energy = Math.max(0, this.energy - damage);
        this.lastHit = now;
        return true;
    }

    /**
     * Checks whether the hit animation window is active.
     * @returns {boolean} Whether less than 600 milliseconds have passed since the last hit.
     */
    isHurt() {
        return performance.now() - this.lastHit < 600;
    }

    /**
     * Checks whether the object has run out of energy.
     * @returns {boolean} Whether energy has dropped to zero.
     */
    isDead() {
        return this.energy <= 0;
    }
}
