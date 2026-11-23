/** Koordiniert Spielschleife, Kollisionen, Levelzeit und Ergebnis. */
class World {
    static showCollisionFrames = false;
    static simulationStep = 1 / 60;

    character = new Character();
    level = createLevel1();
    boss = this.level.enemies.find(enemy => enemy instanceof Endboss);
    canvas;
    keyboard;
    cameraX = 0;
    statusBar = new StatusBar(this.character);
    win = null;
    bottleController = new BottleController(this);
    levelTimers = new Set();
    levelTime = 0;
    pausedAt = null;
    pauseAnimationElapsed = 0;
    stopped = false;
    lastFrameTime = null;
    frameAccumulator = 0;
    /**
     * Verbindet Spielwelt, Eingaben, Audio und Rendering und startet die Schleife.
     * @param {HTMLCanvasElement} canvas - Leinwand der Spielwelt.
     * @param {Keyboard} keyboard - Eingabestatus für die Spielsteuerung.
     * @param {GameEndCallback} [onGameEnd] - Wird nach dem ersten gezeichneten Endbildschirm aufgerufen.
     * @param {GameAudio} [audio] - Optionale Ausgabe für die Spielgeräusche.
     * @param {PauseChangeCallback} [onPauseChange] - Wird bei einem Wechsel des Pausenstatus aufgerufen.
     */
    constructor(canvas, keyboard, onGameEnd = () => {}, audio, onPauseChange = () => {}) {
        this.renderer = new WorldRenderer(canvas);
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.onGameEnd = onGameEnd;
        this.onPauseChange = onPauseChange;
        this.audio = audio;
        this.character.world = this;
        ThrowableObject.preloadSprites();
        this.draw();
    }

    /** Verarbeitet Kontakte zwischen Pepe und lebenden Gegnern. */
    checkCollisions() {
        if (this.win !== null || this.character.isDead()) return;

        for (const enemy of this.level.enemies) {
            if (!enemy.isDead() && this.character.isColliding(enemy)) {
                this.hitCharacter(enemy);
            }
        }
    }

    /**
     * Führt einen Animationsframe aus und schließt eine beendete Runde ab.
     * @param {number} [timestamp] - Zeitstempel von requestAnimationFrame in Millisekunden. Beim ersten Aufruf fehlt er.
     */
    draw(timestamp) {
        if (this.stopped) return;
        if (timestamp !== undefined) this.advanceSimulation(timestamp);
        this.renderer.render(this);

        if (!this.paused && this.shouldShowEndScreen() && this.renderer.drawEndScreen(this.win)) {
            this.stop();
            this.onGameEnd(this.win);
            return;
        }

        this.animationFrame = requestAnimationFrame(timestamp => this.draw(timestamp));
    }

    /**
     * Zeigt an, ob die Simulation derzeit pausiert.
     * @returns {boolean} Ob die Simulation gerade pausiert.
     */
    get paused() {
        return this.pausedAt !== null;
    }

    /**
     * Hält die Simulation an oder setzt sie samt pausierten Trefferzeiten fort.
     * @param {boolean} paused - Ob das Spiel pausiert.
     */
    setPaused(paused) {
        if (this.stopped || this.paused === paused) return;

        if (paused) {
            this.pausedAt = performance.now();
            this.pauseAnimationElapsed = 0;
        } else {
            this.resumeActors();
        }
        this.lastFrameTime = null;
        this.audio?.setPaused?.(paused);
        this.onPauseChange(paused);
    }

    /** Verschiebt die Trefferzeiten um die Dauer der Pause. */
    resumeActors() {
        const pauseDuration = performance.now() - this.pausedAt;
        for (const actor of [this.character, ...this.level.enemies]) {
            actor.lastHit += pauseDuration;
        }
        this.pausedAt = null;
        this.character.idleElapsed = 0;
    }

    /** Beendet die Spielschleife und entfernt ausstehende Levelereignisse. */
    stop() {
        this.stopped = true;
        cancelAnimationFrame(this.animationFrame);
        this.levelTimers.clear();
    }

    /** Ermittelt Sieg oder Niederlage, sobald eine Figur besiegt ist. */
    updateGameResult() {
        if (this.win !== null) return;

        if (this.character.isDead()) {
            this.win = false;
        } else if (this.boss?.isDead()) {
            this.win = true;
        }
    }

    /**
     * Wartet auf die relevanten Todes- und Splash-Animationen.
     * @returns {boolean} Ob der Spielausgang und die erforderlichen Animationen abgeschlossen sind.
     */
    shouldShowEndScreen() {
        if (this.win === null) return false;

        if (this.win) {
            const bossAnimationFinished = !this.boss?.isDead() || this.boss.hasFinishedDeathAnimation();
            return bossAnimationFinished && !this.bottleController.activeBottle?.isSplashing;
        }
        return !this.character.isDead() || this.character.hasFinishedDeathAnimation();
    }

