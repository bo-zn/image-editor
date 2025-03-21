import * as fabric from 'fabric';

export class CropZone extends fabric.Rect {
    private imgInstance: fabric.Image | null = null;
    private lastScaleX: number = 1; // 添加属性来存储上一次的缩放比例
    private lastScaleY: number = 1; // 添加属性来存储上一次的缩放比例

    constructor(options: fabric.TOptions<fabric.Rect>, imgInstance: fabric.Image) {
        super({
            ...options,
        });
        this.imgInstance = imgInstance;
        this.on({
            moving: this._onMoving.bind(this),
            scaling: this._onScaling.bind(this),
        });
    }

    _onMoving(): void {
        if (this.imgInstance) {
            const imgBounds = this.imgInstance.getBoundingRect();
            const { height, width, left, top } = this;
            const maxX = this.canvas.width - imgBounds.left - width;
            const maxY = this.canvas.height - imgBounds.top - height;

            if (left < imgBounds.left)
                this.left = imgBounds.left
            if (top < imgBounds.top)
                this.top = imgBounds.top
            if (left > maxX)
                this.left = maxX
            if (top > maxY)
                this.top = maxY

        }
    }

    _onScaling(fEvent: { e: MouseEvent }): void {
        if (this.imgInstance) {
            const imgBounds = this.imgInstance.getBoundingRect();
            const minX = this.left;
            const minY = this.top;
            const maxX = this.left + this.width;
            const maxY = this.top + this.height;

            const pointer = this.canvas.getPointer(fEvent.e);
            const x = pointer.x;
            const y = pointer.y

            if (minX < imgBounds.left || maxX > imgBounds.left + imgBounds.width) {
                this.scaleX = this.lastScaleX || 1
            }

            if (minX < imgBounds.left) {
                this.left = imgBounds.left
            }

            if (minY < imgBounds.top || maxY > imgBounds.top + imgBounds.height) {
                this.scaleY = this.lastScaleY || 1
            }

            if (minY < imgBounds.top) {
                this.top = imgBounds.top
            }

            this.lastScaleX = this.scaleX;
            this.lastScaleY = this.scaleY;

            // this._updateCropZone(
            //     Math.min(this.left, x),
            //     Math.min(this.top, y),
            //     Math.max(this.left + this.width, x),
            //     Math.max(this.top + this.height, y)
            // );
        }
    }

    _updateCropZone(fromX: number, fromY: number, toX: number, toY: number): void {
        if (this.imgInstance) {
            const imgBounds = this.imgInstance.getBoundingRect();

            // 判断拖动方向
            const isRight = (toX > fromX);
            const isLeft = !isRight;
            const isDown = (toY > fromY);
            const isUp = !isDown;

            let leftX = Math.min(fromX, toX);
            let rightX = Math.max(fromX, toX);
            let topY = Math.min(fromY, toY);
            let bottomY = Math.max(fromY, toY);


            leftX = Math.max(imgBounds.left, leftX);
            rightX = Math.min(imgBounds.width + imgBounds.left, rightX);
            topY = Math.max(imgBounds.top, topY)
            bottomY = Math.min(imgBounds.height + imgBounds.top, bottomY);


            if (rightX - leftX < this.width) {
                if (isRight)
                    rightX = leftX + this.width;
                else
                    leftX = rightX - this.width;
            }
            if (bottomY - topY < this.height) {
                if (isDown)
                    bottomY = topY + this.height;
                else
                    topY = bottomY - this.height;
            }
            if (leftX < imgBounds.left) {
                rightX += Math.abs(leftX);
                leftX = imgBounds.left
            }

            if (rightX > imgBounds.width + imgBounds.left) {
                // Translate to the right
                leftX -= (rightX - (imgBounds.width + imgBounds.left));
                rightX = imgBounds.width + imgBounds.left;
            }

            if (topY < imgBounds.top) {

                bottomY += Math.abs(topY);
                topY = imgBounds.top
            }

            if (bottomY > imgBounds.height + imgBounds.top) {

                topY -= (bottomY - (imgBounds.height + imgBounds.top));
                bottomY = imgBounds.height + imgBounds.top;
            }

            // 更新裁剪区域的位置和尺寸
            this.set({
                left: leftX,
                top: topY,
                width: rightX - leftX,
                height: bottomY - topY
            });
        }
    }

    _render(ctx: CanvasRenderingContext2D): void {
        super._render(ctx);
        const dashWidth = 7;
        const flipX = this.flipX ? -1 : 1;
        const flipY = this.flipY ? -1 : 1;
        const scaleX = flipX / this.scaleX;
        const scaleY = flipY / this.scaleY;

        ctx.scale(scaleX, scaleY);

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';

        if (ctx.setLineDash !== undefined)
            ctx.setLineDash([dashWidth, dashWidth]);
        else if ((ctx as any).mozDash !== undefined)
            (ctx as any).mozDash = [dashWidth, dashWidth];

        ctx.strokeStyle = '#fff';
        this._renderBorders(ctx);
        this._renderGrid(ctx);

        ctx.lineDashOffset = dashWidth;
        ctx.strokeStyle = '#fff';
        this._renderBorders(ctx);
        this._renderGrid(ctx);

        ctx.scale(1 / scaleX, 1 / scaleY);
    }

    _renderBorders(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.stroke();
    }

    _renderGrid(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 1 / 3 * this.width, -this.height / 2);
        ctx.lineTo(-this.width / 2 + 1 / 3 * this.width, this.height / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 2 / 3 * this.width, -this.height / 2);
        ctx.lineTo(-this.width / 2 + 2 / 3 * this.width, this.height / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2 + 1 / 3 * this.height);
        ctx.lineTo(this.width / 2, -this.height / 2 + 1 / 3 * this.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2 + 2 / 3 * this.height);
        ctx.lineTo(this.width / 2, -this.height / 2 + 2 / 3 * this.height);
        ctx.stroke();
    }
}