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

    moveRight() {
        this.x += this.speed;
        this.otherDirection = false;
    }


    moveLeft() {
        this.x -= this.speed;
        this.otherDirection = true;
    }


    get maxEnergy() {
        return this.constructor.maxEnergy;
    }

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


    isAboveGround() {
        return this.y < this.groundY;
    }


    jump() {
        this.speedY = 30;
    }

    isColliding(movableObject) {
        const a = this.getCollisionBounds();
        const b = movableObject.getCollisionBounds();
        return a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top;
    }

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

    isHurt() {
        return performance.now() - this.lastHit < 600;
    }

    isDead() {
        return this.energy <= 0;
    }
}
