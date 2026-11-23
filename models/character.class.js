class Character extends MovableObject {
    x = 60;
    y = 35;
    height = 200;
    width = 100;
    offset = { left: 12, top: 77, right: 14, bottom: 10 };
    WALKING_IMAGES = [
        'img/2_character_pepe/2_walk/W-21.png',
        'img/2_character_pepe/2_walk/W-22.png',
        'img/2_character_pepe/2_walk/W-23.png',
        'img/2_character_pepe/2_walk/W-24.png',
        'img/2_character_pepe/2_walk/W-25.png',
        'img/2_character_pepe/2_walk/W-26.png',
    ];
    IDLE_IMAGES = [
        'img/2_character_pepe/1_idle/idle/I-1.png',
        'img/2_character_pepe/1_idle/idle/I-2.png',
        'img/2_character_pepe/1_idle/idle/I-3.png',
        'img/2_character_pepe/1_idle/idle/I-4.png',
        'img/2_character_pepe/1_idle/idle/I-5.png',
        'img/2_character_pepe/1_idle/idle/I-6.png',
        'img/2_character_pepe/1_idle/idle/I-7.png',
        'img/2_character_pepe/1_idle/idle/I-8.png',
        'img/2_character_pepe/1_idle/idle/I-9.png',
        'img/2_character_pepe/1_idle/idle/I-10.png',
    ];
    LONGIDLE_IMAGES = Array.from({ length: 10 }, (_, index) =>
        'img/2_character_pepe/1_idle/long_idle/I-' + (index + 11) + '.png'
    );
    JUMP_IMAGES = [
        'img/2_character_pepe/3_jump/J-31.png',
        'img/2_character_pepe/3_jump/J-32.png',
        'img/2_character_pepe/3_jump/J-33.png',
        'img/2_character_pepe/3_jump/J-34.png',
        'img/2_character_pepe/3_jump/J-35.png',
        'img/2_character_pepe/3_jump/J-36.png',
        'img/2_character_pepe/3_jump/J-37.png',
        'img/2_character_pepe/3_jump/J-38.png',
        'img/2_character_pepe/3_jump/J-39.png',
    ];
    HURT_IMAGES = [
        'img/2_character_pepe/4_hurt/H-41.png',
        'img/2_character_pepe/4_hurt/H-42.png',
        'img/2_character_pepe/4_hurt/H-43.png',
    ];
    DEAD_IMAGES = [
        'img/2_character_pepe/5_dead/D-51.png',
        'img/2_character_pepe/5_dead/D-52.png',
        'img/2_character_pepe/5_dead/D-53.png',
        'img/2_character_pepe/5_dead/D-54.png',
        'img/2_character_pepe/5_dead/D-55.png',
        'img/2_character_pepe/5_dead/D-56.png',
        'img/2_character_pepe/5_dead/D-57.png',
    ];
    world;
    speed = 5;
    groundY = 235;
    leftBoundary = -720;
    gravityElapsed = 0;
    idleElapsed = 0;
    bottles = [];
    coinCount = 0;

    get bottleCount() {
        return this.bottles.length;
    }

    constructor() {
        super();
        DrawableObject.preloadImages([
            ...this.WALKING_IMAGES,
            ...this.IDLE_IMAGES,
            ...this.LONGIDLE_IMAGES,
            ...this.JUMP_IMAGES,
            ...this.HURT_IMAGES,
            ...this.DEAD_IMAGES,
        ]);
        this.loadImage(this.WALKING_IMAGES[0]);
    }

    updateMovement() {
        if (!this.world || this.world.win !== null || this.isDead()) return;

        const { keyboard, level, audio } = this.world;
        const previousX = this.x;

        if ((keyboard.consumeTap("right") || keyboard.isPressed("right")) && this.x < level.level_end_x) {
            this.moveRight();
        }

        if ((keyboard.consumeTap("left") || keyboard.isPressed("left")) && this.x > this.leftBoundary) {
            this.moveLeft();
        }

        this.world.camera_x = -this.x + 125;
        if (this.x !== previousX) this.idleElapsed = 0;

        if (keyboard.isPressedOnce("up") && !this.isAboveGround()) {
            this.idleElapsed = 0;
            this.jump();
            audio?.play('jump');
        } else if (this.x !== previousX && !this.isAboveGround() && this.speedY === 0) {
            audio?.play('sandStep');
        }
    }

    updatePhysics(deltaTime) {
        const gravityStep = 1 / 25;
        this.gravityElapsed += deltaTime;
        if (this.gravityElapsed + 1e-9 < gravityStep) return;

        this.gravityElapsed -= gravityStep;
        this.updateGravity();
    }

    updateGravity() {
        const previousFeet = this.getCollisionBounds().bottom;
        super.updateGravity();

        if (this.getCollisionBounds().bottom > previousFeet) {
            this.world?.checkChickenStomp(previousFeet);
        }
    }

    draw(ctx) {
        if (this.world?.paused && this.world.win === null && !this.isDead()) {
            const elapsed = this.world.pauseAnimationElapsed;
            const index = Math.floor(elapsed / 0.2) % this.LONGIDLE_IMAGES.length;
            const image = DrawableObject.getImage(this.LONGIDLE_IMAGES[index]);
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
            return;
        }

        super.draw(ctx);
    }

    hasFinishedDeathAnimation() {
        const lastImage = this.DEAD_IMAGES.at(-1);
        return this.img === DrawableObject.getImage(lastImage);
    }

    updateAnimation(deltaTime) {
        const images = this.getAnimationImages();
        this.idleElapsed = images === this.IDLE_IMAGES ? this.idleElapsed + deltaTime : 0;
        const frameDuration = images === this.JUMP_IMAGES ? 0.1 : 0.2;
        this.playAnimation(images, deltaTime, frameDuration, images !== this.DEAD_IMAGES);
    }

    getAnimationImages() {
        if (this.isDead()) return this.DEAD_IMAGES;
        if (this.isHurt()) return this.HURT_IMAGES;
        if (this.isAboveGround()) return this.JUMP_IMAGES;

        const keyboard = this.world?.keyboard;
        const isWalking = keyboard?.isPressed("right") || keyboard?.isPressed("left");
        return isWalking ? this.WALKING_IMAGES : this.IDLE_IMAGES;
    }
}
