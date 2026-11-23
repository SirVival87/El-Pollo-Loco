/** Zeichnet die Spielwelt, die Statusanzeige und die Endbildschirme. */
class WorldRenderer {
    endScreens = {
        true: this.loadEndScreen('img/You won, you lost/You Won B.png'),
        false: this.loadEndScreen('img/You won, you lost/Game over A.png'),
    };

    /**
     * Bindet den Zeichenkontext der Spielfläche.
     * @param {HTMLCanvasElement} canvas - Leinwand der Spielwelt.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Zeichnet die Welt mit Kameraversatz und anschließend die Statusanzeige.
     * @param {World} world - Aktuelle Spielwelt mit den zu zeichnenden Objekten.
     */
    render(world) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        try {
            this.ctx.translate(world.cameraX, 0);
            this.drawScene(world);
        } finally {
            this.ctx.restore();
        }
        world.statusBar.draw(this.ctx);
    }

    /**
     * Zeichnet die Objekte in ihrer vorgesehenen Ebenenreihenfolge.
     * @param {World} world - Aktuelle Spielwelt mit den zu zeichnenden Objekten.
     */
    drawScene(world) {
        const { level, character, boss, bottleController } = world;
        this.drawObjects(level.backgroundObjects);
        this.drawObjects(level.clouds);
        level.bottles.forEach(bottle => bottle.draw(this.ctx));
        level.coins.forEach(coin => coin.draw(this.ctx));
        if (boss) this.drawObject(boss);
        this.drawObject(character);
        level.enemies.forEach(enemy => {
            if (enemy !== boss) this.drawObject(enemy);
        });
        bottleController.activeBottle?.draw(this.ctx);
    }

    /**
     * Zeichnet die Objekte einer Ebene.
     * @param {DrawableObject[]} objects - Objekte in Zeichenreihenfolge.
     */
    drawObjects(objects) {
        objects.forEach(object => this.drawObject(object));
    }

    /**
     * Zeichnet das Objekt in seiner Blickrichtung und bei Bedarf seinen Kollisionsrahmen.
     * @param {DrawableObject} object - Zu zeichnendes Objekt.
     */
    drawObject(object) {
        if (object.otherDirection) {
            this.drawMirrored(object);
        } else {
            object.draw(this.ctx);
        }

        if (World.showCollisionFrames && !(object instanceof BackgroundObject) && !(object instanceof Cloud)) {
            object.drawFrame(this.ctx);
        }
    }

    /**
     * Spiegelt das Objekt horizontal innerhalb seines Bildrechtecks.
     * @param {DrawableObject} object - Horizontal zu spiegelndes Objekt.
     */
    drawMirrored(object) {
        this.ctx.save();
        try {
            this.ctx.translate(2 * object.x + object.width, 0);
            this.ctx.scale(-1, 1);
            object.draw(this.ctx);
        } finally {
            this.ctx.restore();
        }
    }
    /**
     * Lädt das Bild für einen Spielausgang.
     * @param {string} path - Relativer Pfad zur Endbildschirmgrafik.
     * @returns {DrawableObject} Zeichenobjekt mit der Endbildschirmgrafik.
     */
    loadEndScreen(path) {
        const screen = new DrawableObject();
        screen.loadImage(path);
        return screen;
    }

    /**
     * Verdunkelt die Spielfläche und zeichnet das verfügbare Endbild.
     * @param {boolean} won - Ob die Runde gewonnen wurde.
     * @returns {boolean} Ob der Endbildschirm als Bild oder Ersatztext gezeichnet wurde.
     */
    drawEndScreen(won) {
        const screen = this.endScreens[won];
        if (!screen.img.complete) return false;

        const { width, height } = this.canvas;
        const centerY = height * (won ? 0.5 : 0.425);
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.ctx.fillRect(0, 0, width, height);
        this.drawEndContent(screen, won, centerY);
        this.ctx.restore();
        return true;
    }

    /**
     * Wählt zwischen Endbild und Ersatztext.
     * @param {DrawableObject} screen - Zeichenobjekt mit der Endbildschirmgrafik.
     * @param {boolean} won - Ob die Runde gewonnen wurde.
     * @param {number} centerY - Vertikaler Mittelpunkt auf dem Canvas in Pixeln.
     */
    drawEndContent(screen, won, centerY) {
        const { naturalWidth, naturalHeight } = screen.img;
        if (naturalWidth > 0 && naturalHeight > 0) {
            this.drawEndImage(screen, won, centerY);
        } else {
            this.drawEndText(won, centerY);
        }
    }

    /**
     * Skaliert und zentriert das Endbild auf der Spielfläche.
     * @param {DrawableObject} screen - Zeichenobjekt mit der Endbildschirmgrafik.
     * @param {boolean} won - Ob die Runde gewonnen wurde.
     * @param {number} centerY - Vertikaler Mittelpunkt auf dem Canvas in Pixeln.
     */
    drawEndImage(screen, won, centerY) {
        const { naturalWidth, naturalHeight } = screen.img;
        const { width, height } = this.canvas;
        const maxHeight = height * (won ? 0.65 : 0.58);
        const scale = Math.min(width * 0.75 / naturalWidth, maxHeight / naturalHeight);
        screen.width = naturalWidth * scale;
        screen.height = naturalHeight * scale;
        screen.x = (width - screen.width) / 2;
        screen.y = centerY - screen.height / 2;
        screen.draw(this.ctx);
    }

    /**
     * Zeigt den Spielausgang als Text an, falls das Bild fehlt.
     * @param {boolean} won - Ob die Runde gewonnen wurde.
     * @param {number} centerY - Vertikaler Mittelpunkt auf dem Canvas in Pixeln.
     */
    drawEndText(won, centerY) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Boogaloo, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(won ? 'YOU WON!' : 'GAME OVER', this.canvas.width / 2, centerY);
    }
}
