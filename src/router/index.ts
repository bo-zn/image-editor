import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/fabric' // 重定向到 /fabric
  },
  {
    path: '/fabric',
    component: () => import('@/views/fabric')
  },
  {
    path: '/cropper',
    component: () => import('@/views/cropper')
  },
  {
    path: '/webgl',
    component: () => import('@/views/webgl')
  },
  {
    path: '/fabric-vs-opencv',
    component: () => import('@/views/fabric-vs-opencv')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
