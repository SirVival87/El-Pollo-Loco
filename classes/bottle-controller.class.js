class BottleController {
    activeBottle = null;

    /** Verbindet die Projektilsteuerung mit der laufenden Spielwelt. */
    constructor(world) {
        this.world = world;
    }

    /** Erzeugt ein Projektil aus einer Flasche in Pepes Inventar. */
    throwBottle() {
        if (!this.canThrowBottle()) return;

        const direction = this.world.character.otherDirection ? -1 : 1;
        const { left, top, right, bottom } = this.world.character.getCollisionBounds();
        const x = direction === 1 ? right : left - ThrowableObject.size;
        const y = (top + bottom - ThrowableObject.size) / 2;
        const bottle = this.world.character.bottles.pop();
        this.activeBottle = new ThrowableObject(x, y, direction, bottle);
        this.world.audio?.play('throw');
    }

    /** Prüft, ob Pepe in dieser Runde eine Flasche werfen kann. */
    canThrowBottle() {
        return this.world.win === null && !this.world.character.isDead() &&
            this.world.character.bottleCount > 0 && this.activeBottle === null &&
            !this.world.paused && !this.world.stopped;
    }

    /** Aktualisiert das Projektil und verarbeitet Landung oder Treffer. */
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

    /** Beendet den Splash und platziert bei laufendem Spiel eine Ersatzflasche. */
    advanceSplash(bottle, deltaTime) {
        bottle.update(deltaTime);
        if (!bottle.hasFinishedSplash) return;
        this.activeBottle = null;
        if (this.world.win === null) this.spawnBottleNearCharacter();
    }

    /** Legt die unverbrauchte Flasche nach einem Fehlwurf in den Sand. */
    dropBottle(bottle) {
        const rightBoundary = this.world.level.levelEndX - SalsaBottle.width;
        bottle.sourceBottle.x = Math.max(this.world.character.leftBoundary, Math.min(rightBoundary, bottle.x));
        this.world.level.bottles.push(bottle.sourceBottle);
        this.world.audio?.play('bottleLand');
        this.activeBottle = null;
    }

    /** Prüft, welches Ziel die fliegende Flasche zuerst getroffen hat. */
    checkBottleImpact(projectile) {
        if (projectile.isReflected) return this.checkReflectedBottleImpact(projectile);

        const chicken = this.world.level.enemies.find(enemy =>
            enemy instanceof Chicken && !(enemy instanceof SmallChicken) &&
            !enemy.isDead() && projectile.isColliding(enemy)
        );
        if (!chicken) return this.checkBossBottleImpact(projectile);

        this.world.defeatChicken(chicken);
        this.destroyBottle(projectile);
        return true;
    }

    /** Prüft, ob eine reflektierte Flasche Pepe trifft. */
    checkReflectedBottleImpact(projectile) {
        if (!projectile.isColliding(this.world.character)) return false;
        this.world.character.hit(projectile.damage);
        this.destroyBottle(projectile);
        return true;
    }

    /** Verarbeitet einen Flaschentreffer oder eine Reflexion am Boss. */
    checkBossBottleImpact(projectile) {
        if (!this.world.boss || this.world.boss.isDead() || !projectile.isColliding(this.world.boss)) return false;

        if (this.world.boss.isJumping) {
            projectile.reflect(this.world.character.getCollisionBounds());
        } else {
            this.world.boss.hit(projectile.damage);
            this.destroyBottle(projectile);
        }
        return true;
    }

    /** Startet den Splash und prüft, ob der Treffer die Runde beendet. */
    destroyBottle(projectile) {
        projectile.splash();
        this.world.audio?.play('splash');
        this.world.updateGameResult();
    }

    /** Platziert eine erreichbare Ersatzflasche rechts von Pepe. */
    spawnBottleNearCharacter() {
        const { right } = this.world.character.getCollisionBounds();
        const maxReachableX = this.world.level.levelEndX + this.world.character.width / 2;
        const x = Math.min(right + 85, maxReachableX);
        this.world.level.bottles.push(new SalsaBottle(x));
    }
}
