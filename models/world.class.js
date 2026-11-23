class World {
    static showCollisionFrames = false;

    character = new Character();
    level = createLevel1();
    boss = this.level.enemies.find(enemy => enemy instanceof Endboss);
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar(this.character);
    win = null;
    thrownBottles = [];
    levelTimers = new Set();
    bottleImages = ThrowableObject.loadSprites();
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
        this.collisionTimer = this.checkCollisions();
        this.draw();
    }

    setWorld() {
        this.character.world = this;
    }

    checkCollisions() {
        return setInterval(() => {
            if (this.win !== null) return;

            this.level.enemies.forEach(enemy => {
                if (!enemy.isDead() && this.character.isColliding(enemy)) {
                    this.hitCharacter(enemy);
                }
            });
        }, 200);
    }

    draw(timestamp = 0) {
        const deltaTime = this.getDeltaTime(timestamp);

        this.updateGameResult();
        if (this.win === null) {
            this.update(deltaTime);
        }
        this.updateThrownBottles(Math.min(deltaTime, 0.05));
        this.boss?.updateAnimation(deltaTime);
        this.render();

        if (this.shouldShowEndScreen() && this.drawEndScreen()) {
            this.stop();
            this.onGameEnd(this.win);
            return;
        }

        this.animationFrame = requestAnimationFrame(timestamp => this.draw(timestamp));
    }

    stop() {
        cancelAnimationFrame(this.animationFrame);
        clearInterval(this.collisionTimer);
        this.levelTimers.forEach(timer => clearTimeout(timer));
        this.levelTimers.clear();
        this.character.stop();
        this.level.enemies.forEach(enemy => enemy.stop());
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
            return bossAnimationFinished && !this.thrownBottles.some(bottle => bottle.isSplashing);
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

    getDeltaTime(timestamp) {
        const deltaTime = this.lastFrameTime ? (timestamp - this.lastFrameTime) / 1000 : 0;
        this.lastFrameTime = timestamp;
        return deltaTime;
    }

    update(deltaTime) {
        this.moveBackgroundObjectsBackIntoView();
        this.level.clouds.forEach(cloud => cloud.moveClouds(deltaTime));
        this.moveCloudsBackIntoView();
        this.updateBoss(deltaTime);
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
        const previousEnergy = this.character.energy;
        this.character.hit(enemy.contactDamage);
        if (this.character.energy >= previousEnergy) return;

        const cue = enemy instanceof Endboss ? 'bossHit' :
            enemy instanceof SmallChicken ? 'smallChickenHit' : 'chickenHit';
        this.audio?.play(cue);
    }

    throwBottle() {
        if (
            this.win !== null ||
            this.character.isDead() ||
            this.character.bottleCount === 0 ||
            this.thrownBottles.length > 0
        ) return;

        const direction = this.character.otherDirection ? -1 : 1;
        const { left, top, right, bottom } = this.character.getCollisionBounds();
        const x = direction === 1 ? right : left - ThrowableObject.size;
        const y = (top + bottom - ThrowableObject.size) / 2;
        const bottle = this.character.bottles.pop();
        this.thrownBottles.push(new ThrowableObject(x, y, direction, bottle, this.bottleImages));
        this.audio?.play('throw');
    }

    updateThrownBottles(deltaTime) {
        if (this.thrownBottles.length === 0) return;

        this.thrownBottles = this.thrownBottles.filter(bottle => {
            if (bottle.isSplashing) {
                bottle.update(deltaTime);
                return !bottle.hasFinishedSplash;
            }
            if (this.win !== null) return true;

            bottle.update(deltaTime);
            if (this.checkBottleImpact(bottle)) return true;
            if (bottle.hasLanded()) {
                const rightBoundary = this.level.level_end_x - SalsaBottle.width;
                bottle.sourceBottle.x = Math.max(this.character.leftBoundary, Math.min(rightBoundary, bottle.x));
                this.level.bottles.push(bottle.sourceBottle);
                this.audio?.play('bottleLand');
                return false;
            }
            return true;
        });
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
            this.level.enemies.push(new Chicken(x, this.level.level_end_x));
        }, 10_000);
    }

    scheduleLevelChange(callback, delay) {
        const timer = setTimeout(() => {
            this.levelTimers.delete(timer);
            if (this.win === null && !this.character.isDead()) callback();
        }, delay);
        this.levelTimers.add(timer);
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

        this.ctx.translate(this.camera_x, 0); // 0 = verschiebung der y-Achse die muss mit angegeben werden

        this.addObjectsToMap(this.level.backgroundObjects);
        this.addObjectsToMap(this.level.clouds);
        this.level.bottles.forEach(bottle => bottle.draw(this.ctx));
        this.level.coins.forEach(coin => coin.draw(this.ctx));
        this.addToMap(this.character);
        this.addObjectsToMap(this.level.enemies);
        this.thrownBottles.forEach(bottle => bottle.draw(this.ctx));

        this.ctx.translate(-this.camera_x, 0);
        this.statusBar.draw(this.ctx);
    }

    addObjectsToMap(objects) {
        objects.forEach(object => {
            this.addToMap(object);
        });
    }

    moveBackgroundObjectsBackIntoView() {
        let leftBorder = -this.camera_x;
        let rightBorder = leftBorder + this.canvas.width;
        let backgroundWidth = this.canvas.width;
        let backgroundLoopWidth = backgroundWidth * 4;

        this.level.backgroundObjects.forEach(backgroundObject => {
            if (backgroundObject.x + backgroundObject.width < leftBorder) {
                backgroundObject.x += backgroundLoopWidth;
            }

            if (backgroundObject.x > rightBorder) {
                backgroundObject.x -= backgroundLoopWidth;
            }
        });
    }

    moveCloudsBackIntoView() {
        let leftBorder = -this.camera_x;
        let rightBorder = leftBorder + this.canvas.width;
        let cloudWidth = this.canvas.width;
        let cloudLoopWidth = cloudWidth * 4;

        this.level.clouds.forEach(cloud => {
            if (cloud.x + cloud.width < leftBorder) {
                cloud.x += cloudLoopWidth;
            }

            if (cloud.x > rightBorder) {
                cloud.x -= cloudLoopWidth;
            }
        });
    }

    addToMap(movableObject) {
        if (movableObject.otherDirection) {
            this.flipImage(movableObject);
        }
        movableObject.draw(this.ctx);
        if (movableObject.otherDirection) {
            this.flipImageBack(movableObject);
        }

        if (World.showCollisionFrames &&
            !(movableObject instanceof BackgroundObject) &&
            !(movableObject instanceof Cloud)) {
            movableObject.drawFrame(this.ctx);
        }
    }

    flipImage(movableObject) {
        this.ctx.save();
        this.ctx.translate(movableObject.width, 0);
        this.ctx.scale(-1, 1);
        movableObject.x = movableObject.x * -1;
    }

    flipImageBack(movableObject) {
        movableObject.x = movableObject.x * -1;
        this.ctx.restore();
    }
};
