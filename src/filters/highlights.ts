import { filters, classRegistry } from 'fabric'

const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uHighlights;
  varying vec2 vTexCoord;

  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // 计算灰度值
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // 计算高光阈值
    float threshold = gray * gray;
    
    // 将 -1 到 1 的范围映射到合适的增益范围
    float max_bright = 4.0;
    float bright = uHighlights * 0.5; // 将 -1,1 映射到 -0.5,0.5
    float mid = 1.0 + max_bright * bright;
    
    // 使用更柔和的阈值过渡
    float transition = smoothstep(0.3, 0.7, threshold);
    float midrate = mix(1.0, mid, transition);
    float brightrate = mix(0.0, abs(bright), transition);
    
    // 调整亮度计算
    vec3 adjusted;
    if (bright != 0.0) {
        adjusted = pow(color.rgb, vec3(1.0 / midrate));
        if (bright > 0.0) {
            adjusted *= (1.0 + brightrate);
        } else {
            adjusted *= (1.0 - brightrate);
        }
    } else {
        adjusted = color.rgb;
    }
    
    // 确保结果在有效范围内
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
