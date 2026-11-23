class MovableObject extends DrawableObject {
    currentImageIndex = 0;
    speed = 0.3;
    otherDirection = false;
    speedY = 0;
    acceleration = 5;
    groundY;
    energy = 100;
    lastHit = -Infinity;
    hitCooldown = 1000;
    timers = [];
    contactDamage = 20;

    moveRight() {
        this.x += this.speed;
        this.otherDirection = false;
    }


    moveLeft() {
            this.x -= this.speed;
            this.otherDirection = true;
    }


    playAnimation(images) {
        let i = this.currentImageIndex % images.length;
        let path = images[i];
        this.img = this.characterImageCache[path];
        this.currentImageIndex++;
    }


    startInterval(callback, delay) {
        this.timers.push(setInterval(callback, delay));
    }

    stop() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.length = 0;
    }

    applyGravity() {
        this.startInterval(() => this.updateGravity(), 1000 / 25);
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

    if (this.isDead() || now - this.lastHit < this.hitCooldown) {
        return;
    }

    this.energy = Math.max(0, this.energy - damage);
    this.lastHit = now;
}

isHurt() {
    return performance.now() - this.lastHit < 600;
}

isDead() {
        return this.energy == 0;
}
}
