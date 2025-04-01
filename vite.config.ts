import { defineConfig } from 'vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import * as path from 'path'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vueJsx(),
    AutoImport({
      imports: ['vue'], // 自动导入 Vue 的 API
      dts: 'src/auto-imports.d.ts' // 生成的类型定义文件
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
