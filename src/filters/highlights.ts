import { filters, classRegistry } from 'fabric'

const fragmentSource = `
  precision highp float;
  varying vec2 vTexCoord;
  uniform sampler2D inputImageTexture;
  uniform float uHighlights;
  uniform float threshold;  // 对应OpenCV中的mean(thresh)

  void main() {
    vec4 src = texture2D(inputImageTexture, vTexCoord);
    
    // 计算灰度值（与OpenCV完全一致）
    float gray = dot(src.rgb, vec3(0.299, 0.587, 0.114));
    
    // 计算高光区域值（与OpenCV一致）
    float thresh = gray * gray;
    
    // 参数设置（与OpenCV一致）
    float max_factor = 4.0;
    float bright = uHighlights / 100.0 / max_factor;
    float mid = 1.0 + max_factor * bright;
    
    // 边缘平滑过渡（与OpenCV一致）
    float midrate, brightrate;
    if (thresh >= threshold) {
        midrate = mid;
        brightrate = bright;
    } else {
        midrate = (mid - 1.0) / threshold * thresh + 1.0;
        brightrate = (thresh / threshold) * bright;
    }
    
    // 高光提亮（与OpenCV完全一致）
    vec3 adjusted = pow(src.rgb, vec3(1.0 / midrate)) * (1.0 / (1.0 - brightrate));
    adjusted = clamp(adjusted, 0.0, 1.0);
    
    gl_FragColor = vec4(adjusted, src.a);
  }
`

type HighlightsOwnProps = {
  highlights: number
  threshold?: number
}

type TWebGLUniformLocationMap = Record<string, WebGLUniformLocation | null>

export class Highlights extends filters.BaseFilter<'Highlights', HighlightsOwnProps> {
  static type = 'Highlights'
  static defaults = {
    highlights: 0,
    threshold: 0.6
  }
  static uniformLocations = ['uHighlights', 'threshold']

  declare highlights: number
  declare threshold: number

  getFragmentSource() {
    return fragmentSource
  }

  isNeutralState() {
    return this.highlights === 0
  }

  sendUniformData(gl: WebGLRenderingContext, uniformLocations: TWebGLUniformLocationMap) {
    gl.uniform1f(uniformLocations.uHighlights, this.highlights)
    gl.uniform1f(uniformLocations.threshold, this.threshold)
  }
}

classRegistry.setClass(Highlights)
