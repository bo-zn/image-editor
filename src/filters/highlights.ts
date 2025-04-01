import { filters, classRegistry } from 'fabric'

const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uHighlights;
  varying vec2 vTexCoord;

  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // 计算灰度值（与OpenCV一致）
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // 计算高光区域值
    float thresh = gray * gray;
    
    // 参数设置
    float max_factor = 4.0;
    float bright = uHighlights / 100.0 / max_factor;
    float mid = 1.0 + max_factor * bright;
    
    // 使用固定阈值（因为shader中无法计算整个图像的平均值）
    float threshold = 0.6;  // 这个值可以调整
    float midrate, brightrate;
    
    if (thresh >= threshold) {
        midrate = mid;
        brightrate = bright;
    } else {
        midrate = (mid - 1.0) / threshold * thresh + 1.0;  // 使用与OpenCV相同的公式
        brightrate = (thresh / threshold) * bright;  // 使用与OpenCV相同的公式
    }
    
    // 应用高光调整（与OpenCV完全一致）
    vec3 adjusted = pow(color.rgb, vec3(1.0 / midrate)) * (1.0 / (1.0 - brightrate));
    adjusted = clamp(adjusted, 0.0, 1.0);
    
    gl_FragColor = vec4(adjusted, color.a);
  }
`

type HighlightsOwnProps = {
  highlights: number
}

type TWebGLUniformLocationMap = Record<string, WebGLUniformLocation | null>

export class Highlights extends filters.BaseFilter<'Highlights', HighlightsOwnProps> {
  static type = 'Highlights'
  static defaults = {
    highlights: 0
  }
  static uniformLocations = ['uHighlights']

  declare highlights: number

  getFragmentSource() {
    return fragmentSource
  }

  isNeutralState() {
    return this.highlights === 0
  }

  sendUniformData(gl: WebGLRenderingContext, uniformLocations: TWebGLUniformLocationMap) {
    gl.uniform1f(uniformLocations.uHighlights, this.highlights)
  }
}

classRegistry.setClass(Highlights)
