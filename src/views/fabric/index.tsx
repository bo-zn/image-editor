import * as fabric from 'fabric'
import Cropper from '@/components/cropper'
import { debounce } from 'lodash'
import { Exposure, Highlights, Shadow } from '@/filters'

export default defineComponent({
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const cropperRef = ref(null)
    const fabricCanvas = ref<fabric.Canvas | null>(null)
    const imgInstanceRef = ref<fabric.Image | null>(null)
    const uploadedImageSrc = ref<string | null>(null)
    const showCropper = ref<boolean>(true)

    const sliderConfigs = [
      { label: '亮度', key: 'brightness' },
      { label: '对比度', key: 'contrast' },
      { label: '饱和度', key: 'saturation' },
      { label: '锐度/清晰度', key: 'sharpness' },
      { label: '曝光度', key: 'exposure' },
      { label: '高光', key: 'highlights' },
      { label: '阴影', key: 'shadows' },
      { label: '色温', key: 'temperature' },
      { label: '色调', key: 'tint' }
    ]

    const containerSize = {
      width: 600,
      height: 600
    }

    const imageProperties = reactive({
      width: 0,
      height: 0,
      left: 0,
      top: 0
    })

    const sliderValues = reactive({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0
    })

    onMounted(() => {
      initializeCanvas(new URL('@/assets/test.jpg', import.meta.url).href)
    })

    const initializeCanvas = (imageSrc: string) => {
      if (canvasRef.value) {
        fabricCanvas.value?.dispose()
        const imgElement = new Image()
        imgElement.src = imageSrc
        imgElement.onload = () => {
          const scale = Math.min(containerSize.width / imgElement.width, containerSize.height / imgElement.height)

          canvasRef.value!.width = imgElement.width * scale
          canvasRef.value!.height = imgElement.height * scale

          fabricCanvas.value = new fabric.Canvas(canvasRef.value)

          const imgInstance = new fabric.Image(imgElement, {
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            evented: false
          })

          imgInstanceRef.value = imgInstance
          imageProperties.width = imgElement.width * scale
          imageProperties.height = imgElement.height * scale
          imageProperties.left = imgInstance.left
          imageProperties.top = imgInstance.top
          fabricCanvas.value?.add(imgInstance)
          fabricCanvas.value?.renderAll()
        }
      }
    }

    const handleImageUpload = (file: File) => {
      const reader = new FileReader()
      reader.onload = e => {
        uploadedImageSrc.value = e.target?.result as string
        initializeCanvas(uploadedImageSrc.value)
      }
      reader.readAsDataURL(file)
    }

    // 假设 fabric.js 支持这些滤镜，或者你已经实现了自定义滤镜
    const applyFilter = (filterType: string, value: number, index: number) => {
      if (!imgInstanceRef.value) return
      try {
        let filter
        switch (filterType) {
          case 'Brightness':
            value = value / 100 / 2 // -0.5 到 0.5
            filter = new fabric.filters.Brightness({ brightness: value })
            break
          case 'Contrast':
            value = value / 100 / 4 // -0.25 到 0.25
            filter = new fabric.filters.Contrast({ contrast: value })
            break
          case 'Saturation':
            value = value / 100 // -1 到 1
            filter = new fabric.filters.Saturation({ saturation: value })
            break
          case 'Sharpness':
            value = value / 100 // -1 到 1
            // prettier-ignore
            const sharpenMatrix = [
              0, -1 * value, 0,
              -1 * value, 1 + 4 * value, -1 * value,
              0, -1 * value, 0
            ];
            filter = new fabric.filters.Convolute({ matrix: sharpenMatrix })
            break
          case 'Exposure':
            value = value / 100 // -1 到 1
            filter = new Exposure({ exposure: value })
            break
          case 'Highlights':
            value = value / 2 // -50 到 50
            filter = new Highlights({ highlights: value })
            break
          case 'Shadows':
            value = value / 100 // 先归一化到 -1 到 1
            value = value * 19.5 - 10.5 // 再映射到 -30 到 9
            filter = new Shadow({ shadow: value })
            break
          case 'Temperature':
            value = (value / 100) * 0.6 // -0.6 到 0.6
            // prettier-ignore
            filter = new fabric.filters.ColorMatrix({
              matrix: [
                1 + value, 0, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, 1 - value, 0, 0,
                0, 0, 0, 1, 0
              ]
            });
            break
          case 'Tint':
            value = (value / 100) * 0.8 // -0.8 到 0.8
            // prettier-ignore
            filter = new fabric.filters.ColorMatrix({
              matrix: [
                1, 0, 0, 0, 0,
                0, 1 + value, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 1, 0
              ]
            });
            break
          default:
            return
        }
        if (filter) {
          imgInstanceRef.value.filters[index] = filter
          imgInstanceRef.value.applyFilters()
          fabricCanvas.value?.renderAll()
        }
      } catch (error) {
        console.error(`Error applying ${filterType} filter:`, error)
      }
    }

    const filterTypes = [
      'Brightness',
      'Contrast',
      'Saturation',
      'Sharpness',
      'Exposure',
      'Highlights',
      'Shadows',
      'Temperature',
      'Tint'
    ]

    const applyFilterDebounced = debounce(applyFilter, 0)

    filterTypes.forEach((type, index) => {
      watch(
        () => sliderValues[type.toLowerCase()],
        newValue => applyFilterDebounced(type, newValue, index)
      )
    })

    const downloadImage = () => {
      if (!fabricCanvas.value) return
      let tempCanvas = document.createElement('canvas')
      let tempCtx = tempCanvas.getContext('2d')
      let top = 0
      let left = 0
      if (showCropper.value) {
        tempCanvas.width = fabricCanvas.value.width
        tempCanvas.height = fabricCanvas.value.height
      } else {
        if (!cropperRef.value?.exposePosi) return
        tempCanvas.width = cropperRef.value.exposePosi.w
        tempCanvas.height = cropperRef.value.exposePosi.h
        top = cropperRef.value.exposePosi.x
        left = cropperRef.value.exposePosi.y
      }
      if (tempCtx && imgInstanceRef.value) {
        const imgData = fabricCanvas.value.contextContainer.getImageData(top, left, tempCanvas.width, tempCanvas.height)
        tempCtx.putImageData(imgData, 0, 0)
        const dataURL = tempCanvas.toDataURL()
        const link = document.createElement('a')
        link.href = dataURL
        link.download = 'image.png'
        link.click()
      }
    }

    const resetAllProperties = () => {
      sliderValues.brightness = 0
      sliderValues.contrast = 0
      sliderValues.saturation = 0
      sliderValues.sharpness = 0
      sliderValues.exposure = 0
      sliderValues.highlights = 0
      sliderValues.shadows = 0
    }

    return () => (
      <el-main class="h-full flex items-center justify-center gap-20">
        <div class="w-[300px]">
          {showCropper.value ? (
            <el-button type="primary" onClick={() => (showCropper.value = false)}>
              剪裁
            </el-button>
          ) : (
            <el-button type="info" onClick={() => (showCropper.value = true)}>
              取消剪裁
            </el-button>
          )}
          <el-button type="warning" onClick={downloadImage}>
            下载
          </el-button>
          <el-button type="success" onClick={resetAllProperties}>
            重置
          </el-button>
          <div class="mt-4 mb-4">
            <el-upload
              accept="image/*"
              show-file-list={false}
              before-upload={file => {
                handleImageUpload(file)
                return false
              }}
            >
              <el-button type="danger">上传图片</el-button>
            </el-upload>
          </div>
          {sliderConfigs.map(({ label, key }) => (
            <div class="slider-demo-block" key={key}>
              <el-icon onClick={() => (sliderValues[key] = 0)} class="reset-icon mr-4 cursor-pointer">
                🔄
              </el-icon>
              <span class="demonstration">
                {label}：{sliderValues[key]}
              </span>
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
            size={{
              width: imageProperties.width,
              height: imageProperties.height
            }}
          />
        </div>
      </el-main>
    )
  }
})
