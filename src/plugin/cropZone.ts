import * as fabric from 'fabric';
import { clamp } from './utils';

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
        });;
    }

    _onMoving(): void {
        if (this.imgInstance) {
            const imgBounds = this.imgInstance.getBoundingRect();
            const { height, width, left, top } = this;
            const maxLeft = imgBounds.left + imgBounds.width - width;
            const maxTop = imgBounds.top + imgBounds.height - height;
            this.left = clamp(left, imgBounds.left, maxLeft);
            this.top = clamp(top, imgBounds.top, maxTop);
        }
    }

    _onScaling(): void {
        if (this.imgInstance) {
            const imgBounds = this.imgInstance.getBoundingRect();
            const minX = this.left;
            const minY = this.top;
            const maxX = this.left + this.width * this.scaleX;
            const maxY = this.top + this.height * this.scaleY;
            let preventScaling = false;

            // 检查是否超出边界
            if (minX < imgBounds.left || maxX > imgBounds.left + imgBounds.width || minY < imgBounds.top || maxY > imgBounds.top + imgBounds.height) {
                preventScaling = true;
            }

            if (preventScaling) {
                // 恢复到上一次的缩放比例
                this.scaleX = this.lastScaleX || 1;
                this.scaleY = this.lastScaleY || 1;
            } else {
                // 更新上一次的缩放比例
                this.lastScaleX = this.scaleX;
                this.lastScaleY = this.scaleY;
            }

            this.left = clamp(minX, imgBounds.left, imgBounds.left + imgBounds.width - this.width * this.scaleX);
            this.top = clamp(minY, imgBounds.top, imgBounds.top + imgBounds.height - this.height * this.scaleY);

            this.dispatchEvent('crop:update');
        }
    }

    dispatchEvent(eventName: string): void {
        const event = new Event(eventName, { bubbles: true, cancelable: true });
        this.canvas?.getElement().dispatchEvent(event);
    }


    _render(ctx: CanvasRenderingContext2D): void {
        super._render(ctx);
        const canvas = ctx.canvas;
        const dashWidth = 7;
        const flipX = this.flipX ? -1 : 1;
        const flipY = this.flipY ? -1 : 1;
        const scaleX = flipX / this.scaleX;
        const scaleY = flipY / this.scaleY;

        ctx.scale(scaleX, scaleY);

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        // this._renderOverlay(ctx);

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