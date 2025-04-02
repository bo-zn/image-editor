import * as fabric from 'fabric'
import { debounce } from 'lodash'
import { Exposure, Highlights, Shadow } from '@/filters'

const testImage = new URL('@/assets/test.jpg', import.meta.url).href

export default defineComponent({
  setup() {
    const fabricCanvas = ref<fabric.Canvas | null>(null)
    const fabricInstanceRef = ref<fabric.Image | null>(null)
    const fabricCanvasRef = ref<HTMLCanvasElement | null>(null)
    const opencvCanvasRef = ref<HTMLCanvasElement | null>(null)

    const cv = window.cv

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
      initializeCanvas(testImage)
      initializeOpenCV(testImage)
    })

    const initializeCanvas = (imageSrc: string) => {
      if (fabricCanvasRef.value) {
        // 销毁现有的 fabric.Canvas 实例
        if (fabricCanvas.value) {
          fabricCanvas.value.dispose()
        }
        const imgElement = new Image()
        imgElement.src = imageSrc
        imgElement.onload = () => {
          const scale = Math.min(containerSize.width / imgElement.width, containerSize.height / imgElement.height)

          fabricCanvasRef.value!.width = imgElement.width * scale
          fabricCanvasRef.value!.height = imgElement.height * scale

          fabricCanvas.value = new fabric.Canvas(fabricCanvasRef.value)

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

          fabricInstanceRef.value = imgInstance
          fabricCanvas.value?.add(imgInstance)
          fabricCanvas.value?.renderAll()
        }
      }
    }

    const initializeOpenCV = (imageSrc: string) => {
      const imgElement = new Image()
      imgElement.src = imageSrc
      imgElement.onload = () => {
        const scale = Math.min(containerSize.width / imgElement.width, containerSize.height / imgElement.height)

        opencvCanvasRef.value!.width = imgElement.width * scale
        opencvCanvasRef.value!.height = imgElement.height * scale

        const src = cv.imread(imgElement)
        cv.imshow(opencvCanvasRef.value, src)
        src.delete()
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

    const applyFabricFilter = (filterType: string, value: number, index: number) => {
      if (!fabricInstanceRef.value) return
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
          fabricInstanceRef.value.filters[index] = filter
          fabricInstanceRef.value.applyFilters()
          fabricCanvas.value?.renderAll()
        }
      } catch (error) {
        console.error(`Error applying ${filterType} filter:`, error)
      }
    }
    const applyOpenCVFilter = (filterType: string, value: number) => {
      const imgElement = new Image()
      imgElement.src = testImage // 使用导入的图片URL
      imgElement.onload = () => {
        const src = cv.imread(imgElement)
        const dst = new cv.Mat()

        switch (filterType) {
          case 'Brightness':
            cv.convertScaleAbs(src, dst, 1, value) // 简单的亮度调整
            break
          case 'Contrast':
            cv.convertScaleAbs(src, dst, value, 0) // 简单的对比度调整
            break
          // 其他滤镜的OpenCV实现
          default:
            src.copyTo(dst)
            break
        }

        cv.imshow(opencvCanvasRef.value, dst)
        src.delete()
        dst.delete()
      }
    }

    const applyFabricFilterDebounced = debounce(applyFabricFilter, 0)
    const applyOpenCVFilterDebounced = debounce(applyOpenCVFilter, 0)

    filterTypes.forEach((type, index) => {
      watch(
        () => sliderValues[type.toLowerCase()],
        newValue => {
          applyFabricFilterDebounced(type, newValue, index)
          applyOpenCVFilterDebounced(type, newValue)
        }
      )
    })

    const resetAllProperties = () => {
      sliderValues.brightness = 0
      sliderValues.contrast = 0
      sliderValues.saturation = 0
      sliderValues.sharpness = 0
      sliderValues.exposure = 0
      sliderValues.highlights = 0
      sliderValues.shadows = 0
      sliderValues.temperature = 0
      sliderValues.tint = 0
      filterTypes.forEach((type, index) => {
        applyFabricFilter(type, 0, index)
      })
    }

    return () => (
      <el-main class="h-full flex items-center justify-center gap-20">
        <div class="w-[300px]">
          <el-button class="mb-4" type="success" onClick={resetAllProperties}>
            重置
          </el-button>
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
        <div class="flex gap-4">
          <canvas
            ref={fabricCanvasRef}
            style={`width: ${containerSize.width}px; height: ${containerSize.height}px;`}
          ></canvas>
          <canvas
            ref={opencvCanvasRef}
            style={`width: ${containerSize.width}px; height: ${containerSize.height}px;`}
          ></canvas>
        </div>
      </el-main>
    )
  }
})
