import { filters, type T2DPipelineState, classRegistry } from 'fabric';

export const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uExposure;
  varying vec2 vTexCoord;
  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    color.rgb *= pow(2.0, uExposure);
    gl_FragColor = color;
  }
`;

type ExposureOwnProps = {
    exposure: number;
};

type TWebGLUniformLocationMap = Record<
    string,
    WebGLUniformLocation | null
>;

export class Exposure extends filters.BaseFilter<
    'Exposure',
    ExposureOwnProps
> {
    static type = 'Exposure';
    static defaults = { exposure: 0 };
    static uniformLocations = ['uExposure'];
    declare exposure: number;

    getFragmentSource() {
        return fragmentSource;
    }

    applyTo2d({ imageData: { data } }: T2DPipelineState) {
        const factor = Math.pow(2, this.exposure); // 保持与 WebGL 一致
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * factor); // R
            data[i + 1] = Math.min(255, data[i + 1] * factor); // G
            data[i + 2] = Math.min(255, data[i + 2] * factor); // B
        }
    }

    isNeutralState() {
        return this.exposure === 0;
    }

    /**
   * Send data from this filter to its shader program's uniforms.
   *
   * @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
   * @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
   */
    sendUniformData(
        gl: WebGLRenderingContext,
        uniformLocations: TWebGLUniformLocationMap,
    ) {
        gl.uniform1f(uniformLocations.uExposure, this.exposure);
    }
}

classRegistry.setClass(Exposure);