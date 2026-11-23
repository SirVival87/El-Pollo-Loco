class Chicken extends MovableObject {
    static size = 60;
    static spriteFolder = 'chicken_normal';
    static speedMultiplier = 1;
    static deadImage = 'img/3_enemies_chicken/chicken_normal/2_dead/dead.png';
    static hitboxOffset = { left: 1, top: 4, right: 2, bottom: 4 };

    leftBorder = -720;
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

        this.WALKING_IMAGES = [1, 2, 3].map(frame =>
            `img/3_enemies_chicken/${type.spriteFolder}/1_walk/${frame}_w.png`
        );
        const images = type.deadImage ? [...this.WALKING_IMAGES, type.deadImage] : this.WALKING_IMAGES;
        DrawableObject.preloadImages(images);
        this.loadImage(this.WALKING_IMAGES[0]);
    }

    die() {
        const deadImage = this.constructor.deadImage;
        if (!deadImage) return;

        this.energy = 0;
        this.offset.top = 33;
        this.loadImage(deadImage);
    }

    update(deltaTime) {
        if (this.isDead()) return;

        this.x += this.speed * this.direction;
        if (this.x <= this.leftBorder) {
            this.direction = 1;
        } else if (this.x >= this.rightBorder) {
            this.direction = -1;
        }

        this.otherDirection = this.direction === 1;
        this.playAnimation(this.WALKING_IMAGES, deltaTime, 0.3);
    }
}
