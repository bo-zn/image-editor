declare interface Window {
  WebGLImageFilter: {
    new (options: { canvas: HTMLCanvasElement }): WebGLImageFilterInstance
  }
  cv: any
}

interface WebGLImageFilterInstance {
  addFilter(filterName: string, value: number): void
  apply(image: HTMLImageElement): void
}