    /**
     * Verteilt die Zeit seit dem letzten Frame auf Simulation oder Pausenanimation.
     * @param {number} timestamp - Zeitstempel von requestAnimationFrame in Millisekunden.
     */
    advanceSimulation(timestamp) {
        const elapsed = this.lastFrameTime === null ?
            0 : Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = timestamp;

        if (this.paused) {
            this.pauseAnimationElapsed += elapsed;
            if (this.audio?.sleeping) this.audio.play('sleep');
        } else {
            this.runSimulationSteps(elapsed);
        }
    }

    /**
     * Arbeitet volle Simulationsschritte ab, bis die Zeit aufgebraucht ist oder das Spiel pausiert.
     * @param {number} elapsed - Seit der letzten Aktualisierung verstrichene Zeit in Sekunden.
     */
    runSimulationSteps(elapsed) {
        this.frameAccumulator += elapsed;
        const step = World.simulationStep;
        while (!this.paused && this.frameAccumulator + 1e-9 >= step) {
            this.frameAccumulator -= step;
            this.update(step);
        }
    }

    /**
     * Führt einen Simulationsschritt in definierter Reihenfolge aus.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    update(deltaTime) {
        if (this.paused || this.stopped) return;

        this.updateGameResult();
        if (this.win === null) this.updateActors(deltaTime);
        if (this.win === null) this.character.updatePhysics(deltaTime);
        this.checkCollisions();
        this.updateGameResult();
        if (this.win === null) this.updateLevel(deltaTime);
        this.bottleController.updateActiveBottle(deltaTime);
        this.updateAnimations(deltaTime);
        this.pauseIfIdle();
    }

    /**
     * Aktualisiert die Bewegung von Pepe, Hühnern und Boss.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updateActors(deltaTime) {
        this.character.updateMovement();
        this.level.enemies.forEach(enemy => {
            if (enemy instanceof Chicken) enemy.update(deltaTime);
        });
        this.updateBoss(deltaTime);
    }

    /**
     * Führt die zustandsabhängigen Animationen von Pepe und Boss weiter.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updateAnimations(deltaTime) {
        this.character.updateAnimation(deltaTime);
        this.boss?.updateAnimation(deltaTime);
    }

    /** Pausiert die Spielwelt mit Schlafgeräusch nach 15 Sekunden Untätigkeit. */
    pauseIfIdle() {
        if (this.win === null && this.character.idleElapsed + 1e-9 >= 15) {
            this.setPaused(true);
            this.audio?.setSleeping?.(true);
        }
    }

    /**
     * Aktualisiert Kulisse, Sammelobjekte und Wurfeingabe.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updateLevel(deltaTime) {
        this.levelTime += deltaTime;
        this.runLevelTimers();
        this.wrapScenery(this.level.backgroundObjects, this.level.backgroundLoopWidth);
        this.level.clouds.forEach(cloud => cloud.moveClouds(deltaTime));
        this.wrapScenery(this.level.clouds, this.level.cloudLoopWidth);
        this.collectNearbyItems();

        if (this.keyboard.isPressedOnce('action')) {
            this.character.idleElapsed = 0;
            this.bottleController.throwBottle();
        }
    }

    /** Überträgt berührte Münzen und Flaschen in Pepes Anzeige und Inventar. */
    collectNearbyItems() {
        const coins = this.collectItems(this.level.coins);
        const bottles = this.collectItems(this.level.bottles);
        this.character.coinCount += coins.length;
        this.character.bottles.push(...bottles);
        if (coins.length) this.audio?.play('coin');
        if (bottles.length) this.audio?.play('pickup');
    }

    /**
     * Aktualisiert die Bossbewegung und spielt Geräusche in der Nähe der Leinwand.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    updateBoss(deltaTime) {
        if (!this.boss) return;

        const { isJumping: wasJumping, patrolTravel: previousPatrol } = this.boss;
        this.boss.updateJump(deltaTime);
        if (!this.isBossNearViewport()) return;

        if (this.boss.isJumping && !wasJumping && this.boss.jumpElapsed < this.boss.returnJumpAt) {
            this.audio?.play('bossAttack');
        } else if (!this.boss.isJumping && this.boss.patrolTravel !== previousPatrol) {
            this.audio?.play('bossStep');
        }
    }

    /**
     * Prüft, ob der Boss auf oder kurz neben der Leinwand liegt.
     * @returns {boolean} Ob der Boss horizontal im Sichtbereich oder höchstens 80 Pixel daneben liegt.
     */
    isBossNearViewport() {
        const screenX = this.boss.x + this.cameraX;
        return screenX <= this.canvas.width + 80 && screenX + this.boss.width >= -80;
    }

    /**
     * Wendet Kontaktschaden an und spielt das Geräusch des Gegners.
     * @param {(Chicken|Endboss)} enemy - Gegner, dessen Kontaktschaden angewendet wird.
     */
    hitCharacter(enemy) {
        if (!this.character.hit(enemy.contactDamage)) return;

        const cue = enemy instanceof Endboss ? 'bossHit' :
            enemy instanceof SmallChicken ? 'smallChickenHit' : 'chickenHit';
        this.audio?.play(cue);
    }

