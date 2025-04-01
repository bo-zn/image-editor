import { filters, classRegistry } from 'fabric'

const fragmentSource = `
precision highp float;
uniform sampler2D uTexture;
uniform float uShadow;
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // 计算灰度值（与OpenCV保持一致）
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // 计算阴影区域值（与OpenCV一致）
    float shadowValue = (1.0 - gray) * (1.0 - gray);
    
    // 参数设置（保持与OpenCV一致）
    float max_factor = 4.0;
    float bright = uShadow / 100.0 / max_factor;
    float mid = 1.0 + max_factor * bright;
    
    // 使用平滑过渡（模拟OpenCV的边缘过渡效果）
    float threshold = 0.5; // 这个值可以通过uniform传入来模拟mean(thresh)
    float midrate, brightrate;
    
    if (shadowValue >= threshold) {
        midrate = mid;
        brightrate = bright;
    } else {
        // 实现平滑过渡
        midrate = (mid - 1.0) * (shadowValue / threshold) + 1.0;
        brightrate = (shadowValue / threshold) * bright;
    }
    
    // 应用阴影调整（与OpenCV保持一致）
    vec3 adjusted = pow(color.rgb, vec3(1.0 / midrate)) * (1.0 / (1.0 - brightrate));
    
    // 确保结果在有效范围内
    adjusted = clamp(adjusted, 0.0, 1.0);
    
    gl_FragColor = vec4(adjusted, color.a);
}
`

type ShadowOwnProps = {
  shadow: number
}

type TWebGLUniformLocationMap = Record<string, WebGLUniformLocation | null>

export class Shadow extends filters.BaseFilter<'Shadow', ShadowOwnProps> {
  static type = 'Shadow'
  static defaults = {
    shadow: 0
  }
  static uniformLocations = ['uShadow']

  declare shadow: number

  getFragmentSource() {
    return fragmentSource
  }

  isNeutralState() {
    return this.shadow === 0
  }

  sendUniformData(gl: WebGLRenderingContext, uniformLocations: TWebGLUniformLocationMap) {
    gl.uniform1f(uniformLocations.uShadow, this.shadow)
  }
}

classRegistry.setClass(Shadow)
