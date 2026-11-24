/** Regular chicken that can walk and has a death sprite. */
class Chicken extends MovableObject {
    static size = 60;
    static spriteFolder = 'chicken_normal';
    static speedMultiplier = 1;
    static deadImage = 'img/3_enemies_chicken/chicken_normal/2_dead/dead.png';
    static deadTopOffset = 33;
    static hitboxOffset = { left: 1, top: 4, right: 2, bottom: 4 };

    leftBorder = -720;
    bossHelper = false;
    /**
     * Creates a chicken with a patrol area and a random initial direction.
     * @param {number} [x] - Starting position in world coordinates. Randomized when omitted.
     * @param {number} [rightBorder=1440] - Right edge of the patrol area in world coordinates.
     */
    constructor(x = 200 + Math.random() * 500, rightBorder = 1440) {
        super();
        const type = this.constructor;
        this.width = type.size;
        this.height = type.size;
        this.offset = { ...type.hitboxOffset };
        this.x = x;
        this.rightBorder = rightBorder;
        this.y = 426 + this.offset.bottom - this.height;
        this.speed = (0.3 + Math.random() * 0.25) * type.speedMultiplier;
        this.direction = Math.random() < 0.5 ? -1 : 1;
        this.otherDirection = this.direction === 1;
        this.loadSprites(type);
    }

    /**
     * Loads the walking frames and death sprite for this chicken type.
     * @param {Function} type - Chicken constructor with a sprite folder and an optional death sprite.
     */
    loadSprites(type) {
        this.WALKING_IMAGES = [1, 2, 3].map(frame =>
            `img/3_enemies_chicken/${type.spriteFolder}/1_walk/${frame}_w.png`
        );
        const images = type.deadImage ? [...this.WALKING_IMAGES, type.deadImage] : this.WALKING_IMAGES;
        DrawableObject.preloadImages(images);
        this.loadImage(this.WALKING_IMAGES[0]);
    }

    /** Shows the chicken's death sprite if its type can be defeated. */
    die() {
        const { deadImage, deadTopOffset } = this.constructor;
        if (!deadImage) return;

        this.energy = 0;
        this.offset.top = deadTopOffset;
        this.loadImage(deadImage);
    }

    /**
     * Moves the chicken and advances its walking animation.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     * @param {number} [targetX] - Pepe's X coordinate when the chicken is following him.
     */
    update(deltaTime, targetX) {
        if (this.isDead()) return;

        if (targetX !== undefined && targetX !== this.x) this.direction = targetX < this.x ? -1 : 1;
        this.x += this.speed * this.direction;
        if (targetX === undefined) this.turnAtBoundary();

        this.otherDirection = this.direction === 1;
        this.playAnimation(this.WALKING_IMAGES, deltaTime, 0.3);
    }

    /** Reverses direction at the edge of the patrol area. */
    turnAtBoundary() {
        if (this.x <= this.leftBorder) {
            this.direction = 1;
        } else if (this.x >= this.rightBorder) {
            this.direction = -1;
        }
    }
}
