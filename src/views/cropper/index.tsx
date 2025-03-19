

import 'cropperjs';

export default defineComponent({
  setup() {
    return () => (
      <el-main class="h-full flex items-center justify-center ">
        <div class="w-[800px] h-[700px]">
          <cropper-canvas class="w-full h-full" >
            <cropper-image src="/src/assets/test.jpg" alt="Picture" rotatable skewable translatable></cropper-image>
            <cropper-shade hidden></cropper-shade>
            <cropper-handle action="select" plain></cropper-handle>
            <cropper-selection initial-coverage="0.5" movable resizable>
              <cropper-grid role="grid" covered></cropper-grid>
              <cropper-crosshair centered></cropper-crosshair>
              <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
              <cropper-handle action="n-resize"></cropper-handle>
              <cropper-handle action="e-resize"></cropper-handle>
              <cropper-handle action="s-resize"></cropper-handle>
              <cropper-handle action="w-resize"></cropper-handle>
              <cropper-handle action="ne-resize"></cropper-handle>
              <cropper-handle action="nw-resize"></cropper-handle>
              <cropper-handle action="se-resize"></cropper-handle>
              <cropper-handle action="sw-resize"></cropper-handle>
            </cropper-selection>
          </cropper-canvas>
        </div>
      </el-main>
    );
  }
});