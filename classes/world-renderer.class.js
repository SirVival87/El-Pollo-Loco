class WorldRenderer {
    endScreens = {
        true: this.loadEndScreen('img/You won, you lost/You Won B.png'),
        false: this.loadEndScreen('img/You won, you lost/Game over A.png'),
    };

    /** Bindet den Zeichenkontext der Spielfläche. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /** Zeichnet die Welt mit Kameraversatz und anschließend die Statusanzeige. */
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

    /** Zeichnet die Objekte in ihrer vorgesehenen Ebenenreihenfolge. */
    drawScene(world) {
        const { level, character, bottleController } = world;
        this.drawObjects(level.backgroundObjects);
        this.drawObjects(level.clouds);
        level.bottles.forEach(bottle => bottle.draw(this.ctx));
        level.coins.forEach(coin => coin.draw(this.ctx));
        this.drawObject(character);
        this.drawObjects(level.enemies);
        bottleController.activeBottle?.draw(this.ctx);
    }

    /** Zeichnet die Objekte einer Ebene. */
    drawObjects(objects) {
        objects.forEach(object => this.drawObject(object));
    }

    /** Zeichnet das Objekt in seiner Blickrichtung und bei Bedarf seinen Kollisionsrahmen. */
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

    /** Spiegelt das Objekt horizontal innerhalb seines Bildrechtecks. */
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
    /** Lädt das Bild für einen Spielausgang. */
    loadEndScreen(path) {
        const screen = new DrawableObject();
        screen.loadImage(path);
        return screen;
    }

    /** Verdunkelt die Spielfläche und zeichnet das verfügbare Endbild. */
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

    /** Wählt zwischen Endbild und Ersatztext. */
    drawEndContent(screen, won, centerY) {
        const { naturalWidth, naturalHeight } = screen.img;
        if (naturalWidth > 0 && naturalHeight > 0) {
            this.drawEndImage(screen, won, centerY);
        } else {
            this.drawEndText(won, centerY);
        }
    }

    /** Skaliert und zentriert das Endbild auf der Spielfläche. */
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

    /** Zeigt den Spielausgang als Text an, falls das Bild fehlt. */
    drawEndText(won, centerY) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Boogaloo, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(won ? 'YOU WON!' : 'GAME OVER', this.canvas.width / 2, centerY);
    }
}
