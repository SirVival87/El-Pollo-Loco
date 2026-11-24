/** Bossgegner mit Patrouille, Sprungangriff, schnellen Läufen und eigener Todesanimation. */
class Endboss extends MovableObject {
    x = 720;
    y = 140;
    height = 300;
    width = 300;
    groundY = 140;
    /**
     * Sprite-Einrückungen für Kopf und Körper.
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
     * Setzt die Startposition des Bosses und lädt seine Sprites.
     * @param {number} [x=720] - Start- und Bezugspunkt der Patrouille in Weltkoordinaten.
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

    /** @returns {CollisionBounds[]} Trefferflächen für Kopf und Körper in Weltkoordinaten. */
    getCollisionBoxes() {
        return Endboss.collisionOffsets.map(offset => this.getCollisionBounds(offset));
    }

    /**
     * Aktualisiert den Wechsel zwischen Patrouille und Sprungangriff.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
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

    /** Steuert den Vorwärtssprung und danach den Angriff am Boden. */
    updateAttackPose() {
        if (this.jumpElapsed < this.jumpDuration) {
            this.otherDirection = false;
            this.setJumpPose(this.jumpElapsed / this.jumpDuration, this.attackStartX, -this.jumpDistance);
            return;
        }

        this.updateGroundAttack(this.jumpElapsed - this.jumpDuration);
    }

    /**
     * Lässt den Boss vom Landepunkt bis zum Wendepunkt weiterlaufen.
     * @param {number} elapsed - Zeit seit der Landung in Sekunden.
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
     * Lässt den Boss zum Ausgangspunkt zurückrennen und beendet den Angriff.
     * @param {number} turnX - X-Koordinate des Wendepunkts.
     * @param {number} elapsed - Seit dem Wenden verstrichene Zeit in Sekunden.
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
     * Bewegt den Boss auf seiner Patrouillenstrecke hin und zurück.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updatePatrol(deltaTime) {
        const roundTrip = this.patrolDistance * 2;
        this.patrolTravel = (this.patrolTravel + this.patrolSpeed * deltaTime) % roundTrip;
        this.otherDirection = this.patrolTravel >= this.patrolDistance;
        const distanceFromHome = Math.min(this.patrolTravel, roundTrip - this.patrolTravel);
        this.x = this.homeX - distanceFromHome;
    }

    /**
     * Berechnet die Patrouillenzeit für etwa 3,48 bis 6,48 Sekunden zwischen Vorwärtssprüngen.
     * @returns {number} Wartezeit nach der Rückkehr in Sekunden.
     */
    getJumpDelay() {
        const intervalBetweenAttacks = 3.48 + Math.random() * 3;
        const returnDistance = this.jumpDistance + this.chargeDistance;
        const attackDuration = this.jumpDuration + this.chargeDistance / this.chargeSpeed +
            returnDistance / this.returnSpeed;
        return Math.max(0, intervalBetweenAttacks - attackDuration);
    }

    /**
     * Schickt alle drei Sekunden Helfer los, solange Pepe 400 bis unter 800 Pixel entfernt ist.
     * @param {number} characterX - Pepes horizontale Position.
     * @param {Level} level - Level, in das die Helfer eingefügt werden.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updateHelpers(characterX, level, deltaTime) {
        const distance = Math.abs(characterX - this.x);
        if (this.isDead() || distance < 400 || distance >= 800) {
            this.helperSpawnElapsed = 0;
            return;
        }

        this.helperSpawnElapsed += deltaTime;
        if (this.helperSpawnElapsed + 1e-9 < 3) return;

        this.helperSpawnElapsed = 0;
        this.spawnHelpers(characterX, level);
    }

    /**
     * Platziert zwei normale Hühner und ein Küken auf der Seite, auf der Pepe steht.
     * @param {number} characterX - Pepes horizontale Position.
     * @param {Level} level - Level, in das die Helfer eingefügt werden.
     */
    spawnHelpers(characterX, level) {
        const direction = characterX < this.x ? -1 : 1;
        const origin = direction < 0 ? this.x : Math.min(this.x + this.width, characterX - 160);
        const types = [Chicken, Chicken, SmallChicken];
        types.forEach((ChickenType, index) => {
            const edge = origin + direction * (20 + index * 44);
            const x = direction < 0 ? edge - ChickenType.size : edge;
            const helper = new ChickenType(x, level.levelEndX);
            helper.bossHelper = true;
            helper.direction = direction;
            helper.otherDirection = direction === 1;
            level.enemies.push(helper);
        });
    }

    /**
     * Positioniert den Boss auf seinem Sprungbogen.
     * @param {number} progress - Fortschritt des Sprungbogens zwischen 0 und 1.
     * @param {number} startX - Horizontale Startposition in Weltkoordinaten.
     * @param {number} distance - Vorzeichenbehaftete Sprungweite in Pixeln.
     */
    setJumpPose(progress, startX, distance) {
        this.isJumping = true;
        this.x = startX + distance * progress;
        this.y = this.groundY - Math.sin(progress * Math.PI) * this.jumpHeight;
    }

    /**
     * Setzt den Boss an der angegebenen Stelle auf den Boden.
     * @param {number} x - Horizontale Landeposition in Weltkoordinaten.
     */
    setGroundPose(x) {
        this.isJumping = false;
        this.x = x;
        this.y = this.groundY;
    }

    /**
     * Zeigt abhängig vom Zustand die passende Animation des Bosses.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
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
     * Spielt die Todesbilder bis zum letzten Bild einmal ab.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updateDeathAnimation(deltaTime) {
        this.deathElapsed = this.deathElapsed === null ? 0 : this.deathElapsed + deltaTime;
        const frameDuration = this.deathDuration / this.DEAD_IMAGES.length;
        this.showAnimationFrame(this.DEAD_IMAGES, this.deathElapsed, frameDuration);
    }

    /** Wählt das Bild für die aktuelle Phase des Vorwärtssprungs. */
    updateAttackAnimation() {
        this.showAnimationFrame(this.ATTACK_IMAGES, this.jumpElapsed, this.jumpDuration / this.ATTACK_IMAGES.length);
    }

    /** Spielt während des Angriffs schnellere Laufbilder als bei der Patrouille. */
    updateGroundAnimation() {
        const running = this.attackStartX !== null;
        const elapsed = running ? this.jumpElapsed - this.jumpDuration : this.patrolTravel / this.patrolSpeed;
        this.showAnimationFrame(this.WALKING_IMAGES, elapsed, running ? 0.08 : 0.15, true);
    }

    /**
     * Berechnet das Sprite aus der verstrichenen Animationszeit.
     * @param {string[]} images - Bildpfade in Wiedergabereihenfolge.
     * @param {number} elapsed - Fortschritt der Animation in Sekunden.
     * @param {number} frameDuration - Anzeigedauer je Bild in Sekunden.
     * @param {boolean} [loop=false] - Ob die Bildfolge wiederholt werden soll.
     */
    showAnimationFrame(images, elapsed, frameDuration, loop = false) {
        const frame = Math.floor(elapsed / frameDuration);
        const index = loop ? frame % images.length : Math.min(frame, images.length - 1);
        this.loadImage(images[index]);
    }

    /**
     * Prüft, ob die vorgesehene Dauer der Todesanimation abgelaufen ist.
     * @returns {boolean} Ob die Dauer der Todesanimation abgelaufen ist.
     */
    hasFinishedDeathAnimation() {
        return this.deathElapsed >= this.deathDuration;
    }
}
