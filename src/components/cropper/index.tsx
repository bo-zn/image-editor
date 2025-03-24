import {
  getPixelRatio,
  getDotPosition,
  getDashPosition,
  checkSelectBoundary,
  getMousePosi,
  getCursorStyle,
  handleMouseInfo,
  getAnewXY,
} from "./util";

export default defineComponent({
  name: "mask",
  props: {
    size: {
      type: Object as () => { width: number; height: number },
      required: true,
    },
  },
  setup(props, { expose }) {
    const canvasRef = ref<HTMLCanvasElement>();
    const exposePosi = ref({})

    let ratio: number;
    let ctx: CanvasRenderingContext2D;
    let initSize = {} as {
      width: number;
      height: number;
    };

    let selectPosi = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    };

    let mousePosi: number[][] = [];
    let canChangeSelect: boolean = false;
    let initMousePosi: {
      x: number;
      y: number;
    };
    let cursorIndex: number;
    let tempCursorIndex: number | null = null;
    let resetSelect: boolean = false;

    /**
     * 计算canvas-size
     */
    const calcCanvasSize = () => {
      if (!canvasRef.value) {
        throw new Error("canvasRef not dom");
      }

      canvasRef.value.style.width = `${initSize.width}px`;
      canvasRef.value.style.height = `${initSize.height}px`;
      canvasRef.value.width = initSize.width * ratio;
      canvasRef.value.height = initSize.height * ratio;
      ctx.scale(ratio, ratio);
      mousePosi = [];
    };

    /**
     * 画蒙层
     */
    const drawCover = () => {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, initSize.width, initSize.height);
      ctx.globalCompositeOperation = "source-atop";
      ctx.restore();
    };

    /**
     * 绘画选择框
     * @param x
     * @param y
     * @param w
     * @param h
     */
    const drawSelect = (x: number, y: number, w: number, h: number) => {
      ctx.clearRect(0, 0, initSize.width, initSize.height);
      drawCover();
      ctx.save();
      ctx.clearRect(x, y, w, h);
      ctx.strokeStyle = "#5696f8";
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#5696f8";
      const dots = getDotPosition(x, y, w, h);
      //@ts-ignore
      dots.map((v) => ctx.fillRect(...v));

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, .75)";
      const dashs = getDashPosition(x, y, w, h);
      dashs.map((v) => {
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(v[0], v[1]);
        ctx.lineTo(v[2], v[3]);
        ctx.closePath();
        ctx.stroke();
        return null;
      });

      ctx.restore();

      mousePosi = getMousePosi(x, y, w, h);
      mousePosi.push([selectPosi.x, selectPosi.y, selectPosi.w, selectPosi.h]);

      exposePosi.value = selectPosi
    };

    /**
     * 判断x,y是否在select路径上
     * @param pathX
     * @param pathY
     */
    const checkInPath = (pathX: number, pathY: number, rectPosi: number[]) => {
      ctx.beginPath();
      // @ts-ignore
      ctx.rect(...rectPosi);
      const result = ctx.isPointInPath(pathX, pathY);
      ctx.closePath();
      return result;
    };

    /**
     * 鼠标滑动事件
     * @param e
     */
    const mouseMove = (e: MouseEvent) => {
      if (!ctx || !canvasRef.value) {
        return;
      }

      const { offsetX, offsetY } = e;
      const pathX = offsetX * ratio;
      const pathY = offsetY * ratio;
      let cursor = "crosshair";
      cursorIndex = 9;

      for (let i = 0; i < mousePosi.length; i++) {
        if (checkInPath(pathX, pathY, mousePosi[i])) {
          cursor = getCursorStyle(i);
          cursorIndex = i;
          break;
        }
      }

      canvasRef.value.style.cursor = cursor;

      if (!canChangeSelect) {
        return;
      }

      if (resetSelect) {
        selectPosi = {
          x: initMousePosi.x,
          y: initMousePosi.y,
          w: 4,
          h: 4,
        };
        tempCursorIndex = 2;
        resetSelect = false;
      }

      const distanceX = offsetX - initMousePosi.x;
      const distanceY = offsetY - initMousePosi.y;

      selectPosi = handleMouseInfo(
        tempCursorIndex !== null ? tempCursorIndex : cursorIndex,
        selectPosi,
        { x: distanceX, y: distanceY }
      );
      selectPosi = checkSelectBoundary(
        initSize.width,
        initSize.height,
        selectPosi
      );

      drawSelect(selectPosi.x, selectPosi.y, selectPosi.w, selectPosi.h);

      initMousePosi = {
        x: offsetX,
        y: offsetY,
      };

      if (tempCursorIndex === null) {
        tempCursorIndex = cursorIndex;
      }
    };

    /**
     * mouseDown事件
     * @param e
     */
    const mouseDown = (e: MouseEvent) => {
      if (cursorIndex === 9) {
        resetSelect = true;
      }

      canChangeSelect = true;
      initMousePosi = {
        x: e.offsetX,
        y: e.offsetY,
      };
    };

    /**
     * 移动取消
     */
    const mouseUp = async () => {
      if (selectPosi.w < 0 || selectPosi.h < 0) {
        selectPosi = getAnewXY(selectPosi);
        const { x, y, w, h } = selectPosi;
        mousePosi = getMousePosi(x, y, w, h);
      }

      canChangeSelect = false;
      tempCursorIndex = null;
    };

    watch(
      () => props.size,
      (newVal) => {
        if (newVal && canvasRef.value) {
          ctx = canvasRef.value.getContext("2d") as CanvasRenderingContext2D;
          ratio = getPixelRatio(ctx);

          initSize = {
            width: props.size.width,
            height: props.size.height,
          };
          calcCanvasSize();
        }

      }
    );

    expose({ exposePosi })

    return () => (
      <div>
        <canvas
          ref={canvasRef}
          onMouseup={mouseUp}
          onMousemove={mouseMove}
          onMousedown={mouseDown}
        />
      </div>
    );
  },
});
