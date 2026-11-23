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

    /** Bewegt das Objekt nach rechts und passt die Blickrichtung an. */
    moveRight() {
        this.x += this.speed;
        this.otherDirection = false;
    }


    /** Bewegt das Objekt nach links und passt die Blickrichtung an. */
    moveLeft() {
        this.x -= this.speed;
        this.otherDirection = true;
    }


    /** Gibt die maximale Energie des jeweiligen Objekttyps zurück. */
    get maxEnergy() {
        return this.constructor.maxEnergy;
    }

    /**
     * Wählt nach Spielzeit ein Bild der aktuellen Animation.
     * @param {string[]} images Bildpfade in Wiedergabereihenfolge.
     * @param {number} deltaTime Vergangene Spielzeit in Sekunden.
     * @param {number} frameDuration Dauer eines Bildes in Sekunden.
     * @param {boolean} [loop=true] Wiederholt die Bildfolge.
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

    /** Aktualisiert Fallgeschwindigkeit und Position bis zum Aufsetzen. */
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


    /** Prüft, ob sich das Objekt oberhalb seiner Bodenposition befindet. */
    isAboveGround() {
        return this.y < this.groundY;
    }


    /** Setzt die vertikale Startgeschwindigkeit des Sprungs. */
    jump() {
        this.speedY = 30;
    }

    /** Prüft, ob sich zwei Kollisionsrechtecke überlappen. */
    isColliding(movableObject) {
        const a = this.getCollisionBounds();
        const b = movableObject.getCollisionBounds();
        return a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top;
    }

    /**
     * Zieht gültigen Schaden außerhalb der Trefferpause ab.
     * @param {number} damage Abzuziehende Energie.
     * @returns {boolean} Ob der Treffer wirksam war.
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

    /** Prüft, ob die Zeitspanne für die Trefferanimation läuft. */
    isHurt() {
        return performance.now() - this.lastHit < 600;
    }

    /** Prüft, ob die Energie aufgebraucht ist. */
    isDead() {
        return this.energy <= 0;
    }
}
