import * as fabric from 'fabric';

export class CropZone extends fabric.Rect {
    constructor(options) {
        super({
            ...options,
        });
    }

    updateGridSize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        this.dirty = true; // 标记为需要重新渲染
        this.canvas && this.canvas.requestRenderAll(); // 请求重新渲染
    }

    _render(ctx) {
        super._render(ctx);
        var canvas = ctx.canvas;
        var dashWidth = 7;
        var flipX = this.flipX ? -1 : 1;
        var flipY = this.flipY ? -1 : 1;
        var scaleX = flipX / this.scaleX;
        var scaleY = flipY / this.scaleY;

        ctx.scale(scaleX, scaleY);

        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        // this._renderOverlay(ctx);

        if (ctx.setLineDash !== undefined)
            ctx.setLineDash([dashWidth, dashWidth]);
        else if (ctx.mozDash !== undefined)
            ctx.mozDash = [dashWidth, dashWidth];

        ctx.strokeStyle = '#fff';
        this._renderBorders(ctx);
        this._renderGrid(ctx);

        ctx.lineDashOffset = dashWidth;
        ctx.strokeStyle = '#fff';
        this._renderBorders(ctx);
        this._renderGrid(ctx);

        ctx.scale(1 / scaleX, 1 / scaleY);
    }

    _renderBorders(ctx) {
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.stroke();
    }

    _renderGrid(ctx) {
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