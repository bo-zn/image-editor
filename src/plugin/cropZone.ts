import * as fabric from 'fabric';

export class CropZone extends fabric.Rect {

    private previousLeft: number = 0;
    private previousTop: number = 0;
    private previousScaleX: number = 0;
    private previousScaleY: number = 0;
    private previousWidth: number = 0;
    private previousHeight: number = 0;

    constructor(options: fabric.TOptions<fabric.Rect>) {
        super({
            ...options,
        });

        this.on({
            moving: this._onMoving.bind(this),
            scaling: this._onScaling.bind(this),
        });
    }

    _onMoving(): void {
        this.setCoords();
        const boundingRect = this.getBoundingRect();

        if (this.height >= this.canvas.height || this.width >= this.canvas.width) {
            return;
        }

        if (boundingRect.top <= 0 || boundingRect.left <= 0) {
            this.top = Math.max(this.top, this.top - boundingRect.top);
            this.left = Math.max(this.left, this.left - boundingRect.left);
        }

        if (boundingRect.top + boundingRect.height >= this.canvas.height || boundingRect.left + boundingRect.width >= this.canvas.width) {
            this.top = Math.min(this.top, this.canvas.height - boundingRect.height + this.top - boundingRect.top);
            this.left = Math.min(this.left, this.canvas.width - boundingRect.width + this.left - boundingRect.left);
        }
    }

    _onScaling(fEvent: { e: MouseEvent }): void {
        this.setCoords();
        const boundingRect = this.getBoundingRect();

        if ((boundingRect.width + boundingRect.left >= this.canvas.width) ||
            (boundingRect.height + boundingRect.top >= this.canvas.height) ||
            (boundingRect.left < 0) ||
            (boundingRect.top < 0)) {
            this.left = this.previousLeft;
            this.top = this.previousTop;
            this.scaleX = this.previousScaleX;
            this.scaleY = this.previousScaleY;
            this.width = this.previousWidth;
            this.height = this.previousHeight;
        } else {
            this.previousLeft = this.left;
            this.previousTop = this.top;
            this.previousScaleX = this.scaleX;
            this.previousScaleY = this.scaleY;
            this.previousWidth = this.width;
            this.previousHeight = this.height;
        }
    }

    _render(ctx: CanvasRenderingContext2D): void {
        super._render(ctx);
        const dashWidth = 7;
        const flipX = this.flipX ? -1 : 1;
        const flipY = this.flipY ? -1 : 1;
        const scaleX = flipX / this.scaleX;
        const scaleY = flipY / this.scaleY;

        // ctx.scale(scaleX, scaleY);

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