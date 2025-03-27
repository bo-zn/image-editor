import { filters, classRegistry } from 'fabric';

const fragmentSource = `
precision highp float;
uniform sampler2D uTexture;
uniform float uShadow; // 参数范围已映射为0-100（原始输入范围-1到1）
varying vec2 vTexCoord;

void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    
    // 精确灰度计算（BT.601标准，与OpenCV一致）
    float gray = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    
    // 阴影区域计算（原算法公式）
    float shadowValue = (1.0 - gray) * (1.0 - gray);
    
    // 参数计算（严格保留原始公式）
    const int maxFactor = 4;
    float bright = uShadow / 100.0 / float(maxFactor);
    float mid = 1.0 + float(maxFactor) * bright;
    
    // 应用调整公式（完全保留原始算法）
    vec3 adjusted = pow(color.rgb, vec3(1.0 / mid)) / (1.0 - bright);
    color.rgb = clamp(adjusted, 0.0, 1.0);
    
    gl_FragColor = color;
}
`;

type ShadowOwnProps = {
    shadow: number;
};

type TWebGLUniformLocationMap = Record<
    string,
    WebGLUniformLocation | null
>;

export class Shadow extends filters.BaseFilter<
    'Shadow',
    ShadowOwnProps
> {
    static type = 'Shadow';
    static defaults = {
        shadow: 1
    };
    static uniformLocations = ['uShadow'];

    declare shadow: number;

    getFragmentSource() {
        return fragmentSource;
    }

    isNeutralState() {
        return this.shadow === 0;
    }

    sendUniformData(
        gl: WebGLRenderingContext,
        uniformLocations: TWebGLUniformLocationMap,
    ) {
        gl.uniform1f(uniformLocations.uShadow, this.shadow * 100); // 将参数放大100倍匹配算法需求
    }
}

classRegistry.setClass(Shadow);