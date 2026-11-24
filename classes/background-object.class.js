/** Drawable tile in a stationary background layer. */
class BackgroundObject extends MovableObject {

    /**
     * Positions a background tile along the horizontal world axis.
     * @param {string} imagePath - Relative path to the background image.
     * @param {number} [x=0] - Left edge in world coordinates.
     */
    constructor(imagePath, x = 0) {
        super().loadImage(imagePath);
        this.x = x;
    }
}
