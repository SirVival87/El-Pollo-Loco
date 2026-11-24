/** Controls Pepe's movement, input, inventory, and animations. */
class Character extends MovableObject {
    static standardFrameDuration = 0.2;

    x = 60;
    y = 35;
    height = 200;
    width = 100;
    offset = { left: 19, top: 84, right: 22, bottom: 10 };
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

    /**
     * Returns the number of bottles available to throw.
     * @returns {number} Bottles available in the inventory.
     */
    get bottleCount() {
        return this.bottles.length;
    }

    /** Preloads Pepe's movement, hurt, and death sprites. */
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

    /** Handles Pepe's input and follows him with the camera. */
    updateMovement() {
        if (!this.world || this.world.win !== null || this.isDead()) return;

        const previousX = this.x;
        this.updateHorizontalMovement();
        this.world.cameraX = -this.x + 125;
        const moved = this.x !== previousX;
        if (moved) this.idleElapsed = 0;
        this.updateJumpInput(moved);
    }

    /** Moves Pepe up to the corresponding level boundary. */
    updateHorizontalMovement() {
        const { keyboard, level } = this.world;
        if ((keyboard.consumeTap('right') || keyboard.isPressed('right')) && this.x < level.levelEndX) {
            this.moveRight();
        }
        if ((keyboard.consumeTap('left') || keyboard.isPressed('left')) && this.x > this.leftBoundary) {
            this.moveLeft();
        }
    }

    /**
     * Handles jumping and plays footsteps while on the ground.
     * @param {boolean} moved - Whether Pepe moved horizontally during the current movement update.
     */
    updateJumpInput(moved) {
        const { keyboard, audio } = this.world;
        if (keyboard.isPressedOnce('up') && !this.isAboveGround()) {
            this.idleElapsed = 0;
            this.jump();
            audio?.play('jump');
        } else if (moved && !this.isAboveGround() && this.speedY === 0) {
            audio?.play('sandStep');
        }
    }

    /**
     * Applies gravity at a fixed physics interval.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updatePhysics(deltaTime) {
        const gravityStep = 1 / 25;
        this.gravityElapsed += deltaTime;
        if (this.gravityElapsed + 1e-9 < gravityStep) return;

        this.gravityElapsed -= gravityStep;
        this.updateGravity();
    }

    /** Checks for a chicken stomp as Pepe falls. */
    updateGravity() {
        const previousFeet = this.getCollisionBounds().bottom;
        super.updateGravity();

        if (this.getCollisionBounds().bottom > previousFeet) {
            this.world?.checkChickenStomp(previousFeet);
        }
    }

    /**
     * Draws Pepe's long-idle animation during a pause.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context for the game canvas.
     */
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

    /**
     * Checks whether every death frame has been displayed for its full duration.
     * @returns {boolean} Whether the full duration of the death animation has elapsed.
     */
    hasFinishedDeathAnimation() {
        const duration = this.DEAD_IMAGES.length * Character.standardFrameDuration;
        return this.animationImages === this.DEAD_IMAGES && this.animationElapsed + 1e-9 >= duration;
    }

    /**
     * Updates Pepe's sprite and tracks how long he has been idle.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateAnimation(deltaTime) {
        const images = this.getAnimationImages();
        this.idleElapsed = images === this.IDLE_IMAGES ? this.idleElapsed + deltaTime : 0;
        let frameDuration = Character.standardFrameDuration;
        if (images === this.WALKING_IMAGES) frameDuration = 0.16;
        else if (images === this.JUMP_IMAGES) frameDuration = 0.1;
        this.playAnimation(images, deltaTime, frameDuration, images !== this.DEAD_IMAGES);
    }

    /**
     * Selects the highest-priority animation for Pepe's current state.
     * @returns {string[]} Image paths for the animation to display.
     */
    getAnimationImages() {
        if (this.isDead()) return this.DEAD_IMAGES;
        if (this.isHurt()) return this.HURT_IMAGES;
        if (this.isAboveGround()) return this.JUMP_IMAGES;

        const keyboard = this.world?.keyboard;
        const isWalking = keyboard?.isPressed("right") || keyboard?.isPressed("left");
        return isWalking ? this.WALKING_IMAGES : this.IDLE_IMAGES;
    }
}
