class DrawableObject {
    static imageCache = new Map();

    x = 0;
    y = 0;
    img;
    height = 480;
    width = 720;
    offset = { left: 0, top: 0, right: 0, bottom: 0 };

    static getImage(path) {
        if (!DrawableObject.imageCache.has(path)) {
            const image = new Image();
            image.src = path;
            DrawableObject.imageCache.set(path, image);
        }
        return DrawableObject.imageCache.get(path);
    }

    static preloadImages(paths) {
        paths.forEach(path => DrawableObject.getImage(path));
    }

    loadImage(path) {
        this.img = DrawableObject.getImage(path);
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    getCollisionBounds() {
        const { left, top, right, bottom } = this.offset;
        return {
            left: this.x + (this.otherDirection ? right : left),
            top: this.y + top,
            right: this.x + this.width - (this.otherDirection ? left : right),
            bottom: this.y + this.height - bottom,
        };
    }

    drawFrame(ctx) {
        const { left, top, right, bottom } = this.getCollisionBounds();
        ctx.beginPath();
        ctx.lineWidth = '2';
        ctx.strokeStyle = 'blue';
        ctx.rect(left, top, right - left, bottom - top);
        ctx.stroke();
    }
}
