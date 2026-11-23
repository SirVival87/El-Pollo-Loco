/** Zeichnet Pepes Lebensbalken und die Zahl eingesammelter Objekte. */
class StatusBar extends DrawableObject {
    x = 16;
    y = 10;
    width = 180;
    height = 48;
    emptyHealthPath = 'img/7_statusbars/1_statusbar/2_statusbar_health/green/0.png';
    fullHealthPath = 'img/7_statusbars/1_statusbar/2_statusbar_health/green/100.png';
    bottleIcon = 'img/7_statusbars/3_icons/icon_salsa_bottle.png';
    coinIcon = 'img/7_statusbars/3_icons/icon_coin.png';

    /**
     * Bereitet die Symbole und den Lebensbalken für Pepe vor.
     * @param {Character} character - Pepe als Quelle für Energie, Flaschen und Münzen.
     */
    constructor(character) {
        super();
        this.character = character;
        this.loadImage(this.emptyHealthPath);
        DrawableObject.preloadImages([this.fullHealthPath, this.bottleIcon, this.coinIcon]);
        document.fonts.load('32px Boogaloo');
    }

    /**
     * Zeichnet den Lebensbalken und beide Sammelzähler.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     */
    draw(ctx) {
        this.drawHealth(ctx);

        ctx.save();
        ctx.font = '32px Boogaloo, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 3;

        const nextX = this.drawCounter(ctx, this.bottleIcon, this.character.bottleCount, this.x + this.width - 5);
        this.drawCounter(ctx, this.coinIcon, this.character.coinCount, nextX);
        ctx.restore();
    }

    /**
     * Zeichnet den Grundbalken und berechnet den aktuellen Füllstand.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     */
    drawHealth(ctx) {
        if (this.img.naturalWidth === 0) return;
        super.draw(ctx);

        const full = DrawableObject.getImage(this.fullHealthPath);
        const healthRatio = Math.max(0, Math.min(1, this.character.energy / this.character.maxEnergy));
        if (full.naturalWidth > 0 && healthRatio > 0) this.drawHealthFill(ctx, full, healthRatio);
    }

    /**
     * Zeichnet den zum Füllstand passenden Ausschnitt der Balkengrafik.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     * @param {HTMLImageElement} full - Grafik des vollständig gefüllten Lebensbalkens.
     * @param {number} healthRatio - Lebensanteil zwischen 0 und 1.
     */
    drawHealthFill(ctx, full, healthRatio) {
        // Horizontal bounds of the fill area in the original PNG.
        const fillLeft = 79;
        const fillRight = 586;
        const sourceWidth = (fillRight - fillLeft) * healthRatio;
        const scale = this.width / full.naturalWidth;
        ctx.drawImage(
            full,
            fillLeft, 0, sourceWidth, full.naturalHeight,
            this.x + fillLeft * scale, this.y, sourceWidth * scale, this.height
        );
    }

    /**
     * Zeichnet Symbol und Anzahl und gibt die Position des nächsten Zählers zurück.
     * @param {CanvasRenderingContext2D} ctx - 2D-Zeichenkontext der Spielfläche.
     * @param {string} iconPath - Pfad zum Symbol des Sammelobjekts.
     * @param {number} count - Anzahl gesammelter Objekte.
     * @param {number} x - Horizontale Startposition auf dem Canvas.
     * @returns {number} X-Position für den nachfolgenden Zähler in Canvas-Pixeln.
     */
    drawCounter(ctx, iconPath, count, x) {
        const icon = DrawableObject.getImage(iconPath);
        if (icon.naturalWidth > 0) {
            ctx.drawImage(icon, x, this.y + 3, 44, 44);
        }

        const label = String(count);
        ctx.fillText(label, x + 38, this.y + 28);
        return x + 38 + ctx.measureText(label).width + 12;
    }
}
