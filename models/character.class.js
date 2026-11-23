class Character extends MovableObject {
    x = 60;
    y = 35; // soll 235
    img;
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
    LONGIDLE_IMAGES = [
        'img/2_character_pepe/1_idle/long_idle/I-11.png',
        'img/2_character_pepe/1_idle/long_idle/I-12.png',
        'img/2_character_pepe/1_idle/long_idle/I-13.png',
        'img/2_character_pepe/1_idle/long_idle/I-14.png',
        'img/2_character_pepe/1_idle/long_idle/I-15.png',
        'img/2_character_pepe/1_idle/long_idle/I-16.png',
        'img/2_character_pepe/1_idle/long_idle/I-17.png',
        'img/2_character_pepe/1_idle/long_idle/I-18.png',
        'img/2_character_pepe/1_idle/long_idle/I-19.png',
        'img/2_character_pepe/1_idle/long_idle/I-20.png',
    ];
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
    bottles = [];
    coinCount = 0;

    get bottleCount() {
        return this.bottles.length;
    }

    constructor() {
        super().loadImage('img/2_character_pepe/2_walk/W-21.png');
        this.loadImagesArray(this.WALKING_IMAGES);
        this.loadImagesArray(this.IDLE_IMAGES);
        this.loadImagesArray(this.LONGIDLE_IMAGES);
        this.loadImagesArray(this.JUMP_IMAGES);
        this.loadImagesArray(this.HURT_IMAGES);
        this.loadImagesArray(this.DEAD_IMAGES);
        this.animate();
        this.applyGravity();
    }


deathFrameIndex = 0;

animate() {
    this.startInterval(() => this.updateMovement(), 1000 / 60);
    this.startInterval(() => this.updateAnimation(), 200);
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

    if (keyboard.isPressedOnce("up") && !this.isAboveGround()) {
        this.jump();
        audio?.play('jump');
    } else if (this.x !== previousX && !this.isAboveGround() && this.speedY === 0) {
        audio?.play('sandStep');
    }
}

    updateGravity() {
        const previousFeet = this.getCollisionBounds().bottom;
        super.updateGravity();
        if (this.getCollisionBounds().bottom > previousFeet) {
            this.world?.checkChickenStomp(previousFeet);
        }
    }

hasFinishedDeathAnimation() {
    const lastImage = this.DEAD_IMAGES[this.DEAD_IMAGES.length - 1];
    return this.img === this.characterImageCache[lastImage];
}

updateAnimation() {
        if (this.isDead()) {
        const path = this.DEAD_IMAGES[this.deathFrameIndex];
        this.img = this.characterImageCache[path];
        this.deathFrameIndex = Math.min(
            this.deathFrameIndex + 1,
            this.DEAD_IMAGES.length - 1
        );
        return;
    }
        if (this.isHurt()) {
    this.playAnimation(this.HURT_IMAGES);
    return;
    }

    const keyboard = this.world?.keyboard;
    const isWalking = keyboard?.isPressed("right") || keyboard?.isPressed("left");

    if (this.isAboveGround()) {
        this.playAnimation(this.JUMP_IMAGES);
    } else if (isWalking) {
        this.playAnimation(this.WALKING_IMAGES);
    } else {
        this.playAnimation(this.IDLE_IMAGES);
    }
}
}
