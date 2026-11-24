/** Boss enemy with patrols, a jumping attack, fast charges, and a death animation. */
class Endboss extends MovableObject {
    x = 720;
    y = 140;
    height = 300;
    width = 300;
    groundY = 140;
    /**
     * Sprite insets for the head and body.
     * @type {CollisionOffsets[]}
     */
    static collisionOffsets = [
        { left: 34, top: 58, right: 172, bottom: 145 },
        { left: 56, top: 118, right: 38, bottom: 60 },
    ];
    hitCooldown = 0;
    patrolDistance = 200;
    patrolSpeed = 160;
    patrolTravel = 0;
    jumpDistance = 300;
    attackStartX = null;
    deathDuration = 2;
    deathElapsed = null;
    jumpHeight = 105;
    jumpDuration = 0.48;
    chargeDistance = 200;
    chargeSpeed = 280;
    returnSpeed = 760;
    helperSpawnElapsed = 0;
    jumpElapsed = -this.getJumpDelay();
    isJumping = false;
    contactDamage = 100; // Damage inflicted on contact with the player

    WALKING_IMAGES = [
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png',
    ]

    ATTACK_IMAGES = [
        'img/4_enemie_boss_chicken/3_attack/G13.png',
        'img/4_enemie_boss_chicken/3_attack/G14.png',
        'img/4_enemie_boss_chicken/3_attack/G15.png',
        'img/4_enemie_boss_chicken/3_attack/G16.png',
        'img/4_enemie_boss_chicken/3_attack/G17.png',
        'img/4_enemie_boss_chicken/3_attack/G18.png',
        'img/4_enemie_boss_chicken/3_attack/G19.png',
        'img/4_enemie_boss_chicken/3_attack/G20.png',
    ]

    HURT_IMAGES = [
        'img/4_enemie_boss_chicken/4_hurt/G21.png',
        'img/4_enemie_boss_chicken/4_hurt/G22.png',
        'img/4_enemie_boss_chicken/4_hurt/G23.png',
    ]

    DEAD_IMAGES = [
        'img/4_enemie_boss_chicken/5_dead/G24.png',
        'img/4_enemie_boss_chicken/5_dead/G25.png',
        'img/4_enemie_boss_chicken/5_dead/G26.png',
    ]

    /**
     * Sets the boss's starting position and loads its sprites.
     * @param {number} [x=720] - Starting position and patrol origin in world coordinates.
     */
    constructor(x = 720) {
        super();
        this.x = x;
        this.homeX = x;
        DrawableObject.preloadImages([
            ...this.WALKING_IMAGES,
            ...this.ATTACK_IMAGES,
            ...this.HURT_IMAGES,
            ...this.DEAD_IMAGES,
        ]);
        this.loadImage(this.WALKING_IMAGES[0]);
    }

    /** @returns {CollisionBounds[]} Head and body hitboxes in world coordinates. */
    getCollisionBoxes() {
        return Endboss.collisionOffsets.map(offset => this.getCollisionBounds(offset));
    }

    /**
     * Advances the transition between patrolling and the jumping attack.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateJump(deltaTime) {
        const previousElapsed = this.jumpElapsed;
        this.jumpElapsed += deltaTime;

        if (previousElapsed < 0) {
            this.updatePatrol(Math.min(deltaTime, -previousElapsed));
            if (this.jumpElapsed < 0) return;
        }

        this.attackStartX ??= this.x;
        this.updateAttackPose();
    }

    /** Controls the forward jump and the ground attack that follows it. */
    updateAttackPose() {
        if (this.jumpElapsed < this.jumpDuration) {
            this.otherDirection = false;
            this.setJumpPose(this.jumpElapsed / this.jumpDuration, this.attackStartX, -this.jumpDistance);
            return;
        }

        this.updateGroundAttack(this.jumpElapsed - this.jumpDuration);
    }

    /**
     * Moves the boss from the landing point to the turnaround point.
     * @param {number} elapsed - Time since landing, in seconds.
     */
    updateGroundAttack(elapsed) {
        const landingX = this.attackStartX - this.jumpDistance;
        const chargeDuration = this.chargeDistance / this.chargeSpeed;
        if (elapsed < chargeDuration) {
            this.otherDirection = false;
            this.setGroundPose(landingX - elapsed * this.chargeSpeed);
        } else {
            this.updateReturnRun(landingX - this.chargeDistance, elapsed - chargeDuration);
        }
    }

    /**
     * Runs the boss back to the attack's starting point and ends the attack.
     * @param {number} turnX - X coordinate of the turnaround point.
     * @param {number} elapsed - Time since turning around, in seconds.
     */
    updateReturnRun(turnX, elapsed) {
        this.otherDirection = true;
        const x = Math.min(this.attackStartX, turnX + elapsed * this.returnSpeed);
        this.setGroundPose(x);
        if (x < this.attackStartX) return;

        this.attackStartX = null;
        this.otherDirection = this.patrolTravel >= this.patrolDistance;
        this.jumpElapsed = -this.getJumpDelay();
    }

