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
      left: 0,
      top: 0,
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
        fabricCanvas.value = new fabric.Canvas(canvasRef.value);
        const imgElement = new Image();
        imgElement.src = imageSrc;
        imgElement.onload = () => {
          const scale = Math.min(
            canvasRef.value!.width / imgElement.width,
            canvasRef.value!.height / imgElement.height
          );
          const imgInstance = new fabric.Image(imgElement, { // 使用 fabric.Image
            left: (canvasRef.value!.width - imgElement.width * scale) / 2,
            top: (canvasRef.value!.height - imgElement.height * scale) / 2,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false,
            scaleX: scale,
            scaleY: scale,
          });

          imgInstanceRef.value = imgInstance; // 存储 imgInstance

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
      if (fabricCanvas.value && imgInstanceRef.value instanceof fabric.Image) { // 确保 imgInstanceRef.value 是 fabric.Image 类型
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
        }, imgInstanceRef.value); // 传入图片实例
    
        // 重置缩放状态
        cropZone.set({
          scaleX: 1,
          scaleY: 1,
        });
    
        fabricCanvas.value.add(markRaw(cropZone));
        fabricCanvas.value.setActiveObject(cropZone); // 设置为选中状态
        fabricCanvas.value.renderAll();
      }
    };

    const resetCropZoneProperties = () => {
      cropZoneProperties.width = 200;
      cropZoneProperties.height = 200;
      cropZoneProperties.left = 0;
      cropZoneProperties.top = 0;
    };

    const hideCropZone = () => {
      if (fabricCanvas.value && cropZone) {
        fabricCanvas.value.remove(cropZone);
        cropZone = null;
        fabricCanvas.value.renderAll();

        // 初始化 cropZoneProperties
        resetCropZoneProperties(); // 使用重置函数
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



    // 在模板中添加新的滑块
    const downloadImage = () => {
      if (fabricCanvas.value) {
        const dataURL = fabricCanvas.value.toDataURL();
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'edited-image.png';
        link.click();
      }
    };

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
        <div style="border: 1px dashed #409eff" class="w-[800px] h-[700px] rounded-lg flex items-center justify-center">
          <canvas ref={canvasRef} width="800" height="600"></canvas>
        </div>
      </el-main>
    );
  },
});


