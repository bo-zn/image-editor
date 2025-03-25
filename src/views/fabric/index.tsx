import * as fabric from "fabric";
import Cropper from '@/components/cropper'
import { debounce } from 'lodash';

export default defineComponent({
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const cropperRef = ref(null);
    const fabricCanvas = ref<fabric.Canvas | null>(null);
    const imgInstanceRef = ref<fabric.Image | null>(null);
    const uploadedImageSrc = ref<string | null>(null);
    const showCropper = ref<boolean>(true);

    const sliderConfigs = [
      { label: '亮度', key: 'brightness' },
      { label: '对比度', key: 'contrast' },
      { label: '饱和度', key: 'saturation' },
      { label: '锐度/清晰度', key: 'sharpness' },
      { label: '曝光度', key: 'exposure' },
      { label: '高光', key: 'highlights' },
      { label: '阴影', key: 'shadows' },
    ];

    const containerSize = {
      width: 600,
      height: 600
    };

    const imageProperties = reactive({
      width: 0,
      height: 0,
      left: 0,
      top: 0,
    });

    const sliderValues = reactive({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0
    });

    onMounted(() => {
      initializeCanvas('/src/assets/test.jpg');
    });

    const initializeCanvas = (imageSrc: string) => {
      if (canvasRef.value) {
        // 销毁现有的 fabric.Canvas 实例
        if (fabricCanvas.value) {
          fabricCanvas.value.dispose();
        }

        const imgElement = new Image();
        imgElement.src = imageSrc;
        imgElement.onload = () => {
          const scale = Math.min(containerSize.width / imgElement.width, containerSize.height / imgElement.height);

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

    // 假设 fabric.js 支持这些滤镜，或者你已经实现了自定义滤镜
    const applyFilter = (filterType: string, value: number, index: number) => {
      if (imgInstanceRef.value) {
        try {
          let filter;
          switch (filterType) {
            case 'Brightness':
              filter = new fabric.filters.Brightness({ brightness: value / 2 });
              break;
            case 'Contrast':
              filter = new fabric.filters.Contrast({ contrast: value / 4 });
              break;
            case 'Saturation':
              filter = new fabric.filters.Saturation({ saturation: value });
              break;
            case 'Sharpness':
              const sharpenMatrix = [
                0, -1 * value, 0,
                -1 * value, 1 + 4 * value, -1 * value,
                0, -1 * value, 0
              ];
              filter = new fabric.filters.Convolute({ matrix: sharpenMatrix });
              break;
            case 'Exposure':
              const gammaValue = value > 0 ? 6 + (value) : 1 / (1 - value);
              console.log(gammaValue)
              filter = new fabric.filters.Gamma({
                gamma: [gammaValue, gammaValue, gammaValue]
              });
              break;
            case 'Highlights':
              filter = new fabric.filters.Highlights({ highlights: value });
              break;
            case 'Shadows':
              filter = new fabric.filters.Shadows({ shadows: value });
              break;
            default:
              return;
          }
          if (filter) {
            imgInstanceRef.value.filters[index] = filter;
            imgInstanceRef.value.applyFilters();
            fabricCanvas.value?.renderAll();
          }
        } catch (error) {
          console.error(`Error applying ${filterType} filter:`, error);
        }
      }
    };

    const filterTypes = ['Brightness', 'Contrast', 'Saturation', 'Sharpness', 'Exposure', 'Highlights', 'Shadows'];

    const applyFilterDebounced = debounce(applyFilter, 0);

    filterTypes.forEach((type, index) => {
      watch(() => sliderValues[type.toLowerCase()], (newValue) => applyFilterDebounced(type, newValue / 100, index));
    });


    const downloadImage = () => {
      if (!fabricCanvas.value) return
      let tempCanvas = document.createElement('canvas');
      let tempCtx = tempCanvas.getContext('2d');
      let top = 0
      let left = 0
      if (showCropper.value) {
        tempCanvas.width = fabricCanvas.value.width;
        tempCanvas.height = fabricCanvas.value.height;
      } else {
        if (!cropperRef.value?.exposePosi) return
        tempCanvas.width = cropperRef.value.exposePosi.w;
        tempCanvas.height = cropperRef.value.exposePosi.h;
        top = cropperRef.value.exposePosi.x
        left = cropperRef.value.exposePosi.y
      }
      if (tempCtx && imgInstanceRef.value) {
        const imgData = fabricCanvas.value.contextContainer.getImageData(
          top,
          left,
          tempCanvas.width,
          tempCanvas.height
        );
        tempCtx.putImageData(imgData, 0, 0);
        const dataURL = tempCanvas.toDataURL();
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'image.png'
        link.click();
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
          {
            showCropper.value ?
              <el-button type="primary" onClick={() => showCropper.value = false}>剪裁</el-button> :
              <el-button type="info" onClick={() => showCropper.value = true}>取消剪裁</el-button>
          }
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
          {sliderConfigs.map(({ label, key }) => (
            <div class="slider-demo-block" key={key}>
              <el-icon onClick={() => sliderValues[key] = 0} class="reset-icon mr-4 cursor-pointer">🔄</el-icon>
              <span class="demonstration">{label}：{sliderValues[key]}</span>
              <el-slider v-model={sliderValues[key]} min={-100} max={100} />
            </div>
          ))}
        </div>
        <div
          style={`border: 1px dashed #409eff; width: ${containerSize.width}px; height: ${containerSize.height}px;`}
          class="rounded-lg flex items-center justify-center relative"
        >
          <canvas ref={canvasRef}></canvas>
          <Cropper
            ref={cropperRef}
            v-show={!showCropper.value}
            class="absolute rounded-lg flex items-center justify-center"
            size={{ width: imageProperties.width, height: imageProperties.height }}
          />
        </div>
      </el-main>
    );
  },
});


