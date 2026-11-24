/** Fliegende Flasche mit einer Flugbahn und Splash-Animation. */
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

    /** Lädt die Bilder für Rotation und Splash vor. */
    static preloadSprites() {
        DrawableObject.preloadImages([...this.rotationImages, ...this.splashImages]);
    }

    /**
     * Erstellt das Projektil aus einer eingesammelten Flasche.
     * @param {number} x - Startposition auf der horizontalen Weltachse.
     * @param {number} y - Startposition auf der vertikalen Weltachse.
     * @param {number} direction - Wurfrichtung. 1 steht für rechts, -1 für links.
     * @param {SalsaBottle} bottle - Geworfene Flasche mit ihrem Schadenswert.
     * @param {boolean} [airborne=false] - Ob Pepe beim Wurf gerade in der Luft ist oder abspringt.
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
     * Prüft, ob die Flasche gerade zerplatzt.
     * @returns {boolean} Ob die Splash-Animation gestartet wurde.
     */
    get isSplashing() {
        return this.splashTime !== null;
    }

    /**
     * Prüft, ob das letzte Splash-Bild beendet ist.
     * @returns {boolean} Ob alle Bilder des Splashs vollständig abgespielt sind.
     */
    get hasFinishedSplash() {
        return this.isSplashing &&
            this.splashTime >= ThrowableObject.splashImages.length * ThrowableObject.frameDuration;
    }

    /**
     * Aktualisiert Flugbahn oder Splash-Zeit.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
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
     * Berechnet die Flugbahn zurück zu Pepes aktueller Position.
     * @param {CollisionBounds} target - Hitbox, auf deren Mittelpunkt das Projektil zielt.
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

    /** Startet die Splash-Animation. */
    splash() {
        this.splashTime = 0;
    }

    /**
     * Prüft, ob die Flasche im Fallen den Boden erreicht hat.
     * @returns {boolean} Ob das fallende Projektil den Boden erreicht hat.
     */
    hasLanded() {
        return this.velocityY >= 0 && this.y + this.height >= SalsaBottle.groundY;
    }

    /**
     * Zeichnet das aktuelle Rotationsbild der Flasche oder den Splash.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
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
     * Zeichnet das Splash-Bild für die aktuelle Animationszeit.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
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
