/** Renders the game world, HUD, and end screens. */
class WorldRenderer {
    endScreens = {
        true: this.loadEndScreen('img/You won, you lost/You Won B.png'),
        false: this.loadEndScreen('img/You won, you lost/Game over A.png'),
    };

    /**
     * Binds the rendering context for the game canvas.
     * @param {HTMLCanvasElement} canvas - Canvas used to draw the game world.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Draws the world with a camera offset, then draws the HUD.
     * @param {World} world - Current game world containing the objects to draw.
     */
    render(world) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        try {
            this.ctx.translate(world.cameraX, 0);
            this.drawScene(world);
        } finally {
            this.ctx.restore();
        }
        world.statusBar.draw(this.ctx);
    }

    /**
     * Draws the objects in their intended layer order.
     * @param {World} world - Current game world containing the objects to draw.
     */
    drawScene(world) {
        const { level, character, boss, bottleController } = world;
        this.drawObjects(level.backgroundObjects);
        this.drawObjects(level.clouds);
        level.bottles.forEach(bottle => bottle.draw(this.ctx));
        level.coins.forEach(coin => coin.draw(this.ctx));
        if (boss) this.drawObject(boss);
        this.drawObject(character);
        level.enemies.forEach(enemy => {
            if (enemy !== boss) this.drawObject(enemy);
        });
        bottleController.activeBottle?.draw(this.ctx);
    }

    /**
     * Draws the objects in one layer.
     * @param {DrawableObject[]} objects - Objects in draw order.
     */
    drawObjects(objects) {
        objects.forEach(object => this.drawObject(object));
    }

    /**
     * Draws the object in its facing direction and optionally shows its hitboxes.
     * @param {DrawableObject} object - Object to draw.
     */
    drawObject(object) {
        if (object.otherDirection) {
            this.drawMirrored(object);
        } else {
            object.draw(this.ctx);
        }

        if (World.showCollisionFrames && !(object instanceof BackgroundObject) && !(object instanceof Cloud)) {
            object.drawFrame(this.ctx);
        }
    }

    /**
     * Mirrors the object horizontally within its sprite bounds.
     * @param {DrawableObject} object - Object to mirror horizontally.
     */
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
    /**
     * Loads the image for a round outcome.
     * @param {string} path - Relative path to the end-screen image.
     * @returns {DrawableObject} Drawable object containing the end-screen image.
     */
    loadEndScreen(path) {
        const screen = new DrawableObject();
        screen.loadImage(path);
        return screen;
    }

    /**
     * Dims the canvas and displays the end screen when it is ready.
     * @param {boolean} won - Whether the round was won.
     * @returns {boolean} Whether the end screen was drawn as an image or fallback text.
     */
    drawEndScreen(won) {
        const screen = this.endScreens[won];
        if (!screen.img.complete) return false;

        const { width, height } = this.canvas;
        const centerY = height * (won ? 0.5 : 0.425);
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.ctx.fillRect(0, 0, width, height);
        this.drawEndContent(screen, won, centerY);
        this.ctx.restore();
        return true;
    }

    /**
     * Chooses between the end image and fallback text.
     * @param {DrawableObject} screen - Drawable object containing the end-screen image.
     * @param {boolean} won - Whether the round was won.
     * @param {number} centerY - Vertical center on the canvas in pixels.
     */
    drawEndContent(screen, won, centerY) {
        const { naturalWidth, naturalHeight } = screen.img;
        if (naturalWidth > 0 && naturalHeight > 0) {
            this.drawEndImage(screen, won, centerY);
        } else {
            this.drawEndText(won, centerY);
        }
    }

    /**
     * Scales and centers the end image on the canvas.
     * @param {DrawableObject} screen - Drawable object containing the end-screen image.
     * @param {boolean} won - Whether the round was won.
     * @param {number} centerY - Vertical center on the canvas in pixels.
     */
    drawEndImage(screen, won, centerY) {
        const { naturalWidth, naturalHeight } = screen.img;
        const { width, height } = this.canvas;
        const maxHeight = height * (won ? 0.65 : 0.58);
        const scale = Math.min(width * 0.75 / naturalWidth, maxHeight / naturalHeight);
        screen.width = naturalWidth * scale;
        screen.height = naturalHeight * scale;
        screen.x = (width - screen.width) / 2;
        screen.y = centerY - screen.height / 2;
        screen.draw(this.ctx);
    }

    /**
     * Displays the round outcome as text if the image is unavailable.
     * @param {boolean} won - Whether the round was won.
     * @param {number} centerY - Vertical center on the canvas in pixels.
     */
    drawEndText(won, centerY) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Boogaloo, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(won ? 'YOU WON!' : 'GAME OVER', this.canvas.width / 2, centerY);
    }
}
