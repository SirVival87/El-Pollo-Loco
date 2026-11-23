class Cloud extends MovableObject {
    x = 80;
    y= 0;
    height = 480;
    width = 720;
    speed = 60; //px pro Second

    /** Setzt Bild und Startposition einer Wolke. */
    constructor(imagePath, x) {
        super().loadImage(imagePath);
        this.x = x;
    }

    /** Bewegt die Wolke anhand der verstrichenen Spielzeit. */
    moveClouds(deltaTime) {
        this.x -= this.speed * deltaTime; // Adjust for frame rate
    }
}
