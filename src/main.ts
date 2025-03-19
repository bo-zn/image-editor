import { createApp } from 'vue';
import App from './App';
import router from './router';
// 引入 Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'; // 引入 Element Plus 样式
import './style.css'

const app = createApp(App);
app.use(router);
app.use(ElementPlus); // 使用 Element Plus
app.mount('#app');