    /**
     * Verarbeitet eine Landung auf einem normalen oder kleinen Huhn.
     * @param {number} previousFeet - Y-Koordinate von Pepes Füßen vor dem Fallschritt.
     */
    checkChickenStomp(previousFeet) {
        if (this.win !== null || this.character.isDead()) return;
        const player = this.character.getCollisionBounds();
        const chicken = this.level.enemies.find(enemy => this.wasStomped(enemy, player, previousFeet));
        if (!chicken) return;
        if (chicken instanceof SmallChicken) {
            this.hitCharacter(chicken);
            return;
        }

        this.character.y += chicken.getCollisionBounds().top - player.bottom;
        this.character.speedY = 18;
        this.defeatChicken(chicken);
    }

    /**
     * Prüft anhand der vorherigen Fußposition, ob Pepe ein Huhn von oben trifft.
     * @param {(Chicken|Endboss)} enemy - Gegner, der auf einen Sprungtreffer geprüft wird.
     * @param {CollisionBounds} player - Aktuelle Hitbox von Pepe.
     * @param {number} previousFeet - Y-Koordinate von Pepes Füßen vor dem Fallschritt.
     * @returns {boolean} Ob Pepe von oben auf ein lebendes Huhn trifft.
     */
    wasStomped(enemy, player, previousFeet) {
        if (!(enemy instanceof Chicken) || enemy.isDead()) return false;

        const bounds = enemy.getCollisionBounds();
        return previousFeet <= bounds.top && player.bottom >= bounds.top &&
            player.left < bounds.right && player.right > bounds.left;
    }

    /**
     * Zeigt den Tod eines Huhns und plant Entfernen und Wiedererscheinen.
     * @param {Chicken} chicken - Besiegtes Huhn.
     */
    defeatChicken(chicken) {
        chicken.die();
        this.audio?.play('chickenDeath');
        this.scheduleLevelChange(() => this.removeChicken(chicken), 2000);
        this.scheduleLevelChange(() => this.respawnChicken(chicken.constructor), 10_000);
    }

    /**
     * Entfernt das angegebene Huhn aus der Gegnerliste.
     * @param {Chicken} chicken - Huhn, das aus der Gegnerliste entfernt wird.
     */
    removeChicken(chicken) {
        const index = this.level.enemies.indexOf(chicken);
        if (index !== -1) this.level.enemies.splice(index, 1);
    }

    /**
     * Platziert ein Huhn desselben Typs mit sicherem Abstand zu Pepe.
     * @param {Function} ChickenType - Konstruktor des besiegten Hühnertyps.
     */
    respawnChicken(ChickenType) {
        const { enemies, levelEndX } = this.level;
        const x = getRandomChickenX(0, levelEndX, this.character.x, 300);
        if (x !== null) enemies.push(new ChickenType(x, levelEndX));
    }

    /**
     * Plant ein Ereignis relativ zur laufenden Levelzeit.
     * @param {LevelChangeCallback} callback - Auszuführendes Levelereignis.
     * @param {number} delayMs - Wartezeit in Millisekunden laufender Spielzeit.
     */
    scheduleLevelChange(callback, delayMs) {
        this.levelTimers.add({ callback, dueAt: this.levelTime + delayMs / 1000 });
    }

    /** Führt die fälligen Ereignisse der Levelzeit aus. */
    runLevelTimers() {
        for (const timer of this.levelTimers) {
            if (timer.dueAt > this.levelTime + 1e-9) continue;

            this.levelTimers.delete(timer);
            timer.callback();
        }
    }

    /**
     * Entfernt berührte Sammelobjekte aus der Liste und gibt sie zurück.
     * @param {Collectible[]} items - Veränderbare Liste der Sammelobjekte.
     * @returns {Collectible[]} Berührte und aus der Liste entfernte Objekte.
     */
    collectItems(items) {
        const collected = [];
        for (let i = items.length - 1; i >= 0; i--) {
            if (this.character.isColliding(items[i])) {
                collected.push(...items.splice(i, 1));
            }
        }
        return collected;
    }

    /**
     * Verschiebt Kulissenkacheln außerhalb der Kamera in die nächste Wiederholung.
     * @param {DrawableObject[]} objects - Zu wiederholende Kulissenkacheln.
     * @param {number} loopWidth - Breite eines vollständigen Kachelzyklus in Pixeln.
     */
    wrapScenery(objects, loopWidth) {
        if (loopWidth === 0) return;

        const left = -this.cameraX;
        const right = left + this.canvas.width;
        for (const object of objects) {
            if (object.x + object.width < left) object.x += loopWidth;
            if (object.x > right) object.x -= loopWidth;
        }
    }

}
