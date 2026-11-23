class DrawableObject {
    x = 0;
    y = 0;
    img;
    height = 480;
    width = 720;
    characterImageCache = {};
    offset = { left: 0, top: 0, right: 0, bottom: 0 };

    loadImagesArray(arr) {
        arr.forEach(path => {
            let img = new Image();
            img.src = path;
            this.characterImageCache[path] = img;
        });

    }


    loadImage(path) {
        this.img = new Image();
        this.img.src = path;
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