    /**
     * Moves the boss back and forth along its patrol route.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updatePatrol(deltaTime) {
        const roundTrip = this.patrolDistance * 2;
        this.patrolTravel = (this.patrolTravel + this.patrolSpeed * deltaTime) % roundTrip;
        this.otherDirection = this.patrolTravel >= this.patrolDistance;
        const distanceFromHome = Math.min(this.patrolTravel, roundTrip - this.patrolTravel);
        this.x = this.homeX - distanceFromHome;
    }

    /**
     * Calculates the patrol time for roughly 3.48 to 6.48 seconds between forward jumps.
     * @returns {number} Time to wait after returning, in seconds.
     */
    getJumpDelay() {
        const intervalBetweenAttacks = 3.48 + Math.random() * 3;
        const returnDistance = this.jumpDistance + this.chargeDistance;
        const attackDuration = this.jumpDuration + this.chargeDistance / this.chargeSpeed +
            returnDistance / this.returnSpeed;
        return Math.max(0, intervalBetweenAttacks - attackDuration);
    }

    /**
     * Spawns reinforcements every two seconds while Pepe is 100 to 600 pixels away.
     * @param {number} characterX - Pepe's horizontal position.
     * @param {Level} level - Level to receive the spawned helpers.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateHelpers(characterX, level, deltaTime) {
        const distance = Math.abs(characterX - this.x);
        if (this.isDead() || distance < 100 || distance > 600) {
            this.helperSpawnElapsed = 0;
            return;
        }

        this.helperSpawnElapsed += deltaTime;
        if (this.helperSpawnElapsed + 1e-9 < 2) return;

        this.helperSpawnElapsed = 0;
        this.spawnHelpers(characterX, level);
    }

    /**
     * Spawns regular and small chickens on Pepe's side of the boss.
     * @param {number} characterX - Pepe's horizontal position.
     * @param {Level} level - Level to receive the spawned helpers.
     */
    spawnHelpers(characterX, level) {
        const direction = characterX < this.x ? -1 : 1;
        const distance = Math.abs(characterX - this.x);
        const origin = direction < 0 ? this.x : this.x + Math.min(this.width, distance / 2);
        const spacing = Math.min(44, distance / 8);
        [Chicken, Chicken, SmallChicken].forEach((ChickenType, index) => {
            const centerX = origin + direction * spacing * (index + 1);
            const helper = new ChickenType(centerX - ChickenType.size / 2, level.levelEndX);
            helper.bossHelper = true;
            helper.direction = direction;
            helper.otherDirection = direction === 1;
            level.enemies.push(helper);
        });
    }

    /**
     * Positions the boss along its jump arc.
     * @param {number} progress - Progress along the jump arc, between 0 and 1.
     * @param {number} startX - Horizontal starting position in world coordinates.
     * @param {number} distance - Signed horizontal jump distance in pixels.
     */
    setJumpPose(progress, startX, distance) {
        this.isJumping = true;
        this.x = startX + distance * progress;
        this.y = this.groundY - Math.sin(progress * Math.PI) * this.jumpHeight;
    }

    /**
     * Places the boss on the ground at the specified position.
     * @param {number} x - Horizontal landing position in world coordinates.
     */
    setGroundPose(x) {
        this.isJumping = false;
        this.x = x;
        this.y = this.groundY;
    }

    /**
     * Displays the boss animation that matches its current state.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateAnimation(deltaTime) {
        if (this.isDead()) {
            this.updateDeathAnimation(deltaTime);
        } else if (this.isHurt()) {
            const sinceHit = (performance.now() - this.lastHit) / 1000;
            this.showAnimationFrame(this.HURT_IMAGES, sinceHit, 0.2);
        } else if (this.isJumping) {
            this.updateAttackAnimation();
        } else {
            this.updateGroundAnimation();
        }
    }

    /**
     * Plays the death animation once through its final frame.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateDeathAnimation(deltaTime) {
        this.deathElapsed = this.deathElapsed === null ? 0 : this.deathElapsed + deltaTime;
        const frameDuration = this.deathDuration / this.DEAD_IMAGES.length;
        this.showAnimationFrame(this.DEAD_IMAGES, this.deathElapsed, frameDuration);
    }

    /** Selects the frame for the current point in the forward jump. */
    updateAttackAnimation() {
        this.showAnimationFrame(this.ATTACK_IMAGES, this.jumpElapsed, this.jumpDuration / this.ATTACK_IMAGES.length);
    }

    /** Plays the walking frames faster during an attack than during a patrol. */
    updateGroundAnimation() {
        const running = this.attackStartX !== null;
        const elapsed = running ? this.jumpElapsed - this.jumpDuration : this.patrolTravel / this.patrolSpeed;
        this.showAnimationFrame(this.WALKING_IMAGES, elapsed, running ? 0.08 : 0.15, true);
    }

    /**
     * Selects an animation frame based on elapsed time.
     * @param {string[]} images - Image paths in playback order.
     * @param {number} elapsed - Elapsed animation time in seconds.
     * @param {number} frameDuration - Display time per frame in seconds.
     * @param {boolean} [loop=false] - Whether to loop the frame sequence.
     */
    showAnimationFrame(images, elapsed, frameDuration, loop = false) {
        const frame = Math.floor(elapsed / frameDuration);
        const index = loop ? frame % images.length : Math.min(frame, images.length - 1);
        this.loadImage(images[index]);
    }

    /**
     * Checks whether the boss's death animation has run for its full duration.
     * @returns {boolean} Whether the death animation has finished.
     */
    hasFinishedDeathAnimation() {
        return this.deathElapsed >= this.deathDuration;
    }
}
