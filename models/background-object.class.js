class BackgroundObject extends MovableObject {

    constructor(imagePath, x = 0) {
        super().loadImage(imagePath);
        this.x = x;
    }
}
