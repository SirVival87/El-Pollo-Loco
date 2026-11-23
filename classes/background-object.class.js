class BackgroundObject extends MovableObject {

    /** Platziert eine Hintergrundkachel auf der horizontalen Weltachse. */
    constructor(imagePath, x = 0) {
        super().loadImage(imagePath);
        this.x = x;
    }
}
