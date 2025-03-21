import * as fabric from "fabric";
import { CropZone } from '../../plugin/cropZone'; // 导入封装的 CropZone

export default defineComponent({
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const fabricCanvas = ref<fabric.Canvas | null>(null);
    let cropZone: CropZone | null = null;
    const imgInstanceRef = ref<fabric.Image | null>(null); // 存储 imgInstance
    const uploadedImageSrc = ref<string | null>(null); // 存储上传的图片路径

    // 全局存储图片和 CropZone 的属性
    const imageProperties = reactive({
      width: 0,
      height: 0,
      left: 0,
      top: 0,
    });

    const cropZoneProperties = reactive({
      width: 200,
      height: 200,
    });

    const sliderValues = reactive({
      brightness: 0, // 亮度
      contrast: 0,   // 对比度
      saturation: 0, // 饱和度
      sharpness: 0,  // 锐度/清晰度，
      exposure: 0,   // 曝光度
      highlights: 0, // 高光
      shadows: 0     // 阴影
    });

    // 定义全局容器宽高
    const containerWidth = 800;
    const containerHeight = 700;

    onMounted(() => {
      initializeCanvas('/src/assets/test.jpg');
    });

    const initializeCanvas = (imageSrc: string) => {
      if (canvasRef.value) {
        // 销毁现有的 CropZone 实例
        if (cropZone) {
          fabricCanvas.value?.remove(cropZone);
          cropZone.dispose(); // 销毁 CropZone 实例
          cropZone = null;
        }
        // 销毁现有的 fabric.Canvas 实例
        if (fabricCanvas.value) {
          fabricCanvas.value.dispose();
        }

        const imgElement = new Image();
        imgElement.src = imageSrc;
        imgElement.onload = () => {
          // 计算缩放比例
          const scale = Math.min(containerWidth / imgElement.width, containerHeight / imgElement.height);

          canvasRef.value!.width = imgElement.width * scale;
          canvasRef.value!.height = imgElement.height * scale;

          fabricCanvas.value = new fabric.Canvas(canvasRef.value);

          const imgInstance = new fabric.Image(imgElement, {
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false,
          });

          imgInstanceRef.value = imgInstance;

          // 更新图片属性
          imageProperties.width = imgElement.width * scale;
          imageProperties.height = imgElement.height * scale;
          imageProperties.left = imgInstance.left;
          imageProperties.top = imgInstance.top;
          fabricCanvas.value?.add(imgInstance);
          fabricCanvas.value?.renderAll();
        };
      }
    };

    const handleImageUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImageSrc.value = e.target?.result as string;
        initializeCanvas(uploadedImageSrc.value);
      };
      reader.readAsDataURL(file);
    };


    const showCropZone = () => {
      if (fabricCanvas.value && imgInstanceRef.value instanceof fabric.Image) {
        cropZone = new CropZone({
          left: imageProperties.left + (imageProperties.width - cropZoneProperties.width) / 2,
          top: imageProperties.top + (imageProperties.height - cropZoneProperties.height) / 2,
          width: cropZoneProperties.width,
          height: cropZoneProperties.height,
          fill: "rgba(0,0,0,0)",
          hasBorders: true,
          hasControls: true,
          selectable: true,
          lockScalingX: false,
          lockScalingY: false,
          cornerSize: 10,
          cornerStyle: 'circle',
        });

        cropZone.setControlsVisibility({
          mtr: false,
        });

        fabricCanvas.value.add(markRaw(cropZone));
        fabricCanvas.value.setActiveObject(cropZone); // 设置为选中状态
        fabricCanvas.value.renderAll();
      }
    };

    const resetCropZoneProperties = () => {
      cropZoneProperties.width = 200;
      cropZoneProperties.height = 200;
    };

    const hideCropZone = () => {
      if (fabricCanvas.value && cropZone) {
        fabricCanvas.value.remove(cropZone);
        cropZone = null;
        fabricCanvas.value.renderAll();
        resetCropZoneProperties();
      }
    };

    // 假设 fabric.js 支持这些滤镜，或者你已经实现了自定义滤镜
    const applyFilter = (filterType: string, value: number, index: number) => {
      if (imgInstanceRef.value) {
        try {
          let filter;
          switch (filterType) {
            case 'Brightness':
              filter = new fabric.filters.Brightness({ brightness: value / 200 });
              break;
            case 'Contrast':
              filter = new fabric.filters.Contrast({ contrast: value / 400 });
              break;
            case 'Saturation':
              filter = new fabric.filters.Saturation({ saturation: value / 100 });
              break;
            case 'Sharpness':
              filter = new fabric.filters.Sharpness({ sharpness: value / 100 });
              break;
            case 'Exposure':
              filter = new fabric.filters.Exposure({ exposure: value / 100 });
              break;
            case 'Highlights':
              filter = new fabric.filters.Highlights({ highlights: value / 100 });
              break;
            case 'Shadows':
              filter = new fabric.filters.Shadows({ shadows: value / 100 });
              break;
            default:
              return;
          }
          imgInstanceRef.value.filters[index] = filter;
          imgInstanceRef.value.applyFilters();
          fabricCanvas.value?.renderAll();
        } catch (error) {
          console.error(`Error applying ${filterType} filter:`, error);
        }
      }
    };

    watch(() => sliderValues.brightness, (newValue) => applyFilter('Brightness', newValue, 0));
    watch(() => sliderValues.contrast, (newValue) => applyFilter('Contrast', newValue, 1));
    watch(() => sliderValues.saturation, (newValue) => applyFilter('Saturation', newValue, 2));
    watch(() => sliderValues.sharpness, (newValue) => applyFilter('Sharpness', newValue, 3));
    watch(() => sliderValues.exposure, (newValue) => applyFilter('Exposure', newValue, 4));
    watch(() => sliderValues.highlights, (newValue) => applyFilter('Highlights', newValue, 5));
    watch(() => sliderValues.shadows, (newValue) => applyFilter('Shadows', newValue, 6));

    const downloadImage = () => {
      if (fabricCanvas.value) {
        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d');
        if (cropZone) {
          tempCanvas.width = cropZone.width;
          tempCanvas.height = cropZone.height;
          const { left, top, width, height } = cropZone
          if (tempCtx && imgInstanceRef.value) {
            hideCropZone()
            setTimeout(() => {
              const imgData = fabricCanvas.value.contextContainer.getImageData(
                left, top, width, height
              );
              tempCtx.putImageData(imgData, 0, 0);
              const dataURL = tempCanvas.toDataURL();
              const link = document.createElement('a');
              link.href = dataURL;
              link.download = cropZone ? 'cropped-image.png' : 'full-image.png';
              link.click();
            }, 1000);

          }
        } else {
          tempCanvas.width = fabricCanvas.value.width;
          tempCanvas.height = fabricCanvas.value.height;
          if (tempCtx && imgInstanceRef.value) {
            const imgData = fabricCanvas.value.contextContainer.getImageData(
              0,
              0,
              fabricCanvas.value.width,
              fabricCanvas.value.height
            );
            tempCtx.putImageData(imgData, 0, 0);
            const dataURL = tempCanvas.toDataURL();
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = cropZone ? 'cropped-image.png' : 'full-image.png';
            link.click();
          }
        }
      }
    }

    const resetAllProperties = () => {
      sliderValues.brightness = 0;
      sliderValues.contrast = 0;
      sliderValues.saturation = 0;
      sliderValues.sharpness = 0;
      sliderValues.exposure = 0;
      sliderValues.highlights = 0;
      sliderValues.shadows = 0;
    };

    return () => (
      <el-main class="h-full flex items-center justify-center gap-20">
        <div class="w-[300px]">
          <el-button type="primary" onClick={showCropZone}>剪裁</el-button>
          <el-button type="info" onClick={hideCropZone}>取消</el-button>
          <el-button type="warning" onClick={downloadImage}>下载</el-button>
          <el-button type="success" onClick={resetAllProperties}>重置</el-button>
          <div class="mt-4 mb-4">
            <el-upload
              accept="image/*"
              show-file-list={false}
              before-upload={(file) => {
                handleImageUpload(file);
                return false;
              }}
            >
              <el-button type="danger">上传图片</el-button>
            </el-upload>
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.brightness = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">亮度：{sliderValues.brightness}</span>
            <el-slider v-model={sliderValues.brightness} min={-100} max={100} />
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.contrast = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">对比度：{sliderValues.contrast}</span>
            <el-slider v-model={sliderValues.contrast} min={-100} max={100} />
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.saturation = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">饱和度：{sliderValues.saturation}</span>
            <el-slider v-model={sliderValues.saturation} min={-100} max={100} />
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.sharpness = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">锐度/清晰度：{sliderValues.sharpness}</span>
            <el-slider v-model={sliderValues.sharpness} min={-100} max={100} />
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.exposure = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">曝光度：{sliderValues.exposure}</span>
            <el-slider v-model={sliderValues.exposure} min={-100} max={100} />
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.highlights = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">高光：{sliderValues.highlights}</span>
            <el-slider v-model={sliderValues.highlights} min={-100} max={100} />
          </div>
          <div class="slider-demo-block">
            <el-icon onClick={() => sliderValues.shadows = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
            <span class="demonstration">阴影：{sliderValues.shadows}</span>
            <el-slider v-model={sliderValues.shadows} min={-100} max={100} />
          </div>
        </div>
        <div
          style={`border: 1px dashed #409eff; width: ${containerWidth}px; height: ${containerHeight}px;`}
          class="rounded-lg flex items-center justify-center"
        >
          <canvas ref={canvasRef}></canvas>
        </div>
      </el-main>
    );
  },
});


