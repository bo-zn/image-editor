import { filters, type T2DPipelineState, classRegistry } from 'fabric'

const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uExposure;
  varying vec2 vTexCoord;
  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    color.rgb *= pow(2.0, uExposure);
    gl_FragColor = color;
  }
`

type ExposureOwnProps = {
  exposure: number
}

type TWebGLUniformLocationMap = Record<string, WebGLUniformLocation | null>

export class Exposure extends filters.BaseFilter<'Exposure', ExposureOwnProps> {
  static type = 'Exposure'
  static defaults = { exposure: 0 }
  static uniformLocations = ['uExposure']
  declare exposure: number

  getFragmentSource() {
    return fragmentSource
  }

  isNeutralState() {
    return this.exposure === 0
  }

  /**
   * 在Node环境下处理图像数据,在浏览器环境下使用WebGL处理图像数据
   * @param param0 包含imageData对象的参数，其中data是Uint8ClampedArray类型的数组
   *              每4个元素表示一个像素点的RGBA值：
   *              - data[i]: 红色通道 (R)
   *              - data[i+1]: 绿色通道 (G)
   *              - data[i+2]: 蓝色通道 (B)
   *              - data[i+3]: 透明度通道 (A)
   *
   * factor通过2的指数运算(2^exposure)来调整图像的曝光度：
   * - exposure > 0: 增加曝光度，使图像变亮
   * - exposure < 0: 降低曝光度，使图像变暗
   * - exposure = 0: 保持原始曝光度不变
   */
  applyTo2d({ imageData: { data } }: T2DPipelineState) {
    const factor = Math.pow(2, this.exposure)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor) // R
      data[i + 1] = Math.min(255, data[i + 1] * factor) // G
      data[i + 2] = Math.min(255, data[i + 2] * factor) // B
    }
  }

  /**
   * Send data from this filter to its shader program's uniforms.
   * 此函数是在浏览器环境下使用WebGL渲染时,将数据从当前滤镜传递到其着色器程序的uniform变量中,如果在node环境下会被applyTo2d函数替代.
   * @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
   * @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
   */
  sendUniformData(gl: WebGLRenderingContext, uniformLocations: TWebGLUniformLocationMap) {
    gl.uniform1f(uniformLocations.uExposure, this.exposure)
  }
}

classRegistry.setClass(Exposure)
