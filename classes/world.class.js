/** Coordinates the game loop, collisions, level time, and round result. */
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
     * Wires up the game world, input, audio, and rendering, then starts the loop.
     * @param {HTMLCanvasElement} canvas - Canvas used to draw the game world.
     * @param {Keyboard} keyboard - Input state used to control the game.
     * @param {GameEndCallback} [onGameEnd] - Called after the end screen has been drawn for the first time.
     * @param {GameAudio} [audio] - Optional audio output for the game.
     * @param {PauseChangeCallback} [onPauseChange] - Called when the pause state changes.
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

    /** Handles contact between Pepe and living enemies. */
    checkCollisions() {
        if (this.win !== null || this.character.isDead()) return;

        for (const enemy of this.level.enemies) {
            if (!enemy.isDead() && this.character.isColliding(enemy)) {
                this.hitCharacter(enemy);
            }
        }
    }

    /**
     * Runs an animation frame and finalizes the round when it has ended.
     * @param {number} [timestamp] - Timestamp from requestAnimationFrame in milliseconds. Omitted on the first call.
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
     * Indicates whether the simulation is currently paused.
     * @returns {boolean} Whether the simulation is currently paused.
     */
    get paused() {
        return this.pausedAt !== null;
    }

    /**
     * Pauses or resumes the simulation while preserving hit timing.
     * @param {boolean} paused - Whether the game is paused.
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

    /** Shifts hit timestamps by the pause duration. */
    resumeActors() {
        const pauseDuration = performance.now() - this.pausedAt;
        for (const actor of [this.character, ...this.level.enemies]) {
            actor.lastHit += pauseDuration;
        }
        this.pausedAt = null;
        this.character.idleElapsed = 0;
    }

    /** Stops the game loop and clears pending level events. */
    stop() {
        this.stopped = true;
        cancelAnimationFrame(this.animationFrame);
        this.levelTimers.clear();
    }

    /** Determines whether the player won or lost once either side is defeated. */
    updateGameResult() {
        if (this.win !== null) return;

        if (this.character.isDead()) {
            this.win = false;
        } else if (this.boss?.isDead()) {
            this.win = true;
        }
    }

    /**
     * Waits for the relevant death and splash animations.
     * @returns {boolean} Whether the result is known and all required animations have finished.
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
     * Applies the time since the previous frame to the simulation or pause animation.
     * @param {number} timestamp - Timestamp from requestAnimationFrame in milliseconds.
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
     * Runs complete simulation steps until time runs out or the game pauses.
     * @param {number} elapsed - Time elapsed since the previous update, in seconds.
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
     * Runs a simulation step in the prescribed order.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
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
     * Updates the movement of Pepe, the chickens, and the boss.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateActors(deltaTime) {
        this.character.updateMovement();
        this.level.enemies.forEach(enemy => {
            if (enemy instanceof Chicken) enemy.update(deltaTime, enemy.bossHelper ? this.character.x : undefined);
        });
        this.updateBoss(deltaTime);
    }

    /**
     * Advances Pepe's and the boss's animations for their current states.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateAnimations(deltaTime) {
        this.character.updateAnimation(deltaTime);
        this.boss?.updateAnimation(deltaTime);
    }

    /** Pauses the game with a sleeping sound after 15 seconds of inactivity. */
    pauseIfIdle() {
        if (this.win === null && this.character.idleElapsed + 1e-9 >= 15) {
            this.setPaused(true);
            this.audio?.setSleeping?.(true);
        }
    }

    /**
     * Updates scenery and collectibles and processes throw input.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
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

    /** Adds touched coins and bottles to Pepe's counters and inventory. */
    collectNearbyItems() {
        const coins = this.collectItems(this.level.coins);
        const bottles = this.collectItems(this.level.bottles);
        this.character.coinCount += coins.length;
        this.character.bottles.push(...bottles);
        if (coins.length) this.audio?.play('coin');
        if (bottles.length) this.audio?.play('pickup');
    }

    /**
     * Updates the boss, its reinforcements, and its sounds near the viewport.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    updateBoss(deltaTime) {
        if (!this.boss) return;

        const { isJumping: wasJumping, x: previousX } = this.boss;
        this.boss.updateJump(deltaTime);
        this.boss.updateHelpers(this.character.x, this.level, deltaTime);
        if (!this.isBossNearViewport()) return;

        if (this.boss.isJumping && !wasJumping) {
            this.audio?.play('bossAttack');
        } else if (!this.boss.isJumping && this.boss.x !== previousX) {
            this.audio?.play('bossStep');
        }
    }

    /**
     * Checks whether the boss is inside or just outside the viewport.
     * @returns {boolean} Whether the boss is horizontally visible or at most 80 pixels outside the viewport.
     */
    isBossNearViewport() {
        const screenX = this.boss.x + this.cameraX;
        return screenX <= this.canvas.width + 80 && screenX + this.boss.width >= -80;
    }

    /**
     * Applies contact damage and plays the enemy's impact sound.
     * @param {(Chicken|Endboss)} enemy - Enemy that deals contact damage.
     */
    hitCharacter(enemy) {
        if (!this.character.hit(enemy.contactDamage)) return;

        const cue = enemy instanceof Endboss ? 'bossHit' :
            enemy instanceof SmallChicken ? 'smallChickenHit' : 'chickenHit';
        this.audio?.play(cue);
    }

    /**
     * Handles Pepe landing on a regular or small chicken.
     * @param {number} previousFeet - Y coordinate of Pepe's feet before the fall step.
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
     * Uses the previous foot position to check for a stomp from above.
     * @param {(Chicken|Endboss)} enemy - Enemy being checked for a stomp.
     * @param {CollisionBounds} player - Pepe's current hitbox.
     * @param {number} previousFeet - Y coordinate of Pepe's feet before the fall step.
     * @returns {boolean} Whether Pepe landed on a living chicken from above.
     */
    wasStomped(enemy, player, previousFeet) {
        if (!(enemy instanceof Chicken) || enemy.isDead()) return false;

        const bounds = enemy.getCollisionBounds();
        return previousFeet <= bounds.top && player.bottom >= bounds.top &&
            player.left < bounds.right && player.right > bounds.left;
    }

    /**
     * Shows a chicken's death, schedules its removal, and respawns regular level chickens.
     * @param {Chicken} chicken - Defeated chicken.
     */
    defeatChicken(chicken) {
        chicken.die();
        this.audio?.play('chickenDeath');
        this.scheduleLevelChange(() => this.removeChicken(chicken), 2000);
        if (!chicken.bossHelper) this.scheduleLevelChange(() => this.respawnChicken(chicken.constructor), 10_000);
    }

    /**
     * Removes the specified chicken from the enemy list.
     * @param {Chicken} chicken - Chicken to remove from the enemy list.
     */
    removeChicken(chicken) {
        const index = this.level.enemies.indexOf(chicken);
        if (index !== -1) this.level.enemies.splice(index, 1);
    }

    /**
     * Spawns a chicken of the same type at a safe distance from Pepe.
     * @param {Function} ChickenType - Constructor for the defeated chicken type.
     */
    respawnChicken(ChickenType) {
        const { enemies, levelEndX } = this.level;
        const x = getRandomChickenX(0, levelEndX, this.character.x, 300);
        if (x !== null) enemies.push(new ChickenType(x, levelEndX));
    }

    /**
     * Schedules an event relative to the current level time.
     * @param {LevelChangeCallback} callback - Level event to run.
     * @param {number} delayMs - Delay in milliseconds of active game time.
     */
    scheduleLevelChange(callback, delayMs) {
        this.levelTimers.add({ callback, dueAt: this.levelTime + delayMs / 1000 });
    }

    /** Runs the level events that are due. */
    runLevelTimers() {
        for (const timer of this.levelTimers) {
            if (timer.dueAt > this.levelTime + 1e-9) continue;

            this.levelTimers.delete(timer);
            timer.callback();
        }
    }

    /**
     * Removes collectibles that Pepe touches and returns them.
     * @param {Collectible[]} items - Mutable list of collectibles.
     * @returns {Collectible[]} Collectibles that Pepe touched and that were removed from the list.
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
     * Aligns repeating scenery tiles with the left edge of the camera.
     * @param {DrawableObject[]} objects - Scenery tiles to repeat.
     * @param {number} loopWidth - Width of one full tile loop in pixels.
     */
    wrapScenery(objects, loopWidth) {
        if (loopWidth === 0) return;

        const left = -this.cameraX;
        for (const object of objects) {
            const cycles = Math.floor((left - object.x) / loopWidth);
            object.x += cycles * loopWidth;
            if (object.x + object.width <= left) object.x += loopWidth;
        }
    }

}
