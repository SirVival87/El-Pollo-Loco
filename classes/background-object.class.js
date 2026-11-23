/** Zeichenbare Kachel einer unbeweglichen Hintergrundebene. */
class BackgroundObject extends MovableObject {

    /**
     * Platziert eine Hintergrundkachel auf der horizontalen Weltachse.
     * @param {string} imagePath - Relativer Pfad zur Hintergrundgrafik.
     * @param {number} [x=0] - Linke Kante in Weltkoordinaten.
     */
    constructor(imagePath, x = 0) {
        super().loadImage(imagePath);
        this.x = x;
    }
}
