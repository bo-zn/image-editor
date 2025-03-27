import { filters, classRegistry } from 'fabric';

const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uShadow;
  varying vec2 vTexCoord;
  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    color.rgb *= pow(2.0, uShadow);
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
        gl.uniform1f(uniformLocations.uShadow, this.shadow);
    }
}

classRegistry.setClass(Shadow);