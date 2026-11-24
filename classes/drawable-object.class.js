/** Base class for canvas sprites, image caching, and collision rectangles. */
class DrawableObject {
    static imageCache = new Map();

    x = 0;
    y = 0;
    img;
    height = 480;
    width = 720;
    offset = { left: 0, top: 0, right: 0, bottom: 0 };

    /**
     * Returns the cached image, loading it on first access.
     * @param {string} path - Relative image path used as the cache key.
     * @returns {HTMLImageElement} Cached image, which may still be loading.
     */
    static getImage(path) {
        if (!DrawableObject.imageCache.has(path)) {
            const image = new Image();
            image.src = path;
            DrawableObject.imageCache.set(path, image);
        }
        return DrawableObject.imageCache.get(path);
    }

    /**
     * Starts loading the supplied images.
     * @param {string[]} paths - Image paths to load.
     */
    static preloadImages(paths) {
        paths.forEach(path => DrawableObject.getImage(path));
    }

    /**
     * Sets the sprite currently displayed by the object.
     * @param {string} path - Relative path to the current image.
     */
    loadImage(path) {
        this.img = DrawableObject.getImage(path);
    }

    /**
     * Draws the current image at its world position.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context for the game canvas.
     */
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * Calculates collision bounds for the current facing direction.
     * @param {CollisionOffsets} [offset=this.offset] - Hitbox insets within the sprite.
     * @returns {CollisionBounds} Hitbox edges in world coordinates.
     */
    getCollisionBounds(offset = this.offset) {
        const { left, top, right, bottom } = offset;
        return {
            left: this.x + (this.otherDirection ? right : left),
            top: this.y + top,
            right: this.x + this.width - (this.otherDirection ? left : right),
            bottom: this.y + this.height - bottom,
        };
    }

    /** @returns {CollisionBounds[]} Collision rectangles for the object in world coordinates. */
    getCollisionBoxes() {
        return [this.getCollisionBounds()];
    }

    /**
     * Draws every collision rectangle for debugging.
     * @param {CanvasRenderingContext2D} ctx - 2D rendering context for the game canvas.
     */
    drawFrame(ctx) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'blue';
        for (const { left, top, right, bottom } of this.getCollisionBoxes()) {
            ctx.rect(left, top, right - left, bottom - top);
        }
        ctx.stroke();
    }
}
