/** Basisklasse für Canvas-Bilder, Bildcache und Kollisionsrechtecke. */
class DrawableObject {
    static imageCache = new Map();

    x = 0;
    y = 0;
    img;
    height = 480;
    width = 720;
    offset = { left: 0, top: 0, right: 0, bottom: 0 };

    /**
     * Gibt das zwischengespeicherte Bild zurück oder lädt es beim ersten Zugriff.
     * @param {string} path - Relativer Bildpfad als Schlüssel im Cache.
     * @returns {HTMLImageElement} Zwischengespeichertes Bild, das gegebenenfalls noch lädt.
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
     * Startet das Laden der angegebenen Bilder.
     * @param {string[]} paths - Zu ladende Bildpfade.
     */
    static preloadImages(paths) {
        paths.forEach(path => DrawableObject.getImage(path));
    }

    /**
     * Setzt das aktuelle Bild des Objekts.
     * @param {string} path - Relativer Pfad zum aktuellen Bild.
     */
    loadImage(path) {
        this.img = DrawableObject.getImage(path);
    }

    /**
     * Zeichnet das aktuelle Bild an seiner Weltposition.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     */
    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    /**
     * Berechnet die Kollisionsgrenzen mit Berücksichtigung der Blickrichtung.
     * @returns {CollisionBounds} Kanten der Hitbox in Weltkoordinaten.
     */
    getCollisionBounds() {
        const { left, top, right, bottom } = this.offset;
        return {
            left: this.x + (this.otherDirection ? right : left),
            top: this.y + top,
            right: this.x + this.width - (this.otherDirection ? left : right),
            bottom: this.y + this.height - bottom,
        };
    }

    /**
     * Zeichnet den Kollisionsrahmen für die Fehlersuche.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     */
    drawFrame(ctx) {
        const { left, top, right, bottom } = this.getCollisionBounds();
        ctx.beginPath();
        ctx.lineWidth = '2';
        ctx.strokeStyle = 'blue';
        ctx.rect(left, top, right - left, bottom - top);
        ctx.stroke();
    }
}
