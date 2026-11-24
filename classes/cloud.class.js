/** Moving cloud tile in the background. */
class Cloud extends MovableObject {
    x = 80;
    y= 0;
    height = 480;
    width = 720;
    speed = 60; //px pro Second

    /**
     * Sets the image and starting position of a cloud.
     * @param {string} imagePath - Relative path to the cloud image.
     * @param {number} x - Horizontal starting position in world coordinates.
     */
    constructor(imagePath, x) {
        super().loadImage(imagePath);
        this.x = x;
    }

    /**
     * Moves the cloud based on elapsed game time.
     * @param {number} deltaTime - Game time elapsed since the previous update, in seconds.
     */
    moveClouds(deltaTime) {
        this.x -= this.speed * deltaTime; // Adjust for frame rate
    }
}
