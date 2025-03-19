import { defineConfig } from 'vite';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vueJsx()],
});
