export default defineComponent({
    setup() {
        const canvasRef = ref<HTMLCanvasElement | null>(null);
        const imageSrc = '/src/assets/test.jpg';

        onMounted(() => {
            const canvas = canvasRef.value;
            if (canvas) {
                const imgElement = new Image();
                imgElement.src = imageSrc;
                imgElement.onload = () => {
                    // 应用滤镜
                    const filter = new window.WebGLImageFilter({ canvas });
                    filter.addFilter('sharpen', -1);
                    filter.apply(imgElement);

                }
            }
        });

        return () => (
            <el-main class="h-full flex items-center justify-center">
                <canvas ref={canvasRef}></canvas>
            </el-main>
        );
    },
});