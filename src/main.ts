import { createApp } from 'vue';
import './style.css'
import App from './App'; // 确保路径以 .tsx 结尾
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const app = createApp(App);
app.use(ElementPlus);
app.mount('#app')

// 启用“allowImportingTsExtensions”时，导入路径只能以“.tsx”扩展名结尾。
