class World {
    static showCollisionFrames = false;
    static simulationStep = 1 / 60;

    character = new Character();
    level = createLevel1();
    boss = this.level.enemies.find(enemy => enemy instanceof Endboss);
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar(this.character);
    win = null;
    activeBottle = null;
    levelTimers = new Set();
    levelTime = 0;
    pausedAt = null;
    pauseAnimationElapsed = 0;
    stopped = false;
    lastFrameTime = null;
    frameAccumulator = 0;
    endScreens = {
        true: this.loadEndScreen('img/You won, you lost/You Won B.png'),
        false: this.loadEndScreen('img/You won, you lost/Game over A.png'),
    };


    constructor(canvas, keyboard, onGameEnd = () => {}, audio) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.onGameEnd = onGameEnd;
        this.audio = audio;
        this.setWorld();
        ThrowableObject.preloadSprites();
        this.draw();
    }

    setWorld() {
        this.character.world = this;
    }

    checkCollisions() {
        if (this.win !== null || this.character.isDead()) return;

        for (const enemy of this.level.enemies) {
            if (!enemy.isDead() && this.character.isColliding(enemy)) {
                this.hitCharacter(enemy);
            }
        }
    }

    draw(timestamp) {
        if (this.stopped) return;
        if (timestamp !== undefined) this.advanceSimulation(timestamp);
        this.render();

        if (!this.paused && this.shouldShowEndScreen() && this.drawEndScreen()) {
            this.stop();
            this.onGameEnd(this.win);
            return;
        }

        this.animationFrame = requestAnimationFrame(timestamp => this.draw(timestamp));
    }

    get paused() {
        return this.pausedAt !== null;
    }

    setPaused(paused) {
        if (this.stopped || this.paused === paused) return;

        const now = performance.now();
        if (paused) {
            this.pausedAt = now;
            this.pauseAnimationElapsed = 0;
        } else {
            const pauseDuration = now - this.pausedAt;
            for (const actor of [this.character, ...this.level.enemies]) {
                actor.lastHit += pauseDuration;
            }
            this.pausedAt = null;
        }

        this.lastFrameTime = null;
        this.audio?.setPaused?.(paused);
    }

    stop() {
        this.stopped = true;
        cancelAnimationFrame(this.animationFrame);
        this.levelTimers.clear();
    }

    updateGameResult() {
        if (this.win !== null) return;

        if (this.character.isDead()) {
            this.win = false;
        } else if (this.boss?.isDead()) {
            this.win = true;
        }
    }

    shouldShowEndScreen() {
        if (this.win === null) return false;

        if (this.win) {
            const bossAnimationFinished = !this.boss?.isDead() || this.boss.hasFinishedDeathAnimation();
            return bossAnimationFinished && !this.activeBottle?.isSplashing;
        }
        return !this.character.isDead() || this.character.hasFinishedDeathAnimation();
    }

    loadEndScreen(path) {
        const screen = new DrawableObject();
        screen.loadImage(path);
        return screen;
    }

    drawEndScreen() {
        const screen = this.endScreens[this.win];
        const { complete, naturalWidth, naturalHeight } = screen.img;
        if (!complete) return false;

        const { width, height } = this.canvas;
        const centerY = height * (this.win ? 0.5 : 0.425);
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.ctx.fillRect(0, 0, width, height);

        if (naturalWidth > 0 && naturalHeight > 0) {
            const maxHeight = height * (this.win ? 0.65 : 0.58);
            const scale = Math.min(width * 0.75 / naturalWidth, maxHeight / naturalHeight);
            screen.width = naturalWidth * scale;
            screen.height = naturalHeight * scale;
            screen.x = (width - screen.width) / 2;
            screen.y = centerY - screen.height / 2;
            screen.draw(this.ctx);
        } else {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Boogaloo, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.win ? 'YOU WON!' : 'GAME OVER', width / 2, centerY);
        }

        this.ctx.restore();
        return true;
    }

    advanceSimulation(timestamp) {
        const elapsed = this.lastFrameTime === null ?
            0 : Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = timestamp;

        if (this.paused) {
            this.pauseAnimationElapsed += elapsed;
            return;
        }

        this.frameAccumulator += elapsed;
        const step = World.simulationStep;
        while (this.frameAccumulator + 1e-9 >= step) {
            this.frameAccumulator -= step;
            this.update(step);
        }
    }

    update(deltaTime) {
        if (this.paused || this.stopped) return;

        this.updateGameResult();
        if (this.win === null) {
            this.character.updateMovement();
            this.level.enemies.forEach(enemy => {
                if (enemy instanceof Chicken) enemy.update(deltaTime);
            });
            this.updateBoss(deltaTime);
        }

        if (this.win !== true) this.character.updatePhysics(deltaTime);
        this.checkCollisions();
        this.updateGameResult();

        if (this.win === null) this.updateLevel(deltaTime);
        this.updateActiveBottle(deltaTime);
        this.character.updateAnimation(deltaTime);
        this.boss?.updateAnimation(deltaTime);
    }

    updateLevel(deltaTime) {
        this.levelTime += deltaTime;
        this.runLevelTimers();

        this.wrapScenery(this.level.backgroundObjects, this.level.backgroundLoopWidth);
        this.level.clouds.forEach(cloud => cloud.moveClouds(deltaTime));
        this.wrapScenery(this.level.clouds, this.level.cloudLoopWidth);

        const coins = this.collectItems(this.level.coins);
        const bottles = this.collectItems(this.level.bottles);
        this.character.coinCount += coins.length;
        this.character.bottles.push(...bottles);
        if (coins.length) this.audio?.play('coin');
        if (bottles.length) this.audio?.play('pickup');
        if (this.keyboard.isPressedOnce('action')) {
            this.throwBottle();
        }
    }

    updateBoss(deltaTime) {
        if (!this.boss) return;

        const { isJumping: wasJumping, patrolTravel: previousPatrol } = this.boss;
        this.boss.updateJump(deltaTime);

        const screenX = this.boss.x + this.camera_x;
        if (screenX > this.canvas.width + 80 || screenX + this.boss.width < -80) return;

        if (this.boss.isJumping && !wasJumping && this.boss.jumpElapsed < this.boss.returnJumpAt) {
            this.audio?.play('bossAttack');
        } else if (!this.boss.isJumping && this.boss.patrolTravel !== previousPatrol) {
            this.audio?.play('bossStep');
        }
    }

    hitCharacter(enemy) {
        if (!this.character.hit(enemy.contactDamage)) return;

        const cue = enemy instanceof Endboss ? 'bossHit' :
            enemy instanceof SmallChicken ? 'smallChickenHit' : 'chickenHit';
        this.audio?.play(cue);
    }

    throwBottle() {
        if (
            this.win !== null ||
            this.character.isDead() ||
            this.character.bottleCount === 0 ||
            this.activeBottle !== null ||
            this.paused || this.stopped
        ) return;

        const direction = this.character.otherDirection ? -1 : 1;
        const { left, top, right, bottom } = this.character.getCollisionBounds();
        const x = direction === 1 ? right : left - ThrowableObject.size;
        const y = (top + bottom - ThrowableObject.size) / 2;
        const bottle = this.character.bottles.pop();
        this.activeBottle = new ThrowableObject(x, y, direction, bottle);
        this.audio?.play('throw');
    }

    updateActiveBottle(deltaTime) {
        const bottle = this.activeBottle;
        if (!bottle) return;

        if (bottle.isSplashing) {
            bottle.update(deltaTime);
            if (bottle.hasFinishedSplash) this.activeBottle = null;
            return;
        }
        if (this.win !== null) return;

        bottle.update(deltaTime);
        if (this.checkBottleImpact(bottle) || !bottle.hasLanded()) return;

        const rightBoundary = this.level.level_end_x - SalsaBottle.width;
        bottle.sourceBottle.x = Math.max(this.character.leftBoundary, Math.min(rightBoundary, bottle.x));
        this.level.bottles.push(bottle.sourceBottle);
        this.audio?.play('bottleLand');
        this.activeBottle = null;
    }

    checkBottleImpact(projectile) {
        if (projectile.isReflected) {
            if (!projectile.isColliding(this.character)) return false;

            this.character.hit(projectile.damage);
            this.destroyBottle(projectile);
            return true;
        }

        if (!this.boss || this.boss.isDead() || !projectile.isColliding(this.boss)) return false;

        if (this.boss.isJumping) {
            projectile.reflect(this.character.getCollisionBounds());
        } else {
            this.boss.hit(projectile.damage);
            this.destroyBottle(projectile);
        }
        return true;
    }

    destroyBottle(projectile) {
        projectile.splash();
        this.audio?.play('splash');
        this.scheduleLevelChange(() => {
            projectile.sourceBottle.returnToSpawn();
            this.level.bottles.push(projectile.sourceBottle);
        }, 3000);
        this.updateGameResult();
    }

    checkChickenStomp(previousFeet) {
        if (this.win !== null || this.character.isDead()) return;

        const player = this.character.getCollisionBounds();
        const chicken = this.level.enemies.find(enemy => {
            if (!(enemy instanceof Chicken) || enemy.isDead()) return false;

            const bounds = enemy.getCollisionBounds();
            return previousFeet <= bounds.top && player.bottom >= bounds.top &&
                player.left < bounds.right && player.right > bounds.left;
        });
        if (!chicken) return;

        if (chicken instanceof SmallChicken) {
            this.hitCharacter(chicken);
            return;
        }

        this.character.y += chicken.getCollisionBounds().top - player.bottom;
        this.character.speedY = 18;
        this.defeatChicken(chicken);
    }

    defeatChicken(chicken) {
        chicken.die();
        this.audio?.play('chickenDeath');
        this.scheduleLevelChange(() => {
            const index = this.level.enemies.indexOf(chicken);
            if (index !== -1) this.level.enemies.splice(index, 1);
        }, 2000);

        this.scheduleLevelChange(() => {
            const x = getRandomChickenX(0, this.level.level_end_x, this.character.x, 300);
            if (x !== null) this.level.enemies.push(new Chicken(x, this.level.level_end_x));
        }, 10_000);
    }

    scheduleLevelChange(callback, delayMs) {
        this.levelTimers.add({ callback, dueAt: this.levelTime + delayMs / 1000 });
    }

    runLevelTimers() {
        for (const timer of this.levelTimers) {
            if (timer.dueAt > this.levelTime + 1e-9) continue;

            this.levelTimers.delete(timer);
            timer.callback();
        }
    }

    collectItems(items) {
        const collected = [];
        for (let i = items.length - 1; i >= 0; i--) {
            if (this.character.isColliding(items[i])) {
                collected.push(...items.splice(i, 1));
            }
        }
        return collected;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        try {
            this.ctx.translate(this.camera_x, 0);
            this.addObjectsToMap(this.level.backgroundObjects);
            this.addObjectsToMap(this.level.clouds);
            this.level.bottles.forEach(bottle => bottle.draw(this.ctx));
            this.level.coins.forEach(coin => coin.draw(this.ctx));
            this.addToMap(this.character);
            this.addObjectsToMap(this.level.enemies);
            this.activeBottle?.draw(this.ctx);
        } finally {
            this.ctx.restore();
        }

        this.statusBar.draw(this.ctx);
    }

    addObjectsToMap(objects) {
        objects.forEach(object => {
            this.addToMap(object);
        });
    }

    wrapScenery(objects, loopWidth) {
        if (loopWidth === 0) return;

        const left = -this.camera_x;
        const right = left + this.canvas.width;
        for (const object of objects) {
            if (object.x + object.width < left) object.x += loopWidth;
            if (object.x > right) object.x -= loopWidth;
        }
    }

    addToMap(movableObject) {
        if (movableObject.otherDirection) {
            this.drawMirrored(movableObject);
        } else {
            movableObject.draw(this.ctx);
        }

        if (World.showCollisionFrames &&
            !(movableObject instanceof BackgroundObject) &&
            !(movableObject instanceof Cloud)) {
            movableObject.drawFrame(this.ctx);
        }
    }

    drawMirrored(object) {
        this.ctx.save();
        try {
            this.ctx.translate(2 * object.x + object.width, 0);
            this.ctx.scale(-1, 1);
            object.draw(this.ctx);
        } finally {
            this.ctx.restore();
        }
    }
};
