import { filters, classRegistry } from 'fabric';

const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uHighlights;
  varying vec2 vTexCoord;
  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    color.rgb *= pow(2.0, uHighlights);
    gl_FragColor = color;
  }
`;

type HighlightsOwnProps = {
    highlights: number;
};

type TWebGLUniformLocationMap = Record<
    string,
    WebGLUniformLocation | null
>;

export class Highlights extends filters.BaseFilter<
    'Highlights',
    HighlightsOwnProps
> {
    static type = 'Highlights';
    static defaults = {
        highlights: 1
    };
    static uniformLocations = ['uHighlights'];

    declare highlights: number;

    getFragmentSource() {
        return fragmentSource;
    }

    isNeutralState() {
        return this.highlights === 0;
    }

    sendUniformData(
        gl: WebGLRenderingContext,
        uniformLocations: TWebGLUniformLocationMap,
    ) {
        gl.uniform1f(uniformLocations.uHighlights, this.highlights);
    }
}

classRegistry.setClass(Highlights);