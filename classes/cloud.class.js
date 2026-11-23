/** Bewegliche Wolkenkachel im Hintergrund. */
class Cloud extends MovableObject {
    x = 80;
    y= 0;
    height = 480;
    width = 720;
    speed = 60; //px pro Second

    /**
     * Setzt Bild und Startposition einer Wolke.
     * @param {string} imagePath - Relativer Pfad zum Wolkenbild.
     * @param {number} x - Horizontale Startposition in Weltkoordinaten.
     */
    constructor(imagePath, x) {
        super().loadImage(imagePath);
        this.x = x;
    }

    /**
     * Bewegt die Wolke anhand der verstrichenen Spielzeit.
     * @param {number} deltaTime - Verstrichene Spielzeit seit dem letzten Schritt in Sekunden.
     */
    moveClouds(deltaTime) {
        this.x -= this.speed * deltaTime; // Adjust for frame rate
    }
}
