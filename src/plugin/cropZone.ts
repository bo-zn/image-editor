import * as fabric from 'fabric';

export class CropZone extends fabric.Rect {

    private lastScaleX: number = 1; // 添加属性来存储上一次的缩放比例
    private lastScaleY: number = 1; // 添加属性来存储上一次的缩放比例

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
        const { height, width, left, top } = this;
        const maxX = this.canvas.width - width;
        const maxY = this.canvas.height - height;
        if (left < 0)
            this.left = 0
        if (top < 0)
            this.top = 0
        if (left > maxX)
            this.left = maxX
        if (top > maxY)
            this.top = maxY
    }

    _onScaling(fEvent: { e: MouseEvent }): void { }

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