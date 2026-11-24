/** Manages bottle throws, impacts, splashes, and respawns. */
class BottleController {
    activeBottle = null;

    /**
     * Connects the projectile controller to the live game world.
     * @param {World} world - Live game world with actors, level, and audio.
     */
    constructor(world) {
        this.world = world;
    }

    /** Creates a projectile from a bottle in Pepe's inventory. */
    throwBottle() {
        if (!this.canThrowBottle()) return;

        const { character } = this.world;
        const direction = character.otherDirection ? -1 : 1;
        const { left, top, right, bottom } = character.getCollisionBounds();
        const x = direction === 1 ? right : left - ThrowableObject.size;
        const y = (top + bottom - ThrowableObject.size) / 2;
        const bottle = character.bottles.pop();
        const airborne = character.isAboveGround() || character.speedY > 0;
        this.activeBottle = new ThrowableObject(x, y, direction, bottle, airborne);
        this.world.audio?.play('throw');
    }

    /**
     * Checks whether Pepe can throw a bottle in the current round.
     * @returns {boolean} Whether a bottle is available and can currently be thrown.
     */
    canThrowBottle() {
        return this.world.win === null && !this.world.character.isDead() &&
            this.world.character.bottleCount > 0 && this.activeBottle === null &&
            !this.world.paused && !this.world.stopped;
    }

    /**
     * Advances the projectile and handles landings or impacts.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateActiveBottle(deltaTime) {
        const bottle = this.activeBottle;
        if (!bottle) return;
        if (bottle.isSplashing) {
            this.advanceSplash(bottle, deltaTime);
            return;
        }
        if (this.world.win !== null) return;

        bottle.update(deltaTime);
        if (!this.checkBottleImpact(bottle) && bottle.hasLanded()) this.dropBottle(bottle);
    }

    /**
     * Finishes the splash and places a replacement bottle if the round is still running.
     * @param {ThrowableObject} bottle - Projectile currently splashing.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    advanceSplash(bottle, deltaTime) {
        bottle.update(deltaTime);
        if (!bottle.hasFinishedSplash) return;
        this.activeBottle = null;
        if (this.world.win === null) this.spawnBottleNearCharacter();
    }

    /**
     * Drops the intact bottle onto the sand after a missed throw.
     * @param {ThrowableObject} bottle - Landed projectile and the original bottle it came from.
     */
    dropBottle(bottle) {
        const rightBoundary = this.world.level.levelEndX - SalsaBottle.width;
        bottle.sourceBottle.x = Math.max(this.world.character.leftBoundary, Math.min(rightBoundary, bottle.x));
        this.world.level.bottles.push(bottle.sourceBottle);
        this.world.audio?.play('bottleLand');
        this.activeBottle = null;
    }

    /**
     * Checks which target the projectile hits first.
     * @param {ThrowableObject} projectile - Bottle projectile to check for an impact.
     * @returns {boolean} Whether an impact or reflection was handled.
     */
    checkBottleImpact(projectile) {
        if (projectile.isReflected) return this.checkReflectedBottleImpact(projectile);

        const chicken = this.world.level.enemies.find(enemy =>
            enemy instanceof Chicken && !enemy.isDead() && projectile.isColliding(enemy)
        );
        if (!chicken) return this.checkBossBottleImpact(projectile);

        this.world.defeatChicken(chicken);
        this.destroyBottle(projectile);
        return true;
    }

    /**
     * Checks whether a reflected bottle hits Pepe.
     * @param {ThrowableObject} projectile - Bottle projectile to check for an impact.
     * @returns {boolean} Whether the projectile touched Pepe.
     */
    checkReflectedBottleImpact(projectile) {
        if (!projectile.isColliding(this.world.character)) return false;
        this.world.character.hit(projectile.damage);
        this.destroyBottle(projectile);
        return true;
    }

    /**
     * Handles a bottle hit or reflection at the boss.
     * @param {ThrowableObject} projectile - Bottle projectile to check for an impact.
     * @returns {boolean} Whether the projectile touched the living boss.
     */
    checkBossBottleImpact(projectile) {
        if (!this.world.boss || this.world.boss.isDead() || !projectile.isColliding(this.world.boss)) return false;

        if (this.world.boss.isJumping) {
            projectile.reflect(this.world.character.getCollisionBounds());
        } else {
            if (this.world.boss.hit(projectile.damage)) this.world.audio?.play('bossHurt');
            this.destroyBottle(projectile);
        }
        return true;
    }

    /**
     * Starts the splash and checks whether the hit ended the round.
     * @param {ThrowableObject} projectile - Bottle projectile to check for an impact.
     */
    destroyBottle(projectile) {
        projectile.splash();
        this.world.audio?.play('splash');
        this.world.updateGameResult();
    }

    /** Places a reachable replacement bottle to Pepe's right. */
    spawnBottleNearCharacter() {
        const { right } = this.world.character.getCollisionBounds();
        const maxReachableX = this.world.level.levelEndX + this.world.character.width / 2;
        const x = Math.min(right + 85, maxReachableX);
        this.world.level.bottles.push(new SalsaBottle(x));
    }
}
