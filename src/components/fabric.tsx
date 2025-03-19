import { defineComponent, onMounted, ref, markRaw } from "vue";
import * as fabric from "fabric";
import { CropZone } from "../plugin/cropZone"; // 导入封装的 CropZone

export default defineComponent({
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const fabricCanvas = ref<fabric.Canvas | null>(null);

    onMounted(() => {
      if (canvasRef.value) {
        fabricCanvas.value = new fabric.Canvas(canvasRef.value);
        const imgElement = new Image();
        imgElement.src = "/src/assets/test.jpg";
        imgElement.onload = () => {
          const scale = Math.min(
            canvasRef.value!.width / imgElement.width,
            canvasRef.value!.height / imgElement.height
          );
          const imgInstance = new fabric.FabricImage(imgElement, {
            left: (canvasRef.value!.width - imgElement.width * scale) / 2,
            top: (canvasRef.value!.height - imgElement.height * scale) / 2,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false,
            scaleX: scale,
            scaleY: scale,
          });
          fabricCanvas.value?.add(imgInstance);
          // 使用封装的 CropZone
          const cropZone = new CropZone({
            left: 100,
            top: 100,
            width: 200,
            height: 200,
            fill: "rgba(0,0,0,0)",
            hasBorders: true,
            hasControls: true, // 确保可以缩放
            selectable: true,
            lockScalingX: false, // 确保可以水平缩放
            lockScalingY: false, // 确保可以垂直缩放
            cornerSize: 10, // 设置控制点大小
            cornerStyle: 'circle', // 设置控制点样式为圆形
          });

          // 确保控制点可见
          cropZone.setControlsVisibility({
            mt: true, // top middle
            mb: true, // bottom middle
            ml: true, // middle left
            mr: true, // middle right
            bl: true, // bottom left
            br: true, // bottom right
            tl: true, // top left
            tr: true, // top right
            mtr: false // 移除旋转控制点
          });

          fabricCanvas.value?.add(markRaw(cropZone));
          // 限制 CropZone 不超过图片边界
          fabricCanvas.value?.on("object:moving", (e) => {
            const obj = e.target;
            if (obj === cropZone) {
              const imgBounds = imgInstance.getBoundingRect();
              const objBounds = obj.getBoundingRect();

              // 确保 CropZone 不超出左边界
              if (objBounds.left < imgBounds.left) {
                obj.left = imgBounds.left;
              }
              // 确保 CropZone 不超出上边界
              if (objBounds.top < imgBounds.top) {
                obj.top = imgBounds.top;
              }
              // 确保 CropZone 不超出右边界
              if (objBounds.left + objBounds.width > imgBounds.left + imgBounds.width) {
                obj.left = imgBounds.left + imgBounds.width - objBounds.width;
              }
              // 确保 CropZone 不超出下边界
              if (objBounds.top + objBounds.height > imgBounds.top + imgBounds.height) {
                obj.top = imgBounds.top + imgBounds.height - objBounds.height;
              }
            }
          });
          // 限制 CropZone 缩放不超过图片边界
          fabricCanvas.value?.on("object:scaling", (e) => {
            const obj = e.target;
            if (obj === cropZone) {
              const imgBounds = imgInstance.getBoundingRect();
              const scaleX = obj.scaleX;
              const scaleY = obj.scaleY;
              obj.set({
                scaleX: Math.min(
                  scaleX,
                  (imgBounds.left + imgBounds.width - obj.left) / obj.width
                ),
                scaleY: Math.min(
                  scaleY,
                  (imgBounds.top + imgBounds.height - obj.top) / obj.height
                ),
              });
              // 调用 updateGridSize 方法更新网格大小
              const newWidth = obj.width * obj.scaleX;
              const newHeight = obj.height * obj.scaleY;
              cropZone.updateGridSize(newWidth, newHeight);
            }
          });
          fabricCanvas.value?.renderAll();
        };
      }
    });

    return () => (
      <div class="h-full flex justify-center items-center">
        <canvas ref={canvasRef} width="800" height="600"></canvas>
      </div>
    );
  },
});
