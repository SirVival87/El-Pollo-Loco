class Cloud extends MovableObject {
    x = 80;
    y= 0;
    height = 480;
    width = 720;
    speed = 60; //px pro Second

    constructor(imagePath, x) {
        super().loadImage(imagePath);
        this.x = x;
    }

    moveClouds(deltaTime) {
        this.x -= this.speed * deltaTime; // Adjust for frame rate
    }
}
