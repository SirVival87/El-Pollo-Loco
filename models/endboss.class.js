class Endboss extends MovableObject {
    x = 720;
    y = 140;
    height = 300;
    width = 300;
    groundY = 140;
    energy = 100;
    offset = { left: 12, top: 46, right: 8, bottom: 10 };
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
    returnJumpAt = 1;
    jumpElapsed = -this.getJumpDelay();
    isJumping = false;
    contactDamage = 100; // Damage inflicted on contact with the player

    WALKING_IMAGES = [
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png',
    ]

    ALERT_IMAGES = [
        'img/4_enemie_boss_chicken/2_alert/G5.png',
        'img/4_enemie_boss_chicken/2_alert/G6.png',
        'img/4_enemie_boss_chicken/2_alert/G7.png',
        'img/4_enemie_boss_chicken/2_alert/G8.png',
        'img/4_enemie_boss_chicken/2_alert/G9.png',
        'img/4_enemie_boss_chicken/2_alert/G10.png',
        'img/4_enemie_boss_chicken/2_alert/G11.png',
        'img/4_enemie_boss_chicken/2_alert/G12.png',
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

    constructor(x = 720) {
        super();
        this.x = x;
        this.homeX = x;
        this.loadImagesArray([
            ...this.WALKING_IMAGES,
            ...this.ALERT_IMAGES,
            ...this.ATTACK_IMAGES,
            ...this.HURT_IMAGES,
            ...this.DEAD_IMAGES,
        ]);
        this.img = this.characterImageCache[this.WALKING_IMAGES[0]];
    }

    updateJump(deltaTime) {
        const previousElapsed = this.jumpElapsed;
        this.jumpElapsed += deltaTime;

        if (previousElapsed < 0) {
            this.updatePatrol(Math.min(deltaTime, -previousElapsed));
            if (this.jumpElapsed < 0) return;
        }

        this.attackStartX ??= this.x;
        this.otherDirection = false;

        if (this.jumpElapsed < this.jumpDuration) {
            this.setJumpPose(this.jumpElapsed / this.jumpDuration, this.attackStartX, -this.jumpDistance);
            return;
        }

        const forwardX = this.attackStartX - this.jumpDistance;
        if (this.jumpElapsed < this.returnJumpAt) {
            this.setGroundPose(forwardX);
            return;
        }

        const returnElapsed = this.jumpElapsed - this.returnJumpAt;
        if (returnElapsed < this.jumpDuration) {
            this.setJumpPose(returnElapsed / this.jumpDuration, forwardX, this.jumpDistance);
            return;
        }

        this.setGroundPose(this.attackStartX);
        this.attackStartX = null;
        this.otherDirection = this.patrolTravel >= this.patrolDistance;
        this.jumpElapsed = -this.getJumpDelay();
    }

    updatePatrol(deltaTime) {
        const roundTrip = this.patrolDistance * 2;
        this.patrolTravel = (this.patrolTravel + this.patrolSpeed * deltaTime) % roundTrip;
        this.otherDirection = this.patrolTravel >= this.patrolDistance;
        const distanceFromHome = Math.min(this.patrolTravel, roundTrip - this.patrolTravel);
        this.x = this.homeX - distanceFromHome;
    }

    getJumpDelay() {
        return 2 + Math.random() * 3;
    }

    setJumpPose(progress, startX, distance) {
        this.isJumping = true;
        this.x = startX + distance * progress;
        this.y = this.groundY - Math.sin(progress * Math.PI) * this.jumpHeight;
    }

    setGroundPose(x) {
        this.isJumping = false;
        this.x = x;
        this.y = this.groundY;
    }

    updateAnimation(deltaTime) {
        if (this.isDead()) {
            this.deathElapsed = this.deathElapsed === null ? 0 : this.deathElapsed + deltaTime;
            const frameDuration = this.deathDuration / this.DEAD_IMAGES.length;
            this.showAnimationFrame(this.DEAD_IMAGES, this.deathElapsed, frameDuration);
        } else if (this.isHurt()) {
            const sinceHit = (performance.now() - this.lastHit) / 1000;
            this.showAnimationFrame(this.HURT_IMAGES, sinceHit, 0.2);
        } else if (this.isJumping) {
            const jumpTime = this.jumpElapsed < this.returnJumpAt ?
                this.jumpElapsed : this.jumpElapsed - this.returnJumpAt;
            this.showAnimationFrame(this.ATTACK_IMAGES, jumpTime, this.jumpDuration / this.ATTACK_IMAGES.length);
        } else if (this.jumpElapsed >= 0) {
            this.showAnimationFrame(this.ALERT_IMAGES, this.jumpElapsed - this.jumpDuration, 0.12, true);
        } else {
            this.showAnimationFrame(this.WALKING_IMAGES, this.patrolTravel / this.patrolSpeed, 0.15, true);
        }
    }

    showAnimationFrame(images, elapsed, frameDuration, loop = false) {
        const frame = Math.floor(elapsed / frameDuration);
        const index = loop ? frame % images.length : Math.min(frame, images.length - 1);
        this.img = this.characterImageCache[images[index]];
    }

    hasFinishedDeathAnimation() {
        return this.deathElapsed >= this.deathDuration;
    }
}
